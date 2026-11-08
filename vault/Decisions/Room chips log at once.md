---
type: decision
status: recommended
date: 2026-11-08
area: product
tags:
  - decision
---

# Room chips log at once

## Question

In the quick-log sheet, does tapping a room chip log the chore, or select it until you tap **Done**?

## Decision

A chip logs at once and closes the sheet: task, then room, two taps. « Tout l'appartement » (anywhere tasks) and « Toutes » (room-specific tasks, see [[Room-specific logs need a room]]) are chips like the others. Picking a subset of several rooms goes through « Plusieurs pièces… », which turns the chips into toggles with « Valider »; it shows only when the task has three or more eligible rooms.

## Why

"Pick, then Done" ([[Screens#The quick-log flow]] as first written) makes every log that opens the sheet three taps, against [[Home]]'s two-tap rule. One room, or all of them, is the common case; a hand-picked subset is the rare one and can pay the extra taps.

## Consequences

- [[Screens#The quick-log flow]] step 3 changes accordingly (on Leo's OK)
- Closing the sheet logs nothing
- [[M3 Logging and feed tech prep#Home and the quick-log flow]]

## Related

- [[Rooms when logging]] · [[Optimistic logging]] · [[M3 Logging and feed]]
