import type { Addon, Product } from "./types";

/** Shared toppings offered on every drink. */
export const TOPPINGS: Addon[] = [
  { id: "caramel-cake", name: "Caramel Cake", price: 0.75 },
  { id: "black-pearl", name: "Black Pearl", price: 0.5 },
  { id: "crystal-pearl", name: "Crystal Pearl", price: 0.5 },
  { id: "tofu", name: "Tofu", price: 0.5 },
  { id: "cream", name: "Cream", price: 0.5 },
  { id: "gummy", name: "Gummy", price: 1.25 },
];

const sizes = (s: number, m: number, l: number) => [
  { id: "s", label: "Small", price: s },
  { id: "m", label: "Medium", price: m },
  { id: "l", label: "Large", price: l },
];

export const SEED_PRODUCTS: Product[] = [
  { id: "p1", name: "Ambel Cafe", category: "Coffee Time", sku: "CT-001", stock: 120, addons: TOPPINGS, customisable: true, variants: sizes(2.0, 2.5, 3.0) },
  { id: "p2", name: "Egg Cream Cafe", category: "Coffee Time", sku: "CT-002", stock: 84, addons: TOPPINGS, customisable: true, variants: sizes(2.0, 2.6, 3.1) },
  { id: "p3", name: "Salt Egg Cafe", category: "Coffee Time", sku: "CT-003", stock: 76, addons: TOPPINGS, customisable: true, variants: sizes(2.0, 2.6, 3.1) },
  { id: "p4", name: "Ice Cafe", category: "Coffee Time", sku: "CT-004", stock: 140, addons: TOPPINGS, customisable: true, variants: sizes(1.5, 2.0, 2.5) },
  { id: "p5", name: "Milk Cafe", category: "Coffee Time", sku: "CT-005", stock: 98, addons: TOPPINGS, customisable: true, variants: sizes(1.63, 2.13, 2.63) },
  { id: "p6", name: "Chocolate Mochi", category: "Coffee Time", sku: "CT-006", stock: 42, addons: TOPPINGS, customisable: true, variants: sizes(2.0, 2.75, 3.25) },
  { id: "p7", name: "Chocolate Eggcream", category: "Coffee Time", sku: "CT-007", stock: 38, addons: TOPPINGS, customisable: true, variants: sizes(2.0, 2.75, 3.25) },
  { id: "p8", name: "Matcha Latte", category: "Matcha", sku: "MA-001", stock: 54, addons: TOPPINGS, customisable: true, variants: sizes(2.0, 2.75, 3.25) },
  { id: "p9", name: "Matcha Salt Cream", category: "Matcha", sku: "MA-002", stock: 46, addons: TOPPINGS, customisable: true, variants: sizes(2.0, 2.75, 3.25) },
  { id: "p10", name: "Matcha Coconut", category: "Matcha", sku: "MA-003", stock: 30, addons: TOPPINGS, customisable: true, variants: sizes(2.25, 3.0, 3.5) },
  { id: "p11", name: "Jasmine Green Tea", category: "Fresh Tea", sku: "FT-001", stock: 88, addons: TOPPINGS, customisable: true, variants: sizes(1.5, 2.0, 2.5) },
  { id: "p12", name: "Lemon Tea", category: "Fresh Tea", sku: "FT-002", stock: 72, addons: TOPPINGS, customisable: true, variants: sizes(1.75, 2.25, 2.75) },
  { id: "p13", name: "Peach Oolong", category: "Fresh Tea", sku: "FT-003", stock: 40, addons: TOPPINGS, customisable: true, variants: sizes(2.0, 2.5, 3.0) },
  { id: "p14", name: "Passion Fruit Tea", category: "Fresh Tea", sku: "FT-004", stock: 36, addons: TOPPINGS, customisable: true, variants: sizes(2.0, 2.5, 3.0) },
  { id: "p15", name: "Brown Sugar Boba", category: "Sweet", sku: "SW-001", stock: 60, addons: TOPPINGS, customisable: true, variants: sizes(2.25, 2.95, 3.45) },
  { id: "p16", name: "Coconut Shake", category: "Sweet", sku: "SW-002", stock: 28, addons: TOPPINGS, customisable: true, variants: sizes(2.5, 3.25, 3.75) },
  { id: "p17", name: "Strawberry Yogurt", category: "Sweet", sku: "SW-003", stock: 24, addons: TOPPINGS, customisable: true, variants: sizes(2.5, 3.25, 3.75) },
  { id: "p18", name: "Butter Croissant", category: "Snack", sku: "SN-001", stock: 18, variants: [{ id: "one", label: "Regular", price: 2.4 }] },
  { id: "p19", name: "Chocolate Muffin", category: "Snack", sku: "SN-002", stock: 15, variants: [{ id: "one", label: "Regular", price: 2.6 }] },
  { id: "p20", name: "Bottled Water", category: "Snack", sku: "SN-003", stock: 200, variants: [{ id: "one", label: "Regular", price: 0.9 }] },
];
