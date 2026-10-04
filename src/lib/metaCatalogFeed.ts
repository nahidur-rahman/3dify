// Builds the product catalog feed (RSS 2.0 + Google/Meta "g:" fields) that
// Meta Commerce Manager reads for catalog ads and Facebook/Instagram Shops.

export interface MetaFeedProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  salePrice: number | null;
  inStock: boolean;
  link: string;
  images: string[];
  categoryLabel: string;
}

const MAX_ADDITIONAL_IMAGES = 10;

export function escapeXml(value: string): string {
  return value
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function formatFeedPrice(price: number) {
  return `${price.toFixed(2)} BDT`;
}

function buildItem(product: MetaFeedProduct, brand: string) {
  const [imageLink, ...additionalImages] = product.images;
  const name = product.name.trim();
  const description = product.description.trim() || name;
  const lines = [
    `<g:id>${escapeXml(product.id)}</g:id>`,
    `<g:title>${escapeXml(name.slice(0, 200))}</g:title>`,
    `<g:description>${escapeXml(description.slice(0, 5000))}</g:description>`,
    `<g:link>${escapeXml(product.link)}</g:link>`,
    `<g:image_link>${escapeXml(imageLink)}</g:image_link>`,
    ...additionalImages
      .slice(0, MAX_ADDITIONAL_IMAGES)
      .map(
        (image) =>
          `<g:additional_image_link>${escapeXml(image)}</g:additional_image_link>`
      ),
    `<g:availability>${product.inStock ? "in stock" : "out of stock"}</g:availability>`,
    `<g:condition>new</g:condition>`,
    `<g:price>${formatFeedPrice(product.price)}</g:price>`,
    ...(product.salePrice !== null && product.salePrice < product.price
      ? [`<g:sale_price>${formatFeedPrice(product.salePrice)}</g:sale_price>`]
      : []),
    `<g:brand>${escapeXml(brand)}</g:brand>`,
    `<g:product_type>${escapeXml(product.categoryLabel)}</g:product_type>`,
  ];

  return `<item>\n${lines.map((line) => `  ${line}`).join("\n")}\n</item>`;
}

export function buildMetaCatalogFeed({
  title,
  siteUrl,
  products,
}: {
  title: string;
  siteUrl: string;
  products: MetaFeedProduct[];
}): string {
  const items = products
    .filter((product) => product.images.length > 0)
    .map((product) => buildItem(product, title));

  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">`,
    `<channel>`,
    `<title>${escapeXml(title)}</title>`,
    `<link>${escapeXml(siteUrl)}</link>`,
    `<description>${escapeXml(`${title} product catalog`)}</description>`,
    ...items,
    `</channel>`,
    `</rss>`,
  ].join("\n");
}
