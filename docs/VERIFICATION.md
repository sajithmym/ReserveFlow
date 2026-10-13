# Verification report

## Complete project guide — 13 October 2026, Asia/Colombo

Added [PROJECT_GUIDE.md](PROJECT_GUIDE.md) from a study of baseline commit `0c92799`: authored application/services/components, configuration, package manifests/lockfile, schema, all five migrations, scripts, tests, and existing documentation. The guide has 27 numbered sections, a field-level eight-model dictionary, operations/settings/security references, and an individual index for all 134 tracked baseline files. README links to it. It describes current code separately from dated evidence and outdated recording captions; it does not reproduce private environment values or database records. The referenced original prompt folder remains absent.

- Source coverage: PASS; all 134 tracked baseline files are indexed, all 147 checked named export declarations are mentioned, all 77 scalar/relation model fields are documented in their model sections, and all 21 package scripts are listed.
- Link/structure validation: PASS; all 140 local file links resolve, all 27 contents anchors match headings, and fenced blocks are balanced.
- Formatting: PASS; Prettier check on PROJECT_GUIDE.md and README.md.
- Private configuration scan: PASS; `npm run check:secrets` scanned 160 Git-visible source and production browser files without configured private values.
- Patch whitespace: PASS; `git diff --check` on tracked documentation changes.
- Application lint, typecheck, unit/integration/browser suites, and build: NOT RERUN for this documentation-only task. Their earlier actual results retain their original entries below. No runtime code, migrations, environment settings, or application data were changed by this study.

## Separate PostgreSQL environment fields — 13 October 2026, Asia/Colombo

