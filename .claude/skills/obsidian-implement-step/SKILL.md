---
name: obsidian-implement-step
description: Implement one prepared step of a Choreganizer implementation plan (Obsidian vault, vault/Plans/<Project>/) end to end, in a fresh session. It checks nothing blocking is left, decides the branch, base and stack target, and writes a short commit-by-commit plan against the real code, held for approval in plan mode only when the step is stale or risky; then the same session creates the branch, implements the step as a clean series of commits, verifies it, opens its draft PR, stacks it with gh stack, and updates the step note. Use when asked to "implement step N", "build step N", "ship the next step", or /obsidian-implement-step in choreganizer. Not for settling questions (obsidian-prepare-step) or reconciling the plan (obsidian-step-done).
argument-hint: "[step note name or path | step number] [project]"
model: opus
---

# Implement a plan step

Input: $ARGUMENTS

Plans live in `vault/Plans/<Project>/` (master + `Steps/`), written by `obsidian-implementation-plan`, prepared by `obsidian-prepare-step`, kept in sync by `obsidian-step-done`. This skill takes one `ready` step to "draft PR in its stack".

It runs in a **fresh session**. Phases 1 to 4 are read-only and always run; Phase 4 picks the mode. A **full** run holds the plan for approval in plan mode. A **light** run prints it as a pre-flight and goes straight on to Phases 5 to 8, since `obsidian-prepare-step` already settled the step with Leo. If this session already settled questions or discussed the step at length, say so and suggest starting over in a fresh one.

**Read `.claude/skills/obsidian-tech-prep/references/vault-conventions.md` first** (properties, branches, vault commits).

Git and GitHub are in scope once Phase 5 starts: this skill creates branches, commits, pushes and opens draft PRs on the GitHub repo behind `origin` (`gh repo view --json nameWithOwner`) without asking. Never stash, never force-push without confirmation, never rewrite pushed commits, and check a PR is open before pushing to it. Tracked vault edits (the milestone) are committed separately from code, as the conventions say, with messages `implement-step: <Project> step <N> …`, on the step's branch. `vault/Plans/` is git-ignored: step and master notes are edited on disk and never committed or pushed.

The repo is a single checkout: `/home/leo-carpentier/dev/choreganizer`. Obsidian has its vault open there, so work there and nowhere else, unless `git worktree list` shows the step's branch already checked out in another worktree (then ask).

## Phase 1 — Resolve the step

1. Find the step note: a name or path; a number plus a project (ask if several plans have that step); or the note whose `branch:` property is the current branch.
2. Read from disk the step note and the master in full, the `D<n>` decisions the step cites (and their Decision notes), the `Project/` sections it links, and the `Provides` of the steps it `Consumes` from. Never work from an in-context copy.
3. Read its properties: `branch`, `base`, `stack`, `status`, `prepared`, `pr`.

## Phase 2 — Gate: the step must be prepared

First, the repo itself: if `git -C /home/leo-carpentier/dev/choreganizer rev-parse` fails or there is no `origin` remote, this is [[M0 Skeleton]]'s repo setup. Ask Leo before anything: `git init -b master`, a first commit of what is already there (the vault without `vault/Plans/`, `.claude/`, `CLAUDE.md`, `.gitignore`), then `gh repo create Choreganizer --private --source . --push`. Creating the GitHub repo is outward-facing: run it only on his explicit OK, then continue with the step on a branch off that first commit.

`git -C /home/leo-carpentier/dev/choreganizer fetch origin`, then look for any of these:
- `status` is `light`, or `Changes`, `Tests` or `Verification` still holds the placeholder `_Detailed when the step starts…_`.
- A master ❓ item not struck through that names this step, a `Risks / open points` line pointing to one or saying "settle before…", a `Changes` item that hedges ("A or B", "TBD", "?"), a Decision note it relies on still `status: open`.
- The base branch, or the branch of a step this one depends on, is not on `origin`.
- A `Consumes` line that no longer matches the code on the base.

If any is found, list them and stop: tell Leo to run `/obsidian-prepare-step <N> <Project>` in another session, then come back to a fresh one. Don't settle them here.

## Phase 3 — Branch, base and stack target

Decide all of these now, read-only. They go into the plan.

1. **Branch state.** `git branch --list <branch>`, `git ls-remote --heads origin <branch>`, `gh pr list --head <branch> --state all --json number,state,baseRefName,url`.
   - PR merged: stop, the step is shipped (suggest `/obsidian-step-done`).
   - PR closed: ask.
   - PR open, or commits on the branch already: resume. Diff `origin/<base>...<branch>` (excluding `vault/`) against the step's `Changes`, and plan only what is missing.
2. **Base.**
   - `master`: the base is `origin/master`.
   - An earlier step's branch: check its PR. Open: the base is `origin/<parent-branch>`. Merged: the base is `origin/master`, and the plan lists it under `Differs from the step note`, with a `base:` property change.
