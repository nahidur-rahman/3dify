# Admin email OTP login

Admin login now requires the account password followed by an eight-digit email code. The backend sends it through the existing `RESEND_API_KEY`, using the required server-side `ADMIN_OTP_FROM` environment variable. Set `ADMIN_OTP_FROM="3DifyBD OTP <otp@mail.3difybd.com>"` in `.env` and your hosting dashboard. Missing or invalid sender configuration prevents email delivery; there is no hardcoded fallback.

## Deployment

1. Apply the committed migration with `npx prisma migrate deploy`, then generate the client with `npx prisma generate` before building. The application fails closed if its authentication tables are missing.
2. Keep `JWT_SECRET` private and use at least 32 random bytes. The previous public fallback secret has been removed. Existing password-only sessions are deliberately rejected; admins must sign in again.
3. Set `ADMIN_OTP_FROM` to a single email address or `Name <email>` and verify its domain in Resend (for the example sender, `mail.3difybd.com`). Ensure the existing API key can send from this domain. Password verification never creates an authenticated session, including when Resend fails.
4. Set `NEXT_PUBLIC_SITE_URL=https://www.3difybd.com` in the hosting project's **Production** environment, then rebuild/redeploy. Use the exact origin shown in the admin page's browser address, including `www`. This setting is independent of the database and of your local `.env`. Next.js inlines `NEXT_PUBLIC_` variables at build time, so updating a setting without rebuilding does not update an existing deployment. Authentication mutations require JSON and reject mismatched browser origins. Production also rejects missing, HTTP, or localhost site URL configuration.
5. Run `prisma/admin-auth-cleanup.sql` once in the Supabase SQL Editor to enable a database cleanup job every minute. If hosting PostgreSQL elsewhere, schedule the two DELETE statements with your database scheduler. Exact expiry is enforced during verification using the database clock, independently of the job. Expired digests are also removed on authentication requests; scheduled deletion removes idle records within one minute of expiry.

## Security behavior

- A code expires exactly five minutes after challenge creation and is deleted on success, cancellation, or the configured guess limit (currently three incorrect guesses). A new challenge replaces the old one, including its browser secret. Resending does not extend or preserve the old code.
- Codes use cryptographically secure randomness and keyed SHA-256 digests bound to the challenge. Database records contain neither plaintext codes nor plaintext browser secrets. The browser secret is held in an HttpOnly cookie restricted to `/api/auth`, with Secure in production and SameSite Strict.
- Verification and resend use atomic PostgreSQL statements and row locks in a consistent order: admin first, then challenge. Verification rechecks the account and challenge after loading their digests, uses the locked row's attempt count, and checks expiry after acquiring the locks. Only a successful deletion can authorize a session. Pending challenges are bound to the current password hash and email; changing either makes them unusable. Deleting an admin cascades to the challenge.
- Limits are persisted in PostgreSQL: 10 password submissions per email per 15 minutes, 100 per source IP per 15 minutes, one code per admin per minute, and five codes per admin per 15 minutes. Account limits apply regardless of IP headers. Configure the reverse proxy to overwrite `X-Forwarded-For`; without one, the shared `unknown` source uses the same conservative source limit.
- Delivery is awaited with a five-second timeout per attempt and at most one retry for temporary failures. Retries use the same code and provider idempotency key. A failed or ambiguous provider response after that budget destroys the pending code; the administrator can retry after the cooldown. OTPs, passwords, browser secrets, and provider bodies are never logged by this flow.
- The session JWT includes the completed authentication method. Both API session reads and middleware reject legacy sessions and restrict JWT verification to HS256.
- Admin session tokens and their cookies expire after 14 days by default (`ADMIN_TOKEN_VALIDITY="14d"`). Set this variable in your hosting dashboard as well. The change applies to newly issued tokens; existing tokens keep their original expiry. OTP codes still expire after five minutes.

## Login performance

Password rate limits, the account lookup, and bounded cleanup share one database statement. Counter keys are locked in sorted order; cleanup runs after those locks and skips contended records. Cleanup excludes the current counter keys, and counter windows reset atomically when expired. Bcrypt remains at cost 12, including equivalent work for unknown accounts.

For valid credentials, challenge creation, cooldown, and send budgets are handled by one atomic statement. Resend consumes the longer send budget only when the cooldown permits a send. Email delivery is still awaited, followed by one activation statement that also returns the database time. A correct-password request therefore uses three database round trips plus bcrypt and Resend. OTP verification uses two database statements; restoring a valid pending challenge uses one. These changes require no new migration.

Local development measurements on October 12, 2026: wrong-credentials HTTP responses measured 3.36–4.51 seconds before optimization. Warm requests improved from 3.36–3.55 seconds to 0.83–0.84 seconds; the first request after recompilation took 2.39 seconds. These figures include local-server and network costs and are not a production latency guarantee.

An additional before/after profile used the connected database inside rolled-back transactions, with email delivery mocked:

| Stage | Before | After | Database statements before → after |
| --- | --- | --- | --- |
| Password check, including bcrypt | 1.44 s | 0.46 s | 5 → 1 |
| OTP creation and activation, excluding email delivery | 2.43 s | 0.49 s | 10 → 2 |
| Restore pending OTP | 1.21 s | 0.24 s | 5 → 1 |
| Wrong OTP | 1.21 s | 0.49 s | 5 → 2 |
| Correct OTP | 1.21 s | 0.49 s | 5 → 2 |

The transaction profile excludes its outer transaction setup/commit and normal dashboard rendering. Inbox arrival and successful login response time still depend on Resend and database proximity. No real emails were sent by these benchmarks, and their database changes were rolled back.

Separate-connection PostgreSQL checks in a temporary schema also verified rejection when a correct OTP expires during an observed row-lock wait, and when a password change commits while verification is waiting. The temporary schema was removed afterward. The committed regression tests also cover stale snapshots, simultaneous guesses, replacement challenges, cooldown budgets, and query-count bounds.

## Verification

Run the test files with `node --test`, `npx tsc --noEmit`, `npm run lint`, and `npm run build`. In PowerShell, use `$testFiles = @(rg --files tests -g '*.test.mjs'); node --test @testFiles`. The OTP regression tests cover replay, expiration, guessing limits, replacement, browser binding, account changes, provider failures, request validation, and session issuance.

On Windows, stop the development server before regenerating Prisma if its query-engine DLL is locked. A running dev server can also lock `.next/trace`; production builds should run with that server stopped or from an isolated checkout.

Before production rollout, confirm delivery to an administrator's mailbox with the deployed sender domain and run the migration and cleanup scheduler. Automated tests stub delivery and never send live verification emails.

## Production origin troubleshooting

`403 Invalid request origin.` occurs before credentials and database access. The allowed browser origin comes from the deployed `NEXT_PUBLIC_SITE_URL`. For `https://www.3difybd.com/admin/login`, configure `https://www.3difybd.com` rather than `http://localhost:3000` or `https://3difybd.com`, and redeploy with the new setting. Changing the local `.env` does not change the live hosting environment. The apex and `www` domains are different origins; serve admin login consistently on the configured domain.

An empty JSON login request from the configured origin should return `400 Enter a valid email and password.` rather than an origin error. This checks deployment configuration without sending credentials, accessing accounts, or sending OTP emails. Untrusted origins must continue to return 403. Do not fix an origin mismatch by disabling the origin checks or allowing every host.