Replaced database URL environment variables throughout the runtime, Prisma CLI, seed/admin/recording/setup/grant helpers, browser fixture tooling, and integration tests with a shared server-side connection builder. The private `.env` database section contains exactly the requested `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, and `DB_DATABASE` fields. Existing authentication settings were retained. Optional `MIGRATION_DB_*` fields support a separate maintenance identity, and preserved `TEST_DB_*` credentials are in the ignored `.env.test.local`. No private values were added to Git-visible files. `.env.example`, README.md, SETUP_AND_RUN.txt, and the security review describe the new configuration.

The user-requested postgres account is permitted only in development with a local database and local application origin. This identity has full database privileges; production startup retains the original privilege checks and rejects it. Session/role/ownership guards, resource locks, reservation history, and all SQL migrations remain unchanged. Test setup checks actual role privileges before fixtures run. Fresh isolated-cluster setup now provisions a separate non-elevated test owner. Seed/admin/maintenance helpers reject a leftover `DB_TARGET=test` selector rather than writing to the main database.

- `npm run lint`: PASS, exit 0.
- `npm run typecheck`: PASS, exit 0. An initial test-helper parameter inference error was corrected with an explicit environment type before final verification.
- `npm run test`: PASS, 40 tests in six files, including reserved-character encoding, invalid fields/TLS, test isolation, and development/production permission boundaries.
- `npm run test:db`: PASS, all 31 tests in three files using `.env.test.local`. Provisioned the previously missing `reserveflow_test` database with its existing non-elevated test owner and applied all five committed migrations; application data was not used for test fixtures.
- `npm run build`: PASS, final exit 0; compilation, TypeScript and route generation completed.
- `npm run dev -- --port 3101`: PASS; generation/startup completed with the requested five fields and `/login` returned HTTP 200 with the ReserveFlow login content. Stopped the verification server afterward.
- `npm run start -- --port 3102`: EXPECTED REJECTION; production instrumentation refused the postgres account's excessive permissions. Stopped the verification server afterward. Production deployment requires a restricted runtime identity.
- Fresh-checkout generation smoke check: PASS; Prisma generated the client from a scratch working directory with no `.env` or database variables. This preserves `npm ci`/postinstall before setup.
- `npx prisma migrate status`: PASS for the application and, with `DB_TARGET=test`, the test database; both report all five migrations applied. `npm run db:grant`: PASS; local postgres mode skipped permission changes as intended.
- Data preservation: PASS; application user/resource/reservation counts remained unchanged; `reservation_valid_range` and `reservation_no_overlap_confirmed` remain installed. No application schema migrations, seeding, password resets, or role grants were applied during verification.
- `npm run check:secrets`: PASS; configured app/test secrets were absent from 159 Git-visible source and production browser files. Git ignores `.env`, `.env.test.local`, and local verification files. SQL migrations and the lockfile have no changes.

The referenced ReserveFlow-Prompts folder remains absent. Browser suites were not run against the user's existing service; no browser interaction used application records. Existing-cluster setup/seed/recording paths were updated and checked by lint/typecheck but were not executed against the user's data.

## Incomplete Prisma runtime installation repair — 13 October 2026, Asia/Colombo

Compared the installed `@prisma/client@7.10.0` against the published package file list: 37 of 75 files were absent, including `runtime/query_compiler_fast_bg.postgresql.mjs` and its `wasm-base64.mjs` companion. Prisma CLI, client, and PostgreSQL adapter versions already matched. Ran `npm ci` to restore the locked dependencies; postinstall regenerated the client. All published Prisma package files are now present. Added the exact runtime-module repair to README.md and SETUP_AND_RUN.txt. No application code, package versions, lockfile, migrations, `.env`, or database records were changed. The referenced ReserveFlow-Prompts folder remains absent in this checkout.

- `npm ci`: PASS, exit 0; installed 732 packages and generated Prisma Client 7.10.0. npm reported five high dependency audit findings; no automatic dependency upgrades were applied.
- Runtime smoke check: PASS; both previously missing modules import successfully and the PostgreSQL compiler WebAssembly compiles.
- `npm run dev -- --port 3101`: PASS; predev generation completed, instrumentation loaded without the missing-module error, and `/login` returned HTTP 200 with the ReserveFlow login content. Stopped the verification server afterward.
- `npm run lint`: PASS, exit 0.
- `npm run typecheck`: PASS, exit 0.
- `npm run test`: PASS, 32 tests in four files.
- `npm run build`: PASS, exit 0; compilation, TypeScript and route generation completed.
- `npm run test:db`: FAILED, exit 1; the configured local PostgreSQL server reports that `reserveflow_test` does not exist (two failed tests, 29 skipped). The application database is reachable. No test queries were redirected to the application database and no databases were provisioned or reset.

## Missing Prisma client repair — 12 October 2026, Asia/Colombo

Confirmed `src/generated/prisma/client.ts` was absent. Added `predev: prisma generate` so `npm run dev` recreates the ignored client before Next.js loads instrumentation. Existing build/postinstall generation and database configuration remain unchanged; no migrations, seeding, or application data changes were performed. Added troubleshooting instructions to README.md and SETUP_AND_RUN.txt. The referenced ReserveFlow-Prompts folder is absent in this checkout; no assessment specifications were recreated or changed.

- `npm run db:generate`: PASS; generated Prisma Client 7.10.0 at the configured path.
- `npm run dev`: PASS; automatic predev generation completed, Next.js became ready, and `http://localhost:3000/login` returned HTTP 200 without the missing-module error. The verification server was stopped afterward to free port 3000.
- `npm run lint`: PASS, exit 0.
- `npm run typecheck`: PASS, exit 0.
- `npm run test`: PASS, 32 tests in four files.
- `npm run build`: PASS, exit 0; compilation, TypeScript and route generation completed.
- `npm run test:db`: FAILED, exit 1; the configured PostgreSQL server reports that database `reserveflow_test` does not exist (two failed tests, 29 skipped). Provision/migrate the dedicated test database before rerunning; tests were not redirected to the application database.

## Full security review and repairs — 12 October 2026, Asia/Colombo

