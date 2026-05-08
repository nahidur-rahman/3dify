import { z } from "zod";

const sizeOptionSchema = z.object({
  label: z.string().min(1, "Size option label is required").max(100),
  price: z.number().positive("Size option price must be positive"),
});

export const PASSWORD_MIN_LENGTH = 8;
export const STRONG_PASSWORD_MESSAGE =
  "Use minimum 8 characters including 1 uppercase, 1 lowercase, 1 number, and 1 symbol";

const STRONG_PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9\s]).{8,}$/;

const passwordRequirementDefinitions = [
  {
    key: "length",
    label: "8+",
    message: "minimum 8 characters",
    test: (password: string) => password.length >= PASSWORD_MIN_LENGTH,
  },
  {
    key: "uppercase",
    label: "A-Z",
    message: "1 uppercase",
    test: (password: string) => /[A-Z]/.test(password),
  },
  {
    key: "lowercase",
    label: "a-z",
    message: "1 lowercase",
    test: (password: string) => /[a-z]/.test(password),
  },
  {
    key: "number",
    label: "0-9",
    message: "1 number",
    test: (password: string) => /\d/.test(password),
  },
  {
    key: "symbol",
    label: "Sym",
    message: "1 symbol",
    test: (password: string) => /[^A-Za-z0-9\s]/.test(password),
  },
] as const;

export function getPasswordRequirementChecks(password: string) {
  return passwordRequirementDefinitions.map((requirement) => ({
    key: requirement.key,
    label: requirement.label,
    met: requirement.test(password),
  }));
}

function formatMissingRequirements(missingRequirements: string[]) {
  if (missingRequirements.length === 1) {
    return missingRequirements[0];
  }

  if (missingRequirements.length === 2) {
    return `${missingRequirements[0]}, and ${missingRequirements[1]}`;
  }

  return `${missingRequirements.slice(0, -1).join(", ")}, and ${missingRequirements[missingRequirements.length - 1]}`;
}

export function getStrongPasswordWarning(password: string) {
  const lengthMissing = password.length < PASSWORD_MIN_LENGTH;
  const missingRequirements = passwordRequirementDefinitions
    .slice(1)
    .filter((requirement) => !requirement.test(password))
    .map((requirement) => requirement.message);

  if (lengthMissing) {
    if (missingRequirements.length === 0) {
      return "Use minimum 8 characters";
    }

    return `Use minimum 8 characters including ${formatMissingRequirements(missingRequirements)}`;
  }

  if (missingRequirements.length === 0) {
    return "";
  }

  return `Use ${formatMissingRequirements(missingRequirements)}`;
}

export function isStrongPassword(password: string) {
  return STRONG_PASSWORD_REGEX.test(password);
}

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const adminCreateSchema = z
  .object({
    name: z.string().min(1, "Admin name is required").max(100),
    email: z.string().email("Invalid email address"),
    password: z
      .string()
      .regex(STRONG_PASSWORD_REGEX, STRONG_PASSWORD_MESSAGE),
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
