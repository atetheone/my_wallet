import { useState } from "react";
import { updateExtraIncome, deleteExtraIncome, type ExtraIncome } from "../db/repo";
import { fmtN } from "../ui/format";
import { Icon } from "../ui/Icon";
import { Modal } from "../ui/Modal";
import { t } from "../i18n";

interface Props {
  income: ExtraIncome;
  onClose: () => void;
  onSaved: () => Promise<void>;
}

function toDatetimeLocal(ms: number): string {
  const d = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function IncomeDetail({ income, onClose, onSaved }: Props) {
  const [amount, setAmount] = useState(income.amount);
  const [note, setNote] = useState(income.note ?? "");
  const [dateStr, setDateStr] = useState(toDatetimeLocal(income.date));
  const [busy, setBusy] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(false);

  function push(d: string) {
    setAmount((a) => Math.min(a * (d === "000" ? 1000 : 10) + Number(d), 9_999_999));
  }
  const del = () => setAmount((a) => Math.floor(a / 10));

  async function save() {
    setBusy(true);
    await updateExtraIncome(income.id, {
      amount,
      note: note || null,
      date: new Date(dateStr).getTime(),
    });
    await onSaved();
  }

  async function remove() {
    setBusy(true);
    await deleteExtraIncome(income.id);
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
            {t("incomeDetailTitle")}
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
              style={{ fontSize: 52, fontWeight: 600, lineHeight: 1, letterSpacing: "-0.03em", color: "var(--x-sage)" }}
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
            onClick={() => setPendingDelete(true)}
            aria-label={t("delete")}
          >
            <Icon name="trash" size={18} stroke={1.7} />
          </button>
          <button
            className="x-btn x-btn-sage"
            style={{ flex: 1 }}
            disabled={busy || amount <= 0}
            onClick={save}
          >
            <Icon name="check" size={18} stroke={2.2} /> {t("save")}
          </button>
        </div>
      </div>

      <Modal
        open={pendingDelete}
        title={t("deleteIncomeTitle")}
        subtitle={`${fmtN(income.amount)} FCFA`}
        confirmLabel={t("delete")}
        destructive
        onConfirm={remove}
        onClose={() => setPendingDelete(false)}
      />
    </div>
  );
}
