# Verification report

Date: **11 October 2026, Asia/Colombo**. Environment: Windows, Node **24.8.0**, npm **11.6.0**, isolated PostgreSQL **18.3**, Next.js **16.4.0**.

| Check                                 | Result      | Evidence                                                                                                                     |
| ------------------------------------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Dependency installation               | PASS        | npm install and clean npm ci completed; lockfile included                                                                    |
| Fresh development migrations          | PASS        | Both initial and booking-integrity migrations applied to a new reserveflow database                                          |
| Fresh isolated test migrations        | PASS        | Both migrations applied to a new reserveflow_test database                                                                   |
| Seed                                  | PASS        | Two environment-provisioned accounts, six resources, three non-overlapping reservations                                      |
| Seed repeatability                    | PASS        | scripts/verify-seed.ts verified unchanged row counts and stored credential hashes                                            |
| ESLint                                | PASS        | npm run lint, zero errors/warnings                                                                                           |
| TypeScript                            | PASS        | npm run typecheck                                                                                                            |
| Domain tests                          | PASS        | 17 Vitest tests for conversion, intervals, strict numeric validation, filters, and safe errors                               |
| PostgreSQL integration tests          | PASS        | 18 tests against actual PostgreSQL; fixture-scoped cleanup                                                                   |
| Concurrent SQL writes                 | PASS        | Two independent Prisma/PG connections; exactly one commit, one safe conflict, one confirmed record; repeated four times      |
| Concurrent service writes             | PASS        | Exactly one concurrent booking succeeds                                                                                      |
| Resource deactivation race            | PASS        | Shared resource row lock serializes writes; inactive state blocks subsequent creation                                        |
| Browser end-to-end flows              | PASS        | Two Playwright tests with the installed Chrome channel; Two passing complete runs; 48.6s + 6.7s after restarting the preview |
| Direct action authorization           | PASS        | Browser tests replay actual action IDs as anonymous/member and confirm denial without a resource write                       |
| CSRF/origin checks                    | PASS        | Auth rejects foreign origin with 403; Next.js rejects foreign-origin actions before mutation                                 |
| Identity and ownership                | PASS        | Anonymous redirects, member-scoped reads, other-owner 404, disabled-account access denied, signup closed                     |
| Escaped text                          | PASS        | Browser displays a stored script-shaped purpose as text; no injected global is created                                       |
| Browser persistence and booking flows | PASS        | Create/edit resource, create booking, refresh, conflict, adjacent booking, reschedule, cancel, rebook freed slot             |
| Mobile layout                         | PASS        | 390 × 844 navigation and resource view; no horizontal document overflow                                                      |
| Production build                      | PASS        | next build compiled, checked TypeScript and generated all routes                                                             |
| Runtime dependency audit              | PASS        | npm audit --omit=dev reports zero vulnerabilities                                                                            |
| Full dependency audit                 | KNOWN LIMIT | Five high findings remain in the Next ESLint toolchain, detailed below                                                       |
| Git secret exclusion                  | PASS        | git check-ignore confirms .env and local PostgreSQL files are ignored                                                        |

## Audit decisions

The initial audit found transitive `deepmerge-ts` and `mysql2` issues in Prisma's tooling/peer dependency graph. Pinned overrides to **deepmerge-ts 8.0.2** and **mysql2 3.24.5** remove those findings; migrations, seed, generated client, tests, and builds were checked with the overrides. The app uses PostgreSQL, not a MySQL connector.

The remaining five high audit entries are the dependency chain **eslint-config-next → @next/eslint-plugin-next → fast-glob → micromatch → braces 3.0.3**, for stack exhaustion on deeply nested glob patterns. The registry's latest braces version was still 3.0.3 during verification; the suggested automatic fix downgrades Next's lint configuration to 14.2.35. This toolchain takes repository-owned patterns, not booking input, and is excluded from the clean runtime audit. It is still a known development dependency issue; no incompatible downgrade or fabricated clean full audit was performed.

The ESLint 9 release also emits an upstream support-status warning during installation. Lint passes with the Next-compatible version; review the framework-supported ESLint upgrade path when updating dependencies.

## Corrections found during verification

- Windows `pg_ctl` descendants retained inherited output pipes. The local helper now uses ignored stdio and a dedicated PostgreSQL log file, and setup completed.
- The seed initially failed because top-level await was compiled as CommonJS. The root package explicitly uses ESM; seed now runs and reruns correctly.
- Login controls and resource/reservation fieldsets are disabled until hydrated. A cold page test caught a date edit being reset before React attached its handler; the shared readiness guard prevents this race. Availability checks also disable editing while pending, preventing stale feedback for changed inputs.
- Browser assertions now scope duplicate search and alert controls correctly, including Next's live route announcer. The final full suite passes.
- A failed test's automatic accessibility snapshot captured a local password input. Those generated artifacts were removed, both local demo passwords were rotated, sessions revoked, and the login helper now clears the password before failure reporting. No credentials are committed; use the current private .env values.

## Verification limits

The in-app browser had no available connection; local browser verification used the project's standalone Playwright suite and installed Chrome. Desktop and mobile screenshots, plus conflict/ER frames from the recording, were inspected. npm run check:secrets found no configured private values in Git-visible source or production browser files. Prettier check passed. This does not establish production HTTPS behavior, a production database setup, external deployment reliability, distributed throttling, formal security certification, or full assistive-technology coverage.

The integration suite replaces the request-session guard with test actors to isolate business/data permissions, while keeping the database and transactions real. The browser suite separately verifies real Better Auth sessions and direct Server Action guards.

The original specification files remain unchanged. No GitHub repository, external share link, or assessment submission has been published. An actual 4:11 captioned screen recording was created locally, measured with FFmpeg (1360 × 900, 25 fps, approximately 22 MB). It has no audio narration and no credential entry. The file is artifacts/reserveflow-demo.webm; no upload was performed. Next.js Server Function argument logging is disabled so private booking payloads are not printed by development request logs.
