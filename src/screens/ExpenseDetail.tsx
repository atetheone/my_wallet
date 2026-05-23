import { useEffect, useState } from "react";
import { updateExpense, deleteExpense, listCategories, type Expense, type Category } from "../db/repo";
import { fmtN } from "../ui/format";
import { catMeta } from "../ui/cats";
import { Icon } from "../ui/Icon";
import { t } from "../i18n";

interface Props {
  expense: Expense;
  catName: Record<string, string>;
  onClose: () => void;
  onSaved: () => Promise<void>;
}

function toDatetimeLocal(ms: number): string {
  const d = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function ExpenseDetail({ expense, onClose, onSaved }: Props) {
  const [amount, setAmount] = useState(expense.amount);
  const [categoryId, setCategoryId] = useState<string | null>(expense.category_id);
  const [method, setMethod] = useState<"cash" | "wave">(expense.method);
  const [note, setNote] = useState(expense.note ?? "");
  const [dateStr, setDateStr] = useState(toDatetimeLocal(expense.date));
  const [cats, setCats] = useState<Category[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    listCategories().then(setCats);
  }, []);

  function push(d: string) {
    setAmount((a) => Math.min(a * (d === "000" ? 1000 : 10) + Number(d), 9_999_999));
  }
  const del = () => setAmount((a) => Math.floor(a / 10));

  async function save() {
    setBusy(true);
    await updateExpense(expense.id, {
      amount,
      category_id: categoryId,
      method,
      note: note || null,
      date: new Date(dateStr).getTime(),
    });
    await onSaved();
  }

  async function remove() {
    setBusy(true);
    await deleteExpense(expense.id);
    await onSaved();
  }

  const keyStyle: React.CSSProperties = {
    height: 48,
    background: "transparent",
    border: "none",
    fontFamily: "var(--x-font-display)",
    fontSize: 22,
    fontWeight: 500,
    color: "var(--x-ink)",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 40,
        display: "flex",
        alignItems: "flex-end",
        background: "rgba(26,22,17,0.42)",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 480,
          margin: "0 auto",
          background: "var(--x-paper)",
          borderRadius: "22px 22px 0 0",
          maxHeight: "92dvh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 18px 10px",
            borderBottom: "1px solid var(--x-line)",
          }}
        >
          <div className="x-display" style={{ fontSize: 17, fontWeight: 600 }}>
            {t("expenseDetailTitle")}
          </div>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--x-ink)", display: "flex" }}
          >
            <Icon name="close" size={20} stroke={1.8} />
          </button>
        </div>

        <div style={{ overflowY: "auto", flex: 1 }}>
          {/* amount */}
          <div style={{ textAlign: "center", padding: "16px 12px 4px" }}>
            <div
              className="x-num"
              style={{ fontSize: 52, fontWeight: 600, lineHeight: 1, letterSpacing: "-0.03em" }}
            >
              {fmtN(amount)}
              <span style={{ fontSize: 18, color: "var(--x-ink-3)", marginLeft: 6, fontWeight: 500 }}>FCFA</span>
            </div>
          </div>

          {/* date */}
          <div style={{ padding: "8px 18px 0" }}>
            <div className="x-label" style={{ marginBottom: 6 }}>{t("expenseDetailDate")}</div>
            <input
              className="x-input"
              type="datetime-local"
              value={dateStr}
              onChange={(e) => setDateStr(e.target.value)}
            />
          </div>

          {/* categories */}
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
                      gap: 6,
                      padding: "7px 12px 7px 8px",
                      borderRadius: 999,
                      background: sel ? m.fg : m.bg,
                      color: sel ? "#fff" : m.fg,
                      border: "none",
                      whiteSpace: "nowrap",
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                      flexShrink: 0,
                    }}
                  >
                    <Icon name={m.icon} size={13} stroke={1.8} />
                    {c.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* method */}
          <div style={{ padding: "10px 18px 0" }}>
            <div
              style={{
                display: "flex",
                background: "var(--x-cream)",
                border: "1px solid var(--x-line)",
                borderRadius: 12,
                padding: 3,
              }}
            >
              {(["cash", "wave"] as const).map((mth) => {
                const sel = mth === method;
                return (
                  <button
                    key={mth}
                    onClick={() => setMethod(mth)}
                    style={{
                      flex: 1,
                      padding: "8px 10px",
                      background: sel ? "var(--x-ink)" : "transparent",
                      color: sel ? "var(--x-paper)" : "var(--x-ink-2)",
                      border: "none",
                      borderRadius: 10,
                      fontSize: 13,
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                      cursor: "pointer",
                    }}
                  >
                    <Icon name={mth} size={14} stroke={1.8} />
                    {mth === "wave" ? t("wave") : t("cash")}
                  </button>
                );
              })}
            </div>
          </div>

          {/* note */}
          <div style={{ padding: "10px 18px 0" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                background: "var(--x-cream)",
                borderRadius: 12,
                border: "1px solid var(--x-line)",
                padding: "9px 14px",
              }}
            >
              <Icon name="edit" size={15} stroke={1.6} color="var(--x-ink-3)" />
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

          {/* numpad */}
          <div style={{ padding: "8px 14px 4px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 2 }}>
              {["1","2","3","4","5","6","7","8","9"].map((d) => (
                <button key={d} style={keyStyle} onClick={() => push(d)}>{d}</button>
              ))}
              <button style={keyStyle} onClick={() => push("000")}>000</button>
              <button style={keyStyle} onClick={() => push("0")}>0</button>
              <button style={keyStyle} onClick={del} aria-label="⌫">
                <Icon name="backspace" size={20} stroke={1.6} />
              </button>
            </div>
          </div>
        </div>

        {/* footer */}
        <div
          style={{
            padding: "10px 18px calc(16px + env(safe-area-inset-bottom,0px))",
            borderTop: "1px solid var(--x-line)",
            display: "flex",
            gap: 10,
          }}
        >
          <button
            className="x-btn"
            style={{ flex: 0, padding: "13px 18px", background: "var(--x-clay)" }}
            disabled={busy}
            onClick={remove}
            aria-label={t("delete")}
          >
            <Icon name="trash" size={18} stroke={1.7} />
          </button>
          <button
            className="x-btn"
            style={{ flex: 1 }}
            disabled={busy || amount <= 0}
            onClick={save}
          >
            <Icon name="check" size={18} stroke={2.2} /> {t("save")}
          </button>
        </div>
      </div>
    </div>
  );
}
