---
tags:
  - home
---

# Choreganizer

A shared chore log for two people: record **who did which chore, in which room, when**, and read that history back. Started Oct 27, 2026.

> [!important] The one product rule
> Logging a chore must take **two taps on a phone**, right after doing it. If it takes longer, you stop logging within two weeks and the data becomes useless.

## Project

- [[Scope]] — what's in and out of the MVP
- [[Data model]] — nine tables, Postgres schema, feed query
- [[Stack]] — Nuxt, Postgres, Drizzle, Better Auth
- [[API]] — REST routes and the authorization helper
- [[Screens]] — five screens and the quick-log flow
- [[Implementation details]] — pages, permissions, auth, invites, validation
- [[Open questions]]

## Roadmap

- [[Roadmap]] — milestones and what testing pays off
- Milestones: [[M0 Skeleton|M0]] · [[M1 Apartments, rooms, members|M1]] · [[M2 Tasks|M2]] · [[M3 Logging and feed|M3]] · [[M4 Polish for daily use|M4]]
- [[Post-MVP]]

![[Milestones.base]]

## Decisions

![[Decisions.base]]

## How this vault works

- **Folders:** `Project/` (scope and design), `Decisions/` (one note per decision), `Roadmap/` (plan and `Milestones/`), `Templates/`.
- **Properties:** decisions have `status` (`open` / `recommended` / `decided`), `date` and `area`. Milestones have `status` (`todo` / `in-progress` / `done`) and `done-when`. The tables above read these.
- **New notes:** use the *Decision* or *Milestone* template (Templates core plugin).
- **Code docs** (how to run things, folder layout) stay next to the code, in `README.md`.
