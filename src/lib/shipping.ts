"use server";

import { prisma } from "@/lib/db";
import type { ShippingMethod } from "@prisma/client";

export interface ShippingOption {
  method: ShippingMethod;
  label: string;
  price: number;
}

export interface ShippingRateRecord extends ShippingOption {
  id?: string;
  isActive: boolean;
}

const DEFAULT_SHIPPING_RATES: ShippingRateRecord[] = [
  {
    method: "INSIDE_DHAKA",
    label: "Inside Dhaka",
    price: 70,
    isActive: true,
  },
  {
    method: "OUTSIDE_DHAKA",
    label: "Outside Dhaka",
    price: 130,
    isActive: true,
  },
];

const SHIPPING_RATE_ORDER: Record<ShippingMethod, number> = {
  INSIDE_DHAKA: 0,
  OUTSIDE_DHAKA: 1,
};

function sortShippingRates<T extends { method: ShippingMethod }>(rates: T[]) {
  return [...rates].sort(
    (first, second) =>
      SHIPPING_RATE_ORDER[first.method] - SHIPPING_RATE_ORDER[second.method]
  );
}

function getDefaultShippingRate(method: ShippingMethod) {
  return (
    DEFAULT_SHIPPING_RATES.find((rate) => rate.method === method) ??
    DEFAULT_SHIPPING_RATES[0]
  );
}

async function ensureShippingRatesInDb(): Promise<ShippingRateRecord[]> {
  const existingRates = await prisma.shippingRate.findMany();
  const existingMethods = new Set(existingRates.map((rate) => rate.method));
  const missingRates = DEFAULT_SHIPPING_RATES.filter(
    (rate) => !existingMethods.has(rate.method)
  );

  if (missingRates.length > 0) {
    await prisma.shippingRate.createMany({
      data: missingRates.map(({ method, label, price, isActive }) => ({
        method,
        label,
        price,
        isActive,
      })),
      skipDuplicates: true,
    });
  }

  const allRates =
    missingRates.length > 0
      ? await prisma.shippingRate.findMany()
      : existingRates;

  return sortShippingRates(
    allRates.map((rate) => ({
      id: rate.id,
      method: rate.method,
      label: rate.label,
      price: rate.price,
      isActive: rate.isActive,
    }))
  );
}

export async function getAdminShippingRates(): Promise<ShippingRateRecord[]> {
  try {
    return await ensureShippingRatesInDb();
  } catch {
    return DEFAULT_SHIPPING_RATES;
  }
}

export async function getShippingRates(): Promise<ShippingOption[]> {
  try {
    const rates = await ensureShippingRatesInDb();

    return rates
      .filter((rate) => rate.isActive)
      .map((rate) => ({
        method: rate.method,
        label: rate.label,
        price: rate.price,
      }));
  } catch {
    return DEFAULT_SHIPPING_RATES.filter((rate) => rate.isActive).map(
      ({ method, label, price }) => ({
        method,
        label,
        price,
      })
    );
  }
}

export async function getShippingCost(method: ShippingMethod): Promise<number> {
  try {
    const rates = await ensureShippingRatesInDb();
    const rate = rates.find(
      (shippingRate) => shippingRate.method === method && shippingRate.isActive
    );

    if (!rate) {
      throw new Error("Shipping rate unavailable");
    }

    return rate.price;
  } catch (error) {
    if (error instanceof Error && error.message === "Shipping rate unavailable") {
      throw error;
    }

    return getDefaultShippingRate(method).price;
  }
}
