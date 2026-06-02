import { MetadataRoute } from "next";
import { categoryConfig, getCategoryPath } from "@/lib/categories";
import { prisma } from "@/lib/db";

function getSiteUrl() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  try {
    return new URL(siteUrl);
  } catch {
    return new URL("http://localhost:3000");
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();
  const now = new Date();
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: new URL("/", siteUrl).toString(),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: new URL("/products", siteUrl).toString(),
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: new URL("/about", siteUrl).toString(),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    ...categoryConfig.map((category) => ({
      url: new URL(getCategoryPath(category), siteUrl).toString(),
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];

  try {
    const products = await prisma.product.findMany({
      select: { id: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
    });

    return [
      ...staticRoutes,
      ...products.map((product) => ({
        url: new URL(`/products/${product.id}`, siteUrl).toString(),
        lastModified: product.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.6,
      })),
    ];
  } catch {
    return staticRoutes;
  }
}