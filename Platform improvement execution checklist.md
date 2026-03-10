# Platform Improvement Execution Checklist

> Note: Mobile app changes are out of scope for this pass.

## Summary
- Create a new root document named `Platform improvement execution checklist.md`.
- Use it as the single living checklist for this bug-fix/improvement pass, changing each `[ ]` to `[x]` as work is completed.
- Implement in this order: shared search/filter foundation, shared map foundation, Home, Projects, Destinations, Search, Property details, Footer, verification.

## Public Interfaces
- Extend the public property search model to support `q`, `location`, `listingType`, `from`, `to`, `priceMin`, `priceMax`, `bedroomsMin`, `areaMin`, `areaMax`, `features`, and `sort`.
- Keep public project browse state URL-driven with `q`, `location`, `status`, `layout`, and `page`.
- Extend the shared map component so it can optionally render a location search overlay and richer property pin popups.
- Do not add a new persisted property `tags` field in this pass; derive feature tags from existing listing attributes such as `furnished`, `aircon`, `petsAllowed`, `parkingSpaces`, and `developmentId`.

## Checklist Content
### Discovery
- [x] Review `Platform bugs & improvements.md` in the repo root.
- [x] Audit the current Home, Projects, Search, Destinations, Property, Map, SearchForm, LocationSelectList, and Footer implementations.
- [x] Confirm current public filter/query limits in shared types, frontend services, and backend controllers.
- [x] Identify which reported bugs are CSS/layout only and which require API/query changes.

### Document Setup
- [x] Create `Platform improvement execution checklist.md` in the repo root.
- [x] Copy this checklist into that file and preserve the completed `[x]` discovery items.
- [x] Add a short note at the top of the file that mobile app changes are out of scope for this pass.

### Shared Search And Filter Foundation
- [x] Move public search state from route `state` to URL query parameters.
- [x] Add a shared helper to parse URL filters into page state and serialize page state back into the URL.
- [x] Extend the shared property search types and service payloads with keyword, price, bedroom, area, feature, and sort fields.
- [x] Extend the sidebar filter model so Search page filters can round-trip through the URL.
- [x] Add derived feature-tag mapping for `Furnished`, `Air Conditioning`, `Pets Allowed`, `Parking`, and `In Compound`.
- [x] Update public property queries to filter by keyword, price range, bedroom minimum, area range, feature tags, and sort before pagination.
- [x] Keep rent-only date validation when listing type includes rent, and clear dates automatically when switching to sale-only.
- [x] Ensure public property result shaping does not rely on agency-only assumptions when broker, developer, or owner listings are returned.
- [x] Add backend tests for each new property filter and for the supported sort modes.

### Shared Map Foundation
- [x] Add an optional searchable location control to the shared map component.
- [x] Recenter and zoom the map when a searched location is selected.
- [x] Reuse the same map search control in inline maps and the fullscreen map dialog.
- [x] Expand property pin popups to show unit image, unit title, location/listing meta, and a direct details CTA.
- [x] Pass property-selection callbacks from pages that currently render property pins without actionable details.
- [x] Keep map wheel/pan interaction locked by default on pages where map scrolling currently blocks page scrolling.
- [x] Add shared responsive CSS for map search overlays, popup cards, and locked/active interaction states.

### Home Page
- [x] Redesign the hero so the video remains a backdrop but the copy, spacing, and contrast are materially stronger.
- [x] Add a primary CTA row with `Explore Properties`, `Find Your Unit`, and `Browse Projects`.
- [x] Embed the shared advanced search panel directly inside the hero.
- [x] Show rent dates only when the selected listing type includes rent.
- [x] Add min/max price, bedrooms minimum, area range, and feature chips to the hero search panel.
- [x] Rework hero mobile layout so headline, CTA buttons, and filters stack cleanly with no overlap or clipped text.
- [x] Increase desktop section width so featured listings and projects do not feel constrained on large screens.
- [x] Insert a new `About Guzur` section between Featured Listings and Projects.
- [x] Move the Projects section below the new About block and keep clear visual separation between all three sections.
- [x] Add localized About heading, supporting copy, and one trust-building CTA.
- [x] Replace the fixed `500vh` “What Makes Us Different” section height with step-count-based scroll duration.
- [x] Clamp the ScrollTrigger end so the last step releases cleanly and does not require extra dead scrolling.
- [x] Reduce sticky-section spacing so the next section appears immediately after the last slide.
- [x] Keep a readable reduced-motion fallback with no hidden content.
- [x] Add map search to the Home map.
- [x] Enable rich property popups and direct property navigation from Home map pins.
- [x] Redesign the Customer Care section to match the rest of the homepage visual language.
- [x] Surface support email, support icons, and a stronger `Contact Support` CTA in Customer Care.
- [x] Update home i18n strings for hero CTAs, About Guzur, filters, map actions, and customer care copy.

