"use client";

import { useMemo, useState } from "react";
import { priceFrom, useStore } from "@/lib/store";
import { CATEGORIES, type Category, type Product, type Variant } from "@/lib/types";
import { useI18n } from "@/lib/i18n";
import { categoryKey } from "@/lib/labels";
import { currency } from "@/lib/format";
import {
  CloseIcon,
  CupIcon,
  GridIcon,
  MenuListIcon,
  PlusIcon,
  SearchIcon,
  TrashIcon,
} from "@/components/icons";
import PageHeader from "@/components/PageHeader";

const blank = (): Product => ({
  id: "",
  name: "",
  category: "Coffee Time",
  sku: "",
  stock: 0,
  variants: [{ id: "s", label: "Small", price: 0 }],
});

const LOW_STOCK = 20;

export default function MenuPage() {
  const { products, saveProduct, deleteProduct } = useStore();
  const [query, setQuery] = useState("");
  const { t } = useI18n();
  const [category, setCategory] = useState<string>("All");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [editing, setEditing] = useState<Product | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter(
      (p) =>
        (category === "All" || p.category === category) &&
        (!q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q))
    );
  }, [products, query, category]);

  const grouped = useMemo(
    () =>
      CATEGORIES.map((c) => ({ category: c, items: filtered.filter((p) => p.category === c) }))
        .filter((g) => g.items.length > 0),
    [filtered]
  );

  const outOfStock = products.filter((p) => p.stock <= 0).length;
  const lowStock = products.filter((p) => p.stock > 0 && p.stock <= LOW_STOCK).length;
  const avgPrice = products.length
    ? products.reduce((s, p) => s + priceFrom(p), 0) / products.length
    : 0;

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title={t("nav.menu")}
        subtitle={t("menu.subtitle", { items: products.length, categories: CATEGORIES.length })}
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
        <button
          onClick={() => setEditing(blank())}
          className="flex h-12 items-center gap-2 rounded-2xl bg-neutral-900 px-5 text-sm font-semibold text-white transition-opacity hover:opacity-85"
        >
          <PlusIcon className="h-[18px] w-[18px]" />
          {t("menu.newItem")}
        </button>
      </PageHeader>

      <div className="flex-1 overflow-y-auto bg-surface p-6">
        {/* Summary */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Tile label={t("menu.tileItems")} value={String(products.length)} />
          <Tile label={t("menu.tileAvgPrice")} value={currency(avgPrice)} />
          <Tile label={t("menu.tileLowStock", { threshold: LOW_STOCK })} value={String(lowStock)} />
          <Tile label={t("menu.tileOutOfStock")} value={String(outOfStock)} muted={outOfStock === 0} />
        </div>

        {/* Filters */}
        <div className="mt-4 flex flex-wrap items-center gap-2.5">
          {["All", ...CATEGORIES].map((c) => {
            const n =
              c === "All" ? products.length : products.filter((p) => p.category === c).length;
            return (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={[
                  "flex h-11 items-center gap-2 rounded-2xl border px-5 text-[15px] font-semibold transition-colors",
                  category === c
                    ? "border-neutral-900 bg-neutral-900 text-white"
                    : "border-line bg-white text-neutral-700 hover:border-neutral-300",
                ].join(" ")}
              >
                {c === "All" ? t("common.all") : t(categoryKey(c))}
                <span
                  className={`text-xs tabular-nums ${
                    category === c ? "text-neutral-400" : "text-muted"
                  }`}
                >
                  {n}
                </span>
              </button>
            );
          })}

          <div className="ml-auto flex h-11 items-center gap-1 rounded-2xl bg-neutral-100 p-1">
            {([
              ["grid", GridIcon],
              ["list", MenuListIcon],
            ] as const).map(([id, Icon]) => (
              <button
                key={id}
                onClick={() => setView(id)}
                aria-label={id === "grid" ? t("menu.gridView") : t("menu.listView")}
                className={[
                  "grid h-9 w-10 place-items-center rounded-xl transition-colors",
                  view === id ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-500",
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
              <section key={g.category}>
                <div className="flex items-baseline gap-2.5">
                  <h2 className="text-lg font-bold tracking-tight">{t(categoryKey(g.category))}</h2>
                  <span className="text-sm text-muted tabular-nums">{g.items.length}</span>
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
              <table className="w-full min-w-[760px] text-[15px]">
                <thead>
                  <tr className="border-b border-line text-left text-sm text-muted">
                    <th className="px-6 py-3.5 font-normal">{t("menu.colItem")}</th>
                    <th className="px-6 py-3.5 font-normal">{t("menu.category")}</th>
                    <th className="px-6 py-3.5 font-normal">{t("menu.colSizes")}</th>
                    <th className="px-6 py-3.5 text-right font-normal">{t("pos.from")}</th>
                    <th className="px-6 py-3.5 text-right font-normal">{t("menu.colStock")}</th>
                    <th className="w-28 px-6 py-3.5" />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p) => (
                    <tr key={p.id} className="group border-b border-line last:border-0">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-neutral-100">
                            <CupIcon className="h-5 w-5 text-neutral-400" />
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate font-semibold tracking-tight">
                              {p.name}
                            </span>
                            <span className="block truncate text-sm text-muted">{p.sku}</span>
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="rounded-lg bg-neutral-100 px-2.5 py-1 text-sm font-medium">
                          {t(categoryKey(p.category))}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted">
                        {p.variants.map((v) => v.label).join(", ")}
                      </td>
                      <td className="px-6 py-4 text-right font-semibold tabular-nums">
                        {currency(priceFrom(p))}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <StockBadge stock={p.stock} />
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
            <span className="block text-[10px] text-muted">{t("pos.from")}</span>
            <span className="block text-lg font-bold tracking-tight tabular-nums">
              {currency(priceFrom(p))}
            </span>
          </span>
          <StockBadge stock={p.stock} />
        </div>
      </div>
    </div>
  );
}

function StockBadge({ stock }: { stock: number }) {
  const { t } = useI18n();
  const tone =
    stock <= 0
      ? "bg-red-50 text-red-600"
      : stock <= LOW_STOCK
        ? "bg-neutral-900 text-white"
        : "bg-neutral-100 text-neutral-600";
  return (
    <span className={`shrink-0 rounded-lg px-2.5 py-1 text-xs font-semibold tabular-nums ${tone}`}>
      {stock <= 0 ? t("pos.outOfStock") : t("menu.stockLeft", { count: stock })}
    </span>
  );
}

function Tile({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
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
  const [form, setForm] = useState(product);
  const valid =
    form.name.trim() !== "" &&
    form.variants.length > 0 &&
    form.variants.every((v) => v.label.trim() !== "" && v.price > 0);

  const setVariant = (i: number, patch: Partial<Variant>) =>
    setForm((f) => ({
      ...f,
      variants: f.variants.map((v, idx) => (idx === i ? { ...v, ...patch } : v)),
    }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-neutral-950/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-3xl bg-white shadow-2xl ring-1 ring-black/10">
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
          <div className="grid grid-cols-2 gap-3">
            <Field label={t("menu.sku")}>
              <input
                value={form.sku}
                onChange={(e) => setForm({ ...form, sku: e.target.value })}
                className="h-12 w-full rounded-xl border border-line px-4 text-[15px] outline-none transition-colors focus:border-neutral-900"
              />
            </Field>
            <Field label={t("menu.stock")}>
              <input
                inputMode="numeric"
                value={form.stock || ""}
                onChange={(e) =>
                  setForm({ ...form, stock: Number(e.target.value.replace(/[^0-9]/g, "") || 0) })
                }
                className="h-12 w-full rounded-xl border border-line px-4 text-[15px] tabular-nums outline-none transition-colors focus:border-neutral-900"
              />
            </Field>
          </div>
          <Field label={t("menu.category")}>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value as Category })}
              className="h-12 w-full rounded-xl border border-line bg-white px-4 text-[15px] outline-none transition-colors focus:border-neutral-900"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {t(categoryKey(c))}
                </option>
              ))}
            </select>
          </Field>

          <div>
            <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted">
              {t("menu.sizesPrices")}
            </span>
            <ul className="space-y-2">
              {form.variants.map((v, i) => (
                <li key={i} className="flex gap-2">
                  <input
                    value={v.label}
                    onChange={(e) => setVariant(i, { label: e.target.value })}
                    placeholder={t("menu.sizePlaceholder")}
                    className="h-12 flex-1 rounded-xl border border-line px-4 text-[15px] outline-none transition-colors focus:border-neutral-900"
                  />
                  <input
                    inputMode="decimal"
                    value={v.price || ""}
                    onChange={(e) =>
                      setVariant(i, { price: Number(e.target.value.replace(/[^0-9.]/g, "") || 0) })
                    }
                    placeholder="0.00"
                    className="h-12 w-28 rounded-xl border border-line px-4 text-right text-[15px] tabular-nums outline-none transition-colors focus:border-neutral-900"
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
                    className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-line text-muted transition-colors hover:text-neutral-900 disabled:opacity-30"
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
                    { id: crypto.randomUUID().slice(0, 6), label: "", price: 0 },
                  ],
                }))
              }
              className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-neutral-300 text-sm font-medium text-muted transition-colors hover:border-neutral-900 hover:text-neutral-900"
            >
              <PlusIcon className="h-4 w-4" />
              {t("menu.addSize")}
            </button>
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted">
        {label}
      </span>
      {children}
    </label>
  );
}
