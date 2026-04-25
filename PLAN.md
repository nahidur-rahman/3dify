# 3Dify BD Implementation Plan (MVP First)

This plan is the source of truth for implementation from Apr 25, 2026 onward.

## 1) Product Summary

| Field | Detail |
|---|---|
| Brand | 3Dify BD |
| Tagline | Premium 3D Printed Products - Made to Order in Bangladesh |
| Core flow | Browse -> Contact (WhatsApp/Messenger) -> We print -> Deliver |
| Payments | Offline/manual via chat |
| Admin model | Single admin account |
| Language | English |
| Release strategy | MVP first, hardening after MVP |

## 2) Locked Decisions

- Public routes will be refactored into src/app/(public) while preserving URLs.
- Dark/light toggle is in scope now.
- Theme preference persistence uses localStorage.
- Reusable UI primitives (Button/Input/Card/Modal) are in scope now.
- Seed strategy is idempotent mixed seed: admin upsert always, sample products optional.
- If contact env vars are missing, show disabled CTAs (never broken links).

## 3) Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 App Router |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Database | PostgreSQL (Supabase) |
| ORM | Prisma |
| Auth | JWT in HTTP-only cookie |
| Validation | Zod |
| Image storage | Local public/uploads (Supabase storage later) |
| Deployment | Vercel |

## 4) Current vs Target Structure

### 4.1 Current (implemented)

- Public pages currently live directly under src/app.
- Admin pages are under src/app/admin with dashboard route group.
- API routes exist for auth, products, categories, upload.
- lib/middleware.ts does not exist yet.
- components/ui primitives do not exist yet.

### 4.2 Target (in progress)

```text
src/
    app/
        (public)/
            page.tsx
            products/page.tsx
            products/[id]/page.tsx
            about/page.tsx
        admin/
            login/page.tsx
            (dashboard)/layout.tsx
            (dashboard)/page.tsx
            (dashboard)/products/page.tsx
            (dashboard)/products/new/page.tsx
            (dashboard)/products/[id]/edit/page.tsx
        api/
            auth/login/route.ts
            auth/logout/route.ts
            auth/me/route.ts
            products/route.ts
            products/[id]/route.ts
            categories/route.ts
            upload/route.ts
    components/
        layout/
        ui/ (new)
    lib/
        db.ts
        auth.ts
        validation.ts
        utils.ts
        middleware.ts (optional follow-up)
```

## 5) Data Model (Prisma)

### Product

id, name, description, price, images[], category, color, size, weight,
infillPercentage, customizable, inStock, featured, createdAt, updatedAt.

### Admin

id, email, password (bcrypt hash), name, createdAt.

### Category enum

FIGURINE, PHONE_CASE, HOME_DECOR, CUSTOM.

## 6) API Contract

### 6.1 Routes

| Route | Method | Auth | Purpose |
|---|---|---|---|
| /api/auth/login | POST | No | Admin login and session cookie set |
| /api/auth/logout | POST | Yes | Clear session cookie |
| /api/auth/me | GET | Yes | Return authenticated admin session |
| /api/products | GET | No | List products with filtering/sort/pagination |
| /api/products | POST | Yes | Create product |
| /api/products/[id] | GET | No | Fetch one product |
| /api/products/[id] | PUT | Yes | Update product |
| /api/products/[id] | DELETE | Yes | Delete product |
| /api/categories | GET | No | List categories |
| /api/upload | POST | Yes | Upload one or more product images |

### 6.2 /api/products query parameters

| Query key | Type | Notes |
|---|---|---|
| category | string | One enum value |
| search | string | Case-insensitive search on name/description |
| sort | string | newest, price-asc, price-desc |
| featured | boolean string | true enables featured filter |
| page | number | default 1 |
| limit | number | default 12 |

### 6.3 Upload constraints (current behavior)

- Only image MIME types.
- Max 5 MB per file.
- Multiple files accepted in one request.
- Stored in public/uploads and returned as /uploads/... URLs.

## 7) Page Requirements and Acceptance Criteria

### 7.1 Home (/)

Requirements:
- Hero, featured products, category showcase, how-it-works, CTA, floating contact.

