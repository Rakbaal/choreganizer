---
tags:
  - roadmap
---

# Post-MVP

The [[Data model|schema]] already supports each of these without a migration, except where noted.

- **Due / overdue view:** for each task (and room, for room-specific tasks), last `done_at` + interval vs. today in the apartment's timezone. See [[Frequency per task]], [[Apartment timezone]]
- **Balance stats:** chores per person per week, optionally weighted by an `effort` column on tasks (needs a migration)
- **Planned chores:** plan a task for a date; logging it marks the plan done. Needs a new table, no change to `logs`. See [[Planned chores]]
- **Reminders:** a daily cron that sends a push or email digest of overdue tasks and today's planned chores
- **Copy apartment:** duplicate rooms and tasks into a new apartment when you move or go on holiday. See [[Tasks per apartment]]
- **Fixed schedules:** "every Monday" via an RRULE column, if rolling intervals turn out not to fit some chores. See [[Rolling schedule]]
