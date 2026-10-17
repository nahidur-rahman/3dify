// Dry run by default. Only the products/ prefix is eligible for deletion.
require("@next/env").loadEnvConfig(process.cwd());

const projectUrl = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const bucket = process.env.SUPABASE_STORAGE_BUCKET || "product-images";
const apply = process.argv.includes("--apply");

async function request(endpoint, method, body) {
  const response = await fetch(`${projectUrl}/storage/v1/${endpoint}`, {
    method,
    headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) throw new Error(`Storage request failed (HTTP ${response.status}).`);
  return response.json();
}

async function listFiles(prefix = "") {
  const files = [];
  for (let offset = 0; ; offset += 100) {
    const entries = await request(`object/list/${encodeURIComponent(bucket)}`, "POST", {
      prefix, limit: 100, offset, sortBy: { column: "name", order: "asc" },
    });
    if (!Array.isArray(entries)) throw new Error("Unexpected storage listing response.");
    for (const entry of entries) {
      if (!entry.name || entry.name.includes("/") || [".", ".."].includes(entry.name)) {
        throw new Error("Unexpected storage entry name; cleanup stopped.");
      }
      const path = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (entry.id) files.push({ path, id: entry.id, updatedAt: entry.updated_at, metadata: entry.metadata });
      else files.push(...await listFiles(path));
    }
    if (entries.length < 100) break;
  }
  return files;
}

async function main() {
  if (!projectUrl || !serviceKey) throw new Error("Missing Supabase configuration.");
  const before = await listFiles();
  const products = before.filter(file => file.path.startsWith("products/"));
  const protectedFiles = before.filter(file => !file.path.startsWith("products/"));
  console.log(JSON.stringify({
    mode: apply ? "delete" : "dry-run",
    productFiles: products.length,
    preservedFiles: protectedFiles.map(file => file.path),
  }, null, 2));
  if (!apply) return;

  // Every submitted path must remain inside the explicit product prefix.
  for (let offset = 0; offset < products.length; offset += 100) {
    const paths = products.slice(offset, offset + 100).map(file => file.path);
    if (paths.some(path => !path.startsWith("products/") || path.split("/").some(part => part === ".." || part === "."))) {
      throw new Error("Unsafe deletion path; cleanup stopped.");
    }
    await request(`object/${encodeURIComponent(bucket)}`, "DELETE", { prefixes: paths });
    console.log(`Deleted ${Math.min(offset + 100, products.length)} of ${products.length} product files.`);
  }
  const after = await listFiles();
  const remainingProducts = after.filter(file => file.path.startsWith("products/"));
  const afterByPath = new Map(after.map(file => [file.path, file]));
  const preserved = protectedFiles.every(file => JSON.stringify(file) === JSON.stringify(afterByPath.get(file.path)));
  if (remainingProducts.length || !preserved) throw new Error("Storage verification failed; inspect remaining files.");
  console.log(JSON.stringify({ remainingProductFiles: 0, preservedFilesVerified: protectedFiles.length }));
}

main().catch(error => {
  // Do not print connection details or service credentials.
  console.error(error.message.startsWith("Storage ") || error.message.startsWith("Unexpected ")
    || error.message.startsWith("Unsafe ") || error.message.startsWith("Missing ")
    ? error.message : "Storage cleanup failed; check connectivity and configuration.");
  process.exitCode = 1;
});
