"use server";

import { prisma } from "@/lib/db";
import {
  findBangladeshDistrict,
  getShippingMethodForDistrict,
} from "@/lib/bangladeshDistricts";
import { buildOrderAddress } from "@/lib/orderAddress";
import { z } from "zod";
import { getShippingCost } from "@/lib/shipping";
import { resolveStorageImageUrl } from "@/lib/productImages";
import { calculateDiscountedPrice } from "@/lib/utils";

// --- Validation schema ---

// Allowed popular email domains — rejects random/disposable email providers
const ALLOWED_EMAIL_DOMAINS = [
  "gmail.com",
  "yahoo.com",
  "yahoo.co.uk",
  "outlook.com",
  "hotmail.com",
  "live.com",
  "icloud.com",
  "me.com",
  "mac.com",
  "protonmail.com",
  "proton.me",
  "aol.com",
  "zoho.com",
  "yandex.com",
  "mail.com",
  "gmx.com",
  "fastmail.com",
];

// Valid Bangladeshi mobile operator prefixes (after leading 0)
// Grameenphone: 013, 017 | Banglalink: 014, 019 | Robi: 016, 018 | Teletalk: 015
const BD_PHONE_REGEX = /^01[3-9]\d{8}$/;

const OrderItemSchema = z.object({
  productId: z.string().min(1),
  selectedSize: z.string().trim().min(1).optional(),
  color: z.string().trim().min(1).optional(),
  quantity: z.number().int().min(1),
});

const CreateOrderSchema = z.object({
  customerName: z.string().trim().min(1, "Name is required"),
  customerPhone: z
    .string()
    .min(1, "Phone number is required")
    .transform((val) => val.replace(/[\s\-()]/g, "")) // strip spaces/dashes
    .refine(
      (val) => BD_PHONE_REGEX.test(val),
      "Enter a valid Bangladeshi phone number (e.g. 01712345678)"
    ),
  customerEmail: z
    .string()
    .trim()
    .min(1, "Email is required")
    .email("Enter a valid email address")
    .refine(
      (val) => {
        const domain = val.split("@")[1]?.toLowerCase();
        return domain ? ALLOWED_EMAIL_DOMAINS.includes(domain) : false;
      },
      "Please use a popular email provider (Gmail, Yahoo, Outlook, etc.)"
    ),
  houseRoad: z.string().trim().optional(),
  areaVillage: z.string().trim().min(1, "Area / Village is required"),
  townCityThana: z.string().trim().min(1, "Town / City / Thana is required"),
  district: z
    .string()
    .trim()
    .min(1, "District is required")
    .refine(
      (value) => Boolean(findBangladeshDistrict(value)),
      "Select a valid district"
    ),
  postalCode: z.string().trim().optional(),
  notes: z.string().trim().optional(),
  items: z.array(OrderItemSchema).min(1, "Cart is empty"),
});

export type CreateOrderInput = z.infer<typeof CreateOrderSchema>;

export interface OrderResult {
  success: boolean;
  orderNumber?: string;
  orderId?: string;
  total?: number;
  error?: string;
  fieldErrors?: Record<string, string[]>;
}

class OrderItemUnavailableError extends Error {}

function parseSizeOptions(value: unknown) {
  if (!Array.isArray(value)) return [];

  return value.flatMap((option) => {
    if (!option || typeof option !== "object") return [];

    const label = (option as { label?: unknown }).label;
    const price = (option as { price?: unknown }).price;

    return typeof label === "string" && typeof price === "number"
      ? [{ label, price }]
      : [];
  });
}

function getOrderProductImage(images: string[]) {
  const image = images.find((value) => value.trim().length > 0);
  if (!image) return null;

  return /^https?:\/\//i.test(image) ? image : resolveStorageImageUrl(image);
}

// --- Generate human-readable order number ---

function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `3D-${timestamp}${random}`;
}

function aggregateSellCounts(items: CreateOrderInput["items"]) {
  const sellCounts = new Map<string, number>();

  for (const item of items) {
    const currentCount = sellCounts.get(item.productId) ?? 0;
    sellCounts.set(item.productId, currentCount + item.quantity);
  }

  return Array.from(sellCounts.entries(), ([productId, quantity]) => ({
    productId,
    quantity,
  }));
}

// --- Server Action ---

