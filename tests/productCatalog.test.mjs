import assert from "node:assert/strict";
import { AsyncLocalStorage } from "node:async_hooks";
import { randomUUID } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test, { after } from "node:test";
import vm from "node:vm";

const require = createRequire(import.meta.url);
globalThis.AsyncLocalStorage ??= AsyncLocalStorage;
const ts = require("typescript");
const nextCache = require("next/cache");
const react = require("next/dist/compiled/react");
const { IncrementalCache } = require("next/dist/server/lib/incremental-cache");
const { nodeFs } = require("next/dist/server/lib/node-fs-methods");
const { staticGenerationAsyncStorage } = require("next/dist/client/components/static-generation-async-storage.external");
const cacheDirectory = mkdtempSync(join(tmpdir(), "3dify-catalog-cache-"));
after(() => rmSync(cacheDirectory, { recursive: true, force: true }));

function loadTypeScript(relativePath, dependencies = {}) {
  const filename = new URL(relativePath, import.meta.url);
  const { outputText } = ts.transpileModule(readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  });
  const exports = {};
  vm.runInNewContext(outputText, {
    exports,
    URLSearchParams,
    require: (name) => {
      assert.ok(name in dependencies, `Unexpected dependency: ${name}`);
      return dependencies[name];
    },
  }, { filename: filename.pathname });
  return exports;
}

const categories = loadTypeScript("../src/lib/categories.ts");

function createCatalog() {
  // Use Next's real cache implementation. Payloads stay in memory; Next's tag
  // manifest is written only to the temporary directory above.
  const incrementalCache = new IncrementalCache({
    fs: nodeFs,
    dev: false,
    appDir: true,
    pagesDir: false,
    flushToDisk: false,
    fetchCache: true,
    minimalMode: false,
    serverDistDir: join(cacheDirectory, "server"),
    requestHeaders: {},
    requestProtocol: "https",
    maxMemoryCacheSize: 1024 * 1024,
    fetchCacheKeyPrefix: randomUUID(),
    getPrerenderManifest: () => ({
      version: 4, routes: {}, dynamicRoutes: {}, notFoundRoutes: [],
      preview: { previewModeId: "catalog-test-preview" },
    }),
    experimental: { ppr: false },
  });
  const calls = { lists: [], counts: [], products: [] };
  const state = { revision: 1, failList: false, failProduct: false };
  const catalog = loadTypeScript("../src/lib/productCatalog.ts", {
    react,
    "next/cache": nextCache,
    "@/lib/categories": categories,
    "@/lib/productImages": { hydrateProductImages: (product) => ({ ...product, images: ["/test-image.webp"] }) },
    "@/lib/db": {
      prisma: {
        product: {
          findMany: async (query) => {
            calls.lists.push(structuredClone(query));
            if (state.failList) throw new Error("Temporary database failure");
            return [{ id: `list-${calls.lists.length}`, name: `Revision ${state.revision}` }];
          },
          count: async (query) => {
            calls.counts.push(structuredClone(query));
            return 37;
          },
          findUnique: async (query) => {
            calls.products.push(structuredClone(query));
            if (state.failProduct) throw new Error("Temporary database failure");
            return { id: query.where.id, name: `Revision ${state.revision}` };
          },
        },
      },
    },
  });

  // Each invocation gets a fresh App Router request context. Shared results
  // must come from the Data Cache rather than render-local React memoization.
  async function navigate(callback) {
    const store = {
      incrementalCache,
      urlPathname: "/products",
      pagePath: "/products/page",
      isStaticGeneration: false,
      prerenderState: null,
    };
    const result = await staticGenerationAsyncStorage.run(store, callback);
    await Promise.all(Object.values(store.pendingRevalidates || {}));
    if (store.revalidatedTags?.length) {
      await incrementalCache.revalidateTag(store.revalidatedTags);
    }
    return result;
  }

  return {
    calls,
    state,
    tag: catalog.PRODUCT_CATALOG_CACHE_TAG,
    list: (params = {}, category = null) => navigate(() => catalog.getProductCatalogData(params, category)),
    product: (id) => navigate(() => catalog.getCachedProductById(id)),
    invalidate: (tag) => navigate(() => nextCache.revalidateTag(tag)),
  };
}

