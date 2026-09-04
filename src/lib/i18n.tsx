"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
} from "react";
import { en } from "./locales/en";
import { km } from "./locales/km";

export const LANGUAGES = [
  { id: "en", label: "English", native: "English" },
  { id: "km", label: "Khmer", native: "ភាសាខ្មែរ" },
] as const;

export type Lang = (typeof LANGUAGES)[number]["id"];

/** The English dictionary is the source of truth; `km` must match it key for key. */
export type TranslationKey = keyof typeof en;
export type Dictionary = Record<TranslationKey, string>;

const DICTIONARIES: Record<Lang, Dictionary> = { en, km };

const LANG_KEY = "pos.lang";

/** Replaces `{name}` style placeholders. */
type Vars = Record<string, string | number>;

export type Translate = (key: TranslationKey, vars?: Vars) => string;

type I18n = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: Translate;
  /** BCP-47 tag for Intl / `toLocaleString`. */
  locale: string;
};

const LOCALES: Record<Lang, string> = { en: "en-US", km: "km-KH" };

const I18nContext = createContext<I18n | null>(null);

function interpolate(template: string, vars?: Vars) {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, name) =>
    name in vars ? String(vars[name]) : match
  );
}

function readLang(): Lang {
  try {
    const stored = localStorage.getItem(LANG_KEY);
    return stored === "km" ? "km" : "en";
  } catch {
    return "en";
  }
}

// Server render and the hydration pass both report `false`, so the markup matches;
// the first client commit flips it to `true` and the stored choice takes over.
const subscribeNoop = () => () => {};

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const ready = useSyncExternalStore(subscribeNoop, () => true, () => false);
  const [stored, setLangState] = useState<Lang>(() =>
    typeof window === "undefined" ? "en" : readLang()
  );
  const lang = ready ? stored : "en";

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    try {
      localStorage.setItem(LANG_KEY, next);
    } catch {
      /* storage disabled */
    }
  }, []);

  const t = useCallback<Translate>(
    (key, vars) => interpolate(DICTIONARIES[lang][key] ?? en[key] ?? key, vars),
    [lang]
  );

  return (
    <I18nContext.Provider value={{ lang, setLang, t, locale: LOCALES[lang] }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside I18nProvider");
  return ctx;
}

/** Shorthand for the common case: `const t = useT();` */
export function useT() {
  return useI18n().t;
}
