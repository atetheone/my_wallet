import { useEffect, useState } from "react";
import { useStore } from "../state/store";
import {
  listExpenses,
  listCategories,
  type Expense,
} from "../db/repo";
import { fmtN } from "../ui/format";
import { catMeta } from "../ui/cats";
import { Icon } from "../ui/Icon";
import { t } from "../i18n";
import { ExpenseDetail } from "./ExpenseDetail";

const DAY_KEY = (ms: number) => {
  const d = new Date(ms);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
};
const dayLabel = (ms: number) =>
  new Date(ms).toLocaleDateString("fr-FR", { day: "numeric", month: "long" });

export function History() {
  const { snap, reload } = useStore();
  const [view, setView] = useState<"liste" | "categories">("liste");
  const [items, setItems] = useState<Expense[]>([]);
  const [catName, setCatName] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<Expense | null>(null);

  async function refresh() {
    setItems(await listExpenses());
    const cs = await listCategories();
    setCatName(Object.fromEntries(cs.map((c) => [c.id, c.name])));
  }
  useEffect(() => {
    refresh();
  }, []);

  const nameOf = (e: Expense) =>
    (e.category_id && catName[e.category_id]) || "Divers";

  const total = items.reduce((s, e) => s + e.amount, 0);

  // group by day (items already DESC by date)
  const groups: { key: string; label: string; rows: Expense[] }[] = [];
  for (const e of items) {
    const key = DAY_KEY(e.date);
    let g = groups.find((x) => x.key === key);
    if (!g) {
      g = { key, label: dayLabel(e.date), rows: [] };
      groups.push(g);
    }
    g.rows.push(e);
  }
  const avgPerDay = groups.length ? Math.round(total / groups.length) : 0;

  // category breakdown
  const byCat: Record<string, { name: string; total: number; count: number }> =
    {};
  for (const e of items) {
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
          <span className="x-num">{fmtN(total)}</span>{" "}
          <span style={{ fontSize: 16, color: "var(--x-ink-3)" }}>FCFA</span>
        </div>
        <div style={{ fontSize: 13, color: "var(--x-ink-3)", marginTop: 2 }}>
          {items.length} {t("expensesWord")} · {fmtN(avgPerDay)} FCFA{" "}
          {t("perDayAvg")}
        </div>
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
            {t("noExpenses")}
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
                <span className="x-num">
                  {fmtN(g.rows.reduce((s, d) => s + d.amount, 0))} FCFA
                </span>
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
                {g.rows.map((d, i) => {
                  const n = nameOf(d);
                  const m = catMeta(n);
                  return (
                    <div
                      key={d.id}
                      onClick={() => setSelected(d)}
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
                          {d.note || n}
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
                            className={"x-chip " + d.method}
                            style={{ padding: "2px 7px", fontSize: 10 }}
                          >
                            <Icon
                              name={d.method === "wave" ? "wave" : "cash"}
                              size={11}
                              stroke={1.8}
                            />
                            {d.method === "wave" ? t("wave") : t("cash")}
                          </span>
                        </div>
                      </div>
                      <div
                        className="x-num"
                        style={{ fontSize: 15, fontWeight: 600 }}
                      >
                        −{fmtN(d.amount)}
                      </div>
                      <Icon name="chevron-right" size={14} stroke={1.6} color="var(--x-ink-4)" />
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

        {selected && (
          <ExpenseDetail
            expense={selected}
            catName={catName}
            onClose={() => setSelected(null)}
            onSaved={async () => { setSelected(null); await refresh(); await reload(); }}
          />
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
                      flexBasis: `${(c.total / total) * 100}%`,
                      background: catMeta(c.name).fg,
                    }}
                  />
                ))}
              </div>
            </div>
            {catTotals.map((c) => {
              const m = catMeta(c.name);
              const pct = Math.round((c.total / total) * 100);
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
