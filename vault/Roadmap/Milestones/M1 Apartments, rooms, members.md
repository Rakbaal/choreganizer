---
type: milestone
milestone: M1
status: in-progress
done-when: You create the flat, add its rooms, and your girlfriend joins with a code
previous: "[[M0 Skeleton]]"
next: "[[M2 Tasks]]"
tech-prep: "[[M1 Apartments, rooms, members tech prep]]"
plan: "[[M1 Apartments, rooms, members master]]"
tags:
  - milestone
---

# M1 — Apartments, rooms, members

Part of [[Roadmap]] · ← [[M0 Skeleton]] · next [[M2 Tasks]] →

Tech prep: [[M1 Apartments, rooms, members tech prep]] · Plan: [[M1 Apartments, rooms, members master]]

## Tasks

- [ ] Tables `apartments`, `memberships`, `rooms`, `invites`
- [ ] `requireMembership` helper + tests
- [ ] Create / rename / archive apartment; apartment switcher
- [ ] Rooms CRUD with ordering and archive
- [ ] Seed script with a sample apartment and rooms for local dev; extend it in each milestone
- [ ] Invite code: create, accept, expiry, single use, `/join/[code]` through sign-up; last-owner rule on leave

## Done when

You create the flat, add its rooms, and your girlfriend joins with a code.

## Related

- [[Data model]] · [[Implementation details#Invites]] · [[Implementation details#Permissions]]
