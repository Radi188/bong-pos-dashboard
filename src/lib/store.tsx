"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import type {
  Addon,
  Branch,
  Category,
  CartLine,
  DiscountMode,
  Expense,
  Order,
  PaymentMethodId,
  Product,
  PaymentMethod,
  Role,
  Settings,
  Shift,
  TillFloat,
  Variant,
} from "./types";
import {
  ALL_PATHS,
  BRANCHES,
  DEFAULT_CATEGORIES,
  DEFAULT_PAYMENT_METHODS,
  DEFAULT_ROLE_PERMISSIONS,
  DEFAULT_SETTINGS,
  lockedFor,
} from "./types";
import { lineKey, lineTotal } from "./cart";
import type { TranslationKey } from "./i18n";
import { SEED_PRODUCTS, TOPPINGS } from "./seed";

/** Mutations that can fail report a dictionary key, translated where it is shown. */
type Result = { ok: boolean; error?: TranslationKey };

/**
 * Products saved before options existed have no `addons`/`customisable`, which would
 * leave a returning terminal with no toppings, sugar or ice in the item sheet.
 * Backfill them on load; drinks get the standard toppings, food gets none.
 */
function migrateProducts(list: Product[]): Product[] {
  return list.map((p) => {
    if (p.addonIds !== undefined && p.customisable !== undefined) return p;
    // Items saved before the topping library held their own copies; keep the
    // same toppings by reference so a price edit now reaches every drink.
    const fromCopies = p.addons?.map((a) => a.id);
    const byCategory = p.category === "Snack" ? [] : TOPPINGS.map((a) => a.id);
    return {
      ...p,
      addonIds: p.addonIds ?? fromCopies ?? byCategory,
      customisable: p.customisable ?? p.category !== "Snack",
    };
  });
}

const KEYS = {
  products: "pos.products",
  orders: "pos.orders",
  expenses: "pos.expenses",
  shift: "pos.shift",
  branch: "pos.branch",
  settings: "pos.settings",
  branches: "pos.branches",
  storeName: "pos.storeName",
  rolePermissions: "pos.rolePermissions",
  toppings: "pos.toppings",
  categories: "pos.categories",
  knownPaths: "pos.knownPaths",
  paymentMethods: "pos.paymentMethods",
};

const DEFAULT_SHIFT: Shift = {
  cashier: "Cashier Panha",
  startedAt: new Date().toISOString(),
  opening: { usd: 50, khr: 100000 },
};

type Store = {
  products: Product[];
  orders: Order[];
  expenses: Expense[];
  storeName: string;
  setStoreName: (name: string) => void;
  branch: Branch;
  branches: Branch[];
  setBranch: (id: string) => void;
  addBranch: (branch: Omit<Branch, "id">) => Branch;
  updateBranch: (id: string, patch: Omit<Branch, "id">) => void;
  deleteBranch: (id: string) => Result;
  shift: Shift | null;
  startShift: (cashier: string, opening: TillFloat) => void;
  endShift: () => void;

  cart: CartLine[];
  addLine: (line: Omit<CartLine, "id" | "qty">, qty: number) => void;
  updateLine: (
    id: string,
    line: Omit<CartLine, "id" | "qty">,
    qty: number,
  ) => void;
  setQty: (lineId: string, qty: number) => void;
  removeLine: (lineId: string) => void;
  clearCart: () => void;

  discountMode: DiscountMode;
  discountValue: number;
  setDiscount: (mode: DiscountMode, value: number) => void;

  method: PaymentMethodId;
  setMethod: (m: PaymentMethodId) => void;

  paymentMethods: PaymentMethod[];
  savePaymentMethod: (m: PaymentMethod) => void;
  deletePaymentMethod: (id: PaymentMethodId) => Result;

  totals: { subtotal: number; discount: number; total: number; count: number };
  checkout: (paid: number) => Order;

  settings: Settings;
  updateSettings: (patch: Partial<Settings>) => void;

  rolePermissions: Record<Role, string[]>;
  setRolePermissions: (role: Role, paths: string[]) => void;
  canAccess: (role: Role, path: string) => boolean;

  saveProduct: (p: Product) => void;
  deleteProduct: (id: string) => void;
  categories: Category[];
  saveCategory: (c: Category) => void;
  /** Refused while any product still sits in it; returns what blocked it. */
  deleteCategory: (id: string) => { ok: boolean; inUse: number };
  categoryById: (id: string) => Category | undefined;
  toppings: Addon[];
  saveTopping: (a: Addon) => void;
  deleteTopping: (id: string) => void;
  /** The toppings an item offers, resolved from the library in library order. */
  toppingsFor: (p: Product) => Addon[];
  addExpense: (note: string, amount: number) => void;
};

