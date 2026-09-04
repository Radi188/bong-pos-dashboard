"use client";

import { useMemo } from "react";
import { useStore } from "@/lib/store";
import { clockTime, currency, isToday, orderRef } from "@/lib/format";
import { lineTotal } from "@/lib/cart";
import { useI18n } from "@/lib/i18n";
import ShiftControls from "@/components/ShiftControls";
import StatusCluster from "@/components/StatusCluster";
import ShopIdentity from "@/components/ShopIdentity";
import { CardIcon, ChartIcon, ReceiptIcon, StarIcon } from "@/components/icons";

export default function DashboardPage() {
  const { orders, branches, branch } = useStore();
  const { t } = useI18n();

  const today = useMemo(() => orders.filter((o) => isToday(o.createdAt)), [orders]);
  const revenue = today.reduce((s, o) => s + o.total, 0);
  const avg = today.length ? revenue / today.length : 0;

  /** 7am through the current hour, never fewer than eight bars. */
  const hourly = useMemo(() => {
    const last = Math.max(new Date().getHours(), 14);
    const hours = Array.from({ length: last - 7 + 1 }, (_, i) => ({ hour: i + 7, value: 0 }));
    for (const o of today) {
      const b = hours.find((h) => h.hour === new Date(o.createdAt).getHours());
      if (b) b.value += o.total;
    }
    return hours;
  }, [today]);
  const peak = Math.max(...hourly.map((h) => h.value), 1);

  const topItems = useMemo(() => {
    const map = new Map<string, { name: string; qty: number; revenue: number }>();
    for (const o of orders) {
      for (const l of o.lines) {
        const cur = map.get(l.productId) ?? { name: l.name, qty: 0, revenue: 0 };
        cur.qty += l.qty;
        cur.revenue += lineTotal(l);
        map.set(l.productId, cur);
      }
    }
    return [...map.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  }, [orders]);
  const topMax = Math.max(...topItems.map((p) => p.revenue), 1);

  const recent = orders.slice(0, 5);
  const branchName = (id: string) => branches.find((b) => b.id === id)?.name ?? branch.name;

  return (
    <div className="flex h-full flex-col">
      <header className="@container flex h-[92px] shrink-0 items-center gap-3 border-b border-line px-6">
        <ShopIdentity />
        <div className="ml-auto flex items-center gap-3">
          <ShiftControls />
          <StatusCluster />
        </div>
      </header>

      <div className="flex-1 overflow-y-auto bg-surface p-6">
        {/* KPIs */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Stat
            primary
            Icon={CardIcon}
            label={t("dash.revenue")}
            value={currency(revenue)}
            hint={t("dash.hintToday")}
          />
          <Stat
            Icon={ReceiptIcon}
            label={t("dash.totalOrders")}
            value={String(today.length)}
            hint={t("dash.hintToday")}
          />
          <Stat
            Icon={ChartIcon}
            label={t("dash.avgOrder")}
            value={currency(avg)}
            hint={t("dash.hintSteady")}
          />
          <Stat
            Icon={StarIcon}
            label={t("dash.satisfaction")}
            value="4.8"
            hint={t("dash.hintWeek")}
            trend="up"
          />
        </div>

        {/* Charts */}
        <div className="mt-4 grid gap-4 xl:grid-cols-2">
          <Card title={t("dash.hourly")}>
            <div className="mt-7 flex h-56 items-end gap-3">
              {hourly.map((h) => (
                <div key={h.hour} className="group relative flex h-full flex-1 items-end">
                  <div
                    className="w-full rounded-md bg-neutral-900 transition-opacity group-hover:opacity-80"
                    style={{ height: `${Math.max((h.value / peak) * 100, 1.5)}%` }}
                  />
                  <div className="pointer-events-none absolute bottom-full left-1/2 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-neutral-900 px-2.5 py-1.5 text-xs font-medium text-white group-hover:block">
                    {currency(h.value)}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 flex gap-3">
              {hourly.map((h) => (
                <span key={h.hour} className="flex-1 text-center text-xs text-muted">
                  {h.hour % 12 || 12}
                  {h.hour < 12 ? "am" : "pm"}
                </span>
              ))}
            </div>
          </Card>

          <Card title={t("dash.topItems")}>
            {topItems.length === 0 ? (
              <p className="mt-6 text-sm text-muted">{t("dash.noSales")}</p>
            ) : (
              <ol className="mt-5 space-y-5">
                {topItems.map((p, i) => (
                  <li key={p.name} className="flex items-start gap-4">
                    <span className="w-4 shrink-0 pt-0.5 text-sm tabular-nums text-neutral-400">
                      {i + 1}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline justify-between gap-4">
                        <span className="truncate text-[15px] font-semibold tracking-tight">
                          {p.name}
                        </span>
                        <span className="shrink-0 text-right">
                          <span className="block text-xs text-muted">{t("dash.sold", { qty: p.qty })}</span>
                        </span>
                      </span>
                      <span className="mt-2 flex items-center gap-4">
                        <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-neutral-100">
                          <span
                            className="block h-full rounded-full bg-neutral-900"
                            style={{ width: `${(p.revenue / topMax) * 100}%` }}
                          />
                        </span>
                        <span className="shrink-0 text-base font-bold tabular-nums">
                          {currency(p.revenue)}
                        </span>
                      </span>
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </Card>
        </div>

        {/* Recent orders */}
        <div className="mt-4 rounded-3xl bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)] ring-1 ring-black/[0.04]">
          <h2 className="text-lg font-bold tracking-tight">{t("dash.recent")}</h2>
          {recent.length === 0 ? (
            <p className="mt-6 text-sm text-muted">
              {t("dash.recentEmpty")}
            </p>
          ) : (
            <div className="-mx-2 mt-5 overflow-x-auto">
              <table className="w-full min-w-[640px] text-[15px]">
                <thead>
                  <tr className="border-b border-line text-left text-sm text-muted">
                    <th className="px-2 pb-3 font-normal">{t("dash.colOrderId")}</th>
                    <th className="px-2 pb-3 font-normal">{t("orders.colCashier")}</th>
                    <th className="px-2 pb-3 font-normal">{t("orders.colItems")}</th>
                    <th className="px-2 pb-3 font-normal">{t("orders.colTime")}</th>
                    <th className="px-2 pb-3 text-right font-normal">{t("common.total")}</th>
                    <th className="px-2 pb-3 text-right font-normal">{t("common.status")}</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((o) => (
                    <tr key={o.id} className="border-b border-line last:border-0">
                      <td className="px-2 py-4 font-bold tracking-tight">
                        {orderRef(o.createdAt, o.number, branchName(o.branchId))}
                      </td>
                      <td className="px-2 py-4 text-neutral-600">{o.cashier}</td>
                      <td className="px-2 py-4 tabular-nums text-neutral-600">
                        {o.lines.reduce((s, l) => s + l.qty, 0)}
                      </td>
                      <td className="px-2 py-4 tabular-nums text-neutral-600">
                        {clockTime(o.createdAt)}
                      </td>
                      <td className="px-2 py-4 text-right font-semibold tabular-nums">
                        {currency(o.total)}
                      </td>
                      <td className="px-2 py-4 text-right">
                        <span className="rounded-lg bg-emerald-50 px-2.5 py-1 text-sm font-medium text-emerald-600">
                          {t("dash.completed")}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)] ring-1 ring-black/[0.04]">
      <h2 className="text-lg font-bold tracking-tight">{title}</h2>
      {children}
    </section>
  );
}

function Stat({
  Icon,
  label,
  value,
  hint,
  primary,
  trend,
}: {
  Icon: (p: { className?: string }) => React.ReactElement;
  label: string;
  value: string;
  hint: string;
  primary?: boolean;
  trend?: "up";
}) {
  return (
    <div
      className={[
        "flex items-center gap-4 rounded-3xl p-5",
        primary
          ? "bg-neutral-900 text-white"
          : "bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)] ring-1 ring-black/[0.04]",
      ].join(" ")}
    >
      <span
        className={[
          "grid h-14 w-14 shrink-0 place-items-center rounded-2xl",
          primary ? "bg-white/10 text-white" : "bg-neutral-100 text-neutral-700",
        ].join(" ")}
      >
        <Icon className="h-6 w-6" />
      </span>
      <span className="min-w-0">
        <span className={`block text-[15px] ${primary ? "text-neutral-300" : "text-neutral-500"}`}>
          {label}
        </span>
        <span className="mt-0.5 block text-3xl font-bold tracking-tight tabular-nums">{value}</span>
        <span
          className={`mt-0.5 block text-sm ${primary ? "text-neutral-400" : "text-neutral-400"}`}
        >
          {trend === "up" ? "↑" : "→"} {hint}
        </span>
      </span>
    </div>
  );
}
