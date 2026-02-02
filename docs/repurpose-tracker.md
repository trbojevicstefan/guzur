# Repurpose Tracker

This file is the single source of truth for tracking work, decisions, and execution steps.

## Status
- Phase 0: Discovery and scope locking: done
- Phase 1: Schema + migration groundwork: in progress
- Phase 2: Backend endpoints + onboarding: in progress
- Phase 3: Admin + frontend UI: in progress
- Phase 4: QA + rollout: pending

## Decisions (Locked)
- Sales flow: lead capture only
- Developers: multi-unit inventory
- Sales payments: out of scope; rentals keep Stripe/PayPal
- Owner listings: admin verification required
- Broker/developer/owner accounts require admin approval before publishing (login allowed; show unverified label until approved)
- Mobile app: out of scope for initial launch
- `AGENCY` alias removed; use `BROKER` only
- Rentals remain in scope (buy + rent)
- Add land listings
- Add primary vs resale classification
- Default owner listing duration: 30 days
- Owners can outreach brokers; brokers cannot outreach owners (unless owner initiates)
- Messenger name: Guzur Pulse
- Map must support both clean + satellite views (toggle)
- RFQ buyer request form is in scope now (not backlog)
- Brokers and Developers are tenant entities with seats (org profiles + team members)
- Brokers see all developers; developers see all brokers
- Brokers can apply/request access to developer projects

## Scripts and When to Execute
- `npm run setup` (backend): initial environment setup; creates admin user if missing
- `npm run reset` (backend): remove admin user (dev/test only)
- `npm run migrate` (backend): dry-run after deploying new schemas
- `npm run migrate -- --execute` (backend): execute data backfill after dry-run and backup
- `npm run seed:egypt-locations` (backend): seed Egypt main locations and districts
- Tests (Atlas): set `MI_DB_URI` to a dedicated test DB and `MI_FAST_TESTS=50` to keep database init tests fast

## Completed Work
- Added schema fields and enums for broker/developer/owner, listings, leads, developments
- Added migration script (`backend/src/setup/migrate.ts`)
- Added lead and development routes/controllers
- Added role signup and onboarding endpoints
- Added docs: API contract and migration plan
- Added admin lead pipeline list and assignment UI
- Developer inventory MVP (development-linked listings)
- Public projects list + project detail + developer profile pages
- Project/developer links from listing cards and property detail
- Project browse by location/district (basic UX)
- Project browse breadcrumb path for location navigation
- Listing edit routes + actions in role dashboards
- Broker/owner dashboards show listing actions (edit, submit for review, archive)
- Migration execute + DB validation counts (no AGENCY users, no missing listing fields)
- My Listings status filter + actions (edit, submit for review, archive)
- Developer inventory status filter
- Messaging MVP scaffold (messages model, routes, basic UI)
- Messaging inbox/threads list
- Messaging entry points from listing cards + dashboards
- Messaging unread indicator (client-side)
- Messaging CTA in project units table
- Messaging mark-as-read (client-side)
- Messaging permissions hardened (recipient + published listing checks)
- Messaging pagination for threads and messages
- Messaging no-recipient fallback copy
- Messaging pagination UI (load more)
- Seeded Egypt locations (East Coast, West Coast, Greater Cairo, North Coast, Red Sea, Fifth Settlement, 6th of October).
- Global map toggle (street/satellite) + Cairo default + MapPicker with draggable marker.
- Project fields: master plan + floor plan URLs + coordinates (admin + frontend).
- Tenant org partnerships + approvals wired into org dashboard.
- Listings + developments now auto-wired to brokerageOrg/developerOrg ownership.
- Broker ↔ Developer discovery + apply (org partnership requests).
- RFQ buyer request form (public) + admin RFQ queue + status updates.
- Migration dry-run executed (local) on 2026-01-26 (21:20).
- Pulse unread routing: message badge only on Pulse; notifications list filtered to General.
- Pulse broadcast + org group threads: thread model, broadcast delivery, and Pulse UI entry points.
- Pulse UX polish: better thread titles, org names, and unread stability via thread timestamps.
- Org workflow tightening: group creation now enforces active org membership for sender and participants.
- Pulse UX: thread type badges and “mark all as read” for the inbox.

