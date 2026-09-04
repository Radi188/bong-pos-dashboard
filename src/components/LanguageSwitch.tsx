"use client";

import { LANGUAGES, useI18n } from "@/lib/i18n";

/** Two-up language toggle in the sidebar footer. */
export default function LanguageSwitch() {
  const { lang, setLang, t } = useI18n();

  return (
    <div className="mt-3">
      <p className="px-1 pb-1.5 text-[11px] font-medium uppercase tracking-wide text-neutral-500">
        {t("sidebar.language")}
      </p>
      <div className="grid grid-cols-2 gap-1 rounded-xl bg-white/10 p-1">
        {LANGUAGES.map((l) => (
          <button
            key={l.id}
            onClick={() => setLang(l.id)}
            aria-pressed={lang === l.id}
            className={[
              "h-9 truncate rounded-lg px-2 text-sm font-medium transition-colors",
              lang === l.id ? "bg-white text-neutral-950" : "text-neutral-300 hover:bg-white/10",
            ].join(" ")}
          >
            {l.native}
          </button>
        ))}
      </div>
    </div>
  );
}
