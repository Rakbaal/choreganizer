---
type: decision
status: decided
date: 2026-11-08
area: product
tags:
  - decision
---

# Bottom navigation bar

## Question

How do you move between Home, the feed and the tasks once all three exist?

## Decision

A fixed bar at the bottom of every apartment page: « Accueil » / « Historique » / « Tâches », with icons, the current one highlighted. « Tâches » leaves the apartment switcher's menu; « Réglages », « Nouvel appartement » and « Se déconnecter » stay there.

## Why

Three destinations used every day, on a phone: a bottom bar keeps them one thumb tap away. Settings are rare and can stay a tap deeper.

## Consequences

- The `/a/[apartmentId]` shell hosts it; pages leave room for it (safe-area padding)
- Home's « Gérer les tâches » link goes ([[M2 Tasks tech prep]] placed it there until a nav existed)
- [[M3 Logging and feed tech prep#Screens]]

## Related

- [[Screens]] · [[Implementation details#Pages]]
