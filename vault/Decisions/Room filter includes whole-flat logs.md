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

Yes. A room filter matches logs that name that room, plus logs with no room, shown as "Whole flat". Since 2026-11-12, only the zero-room logs of « Partout » tasks count: logs of a no-room task never match a room filter ([[Tasks with no room]]).

## Consequences

The feed query's room filter is `exists (log_rooms for that room) or (not exists (any log_rooms) and task.room_scope = 'all')` ([[Implementation details#Feed]]).

## Related

- [[Rooms when logging]] · [[Data model#Feed query]]
