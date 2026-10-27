---
type: decision
status: decided
date: 2026-10-27
area: product
tags:
  - decision
---

# Room-specific logs need a room

## Question

When logging a room-specific task like *Vitres* (Cuisine + Salon), can you skip picking a room?

## Decision

No: a log of a room-specific task names at least one room. The quick-log sheet adds an **All of them** chip that selects every room the task applies to.

## Why

"Zero rooms = whole flat" ([[Rooms when logging]]) only makes sense for "anywhere" tasks. Storing the rooms explicitly keeps the feed's room filter exact.

## Consequences

- Server rule: a log of a task with `all_rooms = false` has at least one `log_rooms` row ([[Data model#Rules the server must enforce]])
- A task with exactly one eligible room is still logged in one tap ([[Screens#The quick-log flow]])

## Related

- [[Rooms when logging]] · [[All-rooms flag]]
