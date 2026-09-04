"use client";

import { ChevronRightIcon } from "./icons";

export function SettingsCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)] ring-1 ring-black/[0.04]">
      <h2 className="text-lg font-bold tracking-tight">{title}</h2>
      <p className="mt-1 text-[15px] text-neutral-500">{description}</p>
      <div className="mt-5">{children}</div>
    </section>
  );
}

/** Two-up (or more) selectable cards — the dark card is the active choice. */
export function ChoiceGrid<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: {
    id: T;
    label: string;
    description: string;
    Icon: (p: { className?: string }) => React.ReactElement;
  }[];
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {options.map(({ id, label, description, Icon }) => {
        const active = value === id;
        return (
          <button
            key={id}
            onClick={() => onChange(id)}
            aria-pressed={active}
            className={[
              "rounded-2xl border p-5 text-left transition-colors",
              active
                ? "border-neutral-900 bg-neutral-900 text-white"
                : "border-line bg-white hover:border-neutral-300",
            ].join(" ")}
          >
            <Icon className={`h-5 w-5 ${active ? "text-white" : "text-neutral-500"}`} />
            <p className="mt-3.5 text-base font-bold tracking-tight">{label}</p>
            <p
              className={`mt-1.5 text-sm leading-relaxed ${
                active ? "text-neutral-300" : "text-neutral-500"
              }`}
            >
              {description}
            </p>
          </button>
        );
      })}
    </div>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={[
        "relative h-8 w-14 shrink-0 rounded-full transition-colors",
        checked ? "bg-neutral-900" : "bg-neutral-200",
      ].join(" ")}
    >
      <span
        className={[
          "absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-[left]",
          checked ? "left-7" : "left-1",
        ].join(" ")}
      />
    </button>
  );
}

/** Icon tile + title/subtitle, with arbitrary trailing control. */
export function SettingRow({
  Icon,
  title,
  subtitle,
  children,
  onClick,
}: {
  Icon: (p: { className?: string }) => React.ReactElement;
  title: string;
  subtitle: string;
  children?: React.ReactNode;
  onClick?: () => void;
}) {
  const body = (
    <>
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-neutral-100 text-neutral-700">
        <Icon className="h-5 w-5" />
      </span>
      <span className="min-w-0 flex-1 text-left">
        <span className="block text-base font-bold tracking-tight">{title}</span>
        <span className="mt-0.5 block truncate text-sm text-neutral-500">{subtitle}</span>
      </span>
      {children}
      {onClick && <ChevronRightIcon className="h-5 w-5 shrink-0 text-neutral-400" />}
    </>
  );

  const className = "flex w-full items-center gap-4 py-4";

  return onClick ? (
    <button onClick={onClick} className={`${className} -mx-2 rounded-2xl px-2 transition-colors hover:bg-neutral-50`}>
      {body}
    </button>
  ) : (
    <div className={className}>{body}</div>
  );
}

export function StatusPill({ on, label }: { on: boolean; label: string }) {
  return (
    <span
      className={[
        "flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium",
        on ? "bg-emerald-50 text-emerald-700" : "bg-neutral-100 text-neutral-500",
      ].join(" ")}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${on ? "bg-emerald-500" : "bg-neutral-400"}`} />
      {label}
    </span>
  );
}

export function Divider() {
  return <div className="h-px bg-line" />;
}

/** Compact segmented control used inside the printer dialogs. */
export function Segmented<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { id: T; label: string }[];
}) {
  return (
    <div className="grid gap-1 rounded-xl bg-neutral-100 p-1" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
      {options.map((o) => (
        <button
          key={o.id}
          onClick={() => onChange(o.id)}
          className={[
            "h-10 rounded-lg text-sm font-medium transition-colors",
            value === o.id ? "bg-neutral-900 text-white" : "text-neutral-600 hover:text-neutral-900",
          ].join(" ")}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted">
        {label}
      </span>
      {children}
    </label>
  );
}

export const inputClass =
  "h-12 w-full rounded-xl border border-line px-4 text-[15px] outline-none transition-colors focus:border-neutral-900";
