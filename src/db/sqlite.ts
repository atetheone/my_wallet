/**
 * Real SQLite in the browser via wa-sqlite, persisted to OPFS.
 *
 * We use the ASYNC build + OriginPrivateFileSystemVFS, which relies on the
 * async OPFS APIs (getFileHandle / createWritable). The synchronous
 * AccessHandlePoolVFS is intentionally NOT used: createSyncAccessHandle()
 * only exists inside a Web Worker, so it throws on the main/window thread.
 *
 * The whole module is async and lazy: the wasm + OPFS handles are created
 * once on first `getDb()` and reused. Nothing here runs under Node/Vitest;
 * pure logic lives in src/lib and is tested separately.
 */

import SQLiteESMFactory from "wa-sqlite/dist/wa-sqlite-async.mjs";
import * as SQLite from "wa-sqlite";
import { OriginPrivateFileSystemVFS } from "wa-sqlite/src/examples/OriginPrivateFileSystemVFS.js";

export type SqlValue = string | number | null;
export type Row = Record<string, SqlValue>;

interface Sqlite3 {
  vfs_register: (vfs: unknown, makeDefault: boolean) => void;
  open_v2: (filename: string) => Promise<number>;
  statements: (db: number, sql: string) => AsyncIterable<number>;
  bind_collection: (stmt: number, bindings: SqlValue[]) => void;
  step: (stmt: number) => Promise<number>;
  column_names: (stmt: number) => string[];
  row: (stmt: number) => SqlValue[];
  changes: (db: number) => number;
}

const SQLITE_ROW = 100;

let dbPromise: Promise<{ sqlite3: Sqlite3; db: number }> | null = null;

async function open(): Promise<{ sqlite3: Sqlite3; db: number }> {
  const module = await SQLiteESMFactory();
  const sqlite3 = SQLite.Factory(module) as Sqlite3;

  // Ensure the OPFS root exists before the VFS touches it.
  await navigator.storage.getDirectory();
  const vfs = new OriginPrivateFileSystemVFS();
  sqlite3.vfs_register(vfs, true);

  const db = await sqlite3.open_v2("xaalis.db");
  await raw(sqlite3, db, "PRAGMA foreign_keys = ON;");
  return { sqlite3, db };
}

/** Execute statements with no result handling (DDL / PRAGMA). */
async function raw(sqlite3: Sqlite3, db: number, sql: string): Promise<void> {
  for await (const stmt of sqlite3.statements(db, sql)) {
    while ((await sqlite3.step(stmt)) === SQLITE_ROW) {
      /* drain */
    }
  }
}

async function getDb() {
  if (!dbPromise) dbPromise = open();
  return dbPromise;
}

/** Run a write statement; returns the number of changed rows. */
export async function run(sql: string, params: SqlValue[] = []): Promise<number> {
  const { sqlite3, db } = await getDb();
  for await (const stmt of sqlite3.statements(db, sql)) {
    if (params.length) sqlite3.bind_collection(stmt, params);
    while ((await sqlite3.step(stmt)) === SQLITE_ROW) {
      /* writes don't yield rows */
    }
  }
  return sqlite3.changes(db);
}

/** Run a query and return all rows as objects. */
export async function all<T = Row>(
  sql: string,
  params: SqlValue[] = [],
): Promise<T[]> {
  const { sqlite3, db } = await getDb();
  const out: T[] = [];
  for await (const stmt of sqlite3.statements(db, sql)) {
    if (params.length) sqlite3.bind_collection(stmt, params);
    const cols = sqlite3.column_names(stmt);
    while ((await sqlite3.step(stmt)) === SQLITE_ROW) {
      const values = sqlite3.row(stmt);
      const obj: Row = {};
      cols.forEach((c, idx) => (obj[c] = values[idx] ?? null));
      out.push(obj as T);
    }
  }
  return out;
}

/** Run a query and return the first row, or null. */
export async function get<T = Row>(
  sql: string,
  params: SqlValue[] = [],
): Promise<T | null> {
  const rows = await all<T>(sql, params);
  return rows[0] ?? null;
}

/** Run several writes inside a single transaction. */
export async function tx(fn: () => Promise<void>): Promise<void> {
  await run("BEGIN");
  try {
    await fn();
    await run("COMMIT");
  } catch (e) {
    await run("ROLLBACK");
    throw e;
  }
}
