---
type: decision
status: decided
date: 2026-10-27
area: tech
tags:
  - decision
---

# Optimistic logging

## Decision

Tapping a task marks it done on screen at once and sends the request in the background. If it fails, a toast offers **Retry**. No offline queue in the MVP.

## Why

On a slow connection, waiting for the server would make logging feel slow, and the two-tap rule is about feel as much as taps.

## Consequences

The Undo toast appears immediately; Undo before the request finishes cancels it ([[Screens#The quick-log flow]], [[M3 Logging and feed]]).

## Related

- [[Implementation details#Quick log]]
