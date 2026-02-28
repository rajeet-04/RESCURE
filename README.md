# 🐾 RESCURE — Stray Animal Rescue Platform

> AI-powered civic infrastructure connecting citizens, NGOs, veterinarians, and sponsors for real-time stray animal rescue across India.

[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green?logo=supabase)](https://supabase.com)
[![PWA](https://img.shields.io/badge/PWA-Ready-orange)](https://web.dev/progressive-web-apps/)

---

## 📋 Overview

RESCURE transforms stray animal rescue from a charity-driven effort into scalable, technology-powered civic infrastructure. Citizens report injured animals in one tap, NGOs receive real-time AI-scored alerts, and sponsors support animal care with full financial transparency.

**Key differentiators:**
- 🤖 **Gemini Vision AI** scores injury urgency automatically (CRITICAL / HIGH / MEDIUM / LOW)
- 📴 **Offline-first** — reports queue locally and sync when connectivity returns
- 🏥 **Digital Health Passport** — QR-linked medical records follow every animal
- 🗺️ **Predictive Hotspot Map** — ML clustering flags high-risk zones proactively
- 🏢 **NGO SaaS** — full rescue management dashboard with team, vet network, and supplier access

---

## 🛠️ Tech Stack

| Layer | Technology | Plan |
|---|---|---|
| Framework | Next.js 15 (App Router + Turbopack) | Free |
| Database | PostgreSQL via Supabase | Free (500 MB) |
| ORM | Prisma v5 | Free |
| Auth | NextAuth v5 (Google OAuth + Magic Link) | Free |
| AI Scoring | Google AI Studio — Gemini 1.5 Flash Vision | Free (1500 req/day) |
| Image Storage | Cloudinary | Free (25 GB) |
| Maps | Leaflet.js + OpenStreetMap | Free |
| Push Notifications | Web Push API + VAPID (self-hosted) | Free |
| Styling | Tailwind CSS + shadcn/ui | Free |
| Analytics | PostHog | Free (1M events/mo) |
| Payments | Stripe (when configured) | Pay-as-you-go |
| Email | Resend | Free (3000/mo) |
| Deployment | Vercel | Free (Hobby) |

---

## 👥 User Roles

| Role | Dashboard | Description |
|---|---|---|
| **Citizen** | `/report` | Reports incidents, tracks rescues, sponsors animals |
| **NGO Admin** | `/dashboard` | Manages org, cases, team, subscription |
| **NGO Field Worker** | `/worker/dashboard` | Mobile-first rescue execution with GPS tracking |
| **Veterinarian** | `/vet/dashboard` | Telehealth consultations, health record updates |
| **Supplier** | `/supplier/dashboard` | Product catalog, order management |
| **Platform Admin** | `/admin/dashboard` | NGO verification, analytics, surge control |

---

## 💰 Subscription Tiers

| Tier | Price | Cases/mo | Features |
|---|---|---|---|
| **Free** | ₹0 | 10 | Core rescue flow, basic map, community visibility |
| **Pro** | ₹1,499/mo | 200 | Full dashboard, vet network, marketplace, analytics |
| **Enterprise** | ₹9,999/mo | Unlimited | Multi-city, CSR dashboard, white-label, public API |

---

## 🗺️ Routes Reference

```
/                          → Homepage (public)
/report                    → Citizen incident report form
/report/[id]               → Report status tracker
/report/history            → Citizen's past reports
/adopt                     → Browse animals available for sponsorship
/adopt/[id]                → Animal sponsorship page
/animals/[slug]            → Public animal health passport (QR link target)
/marketplace               → Animal supply marketplace
/marketplace/[id]          → Product detail + order form
/community                 → Community feed, leaderboard, badges
/impact                    → Platform-wide impact analytics
/surge                     → Volunteer surge mode (emergency events)
/hotspots                  → Predictive incident hotspot map
/notifications             → Notification history
/sponsor/impact            → Sponsor monthly impact report (printable)
/sponsor/tax-receipt       → 80G tax exemption certificate

/dashboard                 → NGO Admin dashboard
/dashboard/cases           → Case queue
/dashboard/cases/[id]      → Case detail + SLA timer
/dashboard/animals         → Animal roster
/dashboard/animals/[id]    → Animal health passport management
/dashboard/animals/scan    → QR scanner
/dashboard/map             → Live field worker + case map
/dashboard/orders          → Marketplace orders
/dashboard/orders/recurring → Recurring auto-orders (Pro+)
/dashboard/analytics       → NGO performance analytics

/worker/dashboard          → Field worker mobile dashboard
/worker/cases/[id]         → Case detail + quick-action buttons
/worker/map                → Worker map view

/vet/dashboard             → Vet consultation queue
/vet/consultations/[id]    → Consultation thread
/vet/onboarding            → Vet verification

/supplier/dashboard        → Supplier orders + products
/supplier/products         → Product management
/supplier/onboarding       → Supplier registration

/admin/dashboard           → Platform admin panel
/admin/surge               → Surge event control
/admin/multi-city          → Multi-city operations (Enterprise)
/admin/whitelabel          → White-label config (Enterprise)

/login                     → Google OAuth + Magic Link
/register                  → Role selection for new users
/api-docs                  → Public REST API documentation
```

---

## 🔌 Public API (Enterprise)

All endpoints at `/api/v1/` accept `Authorization: Bearer <API_KEY>`.

| Endpoint | Description |
|---|---|
| `GET /api/v1/incidents` | Recent incidents (paginated, urgency filter) |
| `GET /api/v1/animals` | Animals available for adoption |
| `GET /api/v1/ngos` | Verified NGO directory |
| `GET /api/v1/stats` | Platform statistics (public, no auth) |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- pnpm
- A Supabase project (free tier works)
- Google Cloud project with OAuth credentials

### 1. Clone & Install

```bash
git clone https://github.com/rajeet-04/RESCURE.git
cd RESCURE
pnpm install
```

### 2. Environment Setup

```bash
cp .env.example .env.local
```

Fill in `.env.local` with your credentials:

| Variable | Where to get it |
|---|---|
| `DATABASE_URL` | Supabase → Project Settings → Database → Connection string (URI mode) |
| `DIRECT_URL` | Same as above |
| `GOOGLE_CLIENT_ID` | Google Cloud Console → OAuth 2.0 credentials |
| `GOOGLE_CLIENT_SECRET` | Same as above |
| `GOOGLE_AI_API_KEY` | Google AI Studio → API Keys |
| `CLOUDINARY_API_KEY` | Cloudinary Dashboard → API Keys |
| `CLOUDINARY_API_SECRET` | Same as above |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Cloudinary Dashboard |
| `AUTH_SECRET` | Run: `openssl rand -hex 32` |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Run: `npx web-push generate-vapid-keys` |
| `VAPID_PRIVATE_KEY` | Same as above |

> **Note:** Supabase password must URL-encode special characters. If your password contains `#`, replace it with `%23` in connection strings.

### 3. Database Setup

```bash
npx prisma generate
npx prisma db push
```

### 4. Run Development Server

```bash
pnpm dev
```

Visit [http://localhost:3000](http://localhost:3000)

### 5. Make yourself a Platform Admin

After first login with Google, run in Supabase SQL editor:
```sql
UPDATE "User" SET role = 'PLATFORM_ADMIN' WHERE email = 'your@email.com';
```

---

## 🏗️ Project Structure

```
src/
├── app/
│   ├── (admin)/           → /admin/* — Platform admin panel
│   ├── (auth)/            → /login, /register, /onboarding
│   ├── (citizen)/         → /report, /sponsor (no URL prefix)
│   ├── (ngo)/             → /dashboard/* (no URL prefix)
│   ├── (supplier)/        → /supplier/*
│   ├── (vet)/             → /vet/*
│   ├── (worker)/          → /worker/*
│   ├── adopt/             → /adopt/*
│   ├── animals/           → /animals/*
│   ├── api/               → All API routes
│   │   ├── v1/            → Public REST API
│   │   ├── incidents/     → Incident CRUD + AI scoring
│   │   ├── animals/       → Animal health + expenses
│   │   ├── cases/         → Rescue case management
│   │   ├── worker/        → Field worker endpoints
│   │   ├── community/     → Feed, leaderboard, badges
│   │   ├── analytics/     → NGO + platform analytics
│   │   ├── surge/         → Surge event management
│   │   ├── export/        → CSV export
│   │   └── upload/        → Cloudinary image upload
│   ├── community/         → /community
│   ├── hotspots/          → /hotspots
│   ├── impact/            → /impact
│   ├── marketplace/       → /marketplace
│   ├── notifications/     → /notifications
│   ├── sponsor/           → /sponsor/*
│   └── surge/             → /surge
├── components/
│   ├── cases/             → SLA timer, case components
│   ├── layout/            → Header, sidebar, notifications bell, user menu
│   ├── maps/              → Leaflet wrappers (client-side)
│   ├── pwa/               → Install prompt, offline banner
│   ├── qr/                → QR code generator + scanner
│   ├── report/            → Location picker, image uploader
│   └── worker/            → GPS tracker, worker map
├── lib/
│   ├── ai/                → Gemini Vision urgency scorer
│   ├── geo/               → Geohash proximity utils
│   ├── offline/           → IndexedDB report queue
│   ├── push/              → Web Push VAPID helpers
│   ├── auth.ts            → NextAuth config
│   ├── prisma.ts          → Prisma client singleton
│   └── tier-guard.ts      → NGO subscription enforcement
├── middleware.ts           → Route protection by role
└── prisma/
    └── schema.prisma       → 14-table database schema
```

---

## 📊 Database Schema

14 models across 3 categories:

**Core:** `User`, `Account`, `Session`, `VerificationToken`  
**Rescue:** `NGO`, `CoverageZone`, `FieldWorker`, `IncidentReport`, `RescueCase`, `CaseTimeline`  
**Health & Commerce:** `Animal`, `HealthRecord`, `Expense`, `Vet`, `Consultation`, `Sponsorship`, `Order`, `Product`, `Supplier`, `Notification`, `PushSubscription`

---

## 🔒 Environment Variables

See `.env.example` for the full list. **Never commit `.env.local`.**

Required for core functionality:
- `DATABASE_URL`, `DIRECT_URL` — Supabase PostgreSQL
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` — OAuth
- `AUTH_SECRET` — NextAuth signing secret
- `GOOGLE_AI_API_KEY` — Gemini Vision AI scoring
- `CLOUDINARY_*` — Image uploads
- `VAPID_*` keys — Web Push notifications

---

## 📄 License

Private / Proprietary — © 2026 RESCURE
