import assert from "node:assert/strict";
import test from "node:test";
import { File } from "node:buffer";
import * as crypto from "node:crypto";
import sharp from "sharp";
import { createRequire } from "node:module";
import { loadTypeScript } from "./helpers/loadTypeScript.mjs";

const variants = loadTypeScript("src/lib/imageVariants.ts");
const optimizer = loadTypeScript("src/lib/optimizeProductImage.ts", {
  sharp: { default: sharp }, "@/lib/imageVariants": variants,
});
const hash = "a".repeat(64);
const prefix = "https://shop.supabase.co/storage/v1/object/public/product-images/";
const main = `products/draft-test/${hash}.v1-main.webp`;

test("product cards and gallery render their intended pre-generated variants", () => {
  const require = createRequire(import.meta.url);
  const React = require("react");
  const { renderToStaticMarkup } = require("react-dom/server");
  const dependencies = {
    react: React, "react/jsx-runtime": require("react/jsx-runtime"),
    "next/image": { default: ({ src, alt }) => React.createElement("img", { src, alt }) },
    "next/link": { default: ({ children }) => React.createElement("a", null, children) },
    "react-icons/hi": { HiChevronLeft: () => null, HiChevronRight: () => null },
    "@/lib/imageVariants": variants,
    "@/lib/utils": { cn: (...values) => values.filter(Boolean).join(" "), calculateDiscountedPrice: price => price, formatPrice: String },
  };
  const Card = loadTypeScript("src/components/ProductCard.tsx", dependencies).default;
  const Gallery = loadTypeScript("src/components/ProductImageGallery.tsx", dependencies).default;
  const src = prefix + main;
  const card = renderToStaticMarkup(React.createElement(Card, { product: { id: "one", name: "Photo", price: 100, images: [src], inStock: true } }));
  const gallery = renderToStaticMarkup(React.createElement(Gallery, { images: [src, src], productName: "Photo" }));
  assert.ok(card.includes(".v1-card.webp")); assert.ok(!card.includes(".v1-main.webp"));
  assert.ok(gallery.includes(".v1-main.webp")); assert.ok(gallery.includes(".v1-thumbnail.webp"));
  assert.ok(!gallery.includes("/_next/image"));
});

test("variant URLs preserve queries and legacy images never point at nonexistent siblings", () => {
  assert.equal(variants.productImageVariant(prefix + main + "?download=1", "thumbnail"), prefix + main.replace("-main", "-thumbnail") + "?download=1");
  for (const source of ["/logo.svg", "blob:preview", prefix + "products/old/photo.jpg", prefix + "products/old/photo.webp"]) {
    assert.equal(variants.productImageVariant(source, "card"), source);
    assert.deepEqual([...variants.productImageFiles(source)], [source]);
  }
});

test("real photos are resized without cropping, with alpha retained, and small images never enlarged", async () => {
  const input = await sharp({ create: { width: 2400, height: 1600, channels: 4, background: { r: 40, g: 100, b: 160, alpha: 0.5 } } }).png().toBuffer();
  const outputs = await optimizer.optimizeProductImage(input);
  for (const { variant, data } of outputs) {
    const metadata = await sharp(data).metadata();
    assert.equal(metadata.format, "webp");
    assert.equal(metadata.width, variants.IMAGE_WIDTHS[variant]);
    assert.ok(Math.abs(metadata.width / metadata.height - 1.5) < 0.02);
    assert.equal(metadata.hasAlpha, true);
    assert.ok(data.length < input.length * 0.1);
  }
  const small = await sharp({ create: { width: 40, height: 60, channels: 3, background: "red" } }).png().toBuffer();
  for (const { data } of await optimizer.optimizeProductImage(small)) {
    const metadata = await sharp(data).metadata();
    assert.equal(metadata.width, 40); assert.equal(metadata.height, 60);
  }
});

test("EXIF orientation is applied before resizing and private metadata is stripped", async () => {
  const input = await sharp({ create: { width: 1800, height: 1200, channels: 3, background: "blue" } }).jpeg().withMetadata({ orientation: 6 }).toBuffer();
  const [{ data }] = await optimizer.optimizeProductImage(input);
  const metadata = await sharp(data).metadata();
  assert.equal(metadata.width, 500); assert.equal(metadata.height, 750);
  assert.equal(metadata.exif, undefined);
});

