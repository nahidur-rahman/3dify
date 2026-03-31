# 🏗️ 3Dify BD — Full Build Plan

> A 3D printed items e-commerce startup website — browse, contact, order.

---

## 🎯 Project Overview

| Field | Detail |
|---|---|
| **Brand Name** | 3Dify BD |
| **Tagline** | Premium 3D Printed Products — Made to Order in Bangladesh |
| **Products** | Figurines, Phone Cases, Home Decor, Custom Models |
| **Order Flow** | Browse on site → Contact via WhatsApp/Messenger → We print & deliver |
| **Payment** | Handled offline via messaging (no online payment) |
| **Admin** | Single admin (you) manages products from the website |
| **Language** | English |

---

## 🧰 Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14+ (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Database | PostgreSQL (Supabase) |
| ORM | Prisma |
| Auth | JWT (HTTP-only cookies) |
| Validation | Zod |
| Deployment | Vercel |
| Image Storage | Local `/public/uploads` (Supabase Storage later) |

---

## 📁 Project Structure

```
src/
├── app/                    # Pages & API routes
│   ├── (public)/           # Public layout group
│   │   ├── page.tsx        # Homepage
│   │   ├── products/
│   │   │   ├── page.tsx    # Products listing
│   │   │   └── [id]/
│   │   │       └── page.tsx # Product detail
│   │   └── about/
│   │       └── page.tsx    # About page
│   ├── admin/              # Admin dashboard
│   │   ├── login/
│   │   │   └── page.tsx    # Admin login
│   │   ├── page.tsx        # Dashboard overview
│   │   └── products/
│   │       ├── page.tsx    # Product management table
│   │       ├── new/
│   │       │   └── page.tsx # Add product form
│   │       └── [id]/
│   │           └── edit/
│   │               └── page.tsx # Edit product form
│   └── api/                # Backend API routes
│       ├── auth/
│       │   ├── login/route.ts
│       │   └── logout/route.ts
│       ├── products/
│       │   ├── route.ts         # GET all, POST new
│       │   └── [id]/route.ts   # GET one, PUT, DELETE
│       ├── categories/route.ts
│       └── upload/route.ts
├── components/             # Reusable UI components
│   ├── layout/
│   │   ├── Navbar.tsx
│   │   ├── Footer.tsx
│   │   └── AdminSidebar.tsx
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Card.tsx
│   │   └── Modal.tsx
│   ├── ProductCard.tsx
│   ├── ProductGrid.tsx
│   ├── ContactButtons.tsx
│   ├── FloatingContact.tsx
│   ├── CategoryCard.tsx
│   ├── HeroSection.tsx
│   ├── HowItWorks.tsx
│   └── SearchFilter.tsx
├── lib/                    # Utilities & helpers
│   ├── db.ts               # Prisma client
│   ├── auth.ts             # JWT sign/verify helpers
│   ├── middleware.ts        # Auth middleware for API
│   ├── validation.ts       # Zod schemas
│   └── utils.ts            # General helpers
└── prisma/
    ├── schema.prisma        # Database schema
    └── seed.ts              # Seed admin + sample products
```

---

## 🗄️ Database Schema

### Product
| Field | Type | Notes |
|---|---|---|
| id | String (cuid) | Primary key |
| name | String | Product name |
| description | String | Detailed description |
| price | Float | Price in BDT |
| images | String[] | Array of image URLs |
| category | Enum | FIGURINE, PHONE_CASE, HOME_DECOR, CUSTOM |
| color | String | Available color(s) |
| size | String | Dimensions (e.g., "10x5x3 cm") |
| weight | Float | Weight in grams |
| infillPercentage | Int | 3D print infill % (e.g., 20, 50, 100) |
| customizable | Boolean | Whether customization is available |
| inStock | Boolean | Availability status |
| featured | Boolean | Show on homepage |
| createdAt | DateTime | Auto-generated |
| updatedAt | DateTime | Auto-updated |

### Admin
| Field | Type | Notes |
|---|---|---|
| id | String (cuid) | Primary key |
| email | String | Unique, login credential |
| password | String | Hashed with bcrypt |
| name | String | Display name |
| createdAt | DateTime | Auto-generated |

### Category (Enum)
- `FIGURINE`
- `PHONE_CASE`
- `HOME_DECOR`
- `CUSTOM`

---

## 📄 Pages & Features

### Public Pages

