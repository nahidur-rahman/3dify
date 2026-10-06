import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import vm from "node:vm";

const require = createRequire(import.meta.url);
const ts = require("typescript");

function loadTypeScript(path, dependencies = {}, globals = {}) {
  const filename = new URL(path, import.meta.url);
  const { outputText } = ts.transpileModule(readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  });
  const exports = {};
  vm.runInNewContext(outputText, {
    exports,
    require: (name) => {
      assert.ok(name in dependencies, `Unexpected dependency: ${name}`);
      return dependencies[name];
    },
    URL, console, ...globals,
  }, { filename: filename.pathname });
  return exports;
}

const templates = loadTypeScript("../src/lib/orderEmailTemplates.ts");
const config = {
  from: "3DifyBD Orders <orders@mail.3difybd.com>",
  adminEmail: "3difybd@gmail.com",
  replyTo: "support@example.com",
  siteUrl: "https://3difybd.com",
};
const order = {
  id: "order-1", orderNumber: "3D-TEST", customerName: "Test Customer",
  customerPhone: "01712345678", customerEmail: "customer@gmail.com",
  address: "Road 1\nDhaka", shippingMethod: "INSIDE_DHAKA", shippingCost: 70,
  subtotal: 682, total: 752, paymentMethod: "COD", notes: "Please call before delivery.",
  createdAt: new Date("2026-10-06T00:00:00.000Z"),
  items: [{ productName: "Desk lamp", selectedSize: "Large", color: "Black",
    quantity: 2, unitPrice: 341, totalPrice: 682 }],
};

function createService(responses, env = {}, globals = {}) {
  const calls = [];
  const logs = [];
  const delays = [];
  const service = loadTypeScript("../src/lib/orderEmails.ts", {
    "server-only": {}, zod: require("zod"), "@/lib/orderEmailTemplates": templates,
  }, {
    process: { env: { RESEND_API_KEY: "re_test_secret", ...env } },
    AbortSignal,
    console: { error: (...args) => logs.push(args) },
    setTimeout: (callback, delay) => { delays.push(delay); callback(); },
    fetch: async (url, options) => {
      calls.push({ url, ...options });
      const response = responses.shift();
      if (response instanceof Error) throw response;
      assert.ok(response, "Unexpected extra request");
      return response;
    },
    ...globals,
  });
  return { ...service, calls, logs, delays };
}

function accepted(count = 2) {
  return new Response(JSON.stringify({ data: Array.from({ length: count }, (_, i) => ({ id: `email-${i}` })) }));
}

function rejected(status, name, headers = {}) {
  return new Response(JSON.stringify({ name, message: "Provider error with private information" }), { status, headers });
}

test("distinct customer and admin emails contain saved totals, variants, and useful links", () => {
  const [customer, admin] = templates.buildOrderEmails(order, config);
  assert.equal(customer.from, config.from);
  assert.deepEqual(Array.from(customer.to), [order.customerEmail]);
  assert.deepEqual(Array.from(admin.to), [config.adminEmail]);
  assert.equal(customer.reply_to, config.replyTo);
  assert.equal(admin.reply_to, order.customerEmail);
  assert.notEqual(customer.subject, admin.subject);
  for (const message of [customer, admin]) {
    for (const content of [message.html, message.text]) {
      for (const expected of ["3D-TEST", "Desk lamp", "Large", "Black", "BDT 341.00", "BDT 682.00", "BDT 70.00", "BDT 752.00", "Cash on Delivery", "6 Oct 2026", "06:00", order.notes]) {
        assert.ok(content.includes(expected), `Missing ${expected}`);
      }
    }
  }
  assert.ok(customer.text.includes("https://3difybd.com/track-order?order=3D-TEST&phone=01712345678"));
  assert.ok(customer.html.includes('href="https://3difybd.com/track-order?order=3D-TEST&amp;phone=01712345678"'));
  assert.ok(!customer.html.includes("/admin/orders"));
  assert.ok(admin.text.includes("https://3difybd.com/admin/orders?search=3D-TEST&status=ALL"));
  assert.ok(customer.text.includes("review and confirm"));
});

