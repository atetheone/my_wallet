import { useEffect, useState } from "react";
import { useStore } from "../state/store";
import {
  listExpenses,
  listCategories,
  listExtraIncome,
  type Expense,
  type ExtraIncome,
} from "../db/repo";
import { fmtN } from "../ui/format";
import { catMeta } from "../ui/cats";
import { Icon } from "../ui/Icon";
import { t } from "../i18n";
import { ExpenseDetail } from "./ExpenseDetail";
import { IncomeDetail } from "./IncomeDetail";

const DAY_KEY = (ms: number) => {
  const d = new Date(ms);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
};
const dayLabel = (ms: number) =>
  new Date(ms).toLocaleDateString("fr-FR", { day: "numeric", month: "long" });

type ExpenseRow = Expense & { _kind: "expense" };
type IncomeRow = ExtraIncome & { _kind: "income" };
type SalaryRow = { _kind: "salary"; id: string; date: number; amount: number; note: null };
type HistoryRow = ExpenseRow | IncomeRow | SalaryRow;

function currentSalaryDate(salaryDay: number): number {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth(), salaryDay);
  if (d.getMonth() !== now.getMonth()) d.setDate(0);
  return d.getTime();
}

export function History() {
  const { snap, reload } = useStore();
  const [view, setView] = useState<"liste" | "categories">("liste");
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [incomes, setIncomes] = useState<ExtraIncome[]>([]);
  const [catName, setCatName] = useState<Record<string, string>>({});
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [selectedIncome, setSelectedIncome] = useState<ExtraIncome | null>(null);

  async function refresh() {
    const [exps, incs, cs] = await Promise.all([
      listExpenses(),
      listExtraIncome(),
      listCategories(),
    ]);
    setExpenses(exps);
    setIncomes(incs);
    setCatName(Object.fromEntries(cs.map((c) => [c.id, c.name])));
  }
  useEffect(() => {
    refresh();
  }, []);

  const nameOf = (e: Expense) =>
    (e.category_id && catName[e.category_id]) || "Divers";

  // Synthetic salary row for current period
  const salaryRow: SalaryRow[] =
    snap && snap.settings.fixed_income > 0
      ? [{
          _kind: "salary",
          id: "salary-synthetic",
          date: currentSalaryDate(snap.settings.salary_day),
          amount: snap.settings.fixed_income,
          note: null,
        }]
      : [];

  const items: HistoryRow[] = [
    ...expenses.map((e): ExpenseRow => ({ ...e, _kind: "expense" })),
    ...incomes.map((i): IncomeRow => ({ ...i, _kind: "income" })),
    ...salaryRow,
  ].sort((a, b) => b.date - a.date);

  const expenseTotal = expenses.reduce((s, e) => s + e.amount, 0);
  const incomeTotal =
    incomes.reduce((s, i) => s + i.amount, 0) + (salaryRow[0]?.amount ?? 0);

  // group by day
  const groups: { key: string; label: string; rows: HistoryRow[]; expenseSum: number }[] = [];
  for (const row of items) {
    const key = DAY_KEY(row.date);
    let g = groups.find((x) => x.key === key);
    if (!g) {
      g = { key, label: dayLabel(row.date), rows: [], expenseSum: 0 };
      groups.push(g);
    }
    g.rows.push(row);
    if (row._kind === "expense") g.expenseSum += row.amount;
  }
  const avgPerDay = groups.length ? Math.round(expenseTotal / groups.length) : 0;

  // category breakdown (expenses only)
  const byCat: Record<string, { name: string; total: number; count: number }> = {};
  for (const e of expenses) {
    const n = nameOf(e);
    (byCat[n] ??= { name: n, total: 0, count: 0 });
    byCat[n].total += e.amount;
    byCat[n].count += 1;
  }
  const catTotals = Object.values(byCat).sort((a, b) => b.total - a.total);

  return (
    <div className="x-screen">
      <div
        style={{
          padding: "calc(14px + env(safe-area-inset-top,0px)) 22px 6px",
        }}
      >
        <div className="x-eyebrow">
          {t("history")} ·{" "}
          <span style={{ textTransform: "capitalize" }}>
            {snap?.monthLabel}
          </span>
        </div>
        <div className="x-screen-title" style={{ marginTop: 4 }}>
          <span className="x-num">{fmtN(expenseTotal)}</span>{" "}
          <span style={{ fontSize: 16, color: "var(--x-ink-3)" }}>FCFA</span>
        </div>
        <div style={{ fontSize: 13, color: "var(--x-ink-3)", marginTop: 2 }}>
          {expenses.length} {t("expensesWord")} · {fmtN(avgPerDay)} FCFA{" "}
          {t("perDayAvg")}
        </div>
        {incomeTotal > 0 && (
          <div style={{ fontSize: 13, color: "var(--x-sage)", marginTop: 2, fontWeight: 500 }}>
            +{fmtN(incomeTotal)} FCFA {t("totalIncome")}
          </div>
        )}
      </div>

      <div style={{ padding: "10px 22px 6px" }}>
        <div
          style={{
            display: "flex",
            background: "var(--x-paper)",
            borderRadius: 12,
            padding: 4,
            border: "1px solid var(--x-line)",
          }}
        >
          {(
            [
              { id: "liste", label: t("listTab") },
              { id: "categories", label: t("categoriesTab") },
            ] as const
          ).map((tab) => {
            const sel = tab.id === view;
            return (
              <button
                key={tab.id}
                onClick={() => setView(tab.id)}
                style={{
                  flex: 1,
                  padding: "8px 10px",
                  background: sel ? "var(--x-ink)" : "transparent",
                  color: sel ? "var(--x-paper)" : "var(--x-ink-2)",
                  border: "none",
                  borderRadius: 9,
                  cursor: "pointer",
                  fontFamily: "var(--x-font-body)",
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="x-body" style={{ padding: "4px 14px 20px" }}>
        {items.length === 0 && (
          <p
            style={{
              color: "var(--x-ink-3)",
              padding: "20px 4px",
              fontSize: 14,
              textAlign: "center",
            }}
          >
            {t("noTransactions")}
          </p>
        )}

        {view === "liste" &&
          groups.map((g) => (
            <div key={g.key} style={{ marginTop: 12 }}>
              <div
                className="x-eyebrow"
                style={{
                  position: "sticky",
                  top: 0,
                  padding: "6px 8px",
                  background: "var(--x-cream)",
                  display: "flex",
                  justifyContent: "space-between",
                  zIndex: 1,
                }}
              >
                <span>{g.label}</span>
                {g.expenseSum > 0 && (
                  <span className="x-num">
                    {fmtN(g.expenseSum)} FCFA
                  </span>
                )}
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  background: "var(--x-paper)",
                  borderRadius: 16,
                  overflow: "hidden",
                  border: "1px solid var(--x-line)",
                }}
              >
                {g.rows.map((row, i) => {
                  if (row._kind === "expense") {
                    const n = nameOf(row);
                    const m = catMeta(n);
                    return (
                      <div
                        key={row.id}
                        onClick={() => setSelectedExpense(row)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                          padding: "12px 14px",
                          borderBottom:
                            i < g.rows.length - 1
                              ? "1px solid var(--x-line)"
                              : "none",
                          cursor: "pointer",
                        }}
                      >
                        <div
                          className="x-icon-circle"
                          style={{
                            width: 38,
                            height: 38,
                            borderRadius: 12,
                            background: m.bg,
                            color: m.fg,
                          }}
                        >
                          <Icon name={m.icon} size={18} stroke={1.7} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              fontSize: 14,
                              fontWeight: 500,
                              color: "var(--x-ink)",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {row.note || n}
                          </div>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 6,
                              marginTop: 3,
                            }}
                          >
                            <span
                              style={{ fontSize: 11, color: "var(--x-ink-3)" }}
                            >
                              {n}
                            </span>
                            <span
                              style={{ fontSize: 11, color: "var(--x-ink-4)" }}
                            >
                              ·
                            </span>
                            <span
                              className={"x-chip " + row.method}
                              style={{ padding: "2px 7px", fontSize: 10 }}
                            >
                              <Icon
                                name={row.method === "wave" ? "wave" : "cash"}
                                size={11}
                                stroke={1.8}
                              />
                              {row.method === "wave" ? t("wave") : t("cash")}
                            </span>
                          </div>
                        </div>
                        <div
                          className="x-num"
                          style={{ fontSize: 15, fontWeight: 600 }}
                        >
                          −{fmtN(row.amount)}
                        </div>
                        <Icon name="chevron-right" size={14} stroke={1.6} color="var(--x-ink-4)" />
                      </div>
                    );
                  }

                  // income or salary row
                  const isFixed = row._kind === "salary";
                  const label = isFixed
                    ? t("salary")
                    : (row.note || t("toggleIncome"));
                  return (
                    <div
                      key={row.id}
                      onClick={isFixed ? undefined : () => setSelectedIncome(row as ExtraIncome)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        padding: "12px 14px",
                        borderBottom:
                          i < g.rows.length - 1
                            ? "1px solid var(--x-line)"
                            : "none",
                        cursor: isFixed ? "default" : "pointer",
                      }}
                    >
                      <div
                        className="x-icon-circle"
                        style={{
                          width: 38,
                          height: 38,
                          borderRadius: 12,
                          background: "rgba(92,127,60,0.12)",
                          color: "var(--x-sage)",
                        }}
                      >
                        <Icon name="income" size={18} stroke={1.7} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: 14,
                            fontWeight: 500,
                            color: "var(--x-ink)",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {label}
                        </div>
                        {isFixed && (
                          <span
                            style={{
                              display: "inline-block",
                              marginTop: 3,
                              fontSize: 10,
                              fontWeight: 700,
                              color: "var(--x-sage)",
                              background: "rgba(92,127,60,0.12)",
                              padding: "1px 6px",
                              borderRadius: 99,
                            }}
                          >
                            {t("fixedBadge")}
                          </span>
                        )}
                      </div>
                      <div
                        className="x-num"
                        style={{ fontSize: 15, fontWeight: 600, color: "var(--x-sage)" }}
                      >
                        +{fmtN(row.amount)}
                      </div>
                      {!isFixed && (
                        <Icon name="chevron-right" size={14} stroke={1.6} color="var(--x-ink-4)" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

        {selectedExpense && (
          <ExpenseDetail
            expense={selectedExpense}
            catName={catName}
            onClose={() => setSelectedExpense(null)}
            onSaved={async () => { setSelectedExpense(null); await refresh(); await reload(); }}
          />
        )}
        {selectedIncome && (
          <IncomeDetail
            income={selectedIncome}
            onClose={() => setSelectedIncome(null)}
            onSaved={async () => { setSelectedIncome(null); await refresh(); await reload(); }}
          />
        )}

        {view === "categories" && catTotals.length === 0 && (
          <div
            style={{
              padding: "40px 20px",
              textAlign: "center",
              color: "var(--x-ink-3)",
              fontSize: 14,
            }}
          >
            {t("noExpenses")}
          </div>
        )}
        {view === "categories" && catTotals.length > 0 && (
          <div
            style={{
              marginTop: 14,
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            <div className="x-card" style={{ padding: 16 }}>
              <div className="x-eyebrow">{t("distribution")}</div>
              <div
                style={{
                  display: "flex",
                  height: 12,
                  marginTop: 12,
                  borderRadius: 6,
                  overflow: "hidden",
                  gap: 2,
                }}
              >
                {catTotals.map((c) => (
                  <div
                    key={c.name}
                    style={{
                      flexBasis: `${(c.total / expenseTotal) * 100}%`,
                      background: catMeta(c.name).fg,
                    }}
                  />
                ))}
              </div>
            </div>
            {catTotals.map((c) => {
              const m = catMeta(c.name);
              const pct = Math.round((c.total / expenseTotal) * 100);
              return (
                <div
                  key={c.name}
                  className="x-card"
                  style={{ padding: "14px 16px" }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                    }}
                  >
                    <div
                      className="x-icon-circle"
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 12,
                        background: m.bg,
                        color: m.fg,
                      }}
                    >
                      <Icon name={m.icon} size={20} stroke={1.7} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>
                        {c.name}
                      </div>
                      <div
                        style={{ fontSize: 12, color: "var(--x-ink-3)" }}
                      >
                        {c.count} {t("expensesWord")}
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div
                        className="x-num"
                        style={{ fontSize: 16, fontWeight: 700 }}
                      >
                        {fmtN(c.total)}
                      </div>
                      <div
                        className="x-num"
                        style={{ fontSize: 11, color: "var(--x-ink-3)" }}
                      >
                        {pct}%
                      </div>
                    </div>
                  </div>
                  <div className="x-bar" style={{ marginTop: 10, height: 5 }}>
                    <i style={{ background: m.fg, width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
