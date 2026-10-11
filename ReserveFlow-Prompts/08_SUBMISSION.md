# 08 — Documentation, ER diagram, demo and submission

## Official required deliverables (source-derived)

1. **GitHub repository** with complete source and a README another developer can follow to run the solution.
2. **3–5-minute screen-recorded demonstration** of the purpose, working application and important engineering choices.
3. **Entity Relationship diagram**, reachable using a shareable link in the official submission form.

**Submission:** https://forms.gle/HzQH6tB5c4edPjnn8  
**Deadline:** Thursday **15 October 2026, 11:59 PM Asia/Colombo (UTC+05:30)**. The form closes at the beginning of Friday 16 October. Use the **exact email address used for the initial CV submission**; do not assume it is identical to an address visible on a resume without checking.

## README outline

- Project name and concise business problem.
- Official assessment's stack and chosen additional libraries.
- Explicitly marked **product/engineering assumptions**, including auth/roles.
- Feature list and user permissions.
- Architecture/flow diagram or textual overview.
- Prerequisites (supported Node/npm/PostgreSQL versions).
- Local DB creation and environment variable setup using `.env.example`.
- Installation, Prisma migration, seed and `npm run dev` commands.
- How to log into the local demo safely (where demo credentials are provisioned; never commit production secrets).
- How conflicts are prevented (half-open interval, DB exclusion constraint, transaction/lock behavior).
- Tests: exact commands and real outcomes.
- Database ER diagram link/image.
- Security model and **honest limitations** (e.g., closed demo accounts, no email recovery, production rate-limiting/deployment not included).
- Screenshots and video link when actually created.
- Improvements deliberately deferred for scope control.

## ER diagram

Create `docs/erd.mmd` using the actual final Prisma/Postgres schema, including `User`, `Resource`, `Reservation`, their foreign keys and cardinalities. Document `CHECK` and exclusion constraints beside the diagram. Export SVG/PNG if practical. Publish a genuinely shareable read-only link (GitHub markdown asset or suitable diagram-hosting service); verify in a logged-out browser session.

## 3–5-minute demo script (target ~4:30)

| Time | Demonstration |
|---|---|
| 0:00–0:30 | Business problem and ReserveFlow's purpose |
| 0:30–1:05 | Stack, account roles and project structure |
| 1:05–1:45 | Admin adds/edits a resource; member sees it |
| 1:45–2:40 | Create reservation; attempt conflicting booking; show safe rejection |
| 2:40–3:20 | Cancel booking and demonstrate freed availability; quick filter/dashboard |
| 3:20–4:05 | ER diagram and database constraint; explain concurrency safeguards |
| 4:05–4:30 | Testing, security design, scope decisions and closing |

Use actual application data and live working interactions. Do not fake a successful booking response or use a mock dashboard. Keep private credentials and `.env` out of the recording.

## Submission readiness checklist

- [ ] GitHub source is committed, pushed and accessible to reviewer.
- [ ] README was verified from a clean install (as far as tools permit).
- [ ] `.env.example` is safe; no actual secrets committed.
- [ ] Migrations (including manual exclusion constraint) are in Git.
- [ ] Tests / build have been run; results accurately recorded.
- [ ] Demo video is 3–5 minutes and its link is accessible.
- [ ] ER diagram matches actual schema and is reachable via share link.
- [ ] Email in the form matches the original application email.
- [ ] Form is submitted **before** the deadline.
- [ ] Any public link access is verified, ideally outside the signed-in account.

## Final agent handoff

Report: actual files changed; architecture decisions; complete user flows; tests and command outcomes; known security limitations; GitHub/ER/video URLs **only if verified**; pending user actions. Do not submit or publish on the user's behalf without explicit authorization.
