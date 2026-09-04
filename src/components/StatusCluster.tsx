"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { BellIcon } from "./icons";

/** Clock and notification bell — lives at the top of the right-hand panel. */
export default function StatusCluster() {
  const { t, locale } = useI18n();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  const clock = new Date(now);

  return (
    <div className="flex shrink-0 items-center gap-3">
      <div className="text-right">
        <p className="text-lg font-semibold leading-tight tracking-tight tabular-nums">
          {clock.toLocaleTimeString(locale, { hour: "numeric", minute: "2-digit" })}
        </p>
        <p className="text-xs text-muted">
          {clock.toLocaleDateString(locale, { weekday: "short", month: "short", day: "numeric" })}
        </p>
      </div>

      <button
        aria-label={t("shift.notifications")}
        className="relative grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-line transition-colors hover:bg-surface"
      >
        <BellIcon className="h-[19px] w-[19px]" />
        <span className="absolute right-3 top-3 h-2 w-2 rounded-full bg-neutral-900 ring-2 ring-white" />
      </button>
    </div>
  );
}
