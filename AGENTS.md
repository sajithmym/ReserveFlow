# ReserveFlow working notes

Read README.md and the numbered files in ReserveFlow-Prompts before changes. Preserve the original assessment specifications.

All database access stays server-side. Each service must authenticate its actor, and admin operations must check role. Members' reservation queries must include ownership. Never accept userId or role from a booking form.

Use committed migrations; never db push. Preserve the hand-written PostgreSQL CHECK and exclusion constraints. Booking/resource-state writes share the resource FOR UPDATE protocol. Preserve reservation history.

Run lint, typecheck, unit tests, isolated PostgreSQL integration tests and build for substantial changes. Record actual outcomes in docs/VERIFICATION.md. Browser tests use only local demonstration data. Never commit .env, local DB data, credentials or tokens.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
