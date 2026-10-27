---
name: obsidian-prepare-step
description: Get one step of a Web Wizard implementation plan (Obsidian vault, vault/Plans/<Project>/) ready to build, without building it. Details a light step against the real code, settles its blocking open questions with Leo, checks its prerequisites and the contracts it consumes, sets the step to ready and commits the vault notes. Ends by handing over to a fresh session running /obsidian-implement-step. Use when asked to "prepare step N", "settle the open questions of step N", "is step N ready?", or /obsidian-prepare-step in web-wizard. Not for writing a plan (obsidian-implementation-plan), building (obsidian-implement-step) or reconciling (obsidian-step-done).
argument-hint: "[step note name or path | step number] [project]"
model: opus
---

# Prepare a plan step

Input: $ARGUMENTS

Plans live in `vault/Plans/<Project>/` (master + `Steps/`), written by `obsidian-implementation-plan` and kept in sync by `obsidian-step-done`. This skill takes one step from "planned" to "ready to build": detailed, nothing blocking left open. Everything it settles is written to the step note and the master, so `/obsidian-implement-step` can start in a fresh session and lose nothing.

**Read `.claude/skills/obsidian-tech-prep/references/vault-conventions.md` first** (properties, note format, vault commits).

**Never implement in this session.** No branch, no code edit, no code commit. The discussion here would pollute the implementation context: that is the whole point of the split. Edits happen in the vault only, committed as the conventions say, with messages `prepare-step: <Project> step <N> …`.

## Phase 1 — Resolve the step

1. Find the step note: a name or path; a number plus a project (ask if several plans have that step); or the note whose `branch:` property is the current branch (vault conventions, *Finding the current step*). With nothing given, offer the first step of `Plans.base` that is not `ready` or later.
2. Read from disk the step note, the master, and the earlier steps this one `Consumes` from. Never work from an in-context copy.
3. Read its properties: `branch`, `base`, `stack`, `status`. A step already `in-progress` or later: say so and ask what Leo wants.
4. `git -C /home/leo-carpentier/dev/web-wizard fetch origin`. Find the code to detail against: `origin/<base>` if it exists, else the local `<base>` branch. Read code with `git show <ref>:<path>`; don't switch branches.

## Phase 2 — Detail a light step

If `Changes`, `Tests`, `Verification` or `Standalone check` still holds the placeholder `_Detailed when the step starts…_`, write them from the step template (`.claude/skills/obsidian-implementation-plan/references/step-template.md`) against the code found in Phase 1.4: real paths, real type and function names, the Lanterne sections each rule implements. Mark anything not yet on the base.

Checkpoint commit first, then the result commit `prepare-step: <Project> step <N> detailed`.

## Phase 3 — Find every blocker

Collect them all before asking anything, then settle them in one round.

- **Open questions.** Master ❓ items not struck through that name this step. `Risks / open points` lines pointing to one or saying "settle before…". `Changes` items that hedge ("A or B", "TBD", "?"). Decision notes the step relies on that are still `status: open`.
- **Rules gaps.** A rule the step implements that the Lanterne chapter leaves ambiguous, or a number listed in [[Playtest questions]] that the step hard-codes instead of keeping in data.
- **Missing prerequisites.** The base branch must exist. If `base` is an earlier step's branch, every step it depends on must have its branch pushed. A missing branch is not something to settle here: report it and stop.
- **Stale assumptions.** Grep the step's `Consumes` lines on the base. A signature that no longer matches is a question.

For each blocker, do the homework first: read the code and the vault notes, give the context (`path:line`, `[[Note#Heading]]`), the options and your recommendation. Then ask with AskUserQuestion, recommended option first, up to 4 questions per call. List non-blocking points in one line each, without asking about them.

## Phase 4 — Record the answers

Checkpoint commit first, re-read each note from disk, then:
- Master ❓: strike the item through and add `**Settled <YYYY-MM-DD>**: <decision>`.
- An answer that settles a Decision note: update it (`status: decided`, the Decision and Why sections), as the vault conventions allow.
- Step note: update the `Changes` items the answer settles. If the answer departs from what the step said, append a `## Deviations` line.
- Leave `D<n>` lines and later steps to `/obsidian-step-done`.
- Set the step's `status: ready` and `prepared: <YYYY-MM-DD>` (today) when nothing blocking is left. `/obsidian-implement-step` compares that date with the base's history to decide whether the step went stale.
- Result commit: `prepare-step: <Project> step <N> questions settled`.

If Leo defers a blocking question, the step stays `light`: say it is not ready and stop.

## Phase 5 — Hand over

Report in a few lines: the notes changed (and the result commits, short SHAs, if a tracked note was touched), the decisions recorded, the vault notes touched outside `Plans/`, the non-blocking points, and whether the step is ready.

When it is ready, end with exactly what to do next: open a **new session** (or `/clear`) and run `/obsidian-implement-step <N> <Project>`. It asks for approval in plan mode only when the step is stale or risky; to force that, switch to plan mode (Shift+Tab) first. Don't offer to start it here.
