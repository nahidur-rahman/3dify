export const ANALYTICS_PERIODS = ["7D", "14D", "1M", "3M", "6M"] as const;
export type AnalyticsPeriod = (typeof ANALYTICS_PERIODS)[number];

export interface AnalyticsDay {
  date: string;
  orders: number;
  products: number;
  amount: number;
}

export interface DashboardAnalytics {
  days: AnalyticsDay[];
  today: string;
  available: boolean;
}

const DAY_MS = 24 * 60 * 60 * 1000;
const DHAKA_OFFSET_MS = 6 * 60 * 60 * 1000;

export function getDhakaDate(now: Date): string {
  return new Date(now.getTime() + DHAKA_OFFSET_MS).toISOString().slice(0, 10);
}

// Date-only values are calculated in UTC so the browser's timezone cannot
// change the store's reporting dates.
export function getPeriodStart(period: AnalyticsPeriod, today: string): string {
  const end = new Date(`${today}T00:00:00Z`);
  if (period === "7D" || period === "14D") {
    end.setUTCDate(end.getUTCDate() - (period === "7D" ? 6 : 13));
  } else {
    const months = period === "1M" ? 1 : period === "3M" ? 3 : 6;
    const dayOfMonth = end.getUTCDate();
    end.setUTCDate(1);
    end.setUTCMonth(end.getUTCMonth() - months);
    const lastDay = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth() + 1, 0)).getUTCDate();
    end.setUTCDate(Math.min(dayOfMonth, lastDay) + 1);
  }
  return end.toISOString().slice(0, 10);
}

export function getDhakaDayStart(date: string): Date {
  return new Date(new Date(`${date}T00:00:00Z`).getTime() - DHAKA_OFFSET_MS);
}

export function fillAnalyticsDays(
  records: AnalyticsDay[],
  start: string,
  end: string
): AnalyticsDay[] {
  const byDate = new Map(records.map((record) => [record.date, record]));
  const days: AnalyticsDay[] = [];
  for (let time = Date.parse(`${start}T00:00:00Z`); time <= Date.parse(`${end}T00:00:00Z`); time += DAY_MS) {
    const date = new Date(time).toISOString().slice(0, 10);
    days.push(byDate.get(date) ?? { date, orders: 0, products: 0, amount: 0 });
  }
  return days;
}

export function selectAnalyticsPeriod(
  days: AnalyticsDay[],
  period: AnalyticsPeriod,
  today: string
): AnalyticsDay[] {
  const start = getPeriodStart(period, today);
  return days.filter((day) => day.date >= start && day.date <= today);
}
