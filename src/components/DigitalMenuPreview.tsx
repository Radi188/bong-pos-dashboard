"use client";

import {
  type Category,
  type MenuTemplate,
  type Product,
  type Variant,
} from "@/lib/types";
import {
  bestDeal,
  isDiscounted,
  percentOff,
  showsOnDigitalMenu,
  unitPrice,
} from "@/lib/store";
import { currency } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { categoryLabel } from "@/lib/labels";
import { useStore } from "@/lib/store";
import { CupIcon } from "./icons";

export const templateKey = (t: MenuTemplate) =>
  ({
    classic: "menu.tpl.classic",
    board: "menu.tpl.board",
    cards: "menu.tpl.cards",
  })[t] as "menu.tpl.classic" | "menu.tpl.board" | "menu.tpl.cards";

/** A lone "Regular" size is noise on a menu — its price stands on its own. */
const priced = (p: Product) => p.variants.length > 1;

type Tone = "light" | "dark";
type Group = { category: Category; items: Product[] };

/**
 * What a customer sees. Only items flagged onto the digital menu appear, and
 * every size carries its own price so nobody has to ask what a large costs.
 */
export default function DigitalMenuPreview({
  template,
}: {
  template: MenuTemplate;
}) {
  const { products, storeName, categories } = useStore();
  const { t } = useI18n();

  const shown = products.filter(showsOnDigitalMenu);
  const groups = categories
    .map((c) => ({
      category: c,
      items: shown.filter((p) => p.category === c.id),
    }))
    .filter((g) => g.items.length > 0);

  if (groups.length === 0) {
    return (
      <div className="rounded-3xl bg-white p-12 text-center ring-1 ring-black/[0.04]">
        <p className="text-[15px] font-medium">{t("menu.previewEmpty")}</p>
      </div>
    );
  }

  if (template === "board")
    return <Board storeName={storeName} groups={groups} />;
  if (template === "cards")
    return <Cards storeName={storeName} groups={groups} />;
  return <Classic storeName={storeName} groups={groups} />;
}

/**
 * One size's price. A promotion has to read from across a counter, so the sale
 * figure is the bold one and the old price is struck beside it.
 */
function PriceValue({ v, tone = "light" }: { v: Variant; tone?: Tone }) {
  const { t } = useI18n();
  const dark = tone === "dark";

  if (!isDiscounted(v)) {
    return (
      <span className="shrink-0 font-semibold tabular-nums">
        {currency(v.price)}
      </span>
    );
  }

  return (
    <span className="flex shrink-0 items-baseline gap-1.5">
      <span
        className={`text-[13px] tabular-nums line-through decoration-[1.5px] ${
          dark ? "text-white/40" : "text-neutral-400"
        }`}
      >
        {currency(v.price)}
      </span>
      <span
        className={`font-bold tabular-nums ${
          dark ? "text-amber-300" : "text-red-600"
        }`}
      >
        {currency(unitPrice(v))}
      </span>
      <span className="sr-only">
        {t("menu.was", { price: currency(v.price) })}
      </span>
    </span>
  );
}

