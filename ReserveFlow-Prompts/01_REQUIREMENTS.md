# 01 — Scope, user stories and acceptance criteria

## Business interpretation

The official assessment describes an organization needing a central way to organize shared resources and coordinate reservations. It does **not** mandate particular screens, authentication, roles, categories, charts, or REST endpoints. The following is a deliberately scoped solution to that scenario.

## Actors (proposed)

- **Admin:** Can create/edit/deactivate resources, view all reservations, cancel or edit reservations, and view dashboard summaries.
- **Member:** Can log in, view active resources and their availability, create reservations, and view/edit/cancel only bookings they own.
- **Unauthenticated visitor:** Can access the login page only; protected data must not be leaked.

No public sign-up or password-reset email flow for this assessment; seed secure local demo accounts and document how credentials are provisioned.

## Must-have user stories

| ID | Story | Acceptance test |
|---|---|---|
| R1 | Admin registers a resource | Valid resource persists after refresh; input is validated |
| R2 | Admin updates/deactivates a resource | Changes persist; inactive resource rejects new bookings |
| R3 | Authenticated user browses resources | Active resource details are visible; administrative actions are restricted |
| B1 | Member books an active resource | Valid future time range creates a confirmed booking in PostgreSQL |
| B2 | User checks availability | UI indicates a conflict; server still enforces the booking rule |
| B3 | Overlapping booking is attempted | It is rejected for the same resource, including concurrent requests |
| B4 | Adjacent time slots are booked | `[09:00,10:00)` and `[10:00,11:00)` both succeed |
| B5 | Booking is cancelled | Cancelled record remains visible in history but no longer blocks time |
| B6 | Booking is edited | Only permitted user can update; new range rechecks all constraints |
| B7 | User views bookings | Members see only their own; admins may see all |
| S1 | Unauthorized request is made | Server refuses read/write regardless of hidden UI controls |
| S2 | Invalid data is submitted | Safe field-level errors; no inconsistent persistence |
| D1 | Dashboard is opened | Real resource/reservation counts with accurate time semantics |

## Resource data

`id`, `name`, `description?`, `category`, `location?`, `capacity?`, `isActive`, `createdAt`, `updatedAt`.

- Capacity, if present, must be positive.
- Inactive resources stay available in admin history but cannot accept new bookings.
- Do not hard-delete resources with historical reservations.

## Booking data

`id`, `resourceId`, `userId`, `title`, `startAt`, `endAt`, `status`, `createdAt`, `updatedAt`.

- Requester identity comes from the authenticated user; do **not** trust `userId` submitted by the browser.
- Start must be strictly before end. For new bookings, start must be in the future.
- For a focused MVP, booking statuses are `CONFIRMED` and `CANCELLED`.
- Only future confirmed bookings may be rescheduled; cancelled bookings remain history and cannot be reactivated through editing. A new booking may be created for that time.
- Cancellation may be allowed for future bookings; whether past bookings can be cancelled should be documented and consistently enforced. Recommended: prevent cancellation once the booking has ended.

## Out of scope unless P0/P1 are complete

Public registration, invitation emails, password reset emails, automatic notifications, billing, approval queues, multi-tenant company management, recurrence, waitlists, external calendar sync, external deployment.

## Scope and security trade-off

Authentication and authorization are **added security requirements chosen for this implementation**, not a mandatory item in the company's PDF. Keep the implementation small: seeded identities, two roles, clear server guards. Do not let advanced identity administration displace the actual reservation problem.
