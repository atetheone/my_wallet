/**
 * Offline backup: full JSON export / import. Import is last-write-wins by
 * `updated_at` so re-importing an old file never clobbers newer local rows.
 */

import { z } from "zod";
import { all, run } from "../db/sqlite";
import { t } from "../i18n";

export const SYNC_TABLES = [
  "settings",
  "categories",
  "expenses",
  "income_extra",
  "fixed_costs",
  "goals",
  "savings_transfers",
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

// Allowed columns per sync table. Column AND table names are interpolated
// into SQL (identifiers cannot be parameterized) and the rows come from an
// imported JSON file, so both must be validated against this whitelist —
// never trust keys off the parsed backup.
const TABLE_COLUMNS: Record<SyncTable, ReadonlySet<string>> = {
  settings: new Set([
    "id", "fixed_income", "salary_day", "savings_commitment", "pin_hash",
    "language", "onboarded", "name", "setup_complete", "updated_at", "deleted",
  ]),
  categories: new Set([
    "id", "name", "is_preset", "sort", "updated_at", "deleted",
  ]),
  expenses: new Set([
    "id", "date", "amount", "category_id", "method", "note", "receipt",
    "updated_at", "deleted",
  ]),
  income_extra: new Set([
    "id", "date", "amount", "note", "updated_at", "deleted",
  ]),
  fixed_costs: new Set([
    "id", "label", "amount", "day_of_month", "updated_at", "deleted",
  ]),
  goals: new Set([
    "id", "name", "target_amount", "target_date", "allocation", "saved",
    "updated_at", "deleted",
  ]),
  savings_transfers: new Set([
    "id", "date", "amount", "goal_id", "note", "updated_at", "deleted",
  ]),
};

/** Upsert a row only when the incoming `updated_at` is newer (LWW). */
async function upsertNewer(
  table: SyncTable,
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

  // Drop any key not in the schema; a corrupt/hostile file can't inject SQL.
  const allowed = TABLE_COLUMNS[table];
  const cols = Object.keys(row).filter((c) => allowed.has(c));
  if (!cols.includes("id")) return;
  const placeholders = cols.map(() => "?").join(", ");
  const updates = cols.map((c) => `${c} = excluded.${c}`).join(", ");
  await run(
    `INSERT INTO ${table} (${cols.join(", ")}) VALUES (${placeholders})
     ON CONFLICT(id) DO UPDATE SET ${updates};`,
    cols.map((c) => row[c] as never),
  );
}

const rowShape = z.object({ id: z.string(), updated_at: z.number(), deleted: z.number() }).passthrough();
const BackupSchema = z.object({
  app: z.literal("xaalis"),
  version: z.literal(1),
  exportedAt: z.number(),
  tables: z.object({
    settings:           z.array(rowShape),
    categories:         z.array(rowShape),
    expenses:           z.array(rowShape.extend({ date: z.number(), amount: z.number() })),
    income_extra:       z.array(rowShape),
    fixed_costs:        z.array(rowShape),
    goals:              z.array(rowShape),
    savings_transfers:  z.array(rowShape.extend({ date: z.number(), amount: z.number(), goal_id: z.string() })).optional(),
  }),
});

export async function importJSON(data: Backup): Promise<void> {
  const result = BackupSchema.safeParse(data);
  if (!result.success) throw new Error(t("backupInvalid"));
  for (const tbl of SYNC_TABLES) {
    for (const row of result.data.tables[tbl] ?? []) {
      await upsertNewer(tbl, row as Record<string, unknown>);
    }
  }
}
