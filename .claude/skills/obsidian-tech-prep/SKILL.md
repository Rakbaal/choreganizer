---
name: obsidian-tech-prep
description: Turn a Choreganizer milestone note (Roadmap/Milestones/M0…M4) into a validated technical spec, the "tech prep", written as a note in the Obsidian vault at vault/Plans/<Project>/. Explores the vault (milestone, Project design notes, decisions) and the Nuxt code, drafts the note, iterates on Leo's edits in Obsidian, and marks it validated on his go-ahead. Use when asked to prepare or review a tech prep for choreganizer, to "tech prep M2", "spec this milestone", or /obsidian-tech-prep. The Obsidian counterpart of the Leexi tech-prep skill; not for Notion cards.
argument-hint: "[milestone note name or path | 'current milestone'] [optional: subset of its tasks] [optional: project name]"
---

# Tech prep of a milestone, in the Obsidian vault

Input: $ARGUMENTS

This is a **workflow, not a one-shot answer**. It works like plan mode: gather context, write the tech prep note in the vault, iterate on it with Leo until the open questions are gone, then mark it validated on an explicit go-ahead. The note lives in the vault from the first draft, because Leo reviews in Obsidian; `status: draft` is what keeps it from counting as decided.

The finished artefact is `vault/Plans/<Project>/<Project> tech prep.md`: every mechanism grounded in existing code (real files, real types) and in the vault's design notes, decisions separated from open questions, scope kept minimal with an explicit out-of-scope list.

**Read [references/vault-conventions.md](references/vault-conventions.md) first.** It defines the folder layout, properties, note format, which vault notes outside `Plans/` may be edited, and the vault commit rules. They apply to every phase below.

## Inputs

