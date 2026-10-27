---
name: obsidian-step-done
description: Reconcile a Web Wizard implementation plan (Obsidian vault, vault/Plans/<Project>/) with what was actually built on a step's branch. Diffs the branch against its step note, reports the drift (planned but not done, done but not planned, changed decisions or interfaces), finds the decisions, later steps and vault notes it affects, and after approval updates the master, the impacted step notes and the milestone. Use when a step is done or nearly done, before its PR leaves draft, or when asked "did we drift from the plan?", "reconcile the plan", "step done", or /obsidian-step-done in web-wizard. Not for writing a plan (obsidian-implementation-plan) or detailing the next step (obsidian-prepare-step).
argument-hint: "[step note name or path | step number] [project]"
---

# Reconcile a plan after a step

Input: $ARGUMENTS

Plans live in `vault/Plans/<Project>/` (master + `Steps/`), written by `obsidian-implementation-plan`. During implementation, agreed deviations are logged one line at a time in the step's `## Deviations` section (global CLAUDE.md rule). This skill turns that log and the branch diff into vault edits, so the master and the remaining steps describe the code that exists, not the code that was imagined.

**Read `.claude/skills/obsidian-tech-prep/references/vault-conventions.md` first** (properties, notes outside `Plans/`, vault commits).

Nothing is edited before Leo approves the proposal (Phase 4). No code commits. Vault commits follow the conventions, on the branch checked out, which is usually the step's own: the reconciled plan then ships in its PR.

## Phase 1 — Resolve the step

1. **Find the step note.** A name or path; a bare number plus a project (ask unless only one plan has that step); otherwise the note whose `branch:` property is the current branch (vault conventions, *Finding the current step*). No match or several: list the candidates and ask.
2. **Read from disk:** the step note, the master, every later step note of the plan, and the milestone note. Leo edits these in Obsidian, so never work from an in-context copy.
3. **Resolve the base and the diff.**
   - `git -C /home/leo-carpentier/dev/web-wizard fetch origin`. Base = the PR's `baseRefName` when a PR exists (`gh pr view <branch> --json baseRefName,state`), else the step's `base:` property. For `master`, diff against the merge base.
   - The built code = `git diff <base>...<branch> -- . ':!vault'` **plus** uncommitted code changes (`git diff HEAD -- . ':!vault'`, `git status --porcelain` for new files). The vault is excluded: plan edits are not drift.
   - When the step's branch is not checked out, read it with `git diff` / `git show` on the ref; don't switch branches.
   - gofmt-only changes and regenerated `internal/store` code that only mirrors a `.sql` change are not drift. Skip them.

## Phase 2 — Compare the plan with the code

Go through the step note section by section, not from memory. For each item, find it in the diff.

| Kind | What to look for |
|---|---|
| **Planned, not done** | A `Changes` or `Tests` item with no counterpart in the diff. |
| **Done, not planned** | A file, type, field, action, event, route, migration, test or behaviour in the diff that no `Changes` item covers. |
| **Changed** | Built differently from what the step or a decision says: another name, signature, field type, event name, JSON shape, file location, rule interpretation or number. |
| **Provides broken** | A `Provides` line that no longer matches the code (grep the signature). This is the drift that hurts later steps the most. |
| **Deviation log** | Each `## Deviations` line: confirm it in the diff, and add the ones the log missed. |

Label every row **VERIFIED** (with `path:line`, or the diff hunk) or **HYPOTHESIS**. A "planned, not done" item may still be in progress: ask rather than assume it moved.

## Phase 3 — Find what the drift affects

For each drift row:
- **Decisions.** Which `D<n>` in the master does it change, contradict or make obsolete? Does it call for a new decision? Does a linked Decision note need the same change?
- **Later steps.** Grep the later step notes for the changed `D<n>` and for the identifiers involved (type, function, field, action, event, route). Steps that `Consumes` a broken `Provides` are affected even when they don't quote it.
- **Master tables.** Coverage rows whose step moves or whose item is dropped. Stack tables when slicing changes.
- **Open questions.** A ❓ the implementation settled, or a new one it raised.
- **Rules.** A drift that changes how a Lanterne rule is implemented, or a number: flag it. The Lanterne chapters are never edited by this skill; propose a [[Playtest questions]] line if it reveals a rules problem.
- **Milestone.** Tasks of the milestone whose coverage rows are now all on merged steps: candidates for `- [x]`.

## Phase 4 — Propose, then stop

Give Leo, in this order:
1. The drift table: kind · item · VERIFIED/HYPOTHESIS + evidence.
2. Questions on rows that need his decision (in progress or moved? keep or drop?).
3. The proposed edits, grouped by note, one line each: `master: D7 — success bands gain 'close_call'`, `step 3: Context cites D7, Changes item 4 now uses rules.Band`, `coverage: "Morale" row → step 4`, `[[Light clock in MVP]]: Consequences updated`, `milestone: tick "Game state + reducer"`.
4. Anything that changes the tech prep note itself: list it, don't edit it (it records what was validated).

Stop and wait for approval. Leo may edit the notes meanwhile.

## Phase 5 — Apply

Checkpoint commit first. Re-read every note from disk before editing it. Apply note by note.

- **This step's note:** tick the `Changes` / `Tests` boxes that are done. Strike through items that moved, with `→ [[<Project> step N|step N]]`, or that were dropped, with the reason. Add unplanned work as ticked items marked `(added)`. Update `Provides` to the real signatures. Leave the `## Deviations` log as it is: it is the history. Set `status: done` only if the PR is merged; otherwise leave it.
- **Master:** edit the affected `D<n>` lines in place (no strikethrough soup: the Changelog holds the history), the coverage and stack tables, and the ❓ list (strike through settled ones, with the decision). Append to `## Changelog` (create it at the end if missing):
  `- <YYYY-MM-DD> · step <N> done · <D-ids changed, with a few words each> · steps <list> updated`
  Set the master's `status: done` when every step is `done`.
- **Later steps:** edit only what the drift touches: Context, Consumes, the `Changes` items that build on what changed, "Not in this step" when scope moved. Don't rewrite a step the drift doesn't reach.
- **Outside `Plans/`**, only what was approved: Decision notes, milestone ticks, `Project/Open questions.md`.
- End with the result commit `step-done: <Project> step <N>`, D-ids changed and notes updated in its body. Give its short SHA, `git show <sha>` to review, `git revert <sha>` to undo. The reconciled plan lives in `vault/Plans/` (git-ignored), so it never reaches the PR: this skill doesn't push.

## Next

The next step is detailed and its open questions settled by `/obsidian-prepare-step`, in its own session. Suggest it once the result commit is made.
