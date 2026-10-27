---
name: obsidian-implementation-plan
description: Turn a validated Choreganizer tech prep note into an implementation plan inside the Obsidian vault — a master note that reviews the tech prep and explains how it will be built, plus one note per step, each step being a branch grouped into small stacks that merge into master on their own. Written to vault/Plans/<Project>/. The input is a tech prep note, a milestone note (its tech-prep property), or a Claude Code plan-mode plan. Use when asked to "plan the implementation", "break this tech prep into steps / branches / PRs", or /obsidian-implementation-plan in choreganizer. Not for writing the tech prep (use obsidian-tech-prep) or running a stack (gh-stack).
argument-hint: "[tech prep note | milestone note | ~/.claude/plans/<slug>.md | session ID] [optional project name]"
---

# Implementation plan from a tech prep, in the Obsidian vault

Input: $ARGUMENTS

The tech prep says **what** to build and which mechanisms to reuse. This plan says **in which order, on which branches, and how each piece ships**. Its purpose is to make sure nothing in the tech prep gets missed, and that every merge leaves `master` working.

Like the tech prep, this is a **loop, not a one-shot answer**: gather, write the notes, hand them over, iterate on Leo's edits in Obsidian. Don't create branches or PRs: the plan describes the branches and Leo decides when to cut them. Vault commits are the exception (vault conventions, *Git*).

**Read `.claude/skills/obsidian-tech-prep/references/vault-conventions.md` first.** It defines the folder layout, properties, note format, the notes outside `Plans/` you may touch, and the vault commit rules.

## Output location

`vault/Plans/<Project>/`, next to the tech prep:

```
<Project>/
    <Project> tech prep.md          # already there (obsidian-tech-prep)
    <Project> master.md
    Steps/
        <Project> step 1.md
        <Project> step 2.md
```

- `<Project>` is the tech prep's folder name. For a Claude session plan, name it from the plan's H1 and the milestone it serves.
- If `<Project> master.md` already exists, stop and ask: revise it, replace it, or another name.
- Number steps globally across the plan (step 1 … step N), in merge order. The stack a step belongs to is its `stack:` property, not part of its name.

## Phase 1 — Gather

1. **Read the tech prep in full.**
   - **Tech prep note**: read it and its milestone note. The milestone's Tasks and Done when are the scope the coverage check runs against. Follow the Sources callout to the `Project/` notes and Decision notes it cites.
   - **Milestone note**: resolve its `tech-prep:` property. If it has none, stop: there is nothing to plan from, suggest `/obsidian-tech-prep`.
   - **Claude session plan** (what plan mode writes, `~/.claude/plans/<slug>.md`, where the slug is random words). Resolve it from a path or bare slug; from a session ID with `grep -m1 -o '"slug":"[^"]*"' ~/.claude/projects/*/<session-id>.jsonl`; or from "this session's plan" via the "Exited Plan Mode" / "Plan File Info" reminder in context (if none, show `ls -t ~/.claude/plans | head -5` with each H1 and ask). Treat it as the tech prep: its Context is the intent, its decisions are what the recap traces, its "to confirm" items are open questions. Never edit it; copy it into the project folder as `<Project> source plan.md` (with `type: source-plan` properties) in round 1, so the coverage table has a stable source.
   - `status: draft` on the tech prep: say so and ask whether to plan anyway. If it still has blocking ❓ items, plan only the decided parts, and record each undecided part as an open question naming the steps it blocks.
2. **Check the tech prep against the code as it is today.** `git -C /home/leo-carpentier/dev/choreganizer fetch origin`, then on `origin/master` (before the repo exists, vault conventions say what to skip; only the vault drift check applies):
   - Every file, type and function the tech prep cites: does it still exist with the same shape? Grep a handful; for a long list, delegate to an Explore agent and spot-check what it reports.
   - Branches in flight: `git branch -a` and `git log origin/master --oneline --grep`. Is part of it merged or sitting on an unmerged branch? Does it rely on a previous milestone that isn't merged?
   - Vault drift: Decision notes or `Project/` notes edited since the tech prep's `date` (`git log --since=<date> -- vault/Decisions vault/Project`; before the repo exists, compare file modification times).
   - Label every finding **VERIFIED** (with `path:line`, command output or commit) or **HYPOTHESIS**. Only verified gaps go into the plan as facts.
3. **Read the repo conventions**: root `CLAUDE.md`, `README.md` and `package.json` (its scripts are the verification commands) once they exist, and the gh-stack skill's design notes when available (`~/dev/leexi-ai/leexi/.claude/skills/gh-stack/references/stack-design.md`). Repo rules win over this file.

## Phase 2 — Slice into stacks and steps

This is the core of the skill. Get the shape right before writing any note.

**Vocabulary**
- **Step** = one branch = one PR. Each step has one concern you can describe in one sentence.
- **Stack** = an ordered chain of steps, each branched on the previous one. The bottom step is based on `master`, or on a prerequisite branch when the tech prep says so.

