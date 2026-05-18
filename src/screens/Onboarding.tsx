import { useState } from "react";
import { useStore } from "../state/store";
import { updateSettings, addFixedCost, addGoal } from "../db/repo";
import { parseXOF } from "../lib/money";
import { navigate } from "../lib/router";
import { t } from "../i18n";
import { Icon } from "../ui/Icon";

/** One-time setup. Writes settings + optional first fixed cost + first goal. */
export function Onboarding() {
  const { reload } = useStore();
  const [income, setIncome] = useState("");
  const [salaryDay, setSalaryDay] = useState("1");
  const [savings, setSavings] = useState("");
  const [costLabel, setCostLabel] = useState("");
  const [costAmount, setCostAmount] = useState("");
  const [goalName, setGoalName] = useState("");
  const [goalTarget, setGoalTarget] = useState("");
  const [goalDate, setGoalDate] = useState("");
  const [busy, setBusy] = useState(false);

  async function finish() {
    setBusy(true);
    await updateSettings({
      fixed_income: parseXOF(income),
      salary_day: Math.min(Math.max(parseInt(salaryDay, 10) || 1, 1), 31),
      savings_commitment: parseXOF(savings),
      onboarded: 1,
    });
    if (costLabel && costAmount)
      await addFixedCost({
        label: costLabel,
        amount: parseXOF(costAmount),
        day_of_month: 1,
      });
    if (goalName && goalTarget)
      await addGoal({
        name: goalName,
        target_amount: parseXOF(goalTarget),
        target_date: goalDate ? new Date(goalDate).getTime() : null,
        allocation: 100,
      });
    await reload();
    navigate("home");
  }

  return (
    <div className="x-screen">
      <div
        className="x-body"
        style={{
          padding:
            "calc(28px + env(safe-area-inset-top,0px)) 22px 0",
        }}
      >
        <div
          className="x-display"
          style={{ fontSize: 34, fontWeight: 600, letterSpacing: "-0.04em" }}
        >
          {t("appName")}
        </div>
        <div
          className="x-display"
          style={{ fontSize: 26, fontWeight: 600, marginTop: 14, lineHeight: 1.1 }}
        >
          {t("obWelcome")}
        </div>
        <div
          style={{
            fontSize: 14,
            color: "var(--x-ink-2)",
            marginTop: 8,
            lineHeight: 1.45,
          }}
        >
          {t("obIntro")}
        </div>

        <div
          className="x-card"
          style={{
            marginTop: 22,
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          <div className="x-label">{t("obIncome")}</div>
          <input
            className="x-input x-num"
            inputMode="numeric"
            value={income}
            onChange={(e) => setIncome(e.target.value)}
            placeholder="350 000"
          />
          <div className="x-label">{t("obSalaryDay")}</div>
          <input
            className="x-input x-num"
            inputMode="numeric"
            value={salaryDay}
            onChange={(e) => setSalaryDay(e.target.value)}
          />
          <div className="x-label">{t("obSavings")}</div>
          <input
            className="x-input x-num"
            inputMode="numeric"
            value={savings}
            onChange={(e) => setSavings(e.target.value)}
            placeholder="50 000"
          />
        </div>

        <div
          className="x-display"
          style={{ fontSize: 18, fontWeight: 600, marginTop: 26 }}
        >
          {t("obFixedCosts")}
        </div>
        <div
          className="x-card"
          style={{
            marginTop: 12,
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <input
            className="x-input"
            value={costLabel}
            onChange={(e) => setCostLabel(e.target.value)}
            placeholder="Loyer"
          />
          <input
            className="x-input x-num"
            inputMode="numeric"
            value={costAmount}
            onChange={(e) => setCostAmount(e.target.value)}
            placeholder="75 000"
          />
        </div>

        <div
          className="x-display"
          style={{ fontSize: 18, fontWeight: 600, marginTop: 26 }}
        >
          {t("obFirstGoal")}
        </div>
        <div
          className="x-card"
          style={{
            marginTop: 12,
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <input
            className="x-input"
            value={goalName}
            onChange={(e) => setGoalName(e.target.value)}
            placeholder={t("obGoalName")}
          />
          <input
            className="x-input x-num"
            inputMode="numeric"
            value={goalTarget}
            onChange={(e) => setGoalTarget(e.target.value)}
            placeholder={t("obGoalTarget")}
          />
          <input
            className="x-input"
            type="date"
            value={goalDate}
            onChange={(e) => setGoalDate(e.target.value)}
          />
        </div>
        <div style={{ height: 16 }} />
      </div>

      <div
        style={{
          padding: "12px 22px calc(14px + env(safe-area-inset-bottom,0px))",
          background: "var(--x-cream)",
          borderTop: "1px solid var(--x-line)",
        }}
      >
        <button
          className="x-btn"
          style={{ width: "100%" }}
          disabled={busy}
          onClick={finish}
        >
          {t("obFinish")} <Icon name="arrow-right" size={18} />
        </button>
      </div>
    </div>
  );
}
