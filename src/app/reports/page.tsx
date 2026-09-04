"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { useI18n, type TranslationKey } from "@/lib/i18n";
import { clockTime, currency, orderRef } from "@/lib/format";
import { lineTotal } from "@/lib/cart";
import {
  RANGES,
  byDay,
  dayLabel,
  inRange,
  isoDay,
  rangeBounds,
  shortDay,
  type RangeId,
} from "@/lib/report";
import ShiftControls from "@/components/ShiftControls";
import StatusCluster from "@/components/StatusCluster";
import ShopIdentity from "@/components/ShopIdentity";
import {
  BoxIcon,
  BranchIcon,
  CalendarIcon,
  CardIcon,
  CashIcon,
  ChartIcon,
  DollarIcon,
  DraftIcon,
  ReceiptIcon,
  TrendUpIcon,
  UsersIcon,
} from "@/components/icons";

type TabId = "sales" | "payments" | "orders" | "shifts" | "products" | "cashiers" | "branches";

const TABS: {
  id: TabId;
  labelKey: TranslationKey;
  Icon: (p: { className?: string }) => React.ReactElement;
}[] = [
  { id: "sales", labelKey: "reports.tabSales", Icon: DollarIcon },
  { id: "payments", labelKey: "reports.tabPayments", Icon: CardIcon },
  { id: "orders", labelKey: "reports.tabOrders", Icon: ReceiptIcon },
  { id: "shifts", labelKey: "reports.tabShifts", Icon: DraftIcon },
  { id: "products", labelKey: "reports.tabProducts", Icon: BoxIcon },
  { id: "cashiers", labelKey: "reports.tabCashiers", Icon: UsersIcon },
  { id: "branches", labelKey: "reports.tabBranches", Icon: BranchIcon },
];

