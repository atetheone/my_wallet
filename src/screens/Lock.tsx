import { useState } from "react";
import { useStore } from "../state/store";
import { sha256 } from "../lib/hash";
import { t } from "../i18n";

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
        }, 700);
      }
    }
  }

  return (
    <div className="screen center">
      <h1>{t("lockTitle")}</h1>
      <p className="muted">{error ? t("lockWrong") : t("lockSubtitle")}</p>
      <div className={`pin-dots ${error ? "shake" : ""}`}>
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className={`dot ${i < pin.length ? "on" : ""}`} />
        ))}
      </div>
      <div className="keypad">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "⌫"].map(
          (k, i) =>
            k === "" ? (
              <span key={i} />
            ) : (
              <button
                key={i}
                className="key"
                onClick={() =>
                  k === "⌫"
                    ? setPin((p) => p.slice(0, -1))
                    : pin.length < 4 && submit(pin + k)
                }
              >
                {k}
              </button>
            ),
        )}
      </div>
    </div>
  );
}
