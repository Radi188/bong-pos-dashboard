"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import { DraftIcon, ReceiptIcon, SearchIcon } from "./icons";
import ShiftControls from "./ShiftControls";
import ShopIdentity from "./ShopIdentity";

export default function PosTopbar({
  query,
  onQuery,
}: {
  query: string;
  onQuery: (v: string) => void;
}) {
  const { t } = useI18n();

  return (
    <header className="@container flex h-[92px] shrink-0 items-center gap-3 border-b border-line px-5 @4xl:gap-4 @4xl:px-6">
      <ShopIdentity />

      <div className="relative min-w-[120px] flex-1 @4xl:max-w-xs">
        <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted" />
        <input
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          placeholder={t("pos.searchMenu")}
          className="h-12 w-full rounded-2xl border border-line bg-surface pl-11 pr-4 text-[15px] outline-none transition-colors placeholder:text-muted focus:border-neutral-900 focus:bg-white"
        />
      </div>

      {/* Moved out of the sidebar */}
      <nav className="flex shrink-0 items-center gap-2">
        <HeaderLink href="/sale-drafts" label={t("nav.drafts")} Icon={DraftIcon} />
        <HeaderLink href="/expenses" label={t("nav.expenses")} Icon={ReceiptIcon} />
      </nav>

      <ShiftControls />
    </header>
  );
}

function HeaderLink({
  href,
  label,
  Icon,
}: {
  href: string;
  label: string;
  Icon: (p: { className?: string }) => React.ReactElement;
}) {
  return (
    <Link
      href={href}
      title={label}
      aria-label={label}
      className="flex h-12 items-center gap-2 rounded-2xl border border-line px-3.5 text-sm font-medium text-neutral-700 transition-colors hover:border-neutral-300 hover:text-neutral-900 @4xl:px-4"
    >
      <Icon className="h-[18px] w-[18px] shrink-0" />
      <span className="hidden @4xl:inline">{label}</span>
    </Link>
  );
}
