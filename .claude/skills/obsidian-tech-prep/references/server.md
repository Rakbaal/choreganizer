# Server tech prep checklist (server/)

Nitro server routes inside the Nuxt app, Drizzle on Postgres, Better Auth, Zod. Ground every section in the root `CLAUDE.md`, [[Stack]], [[API]], [[Data model]] and [[Implementation details]]. Substrates to check before designing anything new, and what each one gives for free:

## Existing substrates to reuse

- **Routes**: one file per route under `server/api/`, named after the method (`server/api/apartments/[id]/logs.post.ts`), mapping 1:1 to the table in [[API]]. A handler reads input, calls the helpers, and returns JSON; keep rules in `server/utils/` (auto-imported) when two handlers share them. Once [[M1 Apartments, rooms, members]] is merged, `server/api/apartments/` is the reference shape: name the file it mirrors.
- **Auth and authorization**: `requireUser(event)` (Better Auth session, 401 otherwise) and `requireMembership(event, apartmentId)` built on it, at the top of every handler ([[API#Authorization, in one helper]]). For a route keyed by a room, task or log id, load the row first and check membership on its `apartment_id`. An `apartmentId` from the client trusted without that check, or a `done_by` taken from the request, is a spec bug ([[Log only for yourself]]). Owner-only actions follow [[Implementation details#Permissions]].
- **Rules the database can't enforce** ([[Data model#Rules the server must enforce]]): same-apartment checks, eligible rooms, archived rows refused for new logs. Each new write path says which of these it enforces and where.
- **Validation**: Zod schemas with `readValidatedBody` / `getValidatedQuery`, shared with the Nuxt UI forms. Limits come from [[Implementation details#Validation]] (names 1–60 trimmed, 409 on a duplicate active name, note ≤ 500, `done_at` ≤ 5 min in the future).
- **Schema and migrations**: the Drizzle schema translates [[Data model#Postgres schema]]; migrations are generated with Drizzle Kit, committed, and run in the deploy step ([[Implementation details#Ops]]). Never edit an applied migration. Spell out `NOT NULL`, partial uniques (`where archived_at is null`), FKs and their `ON DELETE`. Better Auth's own tables come from its CLI, not by hand.
- **Transactions**: multi-row writes (a log + its `log_rooms`, an invite accept + membership, the last-owner rule on leave) happen in one `db.transaction`.
- **Archiving, never deleting**: tasks, rooms and apartments get `archived_at`; history must never break ([[Archive, never delete]]). Logs are the one thing that can be deleted ([[Anyone can edit any log]]).
- **Time**: timestamps in UTC, "today" and day grouping in the apartment's timezone ([[Apartment timezone]]).
- **Config**: env vars in `runtimeConfig` (`nuxt.config.ts`), every new one also in `.env.example`. Local Postgres runs in Docker ([[Local Postgres in Docker]]).
- **Decisions already taken**: read `Decisions/` for the area the milestone touches before designing around it ([[Framework - Nuxt]], [[Tasks per apartment]], [[All-rooms flag]], [[Rooms when logging]], [[Rolling schedule]], [[Long sessions]], …).

## Section checklist for the document

1. **Data model**: new tables and columns as Drizzle schema, per-field bullets (type, constraint, role, the section that uses it). One line on each rejected alternative when the choice isn't obvious. Say where it departs from [[Data model#Postgres schema]], if anywhere.
2. **API**: each route actually needed (challenge each one), its file path, request and response JSON, the authorization it runs, and error mapping to status codes (400 validation, 401, 403 not a member or not owner, 404, 409 duplicate name).
3. **Mechanism sections**: one per moving part (log creation, feed cursor, invite accept…), how it plugs into the named helpers, what is free and what is new, and which server-enforced rules it checks.
4. **Validations and limits**: values with rationale, from [[Implementation details#Validation]]; mark arbitrary ones and what would remove them.
5. **Tests**: unit tests on the rules that pay off ([[Roadmap#Testing that pays off here]]: log-creation rules, `requireMembership`), one case per rule of [[Data model#Rules the server must enforce]] the slice touches. Skip tests for plain CRUD.
6. **PR stack**: each PR mergeable alone, with its branch name; tests inside each slice.
