// Use the project's installed TypeScript compiler; no global ts-node is required.
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const ts = require("typescript");

const filename = path.join(__dirname, "seed.ts");
const { outputText } = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
});
const seed = new Module(filename, module);
seed.filename = filename;
seed.paths = Module._nodeModulePaths(__dirname);
seed._compile(outputText, filename);