Final file checks passed: Prettier on changed TypeScript/scripts/docs; git diff --check; SVG XML parsing; unchanged original prompts and previous migrations; private files excluded by Git; development listener verified on 127.0.0.1:3000.

Findings, file inventory and remaining boundaries: [SECURITY_REVIEW.md](SECURITY_REVIEW.md). This entry supersedes older statements about memory-only throttling, six-table diagrams, isolated-only grants and the inactive root CSP file. Original assessment specifications and existing migration files were preserved.

| Check                        | Actual result | Evidence                                                                                                                                   |
| ---------------------------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Application migration        | PASS          | All five committed migrations applied to existing reserveflow on localhost:5432; no db push                                                |
| Test migration               | PASS          | Dedicated reserveflow_test_owner owns the verified-empty reserveflow_test; both new migrations applied                                     |
| Isolated demo setup          | PASS          | Migrations/grants/seed applied on verified .local/postgres at 127.0.0.1:54329; existing data preserved                                     |
| Runtime privileges           | PASS          | reserveflow_app: schema CREATE false; reservation DELETE false; audit SELECT/UPDATE/DELETE false; audit INSERT true                        |
| ESLint                       | PASS          | Final npm run lint, exit 0                                                                                                                 |
| TypeScript                   | PASS          | Final npm run typecheck, exit 0                                                                                                            |
| Unit tests                   | PASS          | Final npm run test: 32 tests in four files                                                                                                 |
| PostgreSQL integration tests | PASS          | Final npm run test:db: 31 tests in three files                                                                                             |
| Production build             | PASS          | Compiled, typechecked, generated routes, recognized Proxy (Middleware); pages dynamically rendered                                         |
| Production browser suite     | PASS          | All three tests passed in 2.0 minutes on isolated demonstration data, installed Edge, localhost:3100; console/page-error assertions passed |
| PostgreSQL 18 app login      | PASS          | After restarting stale dev process: private admin sign-in HTTP 200; dashboard HTTP 200; verification session signed out                    |
| Secret scan                  | PASS          | npm run check:secrets: 167 Git-visible source/production browser files; extracted DB passwords/action/bootstrap secrets included           |
| Runtime dependency audit     | PASS          | npm audit --omit=dev: zero vulnerabilities                                                                                                 |
| Full dependency audit        | KNOWN LIMIT   | Five high lint-toolchain entries through braces <=3.0.3; npm latest remains 3.0.3; suggested fix downgrades Next lint config to 14.2.35    |

The rate-limit test sends eight concurrent invalid logins through two auth instances and independent Prisma connections: five receive 401, three receive 429. Forged forwarded IPs and a new auth instance do not reset the persisted bucket. A separate test pauses password verification, commits a credential reset/cutoff, resumes the old login, and verifies 401 with no new session. Fixture cleanup left zero users in the test database.

Browser coverage retains direct action authorization, foreign-origin rejection, signup closure, oversized input, escaped XSS-shaped text, ownership, booking conflicts, member management/session revocation, calendar/dialog controls and mobile assertions. The login helper verifies the actual production response CSP and matching script nonce. Browser tests never used the existing PostgreSQL 18 application database.

Intermediate failures were repaired without suppressing assertions: insert-only audit permissions required a parameterized INSERT without Prisma RETURNING; scroll-lock style tags required a nonce bridge; React streaming required a hash allowlist for the exact display:none style attribute; the credential-reset test caught a misplaced request-context timestamp and verified its correction. The old development process was restarted with the updated client/configuration and loopback binding.

Exposed isolated-cluster owner/app passwords were rotated and saved only in the ignored local verification environment. The shared PostgreSQL 18 postgres administrator password was not altered because other user databases/applications can depend on it; rotate it privately. Bootstrap credentials were removed from the app environment and retained in an ignored handoff for the user. No credentials, DB files, tokens or browser artifacts were committed or published.

This does not verify externally deployed HTTPS/certificate/proxy behavior, monitoring, backup restoration, MFA or an independent penetration test. Hosted runtime environments must omit migration/test/bootstrap credentials.

