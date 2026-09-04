export const currency = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

/**
 * Money stays in the `en-US` pattern in both languages — a till reads "$3.50"
 * everywhere, and switching the digits to Khmer numerals hurts more than it helps.
 * Dates and times do follow the active language; pass `locale` from `useI18n()`.
 */
export const time = (iso: string, locale = "en-US") =>
  new Date(iso).toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });

export const dateTime = (iso: string, locale = "en-US") =>
  new Date(iso).toLocaleString(locale, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export const date = (iso: string, locale = "en-US") =>
  new Date(iso).toLocaleDateString(locale, { year: "numeric", month: "short", day: "numeric" });

export const isToday = (iso: string) => {
  const d = new Date(iso);
  const n = new Date();
  return (
    d.getDate() === n.getDate() &&
    d.getMonth() === n.getMonth() &&
    d.getFullYear() === n.getFullYear()
  );
};

/** "#CBA202609010037" — branch code, date, then the order sequence. */
export const orderRef = (createdAt: string, number: number, branchName: string) => {
  const d = new Date(createdAt);
  const code = branchName.replace(/[^a-z]/gi, "").slice(0, 3).toUpperCase() || "POS";
  const date = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(
    d.getDate()
  ).padStart(2, "0")}`;
  return `#${code}${date}${String(number).padStart(4, "0")}`;
};

export const clockTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
