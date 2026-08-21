"use server";

import { prisma } from "@/lib/db";
import type { ShippingMethod } from "@prisma/client";

export interface ShippingOption {
  method: ShippingMethod;
  label: string;
  price: number;
}

export async function getShippingRates(): Promise<ShippingOption[]> {
  try {
    const rates = await prisma.shippingRate.findMany({
      where: { isActive: true },
      orderBy: { price: "asc" },
    });

    return rates.map((r) => ({
      method: r.method,
      label: r.label,
      price: r.price,
    }));
  } catch {
    // Return defaults if DB not seeded yet
    return [
      { method: "INSIDE_DHAKA", label: "Inside Dhaka", price: 70 },
      { method: "OUTSIDE_DHAKA", label: "Outside Dhaka", price: 130 },
    ];
  }
}

export async function getShippingCost(method: ShippingMethod): Promise<number> {
  try {
    const rate = await prisma.shippingRate.findUnique({ where: { method } });
    return rate?.price ?? (method === "INSIDE_DHAKA" ? 70 : 130);
  } catch {
    return method === "INSIDE_DHAKA" ? 70 : 130;
  }
}