test("untrusted order fields are escaped in HTML and preserved in plain text", () => {
  const malicious = '<img src=x onerror="alert(1)"> & \'test\'';
  const messages = templates.buildOrderEmails({ ...order, customerName: malicious, notes: malicious,
    items: [{ ...order.items[0], productName: malicious, color: malicious }],
  }, config);
  for (const message of messages) {
    assert.ok(!message.html.includes("<img src=x"));
    assert.ok(message.html.includes("&lt;img"));
    assert.ok(message.html.includes("&quot;"));
    assert.ok(message.html.includes("&amp;"));
    assert.ok(message.text.includes(malicious));
  }
});

test("legacy orders without an email still notify the admin", async () => {
  const service = createService([accepted(1)]);
  assert.equal((await service.sendOrderEmails({ ...order, customerEmail: null })).success, true);
  const messages = JSON.parse(service.calls[0].body);
  assert.equal(messages.length, 1);
  assert.equal(messages[0].reply_to, config.adminEmail);
});

test("one batch request sends both emails with private credentials and an idempotency key", async () => {
  const service = createService([accepted()], {
    ORDER_EMAIL_FROM: config.from, ORDER_ADMIN_EMAIL: "new-admin@example.com",
    ORDER_EMAIL_REPLY_TO: config.replyTo, NEXT_PUBLIC_SITE_URL: "https://shop.example.com/",
  });
  const result = await service.sendOrderEmails(order);
  assert.equal(result.success, true);
  assert.deepEqual(Array.from(result.emailIds), ["email-0", "email-1"]);
  assert.equal(service.calls.length, 1);
  const call = service.calls[0];
  assert.equal(call.url, "https://api.resend.com/emails/batch");
  assert.equal(call.headers.Authorization, "Bearer re_test_secret");
  assert.equal(call.headers["Idempotency-Key"], "order-placed/order-1");
  assert.equal(call.cache, "no-store");
  assert.ok(call.signal instanceof AbortSignal);
  const messages = JSON.parse(call.body);
  assert.equal(messages.length, 2);
  assert.equal(messages[1].to[0], "new-admin@example.com");
  assert.ok(messages[0].html.includes("https://shop.example.com/track-order"));
  assert.ok(!call.body.includes("re_test_secret"));
  assert.equal(service.logs.length, 0);
});

test("timeouts and temporary errors retry exactly the same payload", async () => {
  const service = createService([new Error("Timeout"), rejected(503, "service_unavailable"), accepted()]);
  assert.equal((await service.sendOrderEmails(order)).success, true);
  assert.equal(service.calls.length, 3);
  assert.equal(service.delays.length, 2);
  for (const call of service.calls) {
    assert.equal(call.body, service.calls[0].body);
    assert.equal(call.headers["Idempotency-Key"], service.calls[0].headers["Idempotency-Key"]);
  }
});

test("rate limits honor Retry-After and concurrent idempotent requests can retry", async () => {
  const service = createService([
    rejected(429, "rate_limit_exceeded", { "retry-after": "1" }),
    rejected(409, "concurrent_idempotent_requests"), accepted(),
  ]);
  assert.equal((await service.sendOrderEmails(order)).success, true);
  assert.equal(service.delays[0], 1_000);
});

test("permanent errors and quota errors are not retried and do not leak provider messages", async () => {
  for (const [status, code] of [[401, "invalid_api_key"], [403, "validation_error"], [422, "validation_error"],
    [409, "invalid_idempotent_request"], [429, "daily_quota_exceeded"], [429, "monthly_quota_exceeded"]]) {
    const service = createService([rejected(status, code)]);
    assert.equal((await service.sendOrderEmails(order)).success, false);
    assert.equal(service.calls.length, 1);
    const logged = JSON.stringify(service.logs);
    assert.ok(logged.includes("order-1"));
    assert.ok(!logged.includes("private information"));
    assert.ok(!logged.includes("re_test_secret"));
    assert.ok(!logged.includes(order.customerEmail));
  }
});

