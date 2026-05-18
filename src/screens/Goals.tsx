import { useEffect, useState } from "react";
import { useStore } from "../state/store";
import {
  listGoals,
  addGoal,
  deleteGoal,
  updateGoalSaved,
  type Goal,
} from "../db/repo";
import { formatXOF, parseXOF } from "../lib/money";
import { projectGoal } from "../lib/safeToSpend";
import { t } from "../i18n";

export function Goals() {
  const { snap, reload } = useStore();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [date, setDate] = useState("");

  async function refresh() {
    setGoals(await listGoals());
  }
  useEffect(() => {
    refresh();
  }, []);

  async function create() {
    if (!name || !target) return;
    await addGoal({
      name,
      target_amount: parseXOF(target),
      target_date: date ? new Date(date).getTime() : null,
      allocation: 100,
    });
    setName("");
    setTarget("");
    setDate("");
    await refresh();
    await reload();
  }

  async function topUp(g: Goal) {
    const v = prompt(`${g.name} — ${t("remaining")} ${formatXOF(
      g.target_amount - g.saved,
    )}`);
    if (v == null) return;
    await updateGoalSaved(g.id, g.saved + parseXOF(v));
    await refresh();
    await reload();
  }

  return (
    <div className="screen scroll">
      <h1>{t("goalsTitle")}</h1>

      {goals.map((g) => {
        const p = projectGoal({
          target: g.target_amount,
          saved: g.saved,
          perPeriodContribution: Math.round(
            ((snap?.settings.savings_commitment ?? 0) * g.allocation) / 100,
          ),
          from: new Date(),
          periodDays: snap?.periodDays ?? 30,
        });
        return (
          <div key={g.id} className="card">
            <div className="row">
              <strong>{g.name}</strong>
              <span>
                {formatXOF(g.saved)} / {formatXOF(g.target_amount)}
              </span>
            </div>
            <div className="bar">
              <div
                className="bar-fill"
                style={{ width: `${Math.round(p.progressRatio * 100)}%` }}
              />
            </div>
            <span className="muted small">
              {p.reached
                ? t("reached")
                : p.projectedDate
                  ? `${t("projected")} ${p.projectedDate.toLocaleDateString("fr-FR")}`
                  : t("noPace")}
            </span>
            <div className="actions">
              <button onClick={() => topUp(g)}>+ {t("save")}</button>
              <button
                className="link"
                onClick={async () => {
                  await deleteGoal(g.id);
                  await refresh();
                  await reload();
                }}
              >
                {t("delete")}
              </button>
            </div>
          </div>
        );
      })}

      <h2>{t("addGoal")}</h2>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder={t("obGoalName")}
      />
      <input
        inputMode="numeric"
        value={target}
        onChange={(e) => setTarget(e.target.value)}
        placeholder={t("obGoalTarget")}
      />
      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
      />
      <button className="primary" onClick={create}>
        {t("addGoal")}
      </button>
    </div>
  );
}
