/** Display helpers built on the canonical money formatter. */

import { formatXOF, type XOF } from "../lib/money";

/** Grouped integer, no suffix: 94000 -> "94 000". */
export function fmtN(n: XOF): string {
  return formatXOF(n, { suffix: false });
}

/** Grouped integer with the FCFA suffix: 94000 -> "94 000 FCFA". */
export function fmtFCFA(n: XOF): string {
  return formatXOF(n);
}
