# Cart, Cart View & Checkout — Implementation Plan

> **Created**: June 29, 2026  
> **Status**: Approved  
> **Reference**: [levronbd.shop](https://levronbd.shop/)

Add full shopping cart functionality: **Product → Add to Cart → Cart Drawer → Cart Page → Checkout Form → Order Confirmation**.

---

## Architecture Overview

- **Cart state**: React Context + localStorage (client-side, no server session)
- **Database**: Prisma (PostgreSQL) — new `Order`, `OrderItem`, `ShippingRate` models
- **Payment**: Cash on Delivery (COD) only (bKash/Nagad planned for later)
- **Checkout**: Guest checkout (phone + name, no user accounts required)
- **Shipping**: Admin-configurable rates stored in DB

---

## Phases

### Phase 1 — Cart State Management

| File | Action | Description |
|------|--------|-------------|
| `src/contexts/CartContext.tsx` | NEW | React Context + localStorage persistence |
| `src/app/layout.tsx` | MODIFY | Wrap app with `<CartProvider>` |

**CartItem type**: `{ productId, name, image, price, quantity, selectedSize?, color? }`  
**Exposed API**: `items`, `addToCart()`, `removeFromCart()`, `updateQuantity()`, `clearCart()`, `cartCount`, `cartTotal`

---

### Phase 2 — Add to Cart + Cart Drawer

| File | Action | Description |
|------|--------|-------------|
| `src/app/products/[id]/page.tsx` | NEW | Product detail page with image gallery, size selector, qty ± |
| `src/components/AddToCartSection.tsx` | NEW | Client component: size/qty selectors + Add to Cart / Buy Now |
| `src/components/CartDrawer.tsx` | NEW | Slide-in sidebar: items, qty controls, subtotal, checkout btn |
| `src/components/layout/Navbar.tsx` | MODIFY | Dynamic cart badge + cart drawer toggle |

**Add to Cart button** → adds item, opens CartDrawer  
**Buy it Now button** → adds item, redirects to `/checkout`

---

### Phase 3 — Cart Page (`/cart`)

| File | Action | Description |
|------|--------|-------------|
| `src/app/cart/page.tsx` | NEW | Full cart view: items list, qty update, remove, summary |
| `src/app/cart/layout.tsx` | NEW | Layout with Navbar + Footer |

Features: empty state, responsive 2-column layout, "Proceed to Checkout" button.

---

### Phase 4 — Checkout Page (`/checkout`)

| File | Action | Description |
|------|--------|-------------|
| `src/app/checkout/page.tsx` | NEW | Two-column checkout page |
| `src/app/checkout/layout.tsx` | NEW | Minimal layout (logo + back only) |
| `src/app/checkout/confirmation/page.tsx` | NEW | Order confirmation / thank you |
| `src/components/CheckoutForm.tsx` | NEW | Form with Zod validation |

**Left column (form):**
1. Contact: Phone (required)
2. Delivery: Name, Address, Apartment, City, Postal code, Phone
3. Shipping: Inside Dhaka / Outside Dhaka (rates from DB)
4. Payment: COD (preselected)
5. Order Notes (optional)
6. "Complete Order" button

**Right column:** Order summary with items, subtotal, shipping, total.

---

### Phase 5 — Database & Server Actions

| File | Action | Description |
|------|--------|-------------|
| `prisma/schema.prisma` | MODIFY | Add `Order`, `OrderItem`, `ShippingRate` models |
| `src/lib/orders.ts` | NEW | Server Action: `createOrder()` with Zod validation |
| `src/lib/shipping.ts` | NEW | `getShippingRates()`, `getShippingCost()` |
| `src/app/api/shipping/route.ts` | NEW | Public API for shipping rates |
| `src/app/admin/shipping/page.tsx` | NEW | Admin page to edit shipping rates |
| `src/app/api/admin/shipping/route.ts` | NEW | Admin API for shipping rate updates |

**New Prisma models:**

```prisma
enum OrderStatus {
  PENDING | CONFIRMED | PROCESSING | SHIPPED | DELIVERED | CANCELLED
}

enum ShippingMethod {
  INSIDE_DHAKA | OUTSIDE_DHAKA
}

model ShippingRate {
  method    ShippingMethod @unique
  label     String         // "Inside Dhaka"
  price     Float          // 70.00
  isActive  Boolean
}

model Order {
  orderNumber, customerName, customerPhone, customerEmail?,
  address, apartment?, city, postalCode?,
  shippingMethod, shippingCost, subtotal, total,
  paymentMethod (default: "COD"), status, notes?,
  items → OrderItem[]
}

model OrderItem {
  orderId, productId, productName, productImage?,
  selectedSize?, color?, quantity, unitPrice, totalPrice
}
```

**Default seed**: Inside Dhaka = ৳70, Outside Dhaka = ৳130

---

### Phase 6 — Navbar Integration

| File | Action | Description |
|------|--------|-------------|
| `src/components/layout/Navbar.tsx` | MODIFY | Dynamic badge from `useCart().cartCount` |

---

## Total Files: 18 (15 new, 3 modified)

## Design Decisions

- **Shipping rates**: Admin-configurable via `ShippingRate` DB model
- **Payment**: COD only (bKash/Nagad planned for future)
- **Guest checkout**: No user accounts. Orders by phone + name
- **Cart storage**: localStorage — persists across refreshes, not across devices
- **Order numbers**: Human-readable format `3D-XXXXX`

---

## Future Improvements & Next Tasks

Number | Feature / Improvement | Status | Priority | Description |
|-------|-----------------------|--------|----------|-------------|
| 1 | **Admin Order Management Dashboard** (`/admin/orders`) | ✅ **Completed** | High | Admin interface to list incoming orders, view customer/delivery details, and update order statuses (`PENDING` ➔ `CONFIRMED` ➔ `PROCESSING` ➔ `SHIPPED` ➔ `DELIVERED` / `CANCELLED`). |
| 2 | **Guest Order Tracking Page** (`/track-order`) | ✅ **Completed** | Medium | Public page allowing guest customers to enter their Phone Number + Order Number (e.g., `3D-XXXXX`) to track real-time order status. |
| 3 | **Mobile Header Cart Icon** | ⏳ Pending | UX Polish | Add a direct Cart icon button next to the hamburger menu on top mobile navbar for one-tap cart drawer access. |
| 4 | **Empty Cart Guard on Checkout** | ⏳ Pending | UX Polish | Redirect to `/cart` or render empty cart notice when visiting `/checkout` with 0 items. |
| 5 | **Discount Coupon / Promo Code System** | ⏳ Pending | Marketing | Add promo/coupon code input in checkout summary column to apply fixed or percentage discounts. |


