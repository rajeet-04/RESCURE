# RESCURE — Roadmap

## Overview

RESCURE is a Next.js 16 / React 18 stray-animal rescue platform. This roadmap tracks planned enhancement phases.

---

### Phase 1: Animations — Dynamic Motion & Scroll UX

**Goal:** Transform the static landing page into a high-fidelity animated experience using Framer Motion (declarative React motion) and GSAP + ScrollTrigger (imperative scroll-coupled animation). Deliver parallax depth, scroll-triggered reveals, staggered entrance sequences, and smooth route transitions.

**Requirements:**
- `ANIM-01` — Install Framer Motion + GSAP; create shared animation primitive components
- `ANIM-02` — Hero section: Framer Motion cascade entrance + GSAP parallax depth on image cards
- `ANIM-03` — Scroll-triggered reveals: GSAP batch stagger for stats count-up, steps, features grid
- `ANIM-04` — CTA sections: GSAP parallax background + Framer Motion whileInView reveals
- `ANIM-05` — Route transitions with Framer Motion AnimatePresence; sticky nav scroll effects

**Plans:** 3 plans

Plans:
- [x] 01-01-PLAN.md — Install packages + animation primitive library (`src/components/animations/`) — commit `6e90104`
- [x] 01-02-PLAN.md — Animate hero, stats, steps, features sections of landing page — commit `4497ac0`
- [x] 01-03-PLAN.md — CTA animations, route transitions, nav scroll effects + human verify — commit `d96e2b8`

---

### Phase 2: Report Wizard + AI Scale-Up + NGO Auto-Contact

**Goal:** Transform the single-page report form into a photo-first 2-step wizard. Expand Gemini to auto-fill all report fields from a single image. Build a fully automatic NGO contact pipeline using Google Maps scraping + Bitrix24 CRM.

**Requirements:**
- `REPORT-01` — 2-step wizard: photo+GPS first (Step 1), AI-prefilled form second (Step 2)
- `REPORT-02` — Fix incidents API field schema + add PATCH /api/incidents/[id]
- `REPORT-03` — Unified Gemini analyzer (gemini-2.0-flash) returning animalType, title, description, urgency
- `NGO-01` — Google Maps tbm=map scraper to find nearby animal shelters from incident coordinates
- `NGO-02` — Bitrix24 CRM auto-lead creation + call activity logging for every scraped shelter
- `AI-01` — /api/incidents/[id]/analyze endpoint returns wizard prefill data
- `UI-01` — Report page state machine: capture → analyzing → review → submitted

**Plans:** 4 plans

Plans:
- [ ] 02-01-PLAN.md — Schema migration (NGOOutreach + 6 fields) + Maps scraper + Bitrix24 client
- [ ] 02-02-PLAN.md — Unified Gemini analyzer + /api/incidents/[id]/analyze endpoint
- [ ] 02-03-PLAN.md — notify-external pipeline (scraper → Bitrix24 → DB NGOs)
- [ ] 02-04-PLAN.md — Fix incidents route + 2-step wizard rewrite [checkpoint]

---

### Phase 3: Territorial Predictive Engine

**Goal:** Transform reactive hotspot history into a proactive risk model. A new RiskFactor model stores environmental signals per geohash. A predictive engine aggregates them into a risk score per CoverageZone, auto-triggering a SurgeEvent (new DB model, replacing the Notification hack) when score > 0.6. Admins trigger analysis via a button on the hotspot page. The hotspot map gains a toggle between Historical (red) and Predictive (purple) overlays.

**Requirements:**
- `PRED-01` — Schema: RiskFactor model + SurgeEvent model + CoverageZone.baseRiskScore; run prisma migrate dev
- `PRED-02` — Predictive engine service: calculateZoneRisk, triggerProactiveSurge, runPredictiveEngineForAllZones
- `PRED-03` — Risk factor ingestion API: POST /api/admin/risk (PLATFORM_ADMIN) + GET (PLATFORM_ADMIN | NGO_ADMIN)
- `PRED-04` — Engine trigger endpoint: POST /api/admin/risk/calculate returns { zonesAnalyzed, surgesTriggered }
- `PRED-05` — Risk zones read API: GET /api/analytics/risk-zones returns per-zone scores with decoded lat/lng
- `PRED-06` — Migrate /api/surge route + /surge page + /admin/surge page to use SurgeEvent model
- `PRED-07` — Hotspot page: dual fetch (historical + risk zones) + admin trigger button (PLATFORM_ADMIN only)
- `PRED-08` — Hotspot map: toggleable Historical/Predictive layers + map legend

**Plans:** 4 plans

Plans:
- [ ] 03-01-PLAN.md — Schema migration (RiskFactor, SurgeEvent, CoverageZone.baseRiskScore) + predictive engine service
- [ ] 03-02-PLAN.md — Risk factor APIs (admin/risk, admin/risk/calculate, analytics/risk-zones)
- [ ] 03-03-PLAN.md — Migrate surge API + surge pages to SurgeEvent model
- [ ] 03-04-PLAN.md — Hotspot page dual fetch + admin trigger button + map toggleable overlays + legend [checkpoint]