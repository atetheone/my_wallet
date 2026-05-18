# CLAUDE.md — Xaalis

Personal expense + optimistic-savings PWA for a single user in Senegal.
Full design rationale: `/home/atomic/.claude/plans/we-can-still-change-foamy-hoare.md`.
7-screen design brief: `DESIGN-PROMPT.md`.

## Commands

- `npm run dev` — dev server (PWA SW disabled in dev by design)
- `npm run build` — typecheck (`tsc --noEmit`) + Vite build + PWA generation
- `npm run preview` — serve the built PWA (use this on an Android phone to test)
- `npm test` — Vitest, **pure logic only** (`src/lib/**/*.test.ts`)

## Locked product decisions (do not relitigate without the user)

- **Single user, no accounts.** Personal tool, not a product.
- **PWA, not native.** Android phone = capture/system-of-record; iPad = review.
- **100% manual input.** No bank aggregators (none cover Senegal), no Orange
  Money. Rails are **Wave + cash**, both typed by hand.
- **Currency = XOF/FCFA, integer only.** No decimals, no cents, no floats.
  Always go through `src/lib/money.ts`.
- **Savings model = pay-yourself-first "safe to spend" (C) + named goals (B).**
  Income = fixed monthly + optional variable extra; extra counted only when
  actually received, never projected.
- **French UI** via `src/i18n` (`t()`); structured for future `en` but only
  `fr` ships.
- **Name: "Xaalis"** (Wolof, "money"). Dir stays `my_wallet`.
- **Phase 2 (not built):** Wave screenshot → Web Share Target → on-device OCR.

## Architecture

- React + TS + Vite, `vite-plugin-pwa` (Workbox, autoUpdate).
- **Pure logic** in `src/lib/` (money, period, safeToSpend) — no browser deps,
  fully unit-tested. This is the only runtime-verifiable layer outside a browser.
- **Persistence:** real SQLite via wa-sqlite in `src/db/`
  (`sqlite.ts` bootstrap → `schema.ts` migrations → `repo.ts` typed accessors).
- **Sync (optional):** `src/sync/` — Supabase magic-link, last-write-wins delta
  engine, plus JSON export/import. No-ops safely when `.env` is unset; app is
  fully usable offline/unconfigured.
- **State:** one `AppProvider` (`src/state/store.tsx`) → settings + derived
  safe-to-spend snapshot + `reload()`. Hash router in `src/lib/router.ts`.

## Gotchas (learned the hard way)

- **DB VFS must be main-thread-safe — and in wa-sqlite@1.0.0 that rules out
  OPFS entirely.** Both OPFS VFSes (`AccessHandlePoolVFS` *and*
  `OriginPrivateFileSystemVFS`) call `createSyncAccessHandle()`, which only
  exists in a dedicated Web Worker — on the window thread it throws
  `createSyncAccessHandle is not a function` (caught in first device test;
  OPFS was never actually browser-verified). We use the **async build**
  (`wa-sqlite-async.mjs`) + **`IDBBatchAtomicVFS`** (IndexedDB, fully async,
  durable). Do not switch to any OPFS VFS unless the DB moves into a Worker.
- **`IDBBatchAtomicVFS` needs `locking_mode=exclusive` + `journal_mode=MEMORY`,
  set right after open** (`src/db/sqlite.ts`). It commits atomically via
  IndexedDB and can't use an on-disk rollback journal; without these the first
  `BEGIN/COMMIT` (the schema migration) fails with a generic `disk I/O error`.
  Exclusive locking must be set *before* the journal_mode change for it to take.
- The async (Asyncify) wasm is ~1.1 MB; `maximumFileSizeToCacheInBytes` in
  `vite.config.ts` is raised so Workbox precaches it. Keep that bump.
- `wa-sqlite` is untyped ESM — types are hand-declared in `src/wa-sqlite.d.ts`
  and it's in `optimizeDeps.exclude`.
- Soft deletes only (`deleted = 1`) + `updated_at = Date.now()` on every write —
  the sync engine depends on this. Never hard-DELETE a synced row.
- Deviation from plan: `savings_commitment` lives on the `settings` singleton,
  not its own table (same behaviour, simpler).

## Verification reality

`npm test` + `npm run build` are green and meaningful. OPFS/SQLite, the service
worker, and Supabase sync are **not verifiable without a browser/device** — test
them via `npm run preview` on Android Chrome per the plan's verification section.
