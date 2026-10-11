# 00 — Start here: master implementation prompt

## Your role

Act as a **senior software engineer, security engineer, database architect, reviewer, and practical technical mentor**. Build a real, understandable Resource Reservation Management System named **ReserveFlow** (proposed product name) for PrimeWave Lab (Pvt) Ltd's Software Engineering Internship Technical Assessment.

**Instruction to coding agent:** Read `AGENTS.md` and **all numbered Markdown files** in this directory. They are deliberately separated to keep the specification easy to maintain. Do not stop after creating a plan: implement the app in phases, inspect and validate your work, and report genuine blockers.

## Official brief (source-derived)

- **Problem:** Shared organizational facilities/resources are booked informally, causing uncertainty, schedule confusion and overlapping reservations.
- **Required:** Practical functional full-stack web app; **Next.js (App Router), TypeScript, PostgreSQL, Git and GitHub**; persistent data and local development support.
- **Engineering freedom:** Architecture, design and feature interpretation are up to the applicant. AI-assisted development is permitted, but the applicant must explain the solution.
- **Company's stated priority:** A focused, functional, well-reasoned solution, not a large enterprise platform.
- **Deliverables:** GitHub repository + runnable README, a **3–5-minute demo video**, and a shareable **ER diagram**.
- **Deadline:** **Thursday, 15 October 2026, 11:59 PM Sri Lanka time (UTC+05:30)**. Submission form: https://forms.gle/HzQH6tB5c4edPjnn8

The requirements below are our **engineering interpretation**, not additional explicit company requirements. In the README, distinguish these design decisions from the official brief.

## Key product decisions

- Two roles: **ADMIN** manages resources and may manage bookings; **MEMBER** sees active resources and manages only their own bookings.
- Closed, seeded accounts for local demonstration (no public self-registration). Authentication is included because the user specifically requests strong security; keep it lightweight and honest about operational limitations.
- Resources can be activated/deactivated; bookings are confirmed or cancelled. No hard deletion of reservation history.
- PostgreSQL exclusion constraint prevents overlapping **CONFIRMED** bookings of the same resource even during concurrent requests.
- Store time in UTC (`timestamptz`); use **Asia/Colombo** for demo display and input interpretation unless the application explicitly supports time zones.
- Build resource management, booking flow and server-side reliability first; keep charts, invites, approval flows, email and deployment out of core scope.

## Priority order

1. **P0:** Correctness, auth/authz, secure validation, PostgreSQL conflict constraint, real CRUD and cancellation, migrations, reproducible local startup.
2. **P1:** Polished responsive UX, meaningful dashboard, filters, tests, seed data, README and ER diagram.
3. **P2:** Calendar month view, notifications, analytics, multi-tenant organizations, integrations or deployment. Do not begin P2 before completing the submission.

## Agent execution contract

1. Inspect the repo and available tooling. Say what exists.
2. Give a concise architecture summary, assumptions, a phase checklist and the main risks.
3. Build stages in `06_BUILD_PHASES.md`, confirming each stage using real commands/tests.
4. Keep the app functional as you progress. Avoid unnecessary rewrites.
5. Prepare the deliverables in `08_SUBMISSION.md`.
6. Report **implemented**, **verified**, **not verified**, and **remaining** separately; never invent outcomes.

**Begin by inspecting the existing repository, then work through the numbered files.**
