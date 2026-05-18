/**
 * Budget periods are anchored to your salary day, not the calendar month.
 * A period runs [salaryDay of month] -> [salaryDay of next month) exclusive.
 *
 * All math is done on local Y/M/D integers (no timezone drift). Salary day
 * is clamped per-month so 31 still works in February (-> 28/29).
 */

export interface Period {
  /** Inclusive start, local midnight. */
  start: Date;
  /** Exclusive end (start of next period), local midnight. */
  end: Date;
  /** Total whole days in the period. */
  totalDays: number;
}

function daysInMonth(year: number, month0: number): number {
  // month0 is 0-based; day 0 of next month == last day of this month.
  return new Date(year, month0 + 1, 0).getDate();
}

/** Clamp a desired day-of-month to a month that may be shorter. */
function clampDay(year: number, month0: number, day: number): number {
  return Math.min(day, daysInMonth(year, month0));
}

function ymd(d: Date): { y: number; m: number; day: number } {
  return { y: d.getFullYear(), m: d.getMonth(), day: d.getDate() };
}

function diffDays(a: Date, b: Date): number {
  const MS = 24 * 60 * 60 * 1000;
  return Math.round((b.getTime() - a.getTime()) / MS);
}

/**
 * Resolve the period containing `ref` for a given salary day (1..31).
 */
export function periodFor(ref: Date, salaryDay: number): Period {
  const sd = Math.min(Math.max(Math.trunc(salaryDay) || 1, 1), 31);
  const { y, m, day } = ymd(ref);

  let startY = y;
  let startM = m;
  // Before this month's (clamped) salary day -> period started last month.
  if (day < clampDay(y, m, sd)) {
    startM = m - 1;
    if (startM < 0) {
      startM = 11;
      startY = y - 1;
    }
  }
  const start = new Date(startY, startM, clampDay(startY, startM, sd));

  let endY = startY;
  let endM = startM + 1;
  if (endM > 11) {
    endM = 0;
    endY = startY + 1;
  }
  const end = new Date(endY, endM, clampDay(endY, endM, sd));

  return { start, end, totalDays: diffDays(start, end) };
}

/**
 * Whole days remaining in the period, counting `ref`'s day itself as still
 * spendable. Always >= 1 inside a valid period (so we never divide by zero).
 */
export function daysRemaining(ref: Date, salaryDay: number): number {
  const { end } = periodFor(ref, salaryDay);
  const today = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate());
  return Math.max(1, diffDays(today, end));
}

/** True when `d` falls within [start, end) of the given period. */
export function isInPeriod(d: Date, period: Period): boolean {
  return d.getTime() >= period.start.getTime() && d.getTime() < period.end.getTime();
}
