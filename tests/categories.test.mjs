import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import vm from "node:vm";

const require = createRequire(import.meta.url);
const ts = require("typescript");

function loadTypeScript(relativePath) {
  const filename = new URL(relativePath, import.meta.url);
  const { outputText } = ts.transpileModule(readFileSync(filename, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  });
  const exports = {};
  vm.runInNewContext(outputText, { exports }, { filename: filename.pathname });
  return exports;
}

const categories = loadTypeScript("../src/lib/categories.ts");

test("keychains category exposes the new project-wide taxonomy", () => {
  const keychains = categories.categoryByValue.KEYCHAINS;

  assert.equal(keychains.label, "Keychains");
  assert.equal(keychains.seoName, "3D printed keychains");
  assert.equal(keychains.slug, "keychains");
  assert.deepEqual(Array.from(keychains.subcategories), [
    "Figure Keychains",
    "Design Keychains",
    "Name Keychains",
    "Custom Keychains",
  ]);
  assert.equal(categories.getCategoryPath("KEYCHAINS"), "/products/keychains");
  assert.equal(categories.isCategoryValue("KEYCHAINS"), true);
  assert.equal(categories.isCategoryValue("CUSTOM_AND_PERSONALIZED"), false);
});

test("database migration renames the enum value without deleting product data", () => {
  const migration = readFileSync(
    new URL(
      "../prisma/migrations/20260927090000_rename_custom_category_to_keychains/migration.sql",
      import.meta.url
    ),
    "utf8"
  );

  assert.match(
    migration,
    /RENAME VALUE 'CUSTOM_AND_PERSONALIZED' TO 'KEYCHAINS'/
  );
  assert.doesNotMatch(migration, /\b(?:DELETE|DROP|TRUNCATE)\b/i);
});
