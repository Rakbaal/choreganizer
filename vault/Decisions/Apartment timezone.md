---
type: decision
status: decided
date: 2026-10-27
area: data
tags:
  - decision
---

# Apartment timezone

## Decision

Each apartment has a `timezone` (default `Europe/Brussels`). Store every timestamp in UTC, and use the apartment's timezone to decide what "today" or "this week" means.

## Consequences

Feed day grouping uses it via `Intl.DateTimeFormat`; the due/overdue view will too.

## Related

- [[Data model]] · [[Implementation details#Feed]]
