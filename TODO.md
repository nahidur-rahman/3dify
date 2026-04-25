# 3Dify BD Implementation TODO (MVP First)

Updated on Apr 25, 2026 to match current codebase reality.

## 1) Completed Baseline

### Core setup and backend
- [x] Next.js 14 App Router + TypeScript + Tailwind project scaffolded
- [x] Dependencies installed (Prisma, jose, bcryptjs, zod, react-icons)
- [x] Prisma models implemented (Product, Admin, Category enum)
- [x] Prisma client singleton implemented
- [x] Seed script exists (admin upsert + sample products)
- [x] Auth helpers implemented (JWT sign/verify/session cookie)
- [x] Zod validation schemas implemented
- [x] Utility helpers implemented

### API routes
- [x] POST /api/auth/login
- [x] POST /api/auth/logout
- [x] GET /api/auth/me
- [x] GET /api/products
- [x] POST /api/products
- [x] GET /api/products/[id]
- [x] PUT /api/products/[id]
- [x] DELETE /api/products/[id]
- [x] GET /api/categories
- [x] POST /api/upload

### Pages and major components
- [x] Public pages: /, /products, /products/[id], /about
- [x] Admin pages: /admin/login, /admin, /admin/products, /admin/products/new, /admin/products/[id]/edit
- [x] Root layout with Navbar, Footer, FloatingContact
- [x] Core components: HeroSection, CategoryShowcase, HowItWorks, ProductCard, ProductGrid, SearchFilter, ContactButtons, AdminSidebar
- [x] .env.example exists and includes required variables

## 2) Current Sprint (Docs First)

- [x] Step 1: Rewrite PLAN.md with explicit scope, API contract, and acceptance criteria
- [x] Step 2: Update TODO.md to real completion state
- [x] Step 3: Rewrite README.md with project-specific setup/run/deploy guidance

## 3) MVP Work Remaining (Code)

### Structure and UI foundation
- [x] Refactor public routes into src/app/(public) without URL changes
- [x] Add reusable UI primitives in src/components/ui:
- [x] Button
- [x] Input
- [x] Card
- [x] Modal baseline

### Theming
- [x] Add dark/light mode toggle
- [x] Persist theme in localStorage
- [x] Prevent first-paint theme flash

### Contact fallback behavior
- [x] Show disabled WhatsApp CTA when NEXT_PUBLIC_WHATSAPP is missing
- [x] Show disabled Messenger CTA when NEXT_PUBLIC_MESSENGER is missing
- [x] Add clear helper text for disabled contact actions

### Seed behavior
- [x] Add SEED_SAMPLE_PRODUCTS flag support
- [x] Keep admin upsert always idempotent
- [x] Make sample product insertion optional and idempotent-safe

## 4) MVP Verification

- [x] npm run lint passes
- [ ] Public smoke test: /, /products, /products/[id], /about
- [ ] Product list behavior: search, category filter, sorting, pagination
- [ ] Admin auth flow: login, protected routes, logout
- [ ] Admin product CRUD flow: create, edit, delete
- [ ] Upload validation: rejects non-image and >5MB files
- [ ] Contact CTA behavior: active when configured, disabled when missing env

## 5) Post-MVP (Later)

- [ ] Add centralized API auth middleware (optional)
- [ ] Add rate limiting on auth endpoints
- [ ] Add stronger upload checks (magic bytes/dimensions/count limits)
- [ ] Add structured API error codes
- [ ] Add toast notifications for admin actions
- [ ] Consider migrating uploads to cloud storage

## Status legend

- [ ] Not done
- [x] Done
