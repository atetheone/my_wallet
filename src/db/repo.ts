/**
 * Typed domain accessors. All writes stamp `updated_at = Date.now()` and use
 * soft deletes (`deleted = 1`) so the sync engine sees every change.
 */

import { all, get, run } from "./sqlite";
import { periodFor } from "../lib/period";
import type { XOF } from "../lib/money";

const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `id-${Date.now()}-${Math.random().toString(36).slice(2)}`;

export interface Settings {
  fixed_income: XOF;
  salary_day: number;
  savings_commitment: XOF;
  pin_hash: string | null;
  language: string;
  onboarded: number;
  name: string | null;
  setup_complete: number;
}

export interface Expense {
  id: string;
  date: number;
  amount: XOF;
  category_id: string | null;
  method: "cash" | "wave";
  note: string | null;
  receipt: string | null;
}

export interface Category {
  id: string;
  name: string;
  is_preset: number;
  sort: number;
}

export interface FixedCost {
  id: string;
  label: string;
  amount: XOF;
  day_of_month: number;
}

export interface Goal {
  id: string;
  name: string;
  target_amount: XOF;
  target_date: number | null;
  allocation: number;
  saved: XOF;
}

// ---- settings ------------------------------------------------------------

export async function getSettings(): Promise<Settings> {
  const s = await get<Settings>(
    "SELECT fixed_income, salary_day, savings_commitment, pin_hash, language, onboarded, name, setup_complete FROM settings WHERE id = 'singleton';",
  );
  return (
    s ?? {
      fixed_income: 0,
      salary_day: 1,
      savings_commitment: 0,
      pin_hash: null,
      language: "fr",
      onboarded: 0,
      name: null,
      setup_complete: 0,
    }
  );
}

// Whitelist of columns updateSettings may write. Column names are
// string-interpolated into SQL (cannot be parameterized), so they must never
// come unchecked from a caller-supplied object.
const SETTINGS_COLUMNS: ReadonlySet<keyof Settings> = new Set([
  "fixed_income",
  "salary_day",
  "savings_commitment",
  "pin_hash",
  "language",
  "onboarded",
  "name",
  "setup_complete",
]);

export async function updateSettings(patch: Partial<Settings>): Promise<void> {
  const cols = Object.keys(patch) as (keyof Settings)[];
  const unknown = cols.filter((c) => !SETTINGS_COLUMNS.has(c));
  if (unknown.length) {
    throw new Error(`updateSettings: unknown column(s): ${unknown.join(", ")}`);
  }
  if (!cols.length) return;
  const set = cols.map((c) => `${c} = ?`).join(", ");
  const vals = cols.map((c) => (patch as Record<string, unknown>)[c] as never);
  await run(
    `UPDATE settings SET ${set}, updated_at = ? WHERE id = 'singleton';`,
    [...vals, Date.now()],
  );
}

// ---- expenses ------------------------------------------------------------

