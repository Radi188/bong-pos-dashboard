"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useI18n, type TranslationKey } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import AuthLayout from "@/components/AuthLayout";
import { CheckIcon, EyeIcon } from "@/components/icons";

const inputClass =
  "h-12 w-full rounded-xl border border-line px-4 text-[15px] outline-none transition-colors focus:border-neutral-900";

export default function RegisterPage() {
  const { signUp } = useAuth();
  const { setStoreName, addBranch, setBranch } = useStore();
  const router = useRouter();

  const [step, setStep] = useState<1 | 2>(1);
  const { t } = useI18n();
  const [error, setError] = useState<TranslationKey | null>(null);
  const [show, setShow] = useState(false);

  // Step 1 — store and owner account
  const [storeName, setStoreNameInput] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Step 2 — first branch
  const [branchName, setBranchName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");

  const stepOneValid =
    storeName.trim() !== "" &&
    ownerName.trim() !== "" &&
    /\S+@\S+\.\S+/.test(email) &&
    password.length >= 6;

  const stepTwoValid = branchName.trim() !== "";

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = signUp({ storeName, ownerName, email, password });
    if (!result.ok) {
      setError(result.error ?? "error.registerFailed");
      setStep(1);
      return;
    }
    setStoreName(storeName.trim());
    const created = addBranch({
      name: branchName.trim(),
      address: address.trim(),
      phone: phone.trim(),
    });
    setBranch(created.id);
    router.replace("/");
  };

  return (
    <AuthLayout
      headline={t("register.headline")}
      blurb={t("register.blurb")}
    >
      <div className="flex items-center gap-3">
        <Step n={1} current={step} label={t("register.stepStore")} />
        <span className="h-px flex-1 bg-line" />
        <Step n={2} current={step} label={t("register.stepBranch")} />
      </div>

      <h1 className="mt-7 text-3xl font-semibold tracking-tight">
        {step === 1 ? t("register.titleStore") : t("register.titleBranch")}
      </h1>
      <p className="mt-2 text-[15px] text-muted">
        {step === 1 ? t("register.subtitleStore") : t("register.subtitleBranch")}
      </p>

      <form onSubmit={submit} className="mt-8 space-y-4">
        {step === 1 ? (
          <>
            <Field label={t("register.storeName")}>
              <input
                autoFocus
                value={storeName}
                onChange={(e) => setStoreNameInput(e.target.value)}
                placeholder="Ambel Cafe"
                className={inputClass}
              />
            </Field>
            <Field label={t("register.yourName")}>
              <input
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                placeholder="Rady"
                className={inputClass}
              />
            </Field>
            <Field label={t("common.email")}>
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError(null);
                }}
                placeholder={t("login.emailPlaceholder")}
                className={inputClass}
              />
            </Field>
            <Field label={t("common.password")}>
              <div className="relative">
                <input
                  type={show ? "text" : "password"}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t("register.passwordHint")}
                  className={`${inputClass} pr-12`}
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
            </Field>

            {error && (
              <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {t(error)}
              </p>
            )}

            <button
              type="button"
              disabled={!stepOneValid}
              onClick={() => setStep(2)}
              className="h-12 w-full rounded-xl bg-neutral-900 text-[15px] font-semibold text-white transition-opacity hover:opacity-85 disabled:bg-neutral-200 disabled:text-neutral-400"
            >
              {t("register.continue")}
            </button>
          </>
        ) : (
          <>
            <Field label={t("register.branchName")}>
              <input
                autoFocus
                value={branchName}
                onChange={(e) => setBranchName(e.target.value)}
                placeholder="Penghout Branch"
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

            {error && (
              <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {t(error)}
              </p>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="h-12 flex-1 rounded-xl border border-line text-[15px] font-medium transition-colors hover:bg-surface"
              >
                {t("common.back")}
              </button>
              <button
                type="submit"
                disabled={!stepTwoValid}
                className="h-12 flex-[1.6] rounded-xl bg-neutral-900 text-[15px] font-semibold text-white transition-opacity hover:opacity-85 disabled:bg-neutral-200 disabled:text-neutral-400"
              >
                {t("register.create")}
              </button>
            </div>
          </>
        )}
      </form>

      <p className="mt-8 text-center text-sm text-muted">
        {t("register.haveAccount")}{" "}
        <Link href="/login" className="font-medium text-neutral-900 underline underline-offset-2">
          {t("register.signInLink")}
        </Link>
      </p>
    </AuthLayout>
  );
}

function Step({ n, current, label }: { n: 1 | 2; current: 1 | 2; label: string }) {
  const done = current > n;
  const active = current === n;
  return (
    <span className="flex items-center gap-2.5">
      <span
        className={[
          "grid h-8 w-8 place-items-center rounded-full text-xs font-semibold transition-colors",
          done || active ? "bg-neutral-900 text-white" : "bg-neutral-100 text-neutral-500",
        ].join(" ")}
      >
        {done ? <CheckIcon className="h-4 w-4" /> : n}
      </span>
      <span className={`text-sm font-medium ${active ? "" : "text-muted"}`}>{label}</span>
    </span>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted">
        {label}
      </span>
      {children}
    </label>
  );
}
