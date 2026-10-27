---
type: decision
status: decided
date: 2026-10-27
area: tech
tags:
  - decision
---

# Hosting

## Question

Free cloud tiers, or self-hosted on a small server?

## Options

- **Free cloud tiers** (recommended in [[Stack]]): Vercel or Netlify for the app, Neon or Supabase for Postgres. Push to deploy, preview URLs per branch.
- **Self-hosting:** `nuxi build` outputs a Node server (`.output/server/index.mjs`) that runs on any small VPS or in Docker.

## Decision

Free cloud tiers: Vercel for the app, Neon or Supabase for Postgres (pick the database host in [[M0 Skeleton]]).

## Consequences

- Preview deploys per branch come free with Vercel
- Check the database's free-tier restore window in M0 ([[Implementation details#Ops]])

## Related

- [[Stack]] · [[M0 Skeleton]]
