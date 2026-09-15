"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { useI18n } from "@/lib/i18n";
import { currency } from "@/lib/format";
import { CloseIcon, PlusIcon, TrashIcon } from "./icons";

/**
 * The shop's topping library. Products point at these by id, so a price edited
 * here reaches every drink that offers it — and deleting one withdraws it from
 * those drinks rather than leaving a dangling reference.
 */
export default function ToppingsDialog({ onClose }: { onClose: () => void }) {
  const { toppings, saveTopping, deleteTopping, products } = useStore();
  const { t } = useI18n();
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");

  const usedBy = (id: string) =>
    products.filter((p) => p.addonIds?.includes(id)).length;

  const valid = name.trim() !== "" && Number(price) > 0;

  const add = () => {
    if (!valid) return;
    saveTopping({
      id: crypto.randomUUID().slice(0, 8),
      name: name.trim(),
      price: Number(price),
    });
    setName("");
    setPrice("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-neutral-950/40 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div className="relative flex max-h-[85dvh] w-full max-w-lg flex-col overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-black/10">
        <div className="flex items-center justify-between border-b border-line px-6 py-5">
          <h2 className="text-lg font-semibold tracking-tight">
            {t("menu.toppings")}
          </h2>
          <button
            onClick={onClose}
            aria-label={t("common.close")}
            className="grid h-9 w-9 place-items-center rounded-xl text-muted transition-colors hover:bg-neutral-100 hover:text-neutral-900"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          {toppings.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted">
              {t("menu.toppingsEmpty")}
            </p>
          ) : (
            <ul className="space-y-2">
              {toppings.map((a) => {
                const n = usedBy(a.id);
                return (
                  <li
                    key={a.id}
                    className="flex items-center gap-2 rounded-xl border border-line px-3 py-2"
                  >
                    <span className="min-w-0 flex-1">
                      <input
                        value={a.name}
                        onChange={(e) =>
                          saveTopping({ ...a, name: e.target.value })
                        }
                        aria-label={t("menu.toppingName")}
                        className="w-full min-w-0 bg-transparent text-[15px] font-medium outline-none"
                      />
                      <span className="text-xs text-muted">
                        {n > 0
                          ? t("menu.toppingInUse", { count: n })
                          : t("menu.toppingUnused")}
                      </span>
                    </span>
                    <input
                      inputMode="decimal"
                      value={a.price || ""}
                      onChange={(e) =>
                        saveTopping({
                          ...a,
                          price: Number(
                            e.target.value.replace(/[^0-9.]/g, "") || 0,
                          ),
                        })
                      }
                      aria-label={`${a.name} ${t("pos.price")}`}
                      className="h-10 w-20 shrink-0 rounded-lg border border-line px-2.5 text-right text-[15px] tabular-nums outline-none transition-colors focus:border-neutral-900"
                    />
                    <button
                      onClick={() => deleteTopping(a.id)}
                      aria-label={t("menu.deleteTopping", { name: a.name })}
                      className="grid h-10 w-10 shrink-0 place-items-center rounded-lg text-muted transition-colors hover:bg-neutral-100 hover:text-neutral-900"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="border-t border-line px-6 py-5">
          <div className="flex gap-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && add()}
              placeholder={t("menu.toppingNamePlaceholder")}
              className="h-12 min-w-0 flex-1 rounded-xl border border-line px-4 text-[15px] outline-none transition-colors focus:border-neutral-900"
            />
            <input
              inputMode="decimal"
              value={price}
              onChange={(e) => setPrice(e.target.value.replace(/[^0-9.]/g, ""))}
              onKeyDown={(e) => e.key === "Enter" && add()}
              placeholder="0.00"
              className="h-12 w-24 shrink-0 rounded-xl border border-line px-3 text-right text-[15px] tabular-nums outline-none transition-colors focus:border-neutral-900"
            />
            <button
              onClick={add}
              disabled={!valid}
              className="flex h-12 shrink-0 items-center gap-2 rounded-xl bg-neutral-900 px-4 text-sm font-semibold text-white transition-opacity hover:opacity-85 disabled:bg-neutral-200 disabled:text-neutral-400"
            >
              <PlusIcon className="h-4 w-4" />
              {t("menu.newTopping")}
            </button>
          </div>
          {valid && (
            <p className="mt-2 text-xs text-muted">
              {name.trim()} · {currency(Number(price))}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
