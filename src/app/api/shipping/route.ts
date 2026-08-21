import { NextResponse } from "next/server";
import { getShippingRates } from "@/lib/shipping";

export async function GET() {
  const rates = await getShippingRates();
  return NextResponse.json(rates);
}
