"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { currency, dateTime } from "@/lib/format";
import { lineOptions, lineTotal } from "@/lib/cart";
import type { Order } from "@/lib/types";
import { useStore } from "@/lib/store";
import { useI18n } from "@/lib/i18n";
import { CheckIcon, CloseIcon, TagIcon } from "./icons";
import LabelSheet from "./LabelSheet";

/**
 * Receipts and stickers use different stationery, so each goes to the printer
 * on its own. The flag on <html> tells the print stylesheet which of the two to
 * keep, and is cleared once the dialog returns.
 */
function printOnly(what: "receipt" | "labels") {
  document.documentElement.dataset.print = what;
  try {
    window.print();
  } finally {
    delete document.documentElement.dataset.print;
  }
}

export default function PaymentModal({ onClose }: { onClose: () => void }) {
  const { totals, checkout, method, branch, settings, paymentMethods } =
    useStore();
  const { t, locale } = useI18n();
  const [paidInput, setPaidInput] = useState("");
  const [done, setDone] = useState<Order | null>(null);

  const label = paymentMethods.find((m) => m.id === method)?.label ?? "Cash";
  const isCash = method === "cash";
  const due = totals.total;
  const paid = isCash ? Number(paidInput || 0) : due;
  const change = Math.max(0, paid - due);
  const canPay = !isCash || paid >= due - 0.001;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const { labelAction } = settings;
  const labels = labelAction !== "off";

  useEffect(() => {
    if (!done) return;
    if (settings.receiptAction === "direct") printOnly("receipt");
    if (labelAction === "direct") printOnly("labels");
  }, [done, settings.receiptAction, labelAction]);

  const quickCash = [
    due,
    Math.ceil(due),
    Math.ceil(due / 5) * 5,
    Math.ceil(due / 10) * 10,
  ]
    .filter((v, i, a) => v > 0 && a.indexOf(v) === i)
    .slice(0, 4);

  if (done) {
    return (
      <Shell onClose={onClose}>
        <div className="px-7 pb-7 pt-8">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-neutral-900 text-white">
            <CheckIcon className="h-8 w-8" />
          </div>
          <h2 className="mt-5 text-center text-xl font-semibold tracking-tight">
            {t("pay.complete")}
          </h2>
          <p className="mt-1 text-center text-sm text-muted">
            {t("pay.orderRef", { number: done.number })} ·{" "}
            {dateTime(done.createdAt, locale)}
          </p>

          <div
            className="mx-auto mt-6 rounded-2xl border border-line bg-surface p-5 font-mono text-[13px]"
            style={{
              maxWidth: settings.receiptPrinter.paperWidth === "58" ? 260 : 340,
            }}
          >
            {settings.printLogo && (
              <Image
                src="/logo-mark.png"
                alt=""
                width={56}
                height={56}
                className="mx-auto mb-3 h-14 w-14"
              />
            )}
            <p className="text-center text-[11px] uppercase tracking-widest text-muted">
              {branch.name}
            </p>
            <div className="my-3 border-t border-dashed border-neutral-300" />
            {done.lines.map((l) => (
              <div key={l.id} className="flex justify-between py-1">
                <span className="truncate pr-3">
                  {l.qty} × {l.name}{" "}
                  <span className="text-muted">({lineOptions(l)})</span>
                </span>
                <span>{currency(lineTotal(l))}</span>
              </div>
            ))}
            <div className="my-3 border-t border-dashed border-neutral-300" />
            <Row label={t("common.subtotal")} value={currency(done.subtotal)} />
            {done.discount > 0 && (
              <Row
                label={t("common.discount")}
                value={`-${currency(done.discount)}`}
              />
            )}
            <Row label={t("common.total")} value={currency(done.total)} bold />
            <Row
              label={t("pay.paidWith", { method: label })}
              value={currency(done.paid)}
            />
            <Row label={t("pay.change")} value={currency(done.change)} />
          </div>

          {/* Never shown on screen — it exists so the stickers have something to
              print from, whether that is the automatic job or the button below. */}
          {labels && <LabelSheet order={done} />}

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={() => printOnly("receipt")}
              className="h-12 flex-1 rounded-xl border border-line text-sm font-medium transition-colors hover:bg-surface"
            >
              {t("pay.printReceipt")}
            </button>
            {labels && (
              <button
                onClick={() => printOnly("labels")}
                className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl border border-line text-sm font-medium transition-colors hover:bg-surface"
              >
                <TagIcon className="h-4 w-4" />
                {t("label.print")}
              </button>
            )}
            <button
              onClick={onClose}
              className="h-12 flex-1 rounded-xl bg-neutral-900 text-sm font-semibold text-white transition-opacity hover:opacity-85"
            >
              {t("pay.newOrder")}
            </button>
          </div>
        </div>
      </Shell>
    );
  }

  return (
    <Shell onClose={onClose}>
      <div className="flex items-center justify-between border-b border-line px-6 py-5">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">
            {t("pay.title")}
          </h2>
          <p className="text-xs text-muted">
            {t("pay.payingWith", { method: label })}
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

      <div className="px-6 py-6">
        <p className="text-xs font-medium uppercase tracking-wider text-muted">
          {t("pay.amountDue")}
        </p>
        <p className="mt-1 text-4xl font-semibold tracking-tight tabular-nums">
          {currency(due)}
        </p>

        {isCash ? (
          <div className="mt-6">
            <label className="text-xs font-medium uppercase tracking-wider text-muted">
              {t("pay.cashReceived")}
            </label>
            <input
              autoFocus
              inputMode="decimal"
              value={paidInput}
              onChange={(e) =>
                setPaidInput(e.target.value.replace(/[^0-9.]/g, ""))
              }
              placeholder="0.00"
              className="mt-2 h-14 w-full rounded-xl border border-line px-4 text-xl tabular-nums outline-none transition-colors focus:border-neutral-900"
            />
            <div className="mt-2 grid grid-cols-4 gap-2">
              {quickCash.map((v) => (
                <button
                  key={v}
                  onClick={() => setPaidInput(v.toFixed(2))}
                  className="h-10 rounded-xl border border-line text-xs font-medium tabular-nums transition-colors hover:border-neutral-900"
                >
                  {currency(v)}
                </button>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between rounded-xl bg-surface px-4 py-3.5 text-sm">
              <span className="text-muted">{t("pay.change")}</span>
              <span className="text-base font-semibold tabular-nums">
                {currency(change)}
              </span>
            </div>
          </div>
        ) : (
          <p className="mt-6 rounded-xl bg-surface px-4 py-4 text-sm leading-relaxed text-muted">
            {t("pay.terminalHint", { method: label })}
          </p>
        )}
      </div>

      <div className="border-t border-line px-6 py-5">
        <button
          onClick={() => canPay && setDone(checkout(paid))}
          disabled={!canPay}
          className="h-14 w-full rounded-2xl bg-neutral-900 text-base font-semibold text-white transition-opacity hover:opacity-85 disabled:bg-neutral-200 disabled:text-neutral-400"
        >
          {canPay
            ? t("pay.charge", { amount: currency(due) })
            : t("pay.insufficient")}
        </button>
      </div>
    </Shell>
  );
}

function Row({
  label,
  value,
  bold,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <div
      className={`flex justify-between py-0.5 ${bold ? "font-semibold" : ""}`}
    >
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

function Shell({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-neutral-950/40 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div className="relative max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-3xl bg-white shadow-2xl ring-1 ring-black/10">
        {children}
      </div>
    </div>
  );
}
