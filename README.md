# Choreganizer

A shared chore log for two people: who did which chore, in which room, when. The design and the plan live in the Obsidian vault: start at [vault/Home.md](vault/Home.md).

## Prerequisites

- Node 24
- pnpm, the version pinned in `package.json` (`packageManager`): `corepack enable` picks it up. Without corepack, `npm install -g pnpm@<that version>`.

## Run locally

```bash
pnpm install
pnpm dev
```

The app runs on http://localhost:3000.

## Scripts

| Script | What it does |
| --- | --- |
| `pnpm dev` | Dev server with hot reload |
| `pnpm build` | Production build into `.output/` |
| `pnpm lint` | ESLint (`@nuxt/eslint`) |
| `pnpm typecheck` | `nuxt typecheck` (vue-tsc) |
| `pnpm test` | Vitest, once |

CI runs `lint`, `typecheck` and `test` on every pull request and on pushes to `master`.
