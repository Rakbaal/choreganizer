---
type: decision
status: decided
date: 2026-10-31
area: tech
tags:
  - decision
---

# API error messages in French

## Question

Where does the French text of an error from our own routes come from: the server, or a map of error codes on the client (as M0 does for Better Auth)?

## Decision

Our routes send the user-facing French sentence: `createError({ statusCode, message: 'Une pièce nommée « Cuisine » existe déjà.' })`, and the client shows the response's message (in a toast or under the form) with a generic fallback, « Une erreur est survenue. Réessayez. ». Better Auth's errors keep M0's code map (`app/utils/auth-error.ts`), since its messages are English and not ours.

## Why

The app is French only ([[UI language]]) and both ends are ours: a code map per route would duplicate every message for no reader. The sentence sits next to the rule that raises it.

## Consequences

- The French message goes in `message`, never `statusMessage` (the HTTP status line is no place for accents); check in the first route that `$fetch` errors expose it as `error.data.message`
- [[Implementation details#Validation]]'s English example ("A room called *Cuisine* already exists") is shown in French
- If English comes ([[UI language]]: `@nuxtjs/i18n` later), switch to codes then

## Related

- [[UI language]] · [[API]]
