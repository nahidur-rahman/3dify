"use client";

import { useEffect, useState } from "react";
import { formatPrice } from "@/lib/utils";
import { HiOutlineTruck, HiCheck, HiX } from "react-icons/hi";

interface ShippingRate {
  id?: string;
  method: string;
  label: string;
  price: number;
  isActive: boolean;
}

export default function AdminShippingPage() {
  const [rates, setRates] = useState<ShippingRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [editPrices, setEditPrices] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchRates();
  }, []);

  async function fetchRates() {
    try {
      const res = await fetch("/api/admin/shipping");
      if (res.ok) {
        const data = await res.json();
        setRates(data);
        const prices: Record<string, string> = {};
        data.forEach((r: ShippingRate) => {
          prices[r.method] = r.price.toString();
        });
        setEditPrices(prices);
      }
    } catch {
      // Use defaults if fetch fails
      setRates([
        { method: "INSIDE_DHAKA", label: "Inside Dhaka", price: 70, isActive: true },
        { method: "OUTSIDE_DHAKA", label: "Outside Dhaka", price: 130, isActive: true },
      ]);
      setEditPrices({ INSIDE_DHAKA: "70", OUTSIDE_DHAKA: "130" });
    } finally {
      setLoading(false);
    }
  }

  async function saveRate(rate: ShippingRate) {
    setSaving(rate.method);
    const price = parseFloat(editPrices[rate.method]);
    if (isNaN(price) || price < 0) {
      setSaving(null);
      return;
    }

    try {
      const res = await fetch("/api/admin/shipping", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          method: rate.method,
          label: rate.label,
          price,
          isActive: rate.isActive,
        }),
      });

      if (res.ok) {
        await fetchRates();
      }
    } catch {
      // silently fail
    } finally {
      setSaving(null);
    }
  }

  async function toggleActive(rate: ShippingRate) {
    setSaving(rate.method);
    try {
      await fetch("/api/admin/shipping", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          method: rate.method,
          label: rate.label,
          price: rate.price,
          isActive: !rate.isActive,
        }),
      });
      await fetchRates();
    } catch {
      // silently fail
    } finally {
      setSaving(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <HiOutlineTruck className="h-6 w-6 text-primary-500" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Shipping Rates
        </h1>
      </div>

      <div className="space-y-4">
        {rates.map((rate) => (
          <div
            key={rate.method}
            className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-dark-200 dark:bg-dark-100"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {rate.label}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {rate.method.replace(/_/g, " ")}
                </p>
              </div>
              <button
                onClick={() => toggleActive(rate)}
                disabled={saving === rate.method}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${
                  rate.isActive
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                    : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                }`}
              >
                {rate.isActive ? (
                  <>
                    <HiCheck className="h-3.5 w-3.5" /> Active
                  </>
                ) : (
                  <>
                    <HiX className="h-3.5 w-3.5" /> Inactive
                  </>
                )}
              </button>
            </div>

            <div className="flex items-end gap-3">
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Price (৳)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={editPrices[rate.method] ?? ""}
                  onChange={(e) =>
                    setEditPrices((prev) => ({
                      ...prev,
                      [rate.method]: e.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-dark-200 dark:bg-dark dark:text-white"
                />
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400 pb-2">
                Current: {formatPrice(rate.price)}
              </div>
              <button
                onClick={() => saveRate(rate)}
                disabled={saving === rate.method}
                className="rounded-xl bg-primary-500 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-primary-600 disabled:opacity-50"
              >
                {saving === rate.method ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
