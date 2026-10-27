---
tags:
  - project
---

# Scope

The MVP is a shared log: two people record "who did which chore, in which room, when", and read that history back. Everything else (reminders, due dates, stats) is built on top of those logs later.

The one product rule that decides whether this app gets used: **logging a chore must take two taps on a phone, right after doing it.** If it takes longer, you will stop logging within two weeks and the data becomes useless.

## In the MVP

- **Apartments:** create, rename, archive; each has a list of rooms
- **Members:** invite the other person to an apartment; a person can belong to several apartments (home, holiday rental)
- **Tasks:** name, frequency (daily, weekly, every N days…), and where it applies (anywhere, or a chosen set of rooms)
- **Logs:** "I did X in room Y", timestamped now by default, editable afterwards
- **Feed:** "Alice did *Nettoyer les vitres* in the kitchen · yesterday 19:40", newest first, filterable by person, task, room

## Not in the MVP (deliberately)

- "What's due / overdue" dashboard: the frequency is stored from day one so this is a pure read feature later
- Notifications, points, fairness stats, task assignment
- Native mobile app: a responsive web app installable as a PWA is enough

See [[Post-MVP]] for what comes next.

## Related

- [[Data model]] · [[Screens]] · [[Roadmap]]
