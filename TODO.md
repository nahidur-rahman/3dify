# ✅ 3Dify BD — Build Todo List

## Phase 1: Project Setup
- [ ] Initialize Next.js project (TypeScript, Tailwind CSS, App Router, src dir)
- [ ] Install dependencies (Prisma, bcrypt, jsonwebtoken, zod, react-icons)
- [ ] Configure Tailwind theme (colors, fonts)
- [ ] Set up folder structure (components, lib, api, prisma)
- [ ] Create `.env.example` with all required variables

## Phase 2: Database & Schema
- [ ] Write Prisma schema (Product, Admin, Category enum)
- [ ] Create Prisma client singleton (`lib/db.ts`)
- [ ] Generate Prisma client
- [ ] Create initial migration
- [ ] Write seed script (admin user + sample products)

## Phase 3: Lib Utilities
- [ ] Auth helpers — JWT sign, verify, cookie management (`lib/auth.ts`)
- [ ] Auth middleware for protected API routes (`lib/middleware.ts`)
- [ ] Zod validation schemas for Product, Login (`lib/validation.ts`)
- [ ] General utility functions (`lib/utils.ts`)

## Phase 4: API Routes
- [ ] `POST /api/auth/login` — admin login
- [ ] `POST /api/auth/logout` — admin logout
- [ ] `GET /api/products` — list products (with filters, search, pagination)
- [ ] `POST /api/products` — create product (admin only)
- [ ] `GET /api/products/[id]` — get single product
- [ ] `PUT /api/products/[id]` — update product (admin only)
- [ ] `DELETE /api/products/[id]` — delete product (admin only)
- [ ] `POST /api/upload` — image upload handler
- [ ] `GET /api/categories` — list categories

## Phase 5: Shared Components
- [ ] `Navbar` — logo, nav links, responsive mobile menu
- [ ] `Footer` — links, contact info, copyright
- [ ] `Button` — reusable button with variants
- [ ] `Input` — reusable form input
- [ ] `ProductCard` — image, name, price, category badge
- [ ] `ProductGrid` — responsive grid of ProductCards
- [ ] `ContactButtons` — WhatsApp + Messenger buttons
- [ ] `FloatingContact` — fixed bottom-right contact widget
- [ ] `CategoryCard` — category showcase card
- [ ] `HeroSection` — homepage hero with tagline + CTA
- [ ] `HowItWorks` — step-by-step process section
- [ ] `SearchFilter` — search input + category filter + sort
- [ ] `AdminSidebar` — admin navigation sidebar

## Phase 6: Public Pages
- [ ] Homepage (`/`) — hero, featured products, categories, how it works
- [ ] Products page (`/products`) — grid, filters, search
- [ ] Product detail page (`/products/[id]`) — full info, contact buttons
- [ ] About page (`/about`) — startup story
- [ ] Layout — root layout with Navbar, Footer, FloatingContact

## Phase 7: Admin Pages
- [ ] Admin login page (`/admin/login`)
- [ ] Admin layout — sidebar, auth check, redirect if not logged in
- [ ] Admin dashboard (`/admin`) — overview stats
- [ ] Products list (`/admin/products`) — table with actions
- [ ] Add product (`/admin/products/new`) — form with validation
- [ ] Edit product (`/admin/products/[id]/edit`) — pre-filled form

## Phase 8: Polish & Extras
- [ ] Dark/light mode toggle
- [ ] Loading states & skeletons
- [ ] Error pages (404, 500)
- [ ] Meta tags & SEO (title, description, OG images)
- [ ] Responsive testing (mobile, tablet, desktop)
- [ ] Toast notifications for admin actions

## Phase 9: Deployment
- [ ] Create `.env.example` with all variables documented
- [ ] Verify Vercel compatibility (no unsupported features)
- [ ] Create Supabase project
- [ ] Run migrations on production DB
- [ ] Seed admin account
- [ ] Set environment variables on Vercel
- [ ] Deploy & test live site

---

## 📌 Status Legend
- [ ] Not started
- [x] Completed
- 🔄 In progress
