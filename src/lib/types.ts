export const CATEGORIES = [
  "Coffee Time",
  "Matcha",
  "Fresh Tea",
  "Sweet",
  "Snack",
] as const;

export type Category = (typeof CATEGORIES)[number];

export type Variant = {
  id: string;
  label: string;
  /** List price — what the size costs before any promotion. */
  price: number;
  /**
   * Promotional price for this size. When set, it is what the register charges
   * and the digital menu strikes `price` through beside it. Read it through
   * `unitPrice` rather than testing the field directly.
   */
  salePrice?: number;
};

export type DiscountMode = "percent" | "amount";

export type Addon = {
  id: string;
  name: string;
  price: number;
};

export const SUGAR_LEVELS = ["0%", "25%", "50%", "75%", "100%"] as const;
export const ICE_LEVELS = ["No Ice", "Less", "Normal", "Extra"] as const;

export type SugarLevel = (typeof SUGAR_LEVELS)[number];
export type IceLevel = (typeof ICE_LEVELS)[number];

export type Product = {
  id: string;
  name: string;
  category: Category;
  sku: string;
  variants: Variant[];
  /** Optional extras offered with this item, grouped under its category name. */
  addons?: Addon[];
  /** Drinks ask for sugar and ice; food does not. */
  customisable?: boolean;
  /**
   * Listed on the customer-facing digital menu. Undefined counts as shown, so
   * items saved before this flag existed keep appearing — read it through
   * `showsOnDigitalMenu` rather than testing the field directly.
   */
  onDigitalMenu?: boolean;
};

export type CartLine = {
  /** Deterministic key over every option, so identical configurations stack. */
  id: string;
  productId: string;
  variantId: string;
  name: string;
  variantLabel: string;
  /** Unit price of the size, after any manual override. */
  price: number;
  addons: Addon[];
  sugar?: SugarLevel;
  ice?: IceLevel;
  note?: string;
  discountMode: DiscountMode;
  discountValue: number;
  qty: number;
};

/** Free-form so shops can add their own tenders alongside the built-in ones. */
export type PaymentMethodId = string;

export type PaymentMethod = {
  id: PaymentMethodId;
  label: string;
  /** Two-character fallback shown when there is no logo. */
  mark: string;
  description?: string;
  /** Square logo as a data URL, downscaled on upload. */
  logo?: string;
  enabled: boolean;
  /** Ships with the app; can be disabled but is expected to exist. */
  builtIn?: boolean;
};

export const DEFAULT_PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: "cash",
    label: "Cash",
    mark: "$",
    description:
      "Notes and coins in the drawer, with change calculated at checkout",
    enabled: true,
    builtIn: true,
  },
  {
    id: "egets",
    label: "Egets",
    mark: "eG",
    description: "Egets wallet, confirmed on the merchant terminal",
    enabled: true,
    builtIn: true,
  },
  {
    id: "foodpanda",
    label: "Food Panda",
    mark: "fp",
    description: "Delivery orders settled by Food Panda",
    enabled: true,
    builtIn: true,
  },
  {
    id: "grab",
    label: "Grab",
    mark: "Gr",
    description: "Delivery orders settled by Grab",
    enabled: true,
    builtIn: true,
  },
  {
    id: "khqr",
    label: "KHQR",
    mark: "QR",
    description: "Bakong KHQR — customer scans to pay",
    enabled: true,
    builtIn: true,
  },
  {
    id: "wownow",
    label: "WowNow",
    mark: "Ww",
    description: "Delivery orders settled by WowNow",
    enabled: true,
    builtIn: true,
  },
];

export type Branch = {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  /** Square logo as a data URL — see `readLogo`. */
  logo?: string;
  /** Google Maps link to the storefront, printed on receipts as a QR-able URL. */
  mapUrl?: string;
};

export const BRANCHES: Branch[] = [
  {
    id: "penghout",
    name: "Penghout Branch",
    address: "St. 271, Sangkat Toek Thla, Phnom Penh",
    phone: "012 345 678",
    mapUrl: "https://maps.google.com/?q=11.5564,104.9282",
  },
  {
    id: "riverside",
    name: "Riverside Branch",
    address: "Sisowath Quay, Phnom Penh",
    phone: "012 987 654",
    mapUrl: "https://maps.google.com/?q=11.5717,104.9295",
  },
  {
    id: "toul-kork",
    name: "Toul Kork Branch",
    address: "St. 315, Sangkat Boeung Kak 1, Phnom Penh",
    phone: "012 456 789",
    mapUrl: "https://maps.google.com/?q=11.5822,104.8909",
  },
];

/** Fallback USD to KHR rate; the live value is editable in Settings. */
export const DEFAULT_KHR_RATE = 4100;

export type TillFloat = {
  usd: number;
  khr: number;
};

export type Shift = {
  cashier: string;
  startedAt: string;
  /** Cash counted into the drawer when the shift was opened. */
  opening?: TillFloat;
};

export type Order = {
  id: string;
  number: number;
  createdAt: string;
  branchId: string;
  cashier: string;
  lines: CartLine[];
  subtotal: number;
  discount: number;
  discountMode: DiscountMode;
  discountValue: number;
  total: number;
  paid: number;
  change: number;
  method: PaymentMethodId;
};

export type Expense = {
  id: string;
  createdAt: string;
  branchId: string;
  note: string;
  amount: number;
};

