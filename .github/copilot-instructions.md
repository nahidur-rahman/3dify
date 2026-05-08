# Copilot Instructions

## Architecture
- This is a `Next.js 14` App Router storefront/admin app with `Prisma + PostgreSQL`, JWT cookie auth, and Supabase Storage for product images.
- Public pages live under `src/app/(public)/*`; admin UI lives under `src/app/admin/(dashboard)/*`; JSON APIs live under `src/app/api/*`.
- Prefer direct server-side Prisma reads in server components for page rendering (example: `src/app/(public)/products/page.tsx`) and use route handlers for client-driven mutations and admin actions.
- Route groups matter: keep public URL structure stable while organizing layouts separately via `src/app/(public)/layout.tsx` and `src/app/admin/(dashboard)/layout.tsx`.

## Auth and Admin Access
- Admin auth uses a signed JWT in the HTTP-only `admin-token` cookie; shared config is in `src/lib/authConfig.ts` and helpers are in `src/lib/auth.ts`.
- `middleware.ts` protects `/admin` and `/admin/:path*`, redirects unauthenticated users to `/admin/login`, and redirects authenticated users away from the login page.
- In server components and route handlers, use `getCurrentAdmin()` from `src/lib/adminSession.ts` when you need the admin record/role, not custom cookie parsing.
- Admin management is role-gated: only `SUPER` admins can create or delete admins, and they cannot delete themselves (`src/app/api/admins/route.ts`, `src/app/api/admins/[id]/route.ts`).

## Data and Validation Patterns
- Prisma schema is the source of truth in `prisma/schema.prisma`; `Product` stores image refs as `String[]`, optional `sizeOptions` as `Json`, and admin roles are `SUPER | ADMIN`.
- Client-facing TS types intentionally live in `src/lib/types.ts` instead of importing Prisma types into client components.
- Validate request bodies with Zod schemas from `src/lib/validation.ts`; existing APIs return `400` with `{ error, details: parsed.error.flatten() }` on invalid input.
- Keep password rules aligned with `STRONG_PASSWORD_REGEX` and the helper warnings in `src/lib/validation.ts`; the admin form relies on those exact helpers.

## Product and Image Flow
- Product reads should pass database records through `hydrateProductImages()` so stored storage paths become public URLs before rendering.
- Product writes should pass image refs through `normalizeProductImages()` so the database stores normalized bucket paths, not arbitrary display URLs.
- Upload flow is two-stage: `ProductForm` uploads files to `/api/upload`, which stores them under a `draft-*` folder, then `/api/products` or `/api/products/[id]` finalizes them with `moveDraftImagesToProductFolder()`.
- When deleting or replacing product images, use the helpers in `src/lib/productImages.ts`; they also clean up Supabase Storage.
- Keep `sizeMode`, `sizeOptions`, and `size` in sync with `src/components/ProductForm.tsx` and `productSchema`—`OPTIONS` mode expects structured size options plus a human-readable summary.

## UI and UX Conventions
- Styling is Tailwind-first with reusable primitives in `src/components/ui/*`; prefer existing `Button`, `Input`, `Card`, `Modal`, and `Skeleton` components before adding bespoke markup.
- Use `cn()` from `src/lib/utils.ts` for class merging and `categoryLabels` / pricing helpers from the same file instead of duplicating display logic.
- The app defaults to dark mode via the inline script in `src/app/layout.tsx`; avoid introducing theme logic that fights that bootstrap behavior.
- Commerce is chat-driven, not checkout-driven: contact CTAs depend on `NEXT_PUBLIC_WHATSAPP` and `NEXT_PUBLIC_MESSENGER`, and should degrade gracefully when env vars are missing.

## Developer Workflow
- Install and run locally with: `npm install`, `npx prisma generate`, `npx prisma migrate dev`, `npx prisma db seed`, `npm run dev`.
- If Prisma cannot connect to Supabase directly, the fallback bootstrap path is the SQL files in `prisma/migrations/20260425000000_initial/migration.sql` and `prisma/supabase-seed.sql`.
- The only verified repo script for validation is `npm run lint`; there is no dedicated test suite in `package.json`.
- Seed behavior matters: `prisma/seed.ts` resets the `admins` table and recreates the initial `SUPER` admin from `ADMIN_EMAIL` / `ADMIN_PASSWORD`.

## API Response Conventions
- Existing route handlers favor simple JSON responses: success payloads on `200/201`, `{ error: string }` for auth/not-found cases, and generic `{ error: "Internal server error" }` on unexpected failures.
- Follow the same concise error style unless a route already exposes structured field errors (for example admin creation and Zod validation failures).
