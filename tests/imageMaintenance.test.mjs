import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const require = createRequire(import.meta.url);
const source = readFileSync(new URL("../scripts/optimize-product-images.cjs", import.meta.url), "utf8");

async function runMaintenance({ apply = false, concurrentEdit = false, alreadyConverted = false } = {}) {
  const originalPath = "products/product-1/original.jpg";
  const input = await sharp({ create: { width: 1500, height: 1000, channels: 3, background: "blue" } }).jpeg().toBuffer();
  const files = new Map([[originalPath, input]]);
  const product = { id: "product-1", updatedAt: new Date(), images: [originalPath], textDesigns: [] };
  if (alreadyConverted) product.images = [`products/product-1/${"a".repeat(64)}.v1-main.webp`];
  let updates = 0; let uploads = 0; const logs = [];
  let done; const completed = new Promise(resolve => { done = resolve; });
  const prisma = {
    product: {
      findMany: async () => [product],
      updateMany: async ({ data, where }) => {
        assert.equal(where.updatedAt, product.updatedAt);
        updates++;
        if (concurrentEdit) return { count: 0 };
        Object.assign(product, data); return { count: 1 };
      },
    },
    $disconnect: async () => done(),
  };
  const storage = {
    download: async path => ({ data: { arrayBuffer: async () => files.get(path) }, error: null }),
    upload: async (path, data) => { uploads++; files.set(path, data); return { error: null }; },
    remove: async paths => { paths.forEach(path => files.delete(path)); return { error: null }; },
  };
  const process = { argv: ["node", "script", ...(apply ? ["--apply"] : [])], cwd: () => globalThis.process.cwd(),
    env: { SUPABASE_URL: "https://shop.supabase.co", SUPABASE_SERVICE_ROLE_KEY: "test" } };
  vm.runInNewContext(source, {
    require: name => {
      if (name === "@next/env") return { loadEnvConfig() {} };
      if (name === "@prisma/client") return { PrismaClient: class { constructor() { return prisma; } } };
      if (name === "@supabase/supabase-js") return { createClient: () => ({ storage: { from: () => storage } }) };
      return require(name);
    },
    module: { exports: {} }, __dirname: fileURLToPath(new URL("../scripts/", import.meta.url)),
    Buffer, process, URL, console: { log: message => logs.push(message), error() {} },
  });
  await completed;
  return { files, product, updates, uploads, process, report: JSON.parse(logs[0]) };
}

test("maintenance dry run measures real output bytes without any storage or database writes", async () => {
  const result = await runMaintenance();
  assert.equal(result.uploads, 0); assert.equal(result.updates, 0);
  assert.equal(result.files.size, 1); assert.equal(result.report.inspected, 1);
  assert.ok(result.report.reports[0].thumbnail < result.report.reports[0].main);
});

test("maintenance apply creates siblings and updates current references while preserving originals", async () => {
  const result = await runMaintenance({ apply: true });
  assert.equal(result.uploads, 3); assert.equal(result.updates, 1);
  assert.equal(result.files.size, 4);
  assert.ok(result.files.has("products/product-1/original.jpg"));
  assert.match(result.product.images[0], /\.v1-main\.webp$/);
  assert.equal(result.report.updated, 1);
});

test("concurrent product edits prevent overwrites and remove newly generated siblings", async () => {
  const result = await runMaintenance({ apply: true, concurrentEdit: true });
  assert.equal(result.files.size, 1);
  assert.equal(result.product.images[0], "products/product-1/original.jpg");
  assert.equal(result.report.updated, 0); assert.equal(result.report.failed, 1);
  assert.equal(result.process.exitCode, 1);
});

test("already converted photos are skipped on repeat maintenance runs", async () => {
  const result = await runMaintenance({ apply: true, alreadyConverted: true });
  assert.equal(result.uploads, 0); assert.equal(result.updates, 0);
  assert.equal(result.report.inspected, 0);
});
