---
type: decision
status: decided
date: 2026-11-12
area: product
tags:
  - decision
---

# Tasks with no room

## Question

Some chores don't happen in a room: *Sortir les poubelles*, *Aller à la laverie*. Set to « Partout », they open the room sheet on every tap and show « Tout l'appartement » in the feed, and the laundromat isn't in the flat at all. How should a task with no room work?

## Decision

A task's rooms have three modes, one `room_scope` column on `tasks` (`all | some | none`) that replaces the `all_rooms` flag ([[All-rooms flag]]):

- `all`, « Partout »: every active room, logged in one room, several, or « Tout l'appartement » ([[Rooms when logging]])
- `some`, « Certaines pièces »: the rooms in `task_rooms`, at least one per log ([[Room-specific logs need a room]])
- `none`, « Aucune pièce »: no room, ever

A no-room task is logged on the first tap, with no sheet. Its logs have no `log_rooms` rows, its feed line shows no room, and the feed's room filter leaves them out ([[Room filter includes whole-flat logs]] still holds for the zero-room logs of every other task, so an `all` task switched to `some` keeps its whole-flat history).

## Why

- One tap instead of two for chores that are done often, and no room chips that make no sense ([[Screens#The quick-log flow]])
- « Tout l'appartement » is wrong for a chore done outside the flat, and showing it under « Cuisine » is noise
- One 3-value column rather than a second flag: two booleans could say "all rooms" and "no room" at once

## Consequences

- Migration: `room_scope` added and filled from `all_rooms` (`true` → `all`, `false` → `some`), then `all_rooms` dropped; `task_rooms` is ignored unless `room_scope` is `some`
- Server rule: a log of a `none` task names no room ([[Data model#Rules the server must enforce]])
- Zero `log_rooms` rows now mean "whole flat" for an `all` task and "no room" for a `none` task: the feed reads the task's current `room_scope`. Switching a task between `all` and `none` relabels its past zero-room logs; accepted, it's rare and nothing is lost
- Task form: « Pièces » becomes a three-way choice; the room checkboxes show for « Certaines pièces » only. A flat with no room yet offers « Partout » and « Aucune pièce »
- The seed's *Sortir les poubelles* becomes `none`
- Built in [[M3 Logging and feed step 5]]

## Related

- [[All-rooms flag]] · [[Rooms when logging]] · [[Room-specific logs need a room]] · [[Room filter includes whole-flat logs]] · [[Room chips log at once]] · [[Data model]]
