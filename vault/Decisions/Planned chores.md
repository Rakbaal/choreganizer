---
type: decision
status: decided
date: 2026-10-27
area: product
tags:
  - decision
---

# Planned chores

## Question

How do you plan a chore for later, so reminders can be sent?

## Decision

A separate **planned chore** (task, rooms, planned date), built after the MVP. Logs are never dated in the future.

## Why

A log records something that happened. A future-dated log would show up as "last done" and in the feed before anyone did it, and a skipped chore would look done.

## Consequences

- MVP unchanged: `done_at` stays at most 5 minutes in the future ([[Log in the past]])
- After the MVP: a new table (e.g. `planned_chores`: task, rooms, `planned_for`, `done_log_id`); logging the chore links the log and marks the plan done. No change to `logs`
- Reminders are built on planned chores and on overdue tasks ([[Post-MVP]])

## Related

- [[Log in the past]] · [[Post-MVP]] · [[Rolling schedule]]
