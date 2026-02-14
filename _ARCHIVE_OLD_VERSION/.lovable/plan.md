

# Headless SaaS E-Commerce Platform - Lean MVP Plan

## 🎯 Vision
A multi-tenant e-commerce SaaS platform optimized for Arabic markets, combining professional store management with an easy-to-use interface. Built on React + Supabase for scalability.

---

## Phase 1: Foundation & Platform Core ✅ IN PROGRESS

### 1.1 SaaS Landing Page (Arabic-first) ✅ COMPLETE
- [x] Modern, minimal marketing website
- [x] Value proposition and feature highlights
- [x] Pricing plans display
- [ ] Merchant signup/login flow
- [x] RTL (Right-to-Left) layout support for Arabic
- [x] Language toggle (Arabic ↔ English)

### 1.2 Authentication & Multi-Tenancy ✅ COMPLETE
- [x] Merchant registration and login
- [x] Email verification
- [x] Password reset flow
- [x] Store creation wizard
- [x] Multi-tenant database architecture (all data scoped by `store_id`)
- [x] Automatic subdomain generation (store-name.platform.com)

---

## Phase 2: Store Dashboard (Merchant Admin) ✅ IN PROGRESS

### 2.1 Dashboard Home ✅ COMPLETE
- [x] Quick stats overview (orders, revenue, products, customers)
- [x] Recent orders list with status badges
- [x] Getting started checklist for new merchants
- [x] Responsive sidebar navigation

### 2.2 Product Management
- Product listing with search and filters
- Add/edit product form:
  - Multi-language name and description (Arabic + English via JSONB)
  - Pricing and compare-at price
  - Product images upload
  - Inventory tracking (stock quantity)
  - Product status (draft/active)
- Bulk actions (delete, status change)

### 2.3 Category Management
- Categories list with tree structure (parent/child)
- Add/edit category with multi-language support
- Assign products to categories
- Category status management

### 2.4 Order Management
- Orders list with status filters
- Order detail view:
  - Customer information
  - Order items with snapshots (price at purchase time)
  - Order status workflow (pending → confirmed → shipped → delivered)
- Order status updates

### 2.5 Store Settings
- Store profile (name, logo, description)
- Contact information
- Currency and timezone
- Basic SEO settings

---

## Phase 3: Customer Storefront

### 3.1 Templated Storefront
- Homepage with featured products
- Product catalog with category filtering
- Product detail page with images gallery
- Responsive design (mobile-first)
- RTL support for Arabic storefronts

### 3.2 Shopping Experience
- Shopping cart (add, update quantity, remove)
- Cart persistence
- Guest checkout flow
- Customer information collection

### 3.3 Checkout & Orders
- Order summary
- Cash on Delivery (COD) payment option
- Order confirmation page
- Order tracking for customers

---

## Phase 4: Essential Infrastructure

### 4.1 Customer Management
- Separate `customers` table from `users` (merchants)
- Guest checkout support
- Customer order history

### 4.2 Platform Admin Panel
- View all stores
- Store status management
- Basic platform analytics (stores count, orders count)

---

## 📊 Database Architecture

**Core Tables:**
- `users` → Merchants and platform staff
- `stores` → Tenant stores with settings
- `customers` → Store shoppers (separate from users)
- `products` → With JSONB for multi-language
- `product_images` → Product gallery
- `categories` → With parent_id for hierarchy
- `product_categories` → Many-to-many pivot
- `inventories` → Stock tracking
- `carts` & `cart_items` → Shopping cart
- `orders` & `order_items` → With snapshot JSONB
- `roles` & `user_roles` → Permission system

**Security:**
- Row Level Security (RLS) on all tables
- All queries scoped by `store_id`
- Secure authentication via Supabase Auth

---

## 🎨 Design Approach

- **Style**: Modern & minimal with clean lines
- **Primary Focus**: Arabic RTL with English support
- **Color Palette**: Neutral base with brand accent color
- **Typography**: Arabic-friendly fonts (e.g., Cairo, Noto Sans Arabic)
- **Components**: Shadcn UI for consistency

---

## 🔄 Future Phases (Post-MVP)

**Phase 2 Features (Social Commerce):**
- Facebook/Instagram account connection
- Auto-reply to comments
- Quick order forms for social media
- Social analytics

**Additional Enhancements:**
- Online payment integration
- Shipping provider integrations
- Coupons and discounts
- Advanced analytics dashboard
- Custom domain setup per store
- Staff accounts with roles

---

## ⚙️ Technical Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React + Vite + TypeScript |
| Styling | Tailwind CSS + Shadcn UI |
| Backend | Supabase (PostgreSQL + Edge Functions) |
| Auth | Supabase Auth |
| Storage | Supabase Storage (product images) |
| Multi-tenant | RLS + store_id scoping |
| i18n | JSONB fields + RTL CSS |

