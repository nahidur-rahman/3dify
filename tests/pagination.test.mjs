import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const ts = require("typescript");

const filename = new URL("../src/lib/pagination.ts", import.meta.url);
const { outputText } = ts.transpileModule(readFileSync(filename, "utf8"), {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
  },
});
const pagination = {};
vm.runInNewContext(outputText, { exports: pagination }, { filename: filename.pathname });

test("normalizes pages and only permits supported admin page sizes", () => {
  assert.equal(pagination.parsePage("4"), 4);
  assert.equal(pagination.parsePage("-2"), 1);
  assert.equal(pagination.parsePage("invalid"), 1);
  assert.equal(pagination.parseAdminPageSize("50"), 50);
  assert.equal(pagination.parseAdminPageSize("5000"), 20);
});

test("uses compact pagination for long result sets", () => {
  assert.deepEqual(
    Array.from(pagination.getPaginationItems(20, 42)),
    [1, "ellipsis", 19, 20, 21, "ellipsis", 42]
  );
  assert.deepEqual(
    Array.from(pagination.getPaginationItems(1, 42)),
    [1, 2, 3, 4, 5, "ellipsis", 42]
  );
});

test("reports visible row ranges without exceeding the total", () => {
  assert.deepEqual(
    { ...pagination.getPaginationRange(2, 20, 37) },
    { start: 21, end: 37 }
  );
  assert.deepEqual(
    { ...pagination.getPaginationRange(1, 20, 0) },
    { start: 0, end: 0 }
  );
});
