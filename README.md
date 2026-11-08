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
pnpm db:seed   # optional: test users and an apartment
pnpm dev
```

The app runs on http://localhost:3000. Postgres 18 runs in Docker on port 5433 (not 5432, often taken by a system Postgres), with its data in the `postgres-data` volume.

`pnpm db:seed` (re)creates « Appartement de test » with two accounts, password `choreganizer`: `alice@example.test` (owner) and `bob@example.test` (member), five rooms (Cuisine, Salon, Salle de bain, Chambre, Entrée), three tasks (« Passer le balai » everywhere every week, « Nettoyer les vitres » in Cuisine and Salon every month, « Sortir les poubelles » everywhere as needed), three logs (Alice « Passer le balai » yesterday at 20:00, Bob « Nettoyer les vitres » in Cuisine and Salon 3 days ago, Alice « Sortir les poubelles » 2 hours ago), and one unused invite valid 7 days: open http://localhost:3000/join/invitedetest in a private window and create a new account to join as a member. It only runs against `localhost`, and running it again resets those rows.

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
| `pnpm db:seed` | Reset the local test users and apartment (refuses any non-local `DATABASE_URL`) |
| `pnpm db:auth-schema` | Regenerate Better Auth's tables (`server/database/schema/auth.ts`) after changing its config in `server/utils/auth.ts`, then the migration |

CI runs `lint`, `typecheck` and `test` on every pull request and on pushes to `master`.

## Tests

`pnpm test` runs Vitest against a real Postgres: the `choreganizer_test` database in the same Docker container, never the dev one. Each run applies the migrations to it and truncates it.

- `TEST_DATABASE_URL` must be set in `.env` (copy the line from `.env.example`); without it the tests stop instead of touching `DATABASE_URL`.
- A fresh volume gets the database from `docker/initdb/`. For a volume created before it existed, create it once:

```bash
docker compose exec postgres createdb -U choreganizer choreganizer_test
```

CI runs the same tests against a Postgres service (`.github/workflows/ci.yml`).

## Deployment

- **Vercel** deploys `master` to production and every other pushed branch to a preview (previews sit behind Vercel's login). Functions run in `lhr1` (London), next to the database.
- **Neon** hosts Postgres 18 in London. The Neon-managed Vercel integration creates a database branch `preview/<git-branch>` for each preview and deletes it once the git branch is merged or deleted.
- The integration sets `DATABASE_URL` (pooled) and `DATABASE_URL_UNPOOLED` (direct, used by `drizzle-kit`) on every deployment: nothing to configure by hand for the database.
- The build runs `pnpm db:migrate` before `pnpm build` (`vercel.json`), so each preview migrates its own Neon branch and production migrates `production`.
- `BETTER_AUTH_SECRET` is set by hand in Vercel's environment variables, with a different value for Production and Preview.
