# 04 — PostgreSQL schema and reservation correctness

## Primary data model

### User (proposed security feature)

`id UUID PK`, `email UNIQUE NOT NULL`, `name NOT NULL`, `passwordHash NOT NULL`, `role {ADMIN,MEMBER}`, `isActive BOOLEAN DEFAULT TRUE`, `createdAt`, `updatedAt`.

### Resource

`id UUID PK`, `name NOT NULL`, `description NULL`, `category NOT NULL`, `location NULL`, `capacity INTEGER NULL`, `isActive BOOLEAN DEFAULT TRUE`, `createdAt`, `updatedAt`.

### Reservation

`id UUID PK`, `resourceId UUID FK → Resource`, `userId UUID FK → User`, `title NOT NULL`, `startAt TIMESTAMPTZ NOT NULL`, `endAt TIMESTAMPTZ NOT NULL`, `status {CONFIRMED,CANCELLED} DEFAULT CONFIRMED`, `createdAt`, `updatedAt`.

Relationships: `User 1—N Reservation` and `Resource 1—N Reservation`. No redundant requesterId from client forms; identity is derived from the server session.

## Time semantics

- Store **instants** as `timestamptz`; map Prisma timestamp columns to the database-compatible `@db.Timestamptz(...)` where needed.
- Interpret demo date/time input in **Asia/Colombo** and explicitly convert to UTC on submission. Render times back in the same stated time zone.
- Intervals are **half-open**: `[startAt, endAt)`. Endpoints touching exactly are allowed.
- Require `startAt < endAt` with both Zod and a DB `CHECK` constraint.
- New bookings must start after current server time; client clock is not authoritative.
- Use `now` checks in services. The exclusion constraint protects overlap regardless of time checks.
- Cross-midnight bookings are allowed if their timestamps form a valid interval.

## Core overlap rule

An existing confirmed booking conflicts when:

```text
existing.resourceId == requested.resourceId
AND existing.status == CONFIRMED
AND existing.startAt < requested.endAt
AND existing.endAt > requested.startAt
```

Cancelled bookings do not block time. Bookings for different resources can overlap.

## Mandatory database-level enforcement

Use a hand-reviewed Prisma SQL migration to implement a PostgreSQL **GiST exclusion constraint**. The exact table/column/type names **must be checked against generated Prisma migrations** before applying. The following is an illustrative example, not unverified drop-in SQL:

```sql
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE "Reservation"
  ADD CONSTRAINT "reservation_valid_range"
  CHECK ("startAt" < "endAt");

ALTER TABLE "Reservation"
  ADD CONSTRAINT "reservation_no_overlap_confirmed"
  EXCLUDE USING gist (
    "resourceId" WITH =,
    tstzrange("startAt", "endAt", '[)') WITH &&
  )
  WHERE ("status" = 'CONFIRMED');
```

Ensure enum comparison type, migration ordering, extension permissions and `timestamptz` column types match the actual database. Prisma schema alone may not model the exclusion constraint; **preserve custom SQL through migrations** and verify against fresh DB setup. Do not use `prisma db push` as a replacement for applying required SQL migrations.

Useful indexes: `Reservation(userId, startAt)`, `Reservation(resourceId, startAt)`, optionally `Resource(isActive, category)`. Avoid duplicating indexes the database already provides without purpose.

## Atomic reservation create — required sequence

1. Authenticate the actor, derive their user ID and enforce active account state.
2. Parse and validate title, resource ID and time range.
3. Begin a database transaction.
4. Retrieve/lock the resource row `FOR UPDATE` (parameterized query, typed result), assert resource exists and is active. Admin deactivation/edit affecting bookability must follow the same lock protocol.
5. Create a `CONFIRMED` reservation using **server-derived** user ID.
6. Commit. The exclusion constraint is the final defense against simultaneous overlapping commits.
7. On a constraint conflict, translate the DB error into a user-safe `SLOT_UNAVAILABLE` result; preserve original state. Do not retry blindly into a different slot.

**Note:** Row locks alone are not enough to protect bookings if different code paths omit the lock; the DB exclusion constraint is mandatory. Keep transactions short; do not perform UI/network work inside them.

## Edit and cancel rules

- **Edit:** Authenticate, authorize owner/admin, allow only eligible future confirmed reservation, validate new time, lock relevant resource row, update transactionally; exclusion constraint applies to changed time/resource. If resource changes are supported, use deterministic lock ordering for old/new resource rows to reduce deadlock risk (or simplify MVP by disallowing resource changes on edit).
- **Cancel:** Authenticate, authorize, update `CONFIRMED → CANCELLED`. Be explicit about whether repeat cancellation is idempotent (recommended: return existing cancelled state, not duplicate activity).
- **Deactivate resource:** Admin only; lock resource, mark inactive; preserve reservations. State clear policy for existing future bookings: recommended **do not cancel automatically**; they remain visible and admin must resolve them explicitly. New bookings are blocked.
- **Delete:** No hard delete of resources/bookings with history in MVP.
- **Owner constraints:** Member reservation queries and updates must be authorization-scoped on the server. Avoid exposing other users' emails.

## Error taxonomy

`UNAUTHENTICATED`, `FORBIDDEN`, `NOT_FOUND`, `VALIDATION_ERROR`, `RESOURCE_INACTIVE`, `SLOT_UNAVAILABLE`, `INVALID_STATE`, `INTERNAL_ERROR`.

Map unexpected failures to a generic safe message; keep diagnostics on the server without private data leakage.

## Database acceptance examples

| Existing reservation | New attempt | Expected |
|---|---|---|
| Room A 09:00–10:00 | Room A 09:30–10:30 | Reject |
| Room A 09:00–10:00 | Room A 10:00–11:00 | Allow |
| Room A 09:00–10:00 | Room B 09:30–10:30 | Allow |
| CANCELLED Room A 09:00–10:00 | Room A 09:30–10:30 | Allow |
| Two concurrent Room A 09:00–10:00 | Two simultaneous creates | Exactly one commits |
| Room A inactive | Any new booking | Reject |

## ER diagram

Provide the actual schema in `docs/ERD.md` or `docs/erd.mmd` (Mermaid ER syntax), plus an image/export or shareable link for submission. **Only diagram entities that exist in the real schema.**
