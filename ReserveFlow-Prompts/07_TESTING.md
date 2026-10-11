# 07 — Test plan, security checks and verification report

## Test strategy

Use unit tests for pure date/validation/permission helpers, **real PostgreSQL integration tests** for database constraints and concurrency, and a small number of E2E/manual flows for UI behavior. Isolate test databases; never wipe a production or personal database.

## Essential booking tests

| Test | Expected |
|---|---|
| Start equals end | Validation rejects |
| End before start | Validation rejects |
| New booking in the past | Rejected by server |
| Same resource, overlapping confirmed booking | Rejected by DB |
| Same resource, exactly adjacent times | Both succeed |
| Different resources, same time | Both succeed |
| Same time after cancellation | New confirmed booking succeeds |
| Edit creates an overlap | Edit rejected, old valid record preserved |
| Two concurrent conflicting creates | Exactly one commits; other gets conflict |
| Cross-midnight times | Interpreted and stored correctly |
| Inactive resource | Booking rejected |
| Booking/deactivation race | Consistent result based on resource locking protocol |

**Concurrency test design:** Use independent transactions/connections and simultaneous writes. Assert exactly one successful confirmed booking and one conflict, then query database to verify only one confirmed overlapping record exists. Repeat runs to catch timing-sensitive mistakes. Sequential mock tests alone do not prove race safety.

## Security tests

| Test | Expected |
|---|---|
| Anonymous GET protected page | Redirect/deny without sensitive data |
| Anonymous invokes server action | Server denies |
| MEMBER tries resource creation | Server denies |
| MEMBER changes booking ID to someone else's | No private data disclosed, no mutation |
| MEMBER submits `role=ADMIN` | Ignored/rejected; no escalation |
| MEMBER submits someone else's `userId` | Booking still derives owner from session |
| Invalid UUID/ID and huge strings | Safe validation/error response |
| HTML/script in booking title | Displayed as escaped text |
| Untrusted sort/filter fields | Rejected or allowlisted |
| Invalid session/disabled account | Protected operations denied |
| Known CSRF-sensitive mutation path | Framework protections enforced |
| Git repository scan | No `.env`, credentials or tokens committed |

Never test by attempting to attack third-party systems; these checks are for the local project.

## Quality gates

- [ ] TypeScript compiler succeeds.
- [ ] ESLint succeeds.
- [ ] Build succeeds.
- [ ] DB migration works on a fresh PostgreSQL database.
- [ ] Seed succeeds and respects overlap constraint.
- [ ] Unit tests run with meaningful assertions.
- [ ] PostgreSQL booking tests run against a real test database.
- [ ] Unauthorized paths are checked server-side.
- [ ] Main UX flow works after page refresh.
- [ ] README commands are actually verified.

## Final verification report template

```text
Verification date/time:
Environment / Node version:
PostgreSQL version:

Check                         Result          Evidence / notes
Install dependencies          PASS/FAIL/NOT RUN
Apply migrations              PASS/FAIL/NOT RUN
Seed database                 PASS/FAIL/NOT RUN
Lint                          PASS/FAIL/NOT RUN
Typecheck                     PASS/FAIL/NOT RUN
Unit tests                    PASS/FAIL/NOT RUN
Database integration tests    PASS/FAIL/NOT RUN
Concurrent booking test       PASS/FAIL/NOT RUN
Build                         PASS/FAIL/NOT RUN
Manual demo flow              PASS/FAIL/NOT RUN
Security permission tests     PASS/FAIL/NOT RUN

Known limitations:
Outstanding tasks before submission:
```

Never substitute a checklist for actual execution. Report genuine failures, including missing infrastructure.
