/**
 * Single app store: boots the DB, runs migrations, exposes settings + the
 * derived safe-to-spend snapshot, and a `reload()` to re-pull after writes.
 */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { migrate } from "../db/schema";
import {
  getSettings,
  periodTotals,
  listGoals,
  categoryBreakdown,
  type Settings,
  type Goal,
  type CategoryTotal,
} from "../db/repo";
import { periodFor, daysRemaining } from "../lib/period";
import { computeSafeToSpend, type SafeToSpendResult } from "../lib/safeToSpend";
import type { XOF } from "../lib/money";

interface Snapshot {
  settings: Settings;
  safe: SafeToSpendResult;
  goals: Goal[];
  periodDays: number;
  /** Variable spending logged so far this period. */
  spent: XOF;
  /** Money budgeted for spending this period (income − savings − fixed). */
  budget: XOF;
  /** Whole days left in the period (>= 1). */
  daysRemaining: number;
  /** e.g. "mai 2026" — the current period's month. */
  monthLabel: string;
  /** e.g. "31 mai" — last spendable day of the period. */
  periodEndLabel: string;
  /** Category totals for the current period, biggest first. */
  breakdown: CategoryTotal[];
}

interface Store {
  ready: boolean;
  error: string | null;
  snap: Snapshot | null;
  unlocked: boolean;
  unlock: () => void;
  reload: () => Promise<void>;
}

const Ctx = createContext<Store | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [snap, setSnap] = useState<Snapshot | null>(null);
  const [unlocked, setUnlocked] = useState(false);

  async function load(): Promise<Snapshot> {
    const settings = await getSettings();
    const now = new Date();
    const totals = await periodTotals(now, settings.salary_day);
    const goals = await listGoals();
    const breakdown = await categoryBreakdown(now, settings.salary_day);
    const { totalDays, end } = periodFor(now, settings.salary_day);
    const left = daysRemaining(now, settings.salary_day);
    const safe = computeSafeToSpend({
      fixedIncome: settings.fixed_income,
      extraIncomeReceived: totals.extraIncome,
      savingsCommitment: settings.savings_commitment,
      fixedCostsTotal: totals.fixedCostsTotal,
      spentThisPeriod: totals.spent,
      daysRemaining: left,
    });
    const budget =
      settings.fixed_income +
      Math.max(0, totals.extraIncome) -
      settings.savings_commitment -
      totals.fixedCostsTotal;
    // Last spendable day = day before the exclusive period end.
    const lastDay = new Date(end.getTime() - 24 * 60 * 60 * 1000);
    const monthLabel = now.toLocaleDateString("fr-FR", {
      month: "long",
      year: "numeric",
    });
    const periodEndLabel = lastDay.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
    });
    return {
      settings,
      safe,
      goals,
      periodDays: totalDays,
      spent: totals.spent,
      budget,
      daysRemaining: left,
      monthLabel,
      periodEndLabel,
      breakdown,
    };
  }

  async function reload() {
    setSnap(await load());
  }

  useEffect(() => {
    (async () => {
      try {
        await migrate();
        setSnap(await load());
        setReady(true);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
        setReady(true);
      }
    })();
  }, []);

  return (
    <Ctx.Provider
      value={{
        ready,
        error,
        snap,
        unlocked,
        unlock: () => setUnlocked(true),
        reload,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useStore(): Store {
  const s = useContext(Ctx);
  if (!s) throw new Error("useStore must be used within AppProvider");
  return s;
}
