# Vault conventions for the workflow skills

Shared by `obsidian-tech-prep`, `obsidian-implementation-plan`, `obsidian-prepare-step`, `obsidian-implement-step` and `obsidian-step-done`. Read it before writing any workflow note.

- Repo root: `/home/leo-carpentier/dev/web-wizard`.
- Vault root: `vault/` inside the repo. Obsidian opens that folder, so a `[[link]]` never contains `vault/`, but every shell or file path does.
- The vault is the source of truth for planning. `docs/context.md` and `docs/roadmap.md` are an older mirror: ignore them unless Leo points to them, and mention it if they contradict the vault.

## Where workflow notes live

```
vault/Plans/
    Plans.base                          # every plan and step, by status
    <Project>/
        <Project> tech prep.md
        <Project> master.md
        Steps/
            <Project> step 1.md
            <Project> step 2.md
```

- `<Project>` is the milestone note's name (`M1 Rules engine`). When a tech prep covers only some of a milestone's tasks, use the milestone id plus the subset (`M1 Combat`). Title case with spaces, like every note in the vault. If Leo gives a name, use his.
- Obsidian resolves `[[links]]` by file name across the whole vault, so every file name carries the project name: `[[M1 Rules engine step 2]]`, never `[[step 2]]`.
- If `Plans/<Project>/` already holds the note you are about to create, stop and ask: revise it, replace it, or use another name. Overwriting a note Leo has annotated loses his work.

## Properties

Every workflow note starts with YAML properties. Links inside properties are quoted strings. Keep these keys and values exactly: `Plans.base` and the skills read them.

