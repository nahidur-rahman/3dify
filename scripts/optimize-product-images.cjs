// Dry run by default. --apply creates variants and updates current product refs;
// originals are retained so historical orders and old deployments still work.
require("@next/env").loadEnvConfig(process.cwd());
const { PrismaClient } = require("@prisma/client");
const { createClient } = require("@supabase/supabase-js");
const { createHash } = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const ts = require("typescript");

// Reuse the production encoder without adding a second TS runner dependency.
function loadSource(filename, dependencies = {}) {
  const absolute = path.resolve(__dirname, "..", filename);
  const compiled = new Module(absolute, module);
  compiled.filename = absolute;
  compiled.paths = Module._nodeModulePaths(path.dirname(absolute));
  compiled.require = name => Object.hasOwn(dependencies, name) ? dependencies[name] : require(name);
  compiled._compile(ts.transpileModule(fs.readFileSync(absolute, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
  }).outputText, absolute);
  return compiled.exports;
}
const settings = loadSource("src/lib/imageVariants.ts");
const { optimizeProductImage } = loadSource("src/lib/optimizeProductImage.ts", { "@/lib/imageVariants": settings });
const prisma = new PrismaClient();

async function main() {
  const apply = process.argv.includes("--apply");
  const limitArg = process.argv.find(arg => arg.startsWith("--limit="));
  const limit = limitArg ? Number(limitArg.split("=")[1]) : undefined;
  if (limitArg && (!Number.isInteger(limit) || limit < 1)) throw new Error("Invalid --limit; use a positive product count.");
  const storageOrigin = new URL(process.env.SUPABASE_URL).origin;
  const bucket = process.env.SUPABASE_STORAGE_BUCKET || "product-images";
  const storage = createClient(storageOrigin, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  }).storage.from(bucket);
  const marker = `/storage/v1/object/public/${bucket}/`;
  const products = await prisma.product.findMany({
    select: { id: true, images: true, textDesigns: true, updatedAt: true },
    orderBy: { id: "asc" }, ...(limit ? { take: limit } : {}),
  });
  let inspected = 0; let updated = 0; let failed = 0;
  const reports = [];
  for (const product of products) {
    const created = [];
    try {
      const designs = Array.isArray(product.textDesigns) ? product.textDesigns : [];
      const refs = [...new Set([...product.images, ...designs.map(design => design.image)])];
      const replacements = new Map();
      for (const ref of refs) {
        if (typeof ref !== "string" || settings.productImageSourceHash(ref)) continue;
        let sourcePath = ref;
        if (/^https?:/.test(ref)) {
          const url = new URL(ref);
          if (url.origin !== storageOrigin || !url.pathname.startsWith(marker)) continue;
          sourcePath = decodeURIComponent(url.pathname.slice(marker.length));
        }
        // Only product media; leave homepage assets and unrelated buckets alone.
        if (!/^products\/[a-zA-Z0-9_-]+\/[^/]+$/.test(sourcePath) || sourcePath.split("/").includes("..")) continue;
        const { data: source, error } = await storage.download(sourcePath);
        if (error) throw new Error("Cannot download product source image.");
        const input = Buffer.from(await source.arrayBuffer());
        const hash = createHash("sha256").update(input).digest("hex");
        const folder = sourcePath.slice(0, sourcePath.lastIndexOf("/"));
        const mainPath = `${folder}/${hash}.${settings.IMAGE_VARIANT_VERSION}-main.webp`;
        const variants = await optimizeProductImage(input);
        const sizes = Object.fromEntries(variants.map(({ variant, data }) => [variant, data.length]));
        reports.push({ source: sourcePath, original: input.length, ...sizes,
          mainReductionPercent: Number(((1 - sizes.main / input.length) * 100).toFixed(1)) });
        inspected++;
        if (apply) {
          for (const { variant, data } of variants) {
            const destination = settings.productImageVariant(mainPath, variant);
            const { error: uploadError } = await storage.upload(destination, data, {
              upsert: false, contentType: "image/webp", cacheControl: String(settings.IMAGE_CACHE_SECONDS),
            });
            if (uploadError && uploadError.status !== 409) throw new Error("Cannot upload product image variant.");
            if (!uploadError) created.push(destination);
          }
        }
        replacements.set(ref, mainPath);
      }
      if (apply && replacements.size) {
        // Never overwrite an admin edit that happened while processing this product.
        const result = await prisma.product.updateMany({ where: { id: product.id, updatedAt: product.updatedAt }, data: {
          images: product.images.map(ref => replacements.get(ref) || ref),
          textDesigns: designs.map(design => ({ ...design, image: replacements.get(design.image) || design.image })),
        } });
        if (result.count !== 1) throw new Error("Product changed during processing; retry after the admin edit finishes.");
        updated++;
      }
    } catch {
      failed++;
      if (created.length) {
        const { error } = await storage.remove(created);
        if (error) console.error(`Variant cleanup failed for product ${product.id}; inspect its storage folder.`);
      }
      console.error(`Image processing failed for product ${product.id}; original references retained.`);
    }
  }
  const totals = reports.reduce((sum, report) => {
    for (const key of ["original", "main", "card", "thumbnail"]) sum[key] += report[key];
    return sum;
  }, { original: 0, main: 0, card: 0, thumbnail: 0 });
  const reductionPercent = Object.fromEntries(["main", "card", "thumbnail"].map(variant => [variant,
    totals.original ? Number(((1 - totals[variant] / totals.original) * 100).toFixed(1)) : 0,
  ]));
  console.log(JSON.stringify({ mode: apply ? "apply" : "dry-run", inspected, updated, failed, totals, reductionPercent, reports }, null, 2));
  if (apply) console.log("Redeploy after processing to refresh cached catalog, search and product pages. Original files were retained.");
  if (failed) process.exitCode = 1;
}

main().catch(() => {
  console.error("Image maintenance failed. Check configuration and connectivity; credentials are not logged.");
  process.exitCode = 1;
}).finally(() => prisma.$disconnect());
