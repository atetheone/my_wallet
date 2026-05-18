import { describe, it, expect } from "vitest";
import { periodFor, daysRemaining, isInPeriod } from "./period";

// Local-midnight date helper (months are 1-based here for readability).
const d = (y: number, m: number, day: number) => new Date(y, m - 1, day);

describe("period — salary-day anchored budget periods", () => {
  it("starts on the salary day when ref is on/after it", () => {
    const p = periodFor(d(2026, 5, 16), 5);
    expect(p.start).toEqual(d(2026, 5, 5));
    expect(p.end).toEqual(d(2026, 6, 5));
    expect(p.totalDays).toBe(31);
  });

  it("rolls back to last month when ref is before the salary day", () => {
    const p = periodFor(d(2026, 5, 3), 5);
    expect(p.start).toEqual(d(2026, 4, 5));
    expect(p.end).toEqual(d(2026, 5, 5));
  });

  it("handles the year boundary (January, salary day 10)", () => {
    const p = periodFor(d(2026, 1, 4), 10);
    expect(p.start).toEqual(d(2025, 12, 10));
    expect(p.end).toEqual(d(2026, 1, 10));
  });

  it("clamps salary day 31 into short months", () => {
    // On Mar 1 with salary day 31: previous pay was Feb 28 (clamped),
    // next is Mar 31. Period is [Feb 28, Mar 31).
    const p = periodFor(d(2026, 3, 1), 31);
    expect(p.start).toEqual(d(2026, 2, 28));
    expect(p.end).toEqual(d(2026, 3, 31));
    expect(p.totalDays).toBe(31);
  });

  it("daysRemaining counts today and never returns < 1", () => {
    expect(daysRemaining(d(2026, 5, 4), 5)).toBe(1); // last day of period
    expect(daysRemaining(d(2026, 5, 5), 5)).toBe(31); // first day
    expect(daysRemaining(d(2026, 5, 16), 5)).toBe(20);
  });

  it("isInPeriod respects [start, end) exclusivity", () => {
    const p = periodFor(d(2026, 5, 16), 5);
    expect(isInPeriod(d(2026, 5, 5), p)).toBe(true);
    expect(isInPeriod(d(2026, 6, 4), p)).toBe(true);
    expect(isInPeriod(d(2026, 6, 5), p)).toBe(false); // end is exclusive
    expect(isInPeriod(d(2026, 5, 4), p)).toBe(false);
  });

  it("defaults invalid salary days to 1", () => {
    const p = periodFor(d(2026, 5, 16), 0);
    expect(p.start).toEqual(d(2026, 5, 1));
  });
});
