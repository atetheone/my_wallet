import { useState } from "react";
import { useStore } from "../state/store";
import { sha256 } from "../lib/hash";
import { t } from "../i18n";
import { Icon } from "../ui/Icon";

const SUBS: Record<string, string> = {
  "2": "ABC",
  "3": "DEF",
  "4": "GHI",
  "5": "JKL",
  "6": "MNO",
  "7": "PQRS",
  "8": "TUV",
  "9": "WXYZ",
};

/** PIN gate. Shown only when settings.pin_hash is set and app is locked. */
export function Lock() {
  const { snap, unlock } = useStore();
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);

  async function submit(next: string) {
    setPin(next);
    if (next.length === 4) {
      const hash = await sha256(next);
      if (hash === snap?.settings.pin_hash) unlock();
      else {
        setError(true);
        setTimeout(() => {
          setPin("");
          setError(false);
        }, 600);
      }
    }
  }

  const push = (d: string) => {
    if (pin.length < 4 && !error) submit(pin + d);
  };
  const back = () => setPin((p) => p.slice(0, -1));

  const keyStyle: React.CSSProperties = {
    width: 72,
    height: 72,
    borderRadius: 36,
    background: "transparent",
    border: "1.5px solid var(--x-line-2)",
    fontSize: 28,
    fontWeight: 500,
    color: "var(--x-ink)",
    fontFamily: "var(--x-font-display)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    lineHeight: 1,
  };
  const blankStyle: React.CSSProperties = {
    width: 72,
    height: 72,
    borderRadius: 36,
    border: "none",
    background: "transparent",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    color: "var(--x-ink-2)",
  };

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        padding: "calc(40px + env(safe-area-inset-top,0px)) 24px 28px",
        minHeight: "100vh",
      }}
    >
      <div style={{ textAlign: "center", marginTop: 30 }}>
        <div
          className="x-display"
          style={{ fontSize: 38, fontWeight: 600, letterSpacing: "-0.04em" }}
        >
          {t("appName")}
        </div>
        <div
          style={{
            fontSize: 12,
            color: "var(--x-ink-3)",
            fontWeight: 500,
            marginTop: 4,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
          }}
        >
          xa·a·lis · « argent »
        </div>
      </div>

      <div
        style={{
          textAlign: "center",
          marginTop: 36,
          color: error ? "var(--x-clay)" : "var(--x-ink-2)",
          fontSize: 15,
        }}
      >
        {error ? t("lockWrong") : t("lockSubtitle")}
      </div>

      <div
        className={error ? "x-shake" : ""}
        style={{
          display: "flex",
          justifyContent: "center",
          gap: 18,
          marginTop: 22,
        }}
      >
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={"x-pin-dot" + (pin.length > i ? " filled" : "")}
          />
        ))}
      </div>

      <div style={{ flex: 1 }} />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 16,
          justifyItems: "center",
          padding: "0 8px",
        }}
      >
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => (
          <button key={d} style={keyStyle} onClick={() => push(String(d))}>
            {d}
            {SUBS[String(d)] && (
              <span
                style={{
                  fontSize: 8,
                  fontWeight: 600,
                  letterSpacing: "0.12em",
                  marginTop: 4,
                  color: "var(--x-ink-3)",
                }}
              >
                {SUBS[String(d)]}
              </span>
            )}
          </button>
        ))}
        <span style={blankStyle} aria-hidden />
        <button style={keyStyle} onClick={() => push("0")}>
          0
        </button>
        <button style={blankStyle} onClick={back} aria-label={t("back")}>
          <Icon name="backspace" size={26} stroke={1.6} />
        </button>
      </div>

      <div
        style={{
          textAlign: "center",
          marginTop: 20,
          fontSize: 13,
          color: "var(--x-ink-3)",
        }}
      >
        {t("lockForgot")}
      </div>
    </div>
  );
}
