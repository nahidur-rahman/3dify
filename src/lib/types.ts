// Shared types that mirror Prisma models
// This avoids TS import issues with @prisma/client in some environments

export type Category = "FIGURINE" | "PHONE_CASE" | "HOME_DECOR" | "CUSTOM";
export type SizeMode = "FIXED" | "OPTIONS";
export type AdminRole = "SUPER" | "ADMIN";

export interface ProductSizeOption {
  label: string;
  price: number;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  images: string[];
  category: Category;
  color: string;
  size: string;
  sizeMode?: SizeMode;
  sizeOptions?: ProductSizeOption[];
  weight: number;
  infillPercentage: number;
  discountPercent?: number;
  customizable: boolean;
  inStock: boolean;
  featured: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface Admin {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
}

export interface ProductsResponse {
  products: Product[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