- Listing forms: unified glass styling, sectioned layout, reduced scroll.
- Listing images: primary + up to 10 secondary with upload controls + cleanup.
- Listing map: reverse geocode address update on pin drop.
- Development forms: master plan + floor plan uploads (up to 10) + map picker.
- Development assets: temp files persisted to permanent storage on create/update.
- Property page: seller card, org-aware links, populated broker/owner/org data.
- Admin forms: image editor limits (10) for property/dev assets.\r\n- Organizations: seeding script for broker/developer orgs + membership + backfill org ownership on properties/developments.
- Listings now send brokerageOrg/developerOrg in dashboard create/update payloads.
## In Progress
- Role dashboards: add listing/lead management actions
- 3D project maps + unit virtual tours (external embed) (backlog)

## Next Steps (Ordered)
1. Run manual validation flows (docs/manual-validation-flows.md).
2. Run migration dry-run in staging; execute after validation.

## Backlog
- Manual Step 3 validation flows (sign-in, booking, lead creation, review submission, approval gating).

## Step 1 (Admin Lists/Filters) - Completed Files
- `admin/src/lang/common.ts` (role labels)
- `admin/src/utils/helper.ts` (role mapping and alias expansion)
- `admin/src/components/UserTypeFilter.tsx` (alias-aware filters)
- `admin/src/pages/Users.tsx` (default type filters)
- `admin/src/assets/css/user-type-filter.css` (role badges)

## Step 2 (Lead Pipeline - Admin) - Completed Files
- `admin/src/lang/common.ts` (lead status + listing type labels)
- `admin/src/lang/lead-list.ts` (lead list strings)
- `admin/src/lang/leads.ts` (page heading)
- `admin/src/lang/header.ts` (menu label)
- `admin/src/utils/helper.ts` (lead status + listing type helpers)
- `admin/src/assets/css/status-list.css` (lead status colors)
- `admin/src/assets/css/lead-status.css` (lead status badges)
- `admin/src/assets/css/lead-list.css` (lead list styles)
- `admin/src/components/LeadStatus.tsx`
- `admin/src/components/LeadStatusList.tsx`
- `admin/src/components/LeadStatusFilter.tsx`
- `admin/src/components/AssigneeSelectList.tsx`
- `admin/src/components/LeadList.tsx`
- `admin/src/services/LeadService.ts`
- `admin/src/pages/Leads.tsx`
- `admin/src/components/Header.tsx` (menu item)
- `admin/src/App.tsx` (route)
- `backend/src/controllers/leadController.ts` (populate list data)

## Step 3 (Frontend Buy/Rent + Lead Form) - Completed Files
- `packages/movinin-types/index.ts` (listingTypes filter payload)
- `packages/movinin-helper/index.ts` (listing type helper)
- `backend/src/controllers/propertyController.ts` (listingTypes filter + sale search without dates)
- `frontend/src/utils/helper.ts` (listing type helpers + sale price label)
- `frontend/src/lang/common.ts` (listing type labels)
- `frontend/src/lang/properties.ts` (sale price label)
- `frontend/src/lang/lead-form.ts` (lead form strings)
- `frontend/src/main.tsx` (lead form language)
- `frontend/src/components/ListingTypeSelect.tsx`
- `frontend/src/components/ListingTypeFilter.tsx`
- `frontend/src/assets/css/listing-type-filter.css`
- `frontend/src/components/SearchForm.tsx` (listing type selector + date rules)
- `frontend/src/assets/css/search-form.css` (listing type layout)
- `frontend/src/components/PropertyFilter.tsx` (optional dates)
- `frontend/src/pages/Search.tsx` (listing type filter + payload)
- `frontend/src/components/PropertyList.tsx` (listingTypes payload)
- `frontend/src/components/PropertyInfo.tsx` (rent-only term display)
- `frontend/src/components/Property.tsx` (sale price + booking rules)
- `frontend/src/components/LeadForm.tsx`
- `frontend/src/services/LeadService.ts`
- `frontend/src/assets/css/lead-form.css`
- `frontend/src/pages/Property.tsx` (sale lead form + sale price label)
- `frontend/src/assets/css/property.css` (lead form layout)

