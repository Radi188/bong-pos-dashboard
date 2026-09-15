"use client";

import type { Order } from "@/lib/types";
import { lineOptions } from "@/lib/cart";
import { clockTime } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { useStore } from "@/lib/store";

/**
 * Drink stickers for a paid order, laid out at the label stock's real size so
 * what shows on screen is what leaves the printer. One sticker per cup when
 * the printer is set to `perItem`, otherwise one per order.
 */
export default function LabelSheet({ order }: { order: Order }) {
  const { settings, storeName } = useStore();
  const { t } = useI18n();
  const { size, perItem } = settings.labelPrinter;

  // One sticker per cup: a line of qty 3 needs three stickers, numbered.
  const stickers = perItem
    ? order.lines.flatMap((l) =>
        Array.from({ length: l.qty }, (_, i) => ({
          key: `${l.id}-${i}`,
          line: l,
          index: i + 1,
          of: l.qty,
        })),
      )
    : order.lines.map((l) => ({ key: l.id, line: l, index: 0, of: 0 }));

  return (
    <div className="print-labels flex flex-wrap justify-center gap-3">
      {stickers.map(({ key, line, index, of }) => (
        <div
          key={key}
          className="label-sticker flex flex-col overflow-hidden rounded-lg border border-line bg-white p-2 text-black"
          style={{ width: `${size.width}mm`, height: `${size.height}mm` }}
        >
          <div className="flex items-baseline justify-between text-[7pt] leading-none text-neutral-500">
            <span className="truncate">{storeName}</span>
            <span className="shrink-0 tabular-nums">#{order.number}</span>
          </div>

          <p className="mt-1 line-clamp-2 text-[10pt] font-bold leading-tight">
            {line.name}
          </p>

          <p className="mt-0.5 line-clamp-2 text-[7pt] leading-tight text-neutral-600">
            {lineOptions(line)}
          </p>

          {line.note && (
            <p className="line-clamp-1 text-[7pt] italic leading-tight text-neutral-600">
              &ldquo;{line.note}&rdquo;
            </p>
          )}

          <div className="mt-auto flex items-baseline justify-between text-[7pt] leading-none text-neutral-500">
            <span className="tabular-nums">{clockTime(order.createdAt)}</span>
            <span className="shrink-0 font-semibold tabular-nums">
              {of > 1
                ? t("label.cupOf", { index, of })
                : !perItem && line.qty > 1
                  ? t("label.qty", { count: line.qty })
                  : ""}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
