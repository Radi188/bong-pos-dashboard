"use client";

import Link from "next/link";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { useI18n } from "@/lib/i18n";
import {
  planById,
  type LabelAction,
  type ReceiptAction,
  type ShiftReportMode,
} from "@/lib/types";
import type { TranslationKey } from "@/lib/i18n";
import PageHeader from "@/components/PageHeader";
import PrinterDialog from "@/components/PrinterDialog";
import PlanDialog, { branchAllowance } from "@/components/PlanDialog";
import {
  BoltIcon,
  BoxIcon,
  BranchIcon,
  CardIcon,
  CloseIcon,
  ExchangeIcon,
  EyeIcon,
  HandIcon,
  ImageIcon,
  ReceiptIcon,
  TagIcon,
} from "@/components/icons";
import {
  ChoiceGrid,
  Divider,
  SettingRow,
  SettingsCard,
  StatusPill,
  Toggle,
} from "@/components/settings-ui";

export default function SettingsPage() {
  const {
    settings,
    updateSettings,
    branch,
    paymentMethods,
    plan,
    branches,
    branchLimit,
  } = useStore();
  const { t } = useI18n();
  const [dialog, setDialog] = useState<"receipt" | "label" | null>(null);
  const [planOpen, setPlanOpen] = useState(false);

  const { receiptPrinter: rp, labelPrinter: lp } = settings;

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title={t("nav.settings")}
        subtitle={t("settings.subtitle", { branch: branch.name })}
      />

      <div className="flex-1 overflow-y-auto bg-surface p-6">
        <div className="mx-auto max-w-3xl space-y-5">
          <SettingsCard title={t("plan.title")} description={t("plan.blurb")}>
            <Divider />
            <SettingRow
              Icon={BranchIcon}
              title={t(`plan.${plan}` as TranslationKey)}
              subtitle={
                branchLimit === null
                  ? t("plan.usageUnlimited", { used: branches.length })
                  : t("plan.usage", {
                      used: branches.length,
                      limit: branchLimit,
                    })
              }
              onClick={() => setPlanOpen(true)}
            >
              <span className="shrink-0 rounded-xl border border-line px-4 py-2.5 text-sm font-medium">
                {branchAllowance(planById(plan), t)}
              </span>
            </SettingRow>
          </SettingsCard>

          <SettingsCard
            title={t("settings.receipt")}
            description={t("settings.receiptDesc")}
          >
            <ChoiceGrid<ReceiptAction>
              value={settings.receiptAction}
              onChange={(v) => updateSettings({ receiptAction: v })}
              options={[
                {
                  id: "preview",
                  label: t("settings.showPreview"),
                  description: t("settings.showPreviewDesc"),
                  Icon: EyeIcon,
                },
                {
                  id: "direct",
                  label: t("settings.printDirect"),
                  description: t("settings.printDirectDesc"),
                  Icon: BoltIcon,
                },
              ]}
            />

            <div className="mt-5">
              <Divider />
              <SettingRow
                Icon={ImageIcon}
                title={t("settings.printLogo")}
                subtitle={t("settings.printLogoDesc")}
              >
                <Toggle
                  checked={settings.printLogo}
                  onChange={(v) => updateSettings({ printLogo: v })}
                  label={t("settings.printLogo")}
                />
              </SettingRow>
            </div>
          </SettingsCard>

          <SettingsCard
            title={t("settings.labels")}
            description={t("settings.labelsDesc")}
          >
            <ChoiceGrid<LabelAction>
              value={settings.labelAction}
              onChange={(v) => updateSettings({ labelAction: v })}
              options={[
                {
                  id: "off",
                  label: t("settings.labelOff"),
                  description: t("settings.labelOffDesc"),
                  Icon: CloseIcon,
                },
                {
                  id: "direct",
                  label: t("settings.printDirect"),
                  description: t("settings.labelDirectDesc"),
                  Icon: BoltIcon,
                },
              ]}
            />

            {/* Size and per-item live on the label printer, but belong in reach
                of the switch that decides whether labels print at all. */}
            {settings.labelAction !== "off" && (
              <div className="mt-5">
                <Divider />
                <SettingRow
                  Icon={TagIcon}
                  title={t("settings.labelSize")}
                  subtitle={
                    lp.connected
                      ? `${lp.size.width} × ${lp.size.height} mm · ${
                          lp.name || t("settings.unnamedPrinter")
                        }`
                      : t("settings.labelNoPrinter")
                  }
                  onClick={() => setDialog("label")}
                >
                  <span className="shrink-0 rounded-xl border border-line px-4 py-2.5 text-sm font-medium">
                    {t("settings.change")}
                  </span>
                </SettingRow>
                <Divider />
                <SettingRow
                  Icon={BoxIcon}
                  title={t("printer.perItem")}
                  subtitle={t("printer.perItemBlurb")}
                >
                  <Toggle
                    checked={lp.perItem}
                    onChange={(v) =>
                      updateSettings({ labelPrinter: { ...lp, perItem: v } })
                    }
                    label={t("printer.perItem")}
                  />
                </SettingRow>
              </div>
            )}
          </SettingsCard>

          <SettingsCard
            title={t("settings.shiftReport")}
            description={t("settings.shiftReportDesc")}
          >
            <ChoiceGrid<ShiftReportMode>
              value={settings.shiftReport}
              onChange={(v) => updateSettings({ shiftReport: v })}
              options={[
                {
                  id: "auto",
                  label: t("settings.autoPrint"),
                  description: t("settings.autoPrintDesc"),
                  Icon: BoltIcon,
                },
                {
                  id: "manual",
                  label: t("settings.manual"),
                  description: t("settings.manualDesc"),
                  Icon: HandIcon,
                },
              ]}
            />
          </SettingsCard>

          <SettingsCard
            title={t("settings.printers")}
            description={t("settings.printersDesc")}
          >
            <Divider />
            <SettingRow
              Icon={ReceiptIcon}
              title={t("printer.receipt")}
              subtitle={
                rp.connected
                  ? [
                      rp.name || t("settings.unnamedPrinter"),
                      `${rp.paperWidth} mm`,
                      t("settings.copies", { count: rp.copies }),
                    ].join(" · ")
                  : t("settings.notConnected")
              }
              onClick={() => setDialog("receipt")}
            >
              <StatusPill
                on={rp.connected}
                label={rp.connected ? t("settings.on") : t("settings.off")}
              />
            </SettingRow>
            <Divider />
            <SettingRow
              Icon={TagIcon}
              title={t("printer.label")}
              subtitle={
                lp.connected
                  ? `${lp.name || t("settings.unnamedPrinter")} · ${lp.size.width} × ${lp.size.height} mm`
                  : t("settings.notConnected")
              }
              onClick={() => setDialog("label")}
            >
              <StatusPill
                on={lp.connected}
                label={lp.connected ? t("settings.on") : t("settings.off")}
              />
            </SettingRow>
          </SettingsCard>

          <SettingsCard
            title={t("settings.currency")}
            description={t("settings.currencyDesc")}
          >
            <Divider />
            <SettingRow
              Icon={ExchangeIcon}
              title={t("settings.exchangeRate")}
              subtitle={`$1.00 = ${new Intl.NumberFormat("en-US").format(
                settings.khrRate,
              )} ៛ · $5.00 = ${new Intl.NumberFormat("en-US").format(settings.khrRate * 5)} ៛`}
            >
              <div className="flex shrink-0 items-center gap-2">
                <span className="text-sm text-muted">
                  {t("settings.oneUsd")}
                </span>
                <input
                  inputMode="numeric"
                  value={settings.khrRate || ""}
                  onChange={(e) =>
                    updateSettings({
                      khrRate: Number(
                        e.target.value.replace(/[^0-9]/g, "") || 0,
                      ),
                    })
                  }
                  className="h-11 w-28 rounded-xl border border-line px-3 text-right text-[15px] tabular-nums outline-none transition-colors focus:border-neutral-900"
                />
                <span className="text-sm text-muted">៛</span>
              </div>
            </SettingRow>
            {settings.khrRate <= 0 && (
              <p className="pb-1 text-sm text-red-600">
                {t("settings.rateError")}
              </p>
            )}
          </SettingsCard>

          <SettingsCard
            title={t("nav.paymentMethods")}
            description={t("settings.tendersDesc")}
          >
            <Divider />
            <SettingRow
              Icon={CardIcon}
              title={t("settings.enabledTenders")}
              subtitle={
                paymentMethods
                  .filter((m) => m.enabled)
                  .map((m) => m.label)
                  .join(", ") || t("settings.noneEnabled")
              }
            >
              <Link
                href="/payment-methods"
                className="shrink-0 rounded-xl border border-line px-4 py-2.5 text-sm font-medium transition-colors hover:border-neutral-900"
              >
                {t("settings.manage")}
              </Link>
            </SettingRow>
          </SettingsCard>
        </div>
      </div>

      {dialog && (
        <PrinterDialog kind={dialog} onClose={() => setDialog(null)} />
      )}
      {planOpen && <PlanDialog onClose={() => setPlanOpen(false)} />}
    </div>
  );
}
