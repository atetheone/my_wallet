/**
 * XOF / FCFA money. The West African CFA franc has NO decimal subunit:
 * the smallest unit is 1 franc. Every amount in Xaalis is a plain integer.
 * There are no floats and no cents anywhere in the app.
 */

/** Brand-ish alias to make "this number is XOF" explicit at call sites. */
export type XOF = number;

/** Narrow no-break space (U+202F) — the correct French thousands separator. */
export const THIN_SEP = " ";

/** Round/clamp any incoming number to a valid integer franc amount. */
export function toXOF(value: number): XOF {
  if (!Number.isFinite(value)) return 0;
  return Math.trunc(value);
}

/**
 * Format an integer franc amount for display, e.g. 12500 -> "12 500 FCFA".
 * Negative amounts keep the sign: -2000 -> "-2 000 FCFA".
 */
export function formatXOF(amount: XOF, opts: { suffix?: boolean } = {}): string {
  const withSuffix = opts.suffix !== false;
  const n = toXOF(amount);
  const sign = n < 0 ? "-" : "";
  const digits = Math.abs(n).toString();
  let grouped = "";
  for (let i = 0; i < digits.length; i++) {
    if (i > 0 && (digits.length - i) % 3 === 0) grouped += THIN_SEP;
    grouped += digits[i];
  }
  return withSuffix ? `${sign}${grouped}${THIN_SEP}FCFA` : `${sign}${grouped}`;
}

/**
 * Parse user/OCR input back to an integer amount. Strips every non-digit
 * (spaces, "FCFA", "F", separators) and an optional leading minus.
 * "12 500 FCFA" -> 12500, "1.250" -> 1250, "" -> 0.
 */
export function parseXOF(input: string): XOF {
  if (!input) return 0;
  const negative = /^\s*-/.test(input);
  const digits = input.replace(/[^\d]/g, "");
  if (!digits) return 0;
  const value = Number.parseInt(digits, 10);
  if (!Number.isFinite(value)) return 0;
  return negative ? -value : value;
}
