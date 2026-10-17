import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import vm from "node:vm";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const { outputText } = ts.transpileModule(readFileSync(new URL("../prisma/seed.ts", import.meta.url), "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
});

async function runSeed({ freshStart = false, env = {}, failCreate = false } = {}) {
  const calls = [];
  let saved;
  let sampleCount = 0;
  let disconnected;
  const done = new Promise(resolve => { disconnected = resolve; });
  const tx = Object.fromEntries(["orderItem", "order", "product", "adminLoginChallenge", "adminAuthRateLimit", "admin"].map(table => [table, {
    deleteMany: async () => { calls.push(table); return { count: 1 }; },
  }]));
  tx.admin.upsert = async data => {
    calls.push("upsert");
    saved = data;
    if (failCreate) throw new Error("database detail that should not be logged");
    return data.create;
  };
  const prisma = {
    $transaction: async fn => {
      calls.push("begin");
      try { const result = await fn(tx); calls.push("commit"); return result; }
      catch (error) { calls.push("rollback"); throw error; }
    },
    product: {
      findFirst: async () => null,
      create: async () => { sampleCount++; },
    },
    $disconnect: async () => { disconnected(); },
  };
  const process = {
    env: { ADMIN_EMAIL: "Admin@example.com", ADMIN_PASSWORD: "TestPassword1!", ...env },
    argv: freshStart ? ["node", "seed", "--fresh-start"] : ["node", "seed"],
  };
  const errors = [];
  vm.runInNewContext(outputText, {
    exports: {}, Buffer, process,
    console: { log() {}, error: (...args) => errors.push(args.join(" ")) },
    require: name => {
      if (name === "bcryptjs") return { hash: async (password, cost) => { assert.equal(cost, 12); return `hashed:${password}`; } };
      assert.equal(name, "@prisma/client");
      return {
        PrismaClient: class { constructor() { return prisma; } },
        Prisma: { TransactionIsolationLevel: { Serializable: "Serializable" }, PrismaClientKnownRequestError: class extends Error {}, PrismaClientInitializationError: class extends Error {} },
        Category: {},
      };
    },
  });
  await done;
  return { calls, saved, sampleCount, process, errors };
}

test("fresh start clears only requested tables and seeds a SUPER admin, even when samples are enabled", async () => {
  const result = await runSeed({ freshStart: true, env: { SEED_SAMPLE_PRODUCTS: "true" } });
  assert.deepEqual(result.calls, ["begin", "orderItem", "order", "product", "adminLoginChallenge", "adminAuthRateLimit", "admin", "upsert", "commit"]);
  assert.equal(result.sampleCount, 0);
  assert.equal(result.saved.create.role, "SUPER");
  assert.equal(result.saved.create.email, "admin@example.com");
  assert.equal(result.saved.create.password, "hashed:TestPassword1!");
});

test("ordinary seed preserves records and defaults to no samples", async () => {
  const result = await runSeed();
  assert.deepEqual(result.calls, ["begin", "upsert", "commit"]);
  assert.equal(result.sampleCount, 0);
});

test("missing credentials fail before deletion or transaction", async () => {
  for (const env of [{ ADMIN_PASSWORD: "" }, { ADMIN_EMAIL: "" }, { ADMIN_PASSWORD: "é".repeat(37) }]) {
    const result = await runSeed({ freshStart: true, env });
    assert.deepEqual(result.calls, []);
    assert.equal(result.process.exitCode, 1);
  }
});

test("admin creation failure rolls back reset and hides database details", async () => {
  const result = await runSeed({ freshStart: true, failCreate: true });
  assert.equal(result.calls.at(-1), "rollback");
  assert.ok(!result.calls.includes("commit"));
  assert.equal(result.process.exitCode, 1);
  assert.ok(!result.errors.join(" ").includes("database detail"));
});
