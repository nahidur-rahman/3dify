import { NextRequest, NextResponse } from "next/server";
import { getProductSearchSuggestions } from "@/lib/productSearch";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";
    const suggestions = await getProductSearchSuggestions(query);

    return NextResponse.json(
      { suggestions },
      {
        headers: {
          "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
        },
      }
    );
  } catch (error) {
    console.error("Get product suggestions error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}