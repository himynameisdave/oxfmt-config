# @himynameisdave/oxfmt-config

Shareable oxfmt config package. The product IS the option decisions — treat `src/base.ts` and `src/svelte.ts` as the source of truth consumers read. Sibling of `@himynameisdave/oxlint-config`; keep tooling, docs and conventions identical to that repo wherever it makes sense.

## Iron rules

1. **Every oxfmt option gets an explicit decision.** `bun run check-coverage` must print `OK` — it diffs `src/base.ts` (and the svelte block in `src/svelte.ts`) against every option in the installed oxfmt's `configuration_schema.json`, top level and nested. Never merge with missing/stale options. Deliberate omissions go in `OMITTED` in `scripts/check-coverage.ts` with a reason (currently only the Tailwind path options).
2. **Every option has a comment saying WHY**, prefixed `DEFAULT.` or `NON-DEFAULT (default x).` — the reason, not a restatement of the option name. Defaults need reasons too.
3. **Nothing repo-specific.** No ignore patterns, no custom import groups, no file paths. Anything describing a consumer's layout goes in the README's Common overrides, not the config.
4. **This repo formats itself with its own config.** `oxfmt.config.ts` spreads `dist/base.js` (no components here). If a decision produces ugly output here, that's signal, not something to override.

## Layout

- `src/base.ts` — every option decided, `svelte: false`, framework-agnostic
- `src/svelte.ts` — `{ ...base, svelte: { ... } }`; the ONLY place svelte is enabled (it needs the `svelte` package at runtime, so non-Svelte consumers must be able to avoid it)
- `src/index.ts` — re-exports + kitchen-sink default (= svelte)
- `oxfmt.config.ts` — self-format config; imports from `dist/`, so build first
- `oxlint.config.ts` — self-lint via `@himynameisdave/oxlint-config` (base + type-aware)
- `scripts/check-coverage.ts` — exhaustiveness gate (see iron rule 1)
- `scripts/consumer-smoke.ts` — packs the tarball, installs it in a scratch project, formats fixtures from both entry points (the base one with no `svelte` package installed)

## Commands

- `bun install` — bun is the package manager here
- `bun run build` — tsc (TypeScript 7) → `dist/` with declarations
- `bun run lint` — build + oxlint with the sibling config (type-aware on)
- `bun run format` / `format:check` — build + oxfmt with this repo's own config
- `bun run check-coverage` — build + verify every oxfmt option is decided
- `bun run test:consumer` — build + pack + install + format as a consumer (needs network)
- `bun run test` — all four gates (what CI and the release workflow run)
- Releasing: trigger the **Release** GitHub Actions workflow (pick patch/minor/major) — it runs the gates, versions, tags, publishes via npm trusted publishing, and creates the GitHub release. Full walkthrough: PUBLISHING.md

## Bun, not Node

**Always prefer Bun over Node.** Bun is the package manager, the script runtime, and the CI runtime here — reach for a Node equivalent only when Bun genuinely can't do the job.

- Scripts: `Bun.file()` / `Bun.write()` over `node:fs`, `Bun.$` over `node:child_process`, `import.meta.dir` over `__dirname`, `Bun.env` over `process.env`.
- Our own commands: `bun install`, `bun run <script>`, `bun x` — not `npm`/`npx`/`yarn`/`pnpm`, and not `node script.ts`.
- CI uses `oven-sh/setup-bun`; keep it that way.

Two kinds of exception, and it matters which one you're invoking:

1. **Bun has no equivalent.** Use the `node:` module and say so in a comment. Live cases: `tmpdir()` from `node:os`, `mkdtemp`/`rm` from `node:fs/promises`, `join` from `node:path` in `scripts/consumer-smoke.ts`.
2. **Node/npm _is_ the thing under test.** `scripts/consumer-smoke.ts` runs `npm pack`, `npm install` and `node resolve-check.mjs` on purpose: it proves the published tarball works for a real consumer, and real consumers run npm and Node. Don't "fix" these to Bun.

Use the global `Bun.$`, never `import { $ } from 'bun'` — that import pulls bun's global type augmentation into the shared type-aware program and trips `typescript/no-unnecessary-condition` in unrelated files.

## Conventions

- Commits: emoji + short subject, why-explanation in the body (`✨ Add base config`).
- Formatting is whatever `bun run format` says (spaces, single quotes, width 109 — our own config). `.js` extensions on relative imports (NodeNext).
- When oxfmt ships new options, use the `update-oxfmt-options` skill (`.claude/skills/update-oxfmt-options/`).
- Version bumps: any formatting decision change (option flipped, new option decided, override changed) = minor. Major is reserved for structural changes: an oxfmt major, an entry point renamed/removed, anything that makes consumers edit their config.
