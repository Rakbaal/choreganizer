---
tags:
  - roadmap
---

# Roadmap

Five milestones, each ending with something deployed that you can both use. **Deploy at the end of M0, not at the end of the project.**

1. [[M0 Skeleton]] — empty app live, sign up and sign in
2. [[M1 Apartments, rooms, members]] — the flat exists and both of you are in it
3. [[M2 Tasks]] — chores defined, with frequency and rooms
4. [[M3 Logging and feed]] — the core loop: log from a phone, see it in the feed
5. [[M4 Polish for daily use]] — a week of use without friction

![[Milestones.base]]

## Testing that pays off here

Unit tests on the log-creation rules and `requireMembership`, plus one Playwright test of sign up → create apartment → add task → log it → see it in the feed. Skip the rest until something breaks.

## After the MVP

See [[Post-MVP]].
