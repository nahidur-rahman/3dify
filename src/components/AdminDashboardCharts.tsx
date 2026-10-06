"use client";

import { useId, useState } from "react";
import {
  ANALYTICS_PERIODS,
  selectAnalyticsPeriod,
  type AnalyticsDay,
  type AnalyticsPeriod,
  type DashboardAnalytics,
} from "@/lib/dashboardAnalytics";

type Metric = "orders" | "products" | "amount";
const series: Record<Metric, { label: string; color: string }> = {
  orders: { label: "Orders", color: "#10b981" },
  products: { label: "Items ordered", color: "#3b82f6" },
  amount: { label: "Order amount", color: "#40928b" },
};
const numberFormat = new Intl.NumberFormat("en-BD", { maximumFractionDigits: 0 });
const amountFormat = new Intl.NumberFormat("en-BD", { maximumFractionDigits: 2 });
const compactFormat = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 });
const shortDateFormat = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
const fullDateFormat = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

function formatDate(date: string, full = false) {
  return (full ? fullDateFormat : shortDateFormat).format(new Date(`${date}T00:00:00Z`));
}

function formatValue(value: number, metric: Metric) {
  return metric === "amount" ? `৳${amountFormat.format(value)}` : numberFormat.format(value);
}

function getAxisMax(value: number) {
  if (value <= 4) return 4;
  const magnitude = 10 ** Math.floor(Math.log10(value / 4));
  return Math.ceil(value / 4 / magnitude) * magnitude * 4;
}

function TrendChart({ days, metrics, title }: { days: AnalyticsDay[]; metrics: Metric[]; title: string }) {
  const gradientId = useId().replace(/:/g, "");
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const max = getAxisMax(Math.max(0, ...days.flatMap((day) => metrics.map((metric) => day[metric]))));
  const x = (index: number) => (index / Math.max(days.length - 1, 1)) * 1000;
  const y = (value: number) => 216 - (value / max) * 208;
  const active = activeIndex === null ? null : Math.min(activeIndex, days.length - 1);
  const detail = days[active ?? days.length - 1];
  const amountChart = metrics[0] === "amount";
  const ticks = [0, 1, 2, 3].map((index) => Math.round((index / 3) * (days.length - 1)));

  function selectAt(clientX: number, element: HTMLDivElement) {
    const bounds = element.getBoundingClientRect();
    const fraction = Math.max(0, Math.min(1, (clientX - bounds.left) / bounds.width));
    setActiveIndex(Math.round(fraction * (days.length - 1)));
  }

  return (
    <>
      <div aria-live="polite" aria-atomic="true" className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-lg bg-gray-50 px-3 py-2 dark:bg-dark-200">
        <p className="text-xs text-gray-500 dark:text-gray-400">{formatDate(detail.date, true)}</p>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
          {metrics.map((metric) => (
            <span key={metric} className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: series[metric].color }} />
              {series[metric].label}: <strong className="font-semibold text-gray-900 dark:text-white">{formatValue(detail[metric], metric)}</strong>
            </span>
          ))}
        </div>
      </div>
      <div className="flex gap-2">
        <div aria-hidden="true" className="flex h-40 w-12 shrink-0 flex-col justify-between py-2 text-right text-[11px] tabular-nums text-gray-400 sm:h-44 sm:w-14">
          {[4, 3, 2, 1, 0].map((tick) => <span key={tick}>{amountChart ? "৳" : ""}{compactFormat.format(max * tick / 4)}</span>)}
        </div>
        <div className="min-w-0 flex-1">
          <div
            tabIndex={0}
            role="group"
            aria-label={`${title}, daily trend. Use left and right arrow keys to explore dates.`}
            className="relative h-40 cursor-crosshair touch-pan-y rounded outline-none focus-visible:ring-2 focus-visible:ring-primary-500 sm:h-44"
            onPointerMove={(event) => selectAt(event.clientX, event.currentTarget)}
            onPointerDown={(event) => selectAt(event.clientX, event.currentTarget)}
            onPointerLeave={(event) => { if (event.pointerType === "mouse") setActiveIndex(null); }}
            onBlur={() => setActiveIndex(null)}
            onKeyDown={(event) => {
              if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
              event.preventDefault();
              setActiveIndex((current) => {
                const index = current ?? days.length - 1;
                if (event.key === "Home") return 0;
                if (event.key === "End") return days.length - 1;
                return Math.max(0, Math.min(days.length - 1, index + (event.key === "ArrowRight" ? 1 : -1)));
              });
            }}
          >
            <svg viewBox="0 0 1000 224" preserveAspectRatio="none" className="h-full w-full overflow-visible" aria-hidden="true">
              <defs>
                <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor={series[metrics[0]].color} stopOpacity="0.18" />
                  <stop offset="100%" stopColor={series[metrics[0]].color} stopOpacity="0.01" />
                </linearGradient>
              </defs>
              {[0, 1, 2, 3, 4].map((tick) => (
                <line key={tick} x1="0" x2="1000" y1={y(max * tick / 4)} y2={y(max * tick / 4)} className="stroke-gray-200 dark:stroke-dark-200" strokeDasharray="4 5" vectorEffect="non-scaling-stroke" />
              ))}
              {metrics.map((metric, seriesIndex) => {
                const path = days.map((day, index) => `${index === 0 ? "M" : "L"}${x(index)},${y(day[metric])}`).join(" ");
                return (
                  <g key={metric}>
                    {seriesIndex === 0 && <path d={`${path} L1000,216 L0,216 Z`} fill={`url(#${gradientId})`} />}
                    <path d={path} fill="none" stroke={series[metric].color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray={metric === "products" ? "6 4" : undefined} vectorEffect="non-scaling-stroke" />
                  </g>
                );
              })}
              {active !== null && <line x1={x(active)} x2={x(active)} y1="8" y2="216" className="stroke-gray-400" strokeDasharray="3 4" vectorEffect="non-scaling-stroke" />}
            </svg>
            {active !== null && metrics.map((metric) => (
              <span key={metric} className="pointer-events-none absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white dark:border-dark-100" style={{ left: `${x(active) / 10}%`, top: `${y(detail[metric]) / 224 * 100}%`, backgroundColor: series[metric].color }} />
            ))}
          </div>
          <div aria-hidden="true" className="mt-1 flex justify-between gap-1 text-[11px] text-gray-400">
            {ticks.map((index) => <span key={index}>{formatDate(days[index].date)}</span>)}
          </div>
        </div>
      </div>
    </>
  );
}

