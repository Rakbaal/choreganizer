---
type: decision
status: recommended
date: 2026-10-31
area: tech
tags:
  - decision
---

# Tests against a real Postgres

## Question

The rules worth testing ([[Roadmap#Testing that pays off here]]: `requireMembership`, the log-creation rules) are queries. Test them against mocks, or against a real database?

## Decision

A real Postgres, migrated with the committed migrations: the Docker one locally (its own database, not the dev data), a `postgres:18` service in CI. The rule under test lives in a function with explicit imports (`h3`, `./db`), so plain Vitest loads it without `@nuxt/test-utils`; the route-facing wrapper (`requireMembership(event, …)`) stays a thin call to `requireUser` plus that function.

## Why

The rules are SQL (a membership lookup, eligible rooms, same-apartment checks): a mock would test the mock. The migrations get exercised on every CI run as a side effect. Postgres is already in Docker ([[Local Postgres in Docker]]).

## Consequences

- CI gets a Postgres service ([[M1 Apartments, rooms, members]]); M3's log-creation tests reuse the harness
- Tests that need a session or an `event` aren't written; the 401 path stays `requireUser`'s
- Where the local test database lives: [[M1 Apartments, rooms, members tech prep#❓ Open questions]]

## Related

- [[Roadmap#Testing that pays off here]] · [[Implementation details#Ops]]