const StoreContext = createContext<Store | null>(null);

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

const onClient = <T,>(fallback: T, load: () => T): T =>
  typeof window === "undefined" ? fallback : load();

/** The screens that existed before the app began recording `knownPaths`. */
const LEGACY_PATHS = [
  "/",
  "/dashboard",
  "/orders",
  "/sale-drafts",
  "/expenses",
  "/menu",
  "/reports",
  "/users",
  "/branches",
  "/payment-methods",
  "/settings",
];

/**
 * A saved permission set replaces the defaults outright, so a screen added
 * after it was written would be withheld from every role — invisible in the
 * sidebar even to an admin. Nobody ever decided to deny a screen that did not
 * exist yet, so paths new since the last save follow the defaults instead.
 * Revocations the shop made deliberately are left untouched.
 */
function mergeRolePermissions(
  stored: Partial<Record<Role, string[]>>,
  knownPaths: string[],
): Record<Role, string[]> {
  const added = ALL_PATHS.filter((path) => !knownPaths.includes(path));
  const roles = Object.keys(DEFAULT_ROLE_PERMISSIONS) as Role[];
  return Object.fromEntries(
    roles.map((role) => {
      const saved = stored[role] ?? DEFAULT_ROLE_PERMISSIONS[role];
      const fresh = DEFAULT_ROLE_PERMISSIONS[role].filter((p) =>
        added.includes(p),
      );
      return [role, [...new Set([...saved, ...fresh, ...lockedFor(role)])]];
    }),
  ) as Record<Role, string[]>;
}