function ChartCard({ analytics, amount = false }: { analytics: DashboardAnalytics; amount?: boolean }) {
  const [period, setPeriod] = useState<AnalyticsPeriod>("7D");
  const title = amount ? "Total amount" : "Orders & products";
  const metrics: Metric[] = amount ? ["amount"] : ["orders", "products"];
  const days = selectAnalyticsPeriod(analytics.days, period, analytics.today);
  const totals = days.reduce((sum, day) => ({ orders: sum.orders + day.orders, products: sum.products + day.products, amount: sum.amount + day.amount }), { orders: 0, products: 0, amount: 0 });
  const empty = days.every((day) => day.orders === 0);

  return (
    <section aria-label={title} className="min-w-0 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-dark-200 dark:bg-dark-100 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h2>
        <div role="group" aria-label={`${title} time period`} className="flex w-fit flex-wrap gap-1 rounded-xl bg-gray-100 p-1 dark:bg-dark-200">
        {ANALYTICS_PERIODS.map((option) => (
          <button key={option} type="button" aria-pressed={period === option} onClick={() => setPeriod(option)} className={`min-h-9 rounded-lg px-3 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${period === option ? "bg-white text-primary-700 shadow-sm dark:bg-dark-100 dark:text-primary-300" : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"}`}>
            {option}
          </button>
        ))}
        </div>
      </div>
      {analytics.available && days.length > 0 ? (
        <>
          <div className="mb-1 flex flex-wrap gap-x-8 gap-y-2">
            {metrics.map((metric) => (
              <div key={metric}>
                <p className="text-2xl font-bold tabular-nums text-gray-900 dark:text-white">{formatValue(totals[metric], metric)}</p>
                <p className="mt-0.5 flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: series[metric].color }} />{series[metric].label}</p>
              </div>
            ))}
          </div>
          {empty && <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">No orders in this period.</p>}
          <TrendChart key={period} days={days} metrics={metrics} title={title} />
        </>
      ) : (
        <div role="status" className="flex min-h-64 items-center justify-center rounded-xl bg-gray-50 p-4 text-center text-sm text-gray-500 dark:bg-dark-200 dark:text-gray-400">Charts unavailable. Refresh to retry.</div>
      )}
    </section>
  );
}

export default function AdminDashboardCharts({ analytics }: { analytics: DashboardAnalytics }) {
  return (
    <div className="mb-5 sm:mb-8">
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2 sm:gap-6">
        <ChartCard analytics={analytics} />
        <ChartCard analytics={analytics} amount />
      </div>
    </div>
  );
}
