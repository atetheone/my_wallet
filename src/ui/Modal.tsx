/**
 * In-app modal — the styled replacement for native prompt()/confirm(), which
 * break PWA immersion on Android and can't render FCFA-formatted input.
 * Presentational only: state lives in the calling screen.
 */

import { useEffect, useRef } from "react";
import { t } from "../i18n";

interface ModalProps {
  open: boolean;
  title: string;
  subtitle?: string;
  /** Form body (e.g. an input). Omit for a plain confirm dialog. */
  children?: React.ReactNode;
  confirmLabel: string;
  onConfirm: () => void;
  onClose: () => void;
  /** Clay confirm button for irreversible actions (delete). */
  destructive?: boolean;
  confirmDisabled?: boolean;
}

export function Modal({
  open,
  title,
  subtitle,
  children,
  confirmLabel,
  onConfirm,
  onClose,
  destructive,
  confirmDisabled,
}: ModalProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);

  // Esc closes; focus the first input (or the confirm button) on open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const first = cardRef.current?.querySelector<HTMLElement>(
      "input, textarea, select",
    );
    (first ?? confirmRef.current)?.focus();
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="x-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="x-modal" ref={cardRef}>
        <div>
          <div className="x-display" style={{ fontSize: 18, fontWeight: 600 }}>
            {title}
          </div>
          {subtitle && (
            <div
              style={{
                fontSize: 13,
                color: "var(--x-ink-3)",
                marginTop: 4,
              }}
            >
              {subtitle}
            </div>
          )}
        </div>

        {children}

        <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
          <button
            className="x-btn x-btn-ghost"
            style={{ flex: 1, padding: "13px 18px", fontSize: 15 }}
            onClick={onClose}
          >
            {t("cancel")}
          </button>
          <button
            ref={confirmRef}
            className="x-btn"
            style={{
              flex: 1,
              padding: "13px 18px",
              fontSize: 15,
              ...(destructive
                ? { background: "var(--x-clay)", color: "var(--x-paper)" }
                : {}),
            }}
            disabled={confirmDisabled}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
