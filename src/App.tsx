import { useEffect } from "react";
import { useStore } from "./state/store";
import { useRoute, navigate } from "./lib/router";
import { t } from "./i18n";
import { Icon, type IconName } from "./ui/Icon";
import { wipeDatabase } from "./db/sqlite";
import { Lock } from "./screens/Lock";
import { Onboarding } from "./screens/Onboarding";
import { Home } from "./screens/Home";
import { QuickAdd } from "./screens/QuickAdd";
import { History } from "./screens/History";
import { Goals } from "./screens/Goals";
import { Settings } from "./screens/Settings";

const TABS: { r: "home" | "history" | "goals" | "settings"; label: string; icon: IconName }[] = [
  { r: "home", label: "Accueil", icon: "home" },
  { r: "history", label: "Historique", icon: "history" },
  { r: "goals", label: "Objectifs", icon: "goals" },
  { r: "settings", label: "Réglages", icon: "settings" },
];

export function App() {
  const { ready, error, snap, unlocked } = useStore();
  const route = useRoute();

  const onboarded = snap?.settings.onboarded === 1;
  const locked = Boolean(snap?.settings.pin_hash) && !unlocked;

  useEffect(() => {
    if (ready && snap && !onboarded && route !== "onboarding")
      navigate("onboarding");
  }, [ready, snap, onboarded, route]);

  if (!ready)
    return (
      <div className="app-shell no-tabbar">
        <div className="x-center x-display" style={{ fontSize: 32 }}>
          {t("appName")}
        </div>
      </div>
    );
  if (error)
    return (
      <div className="app-shell no-tabbar">
        <div className="x-center" style={{ padding: "0 32px", gap: 18 }}>
          <div
            className="x-display"
            style={{ fontSize: 22, fontWeight: 600, color: "var(--x-ink)" }}
          >
            Base de données illisible
          </div>
          <pre
            className="x-num"
            style={{
              color: "var(--x-clay)",
              fontSize: 11,
              lineHeight: 1.5,
              textAlign: "left",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              userSelect: "text",
              WebkitUserSelect: "text",
              maxHeight: "40vh",
              overflow: "auto",
              width: "100%",
              background: "var(--x-paper)",
              border: "1px solid var(--x-line)",
              borderRadius: 12,
              padding: 12,
              margin: 0,
            }}
          >
            {error}
          </pre>
          <p
            style={{
              fontSize: 13,
              color: "var(--x-ink-3)",
              textAlign: "center",
              lineHeight: 1.5,
            }}
          >
            Vous pouvez réinitialiser la base locale. Toutes les données de cet
            appareil seront effacées.
          </p>
          <button
            className="x-btn"
            onClick={async () => {
              try {
                await wipeDatabase();
              } finally {
                location.reload();
              }
            }}
          >
            Réinitialiser la base de données
          </button>
          <button
            className="x-btn x-btn-ghost"
            onClick={() => location.reload()}
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  if (locked)
    return (
      <div className="app-shell no-tabbar">
        <Lock />
      </div>
    );
  if (!onboarded)
    return (
      <div className="app-shell no-tabbar">
        <Onboarding />
      </div>
    );

  const fullscreen = route === "add";

  return (
    <div className={"app-shell" + (fullscreen ? " no-tabbar" : "")}>
      <main>
        {route === "home" && <Home />}
        {route === "add" && <QuickAdd />}
        {route === "history" && <History />}
        {route === "goals" && <Goals />}
        {route === "settings" && <Settings />}
        {route === "onboarding" && <Home />}
      </main>
      {!fullscreen && (
        <nav className="x-tabbar">
          {TABS.slice(0, 2).map((tab) => (
            <button
              key={tab.r}
              className={"x-tab" + (route === tab.r ? " active" : "")}
              onClick={() => navigate(tab.r)}
              aria-label={tab.label}
            >
              <Icon
                name={tab.icon}
                size={22}
                stroke={route === tab.r ? 1.9 : 1.5}
              />
              <span>{tab.label}</span>
            </button>
          ))}
          <span className="x-fab-placeholder" aria-hidden="true" />
          <button
            className="x-fab"
            onClick={() => navigate("add")}
            aria-label={t("addExpense")}
          >
            <Icon name="plus" size={24} stroke={2.2} />
          </button>
          {TABS.slice(2).map((tab) => (
            <button
              key={tab.r}
              className={"x-tab" + (route === tab.r ? " active" : "")}
              onClick={() => navigate(tab.r)}
              aria-label={tab.label}
            >
              <Icon
                name={tab.icon}
                size={22}
                stroke={route === tab.r ? 1.9 : 1.5}
              />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      )}
      <span className="brand">{t("appName")}</span>
    </div>
  );
}
