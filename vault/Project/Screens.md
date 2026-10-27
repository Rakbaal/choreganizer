---
tags:
  - project
  - product
---

# Screens

Five screens. The home screen is the logging screen, not a dashboard, because logging is the action you do ten times a week.

| Screen | Contents |
| --- | --- |
| Sign in / sign up | Email + password; after sign-up, "create an apartment" or "enter an invite code" |
| Home: log a chore | Apartment switcher at the top; one large button per active task, in your order ([[Manual task order]]), showing "last done 3 days ago by Alice" |
| Feed | Logs grouped by day: "Alice · Nettoyer les vitres · Cuisine, Salon · 19:40"; filter chips for person, task, room (a room includes whole-flat logs, see [[Room filter includes whole-flat logs]]); tap any log to edit or delete ([[Anyone can edit any log]]) |
| Tasks | List (drag to reorder) + form: name, description, frequency (as needed / every N days, weeks, months), rooms ("Anywhere" toggle or room checkboxes) |
| Apartment settings | Name, timezone, rooms (add, rename, drag to reorder, archive), members, "invite" button that shows a code and share link, archive apartment |

## The quick-log flow

1. Tap a task on Home.
2. If the task has exactly one eligible room, it's logged immediately.
3. Otherwise a bottom sheet shows room chips plus **Whole flat** (anywhere tasks) or **All of them** (room-specific tasks, see [[Room-specific logs need a room]]); pick one or more, tap **Done**.
4. The button shows done at once ([[Optimistic logging]]); a toast confirms with **Undo** (deletes the log) and **Edit** (change when, add a note).

Defaults do the work: done by me ([[Log only for yourself|always]]), done now. Changing the time is possible but never required.

## Related

- [[Scope]] · [[Implementation details#Pages]]
