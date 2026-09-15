"use client";

import { showsOnDigitalMenu, useStore } from "@/lib/store";
import { MENU_TEMPLATES, type MenuTemplate } from "@/lib/types";
import { useI18n } from "@/lib/i18n";
import PageHeader from "@/components/PageHeader";
import DigitalMenuPreview, {
  templateKey,
} from "@/components/DigitalMenuPreview";

export default function DigitalMenuPage() {
  const { products, settings, updateSettings } = useStore();
  const { t } = useI18n();

  // The template is store config, not a view toggle — it persists with settings.
  const template = settings.menuTemplate;
  const setTemplate = (menuTemplate: MenuTemplate) =>
    updateSettings({ menuTemplate });

  const shown = products.filter(showsOnDigitalMenu).length;
  const hidden = products.length - shown;

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title={t("nav.digitalMenu")}
        subtitle={t("digitalMenu.subtitle", { shown, hidden })}
      />

      <div className="flex-1 overflow-y-auto bg-surface p-6">
        <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-white p-3 ring-1 ring-black/[0.04]">
          <span className="pl-2 text-xs font-medium uppercase tracking-wider text-muted">
            {t("menu.template")}
          </span>
          <div className="flex flex-wrap gap-1 rounded-xl bg-neutral-100 p-1">
            {MENU_TEMPLATES.map((id) => (
              <button
                key={id}
                onClick={() => setTemplate(id)}
                aria-pressed={template === id}
                className={[
                  "h-9 rounded-lg px-4 text-sm font-medium transition-colors",
                  template === id
                    ? "bg-white text-neutral-900 shadow-sm"
                    : "text-neutral-500 hover:text-neutral-900",
                ].join(" ")}
              >
                {t(templateKey(id))}
              </button>
            ))}
          </div>
          <p className="ml-auto pr-2 text-xs text-muted">
            {t("menu.previewNote")}
          </p>
        </div>

        <div className="mt-4">
          <DigitalMenuPreview template={template} />
        </div>
      </div>
    </div>
  );
}
