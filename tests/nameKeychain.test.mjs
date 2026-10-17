import assert from "node:assert/strict";
import test from "node:test";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { File } from "node:buffer";
import * as crypto from "node:crypto";
import { PGlite } from "@electric-sql/pglite";
import { loadTypeScript } from "./helpers/loadTypeScript.mjs";

const require = createRequire(import.meta.url);
const zod = require("zod");
const nextServer = require("next/server");
const keychain = loadTypeScript("src/lib/nameKeychain.ts");
const imageVariants = loadTypeScript("src/lib/imageVariants.ts");
const colors = loadTypeScript("src/lib/productColors.ts", { "@/lib/nameKeychain": keychain });
const checkout = loadTypeScript("src/lib/keychainCheckout.ts", { zod, "@/lib/nameKeychain": keychain });
const { getCartKey } = loadTypeScript("src/lib/cart.ts", { "@/lib/nameKeychain": keychain });
const { productSchema } = loadTypeScript("src/lib/validation.ts", {
  zod, "@/lib/categories": loadTypeScript("src/lib/categories.ts"), "@/lib/productColors": colors, "@/lib/nameKeychain": keychain,
});
const product = {
  id: "keychain-1", name: "Name keychain", description: "Printed name", price: 150, images: [],
  category: "KEYCHAINS", subcategory: "Name Keychains", color: "Legacy color", colorMode: "OPTIONS", colorOptions: [],
  baseColor: "Black", textColor: "White", baseColorOptions: ["Black", "Blue"], textColorOptions: ["White", "Red"],
  textDesigns: [{ id: "design-1", label: "Rounded", image: "https://example.com/design.webp" }],
  size: "Standard", sizeMode: "FIXED", sizeOptions: [], inStock: true, discountPercent: 10,
};
const customization = { printedName: "Sara", baseColor: "Black", textColor: "Red", designId: "design-1", notes: "Please keep the dot" };
const plain = (value) => JSON.parse(JSON.stringify(value));

