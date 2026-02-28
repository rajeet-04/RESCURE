# RESCURE

## Overview

RESCURE is a comprehensive platform built to streamline and coordinate animal rescue operations, citizen reporting, NGO management, veterinary services, and supplier marketplaces.

This project is built with Next.js 14, incorporating a modern tech stack to ensure reliability, scalability, and an excellent user experience.

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Database:** Prisma with a relational database
- **Authentication:** Auth.js (next-auth) & Supabase
- **Styling:** Tailwind CSS, Radix UI variants, class-variance-authority
- **Mapping:** React Leaflet
- **Payments:** Stripe
- **AI Integration:** Google Generative AI
- **Background Jobs:** Inngest
- **PWA capabilities:** next-pwa, web-push, workbox-window
- **State Management:** Zustand, React Query

## File Structure & Routing Slugs

The application utilizes Next.js App Router. Here is the holistic view of the `src/app` structure and corresponding slugs:

```text
src/
├── app/                  # Next.js App Router root
│   ├── (admin)/          # Admin-specific routes (Layout group)
│   ├── (auth)/           # Authentication flows (Layout group)
│   ├── (citizen)/        # Citizen user flows (e.g., reporting)
│   ├── (ngo)/            # NGO dashboard/management flows
│   ├── (supplier)/       # Supplier marketplace routes
│   ├── (vet)/            # Veterinary dashboard and consultations
│   ├── adopt/            # /adopt - Animal adoption flow
│   ├── animals/          # /animals - Animal listings & health passports
│   ├── api/              # /api/* - Backend endpoints (Auth, Inngest, Webhooks, etc.)
│   ├── impact/           # /impact - Impact analytics & tracking
│   ├── marketplace/      # /marketplace - Products and supplies
│   ├── notifications/    # /notifications - User notification center
│   ├── unauthorized/     # /unauthorized - Access denied fallback
│   ├── layout.tsx        # Root layout wrapper
│   └── page.tsx          # Landing page (/)
├── components/           # Reusable UI components (Radix UI, charts, layouts)
├── lib/                  # Utility functions, Prisma clients, and configuration
├── types/                # Shared TypeScript definitions
└── middleware.ts         # Edge middleware for route protection and routing
```

## Changelog & Development Phases

The project has been developed in structured phases, documented in our version control history:

- **Phase 0: Foundation Setup**
  - Initialized Next.js 14 app with Tailwind CSS and fonts
  - Configured PWA (Progressive Web App) architecture
  - Set up Prisma, Authentication, AI scoring stub, Push Notifications, Stripe, and Geo-hashing capabilities.

- **Phase 1: Citizen & NGO Portals**
  - Implemented citizen reporting workflows
  - Added NGO dashboards
  - Integrated AI scoring and push notification elements

- **Phase 2: Animal Health & Vets**
  - Created the Animal Health Passport system
  - Integrated the Vet Network
  - Added Vet dashboards with on-call toggles, onboarding, and consultations

- **Phase 3: Marketplace & Sponsors**
  - Added sponsor and supplier modules
  - Implemented the marketplace interface
  - Refactored post-login routing and user role handling (with expense form validation)

- **Phase 4: Admin & Analytics (Current)**
  - Built the Admin dashboard
  - Integrated Impact Analytics
  - Added notifications and tier-based enforcement mechanisms

## Getting Started

1. **Install dependencies:**

   ```bash
   pnpm install
   ```

2. **Setup environment variables:**
   Copy `.env.example` to `.env.local` and populate necessary API keys and database strings.
3. **Database setup:**

   ```bash
   npx prisma generate
   npx prisma db push
   ```

4. **Run the development server:**

   ```bash
   pnpm dev
   ```

5. **Open locally:**
   Visit [http://localhost:3000](http://localhost:3000)

## License

Private / Proprietary
