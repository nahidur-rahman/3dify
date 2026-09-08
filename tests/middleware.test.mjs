import assert from "node:assert/strict";
import { webcrypto } from "node:crypto";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import vm from "node:vm";
import { SignJWT, jwtVerify } from "jose";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const nextServer = require("next/server");
const { getMiddlewareMatchers } = require("next/dist/build/analysis/get-page-static-info");
const { getMiddlewareRouteMatcher } = require("next/dist/shared/lib/router/utils/middleware-route-matcher");
const secret = new TextEncoder().encode("middleware-regression-test-secret");
const cookieName = "admin-token";

globalThis.crypto ??= webcrypto;

function loadTypeScript(relativePath, dependencies = {}) {
  const filename = new URL(relativePath, import.meta.url);
  const { outputText } = ts.transpileModule(readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  });
  const exports = {};
  vm.runInNewContext(outputText, {
    exports,
    URL,
    URLSearchParams,
    Headers,
    require: (name) => {
      assert.ok(name in dependencies, `Unexpected dependency: ${name}`);
      return dependencies[name];
    },
  }, { filename: filename.pathname });
  return exports;
}

const categories = loadTypeScript("../src/lib/categories.ts");
const { middleware, config } = loadTypeScript("../middleware.ts", {
  "next/server": nextServer,
  jose: { jwtVerify },
  "@/lib/categories": categories,
  "@/lib/authConfig": { ADMIN_TOKEN_COOKIE: cookieName, JWT_SECRET: secret },
});
const matches = getMiddlewareRouteMatcher(getMiddlewareMatchers(config.matcher, {}));

function request(path, token) {
  return new nextServer.NextRequest(`https://example.com${path}`, {
    headers: token ? { cookie: `${cookieName}=${token}` } : {},
  });
}

test("only the legacy catalog URL and admin routes run middleware", () => {
  for (const path of ["/products", "/admin", "/admin/login", "/admin/products/123/edit"]) {
    assert.equal(matches(path, {}, {}), true, path);
  }
  for (const path of ["/", "/products/lamps", "/products/product-123", "/administrator"]) {
    assert.equal(matches(path, {}, {}), false, path);
  }
});

test("public product paths stay public even if middleware is invoked directly", async () => {
  for (const path of ["/products/lamps", "/products/product-123", "/administrator"]) {
    const response = await middleware(request(path, "invalid-admin-cookie"));
    assert.equal(response.headers.get("x-middleware-next"), "1", path);
    assert.equal(response.headers.get("location"), null, path);
    assert.equal(response.headers.get("set-cookie"), null, path);
  }
});

test("legacy category URLs redirect once to the canonical URL with filters", async () => {
  const response = await middleware(request(
    "/products?category=LAMPS&search=moon&sort=price-asc&subcategory=Night%20Lamps&page=2"
  ));
  assert.equal(response.status, 308);
  const target = new URL(response.headers.get("location"));
  assert.equal(target.pathname, "/products/lamps");
  assert.deepEqual(Object.fromEntries(target.searchParams), {
    search: "moon", sort: "price-asc", subcategory: "Night Lamps", page: "2",
  });
  assert.equal(matches(target.pathname, {}, {}), false);
});

test("catalog requests without a recognized category stay public", async () => {
  for (const path of ["/products", "/products?category=unknown"]) {
    const response = await middleware(request(path));
    assert.equal(response.headers.get("x-middleware-next"), "1", path);
  }
});

test("anonymous admin requests still require login", async () => {
  for (const path of ["/admin", "/admin/products/123/edit"]) {
    const response = await middleware(request(path));
    assert.equal(response.status, 307, path);
    assert.equal(response.headers.get("location"), "https://example.com/admin/login", path);
  }
  const login = await middleware(request("/admin/login"));
  assert.equal(login.headers.get("x-middleware-next"), "1");
});

test("invalid admin tokens are cleared and cannot access admin pages", async () => {
  const response = await middleware(request("/admin/products", "invalid-token"));
  assert.equal(response.headers.get("location"), "https://example.com/admin/login");
  assert.equal(response.cookies.get(cookieName)?.value, "");
});

test("valid admin tokens preserve identity forwarding and login redirection", async () => {
  const token = await new SignJWT({ id: "admin-1", email: "admin@example.com", username: "Admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("5m")
    .sign(secret);
  const response = await middleware(request("/admin/products", token));
  assert.equal(response.headers.get("x-middleware-next"), "1");
  assert.equal(response.headers.get("x-middleware-request-x-admin-id"), "admin-1");
  assert.equal(response.headers.get("x-middleware-request-x-admin-email"), "admin@example.com");
  assert.equal(response.headers.get("x-middleware-request-x-admin-username"), "Admin");
  const login = await middleware(request("/admin/login", token));
  assert.equal(login.headers.get("location"), "https://example.com/admin");
});
