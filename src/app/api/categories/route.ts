import { NextResponse } from "next/server";
import { categoryLabels, categoryDescriptions } from "@/lib/utils";

// GET /api/categories — list all categories
export async function GET() {
  const categories = Object.entries(categoryLabels).map(([value, label]) => ({
    value,
    label,
    description: categoryDescriptions[value] || "",
  }));

  return NextResponse.json(categories);
}
