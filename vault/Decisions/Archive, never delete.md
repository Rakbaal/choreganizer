---
type: decision
status: decided
date: 2026-10-27
area: data
tags:
  - decision
---

# Archive, never delete

## Question

What happens to logs when a task or room is removed? Hard delete, or archive?

## Decision

Archive only (`archived_at`) for apartments, rooms and tasks.

## Why

History must never break.

## Consequences

Archived tasks and rooms can't receive new logs, but still show in the feed and its filters, greyed out. Logs themselves can still be deleted (to fix a mistake).

## Related

- [[Implementation details#Archiving]] · [[Data model]]
