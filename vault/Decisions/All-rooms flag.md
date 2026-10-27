---
type: decision
status: decided
date: 2026-10-27
area: data
tags:
  - decision
---

# All-rooms flag

## Question

What does "anywhere" mean for a task like *Passer le balai*? A list of every room, or a flag?

## Decision

An `all_rooms` flag on `tasks`.

## Why

A room you add later is included automatically; no need to update every "anywhere" task.

## Consequences

`task_rooms` is ignored when `all_rooms` is true. Archiving a room removes it from "all rooms".

## Related

- [[Data model]] · [[Rooms when logging]]
