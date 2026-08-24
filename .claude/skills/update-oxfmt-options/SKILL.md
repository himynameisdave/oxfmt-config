---
name: update-oxfmt-options
description: Update this package after an upstream oxfmt release adds, removes, or renames formatter options. Use when bumping the oxfmt dependency, when check-coverage fails, or when asked to "handle new oxfmt options".
---

# Update oxfmt options

Workflow for absorbing an upstream oxfmt release into this config package. The invariant to restore: **every option in oxfmt's `configuration_schema.json` has an explicit, commented decision** in `src/base.ts` (Svelte-only options in the block in `src/svelte.ts`).

## 1. Bump and detect

```bash
bun add -D --exact oxfmt@latest
bun run check-coverage
```

`check-coverage` prints:

- `MISSING` — new upstream options with no decision. → step 2.
- `STALE` — options we set that no longer exist (removed or renamed). → step 3.
- `SET` — an option listed in `OMITTED` (`scripts/check-coverage.ts`) is now present in the config. Either delete it from `OMITTED` or remove it from the config; don't keep both.

If it prints `OK`, only the dep bump needs committing. Still run `bun run format:check`: an oxfmt release can change output for the same options, and this repo formats itself.

## 2. Decide each MISSING option

For each new option, in order:

1. **Read the schema entry** (`node_modules/oxfmt/configuration_schema.json`, or the docstring in `node_modules/oxfmt/dist/index.d.ts`): what it does, which languages, the default.
2. **Decide the value.** Default is fine — most options are. The bar for NON-DEFAULT is the README's Philosophy section: determinism over authoring history, diff-friendly, nothing repo-specific.
3. **Is it a path or a repo-layout claim** (like `sortTailwindcss.config`)? Then it's omitted: add it to `OMITTED` with a one-line reason and mention it in the nearest comment in `src/base.ts`, the way the Tailwind ones are.
4. **Write the comment.** One line or a few, prefixed `DEFAULT.` or `NON-DEFAULT (default x).`, saying _why_, not what. Read neighboring comments for voice. Options are alphabetical within their block; keep it that way.
5. **Consumer-visible?** If a consumer would want to override it, add an example to README → Common overrides.

## 3. Handle STALE options

Renamed upstream → move the decision + comment to the new name. Removed → delete the entry. Check release notes (https://github.com/oxc-project/oxc/releases) when unsure which.

## 4. Verify

```bash
bun run test   # lint, format:check, check-coverage, test:consumer
```

`test:consumer` (`scripts/consumer-smoke.ts`) packs the tarball, installs it in a scratch project with `oxfmt` and `svelte`, and asserts specific formatted output. It needs network access. If a newly-decided option deserves permanent coverage, add a fixture and an `expectContains` there.

## 5. Ship

- README: update the "What's non-default" table if a non-default was added or flipped.
- Bump `peerDependencies.oxfmt` floor to the version you just certified against (the installed version `check-coverage` passed on). Update the README's floor line to match.
- Version: any formatting decision change (a new option decided, an option flipped, an override changed) plus dep-range bumps = **minor**. Major is reserved for structural changes (oxfmt major, entry point renamed/removed, consumers must edit their config).
- Commit style: emoji + short subject, why in body (e.g. `⬆️ oxfmt 0.70: decide 2 new options`). Name the new options and their values in the body.
