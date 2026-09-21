import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import vm from "node:vm";

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

const categories = loadTypeScript("../src/lib/categories.ts");
const { calculateDiscountedPrice } = loadTypeScript("../src/lib/utils.ts", {
  "@/lib/categories": categories,
});

test("discounted prices round up to the nearest whole taka", () => {
  assert.equal(calculateDiscountedPrice(378, 10), 341);
  assert.equal(calculateDiscountedPrice(500, 15), 425);
  assert.equal(calculateDiscountedPrice(99.01, 0), 100);
});

test("discount percentages remain bounded between zero and one hundred", () => {
  assert.equal(calculateDiscountedPrice(340, -10), 340);
  assert.equal(calculateDiscountedPrice(340, 110), 0);
});

test("checkout ignores browser prices and stores the current rounded database price", async () => {
  let createdOrderData;
  const transactionClient = {
    product: {
      findMany: async () => [
        {
          id: "product-1",
          name: "Test product",
          images: ["products/test.webp"],
          price: 378,
          discountPercent: 10,
          inStock: true,
          sizeMode: "FIXED",
          sizeOptions: null,
          color: "Black",
          colorMode: "FIXED",
          colorOptions: [],
        },
      ],
      updateMany: async () => ({ count: 1 }),
    },
    order: {
      create: async ({ data }) => {
        createdOrderData = data;
        return { id: "order-1", orderNumber: "3D-TEST" };
      },
    },
  };

  const { createOrder } = loadTypeScript("../src/lib/orders.ts", {
    "@/lib/db": {
      prisma: {
        $transaction: async (callback) => callback(transactionClient),
      },
    },
    "@/lib/bangladeshDistricts": {
      findBangladeshDistrict: (value) => (value === "Dhaka" ? "Dhaka" : null),
      getShippingMethodForDistrict: () => "INSIDE_DHAKA",
    },
    "@/lib/orderAddress": { buildOrderAddress: () => "Test address" },
    zod: require("zod"),
    "@/lib/shipping": { getShippingCost: async () => 60 },
    "@/lib/productImages": {
      resolveStorageImageUrl: (image) => `https://example.com/${image}`,
    },
    "@/lib/utils": { calculateDiscountedPrice },
  });

  const result = await createOrder({
    customerName: "Test Customer",
    customerPhone: "01712345678",
    customerEmail: "test@gmail.com",
    areaVillage: "Test area",
    townCityThana: "Test city",
    district: "Dhaka",
    items: [
      {
        productId: "product-1",
        quantity: 2,
        unitPrice: 1,
        productName: "Browser-supplied name",
      },
    ],
  });

  assert.equal(result.success, true);
  assert.equal(result.total, 742);
  assert.equal(createdOrderData.subtotal, 682);
  assert.equal(createdOrderData.total, 742);
  assert.equal(createdOrderData.items.create[0].productName, "Test product");
  assert.equal(createdOrderData.items.create[0].unitPrice, 341);
  assert.equal(createdOrderData.items.create[0].totalPrice, 682);
});
