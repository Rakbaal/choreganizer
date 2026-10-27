---
tags:
  - project
  - tech
---

# Stack

Recommended: one TypeScript codebase, one Postgres database, free hosting. It's the shortest path to a deployed app for a CRUD product like this one. The framework is decided: [[Framework - Nuxt]].

| Layer | Pick | Why |
| --- | --- | --- |
| Framework | Nuxt + TypeScript | Vue front and Nitro server routes in one repo; `server/api` files map 1:1 to the [[API]] |
| Database | Postgres on Neon or Supabase (free tier) | Relational data with real constraints; the [[Data model\|schema]] runs as-is |
| ORM | Drizzle | Typed queries close to SQL, simple migrations; runs fine inside Nitro |
| Auth | Better Auth, email + password | Has a Nuxt integration; sessions and users tables out of the box |
| Validation | Zod | Same schemas for Nuxt UI forms and `readValidatedBody` on the server |
| UI | Nuxt UI (Tailwind-based) | Mobile-friendly forms, drawers, modals and toasts out of the box |
| Hosting | Vercel or Netlify | Nitro presets for both; push to deploy, preview URLs per branch. See [[Hosting]] |
| Mobile | `@vite-pwa/nuxt` | Manifest + service worker for "Add to home screen" |

## Good alternatives, if they fit better

- **nuxt-auth-utils** instead of Better Auth: lighter (sealed cookie sessions, password hashing helpers), but you own the users table and sign-up flow.
- **Prisma** instead of Drizzle: more batteries included, heavier client.
- **Supabase as the backend** (`@nuxtjs/supabase`): auth + row-level security, but authorization logic lives in SQL policies, which is harder to debug.
- **Self-hosting**: `nuxi build` outputs a Node server (`.output/server/index.mjs`) that runs on any small VPS or in Docker.
