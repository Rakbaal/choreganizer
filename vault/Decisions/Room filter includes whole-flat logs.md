---
type: decision
status: decided
date: 2026-10-27
area: product
tags:
  - decision
---

# Room filter includes whole-flat logs

## Question

Does filtering the feed by "Cuisine" include logs done for the whole flat (e.g. *Balai* everywhere)?

## Decision

Yes. A room filter matches logs that name that room, plus logs with no room, shown as "Whole flat".

## Consequences

The feed query's room filter is `exists (log_rooms for that room) or not exists (any log_rooms)` ([[Implementation details#Feed]]).

## Related

- [[Rooms when logging]] · [[Data model#Feed query]]
