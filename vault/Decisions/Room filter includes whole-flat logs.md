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

Yes. A room filter matches logs that name that room, plus logs with no room, shown as "Whole flat". Since 2026-11-12, logs of a no-room task never match a room filter ([[Tasks with no room]]); the zero-room logs of any other task still count, including a « Partout » task later switched to « Certaines pièces », whose whole-flat history stays whole-flat.

## Consequences

The feed query's room filter is `exists (log_rooms for that room) or (not exists (any log_rooms) and task.room_scope <> 'none')` ([[Implementation details#Feed]]).

## Related

- [[Rooms when logging]] · [[Data model#Feed query]]
