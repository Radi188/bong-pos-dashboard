"use client";

import {
  bestDeal,
  cheapestVariant,
  isDiscounted,
  percentOff,
  unitPrice,
} from "@/lib/store";
import type { Product } from "@/lib/types";
import { currency } from "@/lib/format";
import { useI18n } from "@/lib/i18n";

/**
 * The "from" price for an item, shared by the register and the menu manager so
 * the two cannot drift. Both figures come from the size being quoted. When a
 * promotion sits on some *other* size, that size is not the one on show, so the
 * saving is flagged as a percentage instead of silently disappearing.
 */
export default function PriceTag({
  p,
  size = "md",
}: {
  p: Product;
  size?: "sm" | "md";
}) {
  const { t } = useI18n();
  const cheapest = cheapestVariant(p);
  const deal = bestDeal(p);
  const onSale = isDiscounted(cheapest);

  return (
    <span className="flex items-baseline gap-1.5">
      {onSale && (
        <span
          className={`tabular-nums text-muted line-through decoration-[1.5px] ${
            size === "sm" ? "text-[11px]" : "text-xs"
          }`}
        >
          {currency(cheapest.price)}
        </span>
      )}
      <span
        className={`font-semibold tracking-tight tabular-nums ${
          size === "sm" ? "text-base" : "text-lg"
        } ${onSale ? "text-red-600" : ""}`}
      >
        {currency(unitPrice(cheapest))}
      </span>
      {deal && !onSale && (
        <span className="rounded bg-red-600 px-1 py-px text-[9px] font-bold tabular-nums text-white">
          {t("menu.percentOff", { percent: percentOff(deal) })}
        </span>
      )}
    </span>
  );
}
