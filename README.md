# Xaalis

Personal expense tracker + optimistic-savings PWA for a single user in Senegal.

> "Xaalis" is Wolof for "money".

## What it is

A private, offline-first tool — not a product. It tracks expenses and savings
with **100% manual input** (no bank aggregators cover Senegal, and Orange Money
isn't integrated). The money rails are **Wave** and **cash**, both typed by hand.

The savings model is pay-yourself-first: a "safe to spend" amount plus named
goals. Income is a fixed monthly figure plus optional variable extra, where the
extra only counts once it's actually received — never projected.

All amounts are **XOF/FCFA, integer only** (no decimals, no cents, no floats).

The UI is French (structured for future English, but only `fr` ships).

## Stack

- React + TypeScript + Vite
- `vite-plugin-pwa` (Workbox, auto-update) — installable, offline-capable
- Real SQLite in the browser via `wa-sqlite`, persisted to IndexedDB
- Optional Supabase sync (magic-link, last-write-wins) + JSON export/import

## Getting started

```bash
npm install
npm run dev        # dev server (PWA service worker disabled in dev by design)
```

## Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server. PWA SW is intentionally off in dev. |
| `npm run build` | Typecheck (`tsc --noEmit`) + Vite build + PWA generation. |
| `npm run preview` | Serve the built PWA. Use this on an Android phone to test. |
| `npm test` | Vitest — pure logic only (`src/lib/**/*.test.ts`). |
| `npm run typecheck` | Type-only check, no emit. |

## Architecture

- **Pure logic** — `src/lib/` (money, period, safeToSpend). No browser deps,
  fully unit-tested. The only runtime-verifiable layer outside a browser.
- **Persistence** — `src/db/`: `sqlite.ts` bootstrap → `schema.ts` migrations →
  `repo.ts` typed accessors. Soft deletes only (`deleted = 1`,
  `updated_at = Date.now()` on every write) so the sync engine stays correct.
- **Sync (optional)** — `src/sync/`: Supabase magic-link + last-write-wins delta
  engine, plus JSON export/import. No-ops safely when `.env` is unset; the app
  is fully usable offline and unconfigured.
- **State** — one `AppProvider` (`src/state/store.tsx`) exposes settings, a
  derived safe-to-spend snapshot, and `reload()`. Hash routing in
  `src/lib/router.ts`.

## Verification

`npm test` and `npm run build` are green and meaningful. OPFS/SQLite, the
service worker, and Supabase sync **cannot be verified without a browser or
device** — test them via `npm run preview` on Android Chrome.

## Docs

- `CLAUDE.md` — locked product decisions and gotchas
- `DESIGN-PROMPT.md` — 7-screen design brief
