/**
 * Opportunistic delta sync. Effectively single-writer, so conflict handling
 * is last-write-wins by `updated_at` in both directions.
 *
 * Each Supabase table mirrors the local schema plus a `user_id` column
 * (RLS-scoped to the signed-in user). Cursor (last synced ms) is kept in
 * localStorage — cheap and good enough for one user.
 */

import { all } from "../db/sqlite";
import { SYNC_TABLES } from "./backup";
import { importJSON, type Backup } from "./backup";
import { supabase, syncConfigured } from "./supabase";

const CURSOR_KEY = "xaalis:lastSynced";

function cursor(): number {
  return Number(localStorage.getItem(CURSOR_KEY) ?? 0);
}
function setCursor(ms: number): void {
  localStorage.setItem(CURSOR_KEY, String(ms));
}

export interface SyncResult {
  pushed: number;
  pulled: number;
  at: number;
}

export async function sync(): Promise<SyncResult> {
  if (!syncConfigured) throw new Error("Sync non configurée");
  if (!navigator.onLine) throw new Error("Hors ligne");

  const sb = supabase();
  const { data: auth } = await sb.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) throw new Error("Connexion requise");

  const since = cursor();
  const startedAt = Date.now();
  let pushed = 0;
  let pulled = 0;
  const pulledTables: Backup["tables"] = {};

  for (const tbl of SYNC_TABLES) {
    // Push local rows changed since the last cursor.
    const localRows = await all<Record<string, unknown>>(
      `SELECT * FROM ${tbl} WHERE updated_at > ?;`,
      [since],
    );
    if (localRows.length) {
      const payload = localRows.map((r) => ({ ...r, user_id: userId }));
      const { error } = await sb
        .from(tbl)
        .upsert(payload, { onConflict: "id" });
      if (error) throw new Error(`${tbl}: ${error.message}`);
      pushed += localRows.length;
    }

    // Pull remote rows changed since the last cursor.
    const { data: remote, error: pullErr } = await sb
      .from(tbl)
      .select("*")
      .eq("user_id", userId)
      .gt("updated_at", since);
    if (pullErr) throw new Error(`${tbl}: ${pullErr.message}`);
    pulledTables[tbl] = (remote ?? []) as Record<string, unknown>[];
    pulled += remote?.length ?? 0;
  }

  // Reuse the LWW importer to merge pulled rows into local SQLite.
  await importJSON({
    app: "xaalis",
    version: 1,
    exportedAt: startedAt,
    tables: pulledTables,
  });

  setCursor(startedAt);
  return { pushed, pulled, at: startedAt };
}
