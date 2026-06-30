import { useState } from "react";
import { useStore } from "../state/store";
import { t } from "../i18n";
import { Icon } from "./Icon";
import { PinRevealModal } from "./PinRevealModal";

interface HiddenAmountProps {
  children: React.ReactNode;
  /** CSS styles applied to the visible (revealed) wrapper */
  style?: React.CSSProperties;
  /** CSS styles applied to the hidden placeholder button (color drives dot/icon color) */
  hiddenStyle?: React.CSSProperties;
  /** Diameter in px of each masking dot */
  dotSize?: number;
  /** Number of masking dots */
  dotCount?: number;
}

/**
 * Masks its children with dots + an eye icon when sensitiveVisible is false.
 * Tapping reveals via PIN modal (or immediately if no PIN is set).
 */
export function HiddenAmount({
  children,
  style,
  hiddenStyle,
  dotSize = 8,
  dotCount = 8,
}: HiddenAmountProps) {
  const { sensitiveVisible, showSensitive, hideSensitive, snap } = useStore();
  const [pinOpen, setPinOpen] = useState(false);

  if (sensitiveVisible) {
    return (
      <button
        onClick={hideSensitive}
        title={t("tapToHide")}
        style={{
          background: "none",
          border: "none",
          padding: 0,
          margin: 0,
          cursor: "pointer",
          font: "inherit",
          color: "inherit",
          textAlign: "inherit",
          ...style,
        }}
      >
        {children}
      </button>
    );
  }

  function handleTap() {
    if (!snap?.settings.pin_hash) {
      showSensitive();
    } else {
      setPinOpen(true);
    }
  }

  return (
    <>
      <button
        onClick={handleTap}
        title={t("tapToReveal")}
        style={{
          background: "none",
          border: "none",
          padding: 0,
          margin: 0,
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
          gap: 10,
          fontFamily: "inherit",
          color: "inherit",
          ...hiddenStyle,
        }}
      >
        <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
          {Array.from({ length: dotCount }).map((_, i) => (
            <span
              key={i}
              style={{
                width: dotSize,
                height: dotSize,
                borderRadius: "50%",
                background: "currentColor",
                display: "inline-block",
                flexShrink: 0,
              }}
            />
          ))}
        </span>
        <Icon name="eye" size={Math.round(dotSize * 2.2)} stroke={1.7} color="currentColor" />
      </button>
      <PinRevealModal open={pinOpen} onClose={() => setPinOpen(false)} />
    </>
  );
}
