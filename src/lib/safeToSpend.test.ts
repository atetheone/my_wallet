import { describe, it, expect } from "vitest";
import { computeSafeToSpend, projectGoal } from "./safeToSpend";

describe("safeToSpend — pay-yourself-first core", () => {
  const base = {
    fixedIncome: 300_000,
    extraIncomeReceived: 0,
    savingsCommitment: 80_000,
    fixedCostsTotal: 100_000,
    spentThisPeriod: 30_000,
    daysRemaining: 20,
  };

  it("protects savings before spending", () => {
    const r = computeSafeToSpend(base);
    // 300k - 80k - 100k - 30k = 90k
    expect(r.safeToSpend).toBe(90_000);
    expect(r.dailyAllowance).toBe(4_500); // floor(90000/20)
    expect(r.overcommitted).toBe(false);
  });

  it("counts extra income only when received (raises safe-to-spend)", () => {
    const r = computeSafeToSpend({ ...base, extraIncomeReceived: 50_000 });
    expect(r.safeToSpend).toBe(140_000);
  });

  it("ignores negative/garbage extra income", () => {
    const r = computeSafeToSpend({ ...base, extraIncomeReceived: -50_000 });
    expect(r.safeToSpend).toBe(90_000);
  });

  it("goes negative honestly when overspent", () => {
    const r = computeSafeToSpend({ ...base, spentThisPeriod: 150_000 });
    expect(r.safeToSpend).toBe(-30_000);
    expect(r.dailyAllowance).toBe(-1_500); // ceil(-30000/20)
  });

  it("flags overcommitment when savings + fixed costs exceed income", () => {
    const r = computeSafeToSpend({
      ...base,
      savingsCommitment: 250_000,
      fixedCostsTotal: 100_000,
    });
    expect(r.overcommitted).toBe(true);
  });

  it("never divides by zero on the last day", () => {
    const r = computeSafeToSpend({ ...base, daysRemaining: 0 });
    expect(Number.isFinite(r.dailyAllowance)).toBe(true);
  });
});

describe("projectGoal — optimistic completion projection", () => {
  const from = new Date(2026, 4, 5);

  it("projects a completion date from the current pace", () => {
    const g = projectGoal({
      target: 200_000,
      saved: 50_000,
      perPeriodContribution: 50_000,
      from,
      periodDays: 30,
    });
    expect(g.remaining).toBe(150_000);
    expect(g.periodsLeft).toBe(3); // ceil(150000/50000)
    expect(g.progressRatio).toBeCloseTo(0.25);
    expect(g.projectedDate).toEqual(new Date(2026, 7, 3)); // +90 days
    expect(g.reached).toBe(false);
  });

  it("reports reached goals", () => {
    const g = projectGoal({
      target: 200_000,
      saved: 200_000,
      perPeriodContribution: 50_000,
      from,
      periodDays: 30,
    });
    expect(g.reached).toBe(true);
    expect(g.progressRatio).toBe(1);
    expect(g.periodsLeft).toBe(0);
  });

  it("has no projected date when nothing is contributed", () => {
    const g = projectGoal({
      target: 200_000,
      saved: 0,
      perPeriodContribution: 0,
      from,
      periodDays: 30,
    });
    expect(g.projectedDate).toBeNull();
    expect(g.periodsLeft).toBe(Infinity);
  });
});
