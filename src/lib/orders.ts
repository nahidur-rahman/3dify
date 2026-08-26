"use server";

import { prisma } from "@/lib/db";
import { z } from "zod";
import { getShippingCost } from "@/lib/shipping";

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
  productName: z.string().min(1),
  productImage: z.string().optional(),
  selectedSize: z.string().optional(),
  color: z.string().optional(),
  quantity: z.number().int().min(1),
  unitPrice: z.number().min(0),
});

const CreateOrderSchema = z.object({
  customerName: z.string().min(1, "Name is required"),
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
    .min(1, "Email is required")
    .email("Enter a valid email address")
    .refine(
      (val) => {
        const domain = val.split("@")[1]?.toLowerCase();
        return domain ? ALLOWED_EMAIL_DOMAINS.includes(domain) : false;
      },
      "Please use a popular email provider (Gmail, Yahoo, Outlook, etc.)"
    ),
  address: z.string().min(1, "Address is required"),
  apartment: z.string().optional(),
  city: z.string().min(1, "City is required"),
  postalCode: z.string().optional(),
  shippingMethod: z.enum(["INSIDE_DHAKA", "OUTSIDE_DHAKA"]),
  notes: z.string().optional(),
  items: z.array(OrderItemSchema).min(1, "Cart is empty"),
});

export type CreateOrderInput = z.infer<typeof CreateOrderSchema>;

export interface OrderResult {
  success: boolean;
  orderNumber?: string;
  orderId?: string;
  error?: string;
  fieldErrors?: Record<string, string[]>;
}

// --- Generate human-readable order number ---

function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `3D-${timestamp}${random}`;
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

  try {
    // Calculate costs
    const shippingCost = await getShippingCost(data.shippingMethod);
    const subtotal = data.items.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0
    );
    const total = subtotal + shippingCost;

    // Create order + items in a transaction
    const order = await prisma.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        customerEmail: data.customerEmail || null,
        address: data.address,
        apartment: data.apartment || null,
        city: data.city,
        postalCode: data.postalCode || null,
        shippingMethod: data.shippingMethod,
        shippingCost,
        subtotal,
        total,
        paymentMethod: "COD",
        notes: data.notes || null,
        items: {
          create: data.items.map((item) => ({
            productId: item.productId,
            productName: item.productName,
            productImage: item.productImage || null,
            selectedSize: item.selectedSize || null,
            color: item.color || null,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.unitPrice * item.quantity,
          })),
        },
      },
    });

    return {
      success: true,
      orderNumber: order.orderNumber,
      orderId: order.id,
    };
  } catch (err) {
    console.error("Failed to create order:", err);
    return {
      success: false,
      error: "Something went wrong. Please try again.",
    };
  }
}