test("invalid bytes, vectors and animated images fail instead of storing broken/static previews", async () => {
  for (const input of [Buffer.from("not an image"), Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"/>')]) {
    await assert.rejects(optimizer.optimizeProductImage(input), /Invalid image/);
  }
  const animation = await sharp({ create: { width: 8, height: 16, channels: 3, background: "red", pageHeight: 8 } }).gif({ delay: [100, 100], loop: 0 }).toBuffer();
  await assert.rejects(optimizer.optimizeProductImage(animation), /Invalid image/);
});

function storageService({ failUploadAt, failCopyAt } = {}) {
  const files = new Map(); const calls = []; let uploads = 0; let copies = 0;
  const helpers = loadTypeScript("src/lib/productImages.ts", {
    crypto, "@/lib/imageVariants": variants, "@/lib/optimizeProductImage": optimizer,
    "@/lib/nameKeychain": { parseTextDesigns: value => value || [] },
    "@/lib/productColors": { normalizeProductColorOptions: () => [] },
    "@/lib/supabaseAdmin": { productImageBucket: "product-images", getSupabaseAdmin: () => ({ storage: { from: () => ({
      getPublicUrl: path => ({ data: { publicUrl: prefix + path } }),
      upload: async (path, data, options) => {
        calls.push({ path, options }); uploads++;
        if (uploads === failUploadAt) return { error: { message: "Upload failed", status: 500 } };
        if (files.has(path)) return { error: { message: "Already exists", status: 409 } };
        files.set(path, data); return { error: null };
      },
      copy: async (source, target) => {
        copies++;
        if (copies === failCopyAt) return { error: { message: "Copy failed" } };
        assert.ok(files.has(source));
        if (files.has(target)) return { error: { message: "Already exists" } };
        files.set(target, files.get(source)); return { error: null };
      },
      remove: async paths => { paths.forEach(path => files.delete(path)); return { error: null }; },
    }) } }) },
  }, { process: { env: {} } });
  return { files, calls, helpers };
}

async function photo() {
  return new File([await sharp({ create: { width: 1600, height: 1000, channels: 3, background: "green" } }).png().toBuffer()], "photo.png", { type: "image/png" });
}

test("upload stores three immutable WebPs for 90 days, deduplicates and retains the original signature", async () => {
  const service = storageService(); const input = await photo();
  const url = await service.helpers.uploadProductImage(input, "draft-test");
  assert.equal(service.files.size, 3);
  for (const { path, options } of service.calls) {
    assert.match(path, /\.v1-(main|card|thumbnail)\.webp$/);
    assert.equal(options.contentType, "image/webp");
    assert.equal(options.cacheControl, "7776000"); assert.equal(options.upsert, false);
  }
  assert.equal(await service.helpers.uploadProductImage(input, "draft-test"), url);
  assert.equal(service.files.size, 3);
  assert.deepEqual([...await service.helpers.getImageSignatures([url])], [crypto.createHash("sha256").update(Buffer.from(await input.arrayBuffer())).digest("hex")]);
});

test("partial upload failure removes only files created by that request", async () => {
  const service = storageService({ failUploadAt: 2 });
  await assert.rejects(service.helpers.uploadProductImage(await photo(), "draft-test"), /Upload failed/);
  assert.equal(service.files.size, 0);
});

test("finalization, repeat edits and deletion handle every sibling without touching legacy files", async () => {
  const service = storageService();
  const url = await service.helpers.uploadProductImage(await photo(), "draft-test");
  service.files.set("homepage/banner.png", Buffer.from("protected"));
  const result = await service.helpers.moveDraftImagesToProductFolder([url], "product-1");
  assert.match(result[0], /^products\/product-1\/.*\.v1-main.webp$/);
  assert.equal(service.files.size, 4);
  const repeat = await service.helpers.uploadProductImage(await photo(), "draft-repeat");
  await service.helpers.moveDraftImagesToProductFolder([repeat], "product-1", result);
  assert.equal(service.files.size, 4);
  await service.helpers.deleteProductImages(result);
  assert.deepEqual([...service.files.keys()], ["homepage/banner.png"]);
});

test("failed variant copies clean draft and partially copied files", async () => {
  const service = storageService({ failCopyAt: 2 });
  const url = await service.helpers.uploadProductImage(await photo(), "draft-test");
  await assert.rejects(service.helpers.moveDraftImagesToProductFolder([url], "product-1"), /Copy failed/);
  assert.equal(service.files.size, 0);
});

test("browser sends one file per request and cleans earlier uploads after a later failure", async () => {
  const calls = []; let count = 0;
  const { uploadImageFiles } = loadTypeScript("src/lib/uploadImageFiles.ts", {}, {
    FormData,
    fetch: async (url, options) => {
      calls.push(options);
      if (options.method === "DELETE") return {};
      assert.equal(options.body.getAll("files").length, 1);
      return { ok: ++count < 2, json: async () => count < 2 ? { urls: [prefix + main] } : { error: "Upload failed" } };
    },
  });
  await assert.rejects(uploadImageFiles([await photo(), await photo()], "draft-test"), /Upload failed/);
  assert.deepEqual(calls.map(call => call.method), ["POST", "POST", "DELETE"]);
});

test("Next production config disables transformations and restricts formats, hosts, quality and widths", async () => {
  const require = createRequire(import.meta.url);
  const config = await require("next/dist/server/config").default(require("next/constants").PHASE_PRODUCTION_BUILD, process.cwd());
  assert.equal(config.images.unoptimized, true);
  assert.equal(config.images.minimumCacheTTL, 7776000);
  assert.deepEqual(config.images.qualities, [80]);
  assert.deepEqual(config.images.formats, ["image/webp"]);
  assert.deepEqual(config.images.deviceSizes, [480, 750]);
  assert.deepEqual(config.images.imageSizes, [128]);
  assert.ok(config.images.remotePatterns.every(pattern => !pattern.hostname.includes("*")));
  const { getImgProps } = require("next/dist/shared/lib/get-img-props");
  const props = getImgProps({ src: prefix + main, alt: "Photo", fill: true }, {
    imgConf: config.images, defaultLoader: require("next/dist/shared/lib/image-loader").default,
  }).props;
  assert.equal(props.src, prefix + main); assert.equal(props.srcSet, undefined);
  assert.equal(props.loading, "lazy");
});
