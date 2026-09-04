"use client";

import Image from "next/image";
import { useStore } from "@/lib/store";

/**
 * Logo, shop name and active branch. Shown in every screen header, so the cashier
 * always knows which store and branch they are ringing up against.
 * Sized with container queries — headers vary a lot in width across screens.
 */
export default function ShopIdentity() {
  const { storeName, branch } = useStore();

  return (
    <div className="flex shrink-0 items-center gap-3">
      <Image
        src="/logo-mark.png"
        alt=""
        width={40}
        height={40}
        priority
        className="h-10 w-10 shrink-0"
      />
      <div className="hidden min-w-0 @lg:block">
        <p className="max-w-[130px] truncate text-[15px] font-semibold leading-tight tracking-tight @4xl:max-w-[170px]">
          {storeName}
        </p>
        <p className="max-w-[130px] truncate text-xs text-muted @4xl:max-w-[170px]">
          {branch.name}
        </p>
      </div>
    </div>
  );
}
