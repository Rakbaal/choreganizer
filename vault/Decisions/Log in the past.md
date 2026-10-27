---
type: decision
status: decided
date: 2026-10-27
area: product
tags:
  - decision
---

# Log in the past

## Question

Can you log in the past, or only now?

## Decision

Defaults to now, editable ("I did it yesterday").

## Consequences

`done_at` can be at most 5 minutes in the future (clock skew); no lower limit ([[Implementation details#Validation]]).

A log records something that happened, so it is never dated in the future. Planning chores for later is a separate concept: [[Planned chores]].

## Related

- [[Log only for yourself]]
