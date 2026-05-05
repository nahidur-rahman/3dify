import { z } from "zod";

const sizeOptionSchema = z.object({
  label: z.string().min(1, "Size option label is required").max(100),
  price: z.number().positive("Size option price must be positive"),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const adminCreateSchema = z
  .object({
    name: z.string().min(1, "Admin name is required").max(100),
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(8, "Confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const productSchema = z.object({
  name: z.string().min(1, "Product name is required").max(200),
  description: z.string().min(1, "Description is required"),
  price: z.number().positive("Price must be positive"),
  images: z.array(z.string().url()).default([]),
  category: z.enum(["FIGURINE", "PHONE_CASE", "HOME_DECOR", "CUSTOM"]),
  color: z.string().min(1, "Color is required"),
  size: z.string().min(1, "Size is required"),
  sizeMode: z.enum(["FIXED", "OPTIONS"]).default("FIXED"),
  sizeOptions: z.array(sizeOptionSchema).default([]),
  weight: z.number().positive("Weight must be positive"),
  infillPercentage: z.number().int().min(0).max(100).default(20),
  discountPercent: z.number().int().min(0).max(100).default(0),
  customizable: z.boolean().default(false),
  inStock: z.boolean().default(true),
  featured: z.boolean().default(false),
});

export const productUpdateSchema = productSchema.partial();

export type LoginInput = z.infer<typeof loginSchema>;
export type AdminCreateInput = z.infer<typeof adminCreateSchema>;
export type ProductInput = z.infer<typeof productSchema>;
export type ProductUpdateInput = z.infer<typeof productUpdateSchema>;
