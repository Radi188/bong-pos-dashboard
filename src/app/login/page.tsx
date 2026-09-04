"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useI18n, type TranslationKey } from "@/lib/i18n";
import AuthLayout from "@/components/AuthLayout";
import { EyeIcon } from "@/components/icons";

export default function LoginPage() {
  const { signIn } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const { t } = useI18n();
  const [error, setError] = useState<TranslationKey | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = signIn(email, password);
    if (result.ok) router.replace("/");
    else setError(result.error ?? "error.signInFailed");
  };

  return (
    <AuthLayout
      headline={t("login.headline")}
      blurb={t("login.blurb")}
    >
      <Image
        src="/logo-mark.png"
        alt="Bong POS"
        width={52}
        height={52}
        priority
        className="h-13 w-13 lg:hidden"
      />

      <h1 className="mt-6 text-3xl font-semibold tracking-tight lg:mt-0">{t("login.welcome")}</h1>
      <p className="mt-2 text-[15px] text-muted">{t("login.subtitle")}</p>

      <form onSubmit={submit} className="mt-8 space-y-4">
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted">
            {t("common.email")}
          </span>
          <input
            type="email"
            autoFocus
            autoComplete="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError(null);
            }}
            placeholder={t("login.emailPlaceholder")}
            className="h-12 w-full rounded-xl border border-line px-4 text-[15px] outline-none transition-colors focus:border-neutral-900"
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted">
            {t("common.password")}
          </span>
          <div className="relative">
            <input
              type={show ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(null);
              }}
              placeholder="••••••••"
              className="h-12 w-full rounded-xl border border-line px-4 pr-12 text-[15px] outline-none transition-colors focus:border-neutral-900"
            />
            <button
              type="button"
              onClick={() => setShow((v) => !v)}
              aria-label={show ? t("login.hidePassword") : t("login.showPassword")}
              className={`absolute right-3 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg transition-colors hover:bg-neutral-100 ${
                show ? "text-neutral-900" : "text-muted"
              }`}
            >
              <EyeIcon className="h-[18px] w-[18px]" />
            </button>
          </div>
        </label>

        {error && (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {t(error)}
          </p>
        )}

        <button
          type="submit"
          disabled={!email || !password}
          className="h-12 w-full rounded-xl bg-neutral-900 text-[15px] font-semibold text-white transition-opacity hover:opacity-85 disabled:bg-neutral-200 disabled:text-neutral-400"
        >
          {t("login.submit")}
        </button>
      </form>

      <div className="mt-6 rounded-xl bg-surface px-4 py-3.5">
        <p className="text-xs font-medium uppercase tracking-wider text-muted">{t("login.demoAccount")}</p>
        <p className="mt-1.5 font-mono text-[13px]">admin@bongpos.com · bongpos123</p>
        <button
          onClick={() => {
            setEmail("admin@bongpos.com");
            setPassword("bongpos123");
            setError(null);
          }}
          className="mt-2 text-xs font-medium underline underline-offset-2 hover:text-neutral-900"
        >
          {t("login.fillDemo")}
        </button>
      </div>

      <p className="mt-8 text-center text-sm text-muted">
        {t("login.newHere")}{" "}
        <Link href="/register" className="font-medium text-neutral-900 underline underline-offset-2">
          {t("login.registerLink")}
        </Link>
      </p>
    </AuthLayout>
  );
}
