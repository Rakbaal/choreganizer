---
type: decision
status: decided
date: 2026-10-27
area: product
tags:
  - decision
---

# Log only for yourself

## Question

Can you log a chore for the other person, or only for yourself?

## Decision

Only for yourself.

The plan's recommendation was "anyone, but store `done_by` and `logged_by` separately"; the answer overrides it.

## Consequences

- [[Data model]]: `logs` has a single `done_by` column, set from the session; `logged_by` is gone. Allowing it later is a small migration: add `logged_by`, backfilled with `done_by`
- [[API]]: `POST /apartments/:id/logs` takes no `doneBy`
- [[Screens]]: the quick-log Edit changes when and the note, not who
- [[M3 Logging and feed]]: no "log for the other person" task

## Related

- [[Log in the past]]
