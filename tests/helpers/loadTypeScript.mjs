import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import vm from "node:vm";

const require = createRequire(import.meta.url);
const ts = require("typescript");

export function loadTypeScript(path, dependencies = {}, globals = {}) {
  const filename = new URL(`../../${path}`, import.meta.url);
  const { outputText } = ts.transpileModule(readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  });
  const exports = {};
  vm.runInNewContext(outputText, {
    exports, Buffer, TextEncoder, TextDecoder, Uint8Array, Date, URL, URLSearchParams, Headers, AbortSignal, AbortController,
    console: { error: () => {} }, ...globals,
    require: (name) => {
      assert.ok(name in dependencies, `Unexpected dependency in ${path}: ${name}`);
      return dependencies[name];
    },
  }, { filename: filename.pathname });
  return exports;
}
