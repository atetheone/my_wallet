/** Category visual metadata (icon + warm palette), ported from the design.
 * Real categories are stored by French name (see PRESET_CATEGORIES); we key
 * the look-up on a normalised name so accents/case don't matter, with a
 * graceful "Divers" fallback for custom user categories. */

import type { IconName } from "./Icon";

export interface CatMeta {
  icon: IconName;
  bg: string;
  fg: string;
}

const FALLBACK: CatMeta = { icon: "misc", bg: "#dcd6cb", fg: "#56504a" };

const BY_KEY: Record<string, CatMeta> = {
  nourriture: { icon: "food", bg: "#f2d8b8", fg: "#7a4e10" },
  transport: { icon: "transport", bg: "#d5ddf0", fg: "#2e3a78" },
  logement: { icon: "home2", bg: "#e0d6c7", fg: "#5c4a2a" },
  sante: { icon: "health", bg: "#f0cfc8", fg: "#9a3a28" },
  loisirs: { icon: "leisure", bg: "#e6dfc0", fg: "#6b5a1a" },
  famille: { icon: "family", bg: "#d6e5d0", fg: "#3d5a2e" },
  divers: FALLBACK,
};

function normalize(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim();
}

export function catMeta(name: string | null | undefined): CatMeta {
  if (!name) return FALLBACK;
  return BY_KEY[normalize(name)] ?? FALLBACK;
}
