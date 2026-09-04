"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { currency } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { CloseIcon } from "./icons";
import MoneyField, { KHR_PRESETS, USD_PRESETS, khr } from "./MoneyField";

export default function OpenTillDialog({
  onClose,
  /** Shown when the dialog was raised by an action that needs an open shift. */
  notice,
  onOpened,
}: {
  onClose: () => void;
  notice?: string;
  onOpened?: () => void;
}) {
  const { startShift, branch, settings } = useStore();
  const { t } = useI18n();
  const rate = settings.khrRate;
  const [cashier, setCashier] = useState("Cashier Panha");
  const [usd, setUsd] = useState("");
  const [riel, setRiel] = useState("");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const usdValue = Number(usd || 0);
  const khrValue = Number(riel || 0);
  const totalUsd = usdValue + khrValue / rate;
  const valid = cashier.trim() !== "" && totalUsd > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-neutral-950/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-3xl bg-white shadow-2xl ring-1 ring-black/10">
        <div className="flex items-center justify-between border-b border-line px-6 py-5">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">{t("till.title")}</h2>
            <p className="text-xs text-muted">{branch.name}</p>
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
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted">
              {t("till.cashier")}
            </span>
            <input
              value={cashier}
              onChange={(e) => setCashier(e.target.value)}
              className="h-12 w-full rounded-xl border border-line px-4 text-[15px] outline-none transition-colors focus:border-neutral-900"
            />
          </label>

          {notice && (
            <p className="rounded-2xl bg-amber-50 px-4 py-3 text-sm leading-relaxed text-amber-800 ring-1 ring-amber-200">
              {notice}
            </p>
          )}

          <p className="text-sm leading-relaxed text-muted">
            {t("till.hint")}
          </p>

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

          <div className="rounded-2xl bg-surface px-5 py-4">
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-muted">{t("till.openingFloat")}</span>
              <span className="text-xl font-semibold tabular-nums">{currency(totalUsd)}</span>
            </div>
            <div className="mt-1.5 flex items-baseline justify-between text-xs text-muted">
              <span>
                {currency(usdValue)} + {khr(khrValue)}
              </span>
              <span className="tabular-nums">
                {t("till.rate", { rate: new Intl.NumberFormat("en-US").format(rate) })}
              </span>
            </div>
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
            disabled={!valid}
            onClick={() => {
              startShift(cashier.trim(), { usd: usdValue, khr: khrValue });
              onClose();
              onOpened?.();
            }}
            className="h-12 flex-[1.4] rounded-xl bg-emerald-600 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:bg-neutral-200 disabled:text-neutral-400"
          >
            {t("till.openShift")}
          </button>
        </div>
      </div>
    </div>
  );
}
