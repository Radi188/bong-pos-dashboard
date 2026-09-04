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
  Branch,
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
} from "./types";
import {
  BRANCHES,
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
  return list.map((p) =>
    p.addons !== undefined && p.customisable !== undefined
      ? p
      : {
          ...p,
          addons: p.addons ?? (p.category === "Snack" ? [] : TOPPINGS),
          customisable: p.customisable ?? p.category !== "Snack",
        }
  );
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
  updateLine: (id: string, line: Omit<CartLine, "id" | "qty">, qty: number) => void;
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

// Server render and the hydration pass both report `false`, so the markup matches;
// the first client commit flips it to `true` and the stored data takes over.
const subscribeNoop = () => () => {};

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const ready = useSyncExternalStore(subscribeNoop, () => true, () => false);

  const [products, setProducts] = useState<Product[]>(() =>
    onClient(SEED_PRODUCTS, () => migrateProducts(read(KEYS.products, SEED_PRODUCTS)))
  );
  const [orders, setOrders] = useState<Order[]>(() =>
    onClient<Order[]>([], () => read<Order[]>(KEYS.orders, []))
  );
  const [expenses, setExpenses] = useState<Expense[]>(() =>
    onClient<Expense[]>([], () => read<Expense[]>(KEYS.expenses, []))
  );
  const [shift, setShift] = useState<Shift | null>(() =>
    onClient<Shift | null>(DEFAULT_SHIFT, () => read<Shift | null>(KEYS.shift, DEFAULT_SHIFT))
  );
  const [branches, setBranches] = useState<Branch[]>(() =>
    onClient(BRANCHES, () => read(KEYS.branches, BRANCHES))
  );
  const [storeName, setStoreName] = useState<string>(() =>
    onClient("Bong POS", () => read(KEYS.storeName, "Bong POS"))
  );
  const [branchId, setBranchId] = useState<string>(() =>
    onClient(BRANCHES[0].id, () => read(KEYS.branch, BRANCHES[0].id))
  );
  const [rolePermissions, setRolePermissionsState] = useState<Record<Role, string[]>>(() =>
    onClient(DEFAULT_ROLE_PERMISSIONS, () => ({
      ...DEFAULT_ROLE_PERMISSIONS,
      ...read<Partial<Record<Role, string[]>>>(KEYS.rolePermissions, {}),
    }))
  );
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>(() =>
    onClient(DEFAULT_PAYMENT_METHODS, () => {
      const stored = read<PaymentMethod[] | null>(KEYS.paymentMethods, null);
      if (stored) return stored;
      // Before tenders were editable the enabled set lived in settings.
      const legacy = read<{ enabledPayments?: string[] }>(KEYS.settings, {});
      return DEFAULT_PAYMENT_METHODS.map((m) => ({
        ...m,
        enabled: legacy.enabledPayments ? legacy.enabledPayments.includes(m.id) : m.enabled,
      }));
    })
  );
  const [settings, setSettings] = useState<Settings>(() =>
    onClient(DEFAULT_SETTINGS, () => ({
      ...DEFAULT_SETTINGS,
      ...read<Partial<Settings>>(KEYS.settings, {}),
    }))
  );

  const [cart, setCart] = useState<CartLine[]>([]);
  const [discountMode, setDiscountMode] = useState<DiscountMode>("percent");
  const [discountValue, setDiscountValue] = useState(0);
  const [method, setMethod] = useState<PaymentMethodId>("cash");

  useEffect(() => {
    if (ready) localStorage.setItem(KEYS.products, JSON.stringify(products));
  }, [products, ready]);
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
    if (ready) localStorage.setItem(KEYS.rolePermissions, JSON.stringify(rolePermissions));
  }, [rolePermissions, ready]);
  useEffect(() => {
    if (ready) localStorage.setItem(KEYS.paymentMethods, JSON.stringify(paymentMethods));
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
    setBranches((prev) => prev.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  }, []);

  const deleteBranch = useCallback(
    (id: string): Result => {
      if (branches.length === 1) return { ok: false, error: "error.lastBranch" };
      if (id === branchId)
        return { ok: false, error: "error.branchInUse" };
      if (orders.some((o) => o.branchId === id))
        return { ok: false, error: "error.branchHasSales" };
      setBranches((prev) => prev.filter((b) => b.id !== id));
      return { ok: true };
    },
    [branches, branchId, orders]
  );

  const addLine = useCallback((line: Omit<CartLine, "id" | "qty">, qty: number) => {
    const id = lineKey(line);
    setCart((prev) =>
      prev.some((l) => l.id === id)
        ? prev.map((l) => (l.id === id ? { ...l, qty: l.qty + qty } : l))
        : [...prev, { ...line, id, qty }]
    );
  }, []);

  const updateLine = useCallback(
    (id: string, line: Omit<CartLine, "id" | "qty">, qty: number) => {
      const nextId = lineKey(line);
      setCart((prev) => {
        // Editing a line into an existing configuration folds the two together.
        const twin = prev.find((l) => l.id === nextId && l.id !== id);
        return prev
          .filter((l) => l.id !== nextId || l.id === id)
          .map((l) => (l.id === id ? { ...line, id: nextId, qty: qty + (twin?.qty ?? 0) } : l));
      });
    },
    []
  );

  const setQty = useCallback((lineId: string, qty: number) => {
    setCart((prev) =>
      qty <= 0
        ? prev.filter((l) => l.id !== lineId)
        : prev.map((l) => (l.id === lineId ? { ...l, qty } : l))
    );
  }, []);

  const removeLine = useCallback(
    (lineId: string) => setCart((prev) => prev.filter((l) => l.id !== lineId)),
    []
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
      discountMode === "percent" ? (subtotal * Math.min(discountValue, 100)) / 100 : discountValue;
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
      setProducts((prev) =>
        prev.map((p) => {
          const sold = cart
            .filter((l) => l.productId === p.id)
            .reduce((s, l) => s + l.qty, 0);
          return sold ? { ...p, stock: Math.max(0, p.stock - sold) } : p;
        })
      );
      setCart([]);
      setDiscountValue(0);
      return order;
    },
    [branchId, cart, discountMode, discountValue, method, orders.length, shift, totals]
  );

  const setRolePermissions = useCallback((role: Role, paths: string[]) => {
    // Locked screens are re-applied so a role can never be edited into a dead end.
    const next = [...new Set([...paths, ...lockedFor(role)])];
    setRolePermissionsState((prev) => ({ ...prev, [role]: next }));
  }, []);

  const canAccess = useCallback(
    (role: Role, path: string) =>
      (rolePermissions[role] ?? DEFAULT_ROLE_PERMISSIONS[role]).includes(path),
    [rolePermissions]
  );

  const savePaymentMethod = useCallback((m: PaymentMethod) => {
    setPaymentMethods((prev) =>
      prev.some((x) => x.id === m.id) ? prev.map((x) => (x.id === m.id ? m : x)) : [...prev, m]
    );
  }, []);

  const deletePaymentMethod = useCallback(
    (id: PaymentMethodId): Result => {
      if (orders.some((o) => o.method === id))
        return { ok: false, error: "error.methodHasSales" };
      if (paymentMethods.filter((m) => m.enabled).length === 1 && paymentMethods.find((m) => m.id === id)?.enabled)
        return { ok: false, error: "error.lastMethod" };
      setPaymentMethods((prev) => prev.filter((m) => m.id !== id));
      return { ok: true };
    },
    [orders, paymentMethods]
  );

  const updateSettings = useCallback(
    (patch: Partial<Settings>) => setSettings((prev) => ({ ...prev, ...patch })),
    []
  );

  const saveProduct = useCallback((product: Product) => {
    // Items created in the menu editor carry no option fields yet.
    const [p] = migrateProducts([product]);
    setProducts((prev) =>
      prev.some((x) => x.id === p.id) ? prev.map((x) => (x.id === p.id ? p : x)) : [...prev, p]
    );
  }, []);

  const deleteProduct = useCallback((id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    setCart((prev) => prev.filter((l) => l.productId !== id));
  }, []);

  const addExpense = useCallback(
    (note: string, amount: number) => {
      setExpenses((prev) => [
        { id: crypto.randomUUID(), createdAt: new Date().toISOString(), branchId, note, amount },
        ...prev,
      ]);
    },
    [branchId]
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

export const priceFrom = (p: Product) => Math.min(...p.variants.map((v) => v.price));