export async function addExpense(
  e: Omit<Expense, "id">,
): Promise<string> {
  const id = uid();
  await run(
    `INSERT INTO expenses (id, date, amount, category_id, method, note, receipt, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
    [id, e.date, e.amount, e.category_id, e.method, e.note, e.receipt, Date.now()],
  );
  return id;
}

export async function deleteExpense(id: string): Promise<void> {
  await run(
    "UPDATE expenses SET deleted = 1, updated_at = ? WHERE id = ?;",
    [Date.now(), id],
  );
}

const EXPENSE_UPDATE_COLUMNS: ReadonlySet<keyof Omit<Expense, "id">> = new Set([
  "date", "amount", "category_id", "method", "note", "receipt",
]);

export async function updateExpense(
  id: string,
  patch: Partial<Omit<Expense, "id">>,
): Promise<void> {
  const cols = (Object.keys(patch) as (keyof Omit<Expense, "id">)[]).filter(
    (c) => EXPENSE_UPDATE_COLUMNS.has(c),
  );
  if (!cols.length) return;
  const set = cols.map((c) => `${c} = ?`).join(", ");
  const vals = cols.map((c) => (patch as Record<string, unknown>)[c] as never);
  await run(
    `UPDATE expenses SET ${set}, updated_at = ? WHERE id = ?;`,
    [...vals, Date.now(), id],
  );
}

export async function listExpenses(limit = 200): Promise<Expense[]> {
  return all<Expense>(
    "SELECT id, date, amount, category_id, method, note, receipt FROM expenses WHERE deleted = 0 ORDER BY date DESC LIMIT ?;",
    [limit],
  );
}

// ---- categories ----------------------------------------------------------

export async function listCategories(): Promise<Category[]> {
  return all<Category>(
    "SELECT id, name, is_preset, sort FROM categories WHERE deleted = 0 ORDER BY sort, name;",
  );
}

export async function addCategory(name: string): Promise<string> {
  const id = uid();
  await run(
    "INSERT INTO categories (id, name, is_preset, sort, updated_at) VALUES (?, ?, 0, 999, ?);",
    [id, name, Date.now()],
  );
  return id;
}

// ---- fixed costs ---------------------------------------------------------

export async function listFixedCosts(): Promise<FixedCost[]> {
  return all<FixedCost>(
    "SELECT id, label, amount, day_of_month FROM fixed_costs WHERE deleted = 0 ORDER BY day_of_month;",
  );
}

export async function addFixedCost(c: Omit<FixedCost, "id">): Promise<string> {
  const id = uid();
  await run(
    "INSERT INTO fixed_costs (id, label, amount, day_of_month, updated_at) VALUES (?, ?, ?, ?, ?);",
    [id, c.label, c.amount, c.day_of_month, Date.now()],
  );
  return id;
}

export async function deleteFixedCost(id: string): Promise<void> {
  await run(
    "UPDATE fixed_costs SET deleted = 1, updated_at = ? WHERE id = ?;",
    [Date.now(), id],
  );
}

// ---- goals ---------------------------------------------------------------

export async function listGoals(): Promise<Goal[]> {
  return all<Goal>(
    "SELECT id, name, target_amount, target_date, allocation, saved FROM goals WHERE deleted = 0 ORDER BY target_date;",
  );
}

export async function addGoal(g: Omit<Goal, "id" | "saved">): Promise<string> {
  const id = uid();
  await run(
    "INSERT INTO goals (id, name, target_amount, target_date, allocation, saved, updated_at) VALUES (?, ?, ?, ?, ?, 0, ?);",
    [id, g.name, g.target_amount, g.target_date, g.allocation, Date.now()],
  );
  return id;
}

export async function updateGoalSaved(id: string, saved: XOF): Promise<void> {
  await run(
    "UPDATE goals SET saved = ?, updated_at = ? WHERE id = ?;",
    [saved, Date.now(), id],
  );
}

export async function deleteGoal(id: string): Promise<void> {
  await run("UPDATE goals SET deleted = 1, updated_at = ? WHERE id = ?;", [
    Date.now(),
    id,
  ]);
}

// ---- period aggregates (feed safeToSpend) --------------------------------

export interface PeriodTotals {
  spent: XOF;
  extraIncome: XOF;
  fixedCostsTotal: XOF;
}

export async function periodTotals(
  ref: Date,
  salaryDay: number,
): Promise<PeriodTotals> {
  const { start, end } = periodFor(ref, salaryDay);
  const s = start.getTime();
  const e = end.getTime();

  const spent = await get<{ v: number }>(
    "SELECT COALESCE(SUM(amount), 0) AS v FROM expenses WHERE deleted = 0 AND date >= ? AND date < ?;",
    [s, e],
  );
  const extra = await get<{ v: number }>(
    "SELECT COALESCE(SUM(amount), 0) AS v FROM income_extra WHERE deleted = 0 AND date >= ? AND date < ?;",
    [s, e],
  );
  const fixed = await get<{ v: number }>(
    "SELECT COALESCE(SUM(amount), 0) AS v FROM fixed_costs WHERE deleted = 0;",
  );

  return {
    spent: spent?.v ?? 0,
    extraIncome: extra?.v ?? 0,
    fixedCostsTotal: fixed?.v ?? 0,
  };
}

export interface CategoryTotal {
  category_id: string | null;
  name: string;
  total: XOF;
}

export async function categoryBreakdown(
  ref: Date,
  salaryDay: number,
): Promise<CategoryTotal[]> {
  const { start, end } = periodFor(ref, salaryDay);
  return all<CategoryTotal>(
    `SELECT e.category_id AS category_id,
            COALESCE(c.name, 'Divers') AS name,
            SUM(e.amount) AS total
     FROM expenses e
     LEFT JOIN categories c ON c.id = e.category_id
     WHERE e.deleted = 0 AND e.date >= ? AND e.date < ?
     GROUP BY e.category_id
     ORDER BY total DESC;`,
    [start.getTime(), end.getTime()],
  );
}

// ---- extra income --------------------------------------------------------

export async function addExtraIncome(
  date: number,
  amount: XOF,
  note: string | null,
): Promise<string> {
  const id = uid();
  await run(
    "INSERT INTO income_extra (id, date, amount, note, updated_at) VALUES (?, ?, ?, ?, ?);",
    [id, date, amount, note, Date.now()],
  );
  return id;
}
