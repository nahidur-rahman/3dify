# 3Dify BD Category Refactor TODO

Updated on May 28, 2026.

This document is the source of truth for the category refactor. It captures the locked taxonomy, the approved data shape, the migration notes, and the implementation checklist with clear done vs not-done status.

## Status Legend

- [x] Done or already approved
- [ ] Not started or not completed

## 1) Locked Decisions

- [x] Replace the old four-category system with 10 top-level categories
- [x] Keep `category` as a Prisma enum
- [x] Add `subcategory` as an optional product field
- [x] Validate `subcategory` against the selected top-level category
- [x] Use SEO-friendly labels and slugs from a central category config
- [x] Rename category 3 from `Lamps & Lightboxes` to `Lamps`

## 2) Final Top-Level Categories

| Public Category | Internal Key | Slug |
| --- | --- | --- |
| Home Decor | `HOME_DECOR` | `home-decor` |
| Desk Accessories | `DESK_ACCESSORIES` | `desk-accessories` |
| Lamps | `LAMPS` | `lamps` |
| Vases & Planters | `VASES_AND_PLANTERS` | `vases-planters` |
| Toys & Fidgets | `TOYS_AND_FIDGETS` | `toys-fidgets` |
| Collectibles & Figures | `COLLECTIBLES_AND_FIGURES` | `collectibles-figures` |
| Gaming & Pop Culture | `GAMING_AND_POP_CULTURE` | `gaming-pop-culture` |
| Cosplay, Props & Model Kits | `COSPLAY_PROPS_AND_MODEL_KITS` | `cosplay-props-model-kits` |
| Custom & Personalized | `CUSTOM_AND_PERSONALIZED` | `custom-personalized` |
| Pet Accessories | `PET_ACCESSORIES` | `pet-accessories` |

## 3) Suggested Category Tree

### Home Decor
- Wall Art
- Sculptures
- Shelf Decor
- Decorative Storage
- Seasonal Decor

### Desk Accessories
- Pen Holders
- Phone Stands
- Headphone Stands
- Controller Stands
- Cable Organizers

### Lamps
- Table Lamps
- Night Lamps
- Lightboxes
- Lamp Shades
- Display Lamps

### Vases & Planters
- Flower Vases
- Plant Pots
- Hanging Planters
- Desk Planters
- Sculptural Planters

### Toys & Fidgets
- Articulated Toys
- Fidget Toys
- Puzzle Toys
- Keychains
- Desk Toys

### Collectibles & Figures
- Character Figures
- Miniatures
- Busts
- Statues
- Display Pieces

### Gaming & Pop Culture
- Anime
- Movie and TV
- Game-Inspired Pieces
- Franchise Decor
- Fan Art Displays

### Cosplay, Props & Model Kits
- Wearable Props
- Weapon Props
- Masks
- Model Kits
- Assembly Kits

### Custom & Personalized
- Nameplates
- Custom Gifts
- Business Branding
- Memorial Pieces
- One-off Commissions

### Pet Accessories
- Pet Tags
- Bowl Stands
- Toy Holders
- Small Pet Decor
- Custom Pet Keepsakes

## 4) Approved Data Shape

- [x] `Product.category` remains a Prisma enum using the 10 top-level category keys
- [x] `Product.subcategory` is added as an optional string field
- [x] Frontend category options come from one shared config object instead of scattered label maps
- [x] `subcategory` stays optional so older products can be migrated in phases

## 5) Migration Notes For Existing Data

Safe mappings:

- [x] `FIGURINE` -> `COLLECTIBLES_AND_FIGURES`
- [x] `HOME_DECOR` -> `HOME_DECOR`
- [x] `CUSTOM` -> `CUSTOM_AND_PERSONALIZED`

Manual review required:

- [x] `PHONE_CASE` does not cleanly map to the new taxonomy
- [ ] Review each existing `PHONE_CASE` product and assign the correct target category

## 6) Implementation Checklist

### Phase 1: Schema and Migration

- [x] Update `Category` enum in `prisma/schema.prisma` to the 10 new top-level keys
- [x] Add optional `subcategory String?` to `Product` in `prisma/schema.prisma`
- [x] Create a Prisma migration for the category enum change and new subcategory field
- [x] Generate Prisma client after schema changes
- [x] Prepare a migration script or SQL plan for existing product category remapping
- [ ] Apply automatic remapping for `FIGURINE`, `HOME_DECOR`, and `CUSTOM`
- [ ] Manually review and remap every `PHONE_CASE` product
- [ ] Verify migrated data in the database before updating the UI

