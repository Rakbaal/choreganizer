# Choreganizer

A shared chore log for two people: who did which chore, in which room, when. The design and the plan live in the Obsidian vault: start at [vault/Home.md](vault/Home.md).

## Prerequisites

- Node 24
- pnpm, the version pinned in `package.json` (`packageManager`): `corepack enable` picks it up. Without corepack, `npm install -g pnpm@<that version>`.
- Docker, for the local Postgres

## Run locally

```bash
pnpm install
cp .env.example .env   # then fill BETTER_AUTH_SECRET: openssl rand -base64 32
docker compose up -d
pnpm db:migrate
pnpm dev
```

The app runs on http://localhost:3000. Postgres 18 runs in Docker on port 5433 (not 5432, often taken by a system Postgres), with its data in the `postgres-data` volume.

## Scripts

| Script | What it does |
| --- | --- |
| `pnpm dev` | Dev server with hot reload |
| `pnpm build` | Production build into `.output/` |
| `pnpm lint` | ESLint (`@nuxt/eslint`) |
| `pnpm typecheck` | `nuxt typecheck` (vue-tsc) |
| `pnpm test` | Vitest, once |
| `pnpm db:generate` | Generate a SQL migration from the Drizzle schema (`server/database/schema/`) into `server/database/migrations/` |
| `pnpm db:migrate` | Apply pending migrations to the database in `DATABASE_URL` |
| `pnpm db:auth-schema` | Regenerate Better Auth's tables (`server/database/schema/auth.ts`) after changing its config in `server/utils/auth.ts`, then the migration |

CI runs `lint`, `typecheck` and `test` on every pull request and on pushes to `master`.

## Deployment

- **Vercel** deploys `master` to production and every other pushed branch to a preview (previews sit behind Vercel's login). Functions run in `lhr1` (London), next to the database.
- **Neon** hosts Postgres 18 in London. The Neon-managed Vercel integration creates a database branch `preview/<git-branch>` for each preview and deletes it once the git branch is merged or deleted.
- The integration sets `DATABASE_URL` (pooled) and `DATABASE_URL_UNPOOLED` (direct, used by `drizzle-kit`) on every deployment: nothing to configure by hand for the database.
- The build runs `pnpm db:migrate` before `pnpm build` (`vercel.json`), so each preview migrates its own Neon branch and production migrates `production`.
- `BETTER_AUTH_SECRET` is set by hand in Vercel's environment variables, with a different value for Production and Preview.
