"use client";

import { useCallback, useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { currency, dateTime } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { lineOptions, lineTotal } from "@/lib/cart";
import type { Order } from "@/lib/types";
import { SearchIcon } from "@/components/icons";
import PageHeader from "@/components/PageHeader";

export default function OrdersPage() {
  const { orders, branches, paymentMethods } = useStore();
  const { t, locale } = useI18n();
  const methodLabel = useCallback(
    (id: string) => paymentMethods.find((m) => m.id === id)?.label ?? id,
    [paymentMethods]
  );
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return orders;
    return orders.filter(
      (o) =>
        String(o.number).includes(q) ||
        methodLabel(o.method).toLowerCase().includes(q) ||
        o.cashier.toLowerCase().includes(q) ||
        o.lines.some((l) => l.name.toLowerCase().includes(q))
    );
  }, [orders, query, methodLabel]);

  const active: Order | null =
    filtered.find((o) => o.id === selectedId) ?? filtered[0] ?? null;

  return (
    <div className="flex h-full">
      <section className="flex min-w-0 flex-1 flex-col">
        <PageHeader title={t("nav.orders")} subtitle={t("orders.subtitle", { count: orders.length })}>
          <div className="relative w-64">
            <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("orders.searchPlaceholder")}
              className="h-12 w-full rounded-2xl border border-line bg-surface pl-11 pr-4 text-[15px] outline-none transition-colors placeholder:text-muted focus:border-neutral-900 focus:bg-white"
            />
          </div>
        </PageHeader>

        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="grid h-full place-items-center bg-surface px-6 text-center">
              <div className="max-w-sm">
                <div className="mx-auto h-14 w-14 rounded-2xl border border-dashed border-neutral-300" />
                <p className="mt-5 text-[15px] font-medium">{t("orders.none")}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">
                  {t("orders.noneHint")}
                </p>
              </div>
            </div>
          ) : (
            <table className="w-full text-[15px]">
              <thead className="sticky top-0 z-10 bg-white">
                <tr className="border-b border-line text-left text-xs uppercase tracking-wider text-muted">
                  <th className="px-6 py-3.5 font-medium">{t("orders.colOrder")}</th>
                  <th className="px-6 py-3.5 font-medium">{t("orders.colTime")}</th>
                  <th className="px-6 py-3.5 font-medium">{t("orders.colCashier")}</th>
                  <th className="px-6 py-3.5 font-medium">{t("orders.colItems")}</th>
                  <th className="px-6 py-3.5 font-medium">{t("orders.colPayment")}</th>
                  <th className="px-6 py-3.5 text-right font-medium">{t("common.total")}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((o) => (
                  <tr
                    key={o.id}
                    onClick={() => setSelectedId(o.id)}
                    className={[
                      "cursor-pointer border-b border-line transition-colors",
                      active?.id === o.id ? "bg-neutral-100" : "hover:bg-surface",
                    ].join(" ")}
                  >
                    <td className="px-6 py-4 font-semibold tabular-nums">#{o.number}</td>
                    <td className="px-6 py-4 text-sm text-muted">{dateTime(o.createdAt, locale)}</td>
                    <td className="px-6 py-4 text-sm">{o.cashier}</td>
                    <td className="px-6 py-4 tabular-nums">
                      {o.lines.reduce((s, l) => s + l.qty, 0)}
                    </td>
                    <td className="px-6 py-4">
                      <span className="rounded-full border border-line px-3 py-1 text-xs font-medium">
                        {methodLabel(o.method)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-semibold tabular-nums">
                      {currency(o.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      <aside className="hidden w-[380px] shrink-0 flex-col border-l border-line xl:flex">
        {active ? (
          <>
            <header className="flex h-[92px] shrink-0 items-center border-b border-line px-6">
              <div>
                <h2 className="text-lg font-semibold tracking-tight">{t("pay.orderRef", { number: active.number })}</h2>
                <p className="text-sm text-muted">{dateTime(active.createdAt, locale)}</p>
              </div>
            </header>
            <div className="flex-1 overflow-y-auto bg-surface p-6">
              <div className="rounded-2xl border border-line bg-white p-5 font-mono text-[13px]">
                <p className="text-center text-[11px] uppercase tracking-widest text-muted">
                  {branches.find((b) => b.id === active.branchId)?.name ?? "—"}
                </p>
                <p className="mt-1 text-center text-[11px] text-muted">{active.cashier}</p>
                <div className="my-3 border-t border-dashed border-neutral-300" />
                {active.lines.map((l) => (
                  <div key={l.id} className="flex justify-between py-1">
                    <span className="truncate pr-3">
                      {l.qty} × {l.name} <span className="text-muted">({lineOptions(l)})</span>
                    </span>
                    <span>{currency(lineTotal(l))}</span>
                  </div>
                ))}
                <div className="my-3 border-t border-dashed border-neutral-300" />
                <R label={t("common.subtotal")} v={currency(active.subtotal)} />
                {active.discount > 0 && (
                  <R
                    label={
                      active.discountMode === "percent"
                        ? t("orders.discountPercent", { value: active.discountValue })
                        : t("common.discount")
                    }
                    v={`-${currency(active.discount)}`}
                  />
                )}
                <div className="my-3 border-t border-dashed border-neutral-300" />
                <R label={t("common.total")} v={currency(active.total)} bold />
                <R label={t("pay.paidWith", { method: methodLabel(active.method) })} v={currency(active.paid)} />
                <R label={t("pay.change")} v={currency(active.change)} />
              </div>
            </div>
          </>
        ) : (
          <div className="grid h-full place-items-center bg-surface px-10 text-center text-sm text-muted">
            {t("orders.selectHint")}
          </div>
        )}
      </aside>
    </div>
  );
}

function R({ label, v, bold }: { label: string; v: string; bold?: boolean }) {
  return (
    <div className={`flex justify-between py-0.5 ${bold ? "font-semibold" : ""}`}>
      <span>{label}</span>
      <span>{v}</span>
    </div>
  );
}
