/**
 * Real SQLite in the browser via wa-sqlite, persisted to IndexedDB.
 *
 * We use the ASYNC build + IDBBatchAtomicVFS. The OPFS VFSes shipped by
 * wa-sqlite@1.0.0 (OriginPrivateFileSystemVFS, AccessHandlePoolVFS) both
 * call FileSystemFileHandle.createSyncAccessHandle(), which only exists in
 * a dedicated Web Worker — on the main/window thread it is undefined and
 * throws "createSyncAccessHandle is not a function". IDBBatchAtomicVFS is
 * fully async (IndexedDB) and therefore main-thread-safe; switching to OPFS
 * would require moving this whole module into a Worker.
 *
 * The whole module is async and lazy: the wasm + VFS are created once on
 * first `getDb()` and reused. Nothing here runs under Node/Vitest; pure
 * logic lives in src/lib and is tested separately.
 */

import SQLiteESMFactory from "wa-sqlite/dist/wa-sqlite-async.mjs";
import * as SQLite from "wa-sqlite";
import { IDBBatchAtomicVFS } from "wa-sqlite/src/examples/IDBBatchAtomicVFS.js";

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

/** Error thrown by every DB primitive. Preserves the underlying cause so the
 *  real SQLite/VFS failure isn't flattened to a bare string in the UI. */
export class DbError extends Error {
  constructor(
    message: string,
    readonly cause: unknown,
  ) {
    super(message);
    this.name = "DbError";
  }
}

/**
 * Single-connection serialization. wa-sqlite serializes individual calls but
 * NOT logical transactions, so two overlapping callers would interleave
 * BEGIN/COMMIT on the one shared connection. Every public op runs inside this
 * promise-chain mutex. `lockDepth > 0` means we're already inside the held
 * critical section (a `tx()` body) — nested ops run directly instead of
 * re-enqueuing, which would deadlock.
 */
let chain: Promise<unknown> = Promise.resolve();
let lockDepth = 0;

function serialize<T>(fn: () => Promise<T>): Promise<T> {
  if (lockDepth > 0) return fn();
  const result = chain.then(fn, fn);
  // Keep the chain alive even if this op rejects; swallow only the chain copy.
  chain = result.then(
    () => undefined,
    () => undefined,
  );
  return result;
}

async function open(): Promise<{ sqlite3: Sqlite3; db: number }> {
  const module = await SQLiteESMFactory();
  const sqlite3 = SQLite.Factory(module) as Sqlite3;

  const vfs = new IDBBatchAtomicVFS("xaalis");
  sqlite3.vfs_register(vfs, true);

  const db = await sqlite3.open_v2("xaalis.db");

  // Bootstrap PRAGMAs run directly on the fresh handle (open() is already
  // inside getDb(), itself called under the serialization lock).
  const pragma = async (sql: string) => {
    for await (const stmt of sqlite3.statements(db, sql)) {
      while ((await sqlite3.step(stmt)) === SQLITE_ROW) {
        /* drain */
      }
    }
  };
  // IDBBatchAtomicVFS commits atomically through IndexedDB; it cannot use an
  // on-disk rollback journal. Without these two PRAGMAs the first BEGIN/COMMIT
  // (the schema migration) fails with a generic "disk I/O error". Exclusive
  // locking must be set before journal_mode for the mode change to stick.
  await pragma("PRAGMA locking_mode = exclusive;");
  await pragma("PRAGMA journal_mode = MEMORY;");
  await pragma("PRAGMA foreign_keys = ON;");
  return { sqlite3, db };
}

async function getDb() {
  if (!dbPromise) dbPromise = open();
  return dbPromise;
}

/**
 * Last-resort recovery: drop the entire IndexedDB-backed database and forget
 * the cached connection. Used by the boot-failure screen when the on-device
 * store is corrupt/unreadable (classic "disk I/O error" on a half-written
 * IDBBatchAtomicVFS). Destructive: all local data is lost. Caller reloads.
 */
export function wipeDatabase(): Promise<void> {
  dbPromise = null;
  return new Promise<void>((resolve, reject) => {
    const req = indexedDB.deleteDatabase("xaalis");
    req.onsuccess = () => resolve();
    req.onblocked = () => resolve(); // completes once the page reloads
    req.onerror = () => reject(req.error ?? new Error("deleteDatabase failed"));
  });
}

// ---- unguarded workers (assume the serialization lock is held) -----------

async function execRaw(sql: string): Promise<void> {
  const { sqlite3, db } = await getDb();
  for await (const stmt of sqlite3.statements(db, sql)) {
    while ((await sqlite3.step(stmt)) === SQLITE_ROW) {
      /* drain */
    }
  }
}

async function runRaw(sql: string, params: SqlValue[]): Promise<number> {
  const { sqlite3, db } = await getDb();
  for await (const stmt of sqlite3.statements(db, sql)) {
    if (params.length) sqlite3.bind_collection(stmt, params);
    while ((await sqlite3.step(stmt)) === SQLITE_ROW) {
      /* writes don't yield rows */
    }
  }
  return sqlite3.changes(db);
}

async function allRaw<T>(sql: string, params: SqlValue[]): Promise<T[]> {
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

function wrap<T>(label: string, sql: string, fn: () => Promise<T>): Promise<T> {
  return serialize(fn).catch((e) => {
    if (e instanceof DbError) throw e;
    throw new DbError(
      `${label} failed: ${e instanceof Error ? e.message : String(e)} — SQL: ${sql.trim().slice(0, 120)}`,
      e,
    );
  });
}

/**
 * Execute a whole SQL script: multiple `;`-separated statements, comments and
 * blank lines allowed. wa-sqlite's `statements()` parses the script natively —
 * do NOT pre-split on ";" (that produced malformed fragments). No parameters:
 * use `run()` for a single parameterized statement.
 */
export function exec(sql: string): Promise<void> {
  return wrap("exec", sql, () => execRaw(sql));
}

/**
 * Run exactly ONE parameterized write statement; returns changed rows.
 * Passing a multi-statement string here binds `params` to every statement —
 * use `exec()` for scripts.
 */
export function run(sql: string, params: SqlValue[] = []): Promise<number> {
  return wrap("run", sql, () => runRaw(sql, params));
}

/** Run a query and return all rows as objects. */
export function all<T = Row>(sql: string, params: SqlValue[] = []): Promise<T[]> {
  return wrap("all", sql, () => allRaw<T>(sql, params));
}

/** Run a query and return the first row, or null. */
export async function get<T = Row>(
  sql: string,
  params: SqlValue[] = [],
): Promise<T | null> {
  const rows = await all<T>(sql, params);
  return rows[0] ?? null;
}

/**
 * Run several writes inside a single transaction. The whole BEGIN..COMMIT
 * span holds the serialization lock, so no other op can interleave. `fn`'s
 * own run/exec/all calls detect the held lock (`lockDepth`) and execute
 * directly rather than re-enqueuing.
 */
export function tx(fn: () => Promise<void>): Promise<void> {
  return serialize(async () => {
    lockDepth++;
    try {
      await execRaw("BEGIN");
      try {
        await fn();
        await execRaw("COMMIT");
      } catch (e) {
        try {
          await execRaw("ROLLBACK");
        } catch {
          /* ROLLBACK can fail if BEGIN never took; keep the original error */
        }
        throw e instanceof DbError
          ? e
          : new DbError(
              `tx rolled back: ${e instanceof Error ? e.message : String(e)}`,
              e,
            );
      }
    } finally {
      lockDepth--;
    }
  });
}
