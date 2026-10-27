---
name: write-pr-description
description: Write a Web Wizard pull request title and description - a quick plain summary of what the PR adds, how to test it by hand in the running app (or the closest real check when there is no screen yet), and, only when they have content, the Lanterne rules it implements, the setup a tester needs first, and notes. Use when drafting, rewriting or updating a PR body in web-wizard, including from /obsidian-implement-step. Not for the Leexi repo (it has its own write-pr-description).
argument-hint: "[PR number | branch] (defaults to the current branch)"
---

# PR description for Web Wizard

Input: $ARGUMENTS

A description is a note to someone who will open the diff anyway, usually Leo reviewing his own stack days later. It answers three things the diff won't: what this PR adds and why, how to see it working, and what to check it against. The diff is the how: never narrate it.

## Shape

```md
## Context
<milestone> · step <N> of `<Project>` (the plan notes are local-only, not in the repo)

<Two or three plain sentences: what the PR adds, what it is for, and what it deliberately doesn't do yet.>

## Rules
- <Lanterne chapter § section>: <what is implemented>
- Interpretation: <where the rule was ambiguous, the choice made>

## Setup
<what to do before testing, as commands>

## How to test
1. <step, from the player's or the DM's seat> → <what you should see>

## Notes
<caveat, limit, follow-up>
```

`Context` and `How to test` are always there. The others only when they have content: no empty section, no "N/A".

### Context

- First line: where the work comes from. From a plan: `<milestone> · step <N> of \`<Project>\`` plus the local-only note, as above. Otherwise: the vault note or the reason, in a few words (`Fix for the crash on /campaigns/new with an empty title`).
- Then the summary, two or three sentences you would say out loud. Name the concrete thing (`a d20 check with success / close call / fail bands`), not the category (`dice logic`). Say what a player, the DM or later code can now do.
- Say what is not wired up yet, when it isn't: `Nothing calls it yet.`, `The screen still shows the old list until step 4.` This is what tells the reviewer master is still safe.

### Rules

Only when the PR implements or changes a game rule (engine, DM tools, prompts that drive them).

- One line per rule: the chapter and section from `vault/Lanterne/` (`Combat § Engagement`) and what the code does with it. GitHub can't open `[[wikilinks]]`: write the chapter name as plain text.
- An `Interpretation:` line for each place the Lanterne note left room and the code picked one reading, and each number the code hard-codes. These are what the reviewer checks against the rules.
- When the PR touches the LLM side: one line naming the engine tools the AI goes through to change state ([[Core principle]]: narration never changes state directly).

### Setup

Only when a tester would get a failure without it. Commands in a code block, from the repo root:

- a new migration: `make -C backend run` applies it on start; say so, and give `docker compose down -v && docker compose up -d` when existing rows would break,
- a new `.env` key: the line to copy from `backend/.env.example`, and whether a real value is needed (a paid key) or empty works,
- new dependencies: `make -C backend tidy`, `npm --prefix frontend install`,
- seed data or a specific campaign to create first.

### How to test

The manual pass, written so someone can follow it without reading the code.