## Step 4 (Role Onboarding + Dashboards) - Completed Files
- `backend/src/middlewares/authJwt.ts` (allow broker/developer/owner in frontend)
- `frontend/src/services/UserService.ts` (role sign-up + onboarding)
- `frontend/src/services/LeadService.ts` (lead list)
- `frontend/src/services/DevelopmentService.ts`
- `frontend/src/lang/common.ts` (role + lead labels)
- `frontend/src/lang/header.ts` (dashboard label)
- `frontend/src/lang/sign-up.ts` (partner CTA)
- `frontend/src/lang/sign-up-role.ts`
- `frontend/src/lang/onboarding.ts`
- `frontend/src/lang/dashboard.ts`
- `frontend/src/main.tsx` (language wiring)
- `frontend/src/components/Header.tsx` (dashboard entry)
- `frontend/src/components/LeadTable.tsx`
- `frontend/src/components/DevelopmentList.tsx`
- `frontend/src/pages/RoleSignUp.tsx`
- `frontend/src/pages/Onboarding.tsx`
- `frontend/src/pages/Dashboard.tsx`
- `frontend/src/pages/dashboards/BrokerDashboard.tsx`
- `frontend/src/pages/dashboards/DeveloperDashboard.tsx`
- `frontend/src/pages/dashboards/OwnerDashboard.tsx`
- `frontend/src/App.tsx` (routes)
- `frontend/src/pages/SignUp.tsx` (partner CTA)
- `frontend/src/assets/css/signup.css` (partner CTA)
- `frontend/src/assets/css/role-signup.css`
- `frontend/src/assets/css/onboarding.css`
- `frontend/src/assets/css/dashboard.css`
- `frontend/src/assets/css/lead-table.css`
- `frontend/src/assets/css/development-list.css`

## Step 5 (Admin Developments UI) - Completed Files
- `backend/src/controllers/developmentController.ts` (populate developer in list)
- `admin/src/lang/common.ts` (development labels/statuses)
- `admin/src/lang/header.ts` (developments menu label)
- `admin/src/lang/developments.ts`
- `admin/src/utils/helper.ts` (development status helpers)
- `admin/src/services/DevelopmentService.ts`
- `admin/src/components/DevelopmentStatusList.tsx`
- `admin/src/components/DeveloperSelectList.tsx`
- `admin/src/components/DevelopmentList.tsx`
- `admin/src/pages/Developments.tsx`
- `admin/src/pages/CreateDevelopment.tsx`
- `admin/src/pages/UpdateDevelopment.tsx`
- `admin/src/App.tsx` (routes)
- `admin/src/components/Header.tsx` (menu)
- `admin/src/assets/css/developments.css`
- `admin/src/assets/css/development-list.css`
- `admin/src/assets/css/create-development.css`

## Step 6 (Admin Dashboard + Development Detail) - Completed Files
- `admin/src/pages/Dashboard.tsx`
- `admin/src/lang/dashboard.ts`
- `admin/src/assets/css/dashboard.css`
- `admin/src/pages/Development.tsx`
- `admin/src/assets/css/development.css`
- `admin/src/components/DevelopmentList.tsx` (view action)
- `admin/src/pages/CreateDevelopment.tsx` (image management)
- `admin/src/pages/UpdateDevelopment.tsx` (image management)
- `admin/src/App.tsx` (dashboard + development routes)


