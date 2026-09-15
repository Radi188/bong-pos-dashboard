"use client";

import Link from "next/link";

import { useMemo, useState } from "react";
import {
  isDiscounted,
  priceFrom,
  showsOnDigitalMenu,
  useStore,
} from "@/lib/store";
import { type Product, type Variant } from "@/lib/types";
import { useI18n } from "@/lib/i18n";
import { categoryLabel } from "@/lib/labels";
import { currency } from "@/lib/format";
import {
  BoxIcon,
  CloseIcon,
  CupIcon,
  GridIcon,
  MenuListIcon,
  PlusIcon,
  ProductsIcon,
  SearchIcon,
  TrashIcon,
} from "@/components/icons";
import PageHeader from "@/components/PageHeader";
import { Toggle } from "@/components/settings-ui";
import PriceTag from "@/components/PriceTag";
import ToppingsDialog from "@/components/ToppingsDialog";

const blank = (category: string): Product => ({
  id: "",
  name: "",
  category,
  sku: "",
  variants: [{ id: "s", label: "Small", price: 0 }],
  addonIds: [],
  onDigitalMenu: true,
});

export default function MenuPage() {
  const { products, saveProduct, deleteProduct, categories, categoryById } =
    useStore();
  const setOnDigitalMenu = (p: Product, v: boolean) =>
    saveProduct({ ...p, onDigitalMenu: v });
  const [query, setQuery] = useState("");
  const { t } = useI18n();
  const [category, setCategory] = useState<string>("All");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [editing, setEditing] = useState<Product | null>(null);
  const [toppingsOpen, setToppingsOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter(
      (p) =>
        (category === "All" || p.category === category) &&
        (!q ||
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q)),
    );
  }, [products, query, category]);

  const grouped = useMemo(
    () =>
      categories
        .map((c) => ({
          category: c,
          items: filtered.filter((p) => p.category === c.id),
        }))
        .filter((g) => g.items.length > 0),
    [filtered, categories],
  );

  const onMenu = products.filter(showsOnDigitalMenu).length;
  const avgPrice = products.length
    ? products.reduce((s, p) => s + priceFrom(p), 0) / products.length
    : 0;

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title={t("nav.menu")}
        subtitle={t("menu.subtitle", {
          items: products.length,
          categories: categories.length,
        })}
      >
        <div className="relative hidden w-56 @3xl:block">
          <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("pos.searchMenu")}
            className="h-12 w-full rounded-2xl border border-line bg-surface pl-11 pr-4 text-[15px] outline-none transition-colors placeholder:text-muted focus:border-neutral-900 focus:bg-white"
          />
        </div>
        <Link
          href="/categories"
          className="flex h-12 items-center gap-2 rounded-2xl border border-line px-4 text-sm font-medium transition-colors hover:border-neutral-900"
        >
          <ProductsIcon className="h-[18px] w-[18px]" />
          {t("menu.categories")}
        </Link>
        <button
          onClick={() => setToppingsOpen(true)}
          className="flex h-12 items-center gap-2 rounded-2xl border border-line px-4 text-sm font-medium transition-colors hover:border-neutral-900"
        >
          <BoxIcon className="h-[18px] w-[18px]" />
          {t("menu.toppings")}
        </button>
        <button
          onClick={() => setEditing(blank(categories[0]?.id ?? ""))}
          className="flex h-12 items-center gap-2 rounded-2xl bg-neutral-900 px-5 text-sm font-semibold text-white transition-opacity hover:opacity-85"
        >
          <PlusIcon className="h-[18px] w-[18px]" />
          {t("menu.newItem")}
        </button>
      </PageHeader>

      <div className="flex-1 overflow-y-auto bg-surface p-6">
        {/* Summary */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Tile label={t("menu.tileItems")} value={String(products.length)} />
          <Tile
            label={t("menu.tileOnMenu")}
            value={`${onMenu}/${products.length}`}
          />
          <Tile label={t("menu.tileAvgPrice")} value={currency(avgPrice)} />
        </div>

        {/* Filters */}
        <div className="mt-4 flex flex-wrap items-center gap-2.5">
          {[{ id: "All", name: "" }, ...categories].map((c) => {
            const n =
              c.id === "All"
                ? products.length
                : products.filter((p) => p.category === c.id).length;
            return (
              <button
                key={c.id}
                onClick={() => setCategory(c.id)}
                className={[
                  "flex h-11 items-center gap-2 rounded-2xl border px-5 text-[15px] font-semibold transition-colors",
                  category === c.id
                    ? "border-neutral-900 bg-neutral-900 text-white"
                    : "border-line bg-white text-neutral-700 hover:border-neutral-300",
                ].join(" ")}
              >
                {c.id === "All" ? t("common.all") : categoryLabel(c, t)}
                <span
                  className={`text-xs tabular-nums ${
                    category === c.id ? "text-neutral-400" : "text-muted"
                  }`}
                >
                  {n}
                </span>
              </button>
            );
          })}

          <div className="ml-auto flex h-11 items-center gap-1 rounded-2xl bg-neutral-100 p-1">
            {(
              [
                ["grid", GridIcon, "menu.gridView"],
                ["list", MenuListIcon, "menu.listView"],
              ] as const
            ).map(([id, Icon, labelKey]) => (
              <button
                key={id}
                onClick={() => setView(id)}
                aria-label={t(labelKey)}
                className={[
                  "grid h-9 w-10 place-items-center rounded-xl transition-colors",
                  view === id
                    ? "bg-white text-neutral-900 shadow-sm"
                    : "text-neutral-500",
                ].join(" ")}
              >
                <Icon className="h-[18px] w-[18px]" />
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="mt-4 rounded-3xl bg-white p-12 text-center ring-1 ring-black/[0.04]">
            <p className="text-[15px] font-medium">{t("pos.noMatch")}</p>
            <p className="mt-1.5 text-sm text-muted">{t("pos.noMatchHint")}</p>
          </div>
        ) : view === "grid" ? (
          <div className="mt-4 space-y-6">
            {grouped.map((g) => (
              <section key={g.category.id}>
                <div className="flex items-baseline gap-2.5">
                  <h2 className="text-lg font-bold tracking-tight">
                    {categoryLabel(g.category, t)}
                  </h2>
                  <span className="text-sm text-muted tabular-nums">
                    {g.items.length}
                  </span>
                </div>
                <ul className="mt-3 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                  {g.items.map((p) => (
                    <li key={p.id}>
                      <ItemCard
                        product={p}
                        onEdit={() => setEditing(p)}
                        onDelete={() => deleteProduct(p.id)}
                      />
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        ) : (
          <div className="mt-4 overflow-hidden rounded-3xl bg-white ring-1 ring-black/[0.04]">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[880px] text-[15px]">
                <thead>
                  <tr className="border-b border-line text-left text-sm text-muted">
                    <th className="px-6 py-3.5 font-normal">
                      {t("menu.colItem")}
                    </th>
                    <th className="px-6 py-3.5 font-normal">
                      {t("menu.category")}
                    </th>
                    <th className="px-6 py-3.5 font-normal">
                      {t("menu.colSizes")}
                    </th>
                    <th className="px-6 py-3.5 text-right font-normal">
                      {t("pos.from")}
                    </th>
                    <th className="px-6 py-3.5 text-center font-normal">
                      {t("menu.colDigitalMenu")}
                    </th>
                    <th className="w-28 px-6 py-3.5" />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p) => (
                    <tr
                      key={p.id}
                      className="group border-b border-line last:border-0"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-neutral-100">
                            <CupIcon className="h-5 w-5 text-neutral-400" />
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate font-semibold tracking-tight">
                              {p.name}
                            </span>
                            <span className="block truncate text-sm text-muted">
                              {p.sku}
                            </span>
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="rounded-lg bg-neutral-100 px-2.5 py-1 text-sm font-medium">
                          {categoryLabel(
                            categoryById(p.category),
                            t,
                            p.category,
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted">
                        {p.variants.map((v) => v.label).join(", ")}
                      </td>
                      <td className="px-6 py-4">
                        <span className="flex justify-end">
                          <PriceTag p={p} size="sm" />
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {/* Flips straight from the row — no need to open the item. */}
                        <div className="flex justify-center">
                          <Toggle
                            checked={showsOnDigitalMenu(p)}
                            onChange={(v) => setOnDigitalMenu(p, v)}
                            label={t("menu.toggleDigitalMenu", {
                              name: p.name,
                            })}
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                          <button
                            onClick={() => setEditing(p)}
                            className="rounded-lg px-3 py-1.5 text-sm font-medium transition-colors hover:bg-neutral-100"
                          >
                            {t("common.edit")}
                          </button>
                          <button
                            onClick={() => deleteProduct(p.id)}
                            aria-label={t("menu.delete", { name: p.name })}
                            className="grid h-8 w-8 place-items-center rounded-lg text-muted transition-colors hover:bg-neutral-100 hover:text-neutral-900"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {toppingsOpen && (
        <ToppingsDialog onClose={() => setToppingsOpen(false)} />
      )}

      {editing && (
        <ItemDialog
          product={editing}
          onClose={() => setEditing(null)}
          onSave={(p) => {
            saveProduct({ ...p, id: p.id || crypto.randomUUID() });
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

function ItemCard({
  product: p,
  onEdit,
  onDelete,
}: {
  product: Product;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { t } = useI18n();

  return (
    <div
      onClick={onEdit}
      className="group flex h-full cursor-pointer flex-col overflow-hidden rounded-2xl border border-line bg-white transition-all hover:border-neutral-300 hover:shadow-[0_6px_24px_rgba(0,0,0,0.06)]"
    >
      <div className="relative m-3 mb-0 grid aspect-[4/3] place-items-center overflow-hidden rounded-xl bg-neutral-100">
        <CupIcon className="h-12 w-12 text-neutral-300" />
        {!showsOnDigitalMenu(p) && (
          <span className="absolute left-2 top-2 rounded-md bg-neutral-900 px-2 py-0.5 text-[10px] font-semibold text-white">
            {t("menu.hiddenBadge")}
          </span>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          aria-label={t("menu.delete", { name: p.name })}
          className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-lg bg-white/95 text-muted opacity-0 shadow-sm transition-all hover:text-neutral-900 focus:opacity-100 group-hover:opacity-100"
        >
          <TrashIcon className="h-4 w-4" />
        </button>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <p className="line-clamp-2 text-[15px] font-semibold leading-snug tracking-tight">
          {p.name}
        </p>
        <p className="mt-1 text-xs text-muted">
          {p.sku} · {t("menu.sizeCount", { count: p.variants.length })}
        </p>
        <div className="mt-auto flex items-end justify-between gap-2 pt-4">
          <span>
            <span className="block text-[10px] text-muted">
              {t("pos.from")}
            </span>
            <PriceTag p={p} />
          </span>
        </div>
      </div>
    </div>
  );
}

function Tile({
  label,
  value,
  muted,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] ring-1 ring-black/[0.04]">
      <p className="text-sm text-neutral-500">{label}</p>
      <p
        className={`mt-1 text-2xl font-bold tracking-tight tabular-nums ${
          muted ? "text-neutral-300" : ""
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function ItemDialog({
  product,
  onSave,
  onClose,
}: {
  product: Product;
  onSave: (p: Product) => void;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const { toppings, categories } = useStore();
  const [form, setForm] = useState(product);
  /**
   * A sale price at or above the normal price is not a discount, and the rest
   * of the app ignores it. Saying so here beats accepting the number and
   * silently dropping it, which reads as the feature being broken.
   */
  const badSale = form.variants.filter(
    (v) =>
      v.salePrice !== undefined && v.salePrice > 0 && v.salePrice >= v.price,
  );

  const valid =
    form.name.trim() !== "" &&
    form.variants.length > 0 &&
    form.variants.every((v) => v.label.trim() !== "" && v.price > 0) &&
    badSale.length === 0;

  const setVariant = (i: number, patch: Partial<Variant>) =>
    setForm((f) => ({
      ...f,
      variants: f.variants.map((v, idx) =>
        idx === i ? { ...v, ...patch } : v,
      ),
    }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-neutral-950/40 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div className="relative max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white shadow-2xl ring-1 ring-black/10">
        <div className="flex items-center justify-between border-b border-line px-6 py-5">
          <h2 className="text-lg font-semibold tracking-tight">
            {product.id ? t("menu.editItem") : t("menu.newItem")}
          </h2>
          <button
            onClick={onClose}
            aria-label={t("common.close")}
            className="grid h-9 w-9 place-items-center rounded-xl text-muted transition-colors hover:bg-neutral-100 hover:text-neutral-900"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 px-6 py-5">
          <Field label={t("common.name")}>
            <input
              autoFocus
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="h-12 w-full rounded-xl border border-line px-4 text-[15px] outline-none transition-colors focus:border-neutral-900"
            />
          </Field>
          {/* SKU paired with category now that stock no longer shares the row. */}
          <div className="grid grid-cols-2 gap-3">
            <Field label={t("menu.sku")}>
              <input
                value={form.sku}
                onChange={(e) => setForm({ ...form, sku: e.target.value })}
                className="h-12 w-full rounded-xl border border-line px-4 text-[15px] outline-none transition-colors focus:border-neutral-900"
              />
            </Field>
            <Field label={t("menu.category")}>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="h-12 w-full rounded-xl border border-line bg-white px-4 text-[15px] outline-none transition-colors focus:border-neutral-900"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {categoryLabel(c, t)}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <div>
            <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted">
              {t("menu.sizesPrices")}
            </span>
            <div className="mb-1.5 flex gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted">
              <span className="min-w-0 flex-1" />
              <span className="w-20 shrink-0 text-right">
                {t("menu.listPrice")}
              </span>
              <span className="w-20 shrink-0 text-right text-red-600">
                {t("menu.salePrice")}
              </span>
              <span className="w-10 shrink-0" />
            </div>
            <ul className="space-y-2">
              {form.variants.map((v, i) => (
                <li key={i} className="flex gap-1.5">
                  <input
                    value={v.label}
                    onChange={(e) => setVariant(i, { label: e.target.value })}
                    placeholder={t("menu.sizePlaceholder")}
                    /* min-w-0: an input will not shrink past its intrinsic width,
                       which pushed the sale field out of the dialog. */
                    className="h-12 min-w-0 flex-1 rounded-xl border border-line px-4 text-[15px] outline-none transition-colors focus:border-neutral-900"
                  />
                  <input
                    inputMode="decimal"
                    value={v.price || ""}
                    onChange={(e) =>
                      setVariant(i, {
                        price: Number(
                          e.target.value.replace(/[^0-9.]/g, "") || 0,
                        ),
                      })
                    }
                    placeholder="0.00"
                    aria-label={t("menu.listPrice")}
                    className="h-12 w-20 shrink-0 rounded-xl border border-line px-2.5 text-right text-[15px] tabular-nums outline-none transition-colors focus:border-neutral-900"
                  />
                  {/* Left blank the promotion is cleared, rather than stored as zero. */}
                  <input
                    inputMode="decimal"
                    value={v.salePrice || ""}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/[^0-9.]/g, "");
                      setVariant(i, {
                        salePrice: raw === "" ? undefined : Number(raw),
                      });
                    }}
                    placeholder={t("menu.salePlaceholder")}
                    aria-label={t("menu.salePrice")}
                    className={[
                      "h-12 w-20 shrink-0 rounded-xl border px-2.5 text-right text-[15px] tabular-nums outline-none transition-colors focus:border-neutral-900",
                      v.salePrice !== undefined &&
                      v.salePrice > 0 &&
                      v.salePrice >= v.price
                        ? "border-red-500 bg-red-50 text-red-700"
                        : isDiscounted(v)
                          ? "border-neutral-900 font-semibold"
                          : "border-line",
                    ].join(" ")}
                  />
                  <button
                    onClick={() =>
                      setForm((f) => ({
                        ...f,
                        variants: f.variants.filter((_, idx) => idx !== i),
                      }))
                    }
                    disabled={form.variants.length === 1}
                    aria-label={t("menu.removeSize")}
                    className="grid h-12 w-10 shrink-0 place-items-center rounded-xl border border-line text-muted transition-colors hover:text-neutral-900 disabled:opacity-30"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
            <button
              onClick={() =>
                setForm((f) => ({
                  ...f,
                  variants: [
                    ...f.variants,
                    {
                      id: crypto.randomUUID().slice(0, 6),
                      label: "",
                      price: 0,
                    },
                  ],
                }))
              }
              className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-neutral-300 text-sm font-medium text-muted transition-colors hover:border-neutral-900 hover:text-neutral-900"
            >
              <PlusIcon className="h-4 w-4" />
              {t("menu.addSize")}
            </button>

            {badSale.length > 0 ? (
              <p className="mt-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                {t("menu.saleTooHigh", {
                  sizes: badSale.map((v) => v.label || "—").join(", "),
                })}
              </p>
            ) : (
              <p className="mt-2 text-xs text-muted">{t("menu.saleHint")}</p>
            )}
          </div>

          {/* Ticking a topping here is what makes it appear at the till. */}
          <div>
            <div className="mb-1.5 flex items-baseline gap-2">
              <span className="text-xs font-medium uppercase tracking-wider text-muted">
                {t("menu.toppingsOn")}
              </span>
              {toppings.length > 0 && (
                <span className="ml-auto flex gap-1">
                  <button
                    onClick={() =>
                      setForm({ ...form, addonIds: toppings.map((a) => a.id) })
                    }
                    className="rounded-lg px-2 py-0.5 text-xs font-medium text-muted transition-colors hover:bg-neutral-100 hover:text-neutral-900"
                  >
                    {t("menu.selectAll")}
                  </button>
                  <button
                    onClick={() => setForm({ ...form, addonIds: [] })}
                    className="rounded-lg px-2 py-0.5 text-xs font-medium text-muted transition-colors hover:bg-neutral-100 hover:text-neutral-900"
                  >
                    {t("menu.selectNone")}
                  </button>
                </span>
              )}
            </div>

            {toppings.length === 0 ? (
              <p className="rounded-xl border border-dashed border-neutral-300 px-4 py-3 text-xs text-muted">
                {t("menu.toppingsNone")}
              </p>
            ) : (
              <>
                <ul className="flex flex-wrap gap-2">
                  {toppings.map((a) => {
                    const on = form.addonIds?.includes(a.id) ?? false;
                    return (
                      <li key={a.id}>
                        <button
                          onClick={() =>
                            setForm((f) => ({
                              ...f,
                              addonIds: on
                                ? (f.addonIds ?? []).filter((x) => x !== a.id)
                                : [...(f.addonIds ?? []), a.id],
                            }))
                          }
                          aria-pressed={on}
                          className={[
                            "rounded-xl border px-3 py-2 text-sm transition-colors",
                            on
                              ? "border-neutral-900 bg-neutral-900 text-white"
                              : "border-line text-neutral-700 hover:border-neutral-300",
                          ].join(" ")}
                        >
                          {a.name}
                          <span
                            className={`ml-1.5 tabular-nums ${on ? "text-neutral-400" : "text-muted"}`}
                          >
                            +{currency(a.price)}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
                <p className="mt-2 text-xs text-muted">
                  {t("menu.toppingsHint")}
                </p>
              </>
            )}
          </div>

          <div className="flex items-center justify-between gap-4 rounded-2xl bg-surface px-5 py-4">
            <div className="min-w-0">
              <p className="text-[15px] font-semibold">
                {t("menu.onDigitalMenu")}
              </p>
              <p className="mt-0.5 text-xs text-muted">
                {t("menu.onDigitalMenuBlurb")}
              </p>
            </div>
            <Toggle
              checked={form.onDigitalMenu !== false}
              onChange={(v) => setForm({ ...form, onDigitalMenu: v })}
              label={t("menu.onDigitalMenu")}
            />
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
            onClick={() => valid && onSave(form)}
            disabled={!valid}
            className="h-12 flex-1 rounded-xl bg-neutral-900 text-sm font-semibold text-white transition-opacity hover:opacity-85 disabled:bg-neutral-200 disabled:text-neutral-400"
          >
            {t("common.save")}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted">
        {label}
      </span>
      {children}
    </label>
  );
}
