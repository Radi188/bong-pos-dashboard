"use client";

import { useI18n } from "@/lib/i18n";
import PageHeader from "./PageHeader";

export default function EmptySection({
  title,
  subtitle,
  message,
}: {
  title: string;
  subtitle: string;
  message: string;
}) {
  const { t } = useI18n();

  return (
    <div className="flex h-full flex-col">
      <PageHeader title={title} subtitle={subtitle} />
      <div className="grid flex-1 place-items-center bg-surface px-6 text-center">
        <div className="max-w-sm">
          <div className="mx-auto h-14 w-14 rounded-2xl border border-dashed border-neutral-300" />
          <p className="mt-5 text-[15px] font-medium">{t("common.nothingHere")}</p>
          <p className="mt-1.5 text-sm leading-relaxed text-muted">{message}</p>
        </div>
      </div>
    </div>
  );
}
