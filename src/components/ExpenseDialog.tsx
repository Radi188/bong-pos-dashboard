"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { useI18n } from "@/lib/i18n";
import { CloseIcon } from "./icons";

export default function ExpenseDialog({ onClose }: { onClose: () => void }) {
  const { addExpense, branch } = useStore();
  const { t } = useI18n();
  const [note, setNote] = useState("");
  const [amount, setAmount] = useState("");
  const valid = note.trim() !== "" && Number(amount) > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-neutral-950/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative w-full max-w-sm overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-black/10">
        <div className="flex items-center justify-between border-b border-line px-6 py-5">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">{t("expense.title")}</h2>
            <p className="text-xs text-muted">{branch.name}</p>
          </div>
          <button
            onClick={onClose}
            aria-label={t("common.close")}
            className="grid h-9 w-9 place-items-center rounded-xl text-muted transition-colors hover:bg-neutral-100 hover:text-neutral-900"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 px-6 py-5">
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted">
              {t("expense.note")}
            </span>
            <input
              autoFocus
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t("expense.notePlaceholder")}
              className="h-12 w-full rounded-xl border border-line px-4 text-[15px] outline-none transition-colors focus:border-neutral-900"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted">
              {t("expense.amount")}
            </span>
            <input
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
              placeholder="0.00"
              className="h-12 w-full rounded-xl border border-line px-4 text-[15px] tabular-nums outline-none transition-colors focus:border-neutral-900"
            />
          </label>
        </div>

        <div className="flex gap-3 border-t border-line px-6 py-5">
          <button
            onClick={onClose}
            className="h-12 flex-1 rounded-xl border border-line text-sm font-medium transition-colors hover:bg-surface"
          >
            {t("common.cancel")}
          </button>
          <button
            disabled={!valid}
            onClick={() => {
              addExpense(note.trim(), Number(amount));
              onClose();
            }}
            className="h-12 flex-1 rounded-xl bg-neutral-900 text-sm font-semibold text-white transition-opacity hover:opacity-85 disabled:bg-neutral-200 disabled:text-neutral-400"
          >
            {t("expense.save")}
          </button>
        </div>
      </div>
    </div>
  );
}
