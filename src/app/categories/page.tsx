"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { useI18n } from "@/lib/i18n";
import { categoryLabel } from "@/lib/labels";
import PageHeader from "@/components/PageHeader";
import PriceTag from "@/components/PriceTag";
import { CupIcon, PlusIcon, TrashIcon } from "@/components/icons";

export default function CategoriesPage() {
  const { categories, saveCategory, deleteCategory, products, saveProduct } =
    useStore();
  const { t } = useI18n();
  const [name, setName] = useState("");
  const [blocked, setBlocked] = useState<string | null>(null);

  const itemsIn = (id: string) => products.filter((p) => p.category === id);

  const valid =
    name.trim() !== "" &&
    !categories.some((c) => c.name.toLowerCase() === name.trim().toLowerCase());

  const add = () => {
    if (!valid) return;
    saveCategory({ id: crypto.randomUUID().slice(0, 8), name: name.trim() });
    setName("");
    setBlocked(null);
  };

  const remove = (id: string, label: string) => {
    const { ok, inUse } = deleteCategory(id);
    setBlocked(
      ok ? null : t("menu.categoryBlocked", { name: label, count: inUse }),
    );
  };

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title={t("nav.categories")}
        subtitle={t("categories.subtitle", {
          count: categories.length,
          items: products.length,
        })}
      />

      <div className="flex-1 overflow-y-auto bg-surface p-6">
        <div className="mx-auto max-w-4xl space-y-4">
          {/* Create */}
          <div className="rounded-2xl bg-white p-4 ring-1 ring-black/[0.04]">
            <div className="flex gap-2">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && add()}
                placeholder={t("menu.categoryNamePlaceholder")}
                className="h-12 min-w-0 flex-1 rounded-xl border border-line px-4 text-[15px] outline-none transition-colors focus:border-neutral-900"
              />
              <button
                onClick={add}
                disabled={!valid}
                className="flex h-12 shrink-0 items-center gap-2 rounded-xl bg-neutral-900 px-5 text-sm font-semibold text-white transition-opacity hover:opacity-85 disabled:bg-neutral-200 disabled:text-neutral-400"
              >
                <PlusIcon className="h-4 w-4" />
                {t("menu.newCategory")}
              </button>
            </div>
            <p className="mt-2 px-1 text-xs text-muted">
              {t("categories.addBlurb")}
            </p>
          </div>

          {blocked && (
            <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {blocked}
            </p>
          )}

          {categories.map((c) => {
            const items = itemsIn(c.id);
            const shown = categoryLabel(c, t);
            return (
              <section
                key={c.id}
                className="overflow-hidden rounded-2xl bg-white ring-1 ring-black/[0.04]"
              >
                <header className="flex items-center gap-3 border-b border-line px-5 py-4">
                  <input
                    value={shown}
                    onChange={(e) =>
                      // A renamed built-in is no longer the shipped section, so
                      // it shows the typed name rather than a translation.
                      saveCategory({
                        ...c,
                        name: e.target.value,
                        builtIn: false,
                      })
                    }
                    aria-label={shown}
                    className="min-w-0 flex-1 rounded-lg bg-transparent px-1 text-lg font-bold tracking-tight outline-none transition-colors hover:bg-neutral-50 focus:bg-neutral-50"
                  />
                  <span className="shrink-0 rounded-lg bg-neutral-100 px-2.5 py-1 text-xs font-semibold tabular-nums">
                    {items.length}
                  </span>
                  <button
                    onClick={() => remove(c.id, shown)}
                    disabled={items.length > 0}
                    aria-label={t("menu.deleteCategory", { name: shown })}
                    title={
                      items.length > 0
                        ? t("menu.categoryInUse", { count: items.length })
                        : undefined
                    }
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-muted transition-colors hover:bg-neutral-100 hover:text-neutral-900 disabled:opacity-25 disabled:hover:bg-transparent"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </header>

                {items.length === 0 ? (
                  <p className="px-5 py-6 text-center text-sm text-muted">
                    {t("categories.empty")}
                  </p>
                ) : (
                  <ul className="divide-y divide-line">
                    {items.map((p) => (
                      <li
                        key={p.id}
                        className="flex items-center gap-3 px-5 py-3"
                      >
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-neutral-100">
                          <CupIcon className="h-5 w-5 text-neutral-400" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-medium">
                            {p.name}
                          </span>
                          <span className="block truncate text-xs text-muted">
                            {p.sku}
                          </span>
                        </span>
                        <PriceTag p={p} size="sm" />
                        {/* Reassigning here is the "apply to the menu" step. */}
                        <select
                          value={p.category}
                          onChange={(e) =>
                            saveProduct({ ...p, category: e.target.value })
                          }
                          aria-label={t("categories.moveTo")}
                          className="h-10 shrink-0 rounded-lg border border-line bg-white px-2 text-sm outline-none transition-colors focus:border-neutral-900"
                        >
                          {categories.map((opt) => (
                            <option key={opt.id} value={opt.id}>
                              {categoryLabel(opt, t)}
                            </option>
                          ))}
                        </select>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}
