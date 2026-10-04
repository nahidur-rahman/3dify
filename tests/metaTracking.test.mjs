import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import vm from "node:vm";

const require = createRequire(import.meta.url);
const ts = require("typescript");

function loadTypeScript(relativePath, dependencies = {}, globals = {}) {
  const filename = new URL(relativePath, import.meta.url);
  const { outputText } = ts.transpileModule(readFileSync(filename, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  });
  const exports = {};
  vm.runInNewContext(
    outputText,
    {
      exports,
      require: (name) => {
        assert.ok(name in dependencies, `Unexpected dependency: ${name}`);
        return dependencies[name];
      },
      ...globals,
    },
    { filename: filename.pathname }
  );
  return exports;
}

function loadConversions(env = {}, fetchImpl = async () => ({ ok: true })) {
  return loadTypeScript(
    "../src/lib/metaConversions.ts",
    { crypto: require("node:crypto") },
    { process: { env }, fetch: fetchImpl, URL, AbortSignal, console: { error() {} } }
  );
}

const sha256 = (value) => createHash("sha256").update(value).digest("hex");

test("Bangladeshi phone numbers are normalized to the 880 country code", () => {
  const { normalizeBdPhoneForMeta } = loadConversions();

  assert.equal(normalizeBdPhoneForMeta("01712345678"), "8801712345678");
  assert.equal(normalizeBdPhoneForMeta("+880 1712-345678"), "8801712345678");
  assert.equal(normalizeBdPhoneForMeta("1712345678"), "8801712345678");
  assert.equal(normalizeBdPhoneForMeta("12345"), null);
});

test("order contact details are hashed before they leave the server", () => {
  const { buildOrderUserData } = loadConversions();
  const userData = buildOrderUserData({
    customerName: "  Rahim Uddin Khan ",
    customerPhone: "01712345678",
    customerEmail: " Rahim@Gmail.com ",
  });

  assert.deepEqual(Array.from(userData.ph), [sha256("8801712345678")]);
  assert.deepEqual(Array.from(userData.em), [sha256("rahim@gmail.com")]);
  assert.deepEqual(Array.from(userData.fn), [sha256("rahim")]);
  assert.deepEqual(Array.from(userData.ln), [sha256("khan")]);
  assert.ok(!JSON.stringify(userData).includes("01712345678"));
});

test("the click id is rebuilt from the landing URL", () => {
  const { buildFbcFromUrl } = loadConversions();

  assert.equal(
    buildFbcFromUrl("https://example.com/products/1?fbclid=abc123", 1700000000000),
    "fb.1.1700000000000.abc123"
  );
  assert.equal(buildFbcFromUrl("https://example.com/products/1"), null);
  assert.equal(buildFbcFromUrl("not a url"), null);
});

test("no request is made until the pixel id and token are configured", async () => {
  let calls = 0;
  const fetchImpl = async () => {
    calls += 1;
    return { ok: true };
  };
  const event = {
    event_name: "Purchase",
    event_time: 1,
    event_id: "purchase-1",
    action_source: "website",
    user_data: {},
  };

  assert.equal(await loadConversions({}, fetchImpl).sendMetaEvents([event]), false);
  assert.equal(
    await loadConversions(
      { NEXT_PUBLIC_META_PIXEL_ID: "123456" },
      fetchImpl
    ).sendMetaEvents([event]),
    false
  );
  assert.equal(calls, 0);

  const configured = loadConversions(
    { NEXT_PUBLIC_META_PIXEL_ID: "123456", META_CAPI_ACCESS_TOKEN: "token" },
    fetchImpl
  );
  assert.equal(configured.isMetaConversionsConfigured(), true);
  assert.equal(await configured.sendMetaEvents([event]), true);
  assert.equal(calls, 1);
});

test("a failing Conversions API request never throws", async () => {
  const { sendMetaEvents } = loadConversions(
    { NEXT_PUBLIC_META_PIXEL_ID: "123456", META_CAPI_ACCESS_TOKEN: "token" },
    async () => {
      throw new Error("network down");
    }
  );

  assert.equal(
    await sendMetaEvents([
      {
        event_name: "Purchase",
        event_time: 1,
        event_id: "purchase-1",
        action_source: "website",
        user_data: {},
      },
    ]),
    false
  );
});

test("catalog feed escapes product text and skips products without images", () => {
  const { buildMetaCatalogFeed } = loadTypeScript("../src/lib/metaCatalogFeed.ts");
  const feed = buildMetaCatalogFeed({
    title: "3Dify BD",
    siteUrl: "https://example.com/",
    products: [
      {
        id: "p1",
        name: "Vase <Large> & Co",
        description: "",
        price: 500,
        salePrice: 425,
        inStock: true,
        link: "https://example.com/products/p1",
        images: ["https://cdn.example.com/a.webp", "https://cdn.example.com/b.webp"],
        categoryLabel: "Vases & Planters",
      },
      {
        id: "p2",
        name: "No image",
        description: "Hidden",
        price: 100,
        salePrice: null,
        inStock: false,
        link: "https://example.com/products/p2",
        images: [],
        categoryLabel: "Lamps",
      },
    ],
  });

  assert.match(feed, /<g:id>p1<\/g:id>/);
  assert.match(feed, /<g:title>Vase &lt;Large&gt; &amp; Co<\/g:title>/);
  assert.match(feed, /<g:description>Vase &lt;Large&gt; &amp; Co<\/g:description>/);
  assert.match(feed, /<g:price>500\.00 BDT<\/g:price>/);
  assert.match(feed, /<g:sale_price>425\.00 BDT<\/g:sale_price>/);
  assert.match(feed, /<g:additional_image_link>https:\/\/cdn\.example\.com\/b\.webp</);
  assert.doesNotMatch(feed, /<g:id>p2<\/g:id>/);
});
