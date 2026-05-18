import { useEffect, useState } from "react";
import { useStore } from "../state/store";
import {
  listExpenses,
  deleteExpense,
  categoryBreakdown,
  type Expense,
  type CategoryTotal,
} from "../db/repo";
import { formatXOF } from "../lib/money";
import { t } from "../i18n";

export function History() {
  const { snap, reload } = useStore();
  const [items, setItems] = useState<Expense[]>([]);
  const [breakdown, setBreakdown] = useState<CategoryTotal[]>([]);

  async function refresh() {
    setItems(await listExpenses());
    if (snap)
      setBreakdown(
        await categoryBreakdown(new Date(), snap.settings.salary_day),
      );
  }
  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snap?.settings.salary_day]);

  async function remove(id: string) {
    await deleteExpense(id);
    await refresh();
    await reload();
  }

  return (
    <div className="screen scroll">
      <h1>{t("history")}</h1>

      <h2>{t("byCategory")}</h2>
      {breakdown.length === 0 && <p className="muted">{t("noExpenses")}</p>}
      {breakdown.map((b) => (
        <div key={b.category_id ?? "none"} className="row card">
          <span>{b.name}</span>
          <strong>{formatXOF(b.total)}</strong>
        </div>
      ))}

      <h2>{t("history")}</h2>
      {items.map((e) => (
        <div key={e.id} className="row card">
          <div>
            <div>{new Date(e.date).toLocaleDateString("fr-FR")}</div>
            <small className="muted">
              {e.method === "wave" ? t("wave") : t("cash")}
              {e.note ? ` · ${e.note}` : ""}
            </small>
          </div>
          <div className="row">
            <strong>{formatXOF(e.amount)}</strong>
            <button className="link" onClick={() => remove(e.id)}>
              {t("delete")}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