test("separate catalog navigations reuse database results and hydrated images", async () => {
  const catalog = createCatalog();
  const first = await catalog.list();
  catalog.state.revision = 2;
  const second = await catalog.list();
  assert.equal(first.products.length, 1);
  assert.equal(second.products[0].name, "Revision 1");
  assert.deepEqual(second.products[0].images, ["/test-image.webp"]);
  assert.equal(second.totalPages, 4);
  assert.equal(catalog.calls.lists.length, 1);
  assert.equal(catalog.calls.counts.length, 1);
});

test("catalog categories, subcategories, searches, sorts, and pages have separate cache entries", async () => {
  const catalog = createCatalog();
  const variants = [
    [{}, null],
    [{}, "LAMPS"],
    [{ subcategory: "Night Lamps" }, "LAMPS"],
    [{ search: "moon" }, "LAMPS"],
    [{ sort: "price-asc" }, "LAMPS"],
    [{ sort: "price-desc" }, "LAMPS"],
    [{ page: "2" }, "LAMPS"],
  ];
  const ids = [];
  for (const [params, category] of variants) {
    ids.push((await catalog.list(params, category)).products[0].id);
  }
  assert.equal(new Set(ids).size, variants.length);
  for (let index = 0; index < variants.length; index++) {
    const [params, category] = variants[index];
    assert.equal((await catalog.list(params, category)).products[0].id, ids[index]);
  }
  assert.equal(catalog.calls.lists.length, variants.length);
  assert.equal(catalog.calls.counts.length, variants.length);
  assert.equal(catalog.calls.lists[2].where.subcategory, "Night Lamps");
  assert.equal(catalog.calls.lists[6].skip, 12);
});

test("equivalent normalized searches and default filters reuse an entry", async () => {
  const catalog = createCatalog();
  const first = await catalog.list({ search: "  Moon   Lamp  ", sort: "invalid", page: "-2" });
  const second = await catalog.list({ search: "moon lamp", sort: "newest", page: "1" });
  assert.equal(first.search, "Moon   Lamp");
  assert.equal(second.search, "moon lamp");
  assert.equal(second.currentPage, 1);
  assert.equal(first.products[0].id, second.products[0].id);
  assert.equal(catalog.calls.lists.length, 1);
});

test("product details reuse results across requests while keeping IDs separate", async () => {
  const catalog = createCatalog();
  const first = await catalog.product("moon-lamp");
  catalog.state.revision = 2;
  assert.equal((await catalog.product("moon-lamp")).name, first.name);
  assert.equal((await catalog.product("desk-planter")).id, "desk-planter");
  assert.equal((await catalog.product("desk-planter")).name, "Revision 2");
  assert.equal(catalog.calls.products.length, 2);
});

test("failed catalog reads return the fallback without caching the outage", async () => {
  const catalog = createCatalog();
  catalog.state.failList = true;
  assert.equal((await catalog.list()).products.length, 0);
  catalog.state.failList = false;
  const recovered = await catalog.list();
  assert.equal(recovered.products.length, 1);
  assert.equal((await catalog.list()).products[0].id, recovered.products[0].id);
  assert.equal(catalog.calls.lists.length, 2);
});

test("failed product reads retry on the next navigation", async () => {
  const catalog = createCatalog();
  catalog.state.failProduct = true;
  assert.equal(await catalog.product("moon-lamp"), null);
  catalog.state.failProduct = false;
  assert.equal((await catalog.product("moon-lamp")).id, "moon-lamp");
  await catalog.product("moon-lamp");
  assert.equal(catalog.calls.products.length, 2);
});

test("catalog tag invalidation refreshes both lists and product details", async () => {
  const catalog = createCatalog();
  await catalog.list();
  await catalog.product("moon-lamp");
  catalog.state.revision = 2;
  await catalog.invalidate("unrelated-tag");
  assert.equal((await catalog.list()).products[0].name, "Revision 1");
  assert.equal((await catalog.product("moon-lamp")).name, "Revision 1");
  await catalog.invalidate(catalog.tag);
  assert.equal((await catalog.list()).products[0].name, "Revision 2");
  assert.equal((await catalog.product("moon-lamp")).name, "Revision 2");
  assert.equal(catalog.calls.lists.length, 2);
  assert.equal(catalog.calls.products.length, 2);
});
