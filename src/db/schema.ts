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

import { all, run, tx } from "./sqlite";

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

/** Apply any pending migrations, then ensure singleton + preset rows exist. */
export async function migrate(): Promise<void> {
  const current = await userVersion();
  for (let v = current; v < MIGRATIONS.length; v++) {
    await tx(async () => {
      for (const part of MIGRATIONS[v].split(";")) {
        const sql = part.trim();
        if (sql) await run(sql);
      }
    });
    // PRAGMA can't be parameterised; version is a trusted integer.
    await run(`PRAGMA user_version = ${v + 1};`);
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