/** States the saving outright, next to the item name. */
function DealChip({ p, tone = "light" }: { p: Product; tone?: Tone }) {
  const { t } = useI18n();
  const deal = bestDeal(p);
  if (!deal) return null;
  return (
    <span
      className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-bold tabular-nums ${
        tone === "dark"
          ? "bg-amber-300 text-neutral-900"
          : "bg-red-600 text-white"
      }`}
    >
      {t("menu.percentOff", { percent: percentOff(deal) })}
    </span>
  );
}

/* ----------------------------------------------------------- templates */

/** Printed-menu look: every size gets its own line with a dotted leader. */
function Classic({
  storeName,
  groups,
}: {
  storeName: string;
  groups: Group[];
}) {
  const { t } = useI18n();
  return (
    <div className="mx-auto max-w-2xl rounded-3xl bg-white px-8 py-10 ring-1 ring-black/[0.04] sm:px-12">
      <header className="border-b-2 border-neutral-900 pb-6 text-center">
        <h1 className="text-3xl font-bold tracking-tight">{storeName}</h1>
        <p className="mt-1 text-xs uppercase tracking-[0.25em] text-muted">
          {t("nav.menu")}
        </p>
      </header>

      <div className="mt-8 space-y-8">
        {groups.map((g) => (
          <section key={g.category.id}>
            <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-muted">
              {categoryLabel(g.category, t)}
            </h2>
            <ul className="mt-3 space-y-4">
              {g.items.map((p) =>
                priced(p) ? (
                  <li key={p.id}>
                    <div className="flex items-baseline gap-2">
                      <span className="font-semibold">{p.name}</span>
                      <DealChip p={p} />
                    </div>
                    <ul className="mt-1.5 space-y-1.5 pl-4">
                      {p.variants.map((v) => (
                        <li key={v.id} className="flex items-baseline gap-3">
                          <span className="shrink-0 text-sm text-muted">
                            {v.label}
                          </span>
                          <span className="min-w-6 flex-1 translate-y-[-3px] border-b border-dotted border-neutral-300" />
                          <PriceValue v={v} />
                        </li>
                      ))}
                    </ul>
                  </li>
                ) : (
                  <li key={p.id} className="flex items-baseline gap-2">
                    <span className="shrink-0 font-semibold">{p.name}</span>
                    <DealChip p={p} />
                    <span className="min-w-6 flex-1 translate-y-[-3px] border-b border-dotted border-neutral-300" />
                    <PriceValue v={p.variants[0]} />
                  </li>
                ),
              )}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}

/** Café chalkboard: sizes run inline under the name so a column stays short. */
function Board({ storeName, groups }: { storeName: string; groups: Group[] }) {
  const { t } = useI18n();
  return (
    <div className="mx-auto max-w-3xl rounded-3xl bg-neutral-950 px-8 py-10 text-white sm:px-12">
      <header className="text-center">
        <h1 className="text-3xl font-bold tracking-tight">{storeName}</h1>
        <p className="mt-1 text-xs uppercase tracking-[0.25em] text-white/40">
          {t("nav.menu")}
        </p>
      </header>

      <div className="mt-9 grid gap-x-10 gap-y-7 sm:grid-cols-2">
        {groups.map((g) => (
          <section key={g.category.id}>
            <h2 className="border-b border-white/15 pb-2 text-sm font-bold uppercase tracking-[0.15em] text-white/70">
              {categoryLabel(g.category, t)}
            </h2>
            <ul className="mt-3 space-y-3.5">
              {g.items.map((p) => (
                <li key={p.id}>
                  <div className="flex items-baseline gap-2">
                    <span className="min-w-0 truncate font-medium">
                      {p.name}
                    </span>
                    <DealChip p={p} tone="dark" />
                  </div>
                  <ul className="mt-1 flex flex-wrap items-baseline gap-x-5 gap-y-1">
                    {p.variants.map((v) => (
                      <li key={v.id} className="flex items-baseline gap-1.5">
                        {priced(p) && (
                          <span className="text-xs uppercase tracking-wide text-white/45">
                            {v.label}
                          </span>
                        )}
                        <PriceValue v={v} tone="dark" />
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}

/** Photo-forward grid, closest to a delivery-app listing. */
function Cards({ storeName, groups }: { storeName: string; groups: Group[] }) {
  const { t } = useI18n();
  return (
    <div className="mx-auto max-w-5xl">
      <header className="rounded-3xl bg-neutral-900 px-8 py-8 text-center text-white">
        <h1 className="text-3xl font-bold tracking-tight">{storeName}</h1>
        <p className="mt-1 text-xs uppercase tracking-[0.25em] text-white/40">
          {t("nav.menu")}
        </p>
      </header>

      <div className="mt-6 space-y-7">
        {groups.map((g) => (
          <section key={g.category.id}>
            <h2 className="text-lg font-bold tracking-tight">
              {categoryLabel(g.category, t)}
            </h2>
            <ul className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
              {g.items.map((p) => (
                <li
                  key={p.id}
                  className="flex flex-col overflow-hidden rounded-2xl bg-white ring-1 ring-black/[0.04]"
                >
                  <div className="relative grid aspect-[4/3] place-items-center bg-neutral-100">
                    <CupIcon className="h-10 w-10 text-neutral-300" />
                    <span className="absolute left-2 top-2">
                      <DealChip p={p} />
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col p-3">
                    <p className="line-clamp-2 text-sm font-semibold leading-snug">
                      {p.name}
                    </p>
                    <ul className="mt-2 space-y-1 border-t border-line pt-2 text-sm">
                      {p.variants.map((v) => (
                        <li
                          key={v.id}
                          className="flex items-baseline justify-between gap-2"
                        >
                          {priced(p) && (
                            <span className="shrink-0 text-xs text-muted">
                              {v.label}
                            </span>
                          )}
                          <span className="ml-auto">
                            <PriceValue v={v} />
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
