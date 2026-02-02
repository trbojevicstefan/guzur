# AGENTS

## Purpose
Repurpose Movin' In into a property marketplace that supports:
- Selling and buying properties
- Renting properties
- Contacting agents/brokers and developers/builders
- Owners listing their own properties

## Product Directives
- Reuse the existing multi-agency foundation; extend it to brokers/agents, developers/builders, and owners.
- Keep the rental booking flow for rent listings; add a dedicated inquiry/lead flow for sales.
- Preserve a single User collection with role-based permissions; update role enums in `packages/movinin-types` and backend models.
- Expand Property to support listing type (sale, rent, both), pricing for sale and rent, and associations to broker/agent, developer, and owner.
- Ensure all user-facing labels and copy match the new domain (avoid "agency" and "rental" unless intentionally kept).
- Provide explicit registration/onboarding funnels for brokers/agents, developers/builders, and owners.
- Provide role-specific dashboards for brokers/agents, developers/builders, and owners.

## Decisions (Confirmed)
- Sales flow is lead capture only (no offers/negotiation or document signing).
- Developers/builders manage multi-unit inventory, not just single listings.
- Sales payments are out of scope; rentals continue using existing Stripe/PayPal.
- Owner listings require admin verification before publishing.
- Mobile app is out of scope for the initial launch.
- Remove `AGENCY` alias; use `BROKER` only.

## Implementation Guidelines
- Backend: update schemas, services, routes, and auth checks to support new roles and listing types.
- Admin panel: add role-specific dashboards and management screens for listings, leads, and assignments.
- Frontend: add sale/rent filters, contact actions, and buyer/renter dashboards.
- Mobile: out of scope for initial launch; disable or deprecate mobile builds until revisited.
- Notifications: add lead/inquiry notifications for brokers, developers, and owners.
- Data migration: add scripts to backfill new fields and map existing agencies to new roles.
- Testing: update and extend tests for roles, permissions, listing flows, and lead creation.

## Working Conventions
- Favor existing components and services; refactor before replacing.
- Keep changes incremental and backwards compatible when possible.
- Update i18n strings in all apps when adding or changing user-facing text.
- Document new env vars and configuration changes as they are introduced.
