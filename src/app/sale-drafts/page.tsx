"use client";

import { useI18n } from "@/lib/i18n";
import EmptySection from "@/components/EmptySection";

export default function Page() {
  const { t } = useI18n();

  return (
    <EmptySection
      title={t("nav.saleDrafts")}
      subtitle={t("drafts.subtitle")}
      message={t("drafts.message")}
    />
  );
}