3. **Working tree.** `git status --porcelain`.
   - Changes only under `vault/` are Leo's vault edits: they don't block. They carry over the branch switch and go into the first vault commit as a checkpoint.
   - Any other change: ask. Never switch with unrelated code changes, never stash.
4. **Branch command**, run in Phase 5:
   - New branch: `git switch -c <branch> origin/<base>`.
   - Remote only: `git switch -c <branch> --track origin/<branch>`.
   - Local: `git switch <branch>`.
5. **Stack target.**
   - Base `master`: plain PR, no link. A later step will stack on it.
   - Base is a parent step: get the parent's PR number. If `gh pr list --base <parent-branch> --state open` returns a PR that is not this step's, the parent sits mid-stack: ask, because stacks are strictly linear. Otherwise the target is `gh stack link <parent-pr> <branch>`, which joins the parent's stack or creates one.
6. **PR basics.** Label: `gh label list`, then `enhancement` for `feat/`, `bug` for `fix/`, none when nothing fits.

## Phase 4 — Load context and write the plan

1. Read the root `CLAUDE.md`, `README.md`, `package.json` (its scripts are the verification commands) and `nuxt.config.ts`.
2. Read the gh-stack skill when the step stacks: `~/dev/leexi-ai/leexi/.claude/skills/gh-stack/SKILL.md` (if missing, `gh stack --help`).
3. Read the code each `Changes` item touches, on the base (`git show origin/<base>:<path>`, or in the checkout if it is already on the branch), and the code the step mirrors (an existing route under `server/api/`, an existing page, the Nuxt UI component it reuses).
4. Write the plan. The step note stays the source of truth for **what** is built; the plan says only what the step note doesn't, and points to step items instead of restating them:
   - **Setup:** branch (new | resume: what exists), base, branch command, PR target, label. One line each.
   - **Commits**, in dependency order. Each one is a logical unit a reviewer can read on its own and carries its own tests: e.g. schema change + generated migration, then the server util + its tests, then the route with its Zod schema, then the screen. Neither one commit for the whole step nor one per file. For each: message, the step's `Changes` / `Tests` items it covers, and the files it touches only when the step doesn't name them.
   - **Differs from the step note:** each place where the code or the base makes the plan depart from the step (a path moved, a signature changed, an extra file is needed, the base changed), with the `## Deviations` line it will get. `None` when nothing differs.
   - **Vault edits:** only when this is the plan's first step (master and milestone `status: in-progress`). The step's own status, ticks and `pr:` are routine (Phases 5 and 8): don't list them.
   - **Verification:** only commands beyond the step's `Verification` and the Phase 7 list.
   - **Uncertain:** anything the step and the code don't settle (see Phase 6), with your recommendation. Ask these with AskUserQuestion before going on, in either mode.
5. Pick the mode. **Full** when the session was started in plan mode, Leo asked for it, or any of these holds:
   - Phase 3 resumes an existing branch, or the base differs from the step's `base:`.
   - The code changed since the step was prepared: `git log origin/<base> --since=<prepared> --oneline -- <paths from Changes>` is not empty. No `prepared:` property counts as changed.
   - `Differs from the step note` or `Uncertain` is not empty after the questions are answered.
   - The step adds a migration, changes authorization (Better Auth config, `requireUser` / `requireMembership`, a permission), adds a dependency, or touches the deploy setup (Vercel, env vars, CI).

   Otherwise **light**.
6. **Full:** if the session is not in plan mode, EnterPlanMode, then ExitPlanMode with the plan. Leo approves, usually choosing auto mode, or sends it back with edits. **Light:** print the plan under `Pre-flight`, with one line saying no full-mode trigger was hit, and go on to Phase 5 without waiting.

## Phase 5 — Implement

