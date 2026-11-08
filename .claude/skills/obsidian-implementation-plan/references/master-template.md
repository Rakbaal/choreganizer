# Master plan template

Note: `vault/Plans/<Project>/<Project> master.md`

The headings are a menu, not a form: drop a section that would be empty, add one if the project needs it (data migration, provider constraints). Keep **Coverage**, **Stacks**, **Open questions** and **Changelog**: they are what make the plan useful.

````markdown
---
type: plan
status: draft
milestone: "[[<Milestone>]]"
tech-prep: "[[<Project> tech prep]]"
date: YYYY-MM-DD
tags:
  - plan
---

# <Project> — implementation plan

Part of [[<Milestone>]] · Tech prep: [[<Project> tech prep]]

> [!info] Sources
> - [[<Project> tech prep]] (validated YYYY-MM-DD) · or Claude session plan `~/.claude/plans/<slug>.md`, snapshot in [[<Project> source plan]]
> - `Project/` notes, Decision notes, branches in flight, library docs. One line each, each one a link.

<One short paragraph: what ships at the end, how many steps and why.>

## Tech prep recap
A condensed but faithful summary of the tech prep, heading by heading, keeping its headings so each line can be traced back. Decisions with their rationale, mechanisms reused, validations and limits, design risks. No new design here.

Every decision, contract, validation and limit line starts with an ID, numbered across the whole recap. Step notes cite these IDs instead of copying the decision. IDs are never renumbered: a dropped decision keeps its ID and says `dropped (<date>, <reason>)`. A project-wide decision links its Decision note.
- **D1** <decision> — <rationale>
- **D2** [[<Decision note>]] — <decision in a few words>

## Review against the code
What checking the tech prep against current `origin/master` and the vault showed. Each item is **VERIFIED** (with `path:line`, commit or command) or **HYPOTHESIS**.
- Stale references: a file or type renamed, moved or deleted since the tech prep.
- Already done: parts merged or sitting on a branch.
- Gaps: things the tech prep needs but doesn't mention (a migration, an `.env.example` line, a seed-script update, French copy, a `requireMembership` call, an owner-only check). The routes of `server/api/apartments/` (once M1 is merged) are a good checklist for a new resource.
- Contradictions: tech prep vs milestone, tech prep vs a Decision or `Project/` note edited since, tech prep vs code.
- Prerequisites: previous milestones or branches that must merge first.
Write "Nothing found" rather than dropping the section.

## Implementation strategy
- How many steps and why each cut exists (use sooner, design risk, too big to review: the plan skill's Phase 2). One step is a fine answer.
- How master stays working after each step: route unused, screen not linked from the navigation, button hidden until step N. Master deploys to production, so this is what both of you see on your phones.
- Data concerns: migrations, embedded data.
- Any change from the tech prep's PR stack, with the reason.

## Stacks

### Stack A — <one-sentence slice> · base `master`
| Step | Branch | Slice |
|---|---|---|
| [[<Project> step 1\|1]] | `feat/<slug>` | <one sentence: what ships> |
| [[<Project> step 2\|2]] | `feat/<slug>` | <one sentence: what ships> |

**Master after each step merges:** <per step, what the deployed app shows or doesn't, what is wired up.>

A second stack only when Leo asked for parallel work; then say whether it is independent or needs Stack A merged, and add a mermaid diagram (labels equal to note names plus `class … internal-link;` make the nodes clickable).

## Coverage
Every requirement, decision, validation, limit of the tech prep and every Task of the milestone, mapped to where it gets done. Go through the tech prep heading by heading.

| Tech prep item (heading) | Decision | Step | Notes |
|---|---|---|---|
| <item> ([[<Project> tech prep#<heading>]]) | D3 | [[<Project> step 2\|2]] | |
| <item> | D8 | Out of scope | → [[Post-MVP]] |
| <item> | — | Dropped | <reason, from the review> |

## End-to-end verification
The manual scenario to run once the last stack is merged, usually the milestone's Done when: commands, then the walkthrough on both phones (or two browsers signed in as two users), and the Playwright happy path once it exists.

## 🔭 Out of scope
Carried over from the tech prep, plus anything this plan defers. One line each, with where it lands (a later milestone, [[Post-MVP]]).

## ❓ Open questions
Numbered. Say which step each one blocks. Once settled: `~~question~~ **Settled YYYY-MM-DD**: decision`.

## Changelog
How the plan moved during implementation, appended by `/obsidian-step-done` (newest last). Empty when the plan is first written.
- <YYYY-MM-DD> · step <N> done · <D-ids changed, a few words each> · steps <list> updated
````

`\|` inside a wikilink in a table cell is how Obsidian escapes the alias pipe; outside tables, write `[[<Project> step 1|1]]`.
