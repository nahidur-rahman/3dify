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

## Versions and how users receive updates

The initial application version is `0.1.0` in `package.json` and `package-lock.json`.
This is a release label: changing it does not deploy the website, invalidate browser
caches, or refresh users' tabs. Each deployment also has its own Vercel deployment
ID and source Git commit, so deployments remain distinguishable even if they share
the same application version.

Once a successful deployment is promoted to production, the production domain
serves it on fresh page loads and normal browser refreshes. Preview deployments
do not update the production domain. Users do not install or download an update
manually. Next.js gives generated JavaScript/CSS bundles content-hashed filenames,
so changed bundles have new URLs and unchanged assets can stay cached.

An already-open tab can keep running the previous JavaScript and cached routes;
deploying does not immediately replace the page on screen. In-app navigation can
reuse the client router cache, so it is not a guaranteed update point. A normal
browser refresh loads the current production version. This repository has no
service worker or PWA update cycle.

Product data has separate caching: catalog/detail reads use a 60-second
revalidation interval, and admin product writes invalidate the relevant paths and
cache tags. Time-based revalidation happens on requests and can serve stale data
while refreshing; it is not a promise that every open tab updates after 60 seconds.
The long image cache lifetime also does not delay code updates: changed product
image bytes get new content-hashed URLs.

For frequent early releases, use this convention:

| Release | Command | Example |
| --- | --- | --- |
| Small fix or adjustment, including a one-line change | `npm run version:patch` | `0.1.0` → `0.1.1` |
| Feature or substantial change during initial development | `npm run version:minor` | `0.1.7` → `0.2.0` |
| First stable public release | `npm run version:major` | `0.4.8` → `1.0.0` |

Bump once per intended production release, rather than once per file edit or preview
deployment. There is no need to wait between patch releases; several per day are
fine. After `1.0.0`, use patches for compatible fixes, minors for compatible
features, and majors for breaking changes. A slower release schedule uses the same
commands.

For example, before releasing a small fix:

```bash
npm run version:patch
npm run lint
npm run build
```

The version commands update both package files without creating a Git commit or
tag. Commit both files with the release changes, then deploy using the normal
production workflow. Run relevant regression tests as well; if the release changes
the database schema, apply compatible production migrations before deploying code
that needs them. Keep APIs and migrations compatible with older tabs during rollout.

For now, let users receive updates on their next full page load. If long-running
sessions later need an update notification, add a dismissible “New version
available” prompt with a user-triggered reload, taking care of unsaved checkout or
admin form input.

References: [Next.js 14 deployment and asset caching](https://nextjs.org/docs/14/app/building-your-application/deploying),
[Next.js router and data caches](https://nextjs.org/docs/14/app/building-your-application/caching),
[Vercel deployment skew protection](https://vercel.com/docs/skew-protection), and
[npm version commands](https://docs.npmjs.com/cli/commands/npm-version/).

## Image delivery and Vercel usage

`next.config.mjs` sets `images.unoptimized: true`. New product uploads are encoded
once using Sharp into three WebPs: main (750 px longest side), card (480 px), and
thumbnail (128 px, suitable for a 64 px thumbnail on a 2x screen). All use quality 80.
Aspect ratio, transparency and phone-photo orientation are preserved; small images
are not enlarged. EXIF metadata is removed. Detailed photos may exceed 10% of their
source size: the encoder preserves useful detail instead of enforcing a byte target.

The database stores the main file's reference. Components select the appropriate
versioned sibling URL; copy/delete/rollback operations include all three files.
Original source hashes keep upload deduplication working. Legacy filenames fall
back to their original URLs until converted. Uploads support still JPEG, PNG,
WebP and AVIF up to 4 MiB each; the browser sends one photo per request to stay
under Vercel's request-body limit. Text designs retain their existing 1 MiB limit.

Generated files have a 90-day (`7776000` seconds, approximately three months) storage cache lifetime.
Content-hashed, versioned filenames change when source bytes change. If encoding
settings change, bump `IMAGE_VARIANT_VERSION` and the matching filename pattern in
`src/lib/imageVariants.ts`; do not overwrite cached files. Browser caches download
only viewed images and can evict them; the TTL does not reserve space or preload
the entire library. Three generated files consume Supabase storage and bandwidth.

- Deploy this configuration to production for it to take effect. It does not reset
  existing usage; older deployments and already-open pages can still request optimization.
- After deployment, open a fresh page and inspect the browser Network panel. Image
  requests should use source URLs rather than `/_next/image?url=...`.
- Check Vercel team usage and Supabase bandwidth after deployment. This change
  addresses image transformations, not other hosting or storage quotas.

The Next.js optimizer configuration also sets a 90-day minimum TTL, WebP only,
quality 80, and widths 128/480/750, and allows only the configured Supabase bucket
host/path. Those optimizer settings (including `remotePatterns`) are inactive while
global optimization is disabled; actual delivery uses the stored variants and their
storage cache headers. Per-component `unoptimized` flags are unnecessary for stored
images. Local files such as logos and homepage assets are not processed by upload.

To measure existing product photos without writing to storage or the database:

```bash
node scripts/optimize-product-images.cjs --limit=5
```

Omit `--limit` to inspect the whole product library. Reports contain byte sizes for
each variant and the actual main-image reduction. To convert the existing library:

```bash
node scripts/optimize-product-images.cjs --apply
```

This creates variants before updating each product, skips already converted images,
and leaves originals for historical orders and older deployments. It checks for
concurrent admin edits and cleans newly created variants if the product update fails.
Deploy after conversion to refresh the cached catalog/search/product pages. Keep the
original images in a separate backup if full-resolution editing is needed: new
uploads retain only the three display versions, not a full-resolution master.

Vercel Hobby is restricted to non-commercial personal use; a selling storefront
needs a hosting plan/provider that permits commercial use. See the official
[Hobby plan terms](https://vercel.com/docs/plans/hobby) and
[image optimization limits](https://vercel.com/docs/image-optimization/limits-and-pricing).

## MVP checklist

- Docs are aligned (PLAN.md, TODO.md, README.md)
- Public route-group refactor completed without URL changes
- Reusable UI primitives added
- Dark/light toggle with localStorage persistence added
- Contact CTA disabled fallback behavior added when env is missing

## License

MIT (see LICENSE)