- **Through the app when it can be reached.** Start from the stack (`docker compose up -d`, `make -C backend run`, `npm --prefix frontend run dev`, then http://localhost:8282) and only repeat that block when Setup doesn't already cover it. Then numbered steps from the player's or the DM's seat: the page, what to click or type, and `→` what you should see, quoting the French text on screen. Include one edge case when the PR handles one (an invalid value, an empty list).
- **API only:** a `curl` against `localhost:8181/api/...` with the expected status and the part of the JSON that matters.
- **No way to reach it from the app yet** (engine-only work, nothing wired up): give the closest real check a person can run and read: a verbose test run filtered to the cases that show the behaviour (`go -C backend test ./internal/rules/... -run TestCheck -v`), a `go run` sim, a curl. Say what to look for in the output. Then one plain line: `Not testable in the app yet: <why>, until <milestone or step>.`
- **Paid LLM calls:** say whether the pass calls the real API and needs `ANTHROPIC_API_KEY`. Prefer an offline path (the `llmfake` client, `ANTHROPIC_BASE_URL=http://127.0.0.1:9`) and say which one.
- CI runs `go vet`, `go test` and the frontend typecheck on every PR: don't list them as the test. One test command is fine when it is the closest real check.
- Only write steps that were run, or say which ones weren't (`Not run: needs a real key`). Never imply a pass that didn't happen.

### Notes

A caveat, a known limit, a follow-up, a reland, a merge-order constraint. One line each, plain prose. A follow-up that lives in the vault: name the note in plain text.

## Title

One line, imperative, specific, no trailing period, in the style of `git log origin/master --no-merges -20`: `Add dice and core roll to the rules engine`, `Align party level and lang with Lanterne`.

## Voice

- English, except quoted player-facing text, which stays in French exactly as on screen.
- Plain headings (`## Context`), no emoji, no bold-label bullets, no file list, no "This PR…" opener, no sign-off.
- Cut every sentence that restates the title or describes what the diff shows. Cut adjectives that sell (`robust`, `seamless`, `comprehensive`).
- Bare URLs for links. Stacked PRs: the stack UI shows the chain, don't list them.

## Examples

Engine-only work, nothing in the app yet:

```md
## Context
M1 Rules engine · step 1 of `M1 Rules engine` (the plan notes are local-only, not in the repo)

Starts `internal/rules`, the pure Go rules engine, with the roll primitives every later action uses: dice expressions (`2d6+1`, `1d6+PRE`), the d20 check with its success / close call / fail / crit / fumble bands, edge cancelling and contests. Nothing calls it yet.

## Rules
- Core roll § Close call, Natural 20, Natural 1: the bands of `ResolveCheck`; a natural 20 or 1 wins over the total
- Core roll § Advantage / disadvantage: they never stack, one of each cancels out
- Core roll § Contests: higher total wins, a tie goes to the resister
- Interpretation: in a contest, a natural 20 or 1 doesn't change the winner (the chapter doesn't say)
- The close-call band and the Knack bonus are tunables, not constants in the code

## How to test
```bash
go -C backend test ./internal/rules/... -run 'TestResolveCheckBands|TestEdge|TestResolveContest' -v
```
Each subtest is named after the case it covers (`two below`, `natural 20 below target`, `disadvantage keeps the lower`): read the list for the rule you want to check.

Not testable in the app yet: nothing outside `internal/rules` calls it until the fight sim of M1 step 10.
```

A change reachable in the app:

```md
## Context
M0 · step 2 of `M0 Housekeeping` (the plan notes are local-only, not in the repo)

Campaigns now accept only the levels Lanterne has (1 to 5) in the database, the API and the form, and the page declares `lang="fr"`.

## Setup
`make -C backend run` applies the new migration, which clamps any existing row above level 5 to 5.

## How to test
1. http://localhost:8282/campaigns/new → the level field stops at 5
2. Create a campaign at level 5 → it opens on its page
3. `curl -X POST localhost:8181/api/campaigns -H 'Content-Type: application/json' -d '{"title":"x","partySize":4,"partyLevel":6}'` → 400
```

## Procedure

1. Read the diff against the PR's base (`git diff origin/<base>...<branch> -- . ':!vault'`), the step note if the PR comes from a plan (its Goal, `Not in this step`, Lanterne links and Verification), and the commits' bodies.
2. Write Context, then How to test from the reviewer's seat. Run the manual pass, or the closest check, when you can, and write what you saw.
3. For Rules, Setup and Notes, ask "does the reviewer or tester lose something if this is missing?". Add only those.
4. Cut, then reread as the reviewer: in ten seconds, do they know what the PR adds, and can they see it working?

## Housekeeping

- Write the body to a file in the session scratchpad and pass it with `--body-file`. "Update the PR description" means `gh pr edit <number> --body-file <file>`, never a comment.
- Describe only what is pushed: `git status` clean and `git log origin/<branch>..<branch>` empty before writing, or leave the unpushed part out.
- New PRs: `--assignee @me`, and `--label enhancement` for `feat/`, `bug` for `fix/`, `documentation` for vault or skill work (`gh label list` for the rest).
- End the body with the attribution line the environment asks for.

## Final check

- The first three lines say where the PR comes from and what it adds.
- How to test can be followed without opening the code, and says what you should see at each step.
- When the app can't show it yet, the closest real check is there, and the "Not testable in the app yet" line says until when.
- Rule interpretations and hard-coded numbers are listed when the PR touches the rules.
- Anything a tester must do first is under Setup, as commands.
- Untested paths are stated. No empty section, no file list, nothing that only restates the diff.
