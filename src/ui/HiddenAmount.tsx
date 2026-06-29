import { useState } from "react";
import { useStore } from "../state/store";
import { t } from "../i18n";
import { PinRevealModal } from "./PinRevealModal";

interface HiddenAmountProps {
  children: React.ReactNode;
  /** CSS styles applied to the visible (revealed) wrapper */
  style?: React.CSSProperties;
  /** CSS styles applied to the hidden placeholder button */
  hiddenStyle?: React.CSSProperties;
}

/**
 * Masks its children with •••••• FCFA when sensitiveVisible is false.
 * Tapping reveals via PIN modal (or immediately if no PIN is set).
 */
export function HiddenAmount({ children, style, hiddenStyle }: HiddenAmountProps) {
  const { sensitiveVisible, showSensitive, snap } = useStore();
  const [pinOpen, setPinOpen] = useState(false);

  if (sensitiveVisible) {
    return <span style={style}>{children}</span>;
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
          gap: 6,
          fontFamily: "inherit",
          ...hiddenStyle,
        }}
      >
        <span style={{ letterSpacing: "0.08em", opacity: 0.55 }}>••••••</span>
        <span style={{ fontSize: "0.55em", opacity: 0.55 }}>FCFA</span>
      </button>
      <PinRevealModal open={pinOpen} onClose={() => setPinOpen(false)} />
    </>
  );
}
