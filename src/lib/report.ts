import type { Order } from "./types";

export type RangeId = "today" | "week" | "month" | "last30" | "custom";

/** Labels live in the dictionary under `range.<id>`. */
export const RANGES: { id: RangeId }[] = [
  { id: "today" },
  { id: "week" },
  { id: "month" },
  { id: "last30" },
  { id: "custom" },
];

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

export const isoDay = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/** Inclusive [from, to] bounds for the selected range. */
export function rangeBounds(id: RangeId, customFrom: string, customTo: string) {
  const now = new Date();
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  switch (id) {
    case "today":
      return { from: startOfDay(now), to: end };
    case "week": {
      const day = (now.getDay() + 6) % 7; // Monday-first
      const from = startOfDay(now);
      from.setDate(from.getDate() - day);
      return { from, to: end };
    }
    case "month":
      return { from: new Date(now.getFullYear(), now.getMonth(), 1), to: end };
    case "last30": {
      const from = startOfDay(now);
      from.setDate(from.getDate() - 29);
      return { from, to: end };
    }
    case "custom": {
      const from = customFrom ? new Date(`${customFrom}T00:00:00`) : startOfDay(now);
      const to = customTo ? new Date(`${customTo}T23:59:59.999`) : end;
      return { from, to };
    }
  }
}

export const inRange = (iso: string, from: Date, to: Date) => {
  const t = new Date(iso).getTime();
  return t >= from.getTime() && t <= to.getTime();
};

/** One entry per calendar day that has orders, oldest first. */
export function byDay(orders: Order[]) {
  const map = new Map<string, { day: string; txns: number; revenue: number }>();
  for (const o of orders) {
    const key = isoDay(new Date(o.createdAt));
    const cur = map.get(key) ?? { day: key, txns: 0, revenue: 0 };
    cur.txns += 1;
    cur.revenue += o.total;
    map.set(key, cur);
  }
  return [...map.values()].sort((a, b) => a.day.localeCompare(b.day));
}

export const dayLabel = (day: string, locale = "en-US") =>
  new Date(`${day}T12:00:00`).toLocaleDateString(locale, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

export const shortDay = (day: string, locale = "en-US") =>
  new Date(`${day}T12:00:00`).toLocaleDateString(locale, { month: "short", day: "numeric" });
