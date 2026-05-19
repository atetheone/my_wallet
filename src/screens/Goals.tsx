import { useEffect, useRef, useState } from "react";
import { useStore } from "../state/store";
import {
  listGoals,
  addGoal,
  deleteGoal,
  updateGoalSaved,
  type Goal,
} from "../db/repo";
import { formatXOF, parseXOF } from "../lib/money";
import { fmtN } from "../ui/format";
import { Icon } from "../ui/Icon";
import { Modal } from "../ui/Modal";
import { t } from "../i18n";

export function Goals() {
  const { snap, reload } = useStore();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [date, setDate] = useState("");
  const [topUpFor, setTopUpFor] = useState<Goal | null>(null);
  const [topUpVal, setTopUpVal] = useState("");
  const [deleteFor, setDeleteFor] = useState<Goal | null>(null);
  const formRef = useRef<HTMLDivElement>(null);

  const commitment = snap?.settings.savings_commitment ?? 0;

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

  function topUp(g: Goal) {
    setTopUpVal("");
    setTopUpFor(g);
  }

  async function confirmTopUp() {
    if (!topUpFor) return;
    await updateGoalSaved(topUpFor.id, topUpFor.saved + parseXOF(topUpVal));
    setTopUpFor(null);
    await refresh();
    await reload();
  }

  async function confirmDelete() {
    if (!deleteFor) return;
    await deleteGoal(deleteFor.id);
    setDeleteFor(null);
    await refresh();
    await reload();
  }

  const totalCible = goals.reduce((s, g) => s + g.target_amount, 0);
  const totalDeja = goals.reduce((s, g) => s + g.saved, 0);
  const pctTotal = totalCible > 0 ? Math.round((totalDeja / totalCible) * 100) : 0;

  function pace(g: Goal) {
    const remaining = Math.max(0, g.target_amount - g.saved);
    const perPeriod = Math.round((commitment * g.allocation) / 100);
    let monthsLeft = 0;
    if (g.target_date) {
      const now = new Date();
      const d = new Date(g.target_date);
      monthsLeft =
        (d.getFullYear() - now.getFullYear()) * 12 +
        (d.getMonth() - now.getMonth());
      monthsLeft = Math.max(1, monthsLeft);
    }
    const required = monthsLeft
      ? Math.ceil(remaining / monthsLeft / 100) * 100
      : perPeriod;
    const reached = remaining === 0;
    const onTrack = reached || (perPeriod > 0 && perPeriod >= required);
    return { required, onTrack, reached };
  }

  return (
    <div className="x-screen">
      <div
        style={{
          padding: "calc(14px + env(safe-area-inset-top,0px)) 22px 4px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div>
          <div className="x-eyebrow">{t("myGoals")}</div>
          <div className="x-screen-title" style={{ marginTop: 4 }}>
            {t("savingsWord")}
          </div>
        </div>
        <button
          onClick={() =>
            formRef.current?.scrollIntoView({ behavior: "smooth" })
          }
          aria-label={t("addGoal")}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            background: "var(--x-ink)",
            color: "var(--x-paper)",
            border: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }}
        >
          <Icon name="plus" size={20} stroke={2.2} />
        </button>
      </div>

      {goals.length > 0 && (
        <div style={{ padding: "6px 14px" }}>
          <div
            className="x-card"
            style={{
              background:
                "linear-gradient(135deg, var(--x-saffron) 0%, #D87A1B 100%)",
              border: "none",
              color: "var(--x-ink)",
              padding: "18px 20px",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <svg
              style={{
                position: "absolute",
                bottom: -30,
                right: -30,
                opacity: 0.18,
              }}
              width="140"
              height="140"
              viewBox="0 0 100 100"
            >
              <path d="M50 10 L90 50 L50 90 L10 50 Z" fill="var(--x-ink)" />
              <circle cx="50" cy="50" r="20" fill="var(--x-cream)" />
            </svg>
            <div
              style={{
                fontSize: 11,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                fontWeight: 700,
              }}
            >
              {t("totalSavings")} · {goals.length}{" "}
              {goals.length > 1 ? t("goalsLower") : t("goalLower")}
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
                style={{ fontSize: 36, fontWeight: 600, lineHeight: 1 }}
              >
                {fmtN(totalDeja)}
              </span>
              <span style={{ fontSize: 14, fontWeight: 500, opacity: 0.7 }}>
                / {fmtN(totalCible)} FCFA
              </span>
            </div>
            <div
              className="x-bar"
              style={{
                marginTop: 14,
                height: 6,
                background: "rgba(26,22,17,0.18)",
              }}
            >
              <i style={{ background: "var(--x-ink)", width: `${pctTotal}%` }} />
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: 8,
                fontSize: 11,
                fontWeight: 600,
              }}
            >
              <span>
                {pctTotal}% {t("reachedLower")}
              </span>
              <span>
                {t("monthlySavings")}{" "}
                <span className="x-num">{fmtN(commitment)}</span>
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="x-body" style={{ padding: "4px 14px 20px" }}>
        {goals.length > 0 && (
          <div
            className="x-display"
            style={{
              fontSize: 16,
              fontWeight: 600,
              marginTop: 14,
              padding: "0 4px",
            }}
          >
            {t("inProgress")}
          </div>
        )}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
            marginTop: 10,
          }}
        >
          {goals.map((g) => {
            const pct =
              g.target_amount > 0
                ? Math.min(100, Math.round((g.saved / g.target_amount) * 100))
                : 0;
            const { required, onTrack } = pace(g);
            const due = g.target_date
              ? new Date(g.target_date).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })
              : "—";
            return (
              <div key={g.id} className="x-card" style={{ padding: "16px 18px" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 12,
                  }}
                >
                  <div
                    className="x-icon-circle"
                    style={{ width: 44, height: 44, borderRadius: 14 }}
                  >
                    <Icon name="goals" size={20} stroke={1.7} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 600 }}>
                      {g.name}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: "var(--x-ink-3)",
                        marginTop: 2,
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      <Icon name="calendar" size={11} stroke={1.8} /> {due}
                    </div>
                  </div>
                  <button
                    onClick={() => setDeleteFor(g)}
                    aria-label={t("delete")}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "var(--x-ink-4)",
                      cursor: "pointer",
                      padding: 4,
                      display: "flex",
                    }}
                  >
                    <Icon name="trash" size={16} stroke={1.6} />
                  </button>
                </div>

                <div className="x-bar" style={{ marginTop: 14, height: 8 }}>
                  <i
                    style={{
                      background: onTrack
                        ? "var(--x-sage)"
                        : "var(--x-clay)",
                      width: `${pct}%`,
                    }}
                  />
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginTop: 8,
                    fontSize: 12,
                  }}
                >
                  <span
                    className="x-num"
                    style={{ color: "var(--x-ink-2)", fontWeight: 600 }}
                  >
                    {fmtN(g.saved)} FCFA
                  </span>
                  <span style={{ color: "var(--x-ink-3)" }}>
                    {t("targetLower")}{" "}
                    <span className="x-num" style={{ color: "var(--x-ink-2)" }}>
                      {fmtN(g.target_amount)}
                    </span>
                  </span>
                </div>

                <button
                  onClick={() => topUp(g)}
                  style={{
                    marginTop: 14,
                    padding: "10px 12px",
                    background: "var(--x-cream)",
                    borderRadius: 12,
                    border: "none",
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 10,
                    cursor: "pointer",
                    fontFamily: "var(--x-font-body)",
                    textAlign: "left",
                  }}
                >
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      minWidth: 0,
                    }}
                  >
                    <span
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: 11,
                        flexShrink: 0,
                        background: onTrack
                          ? "rgba(92,127,60,0.2)"
                          : "rgba(200,75,49,0.2)",
                        color: onTrack ? "var(--x-sage)" : "var(--x-clay)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {onTrack ? (
                        <Icon name="check" size={12} stroke={2.4} />
                      ) : (
                        <span
                          style={{
                            fontSize: 14,
                            lineHeight: 1,
                            fontWeight: 700,
                          }}
                        >
                          !
                        </span>
                      )}
                    </span>
                    <span style={{ minWidth: 0 }}>
                      <span
                        style={{
                          display: "block",
                          fontSize: 12,
                          fontWeight: 600,
                          color: onTrack
                            ? "var(--x-sage)"
                            : "var(--x-clay)",
                        }}
                      >
                        {onTrack ? t("onTrack") : t("paceShort")}
                      </span>
                      <span
                        style={{
                          display: "block",
                          fontSize: 10,
                          color: "var(--x-ink-3)",
                        }}
                      >
                        {t("paceRequired")} ·{" "}
                        <span className="x-num">{fmtN(required)}</span>{" "}
                        {t("perMonth")}
                      </span>
                    </span>
                  </span>
                  <Icon
                    name="chevron-right"
                    size={16}
                    stroke={1.6}
                    color="var(--x-ink-4)"
                  />
                </button>
              </div>
            );
          })}
        </div>

        <div
          ref={formRef}
          className="x-card"
          style={{
            marginTop: 16,
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <div
            style={{ display: "flex", alignItems: "center", gap: 10 }}
          >
            <span
              className="x-icon-circle"
              style={{ width: 32, height: 32, borderRadius: 10 }}
            >
              <Icon name="sparkle" size={16} stroke={1.7} />
            </span>
            <div>
              <div className="x-display" style={{ fontSize: 16, fontWeight: 600 }}>
                {t("addGoal")}
              </div>
              <div style={{ fontSize: 11, color: "var(--x-ink-3)" }}>
                {t("goalHint")}
              </div>
            </div>
          </div>
          <input
            className="x-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("obGoalName")}
          />
          <input
            className="x-input x-num"
            inputMode="numeric"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            placeholder={t("obGoalTarget")}
          />
          <input
            className="x-input"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <button className="x-btn" style={{ width: "100%" }} onClick={create}>
            <Icon name="plus" size={18} stroke={2} /> {t("addGoal")}
          </button>
        </div>
      </div>

      <Modal
        open={topUpFor != null}
        title={t("topUpTitle")}
        subtitle={
          topUpFor
            ? `${topUpFor.name} — ${t("remaining")} ${formatXOF(
                topUpFor.target_amount - topUpFor.saved,
              )}`
            : undefined
        }
        confirmLabel={t("confirm")}
        confirmDisabled={parseXOF(topUpVal) <= 0}
        onConfirm={confirmTopUp}
        onClose={() => setTopUpFor(null)}
      >
        <input
          className="x-input x-num"
          inputMode="numeric"
          autoComplete="off"
          placeholder="0 FCFA"
          value={
            topUpVal
              ? `${formatXOF(parseXOF(topUpVal), { suffix: false })} FCFA`
              : ""
          }
          onChange={(e) => setTopUpVal(e.target.value.replace(/[^\d]/g, ""))}
        />
      </Modal>

      <Modal
        open={deleteFor != null}
        title={t("deleteGoalTitle")}
        subtitle={deleteFor?.name}
        confirmLabel={t("delete")}
        destructive
        onConfirm={confirmDelete}
        onClose={() => setDeleteFor(null)}
      />
    </div>
  );
}
