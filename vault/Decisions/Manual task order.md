---
type: decision
status: decided
date: 2026-10-27
area: product
tags:
  - decision
---

# Manual task order

## Question

What order do the task buttons on Home come in?

## Decision

A manual order you set yourselves: a `position` column on `tasks`, like `rooms`.

## Why

Buttons that never move let your thumb learn where they are, which keeps logging at two taps.

## Consequences

- `tasks.position int not null default 0`; new tasks go last ([[Data model]])
- Drag to reorder on the Tasks screen; `PATCH /tasks/:id` accepts the new position ([[API]])

## Related

- [[Screens]] · [[M2 Tasks]]
