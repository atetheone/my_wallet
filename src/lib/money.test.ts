import { describe, it, expect } from "vitest";
import { formatXOF, parseXOF, toXOF, THIN_SEP as S } from "./money";

describe("money — XOF integer handling, no floats/cents", () => {
  it("formats with grouped thousands and FCFA suffix", () => {
    expect(formatXOF(0)).toBe(`0${S}FCFA`);
    expect(formatXOF(500)).toBe(`500${S}FCFA`);
    expect(formatXOF(12500)).toBe(`12${S}500${S}FCFA`);
    expect(formatXOF(1250000)).toBe(`1${S}250${S}000${S}FCFA`);
  });

  it("keeps the sign for negative (over-budget) amounts", () => {
    expect(formatXOF(-2000)).toBe(`-2${S}000${S}FCFA`);
  });

  it("can omit the suffix", () => {
    expect(formatXOF(12500, { suffix: false })).toBe(`12${S}500`);
  });

  it("never produces decimals", () => {
    expect(toXOF(12.99)).toBe(12);
    expect(toXOF(-3.7)).toBe(-3);
    expect(toXOF(Number.NaN)).toBe(0);
    expect(toXOF(Infinity)).toBe(0);
  });

  it("parses messy user / OCR strings back to integers", () => {
    expect(parseXOF(`12${S}500${S}FCFA`)).toBe(12500);
    expect(parseXOF("12 500 FCFA")).toBe(12500);
    expect(parseXOF("1.250")).toBe(1250);
    expect(parseXOF("-2 000")).toBe(-2000);
    expect(parseXOF("")).toBe(0);
    expect(parseXOF("rien")).toBe(0);
  });
});
