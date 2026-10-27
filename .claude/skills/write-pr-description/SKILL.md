---
name: write-pr-description
description: Write a Choreganizer pull request title and description - a quick plain summary of what the PR adds, how to test it by hand in the running app (or the closest real check when there is no screen yet), and, only when they have content, the vault design it implements, the setup a tester needs first, and notes. Use when drafting, rewriting or updating a PR body in choreganizer, including from /obsidian-implement-step. Not for the Leexi repo (it has its own write-pr-description).
argument-hint: "[PR number | branch] (defaults to the current branch)"
---

# PR description for Choreganizer

Input: $ARGUMENTS

A description is a note to someone who will open the diff anyway, usually Leo reviewing his own stack days later. It answers three things the diff won't: what this PR adds and why, how to see it working, and what to check it against. The diff is the how: never narrate it.

## Shape

```md
## Context
<milestone> · step <N> of `<Project>` (the plan notes are local-only, not in the repo)

<Two or three plain sentences: what the PR adds, what it is for, and what it deliberately doesn't do yet.>

## Design
- <vault note § section>: <what is implemented>
- Interpretation: <where the notes were ambiguous, the choice made>

## Setup
<what to do before testing, as commands>

## How to test
1. <step, from a member's seat, on a phone-width screen> → <what you should see>

## Notes
<caveat, limit, follow-up>
```

`Context` and `How to test` are always there. The others only when they have content: no empty section, no "N/A".

### Context

- First line: where the work comes from. From a plan: `<milestone> · step <N> of \`<Project>\`` plus the local-only note, as above. Otherwise: the vault note or the reason, in a few words (`Fix for the 500 on /a/<id>/feed with an archived room`).
- Then the summary, two or three sentences you would say out loud. Name the concrete thing (`room chips in a bottom sheet, plus "Toute la maison"`), not the category (`logging UI`). Say what a member, or later code, can now do.
- Say what is not wired up yet, when it isn't: `Nothing links to it yet.`, `The button is hidden until step 4.` Master deploys straight to production, so this is what tells the reviewer the app on both phones is still safe.

### Design

Only when the PR implements or changes a product rule, a permission, a limit, or the data model.

- One line per rule: the vault note and section (`Data model § Rules the server must enforce`, `Implementation details § Invites`) or Decision note (`Room-specific logs need a room`), and what the code does with it. GitHub can't open `[[wikilinks]]`: write the note name as plain text.
- An `Interpretation:` line for each place the notes left room and the code picked one reading, and each limit the code hard-codes. These are what the reviewer checks against the design.
- When the PR adds or changes a route: one line on the authorization it runs (`requireMembership` on the task's apartment, owner only).

### Setup

Only when a tester would get a failure without it. Commands in a code block, from the repo root:

- a new migration: the migrate script from `package.json` against the local database; give `docker compose down -v && docker compose up -d` when existing rows would break,
- a new env var: the line to copy from `.env.example`, and whether a real value is needed or the example works,
- new dependencies: `npm install`,
- seed data, or a second user to sign up first (anything shared between members needs two accounts).

### How to test

The manual pass, written so someone can follow it without reading the code.

- **Through the app when it can be reached.** Start from the stack (`docker compose up -d`, the migrate script, `npm run dev`, then http://localhost:3000) and only repeat that block when Setup doesn't already cover it. The branch's Vercel preview URL works too once the Vercel bot has posted it. Then numbered steps from a member's seat at phone width: the page, what to tap or type, and `→` what you should see, quoting the French text on screen. Include one edge case when the PR handles one (a duplicate name, a non-member, an expired invite).
- **On the logging path:** count the taps from Home to logged, and say it (`2 taps: task, then "Terminé"`).
- **API only:** a `curl` against `localhost:3000/api/...` with a session cookie, the expected status and the part of the JSON that matters.
- **No way to reach it from the app yet** (a server util, nothing wired up): give the closest real check a person can run and read: a test run filtered to the cases that show the behaviour (`npx vitest run server/utils/membership.test.ts`), a curl. Say what to look for in the output. Then one plain line: `Not testable in the app yet: <why>, until <milestone or step>.`
- CI runs lint, typecheck and tests on every PR: don't list them as the test. One test command is fine when it is the closest real check.
- Only write steps that were run, or say which ones weren't (`Not run: needs a second account`). Never imply a pass that didn't happen.

### Notes

A caveat, a known limit, a follow-up, a reland, a merge-order constraint. One line each, plain prose. A follow-up that lives in the vault: name the note in plain text.

## Title

One line, imperative, specific, no trailing period, in the style of `git log origin/master --no-merges -20`: `Add rooms to apartment settings`, `Reject logs on archived tasks`.

## Voice

- English, except quoted user-facing text, which stays in French exactly as on screen.
- Plain headings (`## Context`), no emoji, no bold-label bullets, no file list, no "This PR…" opener, no sign-off.
- Cut every sentence that restates the title or describes what the diff shows. Cut adjectives that sell (`robust`, `seamless`, `comprehensive`).
- Bare URLs for links. Stacked PRs: the stack UI shows the chain, don't list them.

## Examples

Server-only work, nothing in the app yet:

```md
## Context
M1 Apartments, rooms, members · step 1 of `M1 Apartments, rooms, members` (the plan notes are local-only, not in the repo)

Adds the `apartments` and `memberships` tables and `requireMembership`, the check every apartment route will call first. Nothing calls it yet.

## Design
- API § Authorization, in one helper: `requireMembership(event, apartmentId)` returns the member's role, 401 without a session, 403 for a non-member
- Implementation details § Permissions: `requireOwner` on top of it, for archive, invites and removing members
- Interpretation: an archived apartment still passes the check, so its history stays readable

## Setup
```bash
docker compose up -d && npm run db:migrate
```

## How to test
```bash
npx vitest run server/utils/membership.test.ts
```
Each case is named after the rule it covers (`non-member gets 403`, `owner-only action as member`): read the list for the one you want to check.

Not testable in the app yet: no route uses it until step 2.
```

A change reachable in the app:

```md
## Context
M1 Apartments, rooms, members · step 3 of `M1 Apartments, rooms, members` (the plan notes are local-only, not in the repo)

Apartment settings now list the rooms, and members can add, rename, reorder and archive them.

## Design
- Implementation details § Validation: names trimmed, 1 to 60 characters, 409 on a duplicate active name
- Implementation details § Archiving: an archived room leaves the list but keeps its task links

## How to test
1. http://localhost:3000/a/<id>/settings at phone width, tap "Ajouter une pièce", type "Cuisine" → it appears at the bottom of the list
2. Add "cuisine" again → "Une pièce nommée Cuisine existe déjà"
3. Archive "Cuisine", then add "Cuisine" → accepted, since only active names must be unique
```

## Procedure

1. Read the diff against the PR's base (`git diff origin/<base>...<branch> -- . ':!vault'`), the step note if the PR comes from a plan (its Goal, `Not in this step`, vault links and Verification), and the commits' bodies.
2. Write Context, then How to test from the reviewer's seat. Run the manual pass, or the closest check, when you can, and write what you saw.
3. For Design, Setup and Notes, ask "does the reviewer or tester lose something if this is missing?". Add only those.
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
- Design interpretations and hard-coded limits are listed when the PR touches a rule, a permission or the data model.
- Anything a tester must do first is under Setup, as commands.
- Untested paths are stated. No empty section, no file list, nothing that only restates the diff.
