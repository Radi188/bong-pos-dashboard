"use client";

/** Amount input with quick-fill presets — shared by the open and close till dialogs. */
export default function MoneyField({
  label,
  symbol,
  value,
  onChange,
  presets,
  format,
  autoFocus,
}: {
  label: string;
  symbol: string;
  value: string;
  onChange: (v: string) => void;
  presets: number[];
  format: (n: number) => string;
  autoFocus?: boolean;
}) {
  return (
    <div>
      <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted">
        {label}
      </span>
      <div className="relative">
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-base text-muted">
          {symbol}
        </span>
        <input
          autoFocus={autoFocus}
          inputMode="decimal"
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/[^0-9.]/g, ""))}
          placeholder="0"
          className="h-14 w-full rounded-xl border border-line pl-10 pr-4 text-right text-xl tabular-nums outline-none transition-colors focus:border-neutral-900"
        />
      </div>
      <div className="mt-2 grid grid-cols-4 gap-2">
        {presets.map((n) => (
          <button
            key={n}
            onClick={() => onChange(String(n))}
            className="h-9 rounded-lg border border-line text-xs font-medium tabular-nums transition-colors hover:border-neutral-900"
          >
            {format(n)}
          </button>
        ))}
      </div>
    </div>
  );
}

export const USD_PRESETS = [20, 50, 100, 200];
export const KHR_PRESETS = [40000, 100000, 200000, 400000];

export const khr = (n: number) => `${new Intl.NumberFormat("en-US").format(Math.round(n))} ៛`;
