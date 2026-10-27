---
type: decision
status: decided
date: 2026-10-27
area: product
tags:
  - decision
---

# UI language

## Question

French, English, or both?

## Options

Pick one for the MVP; `@nuxtjs/i18n` can come later.

## Decision

French. `@nuxtjs/i18n` can add English later.

## Consequences

- `<html lang="fr">`, every label and error message in French
- Dates and "il y a 3 jours" formatted with `Intl` in `fr-BE`

## Related

- [[Screens]]
