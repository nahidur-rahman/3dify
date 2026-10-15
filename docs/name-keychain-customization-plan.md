# Name keychain customization

Scope: only `KEYCHAINS` / `Name Keychains`. Other products retain their existing color and purchase controls.

## Dependency order

1. Database and shared contracts: add base/text fixed colors, separate option lists, and a JSON array of stable design IDs, labels and image references to products. Add a nullable JSON customization snapshot to order items. Use the existing color mode for both color lists.
2. Product services: validate complete merged product state on updates; enforce at most 10 designs, unique IDs, labels and safe image URLs. Hydrate and clean up design assets alongside product images while keeping their upload limit separate.
3. Admin: separate compact design uploader with editable labels/removal and preview; fixed base/text fields or independent available color lists.
4. Storefront: two color dropdowns or fixed values; accessible compact image selection cards, required print name (80 characters), optional instructions (500 characters), contact links for further personalization. Require a design only when designs exist.
5. Cart and orders: include all fulfillment choices in cart identity, persist them locally, validate them against current product settings in the checkout transaction, snapshot server-resolved colors/design labels, display concise summaries in cart, checkout, tracking, admin details and emails.
6. Verification: migration syntax/compatibility, Prisma generation, TypeScript/lint/build, and regression tests for customization, cart identity, tampered/stale selections, pricing and email escaping.

## Evaluation and decisions before implementation

- Additive migration: existing orders have null customization. Existing name keychains inherit their old color as the base, and use `As shown` for the previously unspecified text color until an admin configures it. Old option lists remain available as base options.
- Stable design IDs survive renaming and reordering. Orders snapshot the label and selected colors; later product changes cannot rewrite fulfillment instructions. Historical summaries use the saved label rather than depending on an image that may be removed.
- A maximum of 10 designs is independent of `PRODUCT_IMAGE_LIMIT`; design uploads accept raster images up to 1 MB and recommend compact thumbnails. The server enforces limits, not just the form.
- Validate merged state for partial edits so an unrelated edit cannot reset existing colors or bypass category-specific validation. Clear name-keychain-only configuration when a product changes category/subcategory.
- Include print name, both colors, design ID and instructions in cart identity. Two customized items must never accidentally merge or have quantity/removal actions affect each other.
- Checkout resolves fixed colors and design labels from the database, rejects unavailable choices and missing names, and ignores forged customization on ordinary products. Browser prices remain untrusted.
- No live database mutation is required to review the implementation. Apply the additive migration before deploying application code; document deployment and manual acceptance checks after verification.

## Acceptance walkthrough

- Admin creates/edits a name keychain in fixed and options modes; adds, labels, removes and replaces designs; the eleventh design and oversized/non-raster files are rejected.
- Customer selects colors/design, enters a name and optional instructions, then adds/buys. Required fields are accessible and validation is visible.
- Different names/designs/colors/instructions produce distinct cart lines. Identical choices merge; quantity/removal target only the chosen line. Reload preserves choices.
- Checkout refuses deleted designs/colors; fixed colors and design labels come from current database settings. Saved order details and both emails show customization.
- Ordinary products, pre-existing orders and legacy cart storage continue working. Pre-feature name-keychain carts must be re-added with a print name.

## Deployment and verification

1. Apply `prisma/migrations/20261015000000_name_keychain_customization/migration.sql` before deploying the new application. On a database managed by this repository's migration history, use `npx prisma migrate deploy`.
2. Run `npx prisma generate`, then build/redeploy and restart any existing development server so it loads the updated Prisma client.
3. Edit existing name keychains to replace the legacy `As shown` text-color placeholder and configure design thumbnails. Each design has a stable ID and an editable customer-facing label.
4. Complete the acceptance walkthrough above with a test order. No live customer order is created by the automated tests.

The migration is additive and was exercised in an isolated PostgreSQL engine with legacy fixed-color products, option-color products, ordinary products and existing order items. The connected database has not been changed by this implementation.

Production verification can use a separate output directory when a development server holds `.next` open. In PowerShell: `$env:NEXT_BUILD_DIR = '.next-keychain-check'; npm run build`. The default output remains `.next`.

Final full regression run: 146/148 passing, including all 18 customization checks. Two failures are in untouched baseline tests: `categories.test.mjs` expects a different subcategory order, and `adminEmailPrivacy.test.mjs` expects a `Hidden` label missing from the current administrator page. TypeScript, lint and the isolated production build passed. The dedicated customization tests also cover rendered customer controls, re-uploaded image reuse and save-failure cleanup.
