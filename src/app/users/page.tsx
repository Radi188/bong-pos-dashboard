"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useStore } from "@/lib/store";
import { useI18n, type TranslationKey } from "@/lib/i18n";
import { pathKey, roleBlurbKey, roleKey } from "@/lib/labels";
import { PERMISSIONS, ROLES, lockedFor, type Role, type User } from "@/lib/types";
import PageHeader from "@/components/PageHeader";
import { CheckIcon, CloseIcon, PlusIcon, TrashIcon, UsersIcon } from "@/components/icons";
import { Toggle } from "@/components/settings-ui";

const inputClass =
  "h-12 w-full rounded-xl border border-line px-4 text-[15px] outline-none transition-colors focus:border-neutral-900";

const blank = (): Omit<User, "id"> => ({
  name: "",
  email: "",
  password: "",
  role: "cashier",
  branchId: undefined,
  active: true,
});

export default function UsersPage() {
  const { users, user: me, createUser, updateUser, deleteUser } = useAuth();
  const { branches, rolePermissions, setRolePermissions } = useStore();
  const [editing, setEditing] = useState<User | Omit<User, "id"> | null>(null);
  const { t } = useI18n();
  const [error, setError] = useState<TranslationKey | null>(null);
  const [roleEditing, setRoleEditing] = useState<Role | null>(null);

  const branchName = (id?: string) =>
    id ? branches.find((b) => b.id === id)?.name ?? "—" : t("users.allBranches");

  const count = (role: Role) => users.filter((u) => u.role === role).length;

  return (
    <div className="flex h-full flex-col">
      <PageHeader title={t("nav.users")} subtitle={t("users.subtitle", { count: users.length })}>
        <button
          onClick={() => {
            setError(null);
            setEditing(blank());
          }}
          className="flex h-12 items-center gap-2 rounded-2xl bg-neutral-900 px-5 text-sm font-semibold text-white transition-opacity hover:opacity-85"
        >
          <PlusIcon className="h-[18px] w-[18px]" />
          {t("users.add")}
        </button>
      </PageHeader>

      <div className="flex-1 overflow-y-auto bg-surface p-6">
        {/* Roles */}
        <div className="grid gap-4 lg:grid-cols-3">
          {ROLES.map((r) => (
            <section
              key={r.id}
              className="flex flex-col rounded-3xl bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)] ring-1 ring-black/[0.04]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="text-lg font-bold tracking-tight">{t(roleKey(r.id))}</h2>
                  <p className="mt-0.5 text-sm text-muted">{t(roleBlurbKey(r.id))}</p>
                </div>
                <span className="flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-neutral-100 px-3 text-sm font-semibold tabular-nums">
                  <UsersIcon className="h-4 w-4 text-neutral-500" />
                  {count(r.id)}
                </span>
              </div>

              <ul className="mt-4 flex-1 space-y-2">
                {(rolePermissions[r.id] ?? []).slice(0, 4).map((path) => (
                  <li key={path} className="flex items-start gap-2.5 text-sm text-neutral-600">
                    <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-neutral-900" />
                    {t(pathKey(path))}
                  </li>
                ))}
                {(rolePermissions[r.id] ?? []).length > 4 && (
                  <li className="pl-[26px] text-sm text-muted">
                    {t("users.moreScreens", { count: (rolePermissions[r.id] ?? []).length - 4 })}
                  </li>
                )}
              </ul>

              <button
                onClick={() => setRoleEditing(r.id)}
                className="mt-5 h-11 w-full rounded-xl border border-line text-sm font-semibold transition-colors hover:border-neutral-900"
              >
                {t("users.editPermissions")}
              </button>
            </section>
          ))}
        </div>

        {error && (
          <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {t(error)}
          </p>
        )}

        {/* People */}
        <div className="mt-4 rounded-3xl bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)] ring-1 ring-black/[0.04]">
          <h2 className="text-lg font-bold tracking-tight">{t("users.team")}</h2>
          <div className="-mx-2 mt-5 overflow-x-auto">
            <table className="w-full min-w-[720px] text-[15px]">
              <thead>
                <tr className="border-b border-line text-left text-sm text-muted">
                  <th className="px-2 pb-3 font-normal">{t("common.name")}</th>
                  <th className="px-2 pb-3 font-normal">{t("common.role")}</th>
                  <th className="px-2 pb-3 font-normal">{t("expenses.colBranch")}</th>
                  <th className="px-2 pb-3 font-normal">{t("common.status")}</th>
                  <th className="w-28 px-2 pb-3" />
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="group border-b border-line last:border-0">
                    <td className="px-2 py-4">
                      <div className="flex items-center gap-3">
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-neutral-100 text-sm font-semibold uppercase">
                          {u.name.charAt(0)}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate font-semibold tracking-tight">
                            {u.name}
                            {u.id === me?.id && (
                              <span className="ml-2 text-xs font-medium text-muted">{t("users.you")}</span>
                            )}
                          </span>
                          <span className="block truncate text-sm text-muted">{u.email}</span>
                        </span>
                      </div>
                    </td>
                    <td className="px-2 py-4">
                      <span
                        className={[
                          "rounded-lg px-2.5 py-1 text-sm font-medium",
                          u.role === "admin"
                            ? "bg-neutral-900 text-white"
                            : u.role === "manager"
                              ? "bg-neutral-100 text-neutral-800"
                              : "border border-line text-neutral-600",
                        ].join(" ")}
                      >
                        {t(roleKey(u.role))}
                      </span>
                    </td>
                    <td className="px-2 py-4 text-neutral-600">{branchName(u.branchId)}</td>
                    <td className="px-2 py-4">
                      <span
                        className={[
                          "flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-sm font-medium",
                          u.active
                            ? "bg-emerald-50 text-emerald-600"
                            : "bg-neutral-100 text-neutral-500",
                        ].join(" ")}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            u.active ? "bg-emerald-500" : "bg-neutral-400"
                          }`}
                        />
                        {u.active ? t("common.active") : t("users.disabled")}
                      </span>
                    </td>
                    <td className="px-2 py-4">
                      <div className="flex justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                        <button
                          onClick={() => {
                            setError(null);
                            setEditing(u);
                          }}
                          className="rounded-lg px-3 py-1.5 text-sm font-medium transition-colors hover:bg-neutral-100"
                        >
                          {t("common.edit")}
                        </button>
                        <button
                          onClick={() => {
                            const r = deleteUser(u.id);
                            if (!r.ok) setError(r.error ?? null);
                          }}
                          aria-label={t("users.remove", { name: u.name })}
                          className="grid h-8 w-8 place-items-center rounded-lg text-muted transition-colors hover:bg-neutral-100 hover:text-neutral-900"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {roleEditing && (
        <RoleDialog
          role={roleEditing}
          granted={rolePermissions[roleEditing] ?? []}
          onSave={(paths) => {
            setRolePermissions(roleEditing, paths);
            setRoleEditing(null);
          }}
          onClose={() => setRoleEditing(null)}
        />
      )}

      {editing && (
        <UserDialog
          initial={editing}
          branches={branches}
          onClose={() => setEditing(null)}
          onSave={(draft) => {
            const result =
              "id" in editing
                ? updateUser((editing as User).id, draft)
                : createUser(draft);
            if (result.ok) {
              setEditing(null);
              setError(null);
            } else setError(result.error ?? null);
            return result.ok;
          }}
        />
      )}
    </div>
  );
}

function RoleDialog({
  role,
  granted,
  onSave,
  onClose,
}: {
  role: Role;
  granted: string[];
  onSave: (paths: string[]) => void;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const [paths, setPaths] = useState<string[]>(granted);
  const locked = lockedFor(role);
  const roleName = t(roleKey(role));

  const toggle = (path: string) =>
    setPaths((prev) =>
      prev.includes(path) ? prev.filter((p) => p !== path) : [...prev, path]
    );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-neutral-950/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative flex max-h-[90dvh] w-full max-w-md flex-col overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-black/10">
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-line px-6 py-5">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">{t("users.permissionsTitle", { role: roleName })}</h2>
            <p className="mt-0.5 text-xs text-muted">
              {t("users.permissionsBlurb", { role: roleName })}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label={t("common.close")}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-muted transition-colors hover:bg-neutral-100 hover:text-neutral-900"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          <ul className="space-y-2">
            {PERMISSIONS.map(({ path }) => {
              const isLocked = locked.includes(path);
              const on = isLocked || paths.includes(path);
              return (
                <li key={path}>
                  <button
                    onClick={() => !isLocked && toggle(path)}
                    disabled={isLocked}
                    className={[
                      "flex w-full items-center gap-3.5 rounded-xl border px-4 py-3.5 text-left transition-colors",
                      on ? "border-neutral-900" : "border-line hover:border-neutral-300",
                      isLocked ? "cursor-default opacity-70" : "",
                    ].join(" ")}
                  >
                    <span
                      className={[
                        "grid h-5 w-5 shrink-0 place-items-center rounded-md border transition-colors",
                        on ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-300",
                      ].join(" ")}
                    >
                      {on && <CheckIcon className="h-3.5 w-3.5" />}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-[15px] font-medium">{t(pathKey(path))}</span>
                    {isLocked && (
                      <span className="shrink-0 rounded-md bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-500">
                        {t("users.alwaysOn")}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="flex shrink-0 gap-3 border-t border-line px-6 py-5">
          <button
            onClick={onClose}
            className="h-12 flex-1 rounded-xl border border-line text-sm font-medium transition-colors hover:bg-surface"
          >
            {t("common.cancel")}
          </button>
          <button
            onClick={() => onSave(paths)}
            className="h-12 flex-[1.4] rounded-xl bg-neutral-900 text-sm font-semibold text-white transition-opacity hover:opacity-85"
          >
            {t("users.savePermissions")}
          </button>
        </div>
      </div>
    </div>
  );
}

function UserDialog({
  initial,
  branches,
  onSave,
  onClose,
}: {
  initial: User | Omit<User, "id">;
  branches: { id: string; name: string }[];
  onSave: (u: Omit<User, "id">) => boolean;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const isEdit = "id" in initial;
  const [form, setForm] = useState<Omit<User, "id">>({
    name: initial.name,
    email: initial.email,
    password: initial.password,
    role: initial.role,
    branchId: initial.branchId,
    active: initial.active,
  });

  const valid =
    form.name.trim() !== "" && /\S+@\S+\.\S+/.test(form.email) && form.password.length >= 6;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-neutral-950/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-3xl bg-white shadow-2xl ring-1 ring-black/10">
        <div className="sticky top-0 flex items-center justify-between border-b border-line bg-white px-6 py-5">
          <h2 className="text-lg font-semibold tracking-tight">
            {isEdit ? t("users.editTitle") : t("users.add")}
          </h2>
          <button
            onClick={onClose}
            aria-label={t("common.close")}
            className="grid h-9 w-9 place-items-center rounded-xl text-muted transition-colors hover:bg-neutral-100 hover:text-neutral-900"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-5 px-6 py-5">
          <Field label={t("users.fullName")}>
            <input
              autoFocus
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder={t("users.namePlaceholder")}
              className={inputClass}
            />
          </Field>
          <Field label={t("common.email")}>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder={t("users.emailPlaceholder")}
              className={inputClass}
            />
          </Field>
          <Field label={isEdit ? t("users.passwordEdit") : t("common.password")}>
            <input
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder={t("register.passwordHint")}
              className={inputClass}
            />
          </Field>

          <div>
            <span className="mb-2 block text-xs font-medium uppercase tracking-wider text-muted">
              {t("common.role")}
            </span>
            <div className="space-y-2.5">
              {ROLES.map((r) => {
                const active = form.role === r.id;
                return (
                  <button
                    key={r.id}
                    onClick={() => setForm({ ...form, role: r.id })}
                    className={[
                      "flex w-full items-start gap-3.5 rounded-2xl border p-4 text-left transition-colors",
                      active ? "border-neutral-900 bg-neutral-50" : "border-line hover:border-neutral-300",
                    ].join(" ")}
                  >
                    <span
                      className={[
                        "mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border transition-colors",
                        active ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-300",
                      ].join(" ")}
                    >
                      {active && <CheckIcon className="h-3 w-3" />}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[15px] font-semibold">{t(roleKey(r.id))}</span>
                      <span className="mt-0.5 block text-sm text-muted">{t(roleBlurbKey(r.id))}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <Field label={t("expenses.colBranch")}>
            <select
              value={form.branchId ?? ""}
              onChange={(e) => setForm({ ...form, branchId: e.target.value || undefined })}
              className={`${inputClass} bg-white`}
            >
              <option value="">{t("users.allBranches")}</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </Field>

          <div className="flex items-center justify-between rounded-2xl bg-surface px-5 py-4">
            <div>
              <p className="text-[15px] font-semibold">{t("common.active")}</p>
              <p className="mt-0.5 text-xs text-muted">{t("users.activeBlurb")}</p>
            </div>
            <Toggle
              checked={form.active}
              onChange={(v) => setForm({ ...form, active: v })}
              label={t("common.active")}
            />
          </div>
        </div>

        <div className="sticky bottom-0 flex gap-3 border-t border-line bg-white px-6 py-5">
          <button
            onClick={onClose}
            className="h-12 flex-1 rounded-xl border border-line text-sm font-medium transition-colors hover:bg-surface"
          >
            {t("common.cancel")}
          </button>
          <button
            disabled={!valid}
            onClick={() => onSave(form)}
            className="h-12 flex-[1.4] rounded-xl bg-neutral-900 text-sm font-semibold text-white transition-opacity hover:opacity-85 disabled:bg-neutral-200 disabled:text-neutral-400"
          >
            {isEdit ? t("common.saveChanges") : t("users.create")}
          </button>
        </div>
      </div>
    </div>
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
