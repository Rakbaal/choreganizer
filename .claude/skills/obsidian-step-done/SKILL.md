---
name: obsidian-step-done
description: Reconcile a Choreganizer implementation plan (Obsidian vault, vault/Plans/<Project>/) with what was actually built on a step's branch. Diffs the branch against its step note, reports the drift (planned but not done, done but not planned, changed decisions or interfaces), finds the decisions, later steps and vault notes it affects, and updates the master, the impacted step notes and the milestone, asking Leo only about decisions (a dropped item, a Decision or Project note). Use when a step is done or nearly done, before its PR leaves draft, or when asked "did we drift from the plan?", "reconcile the plan", "step done", or /obsidian-step-done in choreganizer. Not for writing a plan (obsidian-implementation-plan) or building the next step (obsidian-implement-step).
argument-hint: "[step note name or path | step number] [project]"
---

# Reconcile a plan after a step

Input: $ARGUMENTS

Plans live in `vault/Plans/<Project>/` (master + `Steps/`), written by `obsidian-implementation-plan`. During implementation, agreed deviations are logged one line at a time in the step's `## Deviations` section (global CLAUDE.md rule). This skill turns that log and the branch diff into vault edits, so the master and the remaining steps describe the code that exists, not the code that was imagined.

**Read `.claude/skills/obsidian-tech-prep/references/vault-conventions.md` first** (properties, notes outside `Plans/`, vault commits).

Keep it quick: Leo's effort goes into the tech prep and `/obsidian-implement-step`, and he trusts the bookkeeping here. Edits inside `vault/Plans/` are applied without waiting; only the decisions listed in Phase 4 wait for him. No code commits. Vault commits follow the conventions, on the branch checked out, which is usually the step's own: the reconciled plan then ships in its PR.

## Phase 1 — Resolve the step

1. **Find the step note.** A name or path; a bare number plus a project (ask unless only one plan has that step); otherwise the note whose `branch:` property is the current branch (vault conventions, *Finding the current step*). No match or several: list the candidates and ask.
2. **Read from disk:** the step note, the master, every later step note of the plan, and the milestone note. Leo edits these in Obsidian, so never work from an in-context copy.
3. **Resolve the base and the diff.**
   - `git -C /home/leo-carpentier/dev/choreganizer fetch origin`. Base = the PR's `baseRefName` when a PR exists (`gh pr view <branch> --json baseRefName,state`), else the step's `base:` property. For `master`, diff against the merge base.
   - The built code = `git diff <base>...<branch> -- . ':!vault'` **plus** uncommitted code changes (`git diff HEAD -- . ':!vault'`, `git status --porcelain` for new files). The vault is excluded: plan edits are not drift.
   - When the step's branch is not checked out, read it with `git diff` / `git show` on the ref; don't switch branches.
   - Formatter-only changes, lockfile churn, and Drizzle Kit's generated migration and snapshot files that only mirror a schema change are not drift. Skip them.

## Phase 2 — Compare the plan with the code

Go through the step note section by section, not from memory. For each item, find it in the diff.

| Kind | What to look for |
|---|---|
| **Planned, not done** | A `Changes` or `Tests` item with no counterpart in the diff. |
| **Done, not planned** | A file, type, column, util, route, migration, component, dependency, test or behaviour in the diff that no `Changes` item covers. |
| **Changed** | Built differently from what the step or a decision says: another name, signature, column type, JSON shape, status code, file location, permission, limit or French copy. |
| **Provides broken** | A `Provides` line that no longer matches the code (grep the signature). This is the drift that hurts later steps the most. |
| **Deviation log** | Each `## Deviations` line: confirm it in the diff, and add the ones the log missed. |

Label every row **VERIFIED** (with `path:line`, or the diff hunk) or **HYPOTHESIS**. A "planned, not done" item may still be in progress: ask rather than assume it moved.

## Phase 3 — Find what the drift affects

For each drift row:
- **Decisions.** Which `D<n>` in the master does it change, contradict or make obsolete? Does it call for a new decision? Does a linked Decision note need the same change?
- **Later steps.** Grep the later step notes for the changed `D<n>` and for the identifiers involved (type, function, table, column, route, component). Steps that `Consumes` a broken `Provides` are affected even when they don't quote it.
- **Master tables.** Coverage rows whose step moves or whose item is dropped. Stack tables when slicing changes.
- **Open questions.** A ❓ the implementation settled, or a new one it raised.
- **Design notes.** A drift that changes what a `Project/` note says (a route, a column, a permission, a limit in [[Implementation details#Validation]]): flag it and propose the one-line update, applied only on Leo's OK (vault conventions).
- **Milestone.** Tasks of the milestone whose coverage rows are now all on merged steps: candidates for `- [x]`.

## Phase 4 — Ask only what needs Leo

Split the edits in two:
- **Apply without asking** (Phase 5): everything inside `vault/Plans/` (this step, the master's `D<n>` lines, coverage, stacks, ❓, Changelog, later steps) and milestone ticks whose coverage rows are all on merged steps. These follow from the code and the deviation log, which Leo already agreed to.
- **Ask first**, with AskUserQuestion (standalone, recommended option first), all in one round: a "planned, not done" row (in progress, moved to a later step, or dropped?), a HYPOTHESIS row that would change a later step, an edit to a Decision note or a `Project/` note, a new decision.

With no question, go straight to Phase 5. Anything that changes the tech prep note itself: list it in the report, don't edit it (it records what was validated).

## Phase 5 — Apply

Checkpoint commit first. Re-read every note from disk before editing it. Apply note by note.

- **This step's note:** tick the `Changes` / `Tests` boxes that are done. Strike through items that moved, with `→ [[<Project> step N|step N]]`, or that were dropped, with the reason. Add unplanned work as ticked items marked `(added)`. Update `Provides` to the real signatures. Leave the `## Deviations` log as it is: it is the history. Set `status: done` only if the PR is merged; otherwise leave it.
- **Master:** edit the affected `D<n>` lines in place (no strikethrough soup: the Changelog holds the history), the coverage and stack tables, and the ❓ list (strike through settled ones, with the decision). Append to `## Changelog` (create it at the end if missing):
  `- <YYYY-MM-DD> · step <N> done · <D-ids changed, with a few words each> · steps <list> updated`
  Set the master's `status: done` when every step is `done`.
- **Later steps:** edit only what the drift touches: Context, Consumes, the `Changes` items that build on what changed, "Not in this step" when scope moved. Don't rewrite a step the drift doesn't reach.
- **Outside `Plans/`**, milestone ticks, and what Leo approved in Phase 4: Decision notes, `Project/Open questions.md`, one-line `Project/` updates.
- End with the result commit `step-done: <Project> step <N>`, D-ids changed and notes updated in its body. Give its short SHA, `git show <sha>` to review, `git revert <sha>` to undo. The reconciled plan lives in `vault/Plans/` (git-ignored), so it never reaches the PR: this skill doesn't push.
- Report, short: the drift table (kind · item · VERIFIED/HYPOTHESIS + evidence), the edits made grouped by note (one line each: `master: D7 — invite expiry moves to the accept route`, `step 3: Changes item 4 now uses requireOwner`), anything that changes the tech prep, and the commit SHA if one was made.

## Next

The next step is detailed and built by `/obsidian-implement-step <N+1> <Project>`, in a fresh session. Suggest it once the result commit is made.
