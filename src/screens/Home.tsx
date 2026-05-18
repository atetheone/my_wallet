import { useStore } from "../state/store";
import { formatXOF } from "../lib/money";
import { projectGoal } from "../lib/safeToSpend";
import { navigate } from "../lib/router";
import { t } from "../i18n";

/** The one screen that matters: safe-to-spend + goal progress. */
export function Home() {
  const { snap } = useStore();
  if (!snap) return null;
  const { safe, goals, periodDays } = snap;
  const neg = safe.safeToSpend < 0;

  return (
    <div className="screen scroll">
      <div className={`hero ${neg ? "danger" : ""}`}>
        <span className="hero-label">{t("safeToSpend")}</span>
        <span className="hero-amount">{formatXOF(safe.safeToSpend)}</span>
        <span className="hero-sub">
          {formatXOF(safe.dailyAllowance)} {t("perDay")}
        </span>
        {safe.overcommitted && (
          <span className="warn">{t("overcommitted")}</span>
        )}
      </div>

      <button className="primary big" onClick={() => navigate("add")}>
        + {t("addExpense")}
      </button>

      <h2>{t("goalsTitle")}</h2>
      {goals.length === 0 && <p className="muted">—</p>}
      {goals.map((g) => {
        const p = projectGoal({
          target: g.target_amount,
          saved: g.saved,
          perPeriodContribution: Math.round(
            (snap.settings.savings_commitment * g.allocation) / 100,
          ),
          from: new Date(),
          periodDays,
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
          </div>
        );
      })}
    </div>
  );
}