// Server render and the hydration pass both report `false`, so the markup matches;
// the first client commit flips it to `true` and the stored data takes over.
const subscribeNoop = () => () => {};

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const ready = useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false,
  );

  const [products, setProducts] = useState<Product[]>(() =>
    onClient(SEED_PRODUCTS, () =>
      migrateProducts(read(KEYS.products, SEED_PRODUCTS)),
    ),
  );
  const [orders, setOrders] = useState<Order[]>(() =>
    onClient<Order[]>([], () => read<Order[]>(KEYS.orders, [])),
  );
  const [expenses, setExpenses] = useState<Expense[]>(() =>
    onClient<Expense[]>([], () => read<Expense[]>(KEYS.expenses, [])),
  );
  const [shift, setShift] = useState<Shift | null>(() =>
    onClient<Shift | null>(DEFAULT_SHIFT, () =>
      read<Shift | null>(KEYS.shift, DEFAULT_SHIFT),
    ),
  );
  const [branches, setBranches] = useState<Branch[]>(() =>
    onClient(BRANCHES, () => read(KEYS.branches, BRANCHES)),
  );
  const [storeName, setStoreName] = useState<string>(() =>
    onClient("Bong POS", () => read(KEYS.storeName, "Bong POS")),
  );
  const [branchId, setBranchId] = useState<string>(() =>
    onClient(BRANCHES[0].id, () => read(KEYS.branch, BRANCHES[0].id)),
  );
  const [rolePermissions, setRolePermissionsState] = useState<
    Record<Role, string[]>
  >(() =>
    onClient(DEFAULT_ROLE_PERMISSIONS, () =>
      mergeRolePermissions(
        read<Partial<Record<Role, string[]>>>(KEYS.rolePermissions, {}),
        read<string[]>(KEYS.knownPaths, LEGACY_PATHS),
      ),
    ),
  );
  const [toppings, setToppings] = useState<Addon[]>(() =>
    onClient(TOPPINGS, () => read<Addon[]>(KEYS.toppings, TOPPINGS)),
  );
  const [categories, setCategories] = useState<Category[]>(() =>
    onClient(DEFAULT_CATEGORIES, () =>
      read<Category[]>(KEYS.categories, DEFAULT_CATEGORIES),
    ),
  );
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>(() =>
    onClient(DEFAULT_PAYMENT_METHODS, () => {
      const stored = read<PaymentMethod[] | null>(KEYS.paymentMethods, null);
      if (stored) return stored;
      // Before tenders were editable the enabled set lived in settings.
      const legacy = read<{ enabledPayments?: string[] }>(KEYS.settings, {});
      return DEFAULT_PAYMENT_METHODS.map((m) => ({
        ...m,
        enabled: legacy.enabledPayments
          ? legacy.enabledPayments.includes(m.id)
          : m.enabled,
      }));
    }),
  );
  const [settings, setSettings] = useState<Settings>(() =>
    onClient(DEFAULT_SETTINGS, () => ({
      ...DEFAULT_SETTINGS,
      ...read<Partial<Settings>>(KEYS.settings, {}),
    })),
  );

  const [cart, setCart] = useState<CartLine[]>([]);
  const [discountMode, setDiscountMode] = useState<DiscountMode>("percent");
  const [discountValue, setDiscountValue] = useState(0);
  const [method, setMethod] = useState<PaymentMethodId>("cash");

  useEffect(() => {
    if (ready) localStorage.setItem(KEYS.products, JSON.stringify(products));
  }, [products, ready]);
  useEffect(() => {
    if (ready) localStorage.setItem(KEYS.toppings, JSON.stringify(toppings));
  }, [toppings, ready]);
  useEffect(() => {
    if (ready)
      localStorage.setItem(KEYS.categories, JSON.stringify(categories));
  }, [categories, ready]);
  useEffect(() => {
    if (ready) localStorage.setItem(KEYS.orders, JSON.stringify(orders));
  }, [orders, ready]);
  useEffect(() => {
    if (ready) localStorage.setItem(KEYS.expenses, JSON.stringify(expenses));
  }, [expenses, ready]);
  useEffect(() => {
    if (ready) localStorage.setItem(KEYS.shift, JSON.stringify(shift));
  }, [shift, ready]);
  useEffect(() => {
    if (ready) localStorage.setItem(KEYS.branch, JSON.stringify(branchId));
  }, [branchId, ready]);
  useEffect(() => {
    if (ready) localStorage.setItem(KEYS.settings, JSON.stringify(settings));
  }, [settings, ready]);
  useEffect(() => {
    if (ready) localStorage.setItem(KEYS.branches, JSON.stringify(branches));
  }, [branches, ready]);
  useEffect(() => {
    if (ready) {
      localStorage.setItem(
        KEYS.rolePermissions,
        JSON.stringify(rolePermissions),
      );
      // Saved alongside, so the next release can tell a new screen from a denied one.
      localStorage.setItem(KEYS.knownPaths, JSON.stringify(ALL_PATHS));
    }
  }, [rolePermissions, ready]);
  useEffect(() => {
    if (ready)
      localStorage.setItem(KEYS.paymentMethods, JSON.stringify(paymentMethods));
  }, [paymentMethods, ready]);
  useEffect(() => {
    if (ready) localStorage.setItem(KEYS.storeName, JSON.stringify(storeName));
  }, [storeName, ready]);

  const branch = branches.find((b) => b.id === branchId) ?? branches[0];

  const addBranch = useCallback((input: Omit<Branch, "id">) => {
    const created: Branch = { ...input, id: crypto.randomUUID() };
    setBranches((prev) => [...prev, created]);
    return created;
  }, []);

  const updateBranch = useCallback((id: string, patch: Omit<Branch, "id">) => {
    setBranches((prev) =>
      prev.map((b) => (b.id === id ? { ...b, ...patch } : b)),
    );
  }, []);

  const deleteBranch = useCallback(
    (id: string): Result => {
      if (branches.length === 1)
        return { ok: false, error: "error.lastBranch" };
      if (id === branchId) return { ok: false, error: "error.branchInUse" };
      if (orders.some((o) => o.branchId === id))
        return { ok: false, error: "error.branchHasSales" };
      setBranches((prev) => prev.filter((b) => b.id !== id));
      return { ok: true };
    },
    [branches, branchId, orders],
  );

  const addLine = useCallback(
    (line: Omit<CartLine, "id" | "qty">, qty: number) => {
      const id = lineKey(line);
      setCart((prev) =>
        prev.some((l) => l.id === id)
          ? prev.map((l) => (l.id === id ? { ...l, qty: l.qty + qty } : l))
          : [...prev, { ...line, id, qty }],
      );
    },
    [],
  );

  const updateLine = useCallback(
    (id: string, line: Omit<CartLine, "id" | "qty">, qty: number) => {
      const nextId = lineKey(line);
      setCart((prev) => {
        // Editing a line into an existing configuration folds the two together.
        const twin = prev.find((l) => l.id === nextId && l.id !== id);
        return prev
          .filter((l) => l.id !== nextId || l.id === id)
          .map((l) =>
            l.id === id
              ? { ...line, id: nextId, qty: qty + (twin?.qty ?? 0) }
              : l,
          );
      });
    },
    [],
  );

  const setQty = useCallback((lineId: string, qty: number) => {
    setCart((prev) =>
      qty <= 0
        ? prev.filter((l) => l.id !== lineId)
        : prev.map((l) => (l.id === lineId ? { ...l, qty } : l)),
    );
  }, []);

  const removeLine = useCallback(
    (lineId: string) => setCart((prev) => prev.filter((l) => l.id !== lineId)),
    [],
  );

  const clearCart = useCallback(() => {
    setCart([]);
    setDiscountValue(0);
  }, []);

  const setDiscount = useCallback((mode: DiscountMode, value: number) => {
    setDiscountMode(mode);
    setDiscountValue(Math.max(0, value));
  }, []);

  const totals = useMemo(() => {
    const subtotal = cart.reduce((s, l) => s + lineTotal(l), 0);
    const raw =
      discountMode === "percent"
        ? (subtotal * Math.min(discountValue, 100)) / 100
        : discountValue;
    const discount = Math.min(subtotal, raw);
    return {
      subtotal,
      discount,
      total: subtotal - discount,
      count: cart.reduce((s, l) => s + l.qty, 0),
    };
  }, [cart, discountMode, discountValue]);

  const checkout = useCallback(
    (paid: number) => {
      const order: Order = {
        id: crypto.randomUUID(),
        number: 1000 + orders.length + 1,
        createdAt: new Date().toISOString(),
        branchId,
        cashier: shift?.cashier ?? "Unassigned",
        lines: cart,
        subtotal: totals.subtotal,
        discount: totals.discount,
        discountMode,
        discountValue,
        total: totals.total,
        paid,
        change: Math.max(0, paid - totals.total),
        method,
      };
      setOrders((prev) => [order, ...prev]);
      setCart([]);
      setDiscountValue(0);
      return order;
    },
    [
      branchId,
      cart,
      discountMode,
      discountValue,
      method,
      orders.length,
      shift,
      totals,
    ],
  );

  const setRolePermissions = useCallback((role: Role, paths: string[]) => {
    // Locked screens are re-applied so a role can never be edited into a dead end.
    const next = [...new Set([...paths, ...lockedFor(role)])];
    setRolePermissionsState((prev) => ({ ...prev, [role]: next }));
  }, []);

  const canAccess = useCallback(
    (role: Role, path: string) =>
      (rolePermissions[role] ?? DEFAULT_ROLE_PERMISSIONS[role]).includes(path),
    [rolePermissions],
  );

  const savePaymentMethod = useCallback((m: PaymentMethod) => {
    setPaymentMethods((prev) =>
      prev.some((x) => x.id === m.id)
        ? prev.map((x) => (x.id === m.id ? m : x))
        : [...prev, m],
    );
  }, []);

  const deletePaymentMethod = useCallback(
    (id: PaymentMethodId): Result => {
      if (orders.some((o) => o.method === id))
        return { ok: false, error: "error.methodHasSales" };
      if (
        paymentMethods.filter((m) => m.enabled).length === 1 &&
        paymentMethods.find((m) => m.id === id)?.enabled
      )
        return { ok: false, error: "error.lastMethod" };
      setPaymentMethods((prev) => prev.filter((m) => m.id !== id));
      return { ok: true };
    },
    [orders, paymentMethods],
  );

  const updateSettings = useCallback(
    (patch: Partial<Settings>) =>
      setSettings((prev) => ({ ...prev, ...patch })),
    [],
  );

  const saveProduct = useCallback((product: Product) => {
    // Items created in the menu editor carry no option fields yet.
    const [p] = migrateProducts([product]);
    setProducts((prev) =>
      prev.some((x) => x.id === p.id)
        ? prev.map((x) => (x.id === p.id ? p : x))
        : [...prev, p],
    );
  }, []);

  const saveCategory = useCallback((c: Category) => {
    setCategories((prev) =>
      prev.some((x) => x.id === c.id)
        ? prev.map((x) => (x.id === c.id ? c : x))
        : [...prev, c],
    );
  }, []);

  /**
   * A category is only removed once it is empty. Deleting one with drinks in it
   * would leave them pointing at a section that no longer exists, so they would
   * vanish from every filter and from the digital menu.
   */
  const deleteCategory = useCallback(
    (id: string) => {
      const inUse = products.filter((p) => p.category === id).length;
      if (inUse > 0) return { ok: false, inUse };
      setCategories((prev) => prev.filter((c) => c.id !== id));
      return { ok: true, inUse: 0 };
    },
    [products],
  );

  const categoryById = useCallback(
    (id: string) => categories.find((c) => c.id === id),
    [categories],
  );

  const saveTopping = useCallback((a: Addon) => {
    setToppings((prev) =>
      prev.some((x) => x.id === a.id)
        ? prev.map((x) => (x.id === a.id ? a : x))
        : [...prev, a],
    );
  }, []);

  /** Removing a topping also withdraws it from every drink that offered it. */
  const deleteTopping = useCallback((id: string) => {
    setToppings((prev) => prev.filter((a) => a.id !== id));
    setProducts((prev) =>
      prev.map((p) =>
        p.addonIds?.includes(id)
          ? { ...p, addonIds: p.addonIds.filter((x) => x !== id) }
          : p,
      ),
    );
  }, []);

  const toppingsFor = useCallback(
    (p: Product) => toppings.filter((a) => p.addonIds?.includes(a.id)),
    [toppings],
  );

  const deleteProduct = useCallback((id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    setCart((prev) => prev.filter((l) => l.productId !== id));
  }, []);

  const addExpense = useCallback(
    (note: string, amount: number) => {
      setExpenses((prev) => [
        {
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
          branchId,
          note,
          amount,
        },
        ...prev,
      ]);
    },
    [branchId],
  );

  const value: Store = {
    products,
    orders,
    expenses,
    storeName,
    setStoreName,
    branch,
    branches,
    setBranch: setBranchId,
    addBranch,
    updateBranch,
    deleteBranch,
    shift,
    startShift: (cashier, opening) =>
      setShift({ cashier, startedAt: new Date().toISOString(), opening }),
    endShift: () => setShift(null),
    cart,
    addLine,
    updateLine,
    setQty,
    removeLine,
    clearCart,
    discountMode,
    discountValue,
    setDiscount,
    method,
    setMethod,
    paymentMethods,
    savePaymentMethod,
    deletePaymentMethod,
    totals,
    checkout,
    settings,
    updateSettings,
    rolePermissions,
    setRolePermissions,
    canAccess,
    saveProduct,
    deleteProduct,
    categories,
    saveCategory,
    deleteCategory,
    categoryById,
    toppings,
    saveTopping,
    deleteTopping,
    toppingsFor,
    addExpense,
  };

  return (
    <StoreContext.Provider value={value}>
      {ready ? children : <div className="h-full" />}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}

