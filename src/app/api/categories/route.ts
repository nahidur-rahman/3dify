import { NextResponse } from "next/server";
import { categoryConfig } from "@/lib/categories";

// GET /api/categories — list all categories
export async function GET() {
  const categories = categoryConfig.map((category) => ({
    value: category.value,
    label: category.label,
    seoName: category.seoName,
    slug: category.slug,
    description: category.description,
    subcategories: [...category.subcategories],
  }));

  return NextResponse.json(categories);
}
