import { useEffect, useRef, useState, type ReactNode } from "react";
import { useStore } from "../state/store";
import { updateSettings } from "../db/repo";
import { parseXOF } from "../lib/money";
import { fmtN } from "../ui/format";
import { sha256 } from "../lib/hash";
import { downloadBackup, importJSON, type Backup } from "../sync/backup";
import { syncConfigured, signInWithEmail, currentEmail } from "../sync/supabase";
import { sync } from "../sync/engine";
import { Icon, type IconName } from "../ui/Icon";
import { Modal } from "../ui/Modal";
import { t } from "../i18n";

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div style={{ marginTop: 18 }}>
      <div className="x-eyebrow" style={{ padding: "0 18px 8px" }}>
        {title}
      </div>
      <div
        style={{
          background: "var(--x-paper)",
          border: "1px solid var(--x-line)",
          borderRadius: 18,
          overflow: "hidden",
        }}
      >
        {children}
      </div>
    </div>
  );
}

function Row({
  icon,
  label,
  value,
  danger,
  last,
  onClick,
}: {
  icon: IconName;
  label: string;
  value?: string;
  danger?: boolean;
  last?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        width: "100%",
        padding: "13px 14px",
        background: "transparent",
        border: "none",
        cursor: "pointer",
        borderBottom: last ? "none" : "1px solid var(--x-line)",
        textAlign: "left",
        fontFamily: "var(--x-font-body)",
      }}
    >
      <span
        className="x-icon-circle"
        style={{
          width: 32,
          height: 32,
          borderRadius: 10,
          ...(danger
            ? { background: "rgba(200,75,49,0.12)", color: "var(--x-clay)" }
            : {}),
        }}
      >
        <Icon name={icon} size={16} stroke={1.7} />
      </span>
      <span
        style={{
          flex: 1,
          fontSize: 14,
          fontWeight: 500,
          color: danger ? "var(--x-clay)" : "var(--x-ink)",
        }}
      >
        {label}
      </span>
      {value && (
        <span style={{ fontSize: 13, color: "var(--x-ink-3)" }}>{value}</span>
      )}
      {!danger && (
        <Icon
          name="chevron-right"
          size={16}
          stroke={1.6}
          color="var(--x-ink-4)"
        />
      )}
    </button>
  );
}

