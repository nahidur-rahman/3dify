import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import vm from "node:vm";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const nextServer = require("next/server");
const bcrypt = require("bcryptjs");

function loadTypeScript(relativePath, dependencies = {}) {
  const filename = new URL(relativePath, import.meta.url);
  const { outputText } = ts.transpileModule(readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  });
  const exports = {};
  vm.runInNewContext(outputText, {
    exports,
    TextEncoder,
    console: { error: () => {} },
    require: (name) => {
      assert.ok(name in dependencies, `Unexpected dependency: ${name}`);
      return dependencies[name];
    },
  }, { filename: filename.pathname });
  return exports;
}

const validation = loadTypeScript("../src/lib/validation.ts", {
  zod: require("zod"),
  "@/lib/categories": loadTypeScript("../src/lib/categories.ts"),
  "@/lib/productColors": loadTypeScript("../src/lib/productColors.ts"),
});
const oldPassword = "OldPassword1!";
const newPassword = "NewPassword2!";
const oldHash = bcrypt.hashSync(oldPassword, 4);
const validBody = { currentPassword: oldPassword, newPassword, confirmNewPassword: newPassword };

function createRoute({ session = { id: "admin-self" }, missingAdmin = false, conflict = false, failSave = false } = {}) {
  const lookups = [];
  const updates = [];
  let storedPassword = oldHash;
  const { POST } = loadTypeScript("../src/app/api/auth/password/route.ts", {
    "next/server": nextServer,
    bcryptjs: bcrypt,
    "@/lib/auth": { getSession: async () => session },
    "@/lib/validation": validation,
    "@/lib/db": {
      prisma: {
        admin: {
          findUnique: async (query) => {
            lookups.push(query);
            return missingAdmin ? null : { id: "admin-self", password: storedPassword };
          },
          updateMany: async (query) => {
            if (failSave) throw new Error("Database unavailable");
            if (conflict) return { count: 0 };
            updates.push(query);
            storedPassword = query.data.password;
            return { count: 1 };
          },
        },
      },
    },
  });
  return { POST, lookups, updates, getStoredPassword: () => storedPassword };
}

function request(body = validBody, contentType = "application/json") {
  return new nextServer.NextRequest("https://example.com/api/auth/password", {
    method: "POST",
    headers: { "Content-Type": contentType },
    body: JSON.stringify(body),
  });
}

test("admin creation and password changes enforce identical length and character requirements", () => {
  for (const [password, accepted] of [
    ["Abcdefgh1!x", false], // Too short, all character requirements met.
    ["Abcdefgh1!xy", true], // Exactly 12 characters, all requirements met.
    ["ABCDEFGHIJ1!", false], // Missing lowercase.
    ["abcdefghij1!", false], // Missing uppercase.
    ["Abcdefghijk!", false], // Missing number.
    ["Abcdefghijk1", false], // Missing symbol.
    ["ABCDEFGHIa1!", true], // Adding lowercase satisfies the final requirement.
  ]) {
    assert.equal(validation.isStrongPassword(password), accepted);
    assert.equal(validation.adminCreateSchema.safeParse({
      username: "new-admin", name: "New Admin", email: "new@example.com",
      password, confirmPassword: password,
    }).success, accepted);
    assert.equal(validation.adminPasswordChangeSchema.safeParse({
      ...validBody, newPassword: password, confirmNewPassword: password,
    }).success, accepted);
  }
});

test("live warnings show only unmet requirements with the requested wording", () => {
  assert.equal(validation.getStrongPasswordWarning(""),
    "Use minimum 12 characters including atleast 1 uppercase, 1 lowercase, 1 number, and 1 symbol");
  assert.equal(validation.getStrongPasswordWarning("abc"),
    "Use minimum 12 characters including atleast 1 uppercase, 1 number, and 1 symbol");
  assert.equal(validation.getStrongPasswordWarning("Abc"),
    "Use minimum 12 characters including atleast 1 number, and 1 symbol");
  assert.equal(validation.getStrongPasswordWarning("Abc1!"), "Use minimum 12 characters");
  assert.equal(validation.getStrongPasswordWarning("Abcdefghijkl"), "Use atleast 1 number, and 1 symbol");
  assert.equal(validation.getStrongPasswordWarning("Abcdefgh1!xy"), "");
  assert.equal(validation.getStrongPasswordWarning("ABCDEFGHIJ1!"), "Use atleast 1 lowercase");
  assert.equal(validation.getStrongPasswordWarning("ABCDEFGHIa1!"), "");
  const lowercaseCheck = (password) => validation.getPasswordRequirementChecks(password)
    .find((requirement) => requirement.key === "lowercase");
  assert.equal(lowercaseCheck("ABCDEFGHIJ1!").met, false);
  assert.equal(lowercaseCheck("ABCDEFGHIa1!").met, true);
});

