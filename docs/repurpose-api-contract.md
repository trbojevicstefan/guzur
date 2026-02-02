# Repurpose API Contract (Draft)

This document defines the API contract for repurposing Movin' In into a property marketplace
with brokers/agents, developers/builders, owners, and buyers/renters. It is designed to
reuse existing routes and payloads where possible and add minimal new endpoints for leads
and developer inventory.

## Conventions
- Authentication and session handling follow existing `sign-in` behavior (httpOnly cookie).
- All request/response bodies are JSON.
- Dates are ISO-8601 strings in payloads.
- `AGENCY` is accepted as a deprecated alias for `BROKER` during migration.

## Roles
- ADMIN: full access.
- BROKER: manages assigned listings and leads.
- DEVELOPER: manages developments and units, and their leads.
- OWNER: manages own listings; requires admin approval to publish.
- USER: buyer/renter.

## Enums (new)
- ListingType: `RENT`, `SALE`, `BOTH`
- ListingStatus: `DRAFT`, `PENDING_REVIEW`, `PUBLISHED`, `REJECTED`, `ARCHIVED`
- LeadStatus: `NEW`, `CONTACTED`, `VIEWING_SCHEDULED`, `CLOSED_WON`, `CLOSED_LOST`

## Authentication and Onboarding

### POST /api/sign-up
Buyer/renter signup (existing).

### POST /api/sign-up/:role
Role signup for `BROKER`, `DEVELOPER`, `OWNER`. `AGENCY` accepted but deprecated.

Request body (extends existing payload):
```json
{
  "email": "user@example.com",
  "password": "string",
  "fullName": "string",
  "language": "en",
  "phone": "string",
  "company": "string",
  "licenseId": "string",
  "serviceAreas": ["string"],
  "website": "https://example.com"
}
```

Response: HTTP 200 on success (existing behavior).

### POST /api/complete-onboarding
Update role-specific onboarding fields and flags.

Request body:
```json
{
  "_id": "userId",
  "company": "string",
  "licenseId": "string",
  "serviceAreas": ["string"],
  "website": "https://example.com",
  "onboardingCompleted": true
}
```

Response: Updated user.

## Properties (Listings)

### POST /api/create-property
Add listing fields to existing payload:
```json
{
  "listingType": "RENT",
  "listingStatus": "DRAFT",
  "salePrice": 250000,
  "broker": "userId",
  "developer": "userId",
  "owner": "userId",
  "developmentId": "developmentId"
}
```

### POST /api/update-property
Same as create; includes `listingStatus` and approval fields for admin.

### POST /api/submit-property-review
Owner submits a listing for approval.
```json
{
  "propertyId": "propertyId"
}
```
Result: sets `listingStatus = PENDING_REVIEW`.

### POST /api/review-property
Admin approval or rejection.
```json
{
  "propertyId": "propertyId",
  "approved": true,
  "reviewNotes": "string"
}
```
Result: `listingStatus = PUBLISHED` if approved, else `REJECTED`.

### GET /api/property/:id/:language
Unchanged, but response includes new listing fields.

### GET /api/properties/:page/:size
Add optional filters (body or query as implemented):
- listingType
- listingStatus
- salePriceMin/salePriceMax
- rentPriceMin/rentPriceMax
- broker/developer/owner/developmentId

## Developments (Inventory)

### POST /api/create-development
```json
{
  "name": "Project Name",
  "description": "string",
  "location": "string",
  "developer": "userId",
  "unitsCount": 20,
  "status": "PLANNING",
  "images": ["file1.jpg"]
}
```

### POST /api/update-development
Same fields plus `_id`.

### GET /api/development/:id
Development detail with linked unit counts.

### GET /api/developments/:page/:size
Developer scoped list.

### GET /api/frontend-developments/:page/:size
Public projects list. Optional query params:
- `s` (keyword)
- `location`
- `status`
- `developer`

### GET /api/frontend-development/:id
Public project detail.

### GET /api/frontend-development-units/:developmentId/:page/:size
Public units list for a project. Optional query params:
- `s` (keyword)

### GET /api/frontend-locations/:language
Public locations list for browsing. Optional query params:
- `parent` (locationId)
- `s` (keyword)

### DELETE /api/delete-development/:id
Admin or owning developer only.

## Leads (Inquiries)

### POST /api/create-lead
Public lead capture from listing detail.
```json
{
  "property": "propertyId",
  "listingType": "SALE",
  "name": "string",
  "email": "string",
  "phone": "string",
  "message": "string",
  "source": "frontend"
}
```
Response: lead with `status = NEW`.

### POST /api/update-lead
```json
{
  "_id": "leadId",
  "status": "CONTACTED",
  "assignedTo": "userId",
  "notes": "string"
}
```

### POST /api/delete-leads
Bulk delete by ids.

### GET /api/lead/:id
Role-scoped lead detail.

### GET /api/leads/:page/:size
Filters:
- status
- assignedTo
- listingType
- property
- broker/developer/owner

## Messaging (MVP)

### POST /api/message
Create a new message.
```json
{
  "property": "propertyId",
  "recipient": "userId",
  "message": "string"
}
```
Notes:
- `recipient` must be one of the listing's broker/owner/developer/agency.
- Listing must be published unless sender is a listing participant.

### GET /api/messages/:propertyId
Get messages for a property conversation (auth required). Optional query params:
- `page` (default: 1)
- `size` (default: 20)

### GET /api/message-threads
Get message threads for the current user (auth required). Optional query params:
- `page` (default: 1)
- `size` (default: 20)

## Backward Compatibility
- Existing rental booking flow remains unchanged.
- `AGENCY` routes are kept as broker equivalents during migration.