## Fixed documented demo logins — 12 October 2026, Asia/Colombo

At the user's explicit request, the existing local administrator/member login values are now intentionally public in `README.md` and `SETUP_AND_RUN.txt`. Their shared definition is `scripts/demo-accounts.mjs`. Seed account email/password entries were removed from the actual ignored `.env`, the example environment file, and automatic environment generation. Private PostgreSQL passwords, database URLs, and the authentication secret remain in `.env`. Earlier credential-handling notes below describe the previous configuration.

The seed, browser tests, auth check, and recording helper read the same fixed definition. The demo-account getter refuses production mode or a remote runtime/migration database host. Normal seeding retains existing account hashes. The former environment-writing rotation helper was replaced by `scripts/reset-demo-passwords.ts`, exposed as `npm run db:demo-passwords`; it explicitly restores the documented passwords and revokes only the two demo accounts' sessions. No reset was applied to the existing demonstration accounts during this change.

| Check                              | Result | Evidence                                                                                                                                                                                           |
| ---------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Existing seed repeatability        | PASS   | `npx tsx scripts/verify-seed.ts` preserved row counts and stored password hashes without seed environment entries                                                                                  |
| Fresh database migrations and seed | PASS   | Both committed migrations applied to a newly created isolated local test database; fixed seed created two users, six resources, and three reservations; repeat seed retained counts and hashes     |
| Explicit demo-password reset       | PASS   | On that isolated database only, restored both documented passwords from invalid test hashes, revoked both test sessions, and retained user/resource/reservation counts; database removed afterward |
| ESLint                             | PASS   | `npm run lint`                                                                                                                                                                                     |
| TypeScript                         | PASS   | `npm run typecheck`                                                                                                                                                                                |
| Unit tests                         | PASS   | 24 tests across three files, including documented login consistency and remote/production refusal                                                                                                  |
| PostgreSQL integration tests       | PASS   | 27 tests against the configured isolated `_test` database                                                                                                                                          |
| Production build                   | PASS   | `npm run build`                                                                                                                                                                                    |
| Browser suite                      | PASS   | Three tests passed in 1.6 minutes using Edge against the production build at localhost:3100, with no seed account environment entries                                                              |
| Development auth check             | PASS   | Updated auth helper signed in at localhost:3000, retrieved its session and dashboard (all HTTP 200), then signed out its verification session                                                      |
| Private-secret and browser scan    | PASS   | 150 Git-visible source/production browser files; published demo passwords are permitted in docs/scripts but are also checked for accidental inclusion in production app bundles                    |
| Formatting / guide commands        | PASS   | Prettier check passed; all setup-guide npm commands match package.json                                                                                                                             |

The first ad hoc fresh-database harness failed because it invoked Prisma directly without npm's `node_modules/.bin` PATH, so the seed CLI could not find tsx. The temporary database was removed; the corrected harness supplied the npm-style PATH and the complete migrations/seed/reset checks passed. This did not require a project startup change.

Original assessment prompt files and SQL migrations remain unchanged. Published demonstration credentials are unsuitable for hosted/private deployments; those environments must provision separate accounts. The actual local account passwords and stored hashes were preserved, and the live development server remains at localhost:3000.

## Member actions, logout confirmation, and calendar — 12 October 2026, Asia/Colombo

| Check                                 | Result | Evidence                                                                                                           |
| ------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------ |
| ESLint                                | PASS   | `npm run lint`, including the final component and test changes                                                     |
| TypeScript                            | PASS   | `npm run typecheck`                                                                                                |
| Unit tests                            | PASS   | `npm run test`: 19 tests across two files                                                                          |
| Isolated PostgreSQL integration tests | PASS   | `npm run test:db`: 27 tests across two files, using the configured `_test` database                                |
| Production build                      | PASS   | Final `npm run build` compiled, checked TypeScript, and generated all routes                                       |
| Browser suite                         | PASS   | All three tests passed in 1.8 minutes using installed Edge against the production build at `http://localhost:3100` |
| Formatting                            | PASS   | Prettier check on all changed components, settings, and browser tests                                              |
| Private configuration scan            | PASS   | `npm run check:secrets`: 148 Git-visible source and production browser files                                       |
| Patch whitespace                      | PASS   | `git diff --check`                                                                                                 |

