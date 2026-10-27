---
type: decision
status: recommended
date: 2026-10-27
area: tech
tags:
  - decision
---

# Database host - Neon

## Decision

The deployed Postgres runs on Neon's Free plan, connected to Vercel with the Neon-managed integration. Supabase is not used.

## Why

- A database branch per Vercel preview, created and deleted with the git branch: migrations run on a preview before production ([[M0 Skeleton tech prep]])
- Computes suspend after 5 min idle and wake on the next query; a Supabase Free project pauses after a week without activity (a holiday) and needs a manual restart
- 6 hours of instant restore plus 1 manual snapshot, where Supabase Free has no backups at all
- 1 GB storage and 100 CU-hours a month cover two people by a wide margin

## Consequences

- First request after 5 min idle pays a cold start
- Restore window is short: take the manual snapshot before a risky migration
- 10 branches per project: keep the integration's automatic cleanup on

## Sources

- [Neon plans](https://neon.com/docs/introduction/plans) · [Neon-managed Vercel integration](https://neon.com/docs/guides/neon-managed-vercel-integration) · [Supabase pricing](https://supabase.com/pricing)

## Related

- [[Hosting]] · [[Local Postgres in Docker]] · [[Implementation details#Ops]]
