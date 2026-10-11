# Agent instructions — ReserveFlow assessment

You are a senior full-stack software engineer implementing a focused technical assessment. **Read `00_START_HERE.md` first**, then read the other specifications before writing code. Follow the documents as one coherent contract.

## Non-negotiable working rules

1. Implement a working **Next.js App Router + TypeScript + PostgreSQL** solution with Git-compatible source history. This is the assessment's required stack.
2. Treat **security, server-side authorization, and prevention of double bookings** as P0 engineering concerns. Never claim a feature is secure or tested without verification.
3. Keep scope focused; the company's brief explicitly values practical delivery over enterprise complexity. Proposed login/roles are an additional security design choice, **not a stated company requirement**.
4. Prefer simple, typed, maintainable implementations. No placeholder buttons, fake data in production paths, hardcoded secrets, or inert UI.
5. Before coding, inspect the repository and local environment. Preserve working files. Summarize assumptions and risks. Then implement incrementally, testing each phase.
6. All writes to the database happen on the server and require both validation and authorization. Database constraints are the final authority for reservation conflicts.
7. Do not claim commands passed, files were uploaded, a GitHub repository was published, or a video was recorded unless actually verified.
8. Do not commit secrets or operate external accounts, publish repositories, or submit the form without the user's explicit approval.
9. If tool access is unavailable, provide concrete file changes and commands, and label them **not executed**.
10. Keep documentation consistent with the **actual** final implementation.

## Read order

`00_START_HERE.md` → `01_REQUIREMENTS.md` → `02_ARCHITECTURE.md` → `03_SECURITY.md` → `04_DATABASE_BOOKINGS.md` → `05_UI_UX.md` → `06_BUILD_PHASES.md` → `07_TESTING.md` → `08_SUBMISSION.md`.

## Definition of done

Working local app; resource and reservation flows; authenticated and authorized mutations; database-enforced overlap safety; error handling; migrations and seed; documented setup; tests executed where available; ER diagram; GitHub-ready source; and a real 3–5-minute demo plan. Report any missing items explicitly.