/**
 * A size is on promotion only when its sale price actually undercuts the list
 * price. A sale price entered at or above list is treated as no promotion at
 * all, so a typo can never quietly charge a customer more than the menu says.
 */
export const isDiscounted = (v: Variant) =>
  v.salePrice !== undefined && v.salePrice > 0 && v.salePrice < v.price;

/** What the register charges for a size. Agrees with `isDiscounted` by construction. */
export const unitPrice = (v: Variant) =>
  isDiscounted(v) ? v.salePrice! : v.price;

/** Cheapest price a customer can actually pay for this item. */
export const priceFrom = (p: Product) => Math.min(...p.variants.map(unitPrice));

/**
 * The size a listing quotes. Both halves of a struck-through price pair must
 * come from this one variant — taking the "was" and "now" figures as separate
 * minimums lets them describe different sizes, and when only the large is
 * reduced both land on the small and the pair renders as "$2.00" struck
 * through followed by "$2.00".
 */
export const cheapestVariant = (p: Product) =>
  p.variants.reduce((a, b) => (unitPrice(a) <= unitPrice(b) ? a : b));

export const percentOff = (v: Variant) =>
  Math.round((1 - unitPrice(v) / v.price) * 100);

/** The size with the deepest promotion — what a "% off" flag should quote. */
export const bestDeal = (p: Product): Variant | null =>
  p.variants
    .filter(isDiscounted)
    .reduce<Variant | null>(
      (best, v) => (!best || percentOff(v) > percentOff(best) ? v : best),
      null,
    );

/** True when any size of the item is on promotion. */
export const hasDiscount = (p: Product) => p.variants.some(isDiscounted);

/** Hiding an item from the digital menu still leaves it sellable on the register. */
export const showsOnDigitalMenu = (p: Product) => p.onDigitalMenu !== false;