1. Run the branch command. First vault commit: Leo's pending tracked vault edits (checkpoint, if any), then the milestone's `status: in-progress` when it was `todo`. Message `implement-step: <Project> step <N> started`. On disk (not committed): the step's and master's `status: in-progress`, and each `Differs from the step note` line appended to the step's `## Deviations`.
2. Build exactly the step's `Changes` and `Tests`, in the planned commit order. The step note is the checklist: tick its `Changes` and `Tests` boxes as they land (on disk only).
   - Nothing listed in `Not in this step`. No adjacent refactor. No migration other than the ones the step lists, and never edit an applied migration.
   - Migrations are generated by Drizzle Kit from the schema, never written by hand; Better Auth's tables come from its CLI.
   - Every route checks authorization on the server ([[API#Authorization, in one helper]]): `requireMembership` on the row's `apartment_id`, `done_by` from the session ([[Log only for yourself]]). A route that trusts an id from the client is a bug, whatever the step says: stop and ask.
   - The logging path stays at two taps on a phone ([[Home]]). A change that adds a tap, a required field or a wait there: stop and ask.
   - User-facing text is French ([[UI language]]).
   - Every `Provides` line must hold in the code exactly as written: signature, type, table, column, route, JSON shape, component props. Later steps grep for them.
   - Comments only for a non-obvious why. Match the surrounding code and `@nuxt/eslint`.
3. **Commits.**
   - Message: imperative and specific, following `git log origin/master --no-merges -20` (e.g. `Add rooms to apartment settings`). A body only when the why isn't obvious. End with the attribution trailer the environment asks for.
   - Code commits never include `vault/` files, and vault commits never include code: commit with explicit paths.
   - Fixing the latest commit: `git commit --amend --no-edit`. Fixing an earlier one: `git commit --fixup=<sha>`, then before pushing `GIT_SEQUENCE_EDITOR=: git rebase -i --autosquash origin/<base>`. If a rebase is refused, leave the fixups and report it under "Blocked on me".
   - Never: `wip`, `fix test` or `lint` commits; `git stash`; `reset --hard`; rewriting pushed commits; force-pushing.

## Phase 6 — Questions during implementation

Stop and ask Leo (AskUserQuestion, context `path:line` or `[[Note#Heading]]`, options, recommendation first) when the step and the master don't settle something that would change:
- a `D<n>` decision or a `Provides` line,
- the data model, a route, a JSON shape, a status code or a permission,
- a product rule or limit (when the `Project/` notes are ambiguous, never pick silently),
- user-visible behaviour, the tap count on the logging path, or French copy,
- scope: the work spills into `Not in this step`, or needs something the step doesn't list (a migration, a dependency, an env var),
- or when the code contradicts the step (a `Consumes` signature differs, a cited file moved).

Commit the finished logical units before asking. When an answer departs from the step, append the `## Deviations` line to the step note right away (on disk: `Plans/` is not committed). If the answer also changes a tracked note (a Decision note), commit that one (`implement-step: <Project> step <N> deviation`).

Decide everything else yourself: private naming, test layout, small helpers inside the step's files. List those under "Found" at the end.

## Phase 7 — Verify

Run from the repo root, and keep the result lines:
- every command in the step's `Verification` section,
- always: the lint, typecheck and test scripts of `package.json` (the ones CI runs),
- after a schema change: the Drizzle Kit generate script again, which must add nothing new once committed, and the migrate script against the local database,
- after a page, component or CSS change: look at the page in the browser pane at phone width (`docker compose up -d`, the migrate script, `npm run dev`, then http://localhost:3000), signed in; for anything shared between members, check it from a second user too.

Fix failures caused by the change, inside the commit they belong to. A failure that already happens on `origin/<base>`: check it there, leave it alone, report it under "Found". If the step's manual check can't be run here (no DB, no second user, a hosted service only), say so. Never claim it passed.

Then check the history: `git log --oneline origin/<base>..<branch>` matches the commit plan with no leftover fixup; `git diff --stat origin/<base>...<branch> -- . ':!vault'` holds nothing from `Not in this step`.

## Phase 8 — Push, open the PR, hand over

1. `git status` is clean and every `Changes` / `Tests` box is ticked, or the gaps are stated in the report.
2. Existing PR: `gh pr view <branch> --json state` must be `OPEN` before pushing.
3. Write the title and body following `.claude/skills/write-pr-description/SKILL.md`, in a file under the session scratchpad. Its How to test is the step's manual pass, or its closest real check when the app can't show the step yet.
4. Open the PR, as decided in Phase 3:
   - **Against master:** `git push -u origin <branch>`, then `gh pr create --draft --base master --head <branch> --title "<title>" --body-file <file> --assignee @me [--label "<label>"]`.
   - **Stacked:** `git push -u origin <branch>`, then `gh stack link <parent-pr> <branch>`, which creates the draft PR, then `gh pr edit <number> --title "<title>" --body-file <file> --add-assignee @me [--add-label "<label>"]`.
   - **Existing PR:** push only. Update the body with `gh pr edit` only if it no longer matches what is pushed.
5. Final vault edit, on disk: the ticked checklist, `status: in-review`, `pr: <url>`. Nothing to commit or push unless a tracked vault note changed.
6. `git branch -vv`: the branch must track `origin/<branch>` (fix with `git branch --set-upstream-to=origin/<branch> <branch>`). Check `gh pr view <branch> --json url,isDraft,baseRefName,labels,state`.

End with three headings:
- **Blocked on me**: open questions, failing checks, a rebase or force-push held back, a manual check not run.
- **Changed**: the PR URL (draft, base), `git log --oneline origin/<base>..<branch>`, each verification command with its result line (failures verbatim), and the step note lines touched.
- **Found**: choices made without asking, places where the code differs from the step but no deviation was logged (what, why, what it affects), and issues noticed outside the step and left alone.

Then suggest `/obsidian-step-done` to reconcile the plan, and `/obsidian-prepare-step` for the next step, each in its own session.
