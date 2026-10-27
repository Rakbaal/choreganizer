---
type: decision
status: decided
date: 2026-10-27
area: tech
tags:
  - decision
---

# Local Postgres in Docker

## Decision

Local development runs Postgres in Docker (`docker compose`); Neon or Supabase is only for the deployed app.

## Why

Works offline, free to reset, and migrations are tested locally before they reach the hosted database.

## Consequences

A `docker-compose.yml` with Postgres and a `DATABASE_URL` in `.env.example` ([[M0 Skeleton]]).

## Related

- [[Hosting]] · [[Implementation details#Ops]]
