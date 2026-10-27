# Step note template

Note: `vault/Plans/<Project>/Steps/<Project> step <N>.md`

One note per branch. With the master next to it, a fresh session should know what to build, where, and when it is done. Decisions live in the master's recap under their `D<n>` ID: cite the ID and a few words, never copy the decision. Drop sections that would be empty.

**Two levels of detail.** When the plan is first written, only the first step of each stack that can start now is *detailed* (`status: ready`, or `light` if a question still blocks it). The others are *light* (`status: light`): properties, Goal, Context, Provides / Consumes, Not in this step, Risks. Their `Changes`, `Tests`, `Verification` and `Standalone check` hold the single line `_Detailed when the step starts (/obsidian-prepare-step)._`, because a file-level checklist written before the earlier steps exist goes stale.

````markdown
---
type: plan-step
plan: "[[<Project> master]]"
step: <N>
stack: <A>
branch: <type>/<scope>/<slug>
base: <master | previous step's branch | prerequisite branch>
status: light
prepared:
pr:
tags:
  - plan-step
---

# <Project> step <N> — <PR title>

[[<Project> master|Master]] · Stack <A>, step <k>/<m> · ← [[<Project> step <N-1>|Step <N-1>]] · [[<Project> step <N+1>|Step <N+1>]] →

**Goal:** <one sentence: the single concern of this branch.>

## Context
- What exists when this branch starts: on master, and from earlier steps of this stack (link the step).
- The decisions this step implements, by ID: `D3` (zones as a graph), `D7` (success bands). Full text in the master's recap.
- The Lanterne sections it implements: [[Combat#Engagement]], [[Wounds and death#Wounds table]].
- Step-local details that belong to no decision (a file to mirror, a gotcha found in the review) go here in full.

## Provides
What later steps rely on, precise enough to grep: Go signatures, types and their fields, action and event names, routes and JSON shapes, migrations and queries, fakes and test helpers. `/obsidian-step-done` checks these against the code.
- `rules.Apply(state GameState, action Action) (GameState, []Event, error)`
- …

## Consumes
What this step uses from earlier steps' `Provides`: `[[<Project> step 1|step 1]]: rules.Roll`, `step 1: rules.FixedRNG`.

## Changes
Ordered so the step can be implemented top to bottom. One line per change, with the file path and the existing type or mechanism it builds on. Mark paths that don't exist yet as **new**.
- [ ] `backend/internal/rules/dice.go` — **new**, <change> (implements [[Core roll#Success bands]])
- [ ] `backend/internal/database/migrations/<timestamp>_<name>.sql` — **new** via `make migration name=<name>`, <change>
- [ ] …

## Tests
- `backend/internal/rules/dice_test.go` — table-driven, seeded RNG: <cases: each band, crit, fumble, each limit from [[<Project> master#Tech prep recap|the recap]]>
- Frontend: no unit runner. Write "typecheck + manual pass" and describe the manual pass.

## Verification
Commands to run before opening the PR, from the repo root:
- `make -C backend vet` · `make -C backend test` (or `go -C backend test ./internal/<pkg>/...` while iterating)
- `make -C backend sqlc` after a `.sql` change, then check `git diff --stat backend/internal/store`
- `npm --prefix frontend run typecheck`
- Manual: <what to run (`make -C backend run`, `npm --prefix frontend run dev`, `docker compose up -d db`) and what to see>

## Standalone check
- **This branch**: why it is green against its base, and what it changes in behaviour, if anything.
- **Last step of the stack only**: what master looks like once the whole stack merges, and why nothing there depends on a later stack.

## Not in this step
What's deliberately left to later steps, with their link, so the implementation doesn't drift into them.

## Risks / open points
Anything still undecided or fragile for this step, pointing to the master's ❓ numbers.

## Deviations
Empty when the plan is written. During implementation, one line per agreed deviation from this note, appended when it is decided (global CLAUDE.md rule); `/obsidian-step-done` propagates them.
- <YYYY-MM-DD> · <what changed> · why: <reason> · affects: <D-ids, step numbers or none>
````
