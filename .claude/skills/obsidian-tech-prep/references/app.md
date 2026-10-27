# App tech prep checklist (app/)

The client side of the Nuxt app, with Nuxt UI. Ground every section in [[Screens]] and [[Implementation details#Pages]]. Substrates to check before designing anything new, and what each one gives for free:

## Existing substrates to reuse

- **The product rule**: logging a chore takes **two taps on a phone** ([[Home]]). Any screen on the logging path that adds a tap, a required field or a wait is a spec bug; defaults do the work (done by me, done now). Design for a phone first.
- **Pages and routing**: file routing in `app/pages/`, with the routes of [[Implementation details#Pages]] (`/a/[apartmentId]`, `/a/[apartmentId]/feed`, …). Before adding a route, check whether the screen is a new page or a new view of an existing one. A client middleware sends signed-out users to `/login?redirect=…`; the real access check stays on the server.
- **Data fetching**: `useFetch` / `$fetch` against `server/api/` routes. Nitro infers the response types of server routes, so don't hand-write a type that mirrors one; share Zod schemas (and their inferred types) between a form and its route.
- **Components**: Nuxt UI first (forms, drawers / bottom sheets, modals, toasts, chips). Auto-registered from `app/components/`; pages fetch, components take props and emit events. Name the Nuxt UI component or the new file path for each piece.
- **Auto-imports**: Vue and Nuxt APIs, `composables/` and `utils/` need no import; types do.
- **Updates**: no realtime. The feed and "last done" refetch when the tab regains focus ([[Implementation details#Feed]]). Logging is optimistic, with **Retry** on failure ([[Optimistic logging]]).
- **State**: no Pinia. `useState` or a composable covers shared state; adding a store, or any new npm dependency, is a decision with its trade-off stated in the note.
- **Language**: every user-facing string is French, dates and "il y a 3 jours" via `Intl` in `fr-BE` ([[UI language]]); `<html lang="fr">`.
- **PWA**: `@vite-pwa/nuxt` from [[M4 Polish for daily use]]; don't design offline behaviour before it.

## Section checklist for the document

1. **Screens and routes**: one bullet per route, its path, what it shows, the layout that hosts it.
2. **Component breakdown**: per screen, the Nuxt UI component or new file with its exact path; the props and events relied on.
3. **API contract**: the exact JSON each screen consumes, and what today's server routes are missing. Every server addition turns the slice into a full-stack PR and follows [server.md](server.md).
4. **Taps**: for anything on the logging path, the tap count from Home to logged, and which defaults make it two.
5. **States**: loading, empty (first apartment, no rooms, no tasks), error, optimistic-then-failed, archived items greyed out ([[Implementation details#Archiving]]), one line each.
6. **Copy**: the French strings the screen needs, error messages included.
7. **PR stack**: each PR mergeable alone, with its branch name. Verification per PR is lint + typecheck plus a manual pass in the browser at phone width; a component only gets a test when it holds a rule.