**Rules, and why they exist**
- **Cut stacks by dependency and shipping points, not by length.** Keeping a stack up to date with master is no longer the constraint: stacks merge forward, each parent into its child bottom-up (the recipe is Leexi's `cascade-stack` skill, `~/dev/leexi-ai/leexi/.claude/skills/cascade-stack/SKILL.md`), never by rebasing. Start a new stack when the next steps don't depend on the current ones (separate stacks are built and reviewed in parallel; a single chain makes the top PR wait for every PR below it), or at a point where master works and the plan can pause. A stack of strictly dependent steps can run to five; past five, say why in the master, because the thread gets lost, conflicts compound up the chain and the top PR drifts away from master. Don't quietly pack two concerns into one step to stay under the limit.
- **Each stack merges into master on its own and leaves it working.** After it merges, lint, typecheck and tests pass, the app starts and deploys, and the deployed app shows either nothing new or a complete slice. Never a table the code reads but nothing writes, a screen calling a route that doesn't exist yet, or a button that leads nowhere. Master deploys to production on Vercel, and both of you use it: a half-wired screen on master is a broken app on your phones. This is what makes the plan safe to pause after any stack, which matters at hobby pace.
- **Each step is green against its parent.** Its own tests pass and it doesn't break what's below it. Tests go in the step that introduces the behaviour, never in a final "tests" step, and only where they pay off ([[Roadmap#Testing that pays off here]]). A screen's verification is lint + typecheck plus a manual pass at phone width.
- **Slice stacks vertically and steps horizontally.** A stack is a thin vertical slice of value ("you can add a room and see it in settings, end to end"). Inside it, steps follow the dependency order (schema + migration → server helper → route → screen). Avoid "Stack 1 = all server, Stack 2 = all screens".
- **Foundational, risky or contested work goes first**, so the riskiest assumption is tested on the smallest merge: auth and `requireMembership`, the log-creation rules, a hosted-service integration (Better Auth on Vercel, the database from serverless functions), the mechanism the tech prep flagged as a design risk.
- **Say whether stacks depend on each other**: "needs Stack X merged" (branch from fresh master once it lands) or "independent, can start off master now".
- **Reuse the tech prep's PR stack** when it has one: keep its branch names and order unless checking the code showed a reason to change them, and record the change and its reason in the master.

Don't estimate effort: no days, no T-shirt sizes.

## Phase 3 — Write the notes

Checkpoint commit first. Then write the master from [references/master-template.md](references/master-template.md) and one note per step from [references/step-template.md](references/step-template.md). Read both templates before writing.

What makes the plan worth having:
- **Coverage.** The master's coverage table maps every requirement, decision, validation and limit of the tech prep, and every Task of the milestone it covers, to the step that implements it, or to *Out of scope* / *Dropped* with a reason. Go through the tech prep heading by heading, not from memory. An unmapped line is something being missed.
- **One place per decision.** Every decision, contract, validation and limit in the master's recap carries an ID (`D1`…`Dn`). Steps cite the ID and a few words instead of copying it. A project-wide decision also links its Decision note (`**D3** [[Optimistic logging]] — …`), so the vault and the plan never hold two versions of it.
- **Steps readable with the master alone.** A fresh session should be able to open a step note plus the master and implement it without re-reading the tech prep.
- **Explicit contracts between steps.** Each step lists what it `Provides` (TypeScript signatures, Drizzle tables and columns, Zod schemas, server utils, routes and JSON shapes, migrations, components, test helpers) precisely enough to grep, and what it `Consumes` from earlier steps. `/obsidian-step-done` checks these to find which later steps a drift reaches.
- **Detail just in time.** Write `Changes`, `Tests`, `Verification` and `Standalone check` only for the first step of each stack that can start now, and give that step `status: ready` and `prepared: <YYYY-MM-DD>` if nothing blocks it. Later steps stay `status: light`: their checklist is written by `/obsidian-prepare-step` against the code earlier steps really produced.
- **Grounded changes.** Every change names the file path and the existing type or mechanism it builds on, and every rule the vault section or Decision note it implements. Mark what isn't on `master` yet.
- **Explicit boundaries.** Each step says what it leaves to later steps.

Also: set the master's `status: draft`; add the `plan:` property and `Plan: [[<Project> master]]` link to the milestone note, and replace `Plan: _not yet_` in the tech prep's navigation line.

Style: English, bullets over prose, one line per decision. Cross-reference by step link (`[[<Project> step 3]]`) and heading link. A mermaid diagram only where a flow isn't obvious from the text.

## Phase 4 — Hand over and iterate

A round is done when every tech prep line has a row in the coverage table, every step in the master's stack tables has its note, and the result commit `plan: <Project> round <N>` is made. Run Phases 1–3 through without stopping, except for the cases named above.

Give Leo, in this order:
- the numbered open questions, each with the steps it blocks,
- anything from the review that changes the tech prep: stale references, gaps, reordered PRs,
- a summary of how the job was split, drawn from the master's Approach and Stacks sections, so Leo can challenge the slicing without opening the notes:
  - the overall choice in one or two sentences: how many stacks, in which order, and why (riskiest first, which vertical slice each one delivers),
  - per stack: its one-sentence slice, its base and dependency (independent, or needs Stack X merged), and what master looks like after it merges (not wired up, slice live),
  - per step: number, branch name and its one-sentence concern,
  - any departure from the tech prep's PR stack, with the reason,
- the notes touched outside `Plans/`, the master's name (`[[<Project> master]]`), and the round's SHA (`git show <sha>`).

Don't paste the notes into chat: Leo reads them in Obsidian, where `Plans.base` lists the steps.

On every later round: checkpoint commit first (so `git show` of it is exactly his review), **re-read the notes from disk**, treat his edits as decisions, never regenerate a note from an in-context copy. If a change touches the slicing, update the master's stack and coverage tables and renumber step notes if needed (renaming a note: update every `[[link]]` to it, including `plan:` and the navigation lines), so the master and the steps never disagree.

When asked to go further, hand over to `/obsidian-prepare-step` for the first step that isn't `ready`, or straight to `/obsidian-implement-step` in a fresh session when step 1 is `ready` (it asks for approval in plan mode only when the step is stale or risky). This skill stops at the plan.

During implementation, agreed deviations go into the step's `## Deviations` log as they happen (global CLAUDE.md rule). When a step is done, `/obsidian-step-done` reconciles the plan with the branch.
