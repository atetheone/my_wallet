import { useEffect, useState } from "react";
import { useStore } from "../state/store";
import { addExpense, addExtraIncome, listCategories, type Category } from "../db/repo";
import { fmtN } from "../ui/format";
import { navigate } from "../lib/router";
import { catMeta } from "../ui/cats";
import { Icon } from "../ui/Icon";
import { t } from "../i18n";

/** Sub-5-second capture: amount pad first, then category + method. */
export function QuickAdd() {
  const { snap, reload } = useStore();
  const [mode, setMode] = useState<"expense" | "income">("expense");
  const [amount, setAmount] = useState(0);
  const [cats, setCats] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [method, setMethod] = useState<"cash" | "wave">("cash");
  const [note, setNote] = useState("");
  const [source, setSource] = useState("");
  const [busy, setBusy] = useState(false);
  const [showOverspend, setShowOverspend] = useState(false);

  useEffect(() => {
    listCategories().then((c) => {
      setCats(c);
      setCategoryId(c[0]?.id ?? null);
    });
  }, []);

  function push(d: string) {
    setAmount((a) => Math.min(a * (d === "000" ? 1000 : 10) + Number(d), 9_999_999));
  }
  const del = () => setAmount((a) => Math.floor(a / 10));

  function switchMode(m: "expense" | "income") {
    setMode(m);
    setAmount(0);
    setNote("");
    setSource("");
    setShowOverspend(false);
  }

  async function saveExpense() {
    if (amount <= 0) return;
    setBusy(true);
    await addExpense({
      date: Date.now(),
      amount,
      category_id: categoryId,
      method,
      note: note || null,
      receipt: null,
    });
    await reload();
    navigate("home");
  }

  async function saveIncome() {
    if (amount <= 0) return;
    setBusy(true);
    await addExtraIncome(Date.now(), amount, source || note || null);
    await reload();
    setAmount(0);
    setNote("");
    setSource("");
    setBusy(false);
  }

  function handleSave() {
    if (mode === "income") {
      saveIncome();
      return;
    }
    const safe = snap?.safe.safeToSpend ?? 0;
    if (amount > safe && safe > 0) {
      setShowOverspend(true);
    } else {
      saveExpense();
    }
  }

  const safeToSpend = snap?.safe.safeToSpend ?? 0;
  const remaining = safeToSpend - amount;
  // After receiving income, the future safe-to-spend increases by amount
  const futureBalance = safeToSpend + amount;

  const keyStyle: React.CSSProperties = {
    height: 56,
    background: "transparent",
    border: "none",
    fontFamily: "var(--x-font-display)",
    fontSize: 26,
    fontWeight: 500,
    color: "var(--x-ink)",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
  };

  return (
    <div className="x-screen">
      {/* header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "calc(14px + env(safe-area-inset-top,0px)) 18px 4px",
        }}
      >
        <button
          onClick={() => navigate("home")}
          aria-label={t("cancel")}
          style={{
            background: "transparent",
            border: "none",
            width: 44,
            height: 44,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: "var(--x-ink)",
          }}
        >
          <Icon name="close" size={22} stroke={1.8} />
        </button>

        {/* Expense / Income toggle */}
        <div
          style={{
            display: "flex",
            background: "var(--x-paper)",
            border: "1px solid var(--x-line)",
            borderRadius: 999,
            padding: 3,
          }}
        >
          {(["expense", "income"] as const).map((m) => {
            const sel = m === mode;
            return (
              <button
                key={m}
                onClick={() => switchMode(m)}
                style={{
                  padding: "7px 18px",
                  borderRadius: 999,
                  border: "none",
                  background: sel
                    ? m === "income"
                      ? "var(--x-sage)"
                      : "var(--x-ink)"
                    : "transparent",
                  color: sel ? (m === "income" ? "#fff" : "var(--x-paper)") : "var(--x-ink-3)",
                  fontFamily: "var(--x-font-body)",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                {m === "expense" ? t("toggleExpense") : t("toggleIncome")}
              </button>
            );
          })}
        </div>

        <div style={{ width: 36 }} />
      </div>

      {/* amount display */}
      <div style={{ textAlign: "center", padding: "24px 12px 8px" }}>
        <div className="x-eyebrow" style={{ letterSpacing: "0.16em" }}>
          {t("amount")}
        </div>
        <div
          className="x-num"
          style={{
            marginTop: 10,
            fontSize: 64,
            fontWeight: 600,
            lineHeight: 1,
            letterSpacing: "-0.03em",
          }}
        >
          {fmtN(amount)}
          <span
            style={{
              fontSize: 22,
              color: "var(--x-ink-3)",
              marginLeft: 8,
              fontWeight: 500,
            }}
          >
            FCFA
          </span>
        </div>
        {snap && (
          <div style={{ marginTop: 10, fontSize: 12, color: "var(--x-ink-3)" }}>
            {mode === "income" ? (
              <>
                Sera{" "}
                <span className="x-num" style={{ color: "var(--x-sage)", fontWeight: 600 }}>
                  {fmtN(futureBalance)}
                </span>{" "}
                FCFA {t("thisMonthShort")}
              </>
            ) : (
              <>
                {t("willRemain")}{" "}
                <span
                  className="x-num"
                  style={{
                    color: remaining < 0 ? "var(--x-clay)" : "var(--x-ink-2)",
                    fontWeight: 600,
                  }}
                >
                  {fmtN(remaining)}
                </span>{" "}
                FCFA {t("thisMonthShort")}
              </>
            )}
          </div>
        )}
      </div>

      {/* category chips — expense mode only */}
      {mode === "expense" && (
        <div style={{ padding: "12px 14px 0" }}>
          <div
            className="x-scroll"
            style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 6 }}
          >
            {cats.map((c) => {
              const m = catMeta(c.name);
              const sel = c.id === categoryId;
              return (
                <button
                  key={c.id}
                  onClick={() => setCategoryId(c.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "9px 14px 9px 10px",
                    borderRadius: 999,
                    background: sel ? m.fg : m.bg,
                    color: sel ? "#fff" : m.fg,
                    border: "none",
                    whiteSpace: "nowrap",
                    fontFamily: "var(--x-font-body)",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                    flexShrink: 0,
                    boxShadow: sel ? `0 4px 12px ${m.fg}55` : "none",
                    transition: "all 0.15s",
                  }}
                >
                  <span
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: "50%",
                      background: sel ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.5)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: sel ? "#fff" : m.fg,
                    }}
                  >
                    <Icon name={m.icon} size={14} stroke={1.8} />
                  </span>
                  {c.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* method toggle — expense mode only */}
      {mode === "expense" && (
        <div style={{ padding: "14px 18px 0" }}>
          <div
            style={{
              display: "flex",
              background: "var(--x-paper)",
              border: "1px solid var(--x-line)",
              borderRadius: 14,
              padding: 4,
            }}
          >
            {(
              [
                { id: "cash", label: t("cash"), icon: "cash" },
                { id: "wave", label: t("wave"), icon: "wave" },
              ] as const
            ).map((mth) => {
              const sel = mth.id === method;
              return (
                <button
                  key={mth.id}
                  onClick={() => setMethod(mth.id)}
                  style={{
                    flex: 1,
                    padding: "10px 12px",
                    background: sel ? "var(--x-ink)" : "transparent",
                    color: sel ? "var(--x-paper)" : "var(--x-ink-2)",
                    border: "none",
                    borderRadius: 11,
                    fontFamily: "var(--x-font-body)",
                    fontSize: 14,
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                >
                  <Icon name={mth.icon} size={16} stroke={1.8} />
                  {mth.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* source field — income mode only */}
      {mode === "income" && (
        <div style={{ padding: "14px 18px 0" }}>
          <div className="x-label" style={{ marginBottom: 8 }}>
            {t("incomeSource")}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              background: "var(--x-paper)",
              borderRadius: 14,
              border: "1px solid var(--x-line)",
              padding: "10px 14px",
              color: "var(--x-ink-3)",
            }}
          >
            <Icon name="income" size={16} stroke={1.6} />
            <input
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder={t("incomeSourcePlaceholder")}
              style={{
                flex: 1,
                border: "none",
                background: "transparent",
                color: "var(--x-ink)",
                fontSize: 14,
                outline: "none",
                fontFamily: "var(--x-font-body)",
              }}
            />
          </div>
        </div>
      )}

      {/* note field */}
      <div style={{ padding: "10px 18px 0" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            background: "var(--x-paper)",
            borderRadius: 14,
            border: "1px solid var(--x-line)",
            padding: "10px 14px",
            color: "var(--x-ink-3)",
          }}
        >
          <Icon name="edit" size={16} stroke={1.6} />
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={t("note")}
            style={{
              flex: 1,
              border: "none",
              background: "transparent",
              color: "var(--x-ink)",
              fontSize: 14,
              outline: "none",
              fontFamily: "var(--x-font-body)",
            }}
          />
        </div>
      </div>

      {/* numpad + save */}
      <div
        style={{
          marginTop: "auto",
          padding: "10px 14px calc(8px + env(safe-area-inset-bottom,0px))",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 4,
          }}
        >
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
            <button key={d} style={keyStyle} onClick={() => push(d)}>
              {d}
            </button>
          ))}
          <button style={keyStyle} onClick={() => push("000")}>
            000
          </button>
          <button style={keyStyle} onClick={() => push("0")}>
            0
          </button>
          <button style={keyStyle} onClick={del} aria-label="⌫">
            <Icon name="backspace" size={24} stroke={1.6} />
          </button>
        </div>
        <button
          className={`x-btn${mode === "income" ? " x-btn-sage" : ""}`}
          style={{ width: "100%", marginTop: 4, padding: 16 }}
          disabled={busy || amount <= 0}
          onClick={handleSave}
        >
          <Icon name="check" size={20} stroke={2.2} />
          {mode === "income" ? t("validateIncome") : t("validateExpense")}
        </button>
      </div>

      {/* overspend confirmation panel */}
      {showOverspend && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 40,
            display: "flex",
            alignItems: "flex-end",
            background: "rgba(26,22,17,0.42)",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowOverspend(false);
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 480,
              margin: "0 auto",
              background: "var(--x-paper)",
              borderRadius: "22px 22px 0 0",
              padding: "24px 22px calc(28px + env(safe-area-inset-bottom,0px))",
              display: "flex",
              flexDirection: "column",
              gap: 14,
            }}
          >
            <div className="x-display" style={{ fontSize: 18, fontWeight: 600 }}>
              {t("overspendTitle")}
            </div>
            <div style={{ fontSize: 14, color: "var(--x-ink-2)", lineHeight: 1.5 }}>
              {t("overspendBody").replace(
                "{n}",
                fmtN(amount - safeToSpend),
              )}
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                className="x-btn x-btn-ghost"
                style={{ flex: 1 }}
                onClick={() => setShowOverspend(false)}
              >
                {t("cancel")}
              </button>
              <button
                className="x-btn"
                style={{ flex: 1, background: "var(--x-clay)" }}
                onClick={() => {
                  setShowOverspend(false);
                  saveExpense();
                }}
              >
                {t("overspendConfirm")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