| Note | Properties |
|---|---|
| Tech prep | `type: tech-prep` · `status: draft \| validated` · `milestone: "[[M1 Rules engine]]"` · `date` · `tags: [tech-prep]` |
| Master | `type: plan` · `status: draft \| in-progress \| done` · `milestone` · `tech-prep: "[[M1 Rules engine tech prep]]"` · `date` · `tags: [plan]` |
| Step | `type: plan-step` · `plan: "[[M1 Rules engine master]]"` · `step: 2` · `stack: A` · `branch: feat/backend/dice` · `base: master` (or the parent step's branch) · `status: light \| ready \| in-progress \| in-review \| done` · `prepared:` (date it became `ready`, empty until then) · `pr:` (URL, empty until opened) · `tags: [plan-step]` |

Who moves `status`:

- Tech prep: `obsidian-tech-prep` writes `draft`, and `validated` on Leo's go-ahead.
- Master: `obsidian-implementation-plan` writes `draft`; `obsidian-implement-step` sets `in-progress` when the first step starts; `obsidian-step-done` sets `done` once every step is `done`.
- Step: `obsidian-implementation-plan` writes `light`, or `ready` for a step it details with nothing blocking; `obsidian-prepare-step` sets `ready`. Whichever sets `ready` also sets `prepared:` to today; `obsidian-implement-step` sets `in-progress`, then `in-review` with `pr:` once the draft PR is open; `obsidian-step-done` sets `done` only when the PR is merged.

**Finding the current step.** The step being implemented is the one whose `branch:` property equals the current git branch:

```bash
grep -rlx "branch: $(git -C /home/leo-carpentier/dev/web-wizard branch --show-current)" /home/leo-carpentier/dev/web-wizard/vault/Plans/*/Steps/
```

This replaces the global "header names the branch" rule for this repo.

## Branches

`<type>/<scope>/<slug>`: type `feat`, `fix`, `refactor` or `chore`; scope `backend`, `frontend`, `vault` or `infra`; slug in kebab-case (`feat/backend/dice-roll`). The base branch is `master`.

## Note format

Obsidian-flavoured markdown. Match the existing vault notes (`Roadmap/Roadmap.md`, `Roadmap/Milestones/M1 Rules engine.md`).

- **H1 = the note title**, then one navigation line, as in the milestone notes: `Part of [[M1 Rules engine]] · Plan: [[M1 Rules engine master]]`.
- **Vault links**: `[[Note]]`, `[[Note|label]]`, a section with `[[Note#Heading]]`, a section of the same note with `[[#Heading]]`. Cross-reference sections by heading link, never by number: numbers rot when a section moves, heading links don't (Obsidian updates them on rename).
- **Rules references**: cite the Lanterne chapter section a mechanism implements, `[[Combat#Engagement]]`. Numbers (DCs, damage, durations) come from those notes, never from memory.
- **Code references**: inline code with the repo-relative path, `backend/internal/campaign/service.go:42`. Obsidian can't open them; that's fine.
- **Sources**: a callout right under the navigation line, every entry a link:
  ```
  > [!info] Sources
  > - [[M1 Rules engine]] · [[Combat]] · [[Engine contract]]
  > - Branch `feat/backend/dice-roll` (unmerged)
  > - [Vendor API docs](https://…)
  ```
- **Open questions**: a `## ❓ Open questions` section, numbered. A settled one becomes `~~question~~ **Settled YYYY-MM-DD**: decision`.
- **Checklists**: `- [ ]` items. Leo ticks them by clicking in Obsidian, so a ticked box he set is a fact, not noise.
- **Diagrams**: ` ```mermaid ` blocks render natively. To make a node open a note, give it the note's name as label and add `class A,B internal-link;` (see `Roadmap.md`).
- Don't embed (`![[…]]`) one plan note in another: it duplicates content in reading view. Embedding a `.base` is fine.
- Nothing Notion-specific: no `<callout>`, `<mention-page>`, XML tables or tab indentation.

**Leo reviews in Obsidian.** He edits lines in place, deletes sections, ticks boxes, and leaves comments as `%% … %%` (hidden in reading view) or `<!-- … -->`. On every round: re-read the notes from disk, treat an edited line as a decision, answer each comment, then remove it and say so in the handover. Never regenerate a note from an in-context copy.

## Notes outside `Plans/`

The skills read anything in the vault. They write outside `Plans/` only for these, and list each such edit in their handover:

- **The milestone note**: the `tech-prep:` and `plan:` properties, and a line under its navigation line, `Tech prep: [[M1 Rules engine tech prep]] · Plan: [[M1 Rules engine master]]`. Its `status: in-progress` when the first step starts, and ticking a task `- [x]` once the steps covering it are merged (proposed by `obsidian-step-done`). Its Tasks and Exit text are Leo's scope: never rewrite them.
- **Decision notes** (`Decisions/`): a decision that matters beyond one plan (a stack or provider choice, an interpretation of a Lanterne rule, a cross-cutting convention) gets its own note, created from `Templates/Decision.md` with the same properties (`type: decision`, `status`, `date`, `area`). Write it `recommended` while the tech prep is a draft and `decided` once it is validated, or update an existing `open` note the same way. The plan cites it from its `D<n>` line: `**D3** [[LLM provider]] — …`.
- **`Project/Open questions.md`**: tick an item that the work settled, with a link to where.

Never edit the Lanterne chapters. A gap or contradiction in the rules is an open question; on Leo's OK it can also become a line in `Lanterne/Playtest questions.md`.

## Git: vault commits

The vault is tracked in the code repo, **except `vault/Plans/`**, which is git-ignored (`.gitignore`) and local-only: tech preps, plans and step notes are edited on disk and never committed, so they never reach a PR. The skills commit their vault edits themselves, and only the tracked ones (`Roadmap/`, `Decisions/`, `Project/`, `Templates/`). A round that touches only `Plans/` makes no checkpoint or result commit: the handover lists the notes changed, with no SHA.

- Call git as `git -C /home/leo-carpentier/dev/web-wizard …`. For vault work, use only `status`, `diff`, `log`, `show`, `add`, `commit` and `revert`. Never `reset`, `rebase`, `stash`, `push` or history rewrites. (`obsidian-implement-step` has its own rules for code commits and pushing.)
- Commits land on whatever branch is checked out. On a step's branch that is intended: tracked vault edits (a milestone status, a Decision note) ship in that step's PR.
- **Checkpoint, before the first write of a round.** If `status --porcelain -- vault/ ':!vault/.obsidian'` is not empty, those are Leo's edits from Obsidian. Commit them on their own, so his review stays separate from the skill's rewrite:
  ```bash
  git -C /home/leo-carpentier/dev/web-wizard add -- vault/ ':!vault/.obsidian'
  git -C /home/leo-carpentier/dev/web-wizard commit -m "vault: checkpoint manual edits before <skill> <project>" -- vault/ ':!vault/.obsidian'
  ```
- **Result, after the last write.** `add` then `commit -m "<skill>: <project> <what>" -- <the files written>`, with one line per file in the body. For numbered rounds, find the next N from the highest round already named in the note (`Changelog`), since `Plans/` has no git history.
- Always commit with a pathspec (`commit … -- <paths>`): it commits only those paths, so code Leo has staged stays out. Never `commit -a`, never `add -A` or `add .` at the repo root.
- `.obsidian/` settings are Leo's: leave them out of every commit (`workspace*.json` is already gitignored).
- End commit messages with the attribution trailer the environment asks for.
- Hand over the SHA of each commit made: `git show <sha>` to review it, `git revert <sha>` to undo it. For `Plans/` edits there is none: say which notes changed.
