"use client";

import { useEffect, useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { currency, time } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { CloseIcon } from "./icons";
import MoneyField, { KHR_PRESETS, USD_PRESETS, khr } from "./MoneyField";

/** Variance under this is treated as a clean count — cents of rounding are not a discrepancy. */
const TOLERANCE = 0.01;

export default function CloseTillDialog({ onClose }: { onClose: () => void }) {
  const { shift, endShift, orders, expenses, branch, settings } = useStore();
  const { t, locale } = useI18n();
  const rate = settings.khrRate;
  const [usd, setUsd] = useState("");
  const [riel, setRiel] = useState("");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const startedAt = shift?.startedAt;

  const { opening, cashSales, cashOut, expected } = useMemo(() => {
    const since = startedAt ? new Date(startedAt).getTime() : 0;
    const inShift = (iso: string) => new Date(iso).getTime() >= since;

    const openingFloat = shift?.opening;
    const opening = openingFloat ? openingFloat.usd + openingFloat.khr / rate : 0;

    const cashSales = orders
      .filter((o) => o.branchId === branch.id && o.method === "cash" && inShift(o.createdAt))
      .reduce((sum, o) => sum + o.total, 0);

    const cashOut = expenses
      .filter((e) => e.branchId === branch.id && inShift(e.createdAt))
      .reduce((sum, e) => sum + e.amount, 0);

    return { opening, cashSales, cashOut, expected: opening + cashSales - cashOut };
  }, [orders, expenses, branch.id, rate, shift?.opening, startedAt]);

  if (!shift) return null;

  const usdValue = Number(usd || 0);
  const khrValue = Number(riel || 0);
  const counted = usdValue + khrValue / rate;
  const variance = counted - expected;
  const balanced = Math.abs(variance) < TOLERANCE;
  const counting = usd !== "" || riel !== "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-neutral-950/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-3xl bg-white shadow-2xl ring-1 ring-black/10">
        <div className="flex items-center justify-between border-b border-line px-6 py-5">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">{t("till.closeTitle")}</h2>
            <p className="text-xs text-muted">
              {branch.name} · {shift.cashier} · {t("till.since", { time: time(shift.startedAt, locale) })}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label={t("common.close")}
            className="grid h-9 w-9 place-items-center rounded-xl text-muted transition-colors hover:bg-neutral-100 hover:text-neutral-900"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-5 px-6 py-5">
          <p className="text-sm leading-relaxed text-muted">{t("till.closeHint")}</p>

          <div className="space-y-2 rounded-2xl bg-surface px-5 py-4 text-sm">
            <Row label={t("till.openingFloat")} value={currency(opening)} />
            <Row label={t("till.cashSales")} value={currency(cashSales)} />
            <Row label={t("till.cashOut")} value={`− ${currency(cashOut)}`} />
            <div className="flex items-baseline justify-between border-t border-line pt-2.5">
              <span className="font-medium">{t("till.expected")}</span>
              <span className="text-xl font-semibold tabular-nums">{currency(expected)}</span>
            </div>
          </div>

          <MoneyField
            label={t("till.usd")}
            symbol="$"
            value={usd}
            onChange={setUsd}
            presets={USD_PRESETS}
            format={(n) => currency(n)}
            autoFocus
          />

          <MoneyField
            label={t("till.riel")}
            symbol="៛"
            value={riel}
            onChange={setRiel}
            presets={KHR_PRESETS}
            format={khr}
          />

          <div
            className={`rounded-2xl px-5 py-4 ${
              !counting
                ? "bg-surface"
                : balanced
                  ? "bg-emerald-50 ring-1 ring-emerald-200"
                  : "bg-amber-50 ring-1 ring-amber-200"
            }`}
          >
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-muted">{t("till.counted")}</span>
              <span className="text-xl font-semibold tabular-nums">{currency(counted)}</span>
            </div>
            <div className="mt-1.5 flex items-baseline justify-between text-xs text-muted">
              <span>
                {currency(usdValue)} + {khr(khrValue)}
              </span>
              <span className="tabular-nums">
                {t("till.rate", { rate: new Intl.NumberFormat("en-US").format(rate) })}
              </span>
            </div>
            {counting && (
              <p
                className={`mt-3 border-t pt-3 text-sm font-medium ${
                  balanced
                    ? "border-emerald-200 text-emerald-700"
                    : "border-amber-200 text-amber-700"
                }`}
              >
                {balanced
                  ? t("till.balanced")
                  : variance > 0
                    ? t("till.over", { amount: currency(Math.abs(variance)) })
                    : t("till.short", { amount: currency(Math.abs(variance)) })}
              </p>
            )}
          </div>
        </div>

        <div className="flex gap-3 border-t border-line px-6 py-5">
          <button
            onClick={onClose}
            className="h-12 flex-1 rounded-xl border border-line text-sm font-medium transition-colors hover:bg-surface"
          >
            {t("common.cancel")}
          </button>
          <button
            disabled={!counting}
            onClick={() => {
              endShift();
              onClose();
            }}
            className="h-12 flex-[1.4] rounded-xl bg-red-600 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:bg-neutral-200 disabled:text-neutral-400"
          >
            {t("till.closeShift")}
          </button>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between">
      <span className="text-muted">{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}
