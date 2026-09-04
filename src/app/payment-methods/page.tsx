"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { useStore } from "@/lib/store";
import { useI18n, type TranslationKey } from "@/lib/i18n";
import type { PaymentMethod } from "@/lib/types";
import { readLogo } from "@/lib/image";
import { currency, isToday } from "@/lib/format";
import PageHeader from "@/components/PageHeader";
import { CloseIcon, ImageIcon, PlusIcon, TrashIcon } from "@/components/icons";
import { Toggle } from "@/components/settings-ui";

const inputClass =
  "h-12 w-full rounded-xl border border-line px-4 text-[15px] outline-none transition-colors focus:border-neutral-900";

const blank = (): PaymentMethod => ({
  id: "",
  label: "",
  mark: "",
  description: "",
  enabled: true,
});

export default function PaymentMethodsPage() {
  const { paymentMethods, savePaymentMethod, deletePaymentMethod, orders } = useStore();
  const { t } = useI18n();
  const [editing, setEditing] = useState<PaymentMethod | null>(null);
  const [error, setError] = useState<TranslationKey | null>(null);

  const enabled = paymentMethods.filter((m) => m.enabled);
  const today = orders.filter((o) => isToday(o.createdAt));

  const takings = (id: string) => {
    const list = today.filter((o) => o.method === id);
    return { count: list.length, total: list.reduce((s, o) => s + o.total, 0) };
  };

  const toggle = (m: PaymentMethod) => {
    if (m.enabled && enabled.length === 1) {
      setError("error.keepOneEnabled");
      return;
    }
    setError(null);
    savePaymentMethod({ ...m, enabled: !m.enabled });
  };

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title={t("nav.paymentMethods")}
        subtitle={t("tenders.subtitle", { enabled: enabled.length, total: paymentMethods.length })}
      >
        <button
          onClick={() => {
            setError(null);
            setEditing(blank());
          }}
          className="flex h-12 items-center gap-2 rounded-2xl bg-neutral-900 px-5 text-sm font-semibold text-white transition-opacity hover:opacity-85"
        >
          <PlusIcon className="h-[18px] w-[18px]" />
          {t("tenders.add")}
        </button>
      </PageHeader>

      <div className="flex-1 overflow-y-auto bg-surface p-6">
        <div className="mx-auto max-w-4xl">
          {error && (
            <p className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {t(error)}
            </p>
          )}

          <div className="rounded-3xl bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)] ring-1 ring-black/[0.04]">
            <h2 className="text-lg font-bold tracking-tight">{t("tenders.heading")}</h2>
            <p className="mt-1 text-[15px] text-neutral-500">
              {t("tenders.blurb")}
            </p>

            <ul className="mt-5 divide-y divide-line">
              {paymentMethods.map((m) => {
                const take = takings(m.id);
                return (
                  <li key={m.id} className="group flex items-center gap-4 py-4">
                    <MethodMark method={m} />

                    <button
                      onClick={() => {
                        setError(null);
                        setEditing(m);
                      }}
                      className="min-w-0 flex-1 text-left"
                    >
                      <span
                        className={`block text-base font-bold tracking-tight underline-offset-4 group-hover:underline ${
                          m.enabled ? "" : "text-neutral-400"
                        }`}
                      >
                        {m.label}
                      </span>
                      <span className="mt-0.5 block text-sm leading-relaxed text-muted">
                        {m.description || t("tenders.noDescription")}
                      </span>
                    </button>

                    <div className="hidden w-32 shrink-0 text-right sm:block">
                      <p className="text-base font-semibold tabular-nums">{currency(take.total)}</p>
                      <p className="text-xs text-muted tabular-nums">
                        {t("tenders.ordersToday", { count: take.count })}
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        const r = deletePaymentMethod(m.id);
                        if (!r.ok) setError(r.error ?? null);
                        else setError(null);
                      }}
                      aria-label={t("tenders.remove", { name: m.label })}
                      className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-muted opacity-0 transition-all hover:bg-neutral-100 hover:text-neutral-900 focus:opacity-100 group-hover:opacity-100"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>

                    <Toggle
                      checked={m.enabled}
                      onChange={() => toggle(m)}
                      label={t("tenders.toggleLabel", { name: m.label })}
                    />
                  </li>
                );
              })}
            </ul>
          </div>

          <p className="mt-4 px-2 text-sm leading-relaxed text-muted">
            {t("tenders.footnote")}
          </p>
        </div>
      </div>

      {editing && (
        <MethodDialog
          initial={editing}
          existing={paymentMethods}
          onClose={() => setEditing(null)}
          onSave={(m) => {
            savePaymentMethod(m);
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

function MethodMark({ method: m, size = 48 }: { method: PaymentMethod; size?: number }) {
  return m.logo ? (
    <Image
      src={m.logo}
      alt=""
      width={size}
      height={size}
      unoptimized
      className={`shrink-0 rounded-2xl object-contain ring-1 ring-black/[0.06] ${
        m.enabled ? "" : "opacity-40 grayscale"
      }`}
      style={{ width: size, height: size }}
    />
  ) : (
    <span
      className={[
        "grid shrink-0 place-items-center rounded-2xl text-sm font-bold",
        m.enabled ? "bg-neutral-900 text-white" : "bg-neutral-100 text-neutral-400",
      ].join(" ")}
      style={{ width: size, height: size }}
    >
      {m.mark}
    </span>
  );
}

function MethodDialog({
  initial,
  existing,
  onSave,
  onClose,
}: {
  initial: PaymentMethod;
  existing: PaymentMethod[];
  onSave: (m: PaymentMethod) => void;
  onClose: () => void;
}) {
  const isEdit = initial.id !== "";
  const [form, setForm] = useState<PaymentMethod>(initial);
  const { t } = useI18n();
  const [uploadError, setUploadError] = useState<TranslationKey | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const slug = (label: string) =>
    label.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  const duplicate =
    !isEdit && existing.some((m) => m.id === slug(form.label) && slug(form.label) !== "");
  const valid = form.label.trim() !== "" && !duplicate;

  const pick = async (file?: File) => {
    if (!file) return;
    try {
      const logo = await readLogo(file);
      setForm((f) => ({ ...f, logo }));
      setUploadError(null);
    } catch (e) {
      setUploadError((e instanceof Error ? e.message : "error.imageFailed") as TranslationKey);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-neutral-950/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-3xl bg-white shadow-2xl ring-1 ring-black/10">
        <div className="sticky top-0 flex items-center justify-between border-b border-line bg-white px-6 py-5">
          <h2 className="text-lg font-semibold tracking-tight">
            {isEdit ? t("tenders.editTitle") : t("tenders.addTitle")}
          </h2>
          <button
            onClick={onClose}
            aria-label={t("common.close")}
            className="grid h-9 w-9 place-items-center rounded-xl text-muted transition-colors hover:bg-neutral-100 hover:text-neutral-900"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-5 px-6 py-5">
          {/* Logo */}
          <div>
            <span className="mb-2 block text-xs font-medium uppercase tracking-wider text-muted">
              {t("tenders.logo")}
            </span>
            <div className="flex items-center gap-4">
              <MethodMark method={{ ...form, enabled: true }} size={64} />
              <div className="flex-1">
                <div className="flex gap-2">
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-line text-sm font-medium transition-colors hover:border-neutral-900"
                  >
                    <ImageIcon className="h-[18px] w-[18px]" />
                    {form.logo ? t("tenders.replace") : t("tenders.upload")}
                  </button>
                  {form.logo && (
                    <button
                      onClick={() => setForm({ ...form, logo: undefined })}
                      className="h-11 rounded-xl border border-line px-4 text-sm font-medium text-muted transition-colors hover:text-neutral-900"
                    >
                      {t("common.delete")}
                    </button>
                  )}
                </div>
                <p className="mt-1.5 text-xs text-muted">{t("tenders.logoHint")}</p>
              </div>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => pick(e.target.files?.[0])}
            />
            {uploadError && <p className="mt-2 text-sm text-red-600">{t(uploadError)}</p>}
          </div>

          <Field label={t("common.name")}>
            <input
              autoFocus
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
              placeholder={t("tenders.namePlaceholder")}
              className={inputClass}
            />
          </Field>
          {duplicate && (
            <p className="-mt-2 text-sm text-red-600">{t("tenders.duplicate")}</p>
          )}

          <Field label={t("tenders.mark")}>
            <input
              value={form.mark}
              onChange={(e) => setForm({ ...form, mark: e.target.value.slice(0, 3) })}
              placeholder="AB"
              className={inputClass}
            />
            <span className="mt-1.5 block text-xs text-muted">
              {t("tenders.markHint")}
            </span>
          </Field>

          <Field label={t("tenders.description")}>
            <input
              value={form.description ?? ""}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder={t("tenders.descriptionPlaceholder")}
              className={inputClass}
            />
          </Field>

          <div className="flex items-center justify-between rounded-2xl bg-surface px-5 py-4">
            <div>
              <p className="text-[15px] font-semibold">{t("tenders.available")}</p>
              <p className="mt-0.5 text-xs text-muted">{t("tenders.availableBlurb")}</p>
            </div>
            <Toggle
              checked={form.enabled}
              onChange={(v) => setForm({ ...form, enabled: v })}
              label={t("tenders.available")}
            />
          </div>
        </div>

        <div className="sticky bottom-0 flex gap-3 border-t border-line bg-white px-6 py-5">
          <button
            onClick={onClose}
            className="h-12 flex-1 rounded-xl border border-line text-sm font-medium transition-colors hover:bg-surface"
          >
            {t("common.cancel")}
          </button>
          <button
            disabled={!valid}
            onClick={() =>
              onSave({
                ...form,
                id: form.id || slug(form.label),
                label: form.label.trim(),
                mark: (form.mark.trim() || form.label.trim().slice(0, 2)).toUpperCase(),
              })
            }
            className="h-12 flex-[1.4] rounded-xl bg-neutral-900 text-sm font-semibold text-white transition-opacity hover:opacity-85 disabled:bg-neutral-200 disabled:text-neutral-400"
          >
            {isEdit ? t("common.saveChanges") : t("tenders.addSubmit")}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted">
        {label}
      </span>
      {children}
    </label>
  );
}