export default function ReportsPage() {
  const { orders, branches, branch, paymentMethods } = useStore();
  const { t, locale } = useI18n();
  const [range, setRange] = useState<RangeId>("month");
  const [tab, setTab] = useState<TabId>("sales");
  const [from, setFrom] = useState(isoDay(new Date()));
  const [to, setTo] = useState(isoDay(new Date()));

  const bounds = useMemo(() => rangeBounds(range, from, to), [range, from, to]);
  const rows = useMemo(
    () => orders.filter((o) => inRange(o.createdAt, bounds.from, bounds.to)),
    [orders, bounds]
  );

  const revenue = rows.reduce((s, o) => s + o.total, 0);
  const cashOrders = rows.filter((o) => o.method === "cash");
  const cashReceived = cashOrders.reduce((s, o) => s + o.paid, 0);
  const changeGiven = cashOrders.reduce((s, o) => s + o.change, 0);
  const days = useMemo(() => byDay(rows), [rows]);
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
        {/* Range */}
        <div className="flex flex-wrap items-center gap-2.5">
          {RANGES.map((r) => (
            <button
              key={r.id}
              onClick={() => setRange(r.id)}
              className={[
                "flex h-11 items-center gap-2 rounded-2xl border px-5 text-[15px] font-semibold transition-colors",
                range === r.id
                  ? "border-neutral-900 bg-neutral-900 text-white"
                  : "border-line bg-white text-neutral-700 hover:border-neutral-300",
              ].join(" ")}
            >
              {r.id === "custom" && <CalendarIcon className="h-[18px] w-[18px]" />}
              {t(`range.${r.id}` as TranslationKey)}
            </button>
          ))}
        </div>

        {range === "custom" && (
          <div className="mt-3 flex flex-wrap items-center gap-3 rounded-2xl bg-white p-3 ring-1 ring-black/[0.04]">
            <label className="flex items-center gap-2 text-sm text-muted">
              {t("reports.from")}
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="h-10 rounded-xl border border-line px-3 text-[15px] text-foreground outline-none focus:border-neutral-900"
              />
            </label>
            <label className="flex items-center gap-2 text-sm text-muted">
              {t("reports.to")}
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="h-10 rounded-xl border border-line px-3 text-[15px] text-foreground outline-none focus:border-neutral-900"
              />
            </label>
          </div>
        )}

        {/* Report type */}
        <div className="mt-3 flex flex-wrap items-center gap-2.5">
          {TABS.map(({ id, labelKey, Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={[
                "flex h-11 items-center gap-2 rounded-2xl border px-5 text-[15px] font-semibold transition-colors",
                tab === id
                  ? "border-neutral-900 bg-neutral-900 text-white"
                  : "border-line bg-white text-neutral-700 hover:border-neutral-300",
              ].join(" ")}
            >
              <Icon className="h-[18px] w-[18px]" />
              {t(labelKey)}
            </button>
          ))}
        </div>

        {tab === "sales" && (
          <>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <Stat
                Icon={DollarIcon}
                label={t("reports.totalRevenue")}
                value={currency(revenue)}
                hint={t("reports.transactions", { count: rows.length })}
              />
              <Stat
                Icon={TrendUpIcon}
                label={t("reports.netRevenue")}
                value={currency(revenue)}
                hint={t("reports.noRefunds")}
              />
              <Stat
                Icon={ChartIcon}
                label={t("reports.avgTransaction")}
                value={currency(rows.length ? revenue / rows.length : 0)}
              />
              <Stat
                Icon={CashIcon}
                label={t("reports.cashReceived")}
                value={currency(cashReceived)}
                hint={t("reports.changeGiven", { amount: currency(changeGiven) })}
              />
            </div>

            <Card title={t("reports.revenueByDay")} className="mt-4">
              {days.length === 0 ? (
                <Empty>{t("reports.noSales")}</Empty>
              ) : (
                <RevenueChart days={days} />
              )}
            </Card>

            <Card title={t("reports.dailyBreakdown")} className="mt-4">
              {days.length === 0 ? (
                <Empty>{t("reports.noSales")}</Empty>
              ) : (
                <>
                  <Table
                    head={[t("reports.colDate"), t("reports.colTxns"), t("reports.colRevenue")]}
                    align={["left", "right", "right"]}
                    rows={days.map((d) => [
                      dayLabel(d.day, locale),
                      String(d.txns),
                      currency(d.revenue),
                    ])}
                    footer={[t("common.total"), String(rows.length), currency(revenue)]}
                  />
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4 text-[15px] text-muted">
                    <span>
                      {t("reports.avgPerDay")}{" "}
                      <b className="font-bold text-foreground">
                        {currency(revenue / days.length)}
                      </b>
                    </span>
                    <span>
                      {t("reports.bestDay")}{" "}
                      <b className="font-bold text-foreground">
                        {(() => {
                          const best = [...days].sort((a, b) => b.revenue - a.revenue)[0];
                          return `${shortDay(best.day, locale)} · ${currency(best.revenue)}`;
                        })()}
                      </b>
                    </span>
                  </div>
                </>
              )}
            </Card>

            <Card title={t("nav.paymentMethods")} className="mt-4">
              <MethodTable rows={rows} revenue={revenue} methods={paymentMethods} />
            </Card>
          </>
        )}

        {tab === "payments" && (
          <Card title={t("nav.paymentMethods")} className="mt-4">
            <MethodTable rows={rows} revenue={revenue} methods={paymentMethods} />
          </Card>
        )}

        {tab === "orders" && (
          <Card title={t("nav.orders")} className="mt-4">
            {rows.length === 0 ? (
              <Empty>{t("reports.noOrders")}</Empty>
            ) : (
              <Table
                head={[
                  t("dash.colOrderId"),
                  t("orders.colCashier"),
                  t("orders.colItems"),
                  t("orders.colTime"),
                  t("common.total"),
                ]}
                align={["left", "left", "right", "right", "right"]}
                rows={rows.map((o) => [
                  orderRef(o.createdAt, o.number, branchName(o.branchId)),
                  o.cashier,
                  String(o.lines.reduce((s, l) => s + l.qty, 0)),
                  clockTime(o.createdAt),
                  currency(o.total),
                ])}
                footer={[t("common.total"), "", "", "", currency(revenue)]}
              />
            )}
          </Card>
        )}

        {tab === "products" && (
          <Card title={t("reports.tabProducts")} className="mt-4">
            <GroupTable
              heading={t("reports.colItem")}
              rows={groupBy(rows, (l) => l.name)}
              revenue={revenue}
            />
          </Card>
        )}

        {tab === "cashiers" && (
          <Card title={t("reports.tabCashiers")} className="mt-4">
            {rows.length === 0 ? (
              <Empty>{t("reports.noSales")}</Empty>
            ) : (
              <Table
                head={[
                  t("orders.colCashier"),
                  t("nav.orders"),
                  t("reports.colRevenue"),
                  t("reports.colShare"),
                ]}
                align={["left", "right", "right", "right"]}
                rows={aggregate(rows, (o) => o.cashier).map((r) => [
                  r.key,
                  String(r.count),
                  currency(r.total),
                  `${((r.total / (revenue || 1)) * 100).toFixed(0)}%`,
                ])}
                footer={[t("common.total"), String(rows.length), currency(revenue), "100%"]}
              />
            )}
          </Card>
        )}

        {tab === "branches" && (
          <Card title={t("nav.branches")} className="mt-4">
            {rows.length === 0 ? (
              <Empty>{t("reports.noSales")}</Empty>
            ) : (
              <Table
                head={[
                  t("expenses.colBranch"),
                  t("nav.orders"),
                  t("reports.colRevenue"),
                  t("reports.colShare"),
                ]}
                align={["left", "right", "right", "right"]}
                rows={aggregate(rows, (o) => branchName(o.branchId)).map((r) => [
                  r.key,
                  String(r.count),
                  currency(r.total),
                  `${((r.total / (revenue || 1)) * 100).toFixed(0)}%`,
                ])}
                footer={[t("common.total"), String(rows.length), currency(revenue), "100%"]}
              />
            )}
          </Card>
        )}

        {tab === "shifts" && (
          <Card title={t("reports.tabShifts")} className="mt-4">
            <Empty>{t("reports.shiftsEmpty")}</Empty>
          </Card>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ pieces */

function RevenueChart({ days }: { days: { day: string; revenue: number }[] }) {
  const { locale } = useI18n();
  const peak = Math.max(...days.map((d) => d.revenue), 1);
  const showValues = days.length <= 10;

  return (
    <div className="mt-6">
      <div className="flex h-64 items-end gap-3">
        {days.map((d) => (
          <div key={d.day} className="group flex h-full flex-1 flex-col justify-end">
            {showValues && (
              <span className="mb-2 text-center text-sm text-muted tabular-nums">
                ${Math.round(d.revenue)}
              </span>
            )}
            <div
              className="w-full rounded-md bg-neutral-900 transition-opacity group-hover:opacity-80"
              style={{ height: `${Math.max((d.revenue / peak) * 100, 1.5)}%` }}
              title={currency(d.revenue)}
            />
          </div>
        ))}
      </div>
      <div className="mt-3 flex gap-3">
        {days.map((d) => (
          <span key={d.day} className="flex-1 truncate text-center text-sm text-muted">
            {shortDay(d.day, locale)}
          </span>
        ))}
      </div>
    </div>
  );
}

function MethodTable({
  rows,
  revenue,
  methods,
}: {
  rows: import("@/lib/types").Order[];
  revenue: number;
  methods: import("@/lib/types").PaymentMethod[];
}) {
  const { t } = useI18n();
  const data = methods.map((m) => {
    const list = rows.filter((o) => o.method === m.id);
    return { label: m.label, count: list.length, total: list.reduce((s, o) => s + o.total, 0) };
  }).filter((m) => m.count > 0);

  if (data.length === 0) return <Empty>{t("reports.noPayments")}</Empty>;

  return (
    <Table
      head={[
        t("reports.colMethod"),
        t("reports.colTxns"),
        t("reports.colAmount"),
        t("reports.colShare"),
      ]}
      align={["left", "right", "right", "right"]}
      rows={data.map((m) => [
        m.label,
        String(m.count),
        currency(m.total),
        `${((m.total / (revenue || 1)) * 100).toFixed(0)}%`,
      ])}
      footer={[t("common.total"), String(rows.length), currency(revenue), "100%"]}
    />
  );
}

function GroupTable({
  heading,
  rows,
  revenue,
}: {
  heading: string;
  rows: { key: string; qty: number; total: number }[];
  revenue: number;
}) {
  const { t } = useI18n();
  if (rows.length === 0) return <Empty>{t("reports.noSales")}</Empty>;
  return (
    <Table
      head={[heading, t("reports.colSold"), t("reports.colRevenue"), t("reports.colShare")]}
      align={["left", "right", "right", "right"]}
      rows={rows.map((r) => [
        r.key,
        String(r.qty),
        currency(r.total),
        `${((r.total / (revenue || 1)) * 100).toFixed(0)}%`,
      ])}
      footer={[
        t("common.total"),
        String(rows.reduce((s, r) => s + r.qty, 0)),
        currency(rows.reduce((s, r) => s + r.total, 0)),
        "100%",
      ]}
    />
  );
}

function Table({
  head,
  rows,
  footer,
  align,
}: {
  head: string[];
  rows: string[][];
  footer?: string[];
  align: ("left" | "right")[];
}) {
  const cls = (i: number) => (align[i] === "right" ? "text-right" : "text-left");
  return (
    <div className="-mx-2 mt-5 overflow-x-auto">
      <table className="w-full min-w-[520px] text-[15px]">
        <thead>
          <tr className="border-b border-line text-sm text-muted">
            {head.map((h, i) => (
              <th key={h} className={`px-2 pb-3 font-normal ${cls(i)}`}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, ri) => (
            <tr key={ri} className="border-b border-line">
              {r.map((c, ci) => (
                <td
                  key={ci}
                  className={`px-2 py-4 ${cls(ci)} ${
                    ci === 0 ? "font-medium" : "tabular-nums text-neutral-600"
                  } ${ci === r.length - 1 ? "font-semibold text-foreground" : ""}`}
                >
                  {c}
                </td>
              ))}
            </tr>
          ))}
          {footer && (
            <tr className="bg-surface font-bold">
              {footer.map((c, ci) => (
                <td key={ci} className={`px-2 py-4 ${cls(ci)} ${ci ? "tabular-nums" : ""}`}>
                  {c}
                </td>
              ))}
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function Card({
  title,
  className = "",
  children,
}: {
  title: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className={`rounded-3xl bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)] ring-1 ring-black/[0.04] ${className}`}
    >
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
}: {
  Icon: (p: { className?: string }) => React.ReactElement;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="flex items-center gap-4 rounded-3xl bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] ring-1 ring-black/[0.04]">
      <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-neutral-100 text-neutral-700">
        <Icon className="h-6 w-6" />
      </span>
      <span className="min-w-0">
        <span className="block text-[15px] text-neutral-500">{label}</span>
        <span className="mt-0.5 block text-2xl font-bold tracking-tight tabular-nums">{value}</span>
        {hint && <span className="mt-0.5 block text-sm text-neutral-400">{hint}</span>}
      </span>
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="mt-5 text-[15px] leading-relaxed text-muted">{children}</p>;
}

/* ------------------------------------------------------------- aggregation */

function aggregate(orders: import("@/lib/types").Order[], key: (o: import("@/lib/types").Order) => string) {
  const map = new Map<string, { key: string; count: number; total: number }>();
  for (const o of orders) {
    const k = key(o);
    const cur = map.get(k) ?? { key: k, count: 0, total: 0 };
    cur.count += 1;
    cur.total += o.total;
    map.set(k, cur);
  }
  return [...map.values()].sort((a, b) => b.total - a.total);
}

function groupBy(
  orders: import("@/lib/types").Order[],
  key: (l: import("@/lib/types").CartLine) => string
) {
  const map = new Map<string, { key: string; qty: number; total: number }>();
  for (const o of orders) {
    for (const l of o.lines) {
      const k = key(l);
      const cur = map.get(k) ?? { key: k, qty: 0, total: 0 };
      cur.qty += l.qty;
      cur.total += lineTotal(l);
      map.set(k, cur);
    }
  }
  return [...map.values()].sort((a, b) => b.total - a.total);
}
