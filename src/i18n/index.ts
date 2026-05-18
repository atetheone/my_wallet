import { fr, type Dict } from "./fr";

// Only French ships today. Structured so `en` can slot in without call-site
// changes: t("key") everywhere, swap the active dict here.
const active: Dict = fr;

export function t<K extends keyof Dict>(key: K): Dict[K] {
  return active[key];
}
