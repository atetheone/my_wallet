import { useEffect, useState } from "react";
import { useStore } from "../state/store";
import { sha256 } from "../lib/hash";
import { t } from "../i18n";
import { Icon } from "./Icon";

const SUBS: Record<string, string> = {
  "2": "ABC", "3": "DEF", "4": "GHI", "5": "JKL",
  "6": "MNO", "7": "PQRS", "8": "TUV", "9": "WXYZ",
};

export function PinRevealModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { snap, showSensitive } = useStore();
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!open) { setPin(""); setError(false); }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  async function submit(next: string) {
    setPin(next);
    if (next.length === 4) {
      const hash = await sha256(next);
      if (hash === snap?.settings.pin_hash) {
        showSensitive();
        onClose();
      } else {
        setError(true);
        setTimeout(() => { setPin(""); setError(false); }, 600);
      }
    }
  }

  const push = (d: string) => { if (pin.length < 4 && !error) submit(pin + d); };
  const back = () => setPin((p) => p.slice(0, -1));

  if (!open) return null;

  const keyStyle: React.CSSProperties = {
    width: 64, height: 64, borderRadius: 32,
    background: "transparent", border: "1.5px solid var(--x-line-2)",
    fontSize: 24, fontWeight: 500, color: "var(--x-ink)",
    fontFamily: "var(--x-font-display)",
    display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center",
    cursor: "pointer", lineHeight: 1,
  };
  const blankStyle: React.CSSProperties = {
    width: 64, height: 64, borderRadius: 32,
    border: "none", background: "transparent",
    display: "flex", alignItems: "center", justifyContent: "center",
    cursor: "pointer", color: "var(--x-ink-2)",
  };

  return (
    <div
      className="x-modal-backdrop"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-label={t("revealPin")}
    >
      <div className="x-modal" style={{ textAlign: "center" }}>
        <div className="x-display" style={{ fontSize: 18, fontWeight: 600 }}>
          {t("revealPin")}
        </div>
        <div style={{ fontSize: 13, color: error ? "var(--x-clay)" : "var(--x-ink-3)", marginTop: 6 }}>
          {error ? t("lockWrong") : t("lockSubtitle")}
        </div>

        <div
          className={error ? "x-shake" : ""}
          style={{ display: "flex", justifyContent: "center", gap: 16, marginTop: 18 }}
        >
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className={"x-pin-dot" + (pin.length > i ? " filled" : "")} />
          ))}
        </div>

        <div
          style={{
            display: "grid", gridTemplateColumns: "repeat(3, 1fr)",
            gap: 12, justifyItems: "center", marginTop: 24, padding: "0 8px",
          }}
        >
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => (
            <button key={d} style={keyStyle} onClick={() => push(String(d))}>
              {d}
              {SUBS[String(d)] && (
                <span style={{ fontSize: 7, fontWeight: 600, letterSpacing: "0.12em", marginTop: 3, color: "var(--x-ink-3)" }}>
                  {SUBS[String(d)]}
                </span>
              )}
            </button>
          ))}
          <span style={blankStyle} aria-hidden />
          <button style={keyStyle} onClick={() => push("0")}>0</button>
          <button style={blankStyle} onClick={back} aria-label={t("back")}>
            <Icon name="backspace" size={22} stroke={1.6} />
          </button>
        </div>

        <button
          className="x-btn x-btn-ghost"
          style={{ width: "100%", marginTop: 16 }}
          onClick={onClose}
        >
          {t("cancel")}
        </button>
      </div>
    </div>
  );
}