test("customer controls expose both color modes, required print name/design, bounded instructions and contact links", () => {
  const React = require("react");
  const { renderToStaticMarkup } = require("react-dom/server");
  const Options = loadTypeScript("src/components/NameKeychainOptions.tsx", {
    "@/lib/imageVariants": imageVariants,
    "react/jsx-runtime": require("react/jsx-runtime"),
    "next/image": { default: ({ src, alt }) => React.createElement("img", { src, alt }) },
    "@/lib/nameKeychain": keychain,
    "@/lib/utils": { getWhatsAppLink: () => "https://wa.me/8801712345678", getMessengerLink: () => "https://m.me/shop", hasWhatsAppConfigured: () => true, hasMessengerConfigured: () => true },
  }).default;
  const render = (saved, value = customization, showValidation = false) => renderToStaticMarkup(React.createElement(Options, { product: saved, value, showValidation, onChange: () => {} }));
  const options = render(product);
  assert.equal((options.match(/<select /g) || []).length, 2);
  assert.match(options, /aria-label="Base color"/);
  assert.match(options, /aria-label="Text color"/);
  assert.match(options, /<input[^>]*required=""[^>]*type="radio"/);
  assert.match(options, /maxLength="80"/);
  assert.ok(options.includes('pattern=".*\\S.*"'));
  assert.match(options, /<textarea[^>]*maxLength="500"/);
  assert.match(options, /href="https:\/\/wa.me/);
  assert.match(options, /href="https:\/\/m.me/);
  assert.ok(options.indexOf("Name to print") < options.indexOf("Base color"));
  assert.ok(options.indexOf("Text color") < options.indexOf("Font / text design"));
  const empty = { printedName: "   ", baseColor: "", textColor: "" };
  assert.doesNotMatch(render(product, empty), /aria-invalid="true"/);
  const invalid = render(product, empty, true);
  for (const message of ["Enter a name to print.", "Choose a base color.", "Choose a text color.", "Choose a font / text design."]) {
    assert.ok(invalid.includes(message), message);
  }
  assert.match(invalid, /aria-invalid="true"/);
  assert.match(invalid, /border-red-500/);
  assert.doesNotMatch(render(product, customization, true), /aria-invalid="true"|border-red-500/);
  const fixed = render({ ...product, colorMode: "FIXED", textDesigns: [] });
  assert.doesNotMatch(fixed, /<select|type="radio"/);
  assert.match(fixed, />Black<|>White</);
});

test("only Name Keychains use the extra controls; product validation enforces both colors and 10 unique designs", () => {
  assert.equal(keychain.isNameKeychain(product), true);
  assert.equal(keychain.isNameKeychain({ ...product, subcategory: "Design Keychains" }), false);
  assert.equal(productSchema.safeParse(product).success, true);
  for (const change of [
    { baseColorOptions: [] }, { textColorOptions: [] }, { textDesigns: [product.textDesigns[0], product.textDesigns[0]] },
    { textDesigns: Array.from({ length: 11 }, (_, index) => ({ ...product.textDesigns[0], id: `design-${index}` })) },
    { textDesigns: [{ ...product.textDesigns[0], label: " " }] },
    { textDesigns: [{ ...product.textDesigns[0], image: "javascript:alert(1)" }] },
  ]) assert.equal(productSchema.safeParse({ ...product, ...change }).success, false, JSON.stringify(change));
  assert.equal(productSchema.safeParse({ ...product, textDesigns: [] }).success, true);
  assert.equal(productSchema.safeParse({ ...product, colorMode: "FIXED", baseColor: " " }).success, false);
  assert.equal(productSchema.safeParse({ ...product, colorMode: "FIXED", textColor: " " }).success, false);
  assert.equal(productSchema.safeParse({ ...product, colorMode: "FIXED" }).success, true);
});

test("changing category clears customization settings while preserving ordinary color behavior", () => {
  const result = colors.resolveProductCustomizationConfig(productSchema.parse({ ...product, category: "HOME_DECOR", subcategory: null, colorMode: "FIXED" }));
  assert.equal(result.color, "Legacy color");
  assert.deepEqual(plain(result.textDesigns), []);
  assert.equal(result.baseColor, "");
  assert.equal(result.textColor, "");
});

test("cart identities distinguish every fulfillment choice and tolerate legacy carts and separator characters", () => {
  const item = { productId: "keychain-1", customization };
  const original = getCartKey(item);
  for (const change of [{ printedName: "Rafi" }, { baseColor: "Blue" }, { textColor: "White" }, { designId: "design-2" }, { notes: "Other instructions" }]) {
    assert.notEqual(getCartKey({ ...item, customization: { ...customization, ...change } }), original);
  }
  assert.equal(getCartKey({ ...item, customization: { ...customization, printedName: " Sara ", designLabel: "Renamed" } }), original);
  assert.equal(getCartKey({ productId: "old" }), getCartKey({ productId: "old", customization: undefined }));
  assert.notEqual(getCartKey({ productId: "a__b", selectedSize: "c" }), getCartKey({ productId: "a", selectedSize: "b__c" }));
});

test("checkout snapshots database colors and design labels and rejects missing or stale selections", () => {
  const resolved = checkout.resolveCheckoutCustomization({ ...product, colorMode: "FIXED" }, { ...customization, baseColor: "Forged", textColor: "Forged", designLabel: "Forged" });
  assert.equal(resolved.baseColor, "Black");
  assert.equal(resolved.textColor, "White");
  assert.equal(resolved.designLabel, "Rounded");
  assert.equal(resolved.printedName, "Sara");
  for (const [saved, selection] of [[product, undefined], [product, { ...customization, printedName: " " }], [product, { ...customization, baseColor: "Green" }], [product, { ...customization, textColor: "Green" }], [product, { ...customization, designId: undefined }], [{ ...product, textDesigns: [] }, customization]]) {
    assert.throws(() => checkout.resolveCheckoutCustomization(saved, selection));
  }
  assert.equal(checkout.resolveCheckoutCustomization({ ...product, category: "LAMPS" }, customization), undefined);
  assert.ok(checkout.resolveCheckoutCustomization({ ...product, textDesigns: [] }, { ...customization, designId: undefined }));
  assert.equal(checkout.checkoutCustomizationSchema.safeParse({ ...customization, printedName: "a".repeat(81) }).success, false);
  assert.equal(checkout.checkoutCustomizationSchema.safeParse({ ...customization, notes: "a".repeat(501) }).success, false);
});

function orderService(savedProduct = product) {
  const saved = [];
  const emailed = [];
  const tx = {
    product: { findMany: async () => [savedProduct], updateMany: async () => ({ count: 1 }) },
    order: { create: async ({ data }) => { saved.push(data); return { ...data, id: "order-1", items: data.items.create }; } },
  };
  const { createOrder } = loadTypeScript("src/lib/orders.ts", {
    "@/lib/db": { prisma: { $transaction: (callback) => callback(tx) } },
    "@/lib/bangladeshDistricts": { findBangladeshDistrict: () => "Dhaka", getShippingMethodForDistrict: () => "INSIDE_DHAKA" },
    "@/lib/orderAddress": { buildOrderAddress: () => "Dhaka" }, zod,
    "@/lib/shipping": { getShippingCost: async () => 60 },
    "@/lib/productImages": { resolveStorageImageUrl: (url) => url },
    "@/lib/utils": { calculateDiscountedPrice: (price, percent) => Math.ceil(price * (1 - percent / 100)) },
    "@/lib/orderEmails": { sendOrderEmails: async (order) => emailed.push(order) },
    "@/lib/keychainCheckout": checkout, "@/lib/nameKeychain": keychain,
  });
  const input = { customerName: "Customer", customerEmail: "customer@gmail.com", customerPhone: "01712345678", district: "Dhaka", areaVillage: "Area", townCityThana: "City", items: [{ productId: product.id, quantity: 2, customization, unitPrice: 1 }] };
  return { createOrder, input, saved, emailed };
}

test("order transaction persists separate customizations with authoritative pricing and passes snapshots to email", async () => {
  const service = orderService();
  service.input.items.push({ ...service.input.items[0], customization: { ...customization, printedName: "Rafi" } });
  const result = await service.createOrder(service.input);
  assert.equal(result.success, true);
  assert.equal(result.total, 600);
  const items = service.saved[0].items.create;
  assert.equal(items.length, 2);
  assert.equal(items[0].unitPrice, 135);
  assert.equal(items[0].color, null);
  assert.equal(items[0].customization.designLabel, "Rounded");
  assert.equal(items[1].customization.printedName, "Rafi");
  assert.equal(service.emailed[0].items[0].customization.notes, customization.notes);
});

test("invalid, stale and pre-feature name-keychain carts cannot create orders or send email", async () => {
  for (const selection of [undefined, { ...customization, baseColor: "Gone" }, { ...customization, designId: "deleted" }, { ...customization, printedName: " " }]) {
    const service = orderService();
    service.input.items[0].customization = selection;
    const result = await service.createOrder(service.input);
    assert.equal(result.success, false);
    assert.equal(service.saved.length, 0);
    assert.equal(service.emailed.length, 0);
    assert.match(result.error, /name|cart|color|design/i);
  }
});

test("ordinary orders ignore supplied customization and retain their color", async () => {
  const service = orderService({ ...product, category: "LAMPS", subcategory: null, colorMode: "FIXED", color: "Black" });
  assert.equal((await service.createOrder(service.input)).success, true);
  assert.equal(service.saved[0].items.create[0].color, "Black");
  assert.equal(service.saved[0].items.create[0].customization, undefined);
});

test("customer and admin emails escape personalization and preserve it in plain text", () => {
  const { buildOrderEmails } = loadTypeScript("src/lib/orderEmailTemplates.ts", { "@/lib/nameKeychain": keychain });
  const messages = buildOrderEmails({ id: "order-1", orderNumber: "3D-TEST", customerName: "Customer", customerPhone: "01712345678", customerEmail: "customer@gmail.com", address: "Dhaka", shippingMethod: "INSIDE_DHAKA", shippingCost: 60, subtotal: 135, total: 195, paymentMethod: "COD", createdAt: new Date(), items: [{ productName: "Keychain", quantity: 1, unitPrice: 135, totalPrice: 135, customization: { ...customization, printedName: "<Sara>", designLabel: "Rounded", notes: '<img src=x onerror="alert(1)">' } }] }, { from: "shop@example.com", adminEmail: "admin@example.com", replyTo: "help@example.com", siteUrl: "https://example.com" });
  assert.equal(messages.length, 2);
  for (const message of messages) {
    assert.match(message.html, /Name: &lt;Sara&gt;/);
    assert.doesNotMatch(message.html, /<img src=x/);
    assert.match(message.text, /Base: Black · Text: Red/);
    assert.match(message.text, /Design: Rounded/);
    assert.match(message.text, /Instructions:/);
  }
});

test("design upload has an independent limit, restricts format/size, and requires admin access", async () => {
  let session = {};
  const uploaded = [];
  const { POST } = loadTypeScript("src/app/api/upload/route.ts", {
    "next/server": nextServer, "@/lib/auth": { getSession: async () => session }, "@/lib/nameKeychain": keychain,
    "@/lib/productImages": { getProductImageLimit: () => 1, createDraftFolderKey: () => "draft-test", deleteProductImages: async () => {}, uploadProductImage: async (file) => { uploaded.push(file); return `https://example.com/${file.name}`; } },
  });
  const image = new File(["test"], "design.webp", { type: "image/webp" });
  const request = (files, purpose = "text-design") => ({ formData: async () => ({ getAll: () => files, get: (key) => key === "purpose" ? purpose : null }) });
  assert.equal((await POST(request(Array(10).fill(image)))).status, 200);
  assert.equal(uploaded.length, 10);
  for (const files of [Array(11).fill(image), [new File(["x"], "test.svg", { type: "image/svg+xml" })], [new File([new Uint8Array(1024 * 1024 + 1)], "big.png", { type: "image/png" })]]) {
    assert.equal((await POST(request(files))).status, 400);
  }
  assert.equal(uploaded.length, 10);
  assert.equal((await POST(request([image, image], "product"))).status, 400);
  session = null;
  assert.equal((await POST(request([image]))).status, 401);
});

function mediaService() {
  const prefix = "https://store.test/storage/v1/object/public/product-images/";
  const files = new Set();
  const deleted = [];
  const helpers = loadTypeScript("src/lib/productImages.ts", {
    "@/lib/imageVariants": imageVariants,
    "@/lib/optimizeProductImage": {},
    crypto,
    "@/lib/nameKeychain": keychain,
    "@/lib/productColors": colors,
    "@/lib/supabaseAdmin": {
      productImageBucket: "product-images",
      getSupabaseAdmin: () => ({ storage: { from: () => ({
        getPublicUrl: (path) => ({ data: { publicUrl: prefix + path } }),
        copy: async (source, target) => { assert.ok(files.has(source), `Missing ${source}`); if (files.has(target)) return { error: { message: "Already exists" } }; files.add(target); return { error: null }; },
        remove: async (paths) => { for (const path of paths) { files.delete(path); deleted.push(path); } return { error: null }; },
      }) } }),
    },
  }, { process: { env: {} } });
  return { helpers, files, prefix, deleted };
}

function productRoutes(media, savedProduct = product) {
  let existing = { ...savedProduct };
  const mutations = [];
  let failUpdate = false;
  const db = {
    findUnique: async () => existing,
    create: async ({ data }) => { mutations.push("create"); return { ...data, id: product.id }; },
    update: async ({ data }) => {
      if (failUpdate) throw new Error("Database unavailable");
      mutations.push("update"); existing = { ...existing, ...data }; return existing;
    },
    delete: async () => { mutations.push("delete"); return existing; },
  };
  const deps = {
    "next/server": nextServer, "next/cache": { revalidatePath: () => {}, revalidateTag: () => {} },
    "@/lib/db": { prisma: { product: db } }, "@/lib/adminSession": { getCurrentAdmin: async () => ({ username: "owner" }) },
    "@/lib/productColors": colors, "@/lib/productSearch": { PRODUCT_SEARCH_CACHE_TAG: "search" },
    "@/lib/productCatalog": { PRODUCT_CATALOG_CACHE_TAG: "catalog" }, "@/lib/productCatalogConfig": {}, "@/lib/pagination": {}, "@/lib/categories": {},
    "@/lib/validation": { productSchema }, "@/lib/productImages": media.helpers,
  };
  return { update: loadTypeScript("src/app/api/products/[id]/route.ts", deps), create: loadTypeScript("src/app/api/products/route.ts", deps), mutations, failUpdate: () => { failUpdate = true; } };
}

test("finalizing media moves photos and designs together and hydrates their URLs", async () => {
  const media = mediaService();
  media.files.add("products/draft-test/shared.webp");
  const design = { id: "one", label: "Rounded", image: media.prefix + "products/draft-test/shared.webp" };
  const result = await media.helpers.finalizeProductMedia([design.image], [design], "product-1");
  assert.equal(result.images[0], "products/product-1/shared.webp");
  assert.equal(result.textDesigns[0].image, result.images[0]);
  assert.equal(media.files.size, 1);
  assert.equal(media.helpers.hydrateProductImages(result).textDesigns[0].image, media.prefix + result.images[0]);
});

test("partial product edits preserve color configuration and existing design IDs/labels", async () => {
  const media = mediaService();
  const saved = { ...product, textDesigns: [{ ...product.textDesigns[0], image: "products/keychain-1/design.webp" }] };
  const routes = productRoutes(media, saved);
  const response = await routes.update.PUT({ json: async () => ({ name: "Updated keychain" }) }, { params: { id: product.id } });
  assert.equal(response.status, 200);
  const updated = await response.json();
  assert.equal(updated.colorMode, "OPTIONS");
  assert.deepEqual(updated.baseColorOptions, ["Black", "Blue"]);
  assert.deepEqual(updated.textColorOptions, ["White", "Red"]);
  assert.equal(updated.textDesigns[0].id, "design-1");
  assert.equal(updated.textDesigns[0].label, "Rounded");
  assert.equal(updated.name, "Updated keychain");
});

test("partial edits cannot bypass name-keychain validation", async () => {
  const media = mediaService();
  for (const body of [{ textColorOptions: [] }, { textDesigns: Array(11).fill(product.textDesigns[0]) }]) {
    const routes = productRoutes(media);
    const response = await routes.update.PUT({ json: async () => body }, { params: { id: product.id } });
    assert.equal(response.status, 400);
    assert.deepEqual(routes.mutations, []);
  }
});

test("admin create persists finalized designs and delete cleans design media", async () => {
  const media = mediaService();
  const draftRef = "products/draft-designs/font.webp";
  media.files.add(draftRef);
  const routes = productRoutes(media);
  const response = await routes.create.POST({ json: async () => ({ ...product, textDesigns: [{ ...product.textDesigns[0], image: media.prefix + draftRef }] }) });
  assert.equal(response.status, 201);
  const created = await response.json();
  assert.equal(created.textDesigns[0].image, media.prefix + `products/${product.id}/font.webp`);
  assert.deepEqual(routes.mutations, ["create", "update"]);
  assert.equal((await routes.update.DELETE({}, { params: { id: product.id } })).status, 200);
  assert.equal(media.files.size, 0);
});

test("removing a design preserves its image when the same file is still a product photo", async () => {
  const media = mediaService();
  const shared = "products/keychain-1/shared.webp";
  media.files.add(shared);
  const routes = productRoutes(media, { ...product, images: [shared], textDesigns: [{ ...product.textDesigns[0], image: shared }] });
  assert.equal((await routes.update.PUT({ json: async () => ({ textDesigns: [] }) }, { params: { id: product.id } })).status, 200);
  assert.ok(media.files.has(shared));
  assert.deepEqual(media.deleted, []);
});

test("re-uploading an existing design reuses its saved content without a storage copy collision", async () => {
  const media = mediaService();
  const saved = "products/keychain-1/hash.webp";
  const draft = "products/draft-replace/hash.webp";
  media.files.add(saved); media.files.add(draft);
  const routes = productRoutes(media, { ...product, textDesigns: [{ ...product.textDesigns[0], image: saved }] });
  const response = await routes.update.PUT({ json: async () => ({ textDesigns: [{ ...product.textDesigns[0], image: media.prefix + draft }] }) }, { params: { id: product.id } });
  assert.equal(response.status, 200);
  assert.deepEqual([...media.files], [saved]);
});

test("failed product saves clean newly finalized design files without deleting existing media", async () => {
  for (const create of [false, true]) {
    const media = mediaService();
    const previous = "products/keychain-1/previous.webp";
    const draft = "products/draft-new/new.webp";
    media.files.add(previous); media.files.add(draft);
    const routes = productRoutes(media, { ...product, images: [previous], textDesigns: [] });
    routes.failUpdate();
    const body = { ...product, images: [], textDesigns: [{ ...product.textDesigns[0], image: media.prefix + draft }] };
    const response = create ? await routes.create.POST({ json: async () => body }) : await routes.update.PUT({ json: async () => body }, { params: { id: product.id } });
    assert.equal(response.status, 500);
    assert.deepEqual([...media.files], [previous]);
    if (create) assert.ok(routes.mutations.includes("delete"));
  }
});

test("additive migration preserves old colors/orders and gives new rows safe defaults", async () => {
  const db = await PGlite.create();
  try {
    for (const migration of ["20260425000000_initial", "20260528000000_category_taxonomy_phase1", "20260830093000_product_color_modes_drop_specs", "20260927090000_rename_custom_category_to_keychains"]) {
      await db.exec(readFileSync(new URL(`../prisma/migrations/${migration}/migration.sql`, import.meta.url), "utf8"));
    }
    await db.exec(`CREATE TABLE order_items (id TEXT PRIMARY KEY); INSERT INTO order_items VALUES ('old-order');
      INSERT INTO products (id,name,description,price,category,subcategory,color,"colorMode","colorOptions",size,"updatedAt") VALUES
      ('fixed','Name','Test',100,'KEYCHAINS','Name Keychains','Black','FIXED','{}','Standard',NOW()),
      ('options','Name','Test',100,'KEYCHAINS','Name Keychains','Black, Blue','OPTIONS','{Black,Blue}','Standard',NOW()),
      ('other','Lamp','Test',100,'LAMPS',NULL,'White','FIXED','{}','Standard',NOW());`);
    await db.exec(readFileSync(new URL("../prisma/migrations/20261015000000_name_keychain_customization/migration.sql", import.meta.url), "utf8"));
    const fixed = (await db.query("SELECT * FROM products WHERE id = 'fixed'")).rows[0];
    assert.equal(fixed.baseColor, "Black");
    assert.equal(fixed.textColor, "As shown");
    assert.deepEqual(fixed.textDesigns, []);
    const options = (await db.query("SELECT * FROM products WHERE id = 'options'")).rows[0];
    assert.deepEqual(options.baseColorOptions, ["Black", "Blue"]);
    assert.deepEqual(options.textColorOptions, ["As shown"]);
    assert.equal((await db.query("SELECT * FROM products WHERE id = 'other'")).rows[0].textColor, "");
    assert.equal((await db.query("SELECT * FROM order_items")).rows[0].customization, null);
  } finally { await db.close(); }
});
