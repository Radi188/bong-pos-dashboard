"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ICE_LEVELS,
  SUGAR_LEVELS,
  type Addon,
  type CartLine,
  type DiscountMode,
  type IceLevel,
  type Product,
  type SugarLevel,
  type Variant,
} from "@/lib/types";
import { isDiscounted, priceFrom, unitPrice, useStore } from "@/lib/store";
import { useI18n, type TranslationKey } from "@/lib/i18n";
import { categoryKey } from "@/lib/labels";
import { currency } from "@/lib/format";
import { CloseIcon, CupIcon, MinusIcon, PlusIcon } from "./icons";

export default function ProductSheet({
  product,
  line,
  onClose,
}: {
  product: Product;
  /** Present when editing a line already in the cart. */
  line?: CartLine;
  onClose: () => void;
}) {
  const { addLine, updateLine, removeLine } = useStore();
  const { t } = useI18n();
  const editing = Boolean(line);

  const initialVariant =
    (line && product.variants.find((v) => v.id === line.variantId)) ??
    product.variants[0];

  const [variant, setVariant] = useState<Variant>(initialVariant);
  const [sugar, setSugar] = useState<SugarLevel>(line?.sugar ?? "100%");
  const [ice, setIce] = useState<IceLevel>(line?.ice ?? "Normal");
  const [addons, setAddons] = useState<Addon[]>(line?.addons ?? []);
  const [priceInput, setPriceInput] = useState(
    (line?.price ?? unitPrice(initialVariant)).toFixed(2),
  );
  const [discountMode, setDiscountMode] = useState<DiscountMode>(
    line?.discountMode ?? "percent",
  );
  const [discountValue, setDiscountValue] = useState(line?.discountValue ?? 0);
  const [note, setNote] = useState(line?.note ?? "");
  const [qty, setQty] = useState(line?.qty ?? 1);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const chooseVariant = (v: Variant) => {
    setVariant(v);
    setPriceInput(unitPrice(v).toFixed(2));
  };

  const toggleAddon = (a: Addon) =>
    setAddons((prev) =>
      prev.some((x) => x.id === a.id)
        ? prev.filter((x) => x.id !== a.id)
        : [...prev, a],
    );

  const price = Number(priceInput || 0);
  const overridden = Math.abs(price - unitPrice(variant)) > 0.001;

  const total = useMemo(() => {
    const unit = price + addons.reduce((s, a) => s + a.price, 0);
    const subtotal = unit * qty;
    const raw =
      discountMode === "amount"
        ? discountValue
        : (subtotal * Math.min(discountValue, 100)) / 100;
    return subtotal - Math.min(subtotal, Math.max(0, raw));
  }, [price, addons, qty, discountMode, discountValue]);

  const submit = () => {
    const next = {
      productId: product.id,
      variantId: variant.id,
      name: product.name,
      variantLabel: variant.label,
      price,
      addons,
      sugar: product.customisable ? sugar : undefined,
      ice: product.customisable ? ice : undefined,
      note: note.trim() || undefined,
      discountMode,
      discountValue,
    };
    if (line) updateLine(line.id, next, qty);
    else addLine(next, qty);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-neutral-950/40 backdrop-blur-[2px]"
        onClick={onClose}
      />

      <div className="relative flex max-h-[92dvh] w-full max-w-md flex-col overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-black/10">
        {/* Header */}
        <div className="flex shrink-0 items-center gap-4 border-b border-line p-5">
          <div className="grid h-[72px] w-[72px] shrink-0 place-items-center rounded-2xl bg-neutral-100">
            <CupIcon className="h-9 w-9 text-neutral-300" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-xl font-bold tracking-tight">
              {product.name}
            </h2>
            <p className="mt-1 text-[15px] font-medium text-muted">
              {t("pos.from")} {currency(priceFrom(product))}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label={t("common.close")}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-neutral-100 text-neutral-600 transition-colors hover:bg-neutral-200"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>

        {/* Options */}
        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto p-5">
          <Group
            label={t("sheet.size")}
            badge={t("common.required")}
            tone="required"
          >
            <div
              className="grid gap-2.5"
              style={{
                gridTemplateColumns: `repeat(${Math.min(product.variants.length, 3)}, minmax(0, 1fr))`,
              }}
            >
              {product.variants.map((v) => {
                const active = v.id === variant.id;
                return (
                  <button
                    key={v.id}
                    onClick={() => chooseVariant(v)}
                    className={[
                      "rounded-xl border px-4 py-3.5 transition-colors",
                      active
                        ? "border-neutral-900 bg-neutral-900 text-white"
                        : "border-line hover:border-neutral-300",
                    ].join(" ")}
                  >
                    <span className="block text-[15px] font-bold">
                      {v.label}
                    </span>
                    <span
                      className={`mt-0.5 flex items-baseline justify-center gap-1.5 text-sm tabular-nums ${
                        active ? "text-neutral-300" : "text-muted"
                      }`}
                    >
                      {isDiscounted(v) && (
                        <span className="text-xs line-through opacity-70">
                          {currency(v.price)}
                        </span>
                      )}
                      <span>{currency(unitPrice(v))}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </Group>

          {product.customisable && (
            <>
              <Group label={t("sheet.sugar")} badge={t("common.optional")}>
                <Pills
                  options={SUGAR_LEVELS}
                  value={sugar}
                  onChange={setSugar}
                />
              </Group>

              <Group label={t("sheet.ice")} badge={t("common.optional")}>
                <Pills
                  options={ICE_LEVELS}
                  value={ice}
                  onChange={setIce}
                  label={(o) => t(`ice.${o}` as TranslationKey)}
                />
              </Group>
            </>
          )}

          {product.addons && product.addons.length > 0 && (
            <Group
              label={t(categoryKey(product.category))}
              badge={t("common.optional")}
            >
              <ul className="space-y-2.5">
                {product.addons.map((a) => {
                  const checked = addons.some((x) => x.id === a.id);
                  return (
                    <li key={a.id}>
                      <button
                        onClick={() => toggleAddon(a)}
                        className={[
                          "flex w-full items-center gap-3.5 rounded-xl border px-4 py-3.5 text-left transition-colors",
                          checked
                            ? "border-neutral-900"
                            : "border-line hover:border-neutral-300",
                        ].join(" ")}
                      >
                        <span
                          className={[
                            "grid h-5 w-5 shrink-0 place-items-center rounded-md border transition-colors",
                            checked
                              ? "border-neutral-900 bg-neutral-900 text-white"
                              : "border-neutral-300",
                          ].join(" ")}
                        >
                          {checked && (
                            <svg
                              viewBox="0 0 24 24"
                              className="h-3.5 w-3.5"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="3.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="m5 13 4 4L19 7" />
                            </svg>
                          )}
                        </span>
                        <span className="min-w-0 flex-1 truncate text-[15px] font-medium">
                          {a.name}
                        </span>
                        <span className="shrink-0 text-[15px] font-medium tabular-nums text-neutral-600">
                          +{currency(a.price)}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </Group>
          )}

          <Group
            label={t("sheet.priceGroup")}
            badge={overridden ? t("sheet.customPrice") : t("sheet.menuPrice")}
          >
            <div className="relative">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-base text-muted">
                $
              </span>
              <input
                inputMode="decimal"
                value={priceInput}
                onChange={(e) =>
                  setPriceInput(e.target.value.replace(/[^0-9.]/g, ""))
                }
                className="h-14 w-full rounded-xl border border-line pl-9 pr-4 text-[17px] tabular-nums outline-none transition-colors focus:border-neutral-900"
              />
            </div>
          </Group>

          <Group label={t("common.discount")} badge={t("common.optional")}>
            <div className="grid grid-cols-2 gap-1 rounded-xl bg-neutral-100 p-1">
              {(["percent", "amount"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setDiscountMode(m)}
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
            <div className="mt-2.5 flex gap-2.5">
              <button
                onClick={() => setDiscountValue(0)}
                className={[
                  "h-12 shrink-0 rounded-xl px-5 text-sm font-medium transition-colors",
                  discountValue === 0
                    ? "bg-neutral-900 text-white"
                    : "border border-line text-neutral-600 hover:bg-surface",
                ].join(" ")}
              >
                None
              </button>
              <div className="relative flex-1">
                <input
                  inputMode="decimal"
                  value={discountValue || ""}
                  onChange={(e) =>
                    setDiscountValue(
                      Number(e.target.value.replace(/[^0-9.]/g, "") || 0),
                    )
                  }
                  placeholder="0"
                  className="h-12 w-full rounded-xl border border-line px-4 pr-10 text-center text-[15px] tabular-nums outline-none transition-colors focus:border-neutral-900"
                />
                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted">
                  {discountMode === "percent" ? "%" : "$"}
                </span>
              </div>
            </div>
          </Group>

          <Group label={t("sheet.note")} badge={t("common.optional")}>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder={t("sheet.notePlaceholder")}
              className="w-full resize-none rounded-xl border border-line px-4 py-3 text-[15px] leading-relaxed outline-none transition-colors placeholder:text-muted focus:border-neutral-900"
            />
          </Group>

          {editing && (
            <button
              onClick={() => {
                removeLine(line!.id);
                onClose();
              }}
              className="h-12 w-full rounded-xl border border-red-200 bg-red-50 text-sm font-semibold text-red-600 transition-colors hover:border-red-300 hover:bg-red-100"
            >
              {t("sheet.removeFromCart")}
            </button>
          )}
        </div>

        {/* Footer */}
        <div className="flex shrink-0 items-center gap-3 border-t border-line p-4">
          <div className="flex h-14 shrink-0 items-center gap-1 rounded-xl border border-line px-2">
            <button
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              aria-label={t("sheet.decreaseQty")}
              className="grid h-10 w-10 place-items-center rounded-lg text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
            >
              <MinusIcon className="h-4 w-4" />
            </button>
            <span className="w-8 text-center text-base font-semibold tabular-nums">
              {qty}
            </span>
            <button
              onClick={() => setQty((q) => q + 1)}
              aria-label={t("sheet.increaseQty")}
              className="grid h-10 w-10 place-items-center rounded-lg text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
            >
              <PlusIcon className="h-4 w-4" />
            </button>
          </div>

          <button
            onClick={submit}
            disabled={price <= 0}
            className="flex h-14 flex-1 items-center justify-between rounded-xl bg-neutral-900 px-5 text-base font-semibold text-white transition-opacity hover:opacity-85 disabled:bg-neutral-200 disabled:text-neutral-400"
          >
            <span>
              {editing ? t("sheet.updateCart") : t("sheet.addToCart")}
            </span>
            <span className="tabular-nums">{currency(total)}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function Group({
  label,
  badge,
  tone = "optional",
  children,
}: {
  label: string;
  badge: string;
  tone?: "required" | "optional";
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-2.5 flex items-center gap-2.5">
        <h3 className="text-base font-bold tracking-tight">{label}</h3>
        <span
          className={[
            "rounded-md px-2 py-0.5 text-xs font-medium",
            tone === "required"
              ? "bg-red-50 text-red-600"
              : "bg-neutral-100 text-neutral-500",
          ].join(" ")}
        >
          {badge}
        </span>
      </div>
      {children}
    </section>
  );
}

function Pills<T extends string>({
  options,
  value,
  onChange,
  label = (o) => o,
}: {
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
  /** Sugar levels are percentages and read the same in both languages; ice levels are words. */
  label?: (option: T) => string;
}) {
  return (
    <div className="flex gap-2.5">
      {options.map((o) => (
        <button
          key={o}
          onClick={() => onChange(o)}
          className={[
            "h-12 flex-1 rounded-xl border text-[15px] font-semibold transition-colors",
            value === o
              ? "border-neutral-900 bg-neutral-900 text-white"
              : "border-line hover:border-neutral-300",
          ].join(" ")}
        >
          {label(o)}
        </button>
      ))}
    </div>
  );
}
