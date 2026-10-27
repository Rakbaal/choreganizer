---
type: decision
status: decided
date: 2026-10-27
area: product
tags:
  - decision
---

# Rooms when logging

## Question

When logging an "anywhere" task, do you pick a room? No room, one room, or several?

## Decision

Optional, several allowed; zero rooms means "the whole flat".

## Consequences

`log_rooms` with zero rows = whole apartment. This applies to "anywhere" tasks only; room-specific tasks need a room ([[Room-specific logs need a room]]). The quick-log sheet shows room chips plus "Whole flat" ([[Screens#The quick-log flow]]).

## Related

- [[All-rooms flag]] · [[Data model]]
