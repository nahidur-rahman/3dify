# 3Dify

3Dify is a 3D printed products storefront built with Next.js App Router.

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
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_STORAGE_BUCKET=product-images
JWT_SECRET=

ADMIN_EMAIL=
ADMIN_PASSWORD=

NEXT_PUBLIC_WHATSAPP=
NEXT_PUBLIC_MESSENGER=
NEXT_PUBLIC_FACEBOOK_URL=
NEXT_PUBLIC_INSTAGRAM_URL=
NEXT_PUBLIC_SITE_URL=
NEXT_PUBLIC_APP_NAME=3Dify

PRODUCT_IMAGE_LIMIT=

SEED_SAMPLE_PRODUCTS=true
```

Notes:
- JWT_SECRET should be a strong random value (minimum 32 characters).
- SUPABASE_SERVICE_ROLE_KEY is required for server-side Storage upload/delete.
- NEXT_PUBLIC_WHATSAPP format example: 8801XXXXXXXXX.
- NEXT_PUBLIC_FACEBOOK_URL and NEXT_PUBLIC_INSTAGRAM_URL should be full public profile/page URLs.
- PRODUCT_IMAGE_LIMIT is optional. Set it to a positive integer to cap total images per product; leave it blank for unlimited uploads.
- When the cap is set, the admin product form warns and skips any extra selected files beyond the limit.

## Name keychain customization

Products in **Keychains → Name Keychains** support up to 10 labeled text-design
images, fixed base/text colors or separate base/text color choices. Design images
use a separate uploader and a 1 MB per-image limit; compact thumbnails around
600 × 200 px are recommended. Customers choose a design, enter the name to print
(up to 80 characters), and optionally add design instructions (up to 500 characters).
Their choices appear in cart, checkout, tracking, admin order details and order emails.

Apply the new database migration **before** deploying this code, regenerate Prisma,
and restart the application. Existing name keychains inherit their previous color
as the base and use `As shown` for text until updated by an admin. Existing orders
are preserved. See the [implementation plan and rollout checks](docs/name-keychain-customization-plan.md).

Run customization regression tests with `node --test tests/nameKeychain.test.mjs`.

## Order emails (Resend)

Every successful checkout sends a customer receipt and a separate admin notification
after the order and its items commit to the database. Both messages use HTML and
plain text, saved product prices, BDT totals, delivery details, and Bangladesh time.
The customer receipt links to order tracking; the admin notification links to the
order in the dashboard. New orders are described as received and awaiting review.

Configure these server environment variables in `.env` and your hosting dashboard:

```env
RESEND_API_KEY=your-resend-api-key
ORDER_EMAIL_FROM="3Dify Orders <orders@mail.3difybd.com>"
ORDER_ADMIN_EMAIL=3difybd@gmail.com
ORDER_EMAIL_REPLY_TO=3difybd@gmail.com
NEXT_PUBLIC_SITE_URL=https://3difybd.com
```

`ORDER_ADMIN_EMAIL` is independent of the admin login/seed `ADMIN_EMAIL`.
Customer replies go to `ORDER_EMAIL_REPLY_TO` (defaults to `ORDER_ADMIN_EMAIL`);
admin replies go to the customer's email. To change the sender later, set
`ORDER_EMAIL_FROM` to an address on a domain verified in Resend. Sending from a
verified domain does not create a mailbox; the reply-to address must receive mail.
Use your deployed site's URL in production and localhost during local development.
Restart the development server or redeploy after changing environment variables.
Never put the Resend key in a `NEXT_PUBLIC_` variable or commit it to Git.

The service uses Resend's batch REST endpoint through native server-side `fetch`,
so it adds no dependencies or database migrations. It awaits delivery submission
and retries temporary network/API failures up to three times, with a four-second
timeout per request and short backoff. An order-specific idempotency key prevents
duplicate emails during those retries. Invalid credentials/configuration and quota
errors are logged without rolling back the saved order. If all attempts fail,
there is no background retry queue: check server logs and Resend before resending.
API acceptance does not guarantee inbox delivery; check Resend's delivery/bounce
events for final delivery status. The checkout page allows 30 seconds on hosts
that honor Next.js `maxDuration`.

Run the email and checkout regression tests with:

```bash
node --test tests/orderEmails.test.mjs tests/pricing.test.mjs
```

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

The seed requires `ADMIN_EMAIL` and `ADMIN_PASSWORD` from `.env`. Apply the complete migration history with `npx prisma migrate deploy` when setting up a hosted database. The legacy `prisma/supabase-seed.sql` is outdated and should not be used.

For a fresh start, permanently delete all products, orders, order items, admins, login challenges, and authentication rate limits, then create one SUPER admin using the `.env` credentials:

```bash
npm run db:fresh-start
```

This command commits deletion and admin creation together in one transaction. Shipping rates, database structure, migration history, and files in Supabase Storage are preserved. Sample products are always skipped during a fresh start.

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

- `npm run db:seed` creates or updates the SUPER admin matching `ADMIN_EMAIL`, using `ADMIN_PASSWORD`, without deleting other records. Passwords are hashed with bcrypt; missing credentials fail before database changes.
- `ADMIN_USERNAME` and `ADMIN_NAME` optionally override the defaults `admin` and `Super Admin`. An existing conflicting username causes a rollback.
- Sample products are opt-in with `SEED_SAMPLE_PRODUCTS=true`; the default is false.
- `npm run db:fresh-start` explicitly clears the six tables listed above and seeds only the SUPER admin.

## Deployment (Vercel)

Admin sign-in requires password plus a single-use email OTP. See [admin OTP deployment and cleanup setup](docs/admin-otp-login.md) before deploying this change.

1. Create Supabase project and get DATABASE_URL, DIRECT_URL, SUPABASE_URL, and SUPABASE_SERVICE_ROLE_KEY.
2. Create the Storage bucket defined by SUPABASE_STORAGE_BUCKET (default: product-images).
3. Set all environment variables in Vercel.
4. Run production migrations:

```bash
npx prisma migrate deploy
```

5. Run seed for admin bootstrap.
6. Verify:
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
