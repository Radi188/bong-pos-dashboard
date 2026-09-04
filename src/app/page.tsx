"use client";

import { useMemo, useState } from "react";
import { priceFrom, useStore } from "@/lib/store";
import { CATEGORIES, type Product } from "@/lib/types";
import { currency } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { categoryKey } from "@/lib/labels";
import { CupIcon } from "@/components/icons";
import PosTopbar from "@/components/PosTopbar";
import CartPanel from "@/components/CartPanel";
import ProductSheet from "@/components/ProductSheet";
import OpenTillDialog from "@/components/OpenTillDialog";

export default function PosPage() {
  const { products, cart, shift } = useStore();
  const { t } = useI18n();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("All");
  const [variantOf, setVariantOf] = useState<Product | null>(null);
  /** Product the cashier picked before opening a shift — resumed once the till is open. */
  const [pending, setPending] = useState<Product | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter(
      (p) =>
        (category === "All" || p.category === category) &&
        (!q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q))
    );
  }, [products, query, category]);

  /** Units of each product currently in the cart, across every configuration. */
  const inCart = useMemo(() => {
    const map = new Map<string, number>();
    for (const l of cart) map.set(l.productId, (map.get(l.productId) ?? 0) + l.qty);
    return map;
  }, [cart]);

  // Nothing goes into the cart until a shift is open — the sale needs a cashier and a till.
  const pick = (p: Product) => {
    if (p.stock <= 0) return;
    if (!shift) {
      setPending(p);
      return;
    }
    setVariantOf(p);
  };

  return (
    <div className="flex h-full">
      <section className="flex min-w-0 flex-1 flex-col">
        <PosTopbar query={query} onQuery={setQuery} />

        {/* Categories */}
        <div className="flex shrink-0 items-center gap-2.5 overflow-x-auto border-b border-line px-6 py-4">
          {["All", ...CATEGORIES].map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={[
                "h-11 shrink-0 rounded-full border px-6 text-[15px] font-medium transition-colors",
                category === c
                  ? "border-neutral-900 bg-neutral-900 text-white"
                  : "border-line text-neutral-600 hover:border-neutral-300 hover:text-neutral-900",
              ].join(" ")}
            >
              {c === "All" ? t("common.all") : t(categoryKey(c))}
            </button>
          ))}
        </div>

        {/* Menu grid */}
        <div className="flex-1 overflow-y-auto bg-surface p-6">
          {filtered.length === 0 ? (
            <div className="grid h-full place-items-center text-center">
              <div>
                <p className="text-[15px] font-medium">{t("pos.noMatch")}</p>
                <p className="mt-1 text-sm text-muted">{t("pos.noMatchHint")}</p>
              </div>
            </div>
          ) : (
            <ul className="grid grid-cols-3 gap-3.5 md:grid-cols-4 lg:grid-cols-6">
              {filtered.map((p) => {
                const out = p.stock <= 0;
                const count = inCart.get(p.id) ?? 0;
                return (
                  <li key={p.id}>
                    <div
                      onClick={() => pick(p)}
                      className={[
                        "group flex h-full flex-col overflow-hidden rounded-2xl border bg-white transition-all",
                        count > 0 ? "border-neutral-900 ring-1 ring-neutral-900" : "border-line",
                        out
                          ? "opacity-50"
                          : "cursor-pointer hover:shadow-[0_6px_24px_rgba(0,0,0,0.06)]",
                        !out && count === 0 ? "hover:border-neutral-300" : "",
                      ].join(" ")}
                    >
                      <div className="relative m-2 mb-0 grid aspect-[4/3] place-items-center overflow-hidden rounded-lg bg-neutral-100">
                        <CupIcon className="h-11 w-11 text-neutral-300 transition-colors group-hover:text-neutral-400" />
                        <span className="absolute left-2 top-2 max-w-[calc(100%-1rem)] truncate rounded-md bg-white/95 px-2 py-0.5 text-[10px] font-medium shadow-sm">
                          {t(categoryKey(p.category))}
                        </span>
                      </div>

                      <div className="flex flex-1 flex-col p-3">
                        <p className="line-clamp-2 text-[13px] font-semibold leading-snug tracking-tight">
                          {p.name}
                        </p>
                        <div className="mt-auto flex items-end justify-between gap-1 pt-3">
                          <div className="min-w-0">
                            <p className="truncate text-[10px] text-muted">
                              {out
                                ? t("pos.outOfStock")
                                : p.variants.length > 1
                                  ? t("pos.from")
                                  : t("pos.price")}
                            </p>
                            <p className="text-base font-semibold tracking-tight tabular-nums">
                              {currency(priceFrom(p))}
                            </p>
                          </div>
                          {count > 0 && (
                            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-neutral-900 text-sm font-semibold tabular-nums text-white">
                              {count}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>

      <CartPanel />

      {variantOf && <ProductSheet product={variantOf} onClose={() => setVariantOf(null)} />}

      {pending && (
        <OpenTillDialog
          notice={t("till.requiredForOrder", { product: pending.name })}
          onClose={() => setPending(null)}
          onOpened={() => setVariantOf(pending)}
        />
      )}
    </div>
  );
}
