import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { test } from "node:test";
import { loadTypeScript } from "./helpers/loadTypeScript.mjs";

const require = createRequire(import.meta.url);
const config = loadTypeScript("src/lib/adminOtpConfig.ts");
const baseTime = Date.now();
const challenge = { requiresOtp: true, email: "admin@example.com", expiresAt: new Date(baseTime + 300_000).toISOString(), resendAvailableAt: new Date(baseTime + 60_000).toISOString(), serverTime: new Date(baseTime).toISOString() };

function harness(responses = {}) {
  const slots = [];
  const effects = [];
  const timers = new Map();
  const requests = [];
  const redirects = [];
  let cursor = 0;
  let dirty = true;
  let tree;
  let now = baseTime;
  let timerId = 0;
  const Button = () => null;
  const Input = () => null;
  const react = {
    useState: (initial) => {
      const index = cursor++;
      if (!(index in slots)) slots[index] = typeof initial === "function" ? initial() : initial;
      return [slots[index], (value) => { const next = typeof value === "function" ? value(slots[index]) : value; if (!Object.is(next, slots[index])) { slots[index] = next; dirty = true; } }];
    },
    useRef: (initial) => { const index = cursor++; slots[index] ??= { current: initial }; return slots[index]; },
    useEffect: (effect, dependencies) => {
      const index = cursor++;
      if (!slots[index] || dependencies.some((value, i) => !Object.is(value, slots[index].dependencies[i]))) {
        effects.push(() => { slots[index]?.cleanup?.(); slots[index] = { dependencies, cleanup: effect() }; });
      }
    },
  };
  class VirtualDate extends Date { static now() { return now; } }
  const Form = loadTypeScript("src/components/AdminLoginForm.tsx", {
    react, "react/jsx-runtime": require("react/jsx-runtime"),
    "next/navigation": { useRouter: () => ({ replace: (path) => redirects.push(path), refresh: () => {} }) },
    "react-icons/hi": { HiOutlineEye: () => null, HiOutlineEyeOff: () => null },
    "@/components/ui/Button": { default: Button }, "@/components/ui/Input": { default: Input },
    "@/components/ui/Card": { Card: () => null, CardContent: () => null },
    "@/components/layout/BrandLogo": { default: () => null }, "@/lib/adminOtpConfig": config,
  }, {
    Date: VirtualDate,
    window: { setInterval: (callback) => { const id = ++timerId; timers.set(id, callback); return id; }, clearInterval: (id) => timers.delete(id) },
    fetch: async (url, options = {}) => {
      const key = `${options.method || "GET"} ${url}`;
      requests.push({ url, ...options });
      const configured = responses[key] ?? { data: url === "/api/auth/login" ? challenge : { requiresOtp: false } };
      const result = typeof configured === "function" ? await configured() : configured;
      return new Response(JSON.stringify(result.data), { status: result.status || 200, headers: result.headers });
    },
  }).default;
  const Page = loadTypeScript("src/app/admin/login/page.tsx", {
    "react/jsx-runtime": require("react/jsx-runtime"),
    "@/components/AdminLoginForm": { default: Form },
  }).default;
  const Component = () => {
    const page = Page();
    assert.equal(page.type, Form, "/admin/login must render the OTP-enabled login form");
    return page.type(page.props);
  };
  const render = () => { if (!dirty) return; cursor = 0; dirty = false; tree = Component(); while (effects.length) effects.shift()(); };
  const nodes = (node = tree, all = []) => {
    if (Array.isArray(node)) { node.forEach((child) => nodes(child, all)); return all; }
    if (node && typeof node === "object") { all.push(node); if (node.props?.children !== undefined) nodes(node.props.children, all); }
    return all;
  };
  const settle = async () => { for (let i = 0; i < 8; i++) { render(); await new Promise((resolve) => setImmediate(resolve)); } render(); };
  render();
  return {
    requests, redirects, settle,
    input: (name) => nodes().find((node) => node.type === Input && node.props.name === name),
    text: () => JSON.stringify(tree, (_, value) => typeof value === "function" ? undefined : value),
    button: (text) => nodes().find((node) => node.type === Button && typeof node.props.children === "string" && node.props.children.includes(text)),
    passwordToggle: () => nodes().find((node) => node.type === "button" && /^(Show|Hide) password$/.test(node.props["aria-label"])),
    fill: (name, value) => { nodes().find((node) => node.type === Input && node.props.name === name).props.onChange({ target: { value } }); render(); },
    submit: () => { nodes().find((node) => node.type === "form").props.onSubmit({ preventDefault() {} }); render(); },
    advance: async (milliseconds) => { now += milliseconds; for (const callback of [...timers.values()]) callback(); await settle(); },
    unmount: () => { for (const slot of slots) slot?.cleanup?.(); },
  };
}

