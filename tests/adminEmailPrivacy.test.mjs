import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import vm from "node:vm";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const records = [
  { id: "super-1", username: "super-one", name: "Super One", email: "super-one@example.com", role: "SUPER", createdAt: new Date("2026-01-01") },
  { id: "super-2", username: "super-two", name: "Super Two", email: "super-two@example.com", role: "SUPER", createdAt: new Date("2026-01-02") },
  { id: "admin-1", username: "admin-one", name: "Admin One", email: "admin-one@example.com", role: "ADMIN", createdAt: new Date("2026-01-03") },
  { id: "admin-2", username: "admin-two", name: "Admin Two", email: "admin-two@example.com", role: "ADMIN", createdAt: new Date("2026-01-04") },
];

function createPage(currentAdmin) {
  const calls = [];
  const component = () => null;
  const dependencies = {
    "react/jsx-runtime": require("react/jsx-runtime"),
    "@/lib/db": { prisma: { admin: { findMany: async (query) => {
      calls.push(query);
      return records;
    } } } },
    "@/lib/adminSession": { getCurrentAdmin: async () => currentAdmin },
    "next/navigation": { redirect: (path) => { throw new Error(`Redirect: ${path}`); } },
    "@/components/AdminForm": { default: component },
    "@/components/ChangeAdminPasswordButton": { default: component },
    "@/components/ui/Card": { Card: component, CardContent: component, CardHeader: component, CardTitle: component },
    "./DeleteAdminButton": { default: component },
  };
  const filename = new URL("../src/app/admin/(dashboard)/admins/page.tsx", import.meta.url);
  const { outputText } = ts.transpileModule(readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  });
  const exports = {};
  vm.runInNewContext(outputText, {
    exports,
    require: (name) => {
      assert.ok(name in dependencies, `Unexpected dependency: ${name}`);
      return dependencies[name];
    },
  }, { filename: filename.pathname });
  return { render: exports.default, calls };
}

test("regular admins receive no SUPER email in table text, tooltips, or component props", async () => {
  const page = createPage(records[2]);
  const output = JSON.stringify(await page.render());
  for (const admin of records.filter((record) => record.role === "SUPER")) {
    assert.ok(!output.includes(admin.email));
    assert.ok(output.includes(admin.username));
  }
  assert.ok(output.includes("Hidden"));
  assert.ok(output.includes(records[2].email));
  assert.ok(output.includes(records[3].email));
  assert.equal(page.calls[0].select.password, undefined);
});

test("each SUPER admin can see their own email, while other SUPER emails remain hidden", async () => {
  for (const currentAdmin of records.filter((record) => record.role === "SUPER")) {
    const output = JSON.stringify(await createPage(currentAdmin).render());
    assert.ok(output.includes(currentAdmin.email));
    for (const admin of records.filter((record) => record.role === "SUPER" && record.id !== currentAdmin.id)) {
      assert.ok(!output.includes(admin.email));
    }
    assert.ok(output.includes(records[2].email));
    assert.ok(output.includes(records[3].email));
  }
});

test("unauthenticated requests redirect before fetching the administrator list", async () => {
  const page = createPage(null);
  await assert.rejects(page.render(), /Redirect: \/admin\/login/);
  assert.equal(page.calls.length, 0);
});
