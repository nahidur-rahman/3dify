// Shared types that mirror Prisma models
// This avoids TS import issues with @prisma/client in some environments

export type Category = "FIGURINE" | "PHONE_CASE" | "HOME_DECOR" | "CUSTOM";

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  images: string[];
  category: Category;
  color: string;
  size: string;
  weight: number;
  infillPercentage: number;
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