test("the actual /admin/login page opens OTP verification after credentials without navigating to /admin", async () => {
  const view = harness();
  await view.settle();
  view.fill("email", "admin@example.com"); view.fill("password", "Password123!");
  view.submit(); await view.settle();
  assert.ok(view.input("otp"));
  assert.equal(view.input("password"), undefined);
  assert.equal(view.redirects.length, 0);
  assert.equal(view.button("Resend").props.disabled, true);
  view.unmount();
});

test("the login page retains password visibility and resets it when returning from verification", async () => {
  const view = harness({ "DELETE /api/auth/otp": { data: { success: true } } });
  await view.settle();
  assert.equal(view.input("password").props.type, "password");
  view.passwordToggle().props.onClick(); await view.settle();
  assert.equal(view.input("password").props.type, "text");
  view.fill("email", "admin@example.com"); view.fill("password", "Password123!");
  view.submit(); await view.settle();
  assert.equal(view.passwordToggle(), undefined);
  view.button("Back").props.onClick(); await view.settle();
  assert.equal(view.input("password").props.type, "password");
  assert.equal(view.input("password").props.value, "");
  view.unmount();
});

test("a page reload restores the challenge; only successful OTP verification navigates", async () => {
  const view = harness({ "GET /api/auth/otp": { data: challenge }, "POST /api/auth/otp": { data: { success: true } } });
  await view.settle();
  assert.ok(view.input("otp"));
  view.fill("otp", "01a234567");
  assert.equal(view.input("otp").props.value, "01234567");
  view.submit(); await view.settle();
  assert.deepEqual(view.redirects, ["/admin"]);
  const verification = view.requests.find((request) => request.method === "POST");
  assert.deepEqual(JSON.parse(verification.body), { otp: "01234567" });
  view.unmount();
});

test("the countdown enables resend at one minute and disables verification at five minutes", async () => {
  const view = harness({ "GET /api/auth/otp": { data: challenge } });
  await view.settle();
  await view.advance(60_000);
  assert.equal(view.button("Resend").props.disabled, false);
  await view.advance(240_000);
  assert.equal(view.input("otp").props.disabled, true);
  assert.equal(view.button("Verify").props.disabled, true);
  assert.match(view.text(), /expired/);
  view.unmount();
});

test("a terminal OTP error resets the form and never navigates", async () => {
  const view = harness({ "GET /api/auth/otp": { data: challenge }, "POST /api/auth/otp": { status: 401, data: { error: "Code expired", restart: true } } });
  await view.settle();
  view.fill("otp", "12345678"); view.submit(); await view.settle();
  assert.equal(view.input("otp"), undefined);
  assert.ok(view.input("password"));
  assert.match(view.text(), /Code expired/);
  assert.equal(view.redirects.length, 0);
  view.unmount();
});

test("rapid duplicate submissions send only one verification request", async () => {
  let complete;
  const view = harness({ "GET /api/auth/otp": { data: challenge }, "POST /api/auth/otp": () => new Promise((resolve) => { complete = resolve; }) });
  await view.settle();
  view.fill("otp", "12345678"); view.submit(); view.submit(); await view.settle();
  assert.equal(view.requests.filter((request) => request.method === "POST").length, 1);
  complete({ data: { success: true } }); await view.settle();
  assert.equal(view.redirects.length, 1);
  view.unmount();
});

test("back to sign in cancels the backend challenge before showing credentials", async () => {
  const view = harness({ "GET /api/auth/otp": { data: challenge }, "DELETE /api/auth/otp": { data: { success: true } } });
  await view.settle();
  view.button("Back").props.onClick(); await view.settle();
  assert.ok(view.input("email"));
  assert.equal(view.input("otp"), undefined);
  assert.equal(view.requests.filter((request) => request.method === "DELETE").length, 1);
  view.unmount();
});

test("an incorrect browser clock does not prematurely expire a server-issued challenge", async () => {
  const skewed = {
    ...challenge,
    serverTime: new Date(baseTime - 3_600_000).toISOString(),
    expiresAt: new Date(baseTime - 3_600_000 + 300_000).toISOString(),
    resendAvailableAt: new Date(baseTime - 3_600_000 + 60_000).toISOString(),
  };
  const view = harness({ "GET /api/auth/otp": { data: skewed } });
  await view.settle();
  assert.equal(view.input("otp").props.disabled, false);
  assert.match(view.text(), /5:00/);
  await view.advance(60_000);
  assert.equal(view.button("Resend").props.disabled, false);
  view.unmount();
});
