---
type: decision
status: decided
date: 2026-10-27
area: tech
tags:
  - decision
---

# Long sessions

## Decision

Sessions last 90 days, refreshed when used: Better Auth `session.expiresIn: 60 * 60 * 24 * 90`.

## Why

Better Auth's default is 7 days, refreshed on use. A week away (holiday) would log you out, and signing in again breaks the two-tap rule ([[Scope]]).

## Consequences

Set in the Better Auth config in [[M0 Skeleton]].

## Sources

- [Better Auth, session management](https://www.better-auth.com/docs/concepts/session-management)

## Related

- [[Implementation details#Auth]]
