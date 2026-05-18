import { useEffect, useState } from "react";

export type Route =
  | "home"
  | "add"
  | "history"
  | "goals"
  | "settings"
  | "onboarding";

function current(): Route {
  const h = window.location.hash.replace(/^#\/?/, "");
  return (["home", "add", "history", "goals", "settings", "onboarding"].includes(
    h,
  )
    ? h
    : "home") as Route;
}

export function navigate(r: Route): void {
  window.location.hash = `/${r}`;
}

/** Minimal hash router — no dependency, survives PWA reloads. */
export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(current());
  useEffect(() => {
    const on = () => setRoute(current());
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);
  return route;
}
