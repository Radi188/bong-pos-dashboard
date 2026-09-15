import type { CartLine } from "./types";

/**
 * Older saved orders predate per-line options, so every reader goes through these
 * helpers rather than touching the fields directly.
 */
const addons = (l: CartLine) => l.addons ?? [];

export const lineUnit = (l: CartLine) =>
  l.price + addons(l).reduce((s, a) => s + a.price, 0);

export const lineSubtotal = (l: CartLine) => lineUnit(l) * l.qty;

export const lineDiscount = (l: CartLine) => {
  const value = l.discountValue ?? 0;
  if (value <= 0) return 0;
  const subtotal = lineSubtotal(l);
  const raw =
    l.discountMode === "amount"
      ? value
      : (subtotal * Math.min(value, 100)) / 100;
  return Math.min(subtotal, raw);
};

export const lineTotal = (l: CartLine) => lineSubtotal(l) - lineDiscount(l);

/** Identical configurations share a key so they stack instead of duplicating. */
export const lineKey = (l: Omit<CartLine, "id" | "qty">) =>
  [
    l.productId,
    l.variantId,
    l.sugar ?? "",
    l.ice ?? "",
    addons(l as CartLine)
      .map((a) => a.id)
      .sort()
      .join("+"),
    l.price.toFixed(2),
    l.discountMode,
    l.discountValue,
    (l.note ?? "").trim().toLowerCase(),
  ].join("|");

/**
 * The drink's own settings, without toppings: "Large · 50% sugar · No Ice".
 * The cart lists toppings separately so a long order stays checkable.
 */
export const lineConfig = (l: CartLine) =>
  [l.variantLabel, l.sugar && `${l.sugar} sugar`, l.ice]
    .filter(Boolean)
    .join(" · ");

/** Toppings on the line, in the order they were added. */
export const lineAddons = (l: CartLine) => addons(l);

/** "Large · 50% sugar · No Ice · Black Pearl, Cream" */
export const lineOptions = (l: CartLine) =>
  [
    l.variantLabel,
    l.sugar && `${l.sugar} sugar`,
    l.ice,
    addons(l)
      .map((a) => a.name)
      .join(", "),
  ]
    .filter(Boolean)
    .join(" · ");
