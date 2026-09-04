import type { TranslationKey } from "./i18n";
import type { Category, Role } from "./types";

/**
 * Data values (roles, categories, permission paths) are stored in English and
 * translated only for display. These map a stored value to its dictionary key,
 * keeping the cast to `TranslationKey` in one place.
 */
export const roleKey = (role: Role) => `role.${role}` as TranslationKey;

export const roleBlurbKey = (role: Role) => `role.${role}.blurb` as TranslationKey;

export const categoryKey = (category: Category | string) =>
  `category.${category}` as TranslationKey;

/** Screen names shown in the permissions matrix; keyed by route. */
const PATH_KEYS: Record<string, TranslationKey> = {
  "/": "nav.register",
  "/dashboard": "nav.dashboard",
  "/orders": "nav.orders",
  "/sale-drafts": "nav.saleDrafts",
  "/expenses": "nav.expenses",
  "/menu": "nav.menu",
  "/reports": "nav.reports",
  "/users": "nav.users",
  "/branches": "nav.branches",
  "/payment-methods": "nav.paymentMethods",
  "/settings": "nav.settings",
};

export const pathKey = (path: string): TranslationKey => PATH_KEYS[path] ?? "nav.settings";
