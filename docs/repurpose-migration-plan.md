# Repurpose Migration Plan (Draft)

This plan migrates Movin' In from agency-based rentals to a marketplace that supports
brokers/agents, developers/builders, owners, and buyers/renters while keeping rentals intact.

## Goals
- Preserve existing rental booking flow.
- Introduce broker, developer, and owner roles.
- Add listing type and approval workflow for sales.
- Keep `AGENCY` as a deprecated alias for `BROKER` during migration.
- Add primary vs resale classification and land listings.
- Add project-centric browsing and developer-centric project navigation.
- Support messaging and 3D/virtual tour attachments.

## Preconditions
- Full database backup.
- Deployed build with new schemas and role alias handling.
- Maintenance window or low-traffic window.

## Step 1: Deploy compatible code
Ship code that accepts `AGENCY` and `BROKER` as equivalent roles and ignores missing new fields.

## Step 2: Data backfill

### Users
Map user role values:
- `AGENCY` -> `BROKER` (but keep alias support in code)

Optional onboarding fields:
- `company`, `licenseId`, `serviceAreas`, `website`, `onboardingCompleted` default values.

### Properties
Backfill listing fields:
- `listingType = RENT`
- `listingStatus = PUBLISHED`
- `salePrice = null`
- `developer = null`
- `owner = null`
- `developmentId = null`
- `broker = agency` (or keep `agency` as broker field)
- `reviewedBy = null`, `reviewedAt = null`, `reviewNotes = null`

### New Collections
Create empty collections:
- `Development`
- `Lead`

### Indexes
Add indexes for:
- `Property.listingStatus`
- `Property.listingType`
- `Property.broker`, `Property.developer`, `Property.owner`
- `Lead.status`, `Lead.assignedTo`, `Lead.property`

## Step 3: Validation
- Count users by role before/after migration.
- Count properties with expected default listing fields.
- Validate sign-in and access for Admin and Broker.
- Run smoke test flows:
  - Rental search and booking
  - Create lead for a sale listing
  - Owner submits listing for review
  - Seller onboarding requires admin approval
  - Buyer messaging requires verified profile

## Step 4: Cleanup
Keep alias handling for `AGENCY` until all clients are updated, then remove in a later release.

## Rollback
If issues occur:
- Roll back to previous release.
- Restore database backup.

## Suggested Migration Script Flow
1. Dry-run: `npm run migrate` (logs counts and checks schema support).
2. Execute: `npm run migrate -- --execute` (writes updates when schemas support new fields).
3. Run validation queries and log totals.
4. Manual sign-in and listing check.

## Scripts and When to Execute
- `npm run setup` (backend): initial environment setup; creates admin user if missing.
- `npm run reset` (backend): remove admin user (use only in dev/test).
- `npm run migrate` (backend): dry-run after deploying new schemas to verify readiness.
- `npm run migrate -- --execute` (backend): execute data backfill after dry-run and backup.
