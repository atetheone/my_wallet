/**
 * The core mechanic of Xaalis: pay-yourself-first "safe to spend".
 *
 * Savings are protected BEFORE spending, not whatever happens to be left.
 * Variable income is counted only when actually received (never projected) —
 * realistic on the cash, optimistic on the goal.
 */

import type { XOF } from "./money";

export interface SafeToSpendInput {
  /** Guaranteed fixed monthly income. */
  fixedIncome: XOF;
  /** Variable extra income actually received this period (>= 0). */
  extraIncomeReceived: XOF;
  /** Amount set aside first (pay-yourself-first). */
  savingsCommitment: XOF;
  /** Sum of known recurring costs for the period (rent, subscriptions…). */
  fixedCostsTotal: XOF;
  /** Variable spending logged so far this period. */
  spentThisPeriod: XOF;
  /** Whole days left in the period (>= 1). */
  daysRemaining: number;
}

export interface SafeToSpendResult {
  /** Money free to spend for the rest of the period (may be negative). */
  safeToSpend: XOF;
  /** Conservative per-day allowance (floored, never over-promises). */
  dailyAllowance: XOF;
  /** True when committed savings + fixed costs already exceed income. */
  overcommitted: boolean;
}

export function computeSafeToSpend(i: SafeToSpendInput): SafeToSpendResult {
  const income = i.fixedIncome + Math.max(0, i.extraIncomeReceived);
  const protectedOut = i.savingsCommitment + i.fixedCostsTotal;
  const safeToSpend = income - protectedOut - i.spentThisPeriod;
  const days = Math.max(1, Math.trunc(i.daysRemaining));

  // Floor toward zero-ish: conservative when positive, honest when negative.
  const dailyAllowance =
    safeToSpend >= 0 ? Math.floor(safeToSpend / days) : Math.ceil(safeToSpend / days);

  return {
    safeToSpend,
    dailyAllowance,
    overcommitted: income - protectedOut < 0,
  };
}

export interface GoalProjectionInput {
  target: XOF;
  saved: XOF;
  /** Amount contributed toward this goal each period. */
  perPeriodContribution: XOF;
  /** Anchor date for the projection (period boundary). */
  from: Date;
  /** Period length in days (for date projection). */
  periodDays: number;
}

export interface GoalProjection {
  remaining: XOF;
  progressRatio: number; // 0..1
  /** Whole periods still needed (0 when already reached). */
  periodsLeft: number;
  /** Optimistic completion date if the current pace holds, or null. */
  projectedDate: Date | null;
  reached: boolean;
}

export function projectGoal(g: GoalProjectionInput): GoalProjection {
  const remaining = Math.max(0, g.target - g.saved);
  const progressRatio = g.target <= 0 ? 1 : Math.min(1, g.saved / g.target);
  const reached = remaining === 0;

  if (reached) {
    return { remaining: 0, progressRatio: 1, periodsLeft: 0, projectedDate: g.from, reached: true };
  }
  if (g.perPeriodContribution <= 0) {
    return { remaining, progressRatio, periodsLeft: Infinity, projectedDate: null, reached: false };
  }

  const periodsLeft = Math.ceil(remaining / g.perPeriodContribution);
  const projectedDate = new Date(g.from.getTime());
  projectedDate.setDate(projectedDate.getDate() + periodsLeft * Math.max(1, g.periodDays));

  return { remaining, progressRatio, periodsLeft, projectedDate, reached: false };
}
