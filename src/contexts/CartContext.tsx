"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";

// --- Types ---

export interface CartItem {
  productId: string;
  name: string;
  image: string;
  price: number; // Unit price (after discount)
  quantity: number;
  selectedSize?: string;
  color?: string;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (productId: string, selectedSize?: string, color?: string) => void;
  updateQuantity: (productId: string, quantity: number, selectedSize?: string, color?: string) => void;
  clearCart: () => void;
  cartCount: number;
  cartTotal: number;
  isDrawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
}

const STORAGE_KEY = "3dify-cart";

const CartContext = createContext<CartContextType | undefined>(undefined);

// --- Helpers ---

function getCartKey(item: { productId: string; selectedSize?: string; color?: string }): string {
  return `${item.productId}__${item.selectedSize || "default"}__${item.color || "default"}`;
}

function loadCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveCart(items: CartItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Storage full or unavailable — silently ignore
  }
}

// --- Provider ---

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Hydrate from localStorage on mount
  useEffect(() => {
    setItems(loadCart());
    setIsHydrated(true);
  }, []);

  // Persist to localStorage on every change (after hydration)
  useEffect(() => {
    if (isHydrated) {
      saveCart(items);
    }
  }, [items, isHydrated]);

  const addToCart = useCallback((newItem: CartItem) => {
    setItems((prev) => {
      const key = getCartKey(newItem);
      const existingIndex = prev.findIndex((i) => getCartKey(i) === key);

      if (existingIndex >= 0) {
        // Increase quantity of existing item
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + newItem.quantity,
        };
        return updated;
      }

      // Add new item
      return [...prev, { ...newItem }];
    });
  }, []);

  const removeFromCart = useCallback(
    (productId: string, selectedSize?: string, color?: string) => {
      setItems((prev) =>
        prev.filter((i) => getCartKey(i) !== getCartKey({ productId, selectedSize, color }))
      );
    },
    []
  );

  const updateQuantity = useCallback(
    (productId: string, quantity: number, selectedSize?: string, color?: string) => {
      if (quantity < 1) return;
      setItems((prev) =>
        prev.map((i) =>
          getCartKey(i) === getCartKey({ productId, selectedSize, color })
            ? { ...i, quantity }
            : i
        )
      );
    },
    []
  );

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const cartCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const cartTotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  const openDrawer = useCallback(() => setIsDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setIsDrawerOpen(false), []);

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartCount,
        cartTotal,
        isDrawerOpen,
        openDrawer,
        closeDrawer,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

// --- Hook ---

export function useCart(): CartContextType {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return ctx;
}
