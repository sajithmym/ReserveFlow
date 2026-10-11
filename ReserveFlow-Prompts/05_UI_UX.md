# 05 — UI, UX and accessibility specification

## UX objective

A clean, practical reservation admin application where users can understand available resources, create valid bookings and receive immediate useful feedback. Prioritize task completion over elaborate visual effects.

## Suggested look

- Professional, minimal SaaS-style interface with neutral surfaces and restrained emerald/teal accents.
- Tailwind + shadcn/ui primitives; consistent spacing, typography, button hierarchy and status treatments.
- Responsive desktop/tablet/mobile layout, with accessible navigation and form controls.
- Subtle interaction feedback; avoid heavy animations, glass effects and unnecessary charts.

## Screens and permissions

| Screen | Member | Admin |
|---|---|---|
| Login | Available before login | Available before login |
| Dashboard | Own-safe booking summary or an appropriately scoped view | Full organization metrics |
| Resources list/detail | View active | View all (including inactive) |
| Create/edit/deactivate resource | No | Yes |
| My reservations / reservation detail | Own only | All with filtering |
| Create reservation | Yes | Yes |
| Edit/cancel reservation | Own eligible bookings | Any eligible booking |

## Core interface components

- App shell with accessible nav and visible signed-in identity/role.
- Resource cards or table with name, category, location, capacity and status.
- Admin resource form with validation messages and a deliberate deactivate confirmation.
- Booking list with resource, time, purpose and status; filters by date/status/resource (apply permission scoping first).
- Booking form with available resource selection, date/time fields, purpose, and explicit confirmation.
- Conflict feedback: **“That resource is booked during the selected time. Try a different time.”**
- Loading, empty, error and success states that never contradict the server result.

## Good booking UX

1. Make the display time zone visible (default **Sri Lanka time, UTC+05:30** for the demo).
2. Let users see whether selected times are apparently available, but repeat all checks server-side.
3. Disable submit while a submission is pending without treating it as a security mechanism.
4. If a race means an available slot becomes occupied, show a friendly conflict result and retain form inputs.
5. Make booking ownership and cancellation status obvious.
6. Require confirmation for cancellation/deactivation; do not silently delete records.
7. Display no other member's private booking details to non-admin users.

## Accessibility and performance baseline

- Semantic HTML and proper labels; descriptive validation text connected to inputs.
- Keyboard navigation, visible focus, appropriate contrast, accessible dialogs.
- Do not rely on color alone for booking status; use text labels.
- Pagination/bounded results on potentially growing lists.
- Avoid layout jumps; show skeletons only where they make sense.
- Prefer Server Components for initial data; use Client Components for actual interactivity.

## Avoid

Dead buttons, fake dashboard counts, generic placeholder copy, client-only enforcement of privileges, broad UI libraries with no payoff, unnecessary maps/charts, and designs that obscure the key booking workflow.