### Phase 2: Shared Category Config

- [x] Replace hardcoded category label maps in `src/lib/utils.ts`
- [x] Create one central category config with:
- [x] Internal key
- [x] Public label
- [x] SEO name
- [x] Slug
- [x] Description
- [x] Allowed subcategories
- [x] Export helper lookups for labels, slugs, descriptions, and subcategory lists

### Phase 3: Shared Types and Validation

- [x] Update `Category` type in `src/lib/types.ts`
- [x] Add `subcategory?: string` to the shared `Product` interface in `src/lib/types.ts`
- [x] Update `productSchema` in `src/lib/validation.ts` for the new category enum values
- [x] Add subcategory validation in `src/lib/validation.ts`
- [x] Ensure invalid category and subcategory combinations return a 400 response

### Phase 4: API Updates

- [x] Update `src/app/api/products/route.ts` to accept and store `subcategory`
- [x] Update `src/app/api/products/[id]/route.ts` to accept and store `subcategory`
- [x] Update filtering logic in product APIs if subcategory filtering is supported
- [x] Update `src/app/api/categories/route.ts` to return category metadata from the central config
- [x] Ensure the categories API returns `value`, `label`, `slug`, `description`, and allowed subcategories

### Phase 5: Admin Product Form

- [x] Update `src/components/ProductForm.tsx` to use the new category keys
- [x] Change the default category from the legacy value to one of the new top-level categories
- [x] Add a dependent subcategory field that updates based on the selected category
- [x] Preserve valid subcategory values when editing an existing product
- [x] Clear subcategory automatically when the chosen category changes to a mismatched group
- [ ] Verify create flow in admin works with category and subcategory
- [ ] Verify edit flow in admin works with category and subcategory

### Phase 6: Admin Listing and Filters

- [ ] Update `src/app/admin/(dashboard)/products/page.tsx` category filters to the new taxonomy
- [ ] Add optional subcategory filtering to the admin product list
- [ ] Confirm product rows display the correct new category labels

### Phase 7: Public Filters and Catalog

- [ ] Update `src/components/SearchFilter.tsx` to use the new category list
- [ ] Decide whether to expose subcategory filtering on the public storefront now or later
- [ ] Update `src/app/(public)/products/page.tsx` filtering to support the new taxonomy
- [ ] Add category-based SEO metadata for public category views or filtered pages
- [ ] Confirm query params still work for category filters after the refactor

### Phase 8: Category Showcase and Navigation

- [ ] Redesign `src/components/CategoryShowcase.tsx` for 10 categories instead of 4
- [ ] Replace hardcoded icons and colors with mappings that cover all new categories
- [ ] Update `src/components/layout/Footer.tsx` category links and labels
- [ ] Confirm homepage and footer links point to the correct category filters

### Phase 9: Marketing and SEO Copy Refresh

- [ ] Update root metadata in `src/app/layout.tsx`
- [ ] Remove old category mentions such as figurines and phone cases from global SEO copy
- [ ] Update messaging in `src/components/HeroSection.tsx`
- [ ] Update category-related copy in `src/app/(public)/about/page.tsx`
- [ ] Make sure the site language reflects the new broader catalog structure

### Phase 10: Validation and Final Checks

- [ ] Run `npx prisma generate`
- [ ] Run the new Prisma migration
- [ ] Smoke test admin create product flow
- [ ] Smoke test admin edit product flow
- [ ] Smoke test public category filter flow
- [ ] Smoke test `GET /api/categories`
- [ ] Run `npm run lint`
- [ ] Mark completed items in this document as implementation progresses

## 7) Recommended Execution Order

- [x] Lock taxonomy and data shape
- [ ] Schema and migration
- [ ] Shared category config
- [x] Validation and API updates
- [ ] Admin form and admin filters
- [ ] Public filters and category showcase
- [ ] Footer, hero, about, and SEO copy
- [ ] Data cleanup and final lint pass

## 8) Current Status Snapshot

- [x] Planning is complete
- [x] Final taxonomy is approved
- [x] Data shape is approved
- [x] Prisma schema changes completed
- [ ] Migration prepared but not applied
- [x] Shared category config completed
- [x] API updates completed
- [ ] Admin form slice partially implemented; filters and smoke tests still pending
- [ ] Public storefront refactor not started
- [ ] SEO copy refresh not started
- [ ] Validation updates completed; full refactor lint pass still pending