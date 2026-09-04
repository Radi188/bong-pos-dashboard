"use client";

import Image from "next/image";

import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import type { CartLine } from "@/lib/types";
import { currency } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { lineOptions, lineSubtotal, lineTotal } from "@/lib/cart";
import { CartIcon, MinusIcon, PlusIcon, TrashIcon } from "./icons";
import PaymentModal from "./PaymentModal";
import ProductSheet from "./ProductSheet";
import StatusCluster from "./StatusCluster";
import OpenTillDialog from "./OpenTillDialog";

export default function CartPanel() {
  const {
    products,
    cart,
    setQty,
    removeLine,
    clearCart,
    totals,
    discountMode,
    discountValue,
    setDiscount,
    method,
    setMethod,
    paymentMethods,
    shift,
  } = useStore();

  const { t } = useI18n();
  const methods = paymentMethods.filter((m) => m.enabled);

  const [payOpen, setPayOpen] = useState(false);
  const [tillOpen, setTillOpen] = useState(false);
  const [editing, setEditing] = useState<CartLine | null>(null);

  const editProduct = editing ? products.find((p) => p.id === editing.productId) : undefined;
  const empty = cart.length === 0;

  // A tender disabled while it was selected falls back to the first available one.
  useEffect(() => {
    if (methods.length > 0 && !methods.some((m) => m.id === method)) setMethod(methods[0].id);
  }, [methods, method, setMethod]);

  return (
    <aside className="flex w-[400px] shrink-0 flex-col border-l border-line bg-white 2xl:w-[440px]">
      <header className="flex h-[92px] shrink-0 items-center justify-between gap-3 border-b border-line px-6">
        <div className="flex min-w-0 items-center gap-2.5">
          <h2 className="text-xl font-semibold tracking-tight">{t("cart.title")}</h2>
          {!empty && (
            <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-semibold tabular-nums">
              {totals.count}
            </span>
          )}
          {!empty && (
            <button
              onClick={clearCart}
              className="text-sm font-medium text-muted transition-colors hover:text-neutral-900"
            >
              {t("cart.clear")}
            </button>
          )}
        </div>
        <StatusCluster />
      </header>

      <div className="flex-1 overflow-y-auto">
        {empty ? (
          <div className="grid h-full place-items-center px-10 text-center">
            <div>
              <CartIcon className="mx-auto h-14 w-14 text-neutral-300" />
              <p className="mt-4 text-[15px] text-muted">{t("cart.empty")}</p>
            </div>
          </div>
        ) : (
          <ul className="divide-y divide-line">
            {cart.map((l) => (
              <li key={l.id} className="group px-6 py-4">
                <div className="flex gap-3">
                  <button
                    onClick={() => setEditing(l)}
                    title={t("cart.editItem")}
                    className="min-w-0 flex-1 text-left"
                  >
                    <span className="block truncate text-[15px] font-medium leading-tight underline-offset-4 group-hover:underline">
                      {l.name}
                    </span>
                    <span className="mt-1 block text-xs leading-relaxed text-muted">
                      {lineOptions(l)}
                    </span>
                    {l.note && (
                      <span className="mt-1 block text-xs italic leading-relaxed text-neutral-500">
                        &ldquo;{l.note}&rdquo;
                      </span>
                    )}
                  </button>
                  <span className="shrink-0 text-right">
                    <span className="block text-[15px] font-semibold tabular-nums">
                      {currency(lineTotal(l))}
                    </span>
                    {lineTotal(l) !== lineSubtotal(l) && (
                      <span className="mt-0.5 block text-xs tabular-nums text-muted line-through">
                        {currency(lineSubtotal(l))}
                      </span>
                    )}
                  </span>
                </div>

                <div className="mt-3 flex items-center gap-1.5">
                  <StepButton onClick={() => setQty(l.id, l.qty - 1)} label={t("cart.decrease")}>
                    <MinusIcon className="h-3.5 w-3.5" />
                  </StepButton>
                  <span className="w-8 text-center text-sm font-semibold tabular-nums">
                    {l.qty}
                  </span>
                  <StepButton onClick={() => setQty(l.id, l.qty + 1)} label={t("cart.increase")}>
                    <PlusIcon className="h-3.5 w-3.5" />
                  </StepButton>
                  <button
                    onClick={() => removeLine(l.id)}
                    aria-label={t("cart.remove")}
                    className="ml-1 grid h-8 w-8 place-items-center rounded-lg text-muted opacity-0 transition-all hover:bg-neutral-100 hover:text-neutral-900 focus:opacity-100 group-hover:opacity-100"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Checkout */}
      <div className="shrink-0 border-t border-line px-6 py-5">
        <p className="text-sm font-medium text-muted">{t("cart.discount")}</p>

        <div className="mt-2 grid grid-cols-2 gap-1 rounded-xl bg-neutral-100 p-1">
          {(["percent", "amount"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setDiscount(m, discountValue)}
              className={[
                "h-11 rounded-lg text-sm font-medium transition-colors",
                discountMode === m
                  ? "bg-neutral-900 text-white"
                  : "text-neutral-600 hover:text-neutral-900",
              ].join(" ")}
            >
              {m === "percent" ? t("cart.percent") : t("cart.amount")}
            </button>
          ))}
        </div>

        <div className="mt-2 flex gap-2">
          <button
            onClick={() => setDiscount(discountMode, 0)}
            className={[
              "h-12 shrink-0 rounded-xl px-5 text-sm font-medium transition-colors",
              discountValue === 0
                ? "bg-neutral-900 text-white"
                : "border border-line text-neutral-600 hover:bg-surface",
            ].join(" ")}
          >
            {t("common.none")}
          </button>
          <div className="relative flex-1">
            <input
              inputMode="decimal"
              value={discountValue || ""}
              onChange={(e) =>
                setDiscount(discountMode, Number(e.target.value.replace(/[^0-9.]/g, "") || 0))
              }
              placeholder="0"
              className="h-12 w-full rounded-xl border border-line px-4 pr-10 text-center text-[15px] tabular-nums outline-none transition-colors focus:border-neutral-900"
            />
            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted">
              {discountMode === "percent" ? "%" : "$"}
            </span>
          </div>
        </div>

        {totals.discount > 0 && (
          <div className="mt-3 flex items-baseline justify-between text-sm">
            <span className="text-muted">{t("common.subtotal")}</span>
            <span className="tabular-nums text-muted line-through">
              {currency(totals.subtotal)}
            </span>
          </div>
        )}

        <div className="mt-3 flex items-baseline justify-between">
          <span className="text-xl font-semibold tracking-tight">{t("common.total")}</span>
          <span className="text-2xl font-semibold tracking-tight tabular-nums">
            {currency(totals.total)}
          </span>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2.5">
          {methods.map((pm) => {
            const active = method === pm.id;
            return (
              <button
                key={pm.id}
                onClick={() => setMethod(pm.id)}
                className={[
                  "relative flex flex-col items-center gap-2 rounded-xl border px-2 py-3 transition-colors",
                  active
                    ? "border-neutral-900 bg-neutral-50"
                    : "border-line hover:border-neutral-300",
                ].join(" ")}
              >
                {pm.logo ? (
                  <Image
                    src={pm.logo}
                    alt=""
                    width={36}
                    height={36}
                    unoptimized
                    className="h-9 w-9 rounded-lg object-contain"
                  />
                ) : (
                  <span
                    className={[
                      "grid h-9 w-9 place-items-center rounded-lg text-xs font-bold",
                      active ? "bg-neutral-900 text-white" : "bg-neutral-100 text-neutral-600",
                    ].join(" ")}
                  >
                    {pm.mark}
                  </span>
                )}
                <span className="truncate text-xs font-medium">{pm.label}</span>
                {active && (
                  <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-neutral-900" />
                )}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => (shift ? setPayOpen(true) : setTillOpen(true))}
          disabled={empty}
          className="mt-4 flex h-14 w-full items-center justify-between rounded-2xl bg-neutral-900 px-6 text-base font-semibold text-white transition-opacity hover:opacity-85 disabled:bg-neutral-200 disabled:text-neutral-400"
        >
          <span>{t("cart.payNow")}</span>
          <span className="tabular-nums">{currency(totals.total)}</span>
        </button>
      </div>

      {payOpen && <PaymentModal onClose={() => setPayOpen(false)} />}
      {tillOpen && (
        <OpenTillDialog
          notice={t("till.requiredForCheckout")}
          onClose={() => setTillOpen(false)}
          onOpened={() => setPayOpen(true)}
        />
      )}
      {editing && editProduct && (
        <ProductSheet product={editProduct} line={editing} onClose={() => setEditing(null)} />
      )}
    </aside>
  );
}

function StepButton({
  onClick,
  label,
  children,
}: {
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="grid h-8 w-8 place-items-center rounded-lg border border-line transition-colors hover:border-neutral-900 hover:bg-neutral-900 hover:text-white"
    >
      {children}
    </button>
  );
}
