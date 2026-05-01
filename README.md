# 3Dify BD

3Dify BD is a 3D printed products storefront built with Next.js App Router.

## Product summary

- Public users can browse products and order through WhatsApp or Messenger.
- Payments are handled offline through chat.
- A protected admin dashboard manages product CRUD.

## Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Prisma + PostgreSQL (Supabase)
- JWT auth (HTTP-only cookie)
- Zod validation

## Implemented routes

### Public pages

- /
- /products
- /products/[id]
- /about

### Admin pages

- /admin/login
- /admin
- /admin/products
- /admin/products/new
- /admin/products/[id]/edit

### API routes

- POST /api/auth/login
- POST /api/auth/logout
- GET /api/auth/me
- GET /api/products
- POST /api/products
- GET /api/products/[id]
- PUT /api/products/[id]
- DELETE /api/products/[id]
- GET /api/categories
- POST /api/upload

## Prerequisites

- Node.js 18+
- npm 9+
- PostgreSQL database URL (Supabase recommended)

## Environment setup

1. Copy .env.example to .env
2. Fill values:

```env
DATABASE_URL=
DIRECT_URL=
JWT_SECRET=

ADMIN_EMAIL=
ADMIN_PASSWORD=

NEXT_PUBLIC_WHATSAPP=
NEXT_PUBLIC_MESSENGER=
NEXT_PUBLIC_SITE_URL=
NEXT_PUBLIC_APP_NAME=3Dify BD

SEED_SAMPLE_PRODUCTS=true
```

Notes:
- JWT_SECRET should be a strong random value (minimum 32 characters).
- NEXT_PUBLIC_WHATSAPP format example: 8801XXXXXXXXX.

## Local development

Install dependencies:

```bash
npm install
```

Run Prisma client generation and migrations:

```bash
npx prisma generate
npx prisma migrate dev
```

Seed database:

```bash
npx prisma db seed
```

If Prisma cannot reach Supabase from your network, run the SQL seed instead:

1. Open `prisma/migrations/20260425000000_initial/migration.sql` in the Supabase SQL editor and run it once.
2. Open `prisma/supabase-seed.sql` and run it to insert the admin record and sample products.

Start dev server:

```bash
npm run dev
```

Open http://localhost:3000

## Scripts

- npm run dev - start development server
- npm run build - build production bundle
- npm run start - run production server
- npm run lint - run lint checks
- npx prisma db seed - run Prisma seed script

## Seed behavior

- Admin is created/upserted using ADMIN_EMAIL and ADMIN_PASSWORD.
- Sample products can be controlled by SEED_SAMPLE_PRODUCTS.

## Deployment (Vercel)

1. Create Supabase project and get DATABASE_URL.
2. Set all environment variables in Vercel, including DIRECT_URL.
3. Run production migrations:

```bash
npx prisma migrate deploy
```

4. Run seed for admin bootstrap.
5. Verify:
- public pages load
- admin login works
- product CRUD works
- upload route works
- contact links are configured

## MVP checklist

- Docs are aligned (PLAN.md, TODO.md, README.md)
- Public route-group refactor completed without URL changes
- Reusable UI primitives added
- Dark/light toggle with localStorage persistence added
- Contact CTA disabled fallback behavior added when env is missing

## License

MIT (see LICENSE)