/* ---------------------------------------------------------------- settings */

export type ReceiptAction = "preview" | "direct";
export type ShiftReportMode = "auto" | "manual";
export type Connection = "usb" | "bluetooth" | "network";

export const CONNECTIONS: { id: Connection; label: string }[] = [
  { id: "usb", label: "USB" },
  { id: "bluetooth", label: "Bluetooth" },
  { id: "network", label: "Network" },
];

export type PaperWidth = "58" | "80";

export type ReceiptPrinter = {
  connected: boolean;
  name: string;
  connection: Connection;
  address: string;
  paperWidth: PaperWidth;
  copies: number;
};

export type LabelSize = {
  /** millimetres */
  width: number;
  height: number;
};

export const LABEL_PRESETS: LabelSize[] = [
  { width: 40, height: 30 },
  { width: 50, height: 30 },
  { width: 50, height: 40 },
  { width: 60, height: 40 },
];

export type LabelPrinter = {
  connected: boolean;
  name: string;
  connection: Connection;
  address: string;
  size: LabelSize;
  /** print one sticker per drink rather than one per order */
  perItem: boolean;
};

/** Layouts the customer-facing digital menu can be rendered in. */
export const MENU_TEMPLATES = ["classic", "board", "cards"] as const;
export type MenuTemplate = (typeof MENU_TEMPLATES)[number];

export type Settings = {
  /** USD to KHR rate used for the till float and receipt conversions. */
  khrRate: number;
  receiptAction: ReceiptAction;
  printLogo: boolean;
  shiftReport: ShiftReportMode;
  receiptPrinter: ReceiptPrinter;
  labelPrinter: LabelPrinter;
  /** Template the digital menu is published in. */
  menuTemplate: MenuTemplate;
};

export const DEFAULT_SETTINGS: Settings = {
  khrRate: DEFAULT_KHR_RATE,
  menuTemplate: "classic",
  receiptAction: "preview",
  printLogo: true,
  shiftReport: "auto",
  receiptPrinter: {
    connected: false,
    name: "",
    connection: "usb",
    address: "",
    paperWidth: "80",
    copies: 1,
  },
  labelPrinter: {
    connected: false,
    name: "",
    connection: "bluetooth",
    address: "",
    size: { width: 50, height: 30 },
    perItem: true,
  },
};

/* -------------------------------------------------------------------- auth */

export type Role = "admin" | "manager" | "cashier";

export type User = {
  id: string;
  name: string;
  email: string;
  /** Mocked — a real backend would never store or return this. */
  password: string;
  role: Role;
  /** Branch the user is assigned to; admins may work across all of them. */
  branchId?: string;
  active: boolean;
};

export const ROLE_LABEL: Record<Role, string> = {
  admin: "Admin",
  manager: "Manager",
  cashier: "Cashier",
};

/** Every screen a role can be granted. */
export const PERMISSIONS: { path: string; label: string }[] = [
  { path: "/", label: "Register (POS)" },
  { path: "/dashboard", label: "Dashboard" },
  { path: "/orders", label: "Orders" },
  { path: "/sale-drafts", label: "Sale Drafts" },
  { path: "/expenses", label: "Expenses" },
  { path: "/menu", label: "Menu" },
  { path: "/digital-menu", label: "Digital Menu" },
  { path: "/reports", label: "Reports" },
  { path: "/users", label: "Users" },
  { path: "/branches", label: "Branches" },
  { path: "/payment-methods", label: "Payment Methods" },
  { path: "/settings", label: "Settings" },
];

export const ALL_PATHS = PERMISSIONS.map((p) => p.path);

/**
 * Permissions that cannot be switched off:
 * - the register is where every signed-in user lands, so removing it would loop
 * - an admin must keep Users, or nobody could ever hand the access back
 */
export const lockedFor = (role: Role) =>
  role === "admin" ? ["/", "/users"] : ["/"];

export const DEFAULT_ROLE_PERMISSIONS: Record<Role, string[]> = {
  admin: ALL_PATHS,
  manager: [
    "/",
    "/dashboard",
    "/orders",
    "/sale-drafts",
    "/expenses",
    "/menu",
    "/digital-menu",
    "/reports",
    "/branches",
  ],
  cashier: ["/", "/orders", "/sale-drafts", "/expenses"],
};

export const pathLabel = (path: string) =>
  PERMISSIONS.find((p) => p.path === path)?.label ?? path;

export const ROLES: { id: Role; label: string; blurb: string }[] = [
  { id: "admin", label: "Admin", blurb: "Full control of the store" },
  { id: "manager", label: "Manager", blurb: "Runs the floor and the menu" },
  { id: "cashier", label: "Cashier", blurb: "Takes orders at the till" },
];

export const SEED_USERS: User[] = [
  {
    id: "u1",
    name: "Super Admin",
    email: "admin@bongpos.com",
    password: "bongpos123",
    role: "admin",
    active: true,
  },
  {
    id: "u2",
    name: "Sok Dara",
    email: "dara@bongpos.com",
    password: "bongpos123",
    role: "manager",
    branchId: "penghout",
    active: true,
  },
  {
    id: "u3",
    name: "Cashier Panha",
    email: "panha@bongpos.com",
    password: "bongpos123",
    role: "cashier",
    branchId: "penghout",
    active: true,
  },
];
