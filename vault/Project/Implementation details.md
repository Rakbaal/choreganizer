---
tags:
  - project
  - tech
---

# Implementation details

These defaults fill the gaps between the [[Data model|schema]] and the code. Each one can change; none should be decided mid-commit.

## Pages

Nuxt `pages/`:

| Route | Screen |
| --- | --- |
| `/login`, `/signup` | Auth |
| `/` | Redirects to the last-used apartment (cookie `last_apartment`), or to `/onboarding` if you have none |
| `/onboarding` | Create an apartment or enter an invite code |
| `/join/[code]` | Accept an invite; signed-out visitors go through sign-up, then return here |
| `/a/[apartmentId]` | Home: log a chore |
| `/a/[apartmentId]/feed` | Feed |
| `/a/[apartmentId]/tasks`, `/tasks/new`, `/tasks/[taskId]` | Task list and form |
| `/a/[apartmentId]/settings` | Apartment, rooms, members, invites |

A client route middleware sends signed-out users to `/login?redirect=…`. The real access check stays on the server.

## Permissions

| Action | Owner | Member |
| --- | --- | --- |
| Rename apartment, change timezone | Yes | Yes |
| Archive / unarchive apartment | Yes | No |
| Create invites, remove members | Yes | No |
| Rooms, tasks, logs: create, edit, archive, delete (anyone's logs, see [[Anyone can edit any log]]) | Yes | Yes |
| Leave apartment | Yes | Yes |

If the last owner leaves while someone remains, that person is promoted to owner in the same transaction. If nobody remains, the apartment is archived.

## Auth

- Sessions last 90 days, refreshed when used ([[Long sessions]])
- Better Auth with the Drizzle adapter; its CLI generates `user`, `session`, `account`, `verification` into your schema
- `requireUser(event)` in `server/utils/` calls `auth.api.getSession({ headers: event.headers })` and throws 401; `requireMembership` builds on it
- No password reset in the MVP: a small `scripts/reset-password.ts` covers two users. Add Resend and Better Auth's reset flow later if needed

## Invites

- Code: `nanoid(12)`, shared as a `/join/<code>` link; 12 random characters make guessing impractical, so no rate limiting needed
- Valid for 7 days, single use: setting `used_at`/`used_by` and inserting the membership happen in one transaction
- Already a member → redirect to the apartment; expired or used → clear error page

## Validation

Zod on the server; the same schemas in Nuxt UI forms.

- Names trimmed, 1–60 characters; a duplicate active name returns 409 with "A room called *Cuisine* already exists"
- Frequency interval 1–365; note ≤ 500 characters
- `done_at` no more than 5 minutes in the future (clock skew); no lower limit

## Archiving

See [[Archive, never delete]].

- Apartments, rooms and tasks can be archived and unarchived
- Archiving a room removes it from new logs and from "all rooms"; its `task_rooms` rows stay, so unarchiving restores the setup
- Archived items still appear in the feed and its filters, greyed out

## Quick log

Optimistic: the button shows done at once, the request runs in the background, a failure shows **Retry** ([[Optimistic logging]]).

## Feed

- 50 logs per page; cursor = `done_at` + `id` of the last row (see [[Data model#Feed query]])
- Person filter: the people who appear in the apartment's logs, so a removed member's logs stay filterable
- Room filter: logs naming that room, plus whole-flat logs ([[Room filter includes whole-flat logs]])
- Day grouping uses the apartment's timezone via `Intl.DateTimeFormat` ([[Apartment timezone]])
- Refetch when the tab regains focus; no realtime

## Ops

- Local dev: Postgres in Docker ([[Local Postgres in Docker]]); seed script from M1, extended each milestone
- Drizzle Kit migrations committed to the repo, run in the deploy step
- CI (GitHub Actions): lint, typecheck and tests on every PR
- Confirm point-in-time restore is enabled on the Neon or Supabase project
