"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { useI18n } from "@/lib/i18n";
import { LogoutIcon } from "./icons";
import OpenTillDialog from "./OpenTillDialog";
import CloseTillDialog from "./CloseTillDialog";

function elapsed(fromISO: string, now: number) {
  const mins = Math.max(0, Math.floor((now - new Date(fromISO).getTime()) / 60000));
  return { hours: Math.floor(mins / 60), minutes: mins % 60 };
}

/** Shift pill and the Open/End Shift button — shared by every screen header. */
export default function ShiftControls() {
  const { shift } = useStore();
  const { t } = useI18n();
  const [tillOpen, setTillOpen] = useState(false);
  const [closeOpen, setCloseOpen] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);

  return (
    <>
      {shift ? (
        <div className="flex shrink-0 items-center gap-2">
          <div className="flex h-11 items-center gap-2.5 rounded-full border border-emerald-200 bg-emerald-50 px-4 text-sm">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="hidden max-w-[110px] truncate font-medium text-emerald-800 @5xl:inline">
              {shift.cashier}
            </span>
            <span className="hidden text-emerald-300 @5xl:inline">·</span>
            <span className="tabular-nums text-emerald-700">
              {t("shift.elapsed", elapsed(shift.startedAt, now))}
            </span>
          </div>
          <button
            onClick={() => setCloseOpen(true)}
            aria-label={t("shift.end")}
            className="flex h-11 items-center gap-2 rounded-full border border-red-200 bg-red-50 px-4 text-sm font-medium text-red-600 transition-colors hover:border-red-300 hover:bg-red-100"
          >
            <LogoutIcon className="h-[17px] w-[17px]" />
            <span className="hidden @4xl:inline">{t("shift.end")}</span>
          </button>
        </div>
      ) : (
        <button
          onClick={() => setTillOpen(true)}
          className="flex h-11 shrink-0 items-center gap-2 rounded-full bg-emerald-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
        >
          <span className="h-2 w-2 rounded-full bg-white" />
          {t("shift.open")}
        </button>
      )}

      {tillOpen && <OpenTillDialog onClose={() => setTillOpen(false)} />}
      {closeOpen && shift && <CloseTillDialog onClose={() => setCloseOpen(false)} />}
    </>
  );
}
