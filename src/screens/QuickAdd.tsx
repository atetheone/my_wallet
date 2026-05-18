import { useEffect, useState } from "react";
import { useStore } from "../state/store";
import { addExpense, listCategories, type Category } from "../db/repo";
import { formatXOF } from "../lib/money";
import { navigate } from "../lib/router";
import { t } from "../i18n";

/** Sub-5-second capture: amount pad first, then category + method. */
export function QuickAdd() {
  const { reload } = useStore();
  const [amount, setAmount] = useState(0);
  const [cats, setCats] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [method, setMethod] = useState<"cash" | "wave">("cash");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    listCategories().then((c) => {
      setCats(c);
      setCategoryId(c[0]?.id ?? null);
    });
  }, []);

  function press(d: string) {
    if (d === "⌫") return setAmount((a) => Math.floor(a / 10));
    setAmount((a) => Math.min(a * 10 + Number(d), 999_999_999));
  }

  async function save() {
    if (amount <= 0) return;
    setBusy(true);
    await addExpense({
      date: Date.now(),
      amount,
      category_id: categoryId,
      method,
      note: note || null,
      receipt: null,
    });
    await reload();
    navigate("home");
  }

  return (
    <div className="screen">
      <div className="amount-display">{formatXOF(amount)}</div>

      <div className="keypad">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9", "00", "0", "⌫"].map(
          (k) => (
            <button key={k} className="key" onClick={() => press(k)}>
              {k}
            </button>
          ),
        )}
      </div>

      <div className="chips">
        {cats.map((c) => (
          <button
            key={c.id}
            className={`chip ${categoryId === c.id ? "on" : ""}`}
            onClick={() => setCategoryId(c.id)}
          >
            {c.name}
          </button>
        ))}
      </div>

      <div className="seg">
        <button
          className={method === "cash" ? "on" : ""}
          onClick={() => setMethod("cash")}
        >
          {t("cash")}
        </button>
        <button
          className={method === "wave" ? "on" : ""}
          onClick={() => setMethod("wave")}
        >
          {t("wave")}
        </button>
      </div>

      <input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder={t("note")}
      />

      <div className="actions">
        <button onClick={() => navigate("home")}>{t("cancel")}</button>
        <button
          className="primary"
          disabled={busy || amount <= 0}
          onClick={save}
        >
          {t("save")}
        </button>
      </div>
    </div>
  );
}
