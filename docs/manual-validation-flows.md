# Manual Validation Flows

Use this checklist to verify MVP flows after deployments or major changes.

## 1) Sign-in + Access by Role
1. Create/verify accounts for Admin, Broker, Developer, Owner, and Buyer.
2. Sign in to each role and confirm access:
   - Admin can access admin portal and see Brokers/Owners/Developers.
   - Broker/Developer/Owner can access dashboard and org pages.
   - Buyer can browse public listings and open RFQ.

## 2) Rental Search + Booking
1. As a public user, search for Rent listings.
2. Open a listing, select dates, proceed to booking.
3. Use pay later (if enabled) to confirm booking.
4. Verify booking appears in user dashboard and admin bookings list.

## 3) Sale Lead Creation
1. As a public user, open a Sale listing.
2. Use “Send Message” (Pulse) or Lead form.
3. Confirm lead is created (admin leads list) and notification is sent.

## 4) Owner Submit for Review + Approval Gating
1. As Owner, create a listing and submit for review.
2. Confirm listing is not public until approved.
3. As Admin, approve listing.
4. Confirm listing becomes visible in public search.

## 5) Buyer Messaging (Pulse)
1. Buyer sends message from listing.
2. Broker/Owner receives Pulse unread badge.
3. Open Guzur Pulse and confirm message thread opens.
4. Reply from broker/owner; confirm buyer receives unread badge.

## 6) RFQ Buyer Request
1. Open `/rfq`, submit a request with listing type + location.
2. Confirm RFQ shows in Admin → RFQ Requests.
3. Update RFQ status and assignment; verify status reflects on list.

---

## Run Log

### 2026-01-27
- 1) Sign-in + Access by Role: **Pending** (requires manual UI run)
- 2) Rental Search + Booking: **Pending** (requires manual UI run)
- 3) Sale Lead Creation: **Pending** (requires manual UI run)
- 4) Owner Submit for Review + Approval Gating: **Pending** (requires manual UI run)
- 5) Buyer Messaging (Pulse): **Pending** (requires manual UI run)
- 6) RFQ Buyer Request: **Pending** (requires manual UI run)
