"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { currency, dateTime, isToday } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { PlusIcon } from "@/components/icons";
import PageHeader from "@/components/PageHeader";
import ExpenseDialog from "@/components/ExpenseDialog";

export default function ExpensesPage() {
  const { expenses, branches } = useStore();
  const { t, locale } = useI18n();
  const [open, setOpen] = useState(false);

  const todayTotal = expenses
    .filter((e) => isToday(e.createdAt))
    .reduce((s, e) => s + e.amount, 0);

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title={t("nav.expenses")}
        subtitle={t("expenses.subtitle", { amount: currency(todayTotal) })}
      >
        <button
          onClick={() => setOpen(true)}
          className="flex h-12 items-center gap-2 rounded-2xl bg-neutral-900 px-5 text-sm font-semibold text-white transition-opacity hover:opacity-85"
        >
          <PlusIcon className="h-[18px] w-[18px]" />
          {t("expenses.new")}
        </button>
      </PageHeader>

      <div className="flex-1 overflow-y-auto">
        {expenses.length === 0 ? (
          <div className="grid h-full place-items-center bg-surface px-6 text-center">
            <div className="max-w-sm">
              <div className="mx-auto h-14 w-14 rounded-2xl border border-dashed border-neutral-300" />
              <p className="mt-5 text-[15px] font-medium">{t("expenses.none")}</p>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">
                {t("expenses.noneHint")}
              </p>
            </div>
          </div>
        ) : (
          <table className="w-full text-[15px]">
            <thead className="sticky top-0 z-10 bg-white">
              <tr className="border-b border-line text-left text-xs uppercase tracking-wider text-muted">
                <th className="px-6 py-3.5 font-medium">{t("expenses.colNote")}</th>
                <th className="px-6 py-3.5 font-medium">{t("expenses.colBranch")}</th>
                <th className="px-6 py-3.5 font-medium">{t("expenses.colRecorded")}</th>
                <th className="px-6 py-3.5 text-right font-medium">{t("expenses.colAmount")}</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((e) => (
                <tr key={e.id} className="border-b border-line transition-colors hover:bg-surface">
                  <td className="px-6 py-4 font-medium">{e.note}</td>
                  <td className="px-6 py-4 text-sm text-muted">
                    {branches.find((b) => b.id === e.branchId)?.name ?? "—"}
                  </td>
                  <td className="px-6 py-4 text-sm text-muted">{dateTime(e.createdAt, locale)}</td>
                  <td className="px-6 py-4 text-right font-semibold tabular-nums">
                    {currency(e.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {open && <ExpenseDialog onClose={() => setOpen(false)} />}
    </div>
  );
}
