---
type: decision
status: decided
date: 2026-10-27
area: product
tags:
  - decision
---

# Anyone can edit any log

## Question

Can you edit or delete the other person's logs?

## Decision

Yes: any member can fix or delete any log in the apartment, as in the [[Implementation details#Permissions|permissions table]].

## Why

Two people who trust each other; fixing a mistake shouldn't need the other person.

## Consequences

Logging stays personal ([[Log only for yourself]]): editing a log never changes its `done_by`.

## Related

- [[Log only for yourself]] · [[Screens]]