export function Settings() {
  const { snap, reload } = useStore();
  const file = useRef<HTMLInputElement>(null);
  const [income, setIncome] = useState("");
  const [salaryDay, setSalaryDay] = useState("");
  const [savings, setSavings] = useState("");
  const [email, setEmail] = useState("");
  const [who, setWho] = useState<string | null>(null);
  const [msg, setMsg] = useState("");
  const [editing, setEditing] = useState(false);
  const [pinOpen, setPinOpen] = useState(false);
  const [pinVal, setPinVal] = useState("");

  useEffect(() => {
    if (snap) {
      setIncome(String(snap.settings.fixed_income));
      setSalaryDay(String(snap.settings.salary_day));
      setSavings(String(snap.settings.savings_commitment));
    }
    if (syncConfigured) currentEmail().then(setWho);
  }, [snap]);

  async function saveBudget() {
    await updateSettings({
      fixed_income: parseXOF(income),
      salary_day: Math.min(Math.max(parseInt(salaryDay, 10) || 1, 1), 31),
      savings_commitment: parseXOF(savings),
    });
    await reload();
    setEditing(false);
    setMsg(t("saved"));
  }

  async function onImport(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const data = JSON.parse(await f.text()) as Backup;
    await importJSON(data);
    await reload();
    setMsg(t("imported"));
  }

  function setPin() {
    setPinVal("");
    setPinOpen(true);
  }

  async function confirmPin() {
    if (!pinVal) return;
    await updateSettings({ pin_hash: await sha256(pinVal) });
    setPinOpen(false);
    await reload();
    setMsg(t("saved"));
  }

  const synced = syncConfigured && who;

  return (
    <div className="x-screen">
      <div
        style={{
          padding: "calc(14px + env(safe-area-inset-top,0px)) 22px 4px",
        }}
      >
        <div className="x-screen-title">{t("settings")}</div>
      </div>

      <div className="x-body" style={{ padding: "6px 14px 20px" }}>
        {/* cloud sync card */}
        <div
          className="x-card"
          style={{
            padding: "16px 18px",
            display: "flex",
            alignItems: "center",
            gap: 14,
          }}
        >
          <div
            className="x-icon-circle"
            style={{
              width: 44,
              height: 44,
              borderRadius: 14,
              background: synced
                ? "rgba(92,127,60,0.16)"
                : "var(--x-cream-2)",
              color: synced ? "var(--x-sage)" : "var(--x-ink-3)",
            }}
          >
            <Icon name={synced ? "cloud-check" : "cloud"} size={22} stroke={1.7} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 600 }}>
              {synced
                ? t("synced")
                : syncConfigured
                  ? t("notSignedIn")
                  : t("syncOff")}
            </div>
            <div
              style={{
                fontSize: 12,
                color: "var(--x-ink-3)",
                marginTop: 2,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {synced ? who : t("syncOffHint")}
            </div>
          </div>
          {synced && (
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                padding: "4px 8px",
                background: "rgba(92,127,60,0.16)",
                color: "var(--x-sage)",
                borderRadius: 999,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
              }}
            >
              {t("online")}
            </div>
          )}
        </div>

        {/* account */}
        <div style={{ marginTop: 18 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0 18px 8px",
            }}
          >
            <span className="x-eyebrow">{t("accountGroup")}</span>
            <button
              onClick={() => setEditing((v) => !v)}
              style={{
                background: "none",
                border: "none",
                fontSize: 12,
                fontWeight: 600,
                color: "var(--x-saffron-deep)",
                cursor: "pointer",
              }}
            >
              {editing ? t("cancel") : t("edit")}
            </button>
          </div>
          <div
            style={{
              background: "var(--x-paper)",
              border: "1px solid var(--x-line)",
              borderRadius: 18,
              overflow: "hidden",
            }}
          >
            {!editing ? (
              <>
                <Row
                  icon="mail"
                  label={t("obIncome")}
                  value={`${fmtN(snap?.settings.fixed_income ?? 0)} FCFA`}
                  onClick={() => setEditing(true)}
                />
                <Row
                  icon="calendar"
                  label={t("obSalaryDay")}
                  value={`${t("dayOf")} ${snap?.settings.salary_day ?? 1}`}
                  onClick={() => setEditing(true)}
                />
                <Row
                  icon="sparkle"
                  label={t("obSavings")}
                  value={`${fmtN(snap?.settings.savings_commitment ?? 0)} FCFA`}
                  last
                  onClick={() => setEditing(true)}
                />
              </>
            ) : (
              <div
                style={{
                  padding: 16,
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                }}
              >
                <div className="x-label">{t("obIncome")}</div>
                <input
                  className="x-input x-num"
                  inputMode="numeric"
                  value={income}
                  onChange={(e) => setIncome(e.target.value)}
                />
                <div className="x-label">{t("obSalaryDay")}</div>
                <input
                  className="x-input x-num"
                  inputMode="numeric"
                  value={salaryDay}
                  onChange={(e) => setSalaryDay(e.target.value)}
                />
                <div className="x-label">{t("obSavings")}</div>
                <input
                  className="x-input x-num"
                  inputMode="numeric"
                  value={savings}
                  onChange={(e) => setSavings(e.target.value)}
                />
                <button
                  className="x-btn"
                  style={{ width: "100%" }}
                  onClick={saveBudget}
                >
                  {t("save")}
                </button>
              </div>
            )}
          </div>
        </div>

        <Group title={t("securityGroup")}>
          <Row icon="lock" label={t("setPin")} onClick={setPin} />
          <Row
            icon="shield"
            label={t("removePin")}
            last
            onClick={async () => {
              await updateSettings({ pin_hash: null });
              await reload();
              setMsg(t("saved"));
            }}
          />
        </Group>

        <Group title={t("dataGroup")}>
          <Row
            icon="export"
            label={t("exportData")}
            onClick={() => downloadBackup()}
          />
          <Row
            icon="import"
            label={t("importData")}
            last
            onClick={() => file.current?.click()}
          />
        </Group>

        {syncConfigured && (
          <Group title={t("cloudGroup")}>
            {!who ? (
              <div
                style={{
                  padding: 16,
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                }}
              >
                <input
                  className="x-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email"
                />
                <button
                  className="x-btn x-btn-ghost"
                  style={{ width: "100%" }}
                  onClick={async () => {
                    await signInWithEmail(email);
                    setMsg(t("linkSent"));
                  }}
                >
                  <Icon name="mail" size={18} stroke={1.8} /> {t("signIn")}
                </button>
              </div>
            ) : (
              <Row
                icon="cloud-check"
                label={t("syncNow")}
                last
                onClick={async () => {
                  try {
                    const r = await sync();
                    setMsg(`↑${r.pushed} ↓${r.pulled}`);
                    await reload();
                  } catch (err) {
                    setMsg(err instanceof Error ? err.message : "Erreur");
                  }
                }}
              />
            )}
          </Group>
        )}

        <input
          ref={file}
          type="file"
          accept="application/json"
          hidden
          onChange={onImport}
        />

        {msg && (
          <div
            style={{
              textAlign: "center",
              padding: "16px 20px 0",
              fontSize: 13,
              color: "var(--x-sage)",
              fontWeight: 600,
            }}
          >
            {msg}
          </div>
        )}

        <div
          style={{
            textAlign: "center",
            padding: "24px 20px 0",
            fontSize: 11,
            color: "var(--x-ink-4)",
          }}
        >
          {t("appName")} · {t("versionLine")}
        </div>
      </div>

      <Modal
        open={pinOpen}
        title={t("pinTitle")}
        confirmLabel={t("confirm")}
        confirmDisabled={!pinVal}
        onConfirm={confirmPin}
        onClose={() => setPinOpen(false)}
      >
        <input
          className="x-input x-num"
          type="password"
          inputMode="numeric"
          autoComplete="off"
          placeholder="••••"
          value={pinVal}
          onChange={(e) => setPinVal(e.target.value.replace(/[^\d]/g, ""))}
        />
      </Modal>
    </div>
  );
}
