# 06 — Ordered implementation plan with stage gates

Work in **small, verifiable slices**. Keep a running checklist and note actual command results. Do not spend the deadline window on optional features.

## Phase 0 — Inspect and decide

- [ ] Inspect current files, package manager, Node version, database availability and Git status.
- [ ] Clarify only true blockers (e.g., access to PostgreSQL); otherwise choose sensible defaults.
- [ ] Identify official requirements vs added security/product decisions.
- [ ] Summarize technical plan, risk points and estimated effort.

**Gate:** A clear implementation plan and known run commands.

## Phase 1 — Bootstrap and data

- [ ] Create/verify Next.js App Router + strict TypeScript, linting and styling.
- [ ] Configure Prisma/PostgreSQL and `.env.example`; keep secrets private.
- [ ] Define User, Resource and Reservation entities, enums and foreign keys.
- [ ] Create migration files, including SQL `CHECK` and exclusion constraint.
- [ ] Run fresh migrations on isolated local database.
- [ ] Add deterministic seed with active/inactive resources and non-conflicting bookings.

**Gate:** App starts locally, migrations work, seed is repeatable.

## Phase 2 — Auth and authorization (P0)

- [ ] Install compatible maintained auth solution and implement proper credential hashing/session management.
- [ ] Provision dev accounts using secure environment-based values; no public signup.
- [ ] Add server helper for `requireUser` and `requireAdmin`.
- [ ] Scope booking fetch/update logic to owner/admin.
- [ ] Test that anonymous and member privilege escalation fails.

**Gate:** Protected access works even via direct server requests.

## Phase 3 — Resource management

- [ ] Implement resource validation and DB services.
- [ ] Implement admin create/edit/deactivate.
- [ ] Implement active resource browsing for members.
- [ ] Ensure inactive resources reject new reservations; lock resource state during booking/deactivation where required.

**Gate:** Persisted CRUD/activation status and tested role boundary.

## Phase 4 — Reservation correctness (most critical)

- [ ] Implement create booking with transaction and database exclusion constraint.
- [ ] Implement availability check that mirrors the DB overlap predicate.
- [ ] Implement edit (only eligible future confirmed bookings) and cancellation.
- [ ] Convert time correctly for Asia/Colombo inputs and UTC persistence.
- [ ] Handle concurrent race conflicts gracefully.
- [ ] Write DB integration tests for adjacent, different-resource, cancelled and concurrent cases.

**Gate:** All core booking cases pass on real PostgreSQL; no double booking.

## Phase 5 — UI and dashboard

- [ ] Build coherent app shell, forms and tables.
- [ ] Add dashboard with **real** aggregate queries and role-appropriate visibility.
- [ ] Add filtering, bounded pagination, empty/loading/error states.
- [ ] Check mobile layout, keyboard interactions and readable feedback.

**Gate:** Complete manual happy-path and failure-path demo works.

## Phase 6 — Hardening and verification

- [ ] Run actual `lint`, `typecheck`, `test`, `build` commands that exist in the repository.
- [ ] Review request validation, authorization, CSRF and error handling.
- [ ] Run ownership/IDOR and injection/XSS handling checks.
- [ ] Inspect git diff for secrets, broken links, debug data and unused code.
- [ ] Resolve errors and rerun failed checks.

**Gate:** Record verified results, limitations and unrun checks honestly.

## Phase 7 — Submission packaging

- [ ] Write setup-accurate `README.md` and `.env.example`.
- [ ] Create real schema ER diagram and publish/share as allowed.
- [ ] Prepare 3–5-minute demo script and capture real screen recording.
- [ ] Check GitHub accessibility, migration reproducibility and delivery links.
- [ ] Submit through the official form before the deadline, using the **same application email** used for the CV.

**Gate:** All three mandatory submission artifacts are accessible.

## Useful scripts (create them; do not assume they exist)

```bash
npm run dev
npm run lint
npm run typecheck
npm run test
npm run build
npx prisma migrate dev
npx prisma db seed
```

If actual scripts/commands differ, document and use the real ones. Never claim a check ran if it was only suggested.

## Deadline discipline

Treat the 15 October deadline as fixed. Stop adding features once P0 and essential P1 are stable. Reserve time for recording, ER sharing, GitHub upload and the form itself.
