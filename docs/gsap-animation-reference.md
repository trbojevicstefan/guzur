# GSAP Animation Reference

## Purpose
This document stores the reusable GSAP animation patterns used in the frontend so they can be reused and extended consistently.

## Implemented Patterns

### 1) Home "What Makes Us Different" Scroll Animation
- File: `frontend/src/pages/Home.tsx`
- Styles: `frontend/src/assets/css/home.css`
- Behavior:
  - Sticky scroll section with concentric ripple rings.
  - Scroll-driven step transitions (text, image, accent colors).
  - `scrub: 1` for smoother scroll catch-up.

### 2) Detail Loading Reveal (Property / Project)
- Component: `frontend/src/components/DetailLoadingReveal.tsx`
- Styles: `frontend/src/assets/css/detail-loading-reveal.css`
- Behavior:
  - Full-screen Iris-style loading reveal before detail page content appears.
  - Dynamic multi-phase flow (minimum 4 phases, can extend with more images/stats):
    - text phase swap (headline + body),
    - image phase swap (portal image),
    - stats bubble value swap.
  - Mechanical ring rotation (3 gears), ambient orb color transitions, and a slower eased-out zoom/fade handoff.
  - Fully dynamic: values are driven by `title`, `subtitle`, `description`, `images`, and `stats`.
  - Supports explicit phase definitions (`phases`) for custom sequences (e.g. Overview -> Details -> Amenities -> Seller).
  - Supports interactive playback controls:
    - autoplay by default,
    - click to pause/resume,
    - wheel scroll to scrub backward/forward.
  - Calls `onComplete` after timeline duration, then page renders normally.

## Reuse Contract

`DetailLoadingReveal` props:

```ts
interface DetailLoadingRevealStat {
  label: string
  value: string
}

interface DetailLoadingRevealProps {
  visible: boolean
  title: string
  subtitle?: string
  description?: string
  images: string[]
  stats?: DetailLoadingRevealStat[]
  accent?: string
  secondary?: string
  durationMs?: number
  onComplete: () => void
}
```

## Current Integrations
- Property page: `frontend/src/pages/Property.tsx`
- Project page: `frontend/src/pages/Project.tsx`

Both pages:
- Fetch data first.
- Show `DetailLoadingReveal` with dynamic data.
- Hide reveal on `onComplete`.
- Render page content unchanged after reveal.

## Integration Pattern
1. Create a local `showReveal` state.
2. Set `showReveal(false)` when fetch starts.
3. Set `showReveal(true)` after successful fetch and data binding.
4. Render `DetailLoadingReveal` while `showReveal` is true.
5. In `onComplete`, set `showReveal(false)` and show page content.

## Notes
- Respect reduced motion: reveal falls back to minimal motion and quick completion.
- Keep image list short (3 primary phase images are used).
- Keep stats concise (3 bubbles) for readability.
- The component is shared by both Property and Project pages, so visual updates here affect both flows.
