import { useState } from "react";
import { useStore } from "../state/store";
import { updateSettings, addFixedCost, addGoal } from "../db/repo";
import { parseXOF } from "../lib/money";
import { navigate } from "../lib/router";
import { t } from "../i18n";

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
    <div className="screen scroll">
      <h1>{t("obWelcome")}</h1>
      <p className="muted">{t("obIntro")}</p>

      <label>{t("obIncome")}</label>
      <input
        inputMode="numeric"
        value={income}
        onChange={(e) => setIncome(e.target.value)}
        placeholder="300 000"
      />

      <label>{t("obSalaryDay")}</label>
      <input
        inputMode="numeric"
        value={salaryDay}
        onChange={(e) => setSalaryDay(e.target.value)}
      />

      <label>{t("obSavings")}</label>
      <input
        inputMode="numeric"
        value={savings}
        onChange={(e) => setSavings(e.target.value)}
        placeholder="50 000"
      />

      <h2>{t("obFixedCosts")}</h2>
      <input
        value={costLabel}
        onChange={(e) => setCostLabel(e.target.value)}
        placeholder="Loyer"
      />
      <input
        inputMode="numeric"
        value={costAmount}
        onChange={(e) => setCostAmount(e.target.value)}
        placeholder="100 000"
      />

      <h2>{t("obFirstGoal")}</h2>
      <input
        value={goalName}
        onChange={(e) => setGoalName(e.target.value)}
        placeholder={t("obGoalName")}
      />
      <input
        inputMode="numeric"
        value={goalTarget}
        onChange={(e) => setGoalTarget(e.target.value)}
        placeholder={t("obGoalTarget")}
      />
      <input
        type="date"
        value={goalDate}
        onChange={(e) => setGoalDate(e.target.value)}
      />

      <button className="primary" disabled={busy} onClick={finish}>
        {t("obFinish")}
      </button>
    </div>
  );
}