test("persistent network failures stop after three attempts", async () => {
  const service = createService([new Error("offline"), new Error("offline"), new Error("offline")]);
  assert.equal((await service.sendOrderEmails(order)).success, false);
  assert.equal(service.calls.length, 3);
  assert.equal(service.logs.length, 1);
});

test("long retry delays do not hold checkout open", async () => {
  const service = createService([rejected(429, "rate_limit_exceeded", { "retry-after": "60" })]);
  assert.equal((await service.sendOrderEmails(order)).success, false);
  assert.equal(service.calls.length, 1);
  assert.equal(service.delays.length, 0);
});

test("malformed success responses retry safely with the same idempotency key", async () => {
  const service = createService([new Response("not json"), accepted(1), accepted()]);
  assert.equal((await service.sendOrderEmails(order)).success, true);
  assert.equal(service.calls.length, 3);
});

test("missing or invalid configuration makes no external requests", async () => {
  for (const env of [
    { RESEND_API_KEY: "" }, { ORDER_EMAIL_FROM: "broken" }, { ORDER_ADMIN_EMAIL: "broken" },
    { ORDER_EMAIL_REPLY_TO: "broken" }, { NEXT_PUBLIC_SITE_URL: "javascript:alert(1)" },
    { NEXT_PUBLIC_SITE_URL: "https://user:password@example.com" },
    { ORDER_EMAIL_FROM: "Sender <sender@example.com>\r\nBcc: spy@example.com" },
  ]) {
    const service = createService([], env);
    assert.equal((await service.sendOrderEmails(order)).success, false);
    assert.equal(service.calls.length, 0);
    assert.equal(service.logs.length, 1);
  }
});

function checkout(emailSender, options = {}) {
  const events = [];
  const product = { id: "product-1", name: "Saved product", images: [], price: 341, discountPercent: 0,
    inStock: true, sizeMode: "FIXED", sizeOptions: null, color: "Black", colorMode: "FIXED", colorOptions: [],
    ...options.product };
  const tx = {
    product: { findMany: async () => [product], updateMany: async () => ({ count: 1 }) },
    order: { create: async ({ data, include }) => {
      assert.equal(include.items, true);
      events.push("saved");
      return { ...data, id: "order-1", createdAt: order.createdAt, items: data.items.create };
    } },
  };
  const { createOrder } = loadTypeScript("../src/lib/orders.ts", {
    "@/lib/db": { prisma: { $transaction: async (callback) => {
      const result = await callback(tx);
      if (options.rollback) throw new Error("Transaction rolled back");
      events.push("committed");
      return result;
    } } },
    "@/lib/bangladeshDistricts": { findBangladeshDistrict: () => "Dhaka", getShippingMethodForDistrict: () => "INSIDE_DHAKA" },
    "@/lib/orderAddress": { buildOrderAddress: () => "Saved address" },
    zod: require("zod"), "@/lib/shipping": { getShippingCost: async () => 70 },
    "@/lib/productImages": { resolveStorageImageUrl: (value) => value },
    "@/lib/utils": { calculateDiscountedPrice: (price) => price },
    "@/lib/orderEmails": { sendOrderEmails: async (saved) => { events.push("email"); return emailSender(saved); } },
  }, { console: { error: () => {} } });
  return { createOrder, events };
}

const input = { customerName: order.customerName, customerPhone: order.customerPhone,
  customerEmail: order.customerEmail, areaVillage: "Area", townCityThana: "City", district: "Dhaka",
  items: [{ productId: "product-1", quantity: 2 }] };