#### 1. Homepage (`/`)
- Hero section with tagline and CTA
- Featured products grid (3-6 items)
- Category showcase cards (4 categories)
- "How It Works" section: Browse → Contact → We Print → Deliver
- Floating WhatsApp/Messenger contact widget

#### 2. Products Page (`/products`)
- Product grid with all items
- Filter by category
- Sort by price (low-high, high-low), newest
- Search by name
- Responsive grid (1 col mobile, 2 tablet, 3-4 desktop)

#### 3. Product Detail Page (`/products/[id]`)
- Large image display
- Product name, price, description
- Specs table: color, size, weight, infill %
- Customization badge (if applicable)
- **"Order via WhatsApp" button** — pre-filled message
- **"Message on Messenger" button** — links to FB page
- Related products section

#### 4. About Page (`/about`)
- Brief startup story
- What is 3D printing
- Why choose 3Dify BD

### Admin Pages (Protected)

#### 5. Admin Login (`/admin/login`)
- Email + password form
- JWT token on success → stored in HTTP-only cookie
- Redirects to dashboard

#### 6. Admin Dashboard (`/admin`)
- Overview cards: total products, categories, featured items
- Quick links to manage products

#### 7. Product Management (`/admin/products`)
- Table of all products (name, price, category, stock status)
- Add new product button
- Edit / Delete actions per row

#### 8. Add/Edit Product (`/admin/products/new`, `/admin/products/[id]/edit`)
- Form with all product fields
- Image upload (multiple)
- Validation with error messages

---

## 🔌 API Routes

| Route | Method | Auth | Purpose |
|---|---|---|---|
| `/api/auth/login` | POST | ❌ | Admin login, returns JWT |
| `/api/auth/logout` | POST | ✅ | Clear auth cookie |
| `/api/products` | GET | ❌ | List products (with filters/search) |
| `/api/products` | POST | ✅ | Create new product |
| `/api/products/[id]` | GET | ❌ | Get single product details |
| `/api/products/[id]` | PUT | ✅ | Update product |
| `/api/products/[id]` | DELETE | ✅ | Delete product |
| `/api/upload` | POST | ✅ | Upload product images |
| `/api/categories` | GET | ❌ | List all categories |

---

## 🎨 Design System

| Element | Choice |
|---|---|
| **Theme** | Dark background + light cards, with light mode toggle |
| **Accent Color** | Cyan/Teal (`#06b6d4`) — techy 3D-printing vibe |
| **Font** | Inter or Geist (system sans-serif) |
| **Cards** | Rounded corners, subtle shadow, hover scale effect |
| **Buttons** | Rounded, gradient accents for CTAs |
| **Mobile** | Mobile-first responsive design |

---

## 📞 Contact Integration

### WhatsApp Button
```
https://wa.me/{WHATSAPP_NUMBER}?text=Hi! I'm interested in "{product_name}" (Price: ৳{price}). Is it available?
```

### Messenger Button
```
https://m.me/{FACEBOOK_PAGE_ID}
```

### Floating Contact Widget
- Fixed position bottom-right on all pages
- WhatsApp + Messenger icons
- Expandable on click

---

## 🔐 Environment Variables

```env
# Database
DATABASE_URL=               # Supabase PostgreSQL connection string

# Auth
JWT_SECRET=                 # Random secret for JWT tokens (min 32 chars)

# Admin Seed
ADMIN_EMAIL=                # Your admin email
ADMIN_PASSWORD=             # Your admin password

# Contact (public)
NEXT_PUBLIC_WHATSAPP=       # Your WhatsApp number (with country code, e.g., 8801XXXXXXXXX)
NEXT_PUBLIC_MESSENGER=      # Your Facebook Page ID or username
NEXT_PUBLIC_SITE_URL=       # Your domain (e.g., https://3difybd.com)

# App
NEXT_PUBLIC_APP_NAME=3Dify BD
```

---

## 🚀 Deployment Checklist

- [ ] Create Supabase project & get DATABASE_URL
- [ ] Set all environment variables on Vercel
- [ ] Run `npx prisma migrate deploy` on production
- [ ] Run seed script to create admin account
- [ ] Add WhatsApp number and Facebook Page ID
- [ ] Connect custom domain (optional)
- [ ] Test all pages on mobile and desktop

---

## ❓ Pending From You

- [ ] WhatsApp number (with country code)
- [ ] Facebook Page URL/ID
- [ ] Supabase project credentials
- [ ] Preferred admin email & password
- [ ] Product images (or we use placeholders initially)
