import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const ts = require("typescript");

function loadTypeScript(relativePath, dependencies = {}) {
  const filename = new URL(relativePath, import.meta.url);
  const { outputText } = ts.transpileModule(readFileSync(filename, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  });
  const exports = {};
  vm.runInNewContext(
    outputText,
    {
      exports,
      require: (name) => {
        assert.ok(name in dependencies, `Unexpected dependency: ${name}`);
        return dependencies[name];
      },
    },
    { filename: filename.pathname }
  );
  return exports;
}

const pagination = loadTypeScript("../src/lib/pagination.ts");
const orderStatus = {
  PENDING: "PENDING",
  CONFIRMED: "CONFIRMED",
  PROCESSING: "PROCESSING",
  SHIPPED: "SHIPPED",
  DELIVERED: "DELIVERED",
  CANCELLED: "CANCELLED",
};

function createAdminOrders() {
  const records = Array.from({ length: 45 }, (_, index) => ({
    id: `order-${index + 1}`,
    orderNumber: `ORD-${index + 1}`,
    customerName: `Customer ${index + 1}`,
    customerPhone: `0170000${index + 1}`,
    address: "Dhaka",
    shippingMethod: "INSIDE_DHAKA",
    total: 100 + index,
    paymentMethod: "COD",
    status: "PENDING",
    createdAt: new Date(Date.UTC(2026, 0, 1, 0, index)),
    updatedAt: new Date(Date.UTC(2026, 0, 1, 0, index)),
    items: [
      {
        id: `item-${index + 1}`,
        productName: "Test product",
        productImage: null,
        quantity: 2,
      },
    ],
  }));
  const calls = { lists: [], counts: [], quantities: [] };
  const prisma = {
    order: {
      findMany: async (query) => {
        calls.lists.push(structuredClone(query));
        return records.slice(query.skip, query.skip + query.take);
      },
      count: async (query) => {
        calls.counts.push(structuredClone(query));
        return records.length;
      },
      groupBy: async () => [],
    },
    orderItem: {
      groupBy: async (query) => {
        calls.quantities.push(structuredClone(query));
        return query.where.orderId.in.map((orderId) => ({
          orderId,
          _sum: { quantity: 2 },
        }));
      },
    },
  };
  const adminOrders = loadTypeScript("../src/lib/adminOrders.ts", {
    "@prisma/client": { OrderStatus: orderStatus },
    "@/lib/db": { prisma },
    "@/lib/pagination": pagination,
  });

  return { adminOrders, calls };
}

test("admin orders fetch one bounded page and only preview three items", async () => {
  const { adminOrders, calls } = createAdminOrders();
  const result = await adminOrders.getAdminOrders({
    status: "PENDING",
    search: "Customer",
    page: 2,
    pageSize: 20,
  });

  assert.equal(result.orders.length, 20);
  assert.deepEqual({ ...result.pagination }, {
    page: 2,
    pageSize: 20,
    total: 45,
    totalPages: 3,
  });
  assert.equal(result.orders[0].itemCount, 2);
  assert.equal(calls.lists[0].skip, 20);
  assert.equal(calls.lists[0].take, 20);
  assert.equal(calls.lists[0].select.items.take, 3);
  assert.equal(calls.quantities[0].where.orderId.in.length, 20);
  assert.equal(calls.counts[0].where.status, "PENDING");
});

test("admin orders clamp an out-of-range page to the last page", async () => {
  const { adminOrders, calls } = createAdminOrders();
  const result = await adminOrders.getAdminOrders({ page: 99, pageSize: 20 });

  assert.equal(result.pagination.page, 3);
  assert.equal(result.orders.length, 5);
  assert.equal(calls.lists.length, 2);
  assert.equal(calls.lists[1].skip, 40);
});
