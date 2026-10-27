---
type: decision
status: decided
date: 2026-10-27
area: data
tags:
  - decision
---

# Frequency per task

## Question

Is "weekly" per task or per room? *Vitres* once a week overall, or once a week in each room?

## Decision

Per task: store the frequency on the task. Compute "due" per task + room later.

## Consequences

Doesn't affect the MVP. The due/overdue view in [[Post-MVP]] computes it per task, and per room for room-specific tasks.

## Related

- [[Rolling schedule]] · [[Data model]]
