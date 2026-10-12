# Admin email OTP login

Admin login now requires the account password followed by an eight-digit email code. The backend sends it through the existing `RESEND_API_KEY`, using the required server-side `ADMIN_OTP_FROM` environment variable. Set `ADMIN_OTP_FROM="3DifyBD OTP <otp@mail.3difybd.com>"` in `.env` and your hosting dashboard. Missing or invalid sender configuration prevents email delivery; there is no hardcoded fallback.

## Deployment

1. Apply the committed migration with `npx prisma migrate deploy`, then generate the client with `npx prisma generate` before building. The application fails closed if its authentication tables are missing.
2. Keep `JWT_SECRET` private and use at least 32 random bytes. The previous public fallback secret has been removed. Existing password-only sessions are deliberately rejected; admins must sign in again.
3. Set `ADMIN_OTP_FROM` to a single email address or `Name <email>` and verify its domain in Resend (for the example sender, `mail.3difybd.com`). Ensure the existing API key can send from this domain. Password verification never creates an authenticated session, including when Resend fails.
4. Set `NEXT_PUBLIC_SITE_URL` to the actual production origin (for example `https://3difybd.com`). Authentication mutations require JSON and reject mismatched browser origins.
5. Run `prisma/admin-auth-cleanup.sql` once in the Supabase SQL Editor to enable a database cleanup job every minute. If hosting PostgreSQL elsewhere, schedule the two DELETE statements with your database scheduler. Exact expiry is enforced during verification using the database clock, independently of the job. Expired digests are also removed on authentication requests; scheduled deletion removes idle records within one minute of expiry.

## Security behavior

- A code expires exactly five minutes after challenge creation and is deleted on success, cancellation, or the fifth incorrect guess. A new challenge replaces the old one, including its browser secret. Resending does not extend or preserve the old code.
- Codes use cryptographically secure randomness and keyed SHA-256 digests bound to the challenge. Database records contain neither plaintext codes nor plaintext browser secrets. The browser secret is held in an HttpOnly cookie restricted to `/api/auth`, with Secure in production and SameSite Strict.
- Verification and resend use database transactions and row locks in a consistent order. Only one concurrent verification can consume a code. Pending challenges are bound to the current password hash and email; changing either makes them unusable. Deleting an admin cascades to the challenge.
- Limits are persisted in PostgreSQL: 10 password submissions per email per 15 minutes, 100 per source IP per 15 minutes, one code per admin per minute, and five codes per admin per 15 minutes. Account limits apply regardless of IP headers. Configure the reverse proxy to overwrite `X-Forwarded-For`; without one, the shared `unknown` source uses the same conservative source limit.
- Delivery is awaited with a five-second timeout per attempt and at most one retry for temporary failures. Retries use the same code and provider idempotency key. A failed or ambiguous provider response after that budget destroys the pending code; the administrator can retry after the cooldown. OTPs, passwords, browser secrets, and provider bodies are never logged by this flow.
- The session JWT includes the completed authentication method. Both API session reads and middleware reject legacy sessions and restrict JWT verification to HS256.

## Verification

Run the test files with `node --test`, `npx tsc --noEmit`, `npm run lint`, and `npm run build`. In PowerShell, use `$testFiles = @(rg --files tests -g '*.test.mjs'); node --test @testFiles`. The OTP regression tests cover replay, expiration, guessing limits, replacement, browser binding, account changes, provider failures, request validation, and session issuance.

On Windows, stop the development server before regenerating Prisma if its query-engine DLL is locked. A running dev server can also lock `.next/trace`; production builds should run with that server stopped or from an isolated checkout.

Before production rollout, confirm delivery to an administrator's mailbox with the deployed sender domain and run the migration and cleanup scheduler. Automated tests stub delivery and never send live verification emails.
