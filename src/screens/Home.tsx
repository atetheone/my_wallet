import { useStore } from "../state/store";
import { formatXOF } from "../lib/money";
import { fmtN } from "../ui/format";
import { projectGoal } from "../lib/safeToSpend";
import { navigate } from "../lib/router";
import { catMeta } from "../ui/cats";
import { Icon } from "../ui/Icon";
import { t } from "../i18n";

/** The one screen that matters: safe-to-spend + goal progress. */
export function Home() {
  const { snap } = useStore();
  if (!snap) return null;
  const { safe, goals, periodDays, spent, budget, daysRemaining } = snap;
  const neg = safe.safeToSpend < 0;
  const spentPct =
    budget > 0 ? Math.min(100, Math.max(0, (spent / budget) * 100)) : 0;
  const breakdown = snap.breakdown.filter((b) => b.total > 0);
  const breakdownTotal = breakdown.reduce((s, b) => s + b.total, 0);
  const initial = "A";

  return (
    <div className="x-screen">
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding:
            "calc(18px + env(safe-area-inset-top,0px)) 22px 4px",
        }}
      >
        <div>
          <div
            style={{ fontSize: 13, color: "var(--x-ink-3)", fontWeight: 500 }}
          >
            {t("greeting")}
          </div>
          <div
            className="x-display"
            style={{
              fontSize: 20,
              fontWeight: 600,
              marginTop: 2,
              textTransform: "capitalize",
            }}
          >
            {snap.monthLabel}
          </div>
        </div>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            background: "var(--x-saffron)",
            color: "var(--x-ink)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "var(--x-font-display)",
            fontWeight: 600,
            fontSize: 16,
            border: "1.5px solid var(--x-ink)",
          }}
        >
          {initial}
        </div>
      </div>

      <div className="x-body" style={{ padding: "8px 14px 24px" }}>
        {/* hero card */}
        <div
          style={{
            background: "var(--x-ink)",
            color: "var(--x-paper)",
            borderRadius: 26,
            padding: "20px 22px 24px",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <svg
            style={{ position: "absolute", top: -40, right: -40, opacity: 0.25 }}
            width="180"
            height="180"
            viewBox="0 0 180 180"
          >
            <circle cx="120" cy="60" r="80" fill="none" stroke="var(--x-saffron)" strokeWidth="1.3" />
            <circle cx="120" cy="60" r="60" fill="none" stroke="var(--x-saffron)" strokeWidth="1.3" />
            <circle cx="120" cy="60" r="40" fill="none" stroke="var(--x-saffron)" strokeWidth="1.3" />
          </svg>

          <div
            className="x-eyebrow"
            style={{
              fontSize: 12,
              letterSpacing: "0.16em",
              color: "var(--x-ink-4)",
            }}
          >
            {t("safeToSpend")}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: 6,
              marginTop: 8,
            }}
          >
            <span
              className="x-num x-display"
              style={{
                fontSize: 54,
                fontWeight: 600,
                lineHeight: 1,
                color: neg ? "var(--x-clay)" : "var(--x-paper)",
              }}
            >
              {fmtN(safe.safeToSpend)}
            </span>
            <span
              style={{ fontSize: 16, fontWeight: 500, color: "var(--x-ink-4)" }}
            >
              FCFA
            </span>
          </div>

          <div
            style={{
              marginTop: 18,
              display: "flex",
              alignItems: "center",
              gap: 10,
              color: "var(--x-ink-4)",
            }}
          >
            <div style={{ flex: 1, height: 1, background: "var(--x-ink-3)", opacity: 0.4 }} />
            <span className="x-eyebrow" style={{ color: "inherit" }}>
              {t("perDay")}
            </span>
            <div style={{ flex: 1, height: 1, background: "var(--x-ink-3)", opacity: 0.4 }} />
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "space-between",
              marginTop: 12,
            }}
          >
            <div>
              <div
                className="x-num"
                style={{
                  fontSize: 28,
                  fontWeight: 600,
                  color: neg ? "var(--x-clay)" : "var(--x-saffron)",
                }}
              >
                {fmtN(safe.dailyAllowance)}{" "}
                <span style={{ fontSize: 14, color: "var(--x-ink-4)" }}>FCFA</span>
              </div>
              <div style={{ fontSize: 12, color: "var(--x-ink-4)", marginTop: 3 }}>
                {t("until")} {snap.periodEndLabel} · {daysRemaining}{" "}
                {t("daysShort")}
              </div>
            </div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                padding: "5px 10px",
                background: neg
                  ? "rgba(200,75,49,0.25)"
                  : "rgba(92,127,60,0.25)",
                color: neg ? "#E79A8B" : "#A0C77A",
                borderRadius: 999,
                letterSpacing: "0.02em",
              }}
            >
              {neg ? t("overBudget") : t("inTheGreen")}
            </div>
          </div>

          <div style={{ marginTop: 16 }}>
            <div className="x-bar" style={{ background: "rgba(255,255,255,0.1)" }}>
              <i style={{ background: "var(--x-saffron)", width: `${spentPct}%` }} />
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: 8,
                fontSize: 11,
                color: "var(--x-ink-4)",
              }}
            >
              <span>
                {t("spent")}{" "}
                <span className="x-num" style={{ color: "var(--x-paper)" }}>
                  {fmtN(spent)}
                </span>
              </span>
              <span>
                {t("budget")}{" "}
                <span className="x-num" style={{ color: "var(--x-paper)" }}>
                  {fmtN(Math.max(0, budget))}
                </span>
              </span>
            </div>
          </div>
        </div>

        {safe.overcommitted && (
          <div
            style={{
              marginTop: 12,
              padding: "12px 16px",
              borderRadius: 14,
              background: "rgba(200,75,49,0.12)",
              color: "var(--x-clay)",
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            {t("overcommitted")}
          </div>
        )}

        <button
          className="x-btn x-btn-saffron"
          style={{ width: "100%", marginTop: 14, padding: "18px 22px" }}
          onClick={() => navigate("add")}
        >
          <Icon name="plus" size={20} stroke={2} /> {t("addExpense")}
        </button>

        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            marginTop: 28,
            padding: "0 4px",
          }}
        >
          <div className="x-display" style={{ fontSize: 18, fontWeight: 600 }}>
            {t("goalsTitle")}
          </div>
          <button
            onClick={() => navigate("goals")}
            style={{
              background: "none",
              border: "none",
              fontSize: 12,
              color: "var(--x-ink-3)",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            {t("seeAll")}
          </button>
        </div>

        {goals.length === 0 && (
          <p style={{ color: "var(--x-ink-3)", padding: "10px 4px", fontSize: 14 }}>
            {t("noGoals")}
          </p>
        )}

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
            marginTop: 12,
          }}
        >
          {goals.slice(0, 2).map((g) => {
            const p = projectGoal({
              target: g.target_amount,
              saved: g.saved,
              perPeriodContribution: Math.round(
                (snap.settings.savings_commitment * g.allocation) / 100,
              ),
              from: new Date(),
              periodDays,
            });
            const pct = Math.round(p.progressRatio * 100);
            const due = g.target_date
              ? new Date(g.target_date).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })
              : p.reached
                ? t("reached")
                : p.projectedDate
                  ? p.projectedDate.toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })
                  : t("noPace");
            return (
              <div key={g.id} className="x-card" style={{ padding: "16px 18px" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    gap: 12,
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 8 }}
                    >
                      <span
                        className="x-icon-circle"
                        style={{ width: 26, height: 26, borderRadius: 8 }}
                      >
                        <Icon name="goals" size={15} stroke={1.7} />
                      </span>
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: 600,
                          color: "var(--x-ink)",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {g.name}
                      </div>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "baseline",
                        gap: 4,
                        marginTop: 8,
                      }}
                    >
                      <span className="x-num" style={{ fontSize: 19, fontWeight: 600 }}>
                        {fmtN(g.saved)}
                      </span>
                      <span style={{ fontSize: 12, color: "var(--x-ink-3)" }}>
                        / {fmtN(g.target_amount)} FCFA
                      </span>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div
                      className="x-num"
                      style={{
                        fontSize: 18,
                        fontWeight: 700,
                        color: "var(--x-saffron-deep)",
                      }}
                    >
                      {pct}%
                    </div>
                    <div
                      style={{
                        fontSize: 10,
                        color: "var(--x-ink-3)",
                        marginTop: 2,
                      }}
                    >
                      {due}
                    </div>
                  </div>
                </div>
                <div className="x-bar" style={{ marginTop: 14, height: 6 }}>
                  <i style={{ background: "var(--x-saffron)", width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>

        {breakdown.length > 0 && (
          <div style={{ marginTop: 24, padding: "0 4px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                justifyContent: "space-between",
              }}
            >
              <div className="x-display" style={{ fontSize: 18, fontWeight: 600 }}>
                {t("thisMonth")}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: "var(--x-ink-3)",
                  fontWeight: 500,
                }}
              >
                {formatXOF(spent)}
              </div>
            </div>
            <div
              style={{
                display: "flex",
                height: 8,
                marginTop: 12,
                borderRadius: 999,
                overflow: "hidden",
                gap: 2,
              }}
            >
              {breakdown.map((b) => (
                <div
                  key={b.category_id ?? b.name}
                  style={{
                    flexBasis: `${(b.total / breakdownTotal) * 100}%`,
                    background: catMeta(b.name).fg,
                  }}
                />
              ))}
            </div>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 6,
                marginTop: 12,
              }}
            >
              {breakdown.slice(0, 4).map((b) => {
                const m = catMeta(b.name);
                return (
                  <div
                    key={b.category_id ?? b.name}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "5px 9px 5px 6px",
                      borderRadius: 999,
                      background: m.bg,
                      color: m.fg,
                      fontSize: 11,
                      fontWeight: 600,
                    }}
                  >
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: 3,
                        background: m.fg,
                      }}
                    />
                    {b.name}
                    <span className="x-num">{fmtN(b.total)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
