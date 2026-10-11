# 02 — Architecture, stack and code quality

## Preferred implementation

- **Next.js App Router** with strict **TypeScript**.
- **PostgreSQL** with Prisma ORM and committed SQL migrations; use manual SQL migration for exclusion constraint.
- Tailwind CSS + shadcn/ui + Lucide for consistent components.
- Zod for boundary validation; React Hook Form only where beneficial.
- date-fns (and date-fns-tz or another maintained time-zone-aware approach if needed) for time conversion.
- Auth.js-compatible credential-based server authentication or an equivalently well-supported Next.js solution, using `argon2id` password hashing and server-side role checks. **Verify currently installed package APIs/docs**, do not mix incompatible major versions.
- Vitest for units; integration tests with real PostgreSQL for booking integrity; small Playwright E2E suite if time permits.

## Request flow

Browser → App Router page / Server Action or Route Handler → Authentication → Authorization → Zod validation → Service/business rules → Database transaction/constraint → Typed result → UI feedback.

**Trust boundary:** Only server code can access Prisma and secrets. UI availability checks are informative, never authoritative. Server Actions are public-callable entry points and **must each authorize**.

## Suggested structure (adapt to actual framework version)

```text
src/
  app/
    (auth)/login/page.tsx
    (protected)/layout.tsx
    (protected)/page.tsx
    (protected)/resources/...
    (protected)/reservations/...
    api/auth/[...nextauth]/route.ts   # only if required by chosen auth setup
  components/
    ui/                       # generated design-system primitives
    resources/
    reservations/
    dashboard/
    layout/
  lib/
    auth/                     # session, roles, current user
    db/                       # singleton Prisma client, query helpers
    services/                 # resource and reservation use cases
    validators/               # Zod schemas
    time/                     # time-zone conversion and intervals
    errors/                   # safe public errors
  types/
prisma/
  schema.prisma
  migrations/
  seed.ts
scripts/
tests/
docs/
README.md
.env.example
```

## Implementation principles

1. **Explicit feature boundaries:** Thin request handlers/actions; business logic in services; persistence in server modules.
2. **Typed boundaries:** Strict TS, no `any` without documented reason, infer types from Zod where appropriate.
3. **Validation twice where needed:** UI for clarity; server for trust. DB constraints for invariants.
4. **Least privilege:** Member queries are scoped in database access, not filtered only after fetching all data.
5. **Simple data model:** User ↔ Reservation ↔ Resource; avoid unnecessary tables and abstractions.
6. **Safe errors:** Return actionable messages, but no SQL stack traces or credential information to users.
7. **Reliable state:** Use revalidation/redirect patterns after mutations. Do not rely on client-only caches as truth.
8. **Operational clarity:** Deterministic migrations/seed, local PostgreSQL configuration, no hardcoded secrets.
9. **Accessibility:** Semantic controls and tables, focus management, keyboard usability, visible errors.
10. **Change control:** Small commits, real verification after each phase; no destructive rewrites without approval.

## Decisions to record in README

- Why Next.js full stack instead of an unnecessary secondary backend.
- Why database exclusion constraints beat application-only overlap queries.
- Why `timestamptz` + `[start,end)` avoids ambiguous endpoints.
- Why local seeded account access was chosen and what would change for production identity management.
- What parts were intentionally left out to respect internship-assessment scope.
