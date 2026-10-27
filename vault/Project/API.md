---
tags:
  - project
  - tech
---

# API

Written as REST routes for clarity; in Nuxt each one is a file under `server/api/` (e.g. `server/api/apartments/[id]/logs.post.ts`), called from pages with `useFetch` or `$fetch`. All routes require a session.

| Method | Route | Does |
| --- | --- | --- |
| GET | `/apartments` | Apartments I'm a member of (active first) |
| POST | `/apartments` | Create; creator becomes owner |
| PATCH | `/apartments/:id` | Rename, change timezone, archive / unarchive |
| GET | `/apartments/:id/members` | List members |
| POST | `/apartments/:id/invites` | Create a join code (owner only) |
| POST | `/invites/:code/accept` | Join the apartment; marks code used |
| DELETE | `/apartments/:id/members/:userId` | Leave, or remove someone (owner only) |
| GET · POST | `/apartments/:id/rooms` | List, create |
| PATCH | `/rooms/:id` | Rename, reorder, archive |
| GET · POST | `/apartments/:id/tasks` | List (with eligible rooms), create with `roomIds` or `allRooms` |
| PATCH | `/tasks/:id` | Edit name, frequency, rooms, position; archive |
| POST | `/apartments/:id/logs` | Log `{taskId, roomIds?, doneAt?, note?}`; always done by me |
| GET | `/apartments/:id/logs` | Feed; filters `userId`, `taskId`, `roomId`, `from`, `to`; cursor on `done_at` |
| PATCH · DELETE | `/logs/:id` | Fix or remove a mistaken log |

## Authorization, in one helper

Write `requireMembership(event, apartmentId)` once in `server/utils/` (auto-imported) and call it at the top of every handler. For routes keyed by a room, task or log id, load the row first and check membership on its `apartment_id`. Never trust an `apartmentId` from the client without that check.

## Log creation, step by step

1. Check membership
2. Load the task (active, same apartment)
3. Resolve eligible rooms
4. Reject any `roomId` outside them, and an empty `roomIds` for a room-specific task
5. Set `done_by` to the session user ([[Log only for yourself]])
6. Insert `logs` and `log_rooms` in one transaction

## Related

- [[Data model]] · [[Implementation details]]
