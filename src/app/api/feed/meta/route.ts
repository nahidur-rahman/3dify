import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hydrateProductImages } from "@/lib/productImages";
import { buildMetaCatalogFeed } from "@/lib/metaCatalogFeed";
import { calculateDiscountedPrice, categoryLabels } from "@/lib/utils";

export const dynamic = "force-dynamic";

function getSiteUrl() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  try {
    return new URL(siteUrl);
  } catch {
    return new URL("http://localhost:3000");
  }
}

// Product catalog feed for Meta Commerce Manager (catalog ads, FB/IG Shop).
// Product ids match the content_ids sent by the pixel.
export async function GET() {
  try {
    const siteUrl = getSiteUrl();
    const records = await prisma.product.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        images: true,
        category: true,
        sizeOptions: true,
        discountPercent: true,
        inStock: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const products = records.map((record) => {
      const hydrated = hydrateProductImages(record);
      // Same "from" price the storefront cards show.
      const sizeOptionPrices = hydrated.sizeOptions?.map((option) => option.price) ?? [];
      const basePrice =
        sizeOptionPrices.length > 0 ? Math.min(...sizeOptionPrices) : record.price;

      return {
        id: record.id,
        name: record.name,
        description: record.description,
        price: basePrice,
        salePrice:
          record.discountPercent > 0
            ? calculateDiscountedPrice(basePrice, record.discountPercent)
            : null,
        inStock: record.inStock,
        link: new URL(`/products/${record.id}`, siteUrl).toString(),
        images: hydrated.images.filter((image) => /^https?:\/\//i.test(image)),
        categoryLabel: categoryLabels[record.category] ?? record.category,
      };
    });

    const feed = buildMetaCatalogFeed({
      title: process.env.NEXT_PUBLIC_APP_NAME || "3Dify BD",
      siteUrl: siteUrl.toString(),
      products,
    });

    return new NextResponse(feed, {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  } catch (err) {
    console.error("Failed to build Meta catalog feed:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