test("admin creation API rejects missing lowercase before database access", async () => {
  let databaseCalls = 0;
  const { POST } = loadTypeScript("../src/app/api/admins/route.ts", {
    "next/server": nextServer,
    bcryptjs: bcrypt,
    "@/lib/adminSession": { getCurrentAdmin: async () => ({ id: "admin-self", role: "SUPER" }) },
    "@/lib/validation": validation,
    "@/lib/db": {
      prisma: { admin: {
        findUnique: async () => { databaseCalls++; throw new Error("Unexpected database access"); },
        create: async () => { databaseCalls++; throw new Error("Unexpected database write"); },
      } },
    },
  });
  const response = await POST(request({
    username: "new-admin", name: "New Admin", email: "new@example.com",
    password: "ABCDEFGHIJ1!", confirmPassword: "ABCDEFGHIJ1!",
  }));
  assert.equal(response.status, 400);
  assert.ok((await response.json()).details.fieldErrors.password[0].includes("1 lowercase"));
  assert.equal(databaseCalls, 0);
});

test("anonymous requests cannot look up or change a password", async () => {
  const route = createRoute({ session: null });
  assert.equal((await route.POST(request())).status, 401);
  assert.equal(route.lookups.length, 0);
  assert.equal(route.updates.length, 0);
});

test("sessions for deleted accounts cannot change a password", async () => {
  const route = createRoute({ missingAdmin: true });
  assert.equal((await route.POST(request())).status, 401);
  assert.equal(route.updates.length, 0);
});

test("cross-site form content types are rejected", async () => {
  for (const contentType of ["text/plain", "application/x-www-form-urlencoded", "multipart/form-data"]) {
    const route = createRoute();
    assert.equal((await route.POST(request(validBody, contentType))).status, 415);
    assert.equal(route.lookups.length, 0);
    assert.equal(route.updates.length, 0);
  }
});

test("invalid fields, weak passwords, and mismatches never reach the database", async () => {
  for (const body of [
    {},
    { ...validBody, currentPassword: "" },
    { ...validBody, currentPassword: 123 },
    { ...validBody, newPassword: "weak", confirmNewPassword: "weak" },
    { ...validBody, newPassword: "Abcdefgh1!x", confirmNewPassword: "Abcdefgh1!x" },
    { ...validBody, newPassword: "ABCDEFGHIJ1!", confirmNewPassword: "ABCDEFGHIJ1!" },
    { ...validBody, confirmNewPassword: "DifferentPassword3!" },
    { ...validBody, newPassword: "StrongPassword1!" + "a".repeat(72), confirmNewPassword: "StrongPassword1!" + "a".repeat(72) },
    { ...validBody, newPassword: "StrongPassword1!" + "é".repeat(30), confirmNewPassword: "StrongPassword1!" + "é".repeat(30) },
  ]) {
    const route = createRoute();
    assert.equal((await route.POST(request(body))).status, 400);
    assert.equal(route.lookups.length, 0);
    assert.equal(route.updates.length, 0);
  }
});

test("malformed JSON returns a validation error", async () => {
  const route = createRoute();
  const malformed = new nextServer.NextRequest("https://example.com/api/auth/password", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: "{",
  });
  assert.equal((await route.POST(malformed)).status, 400);
  assert.equal(route.updates.length, 0);
});

test("incorrect current password preserves the existing password", async () => {
  const route = createRoute();
  const response = await route.POST(request({ ...validBody, currentPassword: "WrongPassword1!" }));
  assert.equal(response.status, 400);
  assert.equal((await response.json()).error, "Current password is incorrect.");
  assert.equal(route.updates.length, 0);
  assert.equal(route.getStoredPassword(), oldHash);
});

test("reusing the current password is rejected", async () => {
  const route = createRoute();
  assert.equal((await route.POST(request({ ...validBody, newPassword: oldPassword, confirmNewPassword: oldPassword }))).status, 400);
  assert.equal(route.updates.length, 0);
});

test("regular and SUPER admins can change only their session account with a bcrypt hash", async () => {
  for (const role of ["ADMIN", "SUPER"]) {
    const route = createRoute({ session: { id: "admin-self", role } });
    const response = await route.POST(request({ ...validBody, id: "another-admin", adminId: "another-admin" }));
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { success: true });
    assert.equal(route.lookups[0].where.id, "admin-self");
    assert.equal(route.updates[0].where.id, "admin-self");
    assert.equal(route.updates[0].where.password, oldHash);
    assert.equal(bcrypt.getRounds(route.getStoredPassword()), 12);
    assert.equal(await bcrypt.compare(newPassword, route.getStoredPassword()), true);
    assert.equal(await bcrypt.compare(oldPassword, route.getStoredPassword()), false);
  }
});

test("a concurrent password change cannot be overwritten", async () => {
  const route = createRoute({ conflict: true });
  assert.equal((await route.POST(request())).status, 409);
  assert.equal(route.getStoredPassword(), oldHash);
});

test("database failures return an error without exposing password data", async () => {
  const route = createRoute({ failSave: true });
  const response = await route.POST(request());
  assert.equal(response.status, 500);
  const body = JSON.stringify(await response.json());
  assert.ok(!body.includes(oldPassword));
  assert.ok(!body.includes(newPassword));
  assert.ok(!body.includes(oldHash));
});
