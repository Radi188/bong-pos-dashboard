"use client";

import Image from "next/image";
import { LANGUAGES, useI18n } from "@/lib/i18n";

/** Split screen used by sign-in and sign-up: dark brand panel + form. */
export default function AuthLayout({
  children,
  headline,
  blurb,
}: {
  children: React.ReactNode;
  headline: string;
  blurb: string;
}) {
  const { lang, setLang, t } = useI18n();

  return (
    <div className="flex h-dvh overflow-hidden bg-white">
      <aside className="relative hidden w-[46%] shrink-0 flex-col justify-between bg-neutral-950 p-12 text-white lg:flex">
        <Image src="/logo-mark.png" alt="Bong POS" width={56} height={56} priority className="h-14 w-14" />

        <div className="max-w-md">
          <h2 className="text-4xl font-semibold leading-[1.1] tracking-tight">{headline}</h2>
          <p className="mt-5 text-[15px] leading-relaxed text-neutral-400">{blurb}</p>
        </div>

        <dl className="grid grid-cols-3 gap-6 border-t border-white/10 pt-8">
          {(
            [
              ["auth.brandOffline", "auth.brandOfflineSub"],
              ["auth.brandCurrency", "auth.brandCurrencySub"],
              ["auth.brandMulti", "auth.brandMultiSub"],
            ] as const
          ).map(([a, b]) => (
            <div key={a}>
              <dt className="text-lg font-semibold tracking-tight">{t(a)}</dt>
              <dd className="text-sm text-neutral-500">{t(b)}</dd>
            </div>
          ))}
        </dl>
      </aside>

      <main className="relative flex flex-1 items-center justify-center overflow-y-auto px-6 py-10">
        {/* No sidebar on the public routes, so the switcher lives here. */}
        <div className="absolute right-5 top-5 flex gap-1 rounded-full border border-line p-1">
          {LANGUAGES.map((l) => (
            <button
              key={l.id}
              onClick={() => setLang(l.id)}
              aria-pressed={lang === l.id}
              className={[
                "h-8 rounded-full px-3 text-xs font-medium transition-colors",
                lang === l.id ? "bg-neutral-900 text-white" : "text-muted hover:text-neutral-900",
              ].join(" ")}
            >
              {l.native}
            </button>
          ))}
        </div>
        <div className="w-full max-w-[400px]">{children}</div>
      </main>
    </div>
  );
}