test("checkout sends only after commit, using saved order details and totals", async () => {
  let emailed;
  const service = checkout(async (saved) => { emailed = saved; return { success: true }; });
  const result = await service.createOrder(input);
  assert.equal(result.success, true);
  assert.deepEqual(service.events, ["saved", "committed", "email"]);
  assert.equal(emailed.items[0].productName, "Saved product");
  assert.equal(emailed.items[0].unitPrice, 341);
  assert.equal(emailed.subtotal, 682);
  assert.equal(emailed.total, 752);
  assert.equal(emailed.address, "Saved address");
  assert.equal(emailed.orderNumber, result.orderNumber);
});

test("checkout remains successful when email sending fails or unexpectedly throws", async () => {
  for (const sender of [async () => ({ success: false }), async () => { throw new Error("Provider offline"); }]) {
    const service = checkout(sender);
    const result = await service.createOrder(input);
    assert.equal(result.success, true);
    assert.equal(result.orderId, "order-1");
    assert.equal(result.total, 752);
    assert.deepEqual(service.events, ["saved", "committed", "email"]);
  }
});

test("rolled-back and invalid orders send no emails", async () => {
  const service = checkout(async () => { assert.fail("Should not email"); }, { rollback: true });
  assert.equal((await service.createOrder(input)).success, false);
  assert.deepEqual(service.events, ["saved"]);
  assert.equal((await service.createOrder({ ...input, items: [] })).success, false);
  assert.deepEqual(service.events, ["saved"]);
});

test("checkout accepts padded database size labels and existing padded cart selections", async () => {
  for (const storedLabel of ["Midium ", "Midium"]) {
    for (const selectedSize of ["Midium ", "Midium"]) {
      let saved;
      const service = checkout(async (value) => { saved = value; return { success: true }; }, {
        product: { name: "Dragon Figure ", sizeMode: "OPTIONS", price: 999,
          sizeOptions: [{ label: "Small", price: 1000 }, { label: storedLabel, price: 1500 }],
          colorMode: "OPTIONS", colorOptions: ["Purple", "Pink"] },
      });
      const result = await service.createOrder({ ...input, items: [
        { productId: "product-1", selectedSize, color: "Purple", quantity: 1 },
        { productId: "product-1", selectedSize: "Small", color: "Pink", quantity: 1 },
      ] });
      assert.equal(result.success, true, `Stored: ${JSON.stringify(storedLabel)}, selected: ${JSON.stringify(selectedSize)}`);
      assert.equal(saved.items[0].selectedSize, "Midium");
      assert.equal(saved.items[0].unitPrice, 1500);
      assert.equal(saved.items[1].unitPrice, 1000);
      assert.equal(saved.subtotal, 2500);
      assert.equal(result.total, 2570);
    }
  }
});

test("checkout normalizes surrounding whitespace in database and selected colors", async () => {
  let saved;
  const service = checkout(async (value) => { saved = value; return { success: true }; }, {
    product: { colorMode: "OPTIONS", colorOptions: [" Purple ", "Pink"] },
  });
  const result = await service.createOrder({ ...input, items: [
    { productId: "product-1", color: " Purple ", quantity: 2 },
  ] });
  assert.equal(result.success, true);
  assert.equal(saved.items[0].color, "Purple");
});

test("checkout still rejects missing or removed size and color options before saving or emailing", async () => {
  for (const selection of [
    { selectedSize: "Large", color: "Purple" },
    { selectedSize: undefined, color: "Purple" },
    { selectedSize: "midium", color: "Purple" },
    { selectedSize: "Midium", color: "Removed color" },
    { selectedSize: "Midium", color: undefined },
  ]) {
    const service = checkout(async () => { assert.fail("Should not email"); }, {
      product: { sizeMode: "OPTIONS", sizeOptions: [{ label: "Midium ", price: 1500 }],
        colorMode: "OPTIONS", colorOptions: ["Purple"] },
    });
    const result = await service.createOrder({ ...input, items: [
      { productId: "product-1", quantity: 1, ...selection },
    ] });
    assert.equal(result.success, false);
    assert.ok(result.error.includes("no longer available"));
    assert.deepEqual(service.events, []);
  }
});
