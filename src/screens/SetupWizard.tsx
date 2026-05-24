import { useState } from "react";
import { updateSettings, addFixedCost, addGoal, addExpense, addExtraIncome, getSettings } from "../db/repo";
import { parseXOF } from "../lib/money";
import { Icon } from "../ui/Icon";
import { t } from "../i18n";

interface Props {
  onClose: () => void;
  onComplete: () => Promise<void>;
}

interface CostRow {
  label: string;
  amount: string;
}

export function SetupWizard({ onClose, onComplete }: Props) {
  const [step, setStep] = useState(1);

  // step 1 — savings
  const [savings, setSavings] = useState("");

  // step 2 — fixed costs
  const [costs, setCosts] = useState<CostRow[]>([{ label: "", amount: "" }]);

  // step 3 — current balance (optional calibration)
  const [currentBalance, setCurrentBalance] = useState("");

  // step 4 — first goal (optional)
  const [goalName, setGoalName] = useState("");
  const [goalTarget, setGoalTarget] = useState("");
  const [goalDate, setGoalDate] = useState("");

  // step 5 — name (optional)
  const [userName, setUserName] = useState("");

  const [busy, setBusy] = useState(false);

  function addCostRow() {
    setCosts((c) => [...c, { label: "", amount: "" }]);
  }

  function removeCostRow(i: number) {
    setCosts((c) => c.filter((_, idx) => idx !== i));
  }

  function updateCost(i: number, field: keyof CostRow, val: string) {
    setCosts((c) => c.map((r, idx) => (idx === i ? { ...r, [field]: val } : r)));
  }

  async function finish() {
    setBusy(true);
    try {
      const savingsAmount = parseXOF(savings);
      const validCosts = costs.filter((c) => c.label && c.amount);
      const fixedCostsSum = validCosts.reduce((s, c) => s + parseXOF(c.amount), 0);

      await updateSettings({
        savings_commitment: savingsAmount,
        setup_complete: 1,
        name: userName.trim() || null,
      });
      for (const c of validCosts) {
        await addFixedCost({ label: c.label, amount: parseXOF(c.amount), day_of_month: 1 });
      }
      if (goalName && goalTarget) {
        await addGoal({
          name: goalName,
          target_amount: parseXOF(goalTarget),
          target_date: goalDate ? new Date(goalDate).getTime() : null,
          allocation: 100,
        });
      }

      // Opening balance calibration: if the user told us what they currently have,
      // record a single adjustment transaction so the formula matches reality.
      if (currentBalance.trim()) {
        const userHas = parseXOF(currentBalance);
        const settings = await getSettings();
        const formulaAmount = settings.fixed_income - savingsAmount - fixedCostsSum;
        const delta = formulaAmount - userHas; // positive = already spent before app
        const now = Date.now();
        if (delta > 0) {
          // They have LESS than the formula assumes — record pre-app spending
          await addExpense({
            date: now,
            amount: delta,
            category_id: null,
            method: "cash",
            note: t("calibrationExpenseNote"),
            receipt: null,
          });
        } else if (delta < 0) {
          // They have MORE than the formula assumes — record extra income
          await addExtraIncome(now, -delta, t("calibrationIncomeNote"));
        }
      }

      await onComplete();
    } finally {
      setBusy(false);
    }
  }

  const TITLES = [
    "",
    t("setupSavings"),
    t("setupFixedCosts"),
    t("setupCurrentBalance"),
    t("setupGoal"),
    t("setupName"),
  ];
  const TOTAL_STEPS = 5;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        display: "flex",
        flexDirection: "column",
        background: "var(--x-cream)",
      }}
    >
      {/* header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "calc(14px + env(safe-area-inset-top,0px)) 18px 12px",
          borderBottom: "1px solid var(--x-line)",
          background: "var(--x-paper)",
        }}
      >
        <button
          onClick={step === 1 ? onClose : () => setStep((s) => s - 1)}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "var(--x-ink)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minWidth: 44,
            minHeight: 44,
          }}
        >
          <Icon name="arrow-left" size={22} stroke={1.8} />
        </button>
        <div style={{ flex: 1 }}>
          <div className="x-eyebrow">{step} / {TOTAL_STEPS}</div>
          <div className="x-display" style={{ fontSize: 18, fontWeight: 600, marginTop: 2 }}>
            {TITLES[step]}
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "var(--x-ink-3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minWidth: 44,
            minHeight: 44,
          }}
          aria-label={t("cancel")}
        >
          <Icon name="close" size={20} stroke={1.8} />
        </button>
      </div>

      {/* body */}
      <div className="x-body" style={{ padding: "20px 18px" }}>

        {step === 1 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <p style={{ fontSize: 14, color: "var(--x-ink-2)", lineHeight: 1.5 }}>
              {t("setupSavingsHint")}
            </p>
            <div className="x-label">{t("obSavings")}</div>
            <input
              className="x-input x-num"
              inputMode="numeric"
              autoFocus
              value={savings}
              onChange={(e) => setSavings(e.target.value)}
              placeholder="50 000"
            />
          </div>
        )}

        {step === 2 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <p style={{ fontSize: 14, color: "var(--x-ink-2)", lineHeight: 1.5 }}>
              {t("setupFixedCostsHint")}
            </p>
            {costs.map((c, i) => (
              <div
                key={i}
                className="x-card"
                style={{ display: "flex", flexDirection: "column", gap: 10 }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <input
                    className="x-input"
                    style={{ flex: 1 }}
                    value={c.label}
                    onChange={(e) => updateCost(i, "label", e.target.value)}
                    placeholder={t("setupFixedCostPlaceholder")}
                  />
                  {costs.length > 1 && (
                    <button
                      onClick={() => removeCostRow(i)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "var(--x-clay)",
                        cursor: "pointer",
                        display: "flex",
                        padding: 6,
                      }}
                    >
                      <Icon name="trash" size={16} stroke={1.6} />
                    </button>
                  )}
                </div>
                <input
                  className="x-input x-num"
                  inputMode="numeric"
                  value={c.amount}
                  onChange={(e) => updateCost(i, "amount", e.target.value)}
                  placeholder="75 000"
                />
              </div>
            ))}
            <button
              className="x-btn x-btn-ghost"
              style={{ width: "100%" }}
              onClick={addCostRow}
            >
              <Icon name="plus" size={16} stroke={2} /> {t("obAddFixedCost")}
            </button>
          </div>
        )}

        {step === 3 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <p style={{ fontSize: 14, color: "var(--x-ink-2)", lineHeight: 1.5 }}>
              {t("setupCurrentBalanceDesc")}
            </p>
            <div className="x-label">{t("setupCurrentBalanceLabel")}</div>
            <input
              className="x-input x-num"
              inputMode="numeric"
              autoFocus
              value={currentBalance}
              onChange={(e) => setCurrentBalance(e.target.value)}
              placeholder="120 000"
            />
          </div>
        )}

        {step === 4 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <p style={{ fontSize: 14, color: "var(--x-ink-2)", lineHeight: 1.5 }}>
              {t("setupGoalHint")}
            </p>
            <div className="x-label">{t("obGoalName")}</div>
            <input
              className="x-input"
              value={goalName}
              onChange={(e) => setGoalName(e.target.value)}
              placeholder={t("goalHint")}
            />
            <div className="x-label">{t("obGoalTarget")}</div>
            <input
              className="x-input x-num"
              inputMode="numeric"
              value={goalTarget}
              onChange={(e) => setGoalTarget(e.target.value)}
              placeholder="200 000"
            />
            <div className="x-label">{t("obGoalDate")}</div>
            <input
              className="x-input"
              type="date"
              value={goalDate}
              onChange={(e) => setGoalDate(e.target.value)}
            />
          </div>
        )}

        {step === 5 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <p style={{ fontSize: 14, color: "var(--x-ink-2)", lineHeight: 1.5 }}>
              {t("setupNameHint")}
            </p>
            <div className="x-label">{t("setupName")}</div>
            <input
              className="x-input"
              autoFocus
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder={t("setupNamePlaceholder")}
            />
          </div>
        )}
      </div>

      {/* footer */}
      <div
        style={{
          padding: "12px 18px calc(16px + env(safe-area-inset-bottom,0px))",
          borderTop: "1px solid var(--x-line)",
          background: "var(--x-paper)",
          display: "flex",
          gap: 10,
        }}
      >
        {(step === 3 || step === 4) && (
          <button
            className="x-btn x-btn-ghost"
            style={{ flex: 1 }}
            onClick={() => setStep((s) => s + 1)}
          >
            {t("obSkip")}
          </button>
        )}
        {step < TOTAL_STEPS ? (
          <button
            className="x-btn"
            style={{ flex: 1 }}
            onClick={() => setStep((s) => s + 1)}
          >
            {t("obNext")} <Icon name="arrow-right" size={18} />
          </button>
        ) : (
          <button
            className="x-btn"
            style={{ flex: 1 }}
            disabled={busy}
            onClick={finish}
          >
            <Icon name="check" size={18} stroke={2.2} /> {t("setupFinish")}
          </button>
        )}
      </div>
    </div>
  );
}
