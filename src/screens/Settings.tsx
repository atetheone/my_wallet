import { useEffect, useRef, useState } from "react";
import { useStore } from "../state/store";
import { updateSettings } from "../db/repo";
import { parseXOF } from "../lib/money";
import { sha256 } from "../lib/hash";
import { downloadBackup, importJSON, type Backup } from "../sync/backup";
import { syncConfigured, signInWithEmail, currentEmail } from "../sync/supabase";
import { sync } from "../sync/engine";
import { t } from "../i18n";

export function Settings() {
  const { snap, reload } = useStore();
  const file = useRef<HTMLInputElement>(null);
  const [income, setIncome] = useState("");
  const [salaryDay, setSalaryDay] = useState("");
  const [savings, setSavings] = useState("");
  const [email, setEmail] = useState("");
  const [who, setWho] = useState<string | null>(null);
  const [msg, setMsg] = useState("");

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
    setMsg("OK");
  }

  async function onImport(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const data = JSON.parse(await f.text()) as Backup;
    await importJSON(data);
    await reload();
    setMsg("Importé");
  }

  async function setPin() {
    const p = prompt(t("setPin"));
    if (!p) return;
    await updateSettings({ pin_hash: await sha256(p) });
    await reload();
    setMsg("OK");
  }

  return (
    <div className="screen scroll">
      <h1>{t("settings")}</h1>

      <label>{t("obIncome")}</label>
      <input
        inputMode="numeric"
        value={income}
        onChange={(e) => setIncome(e.target.value)}
      />
      <label>{t("obSalaryDay")}</label>
      <input
        inputMode="numeric"
        value={salaryDay}
        onChange={(e) => setSalaryDay(e.target.value)}
      />
      <label>{t("obSavings")}</label>
      <input
        inputMode="numeric"
        value={savings}
        onChange={(e) => setSavings(e.target.value)}
      />
      <button className="primary" onClick={saveBudget}>
        {t("save")}
      </button>

      <h2>{t("setPin")}</h2>
      <div className="actions">
        <button onClick={setPin}>{t("setPin")}</button>
        <button
          className="link"
          onClick={async () => {
            await updateSettings({ pin_hash: null });
            await reload();
          }}
        >
          {t("removePin")}
        </button>
      </div>

      <h2>{t("exportData")}</h2>
      <div className="actions">
        <button onClick={downloadBackup}>{t("exportData")}</button>
        <button onClick={() => file.current?.click()}>{t("importData")}</button>
        <input
          ref={file}
          type="file"
          accept="application/json"
          hidden
          onChange={onImport}
        />
      </div>

      <h2>{t("sync")}</h2>
      {!syncConfigured && <p className="muted">Sync non configurée</p>}
      {syncConfigured && (
        <>
          {who ? (
            <p className="muted">
              {t("signedInAs")} {who}
            </p>
          ) : (
            <div className="actions">
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email"
              />
              <button
                onClick={async () => {
                  await signInWithEmail(email);
                  setMsg("Lien envoyé");
                }}
              >
                {t("signIn")}
              </button>
            </div>
          )}
          <button
            onClick={async () => {
              try {
                const r = await sync();
                setMsg(`↑${r.pushed} ↓${r.pulled}`);
                await reload();
              } catch (err) {
                setMsg(err instanceof Error ? err.message : "Erreur");
              }
            }}
          >
            {t("syncNow")}
          </button>
        </>
      )}

      {msg && <p className="ok">{msg}</p>}
    </div>
  );
}
