# PIXELPRESS

PixelPress is a dual-portal e-commerce web platform for custom wall art, split posters, and fan merchandise.

## Architecture

- **`CUSTOMER/`**: Customer-facing mobile-first storefront built with React 19, Vite, Tailwind CSS, Framer Motion, and Supabase.
  - Multi-step checkout with advance UPI payment & proof screenshot upload.
  - Real-time order tracking & status monitoring.
  - Search, category filter tabs, animated cart drawer, and interactive product gallery.
- **`SELLER/`**: Seller/Admin management portal built with React 19, Vite, Tailwind CSS, Framer Motion, and Supabase.
  - Live order management dashboard with real-time Supabase subscriptions.
  - Advance payment screenshot viewer modal for manual verification.
  - Tabbed order filtering (Pending Review, Pending, Accepted, Rejected), order search, and catalog management.

## Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS, Framer Motion, Lucide React, React Router v7
- **Database & Storage**: Supabase (PostgreSQL, Storage Buckets, Realtime Channels)
- **Deployment**: Vercel
