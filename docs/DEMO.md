# Recording plan · 4 minutes 30 seconds

Use the real local application. Keep `.env`, terminal connection strings, passwords, browser password menus, and tokens out of the recording. Provision and sign in to the two accounts before recording; switch between separate browser profiles or private windows.

| Time      | Demonstration and explanation                                                                                                                                                             |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0:00–0:30 | Explain the informal booking problem. Show the real dashboard and resources. Introduce ReserveFlow as a focused shared-resource reservation tool.                                         |
| 0:30–1:05 | Mention Next.js App Router, TypeScript, PostgreSQL and Prisma. Show the source structure. Explain that admin/member authentication is an added engineering decision.                      |
| 1:05–1:45 | As administrator, add a meeting room and edit its capacity/location. As member, search for it. Explain active/inactive resources and scoped permissions.                                  |
| 1:45–2:40 | As member, create tomorrow's 09:00–10:00 reservation. Create a 09:30–10:30 attempt and show the safe conflict error. Show that 10:00–11:00 is allowed. Refresh to prove persistence.      |
| 2:40–3:20 | Cancel the first booking through confirmation. Reserve that time again. Show a status/resource/date filter and explain that members only see their own reservations.                      |
| 3:20–4:05 | Show docs/ERD.md or docs/erd.svg. Explain UTC instants, Sri Lanka display, half-open intervals, the PostgreSQL exclusion constraint and resource row locking. Show recorded test results. |
| 4:05–4:30 | Mention Argon2id, session/origin checks and server authorization. State local rate-limit and account-recovery limits. Explain intentionally deferred features and close.                  |

Before recording, run `npm run setup`, then `npm run dev`. Read the private `.env` outside the capture area. Use the current Sri Lanka calendar day and a future date. The demo seed's bookings may occupy tomorrow's slots; create a new room to avoid unintended conflicts.

An actual **4 minute 11 second** screen recording was created in this workspace at [artifacts/reserveflow-demo.webm](../artifacts/reserveflow-demo.webm). It shows real application/database interactions with captions, includes the actual ER diagram, and has **no audio narration**. Credential entry was excluded. Review it and optionally add your own explanation before uploading. No external upload or share link has been created.

To record again with the app running, install Playwright's FFmpeg via `npx playwright install ffmpeg`, then run `npx tsx scripts/record-demo.ts`. The script uses a locally installed Chrome channel, creates and removes its own demo resource/bookings, and saves screenshots. Generated videos are excluded from Git to keep source history small.
