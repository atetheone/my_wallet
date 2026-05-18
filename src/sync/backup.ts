/**
 * Offline backup: full JSON export / import. Import is last-write-wins by
 * `updated_at` so re-importing an old file never clobbers newer local rows.
 */

import { all, run } from "../db/sqlite";

export const SYNC_TABLES = [
  "settings",
  "categories",
  "expenses",
  "income_extra",
  "fixed_costs",
  "goals",
] as const;
export type SyncTable = (typeof SYNC_TABLES)[number];

export interface Backup {
  app: "xaalis";
  version: 1;
  exportedAt: number;
  tables: Record<string, Record<string, unknown>[]>;
}

export async function exportJSON(): Promise<Backup> {
  const tables: Backup["tables"] = {};
  for (const tbl of SYNC_TABLES) {
    tables[tbl] = await all(`SELECT * FROM ${tbl};`);
  }
  return { app: "xaalis", version: 1, exportedAt: Date.now(), tables };
}

export async function downloadBackup(): Promise<void> {
  const data = await exportJSON();
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `xaalis-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/** Upsert a row only when the incoming `updated_at` is newer (LWW). */
async function upsertNewer(
  table: string,
  row: Record<string, unknown>,
): Promise<void> {
  const id = row.id;
  if (id == null) return;
  const existing = await all<{ updated_at: number }>(
    `SELECT updated_at FROM ${table} WHERE id = ?;`,
    [id as string],
  );
  const incoming = Number(row.updated_at ?? 0);
  if (existing[0] && incoming <= existing[0].updated_at) return;

  const cols = Object.keys(row);
  const placeholders = cols.map(() => "?").join(", ");
  const updates = cols.map((c) => `${c} = excluded.${c}`).join(", ");
  await run(
    `INSERT INTO ${table} (${cols.join(", ")}) VALUES (${placeholders})
     ON CONFLICT(id) DO UPDATE SET ${updates};`,
    cols.map((c) => row[c] as never),
  );
}

export async function importJSON(data: Backup): Promise<void> {
  if (data?.app !== "xaalis") throw new Error("Fichier invalide");
  for (const tbl of SYNC_TABLES) {
    for (const row of data.tables[tbl] ?? []) {
      await upsertNewer(tbl, row);
    }
  }
}
