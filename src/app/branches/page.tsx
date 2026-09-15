"use client";

import Image from "next/image";
import { useMemo, useRef, useState } from "react";
import { useStore } from "@/lib/store";
import { currency, isToday } from "@/lib/format";
import { useI18n, type TranslationKey } from "@/lib/i18n";
import type { Branch } from "@/lib/types";
import PageHeader from "@/components/PageHeader";
import {
  BranchIcon,
  CheckIcon,
  CloseIcon,
  ImageIcon,
  PhoneIcon,
  PinIcon,
  LockIcon,
  PlusIcon,
  TrashIcon,
} from "@/components/icons";
import { readLogo } from "@/lib/image";
import PlanDialog from "@/components/PlanDialog";

const inputClass =
  "h-12 w-full rounded-xl border border-line px-4 text-[15px] outline-none transition-colors focus:border-neutral-900";

const blank = (): Omit<Branch, "id"> => ({
  name: "",
  address: "",
  phone: "",
  mapUrl: "",
});

/** Accepts a full maps link or a pasted "lat, lng" pair. */
function normalizeMapUrl(input: string) {
  const value = input.trim();
  if (value === "") return "";
  if (/^https?:\/\//i.test(value)) return value;
  const coords = value.match(/^(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)$/);
  if (coords) return `https://maps.google.com/?q=${coords[1]},${coords[2]}`;
  return `https://maps.google.com/?q=${encodeURIComponent(value)}`;
}

export default function BranchesPage() {
  const {
    branches,
    branch,
    setBranch,
    addBranch,
    updateBranch,
    deleteBranch,
    orders,
    storeName,
    plan,
    branchLimit,
    canAddBranch,
  } = useStore();
  const [editing, setEditing] = useState<Branch | Omit<Branch, "id"> | null>(
    null,
  );
  const { t } = useI18n();
  const [error, setError] = useState<TranslationKey | null>(null);
  const [planOpen, setPlanOpen] = useState(false);

  const stats = useMemo(() => {
    const map = new Map<
      string,
      { orders: number; today: number; revenue: number }
    >();
    for (const o of orders) {
      const cur = map.get(o.branchId) ?? { orders: 0, today: 0, revenue: 0 };
      cur.orders += 1;
      cur.revenue += o.total;
      if (isToday(o.createdAt)) cur.today += o.total;
      map.set(o.branchId, cur);
    }
    return map;
  }, [orders]);

  const totalToday = [...stats.values()].reduce((s, v) => s + v.today, 0);

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title={t("nav.branches")}
        subtitle={t("branches.subtitle", {
          count: branches.length,
          store: storeName,
        })}
      >
        {/* Over the allowance the button sells the upgrade rather than
            opening a form that could not be saved anyway. */}
        {canAddBranch ? (
          <button
            onClick={() => {
              setError(null);
              setEditing(blank());
            }}
            className="flex h-12 items-center gap-2 rounded-2xl bg-neutral-900 px-5 text-sm font-semibold text-white transition-opacity hover:opacity-85"
          >
            <PlusIcon className="h-[18px] w-[18px]" />
            {t("branches.register")}
          </button>
        ) : (
          <button
            onClick={() => setPlanOpen(true)}
            className="flex h-12 items-center gap-2 rounded-2xl border border-neutral-900 px-5 text-sm font-semibold transition-colors hover:bg-neutral-900 hover:text-white"
          >
            <LockIcon className="h-[18px] w-[18px]" />
            {t("plan.upgrade")}
          </button>
        )}
      </PageHeader>

      <div className="flex-1 overflow-y-auto bg-surface p-6">
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Tile
              label={t("plan.tilePlan")}
              value={t(`plan.${plan}` as TranslationKey)}
              small
            />
            <Tile
              label={t("branches.tileBranches")}
              value={
                branchLimit === null
                  ? String(branches.length)
                  : `${branches.length} / ${branchLimit}`
              }
            />
            <Tile label={t("branches.tileServing")} value={branch.name} small />
            <Tile
              label={t("branches.tileRevenue")}
              value={currency(totalToday)}
            />
          </div>

          {!canAddBranch && (
            <div className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl border border-neutral-900 bg-white px-5 py-4">
              <LockIcon className="h-5 w-5 shrink-0" />
              <div className="min-w-0">
                <p className="text-[15px] font-semibold">{t("plan.locked")}</p>
                <p className="mt-0.5 text-sm text-muted">
                  {t("plan.lockedBlurb", {
                    plan: t(`plan.${plan}` as TranslationKey),
                    limit: t(
                      branchLimit === 1
                        ? "plan.branchesOne"
                        : "plan.branchesMany",
                      { count: branchLimit ?? 0 },
                    ),
                  })}
                </p>
              </div>
              <button
                onClick={() => setPlanOpen(true)}
                className="ml-auto h-11 shrink-0 rounded-xl bg-neutral-900 px-5 text-sm font-semibold text-white transition-opacity hover:opacity-85"
              >
                {t("plan.upgrade")}
              </button>
            </div>
          )}

          {error && (
            <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {t(error)}
            </p>
          )}

          <ul className="mt-4 grid gap-4 lg:grid-cols-2">
            {branches.map((b) => {
              const active = b.id === branch.id;
              const s = stats.get(b.id) ?? { orders: 0, today: 0, revenue: 0 };
              return (
                <li key={b.id}>
                  <div
                    className={[
                      "flex h-full flex-col rounded-3xl bg-white p-6 transition-shadow",
                      active
                        ? "ring-2 ring-neutral-900"
                        : "shadow-[0_1px_2px_rgba(0,0,0,0.04)] ring-1 ring-black/[0.04]",
                    ].join(" ")}
                  >
                    <div className="flex items-start gap-4">
                      <BranchMark branch={b} size={48} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h2 className="truncate text-lg font-bold tracking-tight">
                            {b.name}
                          </h2>
                          {active && (
                            <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-neutral-900 px-2.5 py-1 text-xs font-medium text-white">
                              <CheckIcon className="h-3 w-3" />
                              Active
                            </span>
                          )}
                        </div>
                        <p className="mt-1.5 flex items-start gap-1.5 text-sm text-muted">
                          <PinIcon className="mt-0.5 h-4 w-4 shrink-0" />
                          <span className="min-w-0 flex-1">
                            {b.address || t("branches.noAddress")}
                          </span>
                        </p>
                        {b.phone && (
                          <p className="mt-1 flex items-center gap-1.5 text-sm tabular-nums text-muted">
                            <PhoneIcon className="h-4 w-4 shrink-0" />
                            {b.phone}
                          </p>
                        )}
                        {b.mapUrl && (
                          <a
                            href={b.mapUrl}
                            target="_blank"
                            rel="noreferrer noopener"
                            className="mt-2 inline-flex h-8 items-center gap-1.5 rounded-full border border-line px-3 text-xs font-medium transition-colors hover:border-neutral-900"
                          >
                            <PinIcon className="h-3.5 w-3.5" />
                            {t("branches.openMap")}
                          </a>
                        )}
                      </div>
                    </div>

                    <dl className="mt-5 grid grid-cols-3 gap-4 border-t border-line pt-5">
                      <Metric
                        label={t("branches.metricOrders")}
                        value={String(s.orders)}
                      />
                      <Metric
                        label={t("branches.metricToday")}
                        value={currency(s.today)}
                      />
                      <Metric
                        label={t("branches.metricAllTime")}
                        value={currency(s.revenue)}
                      />
                    </dl>

                    <div className="mt-5 flex gap-2">
                      {!active && (
                        <button
                          onClick={() => setBranch(b.id)}
                          className="h-11 flex-1 rounded-xl bg-neutral-900 text-sm font-semibold text-white transition-opacity hover:opacity-85"
                        >
                          {t("branches.serveHere")}
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setError(null);
                          setEditing(b);
                        }}
                        className="h-11 flex-1 rounded-xl border border-line text-sm font-semibold transition-colors hover:border-neutral-900"
                      >
                        {t("common.edit")}
                      </button>
                      <button
                        onClick={() => {
                          const r = deleteBranch(b.id);
                          if (!r.ok) setError(r.error ?? null);
                        }}
                        aria-label={t("branches.remove", { name: b.name })}
                        className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-line text-muted transition-colors hover:border-neutral-900 hover:text-neutral-900"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {editing && (
        <BranchDialog
          initial={editing}
          onClose={() => setEditing(null)}
          onSave={(draft) => {
            if ("id" in editing) {
              updateBranch(editing.id, draft);
            } else if (!addBranch(draft)) {
              // The plan ran out between opening the form and saving it.
              setPlanOpen(true);
              return;
            }
            setEditing(null);
          }}
        />
      )}

      {planOpen && <PlanDialog onClose={() => setPlanOpen(false)} />}
    </div>
  );
}

/** Branch logo, falling back to the storefront glyph. */
function BranchMark({
  branch,
  size,
}: {
  branch: Branch | Omit<Branch, "id">;
  size: number;
}) {
  if (branch.logo) {
    return (
      <Image
        src={branch.logo}
        alt=""
        width={size}
        height={size}
        unoptimized
        style={{ width: size, height: size }}
        className="shrink-0 rounded-2xl object-cover ring-1 ring-black/[0.06]"
      />
    );
  }
  return (
    <span
      style={{ width: size, height: size }}
      className="grid shrink-0 place-items-center rounded-2xl bg-neutral-100 text-neutral-700"
    >
      <BranchIcon className="h-1/2 w-1/2" />
    </span>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="mt-0.5 truncate text-base font-bold tracking-tight tabular-nums">
        {value}
      </dd>
    </div>
  );
}

function Tile({
  label,
  value,
  small,
}: {
  label: string;
  value: string;
  small?: boolean;
}) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] ring-1 ring-black/[0.04]">
      <p className="text-sm text-neutral-500">{label}</p>
      <p
        className={`mt-1 truncate font-bold tracking-tight ${
          small ? "text-lg" : "text-2xl tabular-nums"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function BranchDialog({
  initial,
  onSave,
  onClose,
}: {
  initial: Branch | Omit<Branch, "id">;
  onSave: (b: Omit<Branch, "id">) => void;
  onClose: () => void;
}) {
  const isEdit = "id" in initial;
  const [name, setName] = useState(initial.name);
  const [address, setAddress] = useState(initial.address ?? "");
  const [phone, setPhone] = useState(initial.phone ?? "");
  const [mapUrl, setMapUrl] = useState(initial.mapUrl ?? "");
  const [logo, setLogo] = useState(initial.logo);
  const [uploadError, setUploadError] = useState<TranslationKey | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const { t } = useI18n();

  const pickLogo = async (file?: File) => {
    if (!file) return;
    try {
      setLogo(await readLogo(file));
      setUploadError(null);
    } catch (e) {
      setUploadError(
        (e instanceof Error
          ? e.message
          : "error.imageFailed") as TranslationKey,
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-neutral-950/40 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div className="relative w-full max-w-sm overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-black/10">
        <div className="flex items-center justify-between border-b border-line px-6 py-5">
          <h2 className="text-lg font-semibold tracking-tight">
            {isEdit ? t("branches.editTitle") : t("branches.register")}
          </h2>
          <button
            onClick={onClose}
            aria-label={t("common.close")}
            className="grid h-9 w-9 place-items-center rounded-xl text-muted transition-colors hover:bg-neutral-100 hover:text-neutral-900"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 px-6 py-5">
          <div>
            <span className="mb-2 block text-xs font-medium uppercase tracking-wider text-muted">
              {t("branches.logo")}
            </span>
            <div className="flex items-center gap-4">
              <BranchMark branch={{ ...initial, logo }} size={64} />
              <div className="min-w-0 flex-1">
                <div className="flex gap-2">
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-line text-sm font-medium transition-colors hover:border-neutral-900"
                  >
                    <ImageIcon className="h-[18px] w-[18px]" />
                    {logo ? t("tenders.replace") : t("tenders.upload")}
                  </button>
                  {logo && (
                    <button
                      onClick={() => setLogo(undefined)}
                      className="h-11 rounded-xl border border-line px-4 text-sm font-medium text-muted transition-colors hover:text-neutral-900"
                    >
                      {t("common.delete")}
                    </button>
                  )}
                </div>
                <p className="mt-1.5 text-xs text-muted">
                  {t("branches.logoHint")}
                </p>
              </div>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => pickLogo(e.target.files?.[0])}
            />
            {uploadError && (
              <p className="mt-2 text-sm text-red-600">{t(uploadError)}</p>
            )}
          </div>

          <Field label={t("register.branchName")}>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("branches.namePlaceholder")}
              className={inputClass}
            />
          </Field>
          <Field label={t("register.address")}>
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="St. 271, Phnom Penh"
              className={inputClass}
            />
          </Field>
          <Field label={t("register.phone")}>
            <input
              inputMode="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="012 345 678"
              className={`${inputClass} tabular-nums`}
            />
          </Field>
          <Field label={t("branches.mapUrl")}>
            <input
              value={mapUrl}
              onChange={(e) => setMapUrl(e.target.value)}
              placeholder="https://maps.app.goo.gl/… or 11.5564, 104.9282"
              className={inputClass}
            />
            <p className="mt-1.5 text-xs text-muted">{t("branches.mapHint")}</p>
          </Field>
        </div>

        <div className="flex gap-3 border-t border-line px-6 py-5">
          <button
            onClick={onClose}
            className="h-12 flex-1 rounded-xl border border-line text-sm font-medium transition-colors hover:bg-surface"
          >
            {t("common.cancel")}
          </button>
          <button
            disabled={name.trim() === ""}
            onClick={() =>
              onSave({
                name: name.trim(),
                address: address.trim(),
                phone: phone.trim(),
                mapUrl: normalizeMapUrl(mapUrl),
                logo,
              })
            }
            className="h-12 flex-[1.4] rounded-xl bg-neutral-900 text-sm font-semibold text-white transition-opacity hover:opacity-85 disabled:bg-neutral-200 disabled:text-neutral-400"
          >
            {isEdit ? t("common.saveChanges") : t("branches.add")}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted">
        {label}
      </span>
      {children}
    </label>
  );
}
