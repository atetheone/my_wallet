/**
 * Schema + forward-only migrations, versioned via PRAGMA user_version.
 *
 * Every user-data row carries the sync triplet: `id` (uuid text),
 * `updated_at` (epoch ms), `deleted` (0/1 soft delete) so the sync engine
 * can do last-write-wins deltas without server-side logic.
 *
 * `savings_commitment` (a single monthly amount) lives on the settings
 * singleton rather than its own table — simpler, same behaviour.
 */

import { all, exec, run, tx } from "./sqlite";

const MIGRATIONS: string[] = [
  // v1 — initial schema
  `
  CREATE TABLE settings (
    id                 TEXT PRIMARY KEY DEFAULT 'singleton',
    fixed_income       INTEGER NOT NULL DEFAULT 0,
    salary_day         INTEGER NOT NULL DEFAULT 1,
    savings_commitment INTEGER NOT NULL DEFAULT 0,
    pin_hash           TEXT,
    language           TEXT NOT NULL DEFAULT 'fr',
    onboarded          INTEGER NOT NULL DEFAULT 0,
    updated_at         INTEGER NOT NULL DEFAULT 0,
    deleted            INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE categories (
    id         TEXT PRIMARY KEY,
    name       TEXT NOT NULL,
    is_preset  INTEGER NOT NULL DEFAULT 0,
    sort       INTEGER NOT NULL DEFAULT 0,
    updated_at INTEGER NOT NULL DEFAULT 0,
    deleted    INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE expenses (
    id          TEXT PRIMARY KEY,
    date        INTEGER NOT NULL,
    amount      INTEGER NOT NULL,
    category_id TEXT,
    method      TEXT NOT NULL DEFAULT 'cash',
    note        TEXT,
    receipt     TEXT,
    updated_at  INTEGER NOT NULL DEFAULT 0,
    deleted     INTEGER NOT NULL DEFAULT 0
  );
  CREATE INDEX idx_expenses_date ON expenses (date);

  CREATE TABLE income_extra (
    id         TEXT PRIMARY KEY,
    date       INTEGER NOT NULL,
    amount     INTEGER NOT NULL,
    note       TEXT,
    updated_at INTEGER NOT NULL DEFAULT 0,
    deleted    INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE fixed_costs (
    id           TEXT PRIMARY KEY,
    label        TEXT NOT NULL,
    amount       INTEGER NOT NULL,
    day_of_month INTEGER NOT NULL DEFAULT 1,
    updated_at   INTEGER NOT NULL DEFAULT 0,
    deleted      INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE goals (
    id            TEXT PRIMARY KEY,
    name          TEXT NOT NULL,
    target_amount INTEGER NOT NULL,
    target_date   INTEGER,
    allocation    INTEGER NOT NULL DEFAULT 100,
    saved         INTEGER NOT NULL DEFAULT 0,
    updated_at    INTEGER NOT NULL DEFAULT 0,
    deleted       INTEGER NOT NULL DEFAULT 0
  );
  `,

  // v2 — add user name + setup wizard completion flag to the settings singleton
  `
  ALTER TABLE settings ADD COLUMN name TEXT;
  ALTER TABLE settings ADD COLUMN setup_complete INTEGER NOT NULL DEFAULT 0;
  `,

  // v3 — savings contribution log (each "top up" creates a dated transfer record)
  `
  CREATE TABLE savings_transfers (
    id         TEXT PRIMARY KEY,
    date       INTEGER NOT NULL,
    amount     INTEGER NOT NULL,
    goal_id    TEXT NOT NULL,
    note       TEXT,
    updated_at INTEGER NOT NULL DEFAULT 0,
    deleted    INTEGER NOT NULL DEFAULT 0
  );
  CREATE INDEX idx_savings_transfers_date ON savings_transfers (date);
  `,
];

/** Default French categories seeded on first run. */
export const PRESET_CATEGORIES = [
  "Nourriture",
  "Transport",
  "Logement",
  "Santé",
  "Loisirs",
  "Famille",
  "Divers",
] as const;

async function userVersion(): Promise<number> {
  const rows = await all<{ user_version: number }>("PRAGMA user_version;");
  return rows[0]?.user_version ?? 0;
}

/** True if a base table from the v1 baseline schema is already present. */
async function baselineApplied(): Promise<boolean> {
  const rows = await all<{ n: number }>(
    "SELECT COUNT(*) AS n FROM sqlite_master WHERE type='table' AND name='settings';",
  );
  return (rows[0]?.n ?? 0) > 0;
}

/** Apply any pending migrations, then ensure singleton + preset rows exist. */
export async function migrate(): Promise<void> {
  let current = await userVersion();
  // Self-heal a stranded DB: an older build bumped user_version *outside* the
  // migration tx, so a half-failed run could commit the v1 DDL but never
  // record the version, leaving user_version=0 with the tables already there.
  // Re-running migration v0 then throws "table settings already exists". If
  // the baseline schema is present, adopt it as v1 instead of re-creating it.
  if (current === 0 && (await baselineApplied())) {
    await run("PRAGMA user_version = 1;");
    current = 1;
  }
  for (let v = current; v < MIGRATIONS.length; v++) {
    await tx(async () => {
      // Run the whole migration script in one go. wa-sqlite's statements()
      // parser handles the ";"-separated statements, comments and blank lines
      // itself; the previous manual `.split(";")` produced malformed fragments
      // (e.g. comment-only / empty) that threw SQLITE_MISUSE "not a statement".
      await exec(MIGRATIONS[v]);
      // Bump the version inside the same transaction. PRAGMA user_version is
      // transactional (db-header write, rolled back with the tx), so the DDL
      // and the version bump commit atomically — either both land or neither.
      // Doing it outside the tx is what stranded a half-migrated DB at v0,
      // causing "table settings already exists" on every reload.
      // PRAGMA can't be parameterised; version is a trusted integer.
      await run(`PRAGMA user_version = ${v + 1};`);
    });
  }
  await seed();
}

async function seed(): Promise<void> {
  const now = Date.now();
  const settings = await all<{ n: number }>("SELECT COUNT(*) AS n FROM settings;");
  if ((settings[0]?.n ?? 0) === 0) {
    await run(
      "INSERT INTO settings (id, updated_at) VALUES ('singleton', ?);",
      [now],
    );
  }
  const cats = await all<{ n: number }>("SELECT COUNT(*) AS n FROM categories;");
  if ((cats[0]?.n ?? 0) === 0) {
    for (let i = 0; i < PRESET_CATEGORIES.length; i++) {
      await run(
        "INSERT INTO categories (id, name, is_preset, sort, updated_at) VALUES (?, ?, 1, ?, ?);",
        [`preset-${i}`, PRESET_CATEGORIES[i], i, now],
      );
    }
  }
}
