# @himynameisdave/oxfmt-config

[![npm version](https://img.shields.io/npm/v/%40himynameisdave%2Foxfmt-config.svg)](https://www.npmjs.com/package/@himynameisdave/oxfmt-config)
[![license](https://img.shields.io/npm/l/%40himynameisdave%2Foxfmt-config.svg)](./LICENSE)
[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2Fhimynameisdave%2Foxfmt-config.svg?type=shield&issueType=license)](https://app.fossa.com/projects/git%2Bgithub.com%2Fhimynameisdave%2Foxfmt-config?ref=badge_shield&issueType=license)
[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2Fhimynameisdave%2Foxfmt-config.svg?type=shield&issueType=security)](https://app.fossa.com/projects/git%2Bgithub.com%2Fhimynameisdave%2Foxfmt-config?ref=badge_shield&issueType=security)

> An opinionated [oxfmt](https://oxc.rs/docs/guide/usage/formatter.html) config, by and for [himynameisdave](https://github.com/himynameisdave).

The formatting half of [@himynameisdave/oxlint-config](https://github.com/himynameisdave/oxlint-config). Every oxfmt option (all of them, including the ones left at their default) is listed explicitly with a one-line reason. The file documents the decision rather than the diff, so an upstream default change can't silently alter your output.

## Installation

```bash
bun add -D oxfmt @himynameisdave/oxfmt-config
```

Not a bun user? It's a regular npm package, so any package manager works:

```bash
npm install -D oxfmt @himynameisdave/oxfmt-config
pnpm add -D oxfmt @himynameisdave/oxfmt-config
yarn add -D oxfmt @himynameisdave/oxfmt-config
```

- Requires `oxfmt >=0.67.0 <1`. Why that range, and how it moves: [Versioning & compatibility](#versioning--compatibility).

## Configurations

| Config      | Import                                | What it is                                                              |
| ----------- | ------------------------------------- | ----------------------------------------------------------------------- |
| `base`      | `@himynameisdave/oxfmt-config/base`   | Every option decided. No framework assumptions. Start here.             |
| `svelte`    | `@himynameisdave/oxfmt-config/svelte` | `base` plus `.svelte` formatting. Needs the `svelte` package installed. |
| _(default)_ | `@himynameisdave/oxfmt-config`        | Same as `svelte`.                                                       |

## Usage

oxfmt has no `extends`, so you spread the config into your own. A regular project:

```ts
// oxfmt.config.ts
import { defineConfig } from 'oxfmt';
import base from '@himynameisdave/oxfmt-config/base';

export default defineConfig({ ...base });
```

A Svelte project:

```ts
// oxfmt.config.ts
import { defineConfig } from 'oxfmt';
import svelte from '@himynameisdave/oxfmt-config/svelte';

export default defineConfig({ ...svelte });
```

Then format:

```bash
oxfmt --check   # CI
oxfmt --write   # locally
```

`oxfmt.config.ts` is picked up automatically. It can't coexist with an `.oxfmtrc.json` in the same directory (oxfmt refuses to guess), so delete that one if you're migrating.

## Philosophy

1. **Every option is decided.** Defaults are listed too, so the config is the complete, greppable inventory of what your code will look like. CI fails if an oxfmt release adds an option nobody has decided on yet.
2. **Comments are mandatory.** Every option has a comment saying _why_, tagged `DEFAULT` or `NON-DEFAULT` so the opinions are easy to find. If a decision can't justify itself, it's not a decision yet.
3. **Layout is decided by the code, with one exception.** `quoteProps: "consistent"` means a stray quote never changes the whole object. `objectWrap: "preserve"` is the exception: a newline after `{` is a deliberate choice to keep related fields one per line, so the formatter honors it.
4. **Optimize for diffs.** `singleAttributePerLine`, `trailingComma: "all"` and sorted imports make every change a one-line change. Reviewing agent-written PRs is where this pays off.
5. **Nothing about _your_ repo.** No ignore patterns, no custom import groups, no Tailwind paths. Anything that describes a specific project's layout belongs in that project's config, not a shared one. See [Common overrides](#common-overrides).

## What's non-default

The short list of opinions. Everything else is at oxfmt's default, on purpose, with a comment saying so. Full reasoning lives next to each option in [`src/base.ts`](./src/base.ts) (and [`src/svelte.ts`](./src/svelte.ts) for the Svelte block).

| Option                         | Value                                          | Why                                                                         |
| ------------------------------ | ---------------------------------------------- | --------------------------------------------------------------------------- |
| `printWidth`                   | `109`                                          | Keeps annotated signatures flat, still fits a GitHub split-diff on a laptop |
| `singleQuote`                  | `true`                                         | Single quotes in JS/TS/CSS/YAML/Markdown/Svelte; JSX attributes stay double |
| `quoteProps`                   | `"consistent"`                                 | One quoted key quotes them all; no half-quoted lookup tables                |
| `experimentalOperatorPosition` | `"start"`                                      | Long `&&`/`\|\|` chains read like a list; the operator leads each line      |
| `singleAttributePerLine`       | `true`                                         | Every prop change is a one-line diff                                        |
| `jsdoc`                        | on, sentences end with `.`, fenced examples    | Normalizes inconsistent (usually agent-written) JSDoc                       |
| `sortImports`                  | on, SvelteKit `$lib`/`$app`/`$env` as internal | Side-effect CSS first, types near the bottom, blank line between groups     |
| `sortPackageJson`              | `sortScripts: true`                            | Findable scripts; `format` / `format:check` still cluster                   |
| `sortTailwindcss`              | on, sees into `cn`/`clsx`/`cva`/`tv`/`twMerge` | No-ops without Tailwind installed; never reorders unknown classes           |
| `svelte`                       | on, defaults                                   | Without it `.svelte` files aren't formatted at all                          |
| `overrides` (test files)       | `printWidth: 132`                              | `expect(...).toBe(...)` chains stay flat                                    |

Two things the config _overrides in your editor setup_: `endOfLine: "lf"` and `insertFinalNewline: true` win over `.editorconfig`.

## Versioning & compatibility

Version bumps describe what a release does to _your_ diff:

- **major**: structural change to what this package _is_. An oxfmt major bump, an entry point renamed or removed, or a change that needs you to edit your `oxfmt.config.ts`.
- **minor**: formatting decisions. Any option flipped, a new option decided after an oxfmt release adds one, an override added or changed. Running `oxfmt --write` after updating can reformat files.
- **patch**: docs, comments, tooling. No output change.

Reformatting is deliberately _not_ a major bump. One-time churn is the deal `^` buys you. Don't want it? Use `~` (patch only) with a committed lockfile, and upgrade deliberately.

**Supported oxfmt: `>=0.67.0 <1`.** The floor is the version this release's option inventory was certified against, so it moves whenever new options are decided. oxfmt is pre-1.0 and its own releases can change output too, so pin `oxfmt` exactly in your project and bump it with intent. The `<1` ceiling is there because an oxfmt 1.0 needs a release here anyway.

**Spreading replaces whole keys.** `{ ...base, sortImports: { groups: [...] } }` throws away every other `sortImports` decision. Spread the nested object too: `sortImports: { ...base.sortImports, groups: [...] }`.

## Svelte support

The `svelte` config turns on `svelte: { ... }`, which is what makes oxfmt look at `.svelte` files at all (without it they're silently skipped). oxfmt bundles `prettier-plugin-svelte` but **not** the Svelte compiler, so the `svelte` package (v5+) has to be installed in your project. Any Svelte project already has it, so it isn't declared as a peer dependency here.

Why it's a separate config and not just on: once `svelte` is enabled, oxfmt loads the plugin for any run that touches a Markdown file, and exits 2 with `Cannot find module 'svelte/compiler'` if the `svelte` package is missing. Every repo has a README, so a non-Svelte project spreading the `svelte` config can't format anything at all. Use `base` there.

## Common overrides

Things real projects legitimately add. They describe _your_ repo, so they don't belong in the shared config:

```ts
// oxfmt.config.ts
import { defineConfig } from 'oxfmt';
import svelte from '@himynameisdave/oxfmt-config/svelte';

export default defineConfig({
  ...svelte,
  // Vendored / generated code (shadcn-svelte's ui folder, Prisma client, etc.):
  ignorePatterns: ['src/lib/components/ui/**', 'src/generated/**'],
  sortTailwindcss: {
    ...svelte.sortTailwindcss,
    // Tailwind v4 CSS entry point, when it isn't where oxfmt auto-detects it:
    stylesheet: './src/app.css',
    // Component props that carry class strings (matching is exact, no globs):
    attributes: ['overlayClass', 'contentClass'],
  },
  sortImports: {
    ...svelte.sortImports,
    // Extra path aliases that should sort with first-party code:
    internalPattern: [...svelte.sortImports.internalPattern, '@/'],
  },
});
```

`ignorePatterns` and `sortTailwindcss` paths resolve relative to _your_ config file, which is exactly why they're empty or omitted upstream.

## License

[MIT](./LICENSE) © [Dave Lunny](https://github.com/himynameisdave)
