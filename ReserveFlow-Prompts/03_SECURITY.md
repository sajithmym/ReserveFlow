# 03 — Security-first engineering standard (P0)

**Security is a high-priority project design goal requested by the applicant.** The company brief itself does not specify an authentication implementation. Engineer robust controls without pretending this short assessment is an audited enterprise product.

## Threat model

Protect against: anonymous access to private resource/booking data; users editing another user's bookings (IDOR/BOLA); role escalation; password guessing; CSRF on mutating endpoints; XSS; injection; malformed identifiers; enumeration through errors; secrets in source/logs; denial-of-service through oversized inputs; double-booking race conditions; and sensitive information disclosed in screenshots.

## Identity and sessions

- Use a maintained authentication library compatible with the installed Next.js release (prefer Auth.js if supported).
- For a credential demo: **argon2id** password hashing with secure parameters; never store/log plaintext passwords.
- No public signup in MVP. Use seed/admin provisioning from environment variables, not hardcoded shared passwords. Do not print seeded passwords in logs.
- `ADMIN` and `MEMBER` roles are server-verified from trusted session/database information. Reject disabled users.
- Configure secure, `HttpOnly`, `SameSite` session cookies; `Secure` under HTTPS. Session secrets must be strong and loaded from environment.
- Prefer well-supported session rotation and expiration. Do not create a custom unsigned JWT or home-grown session cookie.
- Prevent abuse of login: appropriate throttling and generic failure messages. If implementing in-process throttling only, label it **local demonstration only**; production requires a shared/persistent store or equivalent managed protection.
- Do not build password reset without a genuine secure delivery and token flow. Document it as absent.

## Mandatory access-control matrix

| Action | Anonymous | MEMBER | ADMIN |
|---|---|---|---|
| Login | Allowed | Allowed | Allowed |
| Read protected resource directory | Deny | Active resources | All resources |
| Create/edit/deactivate resource | Deny | Deny | Allow |
| View reservation | Deny | Own reservations only | All reservations |
| Create reservation | Deny | As authenticated self | As authenticated self |
| Edit/cancel reservation | Deny | Own only | Any (with business rules) |
| View dashboard | Deny | Own-safe aggregates only, or deny | Organization-wide |

**Enforce every matrix rule server-side** in services/actions/routes. A hidden button is not authorization. For booking ownership, include owner scope in the database lookup or check access before any mutation. Never trust a submitted `userId` or `role`.

## Secure boundaries

1. Parse and validate **all** inputs with Zod: path params, search params, form data and JSON bodies; reject unexpected types and unreasonable lengths.
2. Use ORM parameterization or parameterized SQL. For transactions/locking, use a **parameterized** `$queryRaw`/equivalent. Never concatenate user-provided SQL.
3. Do not render user-controlled HTML (`dangerouslySetInnerHTML`) or use unsafe DOM injection. Treat titles, descriptions and names as text.
4. Use the auth library's documented anti-CSRF controls for cookie-authenticated requests. For custom mutation endpoints, enforce supported CSRF/origin protections. Never disable protections just to make tests pass.
5. Check authentication and authorization **inside** each server mutation, even if middleware/layout already checks access.
6. Apply least-privilege PostgreSQL credentials for app runtime; administrative migration credentials may be separate if practical.
7. Keep `DATABASE_URL`, auth secrets and passwords out of source, browser bundles, error responses, screenshots and Git. Commit only `.env.example` with dummy placeholders. Confirm `.env*` is ignored appropriately without ignoring `.env.example`.
8. On production deployment (optional), require HTTPS; set a baseline Content Security Policy and security headers appropriate to the actual app (avoid breaking Next.js assets). Document what has/has not been verified.
9. Sanitize logs: no raw tokens, cookies, connection strings, passwords or full private reservation records. Server-side trace IDs and safe errors are useful.
10. Page sizes must be bounded; validate sorting/filters against allowlists. Avoid unconstrained bulk queries.
11. Server guards must cover any newly added API routes, exports or admin-only summaries.

## High-risk booking race (security + integrity)

- Store authoritative booking status in PostgreSQL.
- Enforce conflicts using a **database-level exclusion constraint**, not only a preflight query.
- Creation and updates must recheck resource state server-side. Lock the resource row (or use equivalent serialized state transition) to close the race between booking and deactivation.
- Catch exclusion violation (`23P01`, or ORM-wrapped equivalent) and return a safe conflict error, never a 500 with SQL detail.
- Never bypass constraint in seed/import/test code.

## Security testing checklist

- [ ] Anonymous users cannot read pages or mutate resources/bookings.
- [ ] MEMBER cannot create/edit/deactivate resources, including calling actions directly.
- [ ] MEMBER cannot read or modify another member's booking via ID substitution.
- [ ] Forged `userId` and `role` input do not change authority.
- [ ] Invalid/oversized input produces safe errors.
- [ ] XSS payload is shown as text, not executed.
- [ ] Mutating routes honor framework CSRF/origin strategy.
- [ ] Cookies/session are configured per the authentication framework.
- [ ] Secrets are absent from repository, logs and demos.
- [ ] Concurrent overlap requests cannot both commit.
- [ ] README includes a realistic **security limitations** section.

## Explicit non-goals for this short assessment

Do not claim SOC 2 compliance, penetration-testing certification, production readiness or total immunity from attacks. If there is no real email identity verification, password recovery, distributed rate limiting or operational monitoring, state that clearly.
