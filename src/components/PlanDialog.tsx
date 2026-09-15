"use client";

import { PLANS, planById, type Plan, type PlanId } from "@/lib/types";
import { useStore } from "@/lib/store";
import { useI18n, type TranslationKey } from "@/lib/i18n";
import { currency } from "@/lib/format";
import { CheckIcon, CloseIcon } from "./icons";

const planKey = (id: PlanId) => `plan.${id}` as TranslationKey;

/** "1 branch" / "Up to 3 branches" / "Unlimited branches". */
export function branchAllowance(
  plan: Plan,
  t: (k: TranslationKey, v?: Record<string, string | number>) => string,
) {
  if (plan.branches === null) return t("plan.branchesUnlimited");
  if (plan.branches === 1) return t("plan.branchesOne");
  return t("plan.branchesMany", { count: plan.branches });
}

/**
 * Picks the shop's plan. No money moves here — choosing a plan only raises the
 * branch allowance, ready for a real processor to sit in front of it later.
 */
export default function PlanDialog({ onClose }: { onClose: () => void }) {
  const { plan, setPlan, branches } = useStore();
  const { t } = useI18n();
  const current = planById(plan);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-neutral-950/40 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div className="relative flex max-h-[85dvh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-black/10">
        <div className="flex items-start justify-between gap-4 border-b border-line px-6 py-5">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">
              {t("plan.title")}
            </h2>
            <p className="mt-0.5 text-sm text-muted">{t("plan.blurb")}</p>
          </div>
          <button
            onClick={onClose}
            aria-label={t("common.close")}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-muted transition-colors hover:bg-neutral-100 hover:text-neutral-900"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          <ul className="grid gap-4 sm:grid-cols-3">
            {PLANS.map((p) => {
              const active = p.id === plan;
              // Downgrading below what the shop already runs would strand branches.
              const tooSmall =
                p.branches !== null && branches.length > p.branches;
              return (
                <li key={p.id}>
                  <div
                    className={[
                      "flex h-full flex-col rounded-2xl border p-5 transition-colors",
                      active
                        ? "border-neutral-900 bg-neutral-900 text-white"
                        : "border-line",
                    ].join(" ")}
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="text-base font-bold tracking-tight">
                        {t(planKey(p.id))}
                      </p>
                      {active && (
                        <span className="shrink-0 rounded-md bg-white/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide">
                          {t("plan.currentBadge")}
                        </span>
                      )}
                    </div>

                    <p className="mt-3 text-2xl font-bold tracking-tight tabular-nums">
                      {p.price === 0 ? t("plan.free") : currency(p.price)}
                      {p.price > 0 && (
                        <span
                          className={`ml-1 text-xs font-medium ${active ? "text-neutral-400" : "text-muted"}`}
                        >
                          {t("plan.perMonth")}
                        </span>
                      )}
                    </p>

                    <p
                      className={`mt-2 flex items-center gap-1.5 text-sm ${active ? "text-neutral-300" : "text-neutral-600"}`}
                    >
                      <CheckIcon className="h-4 w-4 shrink-0" />
                      {branchAllowance(p, t)}
                    </p>

                    <button
                      onClick={() => {
                        setPlan(p.id);
                        onClose();
                      }}
                      disabled={active || tooSmall}
                      title={
                        tooSmall
                          ? t("plan.usage", {
                              used: branches.length,
                              limit: p.branches ?? 0,
                            })
                          : undefined
                      }
                      className={[
                        "mt-5 h-11 w-full rounded-xl text-sm font-semibold transition-opacity hover:opacity-85",
                        active
                          ? "bg-white/15 text-white"
                          : "bg-neutral-900 text-white disabled:bg-neutral-200 disabled:text-neutral-400",
                      ].join(" ")}
                    >
                      {active ? t("plan.currentBadge") : t("plan.choose")}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>

          <p className="mt-4 text-center text-xs text-muted">
            {t("plan.noCharge")}
          </p>
        </div>

        <div className="border-t border-line px-6 py-4 text-sm text-muted">
          {t("plan.current")}:{" "}
          <strong className="text-neutral-900">{t(planKey(current.id))}</strong>{" "}
          · {branchAllowance(current, t)}
        </div>
      </div>
    </div>
  );
}
