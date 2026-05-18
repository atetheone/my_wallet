import { useEffect } from "react";
import { useStore } from "./state/store";
import { useRoute, navigate } from "./lib/router";
import { t } from "./i18n";
import { Lock } from "./screens/Lock";
import { Onboarding } from "./screens/Onboarding";
import { Home } from "./screens/Home";
import { QuickAdd } from "./screens/QuickAdd";
import { History } from "./screens/History";
import { Goals } from "./screens/Goals";
import { Settings } from "./screens/Settings";

const NAV: { r: Parameters<typeof navigate>[0]; label: string }[] = [
  { r: "home", label: "Accueil" },
  { r: "add", label: "+" },
  { r: "history", label: "Historique" },
  { r: "goals", label: "Objectifs" },
  { r: "settings", label: "Réglages" },
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

  if (!ready) return <div className="screen center">…</div>;
  if (error)
    return (
      <div className="screen center">
        <p className="warn">Erreur: {error}</p>
      </div>
    );
  if (locked) return <Lock />;
  if (!onboarded) return <Onboarding />;

  return (
    <div className="app">
      <main>
        {route === "home" && <Home />}
        {route === "add" && <QuickAdd />}
        {route === "history" && <History />}
        {route === "goals" && <Goals />}
        {route === "settings" && <Settings />}
        {route === "onboarding" && <Home />}
      </main>
      <nav className="tabbar">
        {NAV.map((n) => (
          <button
            key={n.r}
            className={route === n.r ? "on" : ""}
            onClick={() => navigate(n.r)}
            aria-label={n.label}
          >
            {n.label}
          </button>
        ))}
      </nav>
      <span className="brand">{t("appName")}</span>
    </div>
  );
}
