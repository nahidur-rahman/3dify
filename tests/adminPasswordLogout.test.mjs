import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import vm from "node:vm";

const require = createRequire(import.meta.url);
const ts = require("typescript");

function loadTypeScript(relativePath, dependencies = {}, globals = {}) {
  const filename = new URL(relativePath, import.meta.url);
  const { outputText } = ts.transpileModule(readFileSync(filename, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX,
    },
  });
  const exports = {};
  vm.runInNewContext(outputText, {
    exports, TextEncoder, ...globals,
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
  "@/lib/productColors": loadTypeScript("../src/lib/productColors.ts", { "@/lib/nameKeychain": loadTypeScript("../src/lib/nameKeychain.ts") }),
  "@/lib/nameKeychain": loadTypeScript("../src/lib/nameKeychain.ts"),
});

// Run the actual component's hooks and event handlers with a virtual clock.
// UI primitives remain React elements so assertions can inspect the rendered modal.
function createHarness({ passwordStatus = 200, logoutResponses = [200] } = {}) {
  const slots = [];
  const pendingEffects = [];
  const timers = new Map();
  const requests = [];
  const redirects = [];
  const Button = () => null;
  const Input = () => null;
  const Modal = () => null;
  let cursor = 0;
  let dirty = true;
  let tree;
  let now = 0;
  let nextTimer = 0;
  let logoutIndex = 0;
  const dependenciesChanged = (before, after) => !before || after.some((value, index) => !Object.is(value, before[index]));
  const react = {
    useState: (initial) => {
      const index = cursor++;
      if (!(index in slots)) slots[index] = typeof initial === "function" ? initial() : initial;
      return [slots[index], (value) => {
        const next = typeof value === "function" ? value(slots[index]) : value;
        if (!Object.is(slots[index], next)) { slots[index] = next; dirty = true; }
      }];
    },
    useRef: (initial) => {
      const index = cursor++;
      slots[index] ??= { current: initial };
      return slots[index];
    },
    useId: () => { cursor++; return "password-modal"; },
    useCallback: (callback, dependencies) => {
      const index = cursor++;
      if (dependenciesChanged(slots[index]?.dependencies, dependencies)) slots[index] = { callback, dependencies };
      return slots[index].callback;
    },
    useEffect: (effect, dependencies) => {
      const index = cursor++;
      if (dependenciesChanged(slots[index]?.dependencies, dependencies)) {
        pendingEffects.push(() => {
          slots[index]?.cleanup?.();
          slots[index] = { dependencies, cleanup: effect() };
        });
      }
    },
  };
  const schedule = (callback, delay, interval = false) => {
    const id = ++nextTimer;
    timers.set(id, { callback, due: now + delay, interval, delay });
    return id;
  };
  const windowMock = {
    setTimeout: (callback, delay) => schedule(callback, delay),
    setInterval: (callback, delay) => schedule(callback, delay, true),
    clearTimeout: (id) => timers.delete(id),
    clearInterval: (id) => timers.delete(id),
    location: { replace: (path) => redirects.push(path) },
  };
  const { default: Component } = loadTypeScript("../src/components/ChangeAdminPasswordButton.tsx", {
    react,
    "react/jsx-runtime": require("react/jsx-runtime"),
    "next/navigation": { useRouter: () => ({ push: (path) => redirects.push(path), refresh: () => {} }) },
    "react-icons/hi": require("react-icons/hi"),
    "@/components/ui/Button": { default: Button },
    "@/components/ui/Input": { default: Input },
    "@/components/ui/Modal": { default: Modal },
    "@/lib/validation": validation,
  }, {
    window: windowMock,
    CSS: { supports: () => true },
    Date: class extends Date { static now() { return now; } },
    fetch: async (url, options) => {
      requests.push({ url, options });
      const result = url === "/api/auth/password" ? passwordStatus : logoutResponses[logoutIndex++];
      const status = typeof result === "function" ? await result() : result;
      return { ok: status >= 200 && status < 300, status, json: async () => ({ error: "Request failed" }) };
    },
  });
  function render() {
    for (let attempts = 0; dirty; attempts++) {
      assert.ok(attempts < 20, "Unexpected render loop");
      dirty = false;
      cursor = 0;
      tree = Component({ adminUsername: "Admin" });
      pendingEffects.splice(0).forEach((effect) => effect());
    }
  }
  function findAll(node, type) {
    if (Array.isArray(node)) return node.flatMap((child) => findAll(child, type));
    if (!node || typeof node !== "object") return [];
    return [...(node.type === type ? [node] : []), ...findAll(node.props?.children, type)];
  }
  function textContent(node) {
    if (Array.isArray(node)) return node.map(textContent).join(" ");
    if (node == null || typeof node === "boolean") return "";
    if (typeof node === "object") return textContent(node.props?.children);
    return String(node);
  }
  const modal = () => findAll(tree, Modal)[0];
  async function settle() {
    for (let i = 0; i < 5; i++) await Promise.resolve();
    render();
  }
  async function changePassword() {
    findAll(tree, Button)[0].props.onClick();
    render();
    for (const [index, value] of ["OldPassword1!", "NewPassword2!", "NewPassword2!"].entries()) {
      findAll(modal().props.children, Input)[index].props.onChange({
        nativeEvent: { isTrusted: true, inputType: "insertText", data: "!" },
        target: { value }, currentTarget: { value },
      });
      render();
    }
    const form = findAll(modal().props.children, "form")[0];
    await form.props.onSubmit({ preventDefault() {} });
    await settle();
  }
  async function advance(milliseconds) {
    const target = now + milliseconds;
    while (true) {
      const next = [...timers.entries()].filter(([, timer]) => timer.due <= target)
        .sort((a, b) => a[1].due - b[1].due || a[0] - b[0])[0];
      if (!next) break;
      const [id, timer] = next;
      now = timer.due;
      if (timer.interval) timer.due += timer.delay;
      else timers.delete(id);
      timer.callback();
      await settle();
    }
    now = target;
    await settle();
  }
  render();
  return {
    modal, changePassword, advance, settle, requests, redirects,
    text: () => textContent(modal().props.children),
    logoutRequests: () => requests.filter(({ url }) => url === "/api/auth/logout"),
    unmount: () => slots.forEach((slot) => slot?.cleanup?.()),
    timers,
  };
}