### Projects Page
- [x] Keep keyword, location, status, layout, and page in the URL.
- [x] Make the projects filter bar sticky below the main site header on desktop.
- [x] Debounce keyword changes so only the results area updates and the page does not remount.
- [x] Turn `More Filters` into a working status filter control instead of a dead button.
- [x] Use real API-backed location labels and remove hardcoded Cairo fallback locations.
- [x] Use real completion dates where available and replace synthetic fallback dates with an explicit `TBA` label when missing.
- [x] Widen list/table mode to roughly 80% of the available desktop content width while keeping it centered.
- [x] Split pagination summary markup from the current-page badge so `X-Y OF Z TOTAL` can render inside its own rounded container.
- [x] Remove horizontal overflow from mobile and tablet layouts.
- [x] Tighten the mobile toolbar height and stack filters vertically below 900px.
- [x] Add empty, loading, and error states that do not collapse the layout.
- [x] Add backend tests for public project keyword, location, and status filters.
- [x] Update projects-page i18n strings for filter labels and pagination copy.

### Destinations Page
- [x] Reduce map height to a scroll-friendly clamp instead of viewport-dominating behavior.
- [x] Add a page intro block above the map so the page has context before interaction.
- [x] Add searchable location input above the map using the shared map search control.
- [x] Enable click-to-activate behavior so normal page scrolling works until the user intentionally activates the map.
- [x] Keep location-pin selection wired into the existing search flow after map interaction is improved.
- [x] Add responsive spacing around the map so the page no longer feels blocked by a single giant viewport element.

### Search Page
- [x] Refactor layout so the main search toolbar sits above the page split instead of inside the results column.
- [x] Read initial search state from URL query parameters instead of relying on route `state`.
- [x] Wire the top search input to the public property keyword filter.
- [x] Make the Sort control functional with `Newest`, `Price Low to High`, and `Price High to Low`.
- [x] Keep the desktop layout as sticky map/filters on the left and results on the right.
- [x] Replace the mobile inline sidebar/map with a one-column flow: Search, Sort, Filters, Results.
- [x] Keep mobile map access through the existing map dialog so the page no longer collapses into a confusing multi-column stack.
- [x] Move the map lower visually on desktop and place search controls above it.
- [x] Remove excess whitespace above and below the map card.
- [x] Ensure the date-required notice always appears below the toolbar and above the results list.
- [x] Preserve filters and selected results when opening and closing the map dialog.
- [x] Remove horizontal overflow at 375px and 768px widths.
- [x] Verify property-pin selection opens the correct details page from both inline map and map dialog.

### Property Details Page
- [x] Remove the property-page `DetailLoadingReveal` experience from the user flow entirely.
- [x] Render the property details page immediately after property data loads.
- [x] Remove the `Play presentation` button and the unused property-page presentation state and strings.
- [x] Keep the gallery image viewer as the only immersive media interaction on the property page.
- [x] Preserve rent booking UI for rent-capable listings only.
- [x] Preserve lead form UI for sale-capable listings only.
- [x] Verify direct navigation from Home, Search, and map popups opens details immediately with no interstitial experience.
- [x] Confirm project-detail presentation behavior remains unchanged unless intentionally edited later.

### Footer
- [x] Replace the plain text brand header with the Guzur logo plus a short brand description.
- [x] Rebuild the footer main section as a responsive grid with stable column widths.
- [x] Style `Marketplace`, `Corporate`, and `Support` as real visual headings using the site heading typography.
- [x] Remove the excess empty space currently sitting under the Marketplace and Corporate columns.
- [x] Keep support contact info and social actions visually grouped together.
- [x] Reflow the newsletter/subscription block so it aligns with the grid instead of dropping too low.
- [x] Rebalance the secure-payment strip spacing for desktop and mobile.
- [x] Update footer i18n strings for description copy and revised footer labels.

### Verification
- [x] Run frontend lint and build after each major batch of page changes.
- [x] Run backend build and relevant test files after query/controller updates.
- [x] Add one minimal smoke test suite for Home, Projects, Destinations, Search, and Property details on desktop and mobile viewports.
- [x] Verify no horizontal overflow at 375px, 768px, 1024px, and 1440px on all affected pages.
- [x] Verify sticky bars and sticky side rails do not overlap the global header.
- [x] Verify map scroll-lock behavior on Home, Destinations, Search, and Property.
- [x] Verify hero CTA buttons route to the correct destinations.
- [x] Verify hero/search filters generate correct URL parameters and survive refresh/back-forward navigation.
- [x] Verify projects filtering updates results dynamically without a full page reload.
- [x] Verify property details open directly, gallery works, and rent/sale actions remain correct.

## Test Plan
- Backend: add targeted tests for public property filtering/sorting and project filtering.
- Frontend automation: cover hero submit, projects filters, search mobile layout, map dialog navigation, and direct property open.
- Manual QA: validate responsive behavior, sticky positioning, map scroll interaction, popup details, and URL-state persistence on desktop and mobile.

## Assumptions
- The new checklist document will live in the repo root.
- Mobile app work remains out of scope.
- Feature tags will be derived from existing listing attributes instead of adding a new stored schema field.
- Public search and project browsing will use URL query parameters as the source of truth.
- Removing the full-screen presentation applies to unit/property details only in this pass.
