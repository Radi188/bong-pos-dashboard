"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { roleKey } from "@/lib/labels";
import LanguageSwitch from "./LanguageSwitch";
import {
  BranchIcon,
  CardIcon,
  ChartIcon,
  ChevronDownIcon,
  EyeIcon,
  GridIcon,
  LogoutIcon,
  MenuListIcon,
  MonitorIcon,
  OrdersIcon,
  PanelIcon,
  ProductsIcon,
  SettingsIcon,
  UsersIcon,
} from "./icons";

const NAV = [
  { href: "/", labelKey: "nav.pos", Icon: MonitorIcon },
  { href: "/dashboard", labelKey: "nav.dashboard", Icon: GridIcon },
  { href: "/orders", labelKey: "nav.orders", Icon: OrdersIcon },
  { href: "/menu", labelKey: "nav.menu", Icon: MenuListIcon },
  { href: "/categories", labelKey: "nav.categories", Icon: ProductsIcon },
  { href: "/digital-menu", labelKey: "nav.digitalMenu", Icon: EyeIcon },
  { href: "/reports", labelKey: "nav.reports", Icon: ChartIcon },
  { href: "/users", labelKey: "nav.users", Icon: UsersIcon },
  { href: "/branches", labelKey: "nav.branches", Icon: BranchIcon },
  { href: "/payment-methods", labelKey: "nav.paymentMethods", Icon: CardIcon },
  { href: "/settings", labelKey: "nav.settings", Icon: SettingsIcon },
] as const;

export default function Sidebar() {
  const pathname = usePathname();
  const { storeName, branch, branches, setBranch, canAccess } = useStore();
  const { user, signOut } = useAuth();
  const { t } = useI18n();
  const [collapsed, setCollapsed] = useState(false);
  const [branchOpen, setBranchOpen] = useState(false);

  return (
    <aside
      className={[
        "no-print flex shrink-0 flex-col bg-neutral-950 text-white transition-[width] duration-200",
        collapsed ? "w-[84px]" : "w-[264px]",
      ].join(" ")}
    >
      {/* Brand */}
      {collapsed ? (
        <div className="flex shrink-0 flex-col items-center gap-2 px-4 pb-3 pt-4">
          <Image
            src="/logo-mark.png"
            alt="Bong POS"
            width={48}
            height={48}
            priority
            className="h-12 w-12"
          />
          <button
            onClick={() => setCollapsed(false)}
            aria-label={t("sidebar.expand")}
            className="grid h-9 w-9 place-items-center rounded-lg text-neutral-400 transition-colors hover:bg-white/10 hover:text-white"
          >
            <PanelIcon className="h-[18px] w-[18px]" />
          </button>
        </div>
      ) : (
        <div className="flex h-[92px] shrink-0 items-center gap-3 px-4">
          <Image
            src="/logo-mark.png"
            alt="Bong POS"
            width={48}
            height={48}
            priority
            className="h-12 w-12 shrink-0"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-lg font-semibold leading-tight tracking-tight">
              {storeName}
            </p>
            <p className="truncate text-xs text-neutral-400">
              {t("sidebar.tagline")}
            </p>
          </div>
          <button
            onClick={() => setCollapsed(true)}
            aria-label={t("sidebar.collapse")}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-neutral-400 transition-colors hover:bg-white/10 hover:text-white"
          >
            <PanelIcon className="h-[18px] w-[18px]" />
          </button>
        </div>
      )}

      <div className="mx-4 h-px shrink-0 bg-white/10" />

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-3">
        <ul className="space-y-1">
          {NAV.filter(({ href }) => !user || canAccess(user.role, href)).map(
            ({ href, labelKey, Icon }) => {
              const active = pathname === href;
              const label = t(labelKey);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    title={collapsed ? label : undefined}
                    className={[
                      "flex items-center gap-3.5 rounded-xl px-4 py-3 text-[15px] font-medium transition-colors",
                      collapsed ? "justify-center px-0" : "",
                      active
                        ? "bg-white text-neutral-950 shadow-sm"
                        : "text-neutral-400 hover:bg-white/10 hover:text-white",
                    ].join(" ")}
                  >
                    <Icon className="h-[19px] w-[19px] shrink-0" />
                    {!collapsed && <span className="truncate">{label}</span>}
                  </Link>
                </li>
              );
            },
          )}
        </ul>
      </nav>

      {/* User */}
      <div className="shrink-0 border-t border-white/10 p-3">
        <div
          className={`flex items-center gap-3 px-1 ${collapsed ? "justify-center" : ""}`}
        >
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/10 text-sm font-semibold uppercase">
            {(user?.name ?? "?").charAt(0)}
          </div>
          {!collapsed && (
            <>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium leading-tight">
                  {user?.name}
                </p>
                <p className="truncate text-xs text-neutral-400">
                  {user ? t(roleKey(user.role)) : ""}
                </p>
              </div>
              <button
                onClick={signOut}
                aria-label={t("sidebar.signOut")}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-neutral-400 transition-colors hover:bg-white/10 hover:text-white"
              >
                <LogoutIcon className="h-[18px] w-[18px]" />
              </button>
            </>
          )}
        </div>

        {!collapsed && <LanguageSwitch />}

        {/* Branch switcher */}
        {!collapsed && (
          <div className="relative mt-3">
            <button
              onClick={() => setBranchOpen((o) => !o)}
              className="flex w-full items-center gap-2.5 rounded-xl bg-white/10 px-3 py-2.5 text-sm transition-colors hover:bg-white/15"
            >
              <BranchIcon className="h-[17px] w-[17px] shrink-0 text-neutral-400" />
              <span className="min-w-0 flex-1 truncate text-left">
                {branch.name}
              </span>
              <ChevronDownIcon
                className={`h-4 w-4 shrink-0 text-neutral-400 transition-transform ${
                  branchOpen ? "rotate-180" : ""
                }`}
              />
            </button>
            {branchOpen && (
              <ul className="absolute bottom-full left-0 right-0 mb-2 overflow-hidden rounded-xl bg-neutral-800 py-1 shadow-xl ring-1 ring-white/10">
                {branches.map((b) => (
                  <li key={b.id}>
                    <button
                      onClick={() => {
                        setBranch(b.id);
                        setBranchOpen(false);
                      }}
                      className={[
                        "w-full px-3 py-2.5 text-left text-sm transition-colors hover:bg-white/10",
                        b.id === branch.id
                          ? "font-medium text-white"
                          : "text-neutral-300",
                      ].join(" ")}
                    >
                      {b.name}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
