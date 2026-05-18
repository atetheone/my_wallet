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
  type Settings,
  type Goal,
} from "../db/repo";
import { periodFor, daysRemaining } from "../lib/period";
import { computeSafeToSpend, type SafeToSpendResult } from "../lib/safeToSpend";

interface Snapshot {
  settings: Settings;
  safe: SafeToSpendResult;
  goals: Goal[];
  periodDays: number;
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
    const { totalDays } = periodFor(now, settings.salary_day);
    const safe = computeSafeToSpend({
      fixedIncome: settings.fixed_income,
      extraIncomeReceived: totals.extraIncome,
      savingsCommitment: settings.savings_commitment,
      fixedCostsTotal: totals.fixedCostsTotal,
      spentThisPeriod: totals.spent,
      daysRemaining: daysRemaining(now, settings.salary_day),
    });
    return { settings, safe, goals, periodDays: totalDays };
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