test("password success explains re-login and logs out after exactly 15 seconds", async () => {
  const view = createHarness();
  await view.changePassword();
  assert.match(view.text(), /updated successfully/);
  assert.match(view.text(), /sign in again using your new password/);
  assert.match(view.text(), /15 seconds/);
  assert.equal(view.logoutRequests().length, 0);
  await view.advance(14_000);
  assert.match(view.text(), /1 second\./);
  await view.advance(999);
  assert.equal(view.logoutRequests().length, 0);
  await view.advance(1);
  assert.equal(view.logoutRequests().length, 1);
  assert.deepEqual(view.redirects, ["/admin/login"]);
  view.unmount();
  assert.equal(view.timers.size, 0);
});

for (const action of ["Okay", "dismiss"]) {
  test(`${action} after success immediately invokes logout`, async () => {
    const view = createHarness();
    await view.changePassword();
    if (action === "Okay") view.modal().props.footer.props.onClick();
    else view.modal().props.onClose(); // Shared Close, Escape and backdrop callback.
    await view.settle();
    assert.equal(view.logoutRequests().length, 1);
    assert.deepEqual(view.redirects, ["/admin/login"]);
    view.unmount();
  });
}

test("dismissing the form or failing a password change never triggers logout", async () => {
  const unchanged = createHarness();
  unchanged.modal().props.onClose();
  await unchanged.advance(15_000);
  assert.equal(unchanged.logoutRequests().length, 0);
  const failed = createHarness({ passwordStatus: 400 });
  await failed.changePassword();
  await failed.advance(15_000);
  assert.equal(failed.logoutRequests().length, 0);
  assert.equal(failed.redirects.length, 0);
  failed.unmount();
});

test("a click racing the timer sends only one pending logout request", async () => {
  let finishLogout;
  const view = createHarness({ logoutResponses: [() => new Promise((resolve) => { finishLogout = resolve; })] });
  await view.changePassword();
  view.modal().props.footer.props.onClick();
  await view.settle();
  assert.equal(view.modal().props.closeDisabled, true);
  await view.advance(15_000);
  assert.equal(view.logoutRequests().length, 1);
  assert.equal(view.redirects.length, 0);
  finishLogout(200);
  await view.settle();
  assert.deepEqual(view.redirects, ["/admin/login"]);
  view.unmount();
});

test("logout failures keep the success notice and allow retry without navigating", async () => {
  const view = createHarness({ logoutResponses: [500, 200] });
  await view.changePassword();
  await view.advance(15_000);
  assert.match(view.text(), /updated successfully/);
  assert.match(view.text(), /logout failed/);
  assert.equal(view.redirects.length, 0);
  assert.equal(view.modal().props.closeDisabled, false);
  view.modal().props.footer.props.onClick();
  await view.settle();
  assert.equal(view.logoutRequests().length, 2);
  assert.deepEqual(view.redirects, ["/admin/login"]);
  view.unmount();
});
