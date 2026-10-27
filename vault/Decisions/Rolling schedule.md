---
type: decision
status: decided
date: 2026-10-27
area: product
tags:
  - decision
---

# Rolling schedule

## Question

Rolling or fixed schedule? "7 days after last done" vs "every Monday".

## Decision

Rolling interval: `frequency_interval` + `frequency_unit` (`day` / `week` / `month`); both null = "as needed".

## Why

It matches how chores actually happen.

## Consequences

Fixed schedules ("every Monday") can come later via an RRULE column, if rolling intervals don't fit some chores ([[Post-MVP]]).

## Related

- [[Frequency per task]] · [[Data model]]