The member browser scenario verifies View/Edit/Delete icons, cancel without saving, successful edits returning to `/members`, delete cancellation, logical deletion with session revocation and reservation retention, and reactivation. The existing last-administrator protections remain server-side and are covered by the database suite. Creating a member continues to open its profile.

Calendar checks cover month/year selectors, selecting 29 February in a leap year, changing to a non-leap year, Today in Asia/Colombo, preserving the time portion of datetime fields, keyboard navigation, and date-filter clearing. Desktop screenshots and the 390 x 844 mobile calendar screenshot were visually inspected. Browser assertions confirm the popup fits inside the mobile viewport. Date bounds constrain navigation, month/year choices, day selection, and the Today shortcut.

Logout checks verify desktop cancellation preserves the session, cancellation from the nested mobile navigation dialog returns to navigation, confirmation redirects to login, and subsequent protected access is denied. Pending requests prevent repeated submissions or dismissal.

Intermediate development-server runs had a first-login navigation timeout and an expected HTTP 429 console message from the login helper's successful retry. The first timeout did not reproduce in the next development run; both configured seed passwords were checked against stored hashes and matched. The test now excludes only the handled sign-in 429 console message, while retaining checks for other console errors and requiring a successful login response after the validated retry interval. The final complete suite passed against the production build after the final calendar changes.

The secret scan found local account passwords in `SETUP_AND_RUN.txt`; they were replaced with references to `.env`, without modifying the actual credentials. The browser login helper now clears passwords before response/navigation assertions so failure snapshots do not capture them. Subsequent browser runs replaced the earlier generated failure artifacts. No environment file, local database, credentials, or tokens were added to Git.

README documents the resulting flows. The development server was restarted at `http://localhost:3000`. These checks cover the local demonstration environment; production HTTPS and external hosting were not tested. No migrations or service authorization changes were required.

## New-PC setup guide — 12 October 2026, Asia/Colombo

- Added root-level `SETUP_AND_RUN.txt` with Windows prerequisites, fresh installation, private environment setup, daily startup/shutdown, checks, browser tests, local build preview, updates, troubleshooting, and existing-server configuration.
- Checked instructions against the repository scripts, environment template, Prisma configuration, Playwright configuration, and installed Next.js CLI guide. All 16 referenced npm script names exist in package.json. Official Node.js, PostgreSQL, and Git download pages were checked.
- `npm run check:secrets` passed across 146 Git-visible source and production browser files, including the new guide. `git diff --check` passed for tracked changes.
- This is a documentation-only change. No fresh installation on another PC was performed, and lint, typecheck, unit tests, database integration tests, build, and browser tests were not rerun for this guide.

## Local database recovery — 12 October 2026, Asia/Colombo

- Reproduced the infrastructure condition behind the reported Prisma `P1001`: no listener on `127.0.0.1:54329`, with an existing local PostgreSQL data directory.
- `npm run db:local` passed and restarted the existing isolated cluster. A query using the runtime `DATABASE_URL` passed: two users, six resources, three reservations. Both `reservation_valid_range` and `reservation_no_overlap_confirmed` remain installed.
- `npm run dev` started at `http://localhost:3000`. HTTP checks passed for the login page (200), seeded member sign-in (200), authenticated dashboard (200), and verification-session sign-out (200). Credentials and session cookies were not printed.
- Only documentation changed; no migrations, reseeding, or application changes were needed. Lint, typecheck, unit tests, integration tests, build, and browser tests were not rerun for this recovery. Prior results below retain their original verification date.

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
