# Weekly Meetings - Guzur Product Tasks

## 2026-01-16 (Transcript Tasks)

### Product Scope Adjustments
- Confirm rentals remain in scope alongside sales.
- Add land listings as a property type (with usage: residential/commercial/industrial).
- Add "Primary" vs "Resale" classification for listings.
- Add project-centric navigation for Buy/Rent: Location -> District -> Projects (with project detail pages).
- Add developer-first navigation: Developer -> Projects -> Units.

### User Journeys & Roles
- All seller-side roles (Broker, Developer, Owner) require admin approval before publishing.
- Buyers can browse and message after account creation; require phone verification to initiate messaging.
- Developers can manage broker agencies they work with and broadcast updates (phase launches, payment plans) to their brokers.
- Broker organizations manage internal team structure (admins, sales, HR/editorial as needed).

### Messaging & Profiles
- Add in-platform messaging (buyer/owner/broker/developer) similar to marketplace chat.
- Require user profile for all interactions; enforce profile creation before messaging.
- Add a user-to-user chat entry point from listing pages.

### Listing & SEO
- Add AI-assisted listing description generation for SEO (title + meta + description).
- Listing should not publish until SEO-optimized content is generated/approved.

### 3D & Virtual Tours
- Support 3D project map (outside/area-level) and virtual tours (inside/unit-level).
- Allow manual attachment of external 3D/virtual tour assets per project/unit.
- Developers get both 3D map + virtual tour; owners can upsell virtual tour.

### Research & ICP Inputs (Website-related only)
- Add ICP data capture task: property-type distribution (apartments dominant; townhomes/twin homes/villas secondary).
- Add location trend notes for Egypt (New Capital admin offices/medical; tourism-driven hotel apartments).

---
Owner: Stefan/Jovan
Stakeholders: Ali, Mohamed

---

## 2026-01-23 (Transcript Tasks)

### Key Decisions / Clarifications
- Marketplace remains the core: listings by owners, brokers, and developers; buyers browse free.
- Brokers and developers are interdependent; platform must support their direct collaboration.
- Admin approval gates publishing; approved listings go live + notify publisher.
- Owners pay per listing (time‑boxed, e.g., ~30 days); buyers are free.
- Broker/developer free plan: leads routed to Guzur for resale; paid plan: leads go direct.
- Rename “Developments” to “Projects” in UI.
- Messaging should be in‑house (own messenger) vs WhatsApp; name TBD (“Guzur Pulse” suggested, check conflicts).
- AI SEO generation is mandatory before listing publish (already implemented; keep enforced).
- Default listing duration: 30 days.
- Owners can outreach brokers; brokers cannot outreach owners (unless owner initiates).
- Use name “Guzur Pulse”.
- Map should support both clean + satellite views (toggle).
- RFQ buyer request form starts now (not backlog).

### Immediate Product Fixes (P0)
- Fix Buy/Sell wording:
  - Public search filters remain **Buy/Rent**.
  - Listing creation should say **Sell** (seller‑side wording).
- Visitors should see listings without logging in (currently blocked).
- Admin: restore property list + approvals (demo broken), ensure brokers/devs/owners visible.
- Developer listings: ensure developer projects are selectable when creating properties.
- Ensure broker/dev/dev owner approvals unlock listing visibility.

### Marketplace Structure & Data Requirements (P1)
- Project (Development) structure aligned with Property Hub / Property Finder:
  - Project page includes gallery, master plan, floor plan, unit details, coordinates.
  - Require upload fields for master plan + floor plan + coordinates at project/unit level.
  - Payment plans captured per listing (format TBD).
- Project‑centric navigation:
  - Developers page shows developer profiles + projects.
  - Projects show unit inventory with map placement.
- Brokers and developers are **tenant entities** with multiple seats/users.
  - Each Brokerage/Developer has a profile page with listings/projects and members.
  - Org admins can invite team seats (sales/accounting/etc).
  - Brokers see all developers; developers see all brokers.
  - Brokers can apply to projects / request access to developers.

### Map / Location UX (P1)
- Cairo‑first map experience: globe → zoom into Egypt/Cairo.
- Map should support project coordinates and district zoom.
- Decide map style (satellite vs clean map) and allow toggling if feasible.

### Messaging / Collaboration (P1 → P2)
- In‑house messenger for:
  - Buyer ↔ seller (owner/broker/developer).
  - Broker ↔ developer collaboration.
- Broadcast feature: developers can message all brokers on their network.
- Group messaging: broker teams + developer reps (threads).
- Owner‑to‑broker outreach is allowed; broker‑to‑owner is blocked unless owner initiates.

### Lead & RFQ (Backlog)
- Buyer RFQ form (“Request for home”) creates a Guzur lead.
- Leads can be sold to brokers or handled by AI agent (Guzur‑owned lead channel).

### Monetization / Payments (Backlog)
- Broker subscription tiers (team size).
- Owner listing packages: basic/premium/featured + optional virtual tour upsell.
- Payment providers for Egypt: PayMob / PayTabs / InstaPay + Apple Pay / Google Pay.

### External References / Research (Action Items)
- Collect screenshots + feature notes from:
  - Property Hub (inventory + developer/broker structure).
  - NAWI (map + project layout + features).
  - Luxus template (UI ideas; locate working link).
- Convert findings into internal inspiration board.

### Deliverables Requested
- Provide complete architecture overview of Guzur (features, flows, roles, monetization) for stakeholder review.

Owner: Stefan/Jovan
Stakeholders: Ali, Mohamed