Acceptance criteria:
- Featured section shows up to 4 featured in-stock products.
- Page still renders if DB is unavailable (empty featured state is acceptable).
- CTA links are valid or disabled if contact env vars are missing.

### 7.2 Products (/products)

Requirements:
- Search, category filter, sorting, pagination, responsive grid.

Acceptance criteria:
- Search and filters update URL query params.
- Default sort is newest.
- Pagination appears only when total pages > 1.
- Empty state message is shown when no products match.

### 7.3 Product Detail (/products/[id])

Requirements:
- Image, description, specs, badges, contact buttons, related products.

Acceptance criteria:
- 404 for missing product ID.
- Related products are from same category, in stock, excluding current product, max 4.
- Contact buttons use prefilled WhatsApp message and Messenger link.

### 7.4 About (/about)

Requirements:
- Startup story, 3D printing explanation, value proposition.

Acceptance criteria:
- Page is accessible from main navigation on mobile and desktop.

### 7.5 Admin Login (/admin/login)

Requirements:
- Email/password form with validation and clear error states.

Acceptance criteria:
- Valid login sets HTTP-only cookie and redirects to /admin.
- Invalid credentials return clear error message without exposing which field failed.

### 7.6 Admin Dashboard (/admin)

Requirements:
- Overview stats and quick actions.

Acceptance criteria:
- Cards show total products, featured products, out-of-stock products.
- Quick links to product management and add product are present.

### 7.7 Product Management (/admin/products)

Requirements:
- Product table with edit/delete actions.

Acceptance criteria:
- Table includes name, category, price, stock status, featured badge.
- Delete requires confirmation.

### 7.8 Add/Edit Product

Requirements:
- Full product form with image upload and field validation.

Acceptance criteria:
- Create and update flows persist data correctly.
- Upload errors surface friendly messages.

## 8) Scope Split

### 8.1 Now (MVP)

1. Docs alignment (PLAN, TODO, README).
2. Public route group refactor without URL changes.
3. UI primitives baseline (Button, Input, Card, Modal).
4. Dark/light toggle with localStorage persistence and first-paint mitigation.
5. Contact env fallback: disabled CTA state when links are not configured.
6. Seed strategy update for idempotent mixed behavior.
7. Lint and smoke verification.

### 8.2 Later (Hardening/Scale)

1. Central auth middleware for API and role expansion.
2. Rate limiting and optional CSRF protections.
3. Stronger upload verification (magic bytes, limits by count/dimensions).
4. Structured API error codes and logging improvements.
5. Storage migration from local uploads to cloud storage.

## 9) Security and Reliability Baseline

MVP must include:
- JWT secret must be explicitly configured in production.
- Auth-only endpoints enforce session checks.
- Upload endpoint enforces MIME and file-size limits.
- Admin routes redirect unauthenticated users to /admin/login.

## 10) Environment Variables

```env
# Database
DATABASE_URL=

# Auth
JWT_SECRET=

# Admin seed
ADMIN_EMAIL=
ADMIN_PASSWORD=

# Contact (public)
NEXT_PUBLIC_WHATSAPP=
NEXT_PUBLIC_MESSENGER=
NEXT_PUBLIC_SITE_URL=

# App
NEXT_PUBLIC_APP_NAME=3Dify BD

# Seed behavior (new)
SEED_SAMPLE_PRODUCTS=true
```

## 11) Deployment Checklist

- Create Supabase project and set DATABASE_URL.
- Set all environment variables in Vercel.
- Run prisma migrate deploy in production.
- Run seed script (admin always, sample products optional).
- Verify contact env values.
- Smoke test public pages and admin flows on mobile and desktop.

## 12) Verification Matrix

### 12.1 Automated

- npm run lint passes.

### 12.2 Manual smoke checks

1. Public pages load: /, /products, /products/[id], /about.
2. Product filters/search/sort/pagination behave as expected.
3. Admin login/logout and protected route redirect work.
4. Product create/edit/delete works from admin UI.
5. Image upload works and rejects invalid file types/sizes.
6. Contact buttons are active when configured and disabled when not configured.

## 13) Inputs Still Needed

- WhatsApp number with country code.
- Messenger page ID/username.
- Production database credentials.
- Final admin email/password.
- Real product image set.
