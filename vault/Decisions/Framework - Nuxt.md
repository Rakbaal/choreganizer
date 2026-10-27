---
type: decision
status: decided
date: 2026-10-27
area: tech
tags:
  - decision
---

# Framework - Nuxt

## Decision

Nuxt + TypeScript: Vue front and Nitro server routes in one repo.

## Why

Shortest path to a deployed app for a CRUD product; `server/api` files map 1:1 to the [[API]].

## Consequences

The rest of the [[Stack]] (Drizzle, Better Auth, Zod, Nuxt UI, `@vite-pwa/nuxt`) is chosen to fit it.

## Related

- [[Stack]] · [[Hosting]]