export async function createOrder(input: CreateOrderInput): Promise<OrderResult> {
  // Validate
  const parsed = CreateOrderSchema.safeParse(input);

  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path.join(".");
      if (!fieldErrors[key]) fieldErrors[key] = [];
      fieldErrors[key].push(issue.message);
    }
    return { success: false, error: "Please fix the errors below.", fieldErrors };
  }

  const data = parsed.data;
  const district = findBangladeshDistrict(data.district);

  if (!district) {
    return {
      success: false,
      error: "Please fix the errors below.",
      fieldErrors: { district: ["Select a valid district"] },
    };
  }

  try {
    // Resolve shipping before opening the transaction. Product pricing is
    // resolved from the database inside the transaction and never trusted
    // from the browser cart.
    const shippingMethod = getShippingMethodForDistrict(district);
    const shippingCost = await getShippingCost(shippingMethod);
    const sellCountUpdates = aggregateSellCounts(data.items);

    // Create the order and update product sales atomically.
    const result = await prisma.$transaction(async (tx) => {
      const products = await tx.product.findMany({
        where: {
          id: { in: Array.from(new Set(data.items.map((item) => item.productId))) },
        },
        select: {
          id: true,
          name: true,
          images: true,
          price: true,
          discountPercent: true,
          inStock: true,
          sizeMode: true,
          sizeOptions: true,
          color: true,
          colorMode: true,
          colorOptions: true,
        },
      });
      const productsById = new Map(products.map((product) => [product.id, product]));
      const resolvedItems = data.items.map((item) => {
        const product = productsById.get(item.productId);

        if (!product || !product.inStock) {
          throw new OrderItemUnavailableError(
            "A product in your cart is no longer available. Please update your cart and try again."
          );
        }

        let basePrice = product.price;
        let selectedSize: string | null = null;

        if (product.sizeMode === "OPTIONS") {
          const selectedOption = parseSizeOptions(product.sizeOptions).find(
            (option) => option.label === item.selectedSize
          );

          if (!selectedOption) {
            throw new OrderItemUnavailableError(
              `The selected size for "${product.name}" is no longer available. Please update your cart.`
            );
          }

          basePrice = selectedOption.price;
          selectedSize = selectedOption.label;
        }

        let color = product.color.trim() || null;

        if (product.colorMode === "OPTIONS") {
          const selectedColor = product.colorOptions.find(
            (option) => option === item.color
          );

          if (!selectedColor) {
            throw new OrderItemUnavailableError(
              `The selected color for "${product.name}" is no longer available. Please update your cart.`
            );
          }

          color = selectedColor;
        }

        const unitPrice = calculateDiscountedPrice(
          basePrice,
          product.discountPercent
        );

        return {
          productId: product.id,
          productName: product.name,
          productImage: getOrderProductImage(product.images),
          selectedSize,
          color,
          quantity: item.quantity,
          unitPrice,
          totalPrice: unitPrice * item.quantity,
        };
      });
      const subtotal = resolvedItems.reduce(
        (sum, item) => sum + item.totalPrice,
        0
      );
      const total = subtotal + shippingCost;
      const createdOrder = await tx.order.create({
        data: {
          orderNumber: generateOrderNumber(),
          customerName: data.customerName,
          customerPhone: data.customerPhone,
          customerEmail: data.customerEmail || null,
          address: buildOrderAddress({
            houseRoad: data.houseRoad,
            areaVillage: data.areaVillage,
            townCityThana: data.townCityThana,
            district,
            postalCode: data.postalCode,
          }),
          shippingMethod,
          shippingCost,
          subtotal,
          total,
          paymentMethod: "COD",
          notes: data.notes || null,
          items: {
            create: resolvedItems,
          },
        },
      });

      await Promise.all(
        sellCountUpdates.map(({ productId, quantity }) =>
          tx.product.updateMany({
            where: { id: productId },
            data: {
              sellCount: {
                increment: quantity,
              },
            },
          })
        )
      );

      return { order: createdOrder, total };
    });

    return {
      success: true,
      orderNumber: result.order.orderNumber,
      orderId: result.order.id,
      total: result.total,
    };
  } catch (err) {
    if (err instanceof OrderItemUnavailableError) {
      return {
        success: false,
        error: err.message,
      };
    }

    console.error("Failed to create order:", err);

    if (err instanceof Error && err.message === "Shipping rate unavailable") {
      return {
        success: false,
        error: "Shipping is not configured for the selected district right now.",
      };
    }

    return {
      success: false,
      error: "Something went wrong. Please try again.",
    };
  }
}
