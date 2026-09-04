"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { useI18n, type TranslationKey } from "@/lib/i18n";
import {
  CONNECTIONS,
  LABEL_PRESETS,
  type LabelPrinter,
  type PaperWidth,
  type ReceiptPrinter,
} from "@/lib/types";
import { CloseIcon } from "./icons";
import { Field, Segmented, Toggle, inputClass } from "./settings-ui";

type Kind = "receipt" | "label";

export default function PrinterDialog({
  kind,
  onClose,
}: {
  kind: Kind;
  onClose: () => void;
}) {
  const { settings, updateSettings } = useStore();
  const { t } = useI18n();
  const [receipt, setReceipt] = useState<ReceiptPrinter>(settings.receiptPrinter);
  const [label, setLabel] = useState<LabelPrinter>(settings.labelPrinter);
  const [tested, setTested] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const isReceipt = kind === "receipt";
  const draft = isReceipt ? receipt : label;
  const patch = (p: Partial<ReceiptPrinter> & Partial<LabelPrinter>) =>
    isReceipt
      ? setReceipt((d) => ({ ...d, ...(p as Partial<ReceiptPrinter>) }))
      : setLabel((d) => ({ ...d, ...(p as Partial<LabelPrinter>) }));

  const save = () => {
    updateSettings(isReceipt ? { receiptPrinter: receipt } : { labelPrinter: label });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-neutral-950/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-3xl bg-white shadow-2xl ring-1 ring-black/10">
        <div className="sticky top-0 flex items-center justify-between border-b border-line bg-white px-6 py-5">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">
              {isReceipt ? t("printer.receipt") : t("printer.label")}
            </h2>
            <p className="text-xs text-muted">
              {isReceipt ? t("printer.receiptBlurb") : t("printer.labelBlurb")}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label={t("common.close")}
            className="grid h-9 w-9 place-items-center rounded-xl text-muted transition-colors hover:bg-neutral-100 hover:text-neutral-900"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-5 px-6 py-5">
          <div className="flex items-center justify-between rounded-2xl bg-surface px-5 py-4">
            <div>
              <p className="text-[15px] font-semibold">{t("printer.connected")}</p>
              <p className="mt-0.5 text-xs text-muted">
                {draft.connected ? t("printer.inUse") : t("printer.disabled")}
              </p>
            </div>
            <Toggle
              checked={draft.connected}
              onChange={(v) => patch({ connected: v })}
              label={t("printer.toggleLabel")}
            />
          </div>

          <Field label={t("printer.name")}>
            <input
              value={draft.name}
              onChange={(e) => patch({ name: e.target.value })}
              placeholder={isReceipt ? "XPrinter XP-80C" : "Munbyn ITPP941"}
              className={inputClass}
            />
          </Field>

          <div>
            <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted">
              {t("printer.connection")}
            </span>
            <Segmented
              value={draft.connection}
              onChange={(v) => patch({ connection: v })}
              options={CONNECTIONS.map((c) => ({
                ...c,
                label: t(`connection.${c.id}` as TranslationKey),
              }))}
            />
          </div>

          {draft.connection === "network" && (
            <Field label={t("printer.ip")}>
              <input
                value={draft.address}
                onChange={(e) => patch({ address: e.target.value })}
                placeholder="192.168.1.50"
                inputMode="decimal"
                className={`${inputClass} tabular-nums`}
              />
            </Field>
          )}

          {isReceipt ? (
            <>
              <div>
                <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted">
                  {t("printer.receiptSize")}
                </span>
                <div className="grid grid-cols-2 gap-3">
                  {(["58", "80"] as PaperWidth[]).map((w) => {
                    const active = receipt.paperWidth === w;
                    return (
                      <button
                        key={w}
                        onClick={() => setReceipt((d) => ({ ...d, paperWidth: w }))}
                        className={[
                          "rounded-2xl border p-4 text-left transition-colors",
                          active
                            ? "border-neutral-900 bg-neutral-900 text-white"
                            : "border-line hover:border-neutral-300",
                        ].join(" ")}
                      >
                        <p className="text-lg font-semibold tabular-nums">{w} mm</p>
                        <p
                          className={`mt-0.5 text-xs ${
                            active ? "text-neutral-300" : "text-neutral-500"
                          }`}
                        >
                          {w === "58" ? t("printer.chars58") : t("printer.chars80")}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted">
                  {t("printer.copies")}
                </span>
                <Segmented
                  value={String(receipt.copies)}
                  onChange={(v) => setReceipt((d) => ({ ...d, copies: Number(v) }))}
                  options={[
                    { id: "1", label: "1" },
                    { id: "2", label: "2" },
                    { id: "3", label: "3" },
                  ]}
                />
              </div>
            </>
          ) : (
            <>
              <div>
                <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted">
                  {t("printer.labelSize")}
                </span>
                <div className="grid grid-cols-2 gap-3">
                  {LABEL_PRESETS.map((s) => {
                    const active =
                      label.size.width === s.width && label.size.height === s.height;
                    return (
                      <button
                        key={`${s.width}x${s.height}`}
                        onClick={() => setLabel((d) => ({ ...d, size: s }))}
                        className={[
                          "rounded-2xl border p-4 text-left transition-colors",
                          active
                            ? "border-neutral-900 bg-neutral-900 text-white"
                            : "border-line hover:border-neutral-300",
                        ].join(" ")}
                      >
                        <p className="text-lg font-semibold tabular-nums">
                          {s.width} × {s.height}
                        </p>
                        <p
                          className={`mt-0.5 text-xs ${
                            active ? "text-neutral-300" : "text-neutral-500"
                          }`}
                        >
                          {t("printer.millimetres")}
                        </p>
                      </button>
                    );
                  })}
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <Field label={t("printer.customWidth")}>
                    <input
                      inputMode="numeric"
                      value={label.size.width || ""}
                      onChange={(e) =>
                        setLabel((d) => ({
                          ...d,
                          size: {
                            ...d.size,
                            width: Number(e.target.value.replace(/[^0-9]/g, "") || 0),
                          },
                        }))
                      }
                      className={`${inputClass} tabular-nums`}
                    />
                  </Field>
                  <Field label={t("printer.customHeight")}>
                    <input
                      inputMode="numeric"
                      value={label.size.height || ""}
                      onChange={(e) =>
                        setLabel((d) => ({
                          ...d,
                          size: {
                            ...d.size,
                            height: Number(e.target.value.replace(/[^0-9]/g, "") || 0),
                          },
                        }))
                      }
                      className={`${inputClass} tabular-nums`}
                    />
                  </Field>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-2xl bg-surface px-5 py-4">
                <div className="pr-4">
                  <p className="text-[15px] font-semibold">{t("printer.perItem")}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-muted">
                    {t("printer.perItemBlurb")}
                  </p>
                </div>
                <Toggle
                  checked={label.perItem}
                  onChange={(v) => setLabel((d) => ({ ...d, perItem: v }))}
                  label={t("printer.perItem")}
                />
              </div>
            </>
          )}

          <button
            onClick={() => setTested(true)}
            disabled={!draft.connected}
            className="h-12 w-full rounded-xl border border-line text-sm font-medium transition-colors hover:bg-surface disabled:text-neutral-400 disabled:hover:bg-transparent"
          >
            {tested ? t("printer.testSent") : t("printer.sendTest")}
          </button>
        </div>

        <div className="sticky bottom-0 flex gap-3 border-t border-line bg-white px-6 py-5">
          <button
            onClick={onClose}
            className="h-12 flex-1 rounded-xl border border-line text-sm font-medium transition-colors hover:bg-surface"
          >
            {t("common.cancel")}
          </button>
          <button
            onClick={save}
            className="h-12 flex-[1.4] rounded-xl bg-neutral-900 text-sm font-semibold text-white transition-opacity hover:opacity-85"
          >
            {t("printer.save")}
          </button>
        </div>
      </div>
    </div>
  );
}