- **Required**: a milestone note in `vault/Roadmap/Milestones/`. "The current milestone" means the one with `status: in-progress`; if none, the first `todo` one in order; if that is ambiguous, list them with their status and ask.
- **Optional**: a subset of the milestone's tasks. When Leo names some tasks, the project is `<Mx> <subset>` and the rest goes to *Out of scope*. When the milestone has several independent task groups (M1: apartments, rooms, invites) and he named none, ask whether to prep it whole or one group. One tech prep per milestone or subset, never one for the whole roadmap.
- **When a source is unavailable** (a library's docs unreachable, a web search returning nothing), don't work around it silently and don't invent what it would have said. Say which source you could not reach, continue, and record the gap as an open question or a design risk. Only the milestone note is load-bearing enough to stop for.

## Phase 1 — Gather

Do this before writing a line of spec. A tech prep that reuses an existing mechanism or an already-made decision beats one that invents a new one, and you can only reuse what you found.

1. **The milestone** (the equivalent of a Notion card). Read the whole note: its `## Tasks` and `## Done when` are Leo's scope, and you must not rewrite them. Read the previous and next milestones (`previous:` / `next:` properties) too: they mark where the scope ends, the way a sibling card does.
2. **Existing tech prep.** Check the milestone's `tech-prep:` property and `vault/Plans/` for a folder of that project. If one exists, stop and ask: a fresh prep that replaces it, a revision, or a review. Whatever the answer, read it: it records decisions the milestone note doesn't.
3. **Intent and constraints, from the vault** (the equivalent of the product calls). Follow every `[[link]]` in the milestone, then read what applies:
   - [[Home]] always, for the one product rule (logging takes two taps on a phone).
   - `Project/`: [[Scope]], and the design notes the milestone touches: [[Data model]] (schema, server-enforced rules, feed query), [[API]] (routes, authorization helper, log creation), [[Screens]], [[Implementation details]] (pages, permissions, auth, invites, validation, archiving, ops), [[Stack]], [[Open questions]].
   - `Decisions/`: every note the milestone links, and every `status: open` or `recommended` one in its `area`. A decided note is a constraint; an open one the milestone needs is an open question of this prep, linked.
   - `Roadmap/`: [[Roadmap]] (what testing pays off) and [[Post-MVP]], which tells you what is deliberately deferred.

   When two notes disagree (milestone vs a decision, [[Screens]] vs [[Implementation details]]), say so in the draft instead of quietly picking one.
4. **Work already in flight.** If the repo exists (vault conventions, *Before the repo exists*): `git -C /home/leo-carpentier/dev/choreganizer fetch origin`, then `git branch -a` and `git log origin/master --oneline --grep <keyword>`. Part of a "new" milestone may sit on an unmerged branch. For [[M0 Skeleton]] there is no code yet: say so and ground the prep in [[Stack]] and the library docs.
5. **The codebase.** Grep for the obvious substrate first, then delegate broad mapping to an Explore agent only for what grep did not answer. Name exact files and types for every mechanism you rely on. Then follow the checklist of the target:
   - Server routes, schema, auth, migrations (`server/`) → [references/server.md](references/server.md)
   - Pages, components, client behaviour (`app/`) → [references/app.md](references/app.md)
   - Infra work (repo setup, docker compose, CI, Vercel, the hosted database) → no checklist: say so and ground it in [[Stack]], [[Hosting]], [[Implementation details#Ops]] and the vendor docs.

   A full-stack milestone reads both and slices the PR stack vertically (route + screen together), not by layer.
6. **External references** the milestone needs (Better Auth, Drizzle, Nuxt UI, Vercel, Neon or Supabase, `@vite-pwa/nuxt`): read the docs before designing, and put each link in the Sources callout. For a hosted service, the limits are part of the spec: free-tier caps, cold starts, connection pooling from serverless functions, the restore window. A constraint that can kill the approach belongs near the top of the note.

## Phase 2 — Draft in the vault

1. Make the checkpoint commit (vault conventions, *Git*).
2. Write `vault/Plans/<Project>/<Project> tech prep.md` in the format below, with `status: draft`. If `vault/Plans/Plans.base` is missing, copy it from [references/Plans.base](references/Plans.base).
3. Add the `tech-prep:` property and the `Tech prep: [[…]]` line to the milestone note. Nothing else in it.
4. Project-wide decisions this prep proposes get a Decision note with `status: recommended` (vault conventions, *Notes outside `Plans/`*).
5. Result commit: `tech-prep: <Project> round 1`.

Then hand over: the note's name (`[[<Project> tech prep]]`), the headline design choice in one or two sentences, the numbered open questions, the vault notes touched outside `Plans/`, and the commit SHA (if a tracked note was touched). Don't paste the note into chat: Leo reads it in Obsidian.

## Phase 3 — Iterate

Leo reviews in Obsidian: he rewrites lines, deletes sections, answers under the open questions, leaves `%% comments %%`.

On every round: make the checkpoint commit (so `git show` of it is exactly his review), **re-read the note from disk**, reconcile his edits with your next revision, and never regenerate the note from your in-context copy. Treat an edited line as a decision, not a suggestion. End with the result commit `tech-prep: <Project> round <N>`.

Each round should shrink the ❓ section. When a question is answered, strike it through, record the decision, and move its substance into the body where it belongs. The tech prep is ready when nothing in ❓ blocks a first PR.

## Phase 4 — Validate

Only on an explicit go-ahead ("validate it", "it's good", "go"). This replaces the Leexi "publish to Notion" phase.

1. Checkpoint commit, re-read the note from disk.
2. If a ❓ item still blocks the first PR, list it and ask whether to validate anyway.
3. Set `status: validated` and `date` to today.
4. Decision notes this prep created or updated move from `recommended` to `decided` (or stay `recommended` where Leo said so). Tick the `Project/Open questions.md` items the prep settled, linking the note.
5. Result commit: `tech-prep: <Project> validated`.

Report the SHA and every note touched outside `Plans/`, then suggest the next stage: `/obsidian-implementation-plan [[<Project> tech prep]]`.

Changing the milestone's `status`, `done-when`, Tasks or Done when each needs its own explicit ask.

## Output format

One note, concise: bullets over prose, one line per field or decision, `###` subsections when a section grows. A reader should be able to read it once and start the first PR. Verbosity is a real failure mode: if a sentence doesn't change what someone builds, cut it.

```
---
type: tech-prep
status: draft
milestone: "[[M2 Tasks]]"
date: YYYY-MM-DD
tags:
  - tech-prep
---

# M2 Tasks — tech prep

Part of [[M2 Tasks]] · Plan: _not yet_

> [!info] Sources
> - one line each, every one a link: the milestone, the Project notes, the decisions, branches in flight, library docs

<one short paragraph: the general design choice and why>

## What already exists / Data model     — whichever the milestone turns on
## <mechanism sections>                  — how it wires into existing code and design notes, per concern
## <surface sections as needed>          — routes, screens, the quick-log flow, hosting constraints
## Validations and limits                — caps, formats, decided values with their rationale
## PR stack                              — numbered list, see below
## 🔭 Out of scope                        — deferred items, one line each, where they'll land
## ❓ Open questions                      — numbered; strike through and record the decision once settled
```

When the plan exists, its skill replaces `Plan: _not yet_` with the link.

**Adapt the middle sections to the milestone.** The headings are a menu, not a form. M0 turns on the setup and hosting constraints; M1 and M2 on tables, routes and authorization; M3 on the quick-log flow, the feed query and the tap count; M4 on the PWA and empty states. Leading with a "what already exists, don't rebuild" table is often the most useful opening. Drop sections that would be empty.

**PR stack format.** A numbered list, one entry per PR, each independently mergeable:

```
1. **<PR title>** — `feat/<slug>` — one short sentence on what it contains.
```

Branch names follow the vault conventions (*Branches*). Tests belong inside each slice, never in a final "tests" PR, and only where they pay off ([[Roadmap#Testing that pays off here]]): the log-creation rules, `requireMembership`, and the one Playwright happy path.

**Don't estimate effort.** No days, no T-shirt sizes. Describe what each slice contains and let Leo size it.

**A mermaid diagram earns its place** when a flow has several actors or a non-obvious sequence (tap → optimistic UI → `POST /logs` → validation → transaction → toast with Undo, or invite link → sign-up → redirect back → accept). One good diagram replaces a paragraph nobody reads.

Style rules:

- Write in English. User-facing text stays in French ([[UI language]]), in quotes.
- Every mechanism cites the file or type it builds on, and every rule the vault section it implements (`[[Data model#Rules the server must enforce]]`, `[[Room-specific logs need a room]]`). When something is not on `master` (an unmerged branch, a helper a previous milestone will add), say so.
- Keep the two standing rules visible in the design: the two-tap logging rule ([[Home]]), and authorization on the server for every route ([[API#Authorization, in one helper]]). A route that trusts an id from the client, or a logging path with a third tap, is a bug in the spec.
- Cross-reference sections by heading link (`[[#API]]`), not by number.
- Prefer "nothing new: mechanism X already covers this" over designing anything.
- Spec the minimum the milestone asks for. Every extra goes to *Out of scope* (often [[Post-MVP]]) or an open question, never into the design.
- State decisions with their rationale; flag arbitrary limits and what would remove them later.
- Versioned scope (MVP / later): spec the MVP fully, one line per later version in *Out of scope*.

The `references/` files are reference material, not skills, so only `SKILL.md` carries front matter.
