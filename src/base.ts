import { defineConfig } from 'oxfmt';

/**
 * Shared oxfmt configuration.
 *
 * Oxfmt has no `extends`, so consumers spread this object:
 *
 * ```ts
 * import { defineConfig } from 'oxfmt';
 * import daveConfig from '@himynameisdave/oxfmt-config';
 *
 * export default defineConfig({ ...daveConfig });
 * ```
 *
 * Every option is listed explicitly, including ones set to their default, so
 * the file documents the decision rather than the diff — and so an upstream
 * default change can't silently alter behaviour.
 */
export default defineConfig({
  // DEFAULT. Parens on every arrow param. TypeScript forces them back on any
  // annotated, defaulted, or destructured param anyway, so "avoid" produces a
  // mixed codebase rather than a terser one.
  arrowParens: 'always',

  // DEFAULT. Closing `>` of a multi-line tag goes on its own line, acting as a
  // visual break between the attribute block and the children.
  bracketSameLine: false,

  // DEFAULT. `{ a: 1 }` not `{a: 1}`. Shared with Prettier, Biome and dprint —
  // flipping it would reformat every object literal in any adopting repo.
  bracketSpacing: true,

  // DEFAULT. Format fenced code in Markdown and CSS/GraphQL template literals.
  // Keeps CLAUDE.md, slash-command docs and READMEs as consistent as source.
  // Untagged fences are left alone, which is the escape hatch.
  embeddedLanguageFormatting: 'auto',

  // DEFAULT. LF is what git stores natively; Windows checkout conversion
  // belongs in .gitattributes, not in committed bytes. Note this overrides
  // .editorconfig's end_of_line for consumers.
  endOfLine: 'lf',

  // NON-DEFAULT (default "end"). Operators lead the continuation line, so a
  // long `&&`/`||`/`??` chain reads like a list: each line starts with what
  // joins it to the previous one, instead of the operator hiding out past the
  // printWidth at the end of the line above. Still experimental-prefixed
  // upstream; rename when it drops the prefix.
  experimentalOperatorPosition: 'start',

  // DEFAULT. Whitespace handling decided per element from its default CSS
  // `display`. "strict" is the safer choice — it never breaks whitespace that
  // renders — but produces hugging `>` output everywhere, including in the
  // block-level markup where it doesn't matter. Switch to "strict" if a
  // wrapping-induced rendering bug ever shows up.
  htmlWhitespaceSensitivity: 'css',

  // DEFAULT. Empty by design: ignore rules describe a specific repo's layout,
  // not a style opinion, so consumers own this. .gitignore and .prettierignore
  // already cover build output.
  ignorePatterns: [],

  // DEFAULT. POSIX defines a line as ending in \n; git flags files without one
  // and appends can corrupt the last line. Also overrides .editorconfig's
  // insert_final_newline.
  insertFinalNewline: true,

  // OFF BY DEFAULT — enabled. Agents write most of the implementation here and
  // their JSDoc is inconsistent about casing, @return vs @returns, and
  // wrapping. This normalizes all of it without manual review.
  jsdoc: {
    // DEFAULT. Appends "Default is `x`." from the `[param=x]` tag. The
    // formatter authoring English is fine given an LLM wrote the surrounding
    // prose anyway — and unlike that prose, this sentence is regenerated on
    // every run instead of drifting.
    addDefaultToDescription: true,

    // DEFAULT. `{string}`, not `{ string }`. Deliberately inconsistent with the
    // top-level bracketSpacing: these braces are a type sigil (closer to `<T>`)
    // rather than a collection, and `{string}` is the universal JSDoc form.
    bracketSpacing: false,

    // DEFAULT. Sentence-case descriptions. Known failure: a description opening
    // with an identifier gets mangled (`userId` -> `UserId`). Mitigation is to
    // wrap identifiers in backticks, which is better style regardless.
    capitalizeDescriptions: true,

    // DEFAULT. Collapse tag-free comments that fit onto one line. Denser prop
    // interfaces and meaningfully fewer tokens for agents reading the file.
    // "multiline" gives more uniform silhouettes and smaller diffs when adding
    // tags; the token cost decided it.
    commentLineStrategy: 'singleLine',

    // DEFAULT. Description stays inline rather than becoming `@description`.
    // Inline is what TS hover and TypeDoc read natively, and the tag would add
    // ~3 tokens to every comment in the codebase including collapsed one-liners.
    descriptionTag: false,

    // NON-DEFAULT (default false). Descriptions are sentences — if the
    // formatter capitalizes the first word it should terminate the last.
    descriptionWithDot: true,

    // NON-DEFAULT (default false). Only fires on @example blocks that fail to
    // parse as JS/TS. Reindenting text the parser has already given up on is
    // guessing, and flattened YAML or shell line-continuations are
    // destructively wrong. Cost of being wrong is asymmetric.
    keepUnparsableExampleIndent: true,

    // NON-DEFAULT (default "greedy"). Preserve intentional line breaks when
    // every line already fits, so editing one sentence doesn't re-flow the
    // whole paragraph. Caveat: a single overlong line re-flows the block
    // anyway, so this is less stable than it sounds.
    lineWrappingStyle: 'balance',

    // NON-DEFAULT (default false). Convert untagged indented example code to
    // fences. Explicit delimiters beat counting spaces after a ` * ` prefix,
    // and a fence leaves an obvious place to add a language tag later.
    preferCodeFences: true,

    // DEFAULT. No blank line specifically at the @param/@returns boundary —
    // see separateTagGroups for the general version of this.
    separateReturnsFromParam: false,

    // NON-DEFAULT (default false). Blank lines between runs of different tag
    // types. Costs nothing on a two-param function and pays off exactly where
    // readability breaks down: six params plus @returns, @throws and @see.
    separateTagGroups: true,
  },

  // DEFAULT. Double quotes in JSX/TSX attributes. JSX is markup, HTML has used
  // double quotes for thirty years, and anything pasted from MDN, a component
  // library or a design tool arrives that way. (Svelte markup isn't JSX, so
  // this only affects React work.)
  jsxSingleQuote: false,

  // NON-DEFAULT (default "preserve"). Object expansion is decided by content
  // and printWidth, never by whether the author left a newline after `{`.
  // "preserve" makes output a function of invisible authoring history, which
  // agents are inconsistent about — the exact thing this config exists to fix.
  // Cost: no way to force a route table or variant map to stay expanded.
  // JSON is exempted in `overrides` below.
  objectWrap: 'collapse',

  // NON-DEFAULT (default 100). Slightly wider: keeps most annotated signatures
  // and import lines flat while staying narrow enough for a GitHub split-diff
  // pane on a laptop, which is where agent PRs get reviewed.
  printWidth: 109,

  // DEFAULT. Never re-flow prose in Markdown, MDX or YAML. Same reasoning as
  // jsdoc.lineWrappingStyle: deliberate line breaks survive and doc diffs stay
  // surgical. Some renderers are linebreak-sensitive, too.
  proseWrap: 'preserve',

  // NON-DEFAULT (default "as-needed"). If one key in an object needs quotes,
  // all of them get quotes. The objects where this fires are data-shaped —
  // header maps, wire formats, Record<string, T> lookups — and half-quoted
  // reads like two things stapled together. Cost: adding one quoted key
  // re-quotes every other key, turning a one-line change into a whole-object
  // diff. ("preserve" was rejected for the same reason as objectWrap.)
  quoteProps: 'consistent',

  // DEFAULT. Explicit semicolons. Without them JavaScript guesses where
  // statements end, guesses wrong on lines starting with ( [ ` + - or /, and
  // the formatter has to inject a leading semicolon instead — noisier than
  // what it removed.
  semi: true,

  // NON-DEFAULT (default false). Any element with 2+ attributes goes
  // multi-line. Every prop change becomes a one-line diff permanently, which
  // matters when reviewing agent-written markup. Tailwind pushes most elements
  // past printWidth anyway, so the real added cost is ~5% tokens on a typical
  // component, and smaller diffs pay some of that back.
  singleAttributePerLine: true,

  // NON-DEFAULT (default false). Single quotes for JS/TS strings (also CSS,
  // YAML, Markdown, Svelte). The formatter still picks whichever quote needs
  // fewer escapes, so "it's fine" stays double-quoted either way.
  singleQuote: true,

  // OFF BY DEFAULT — enabled. Import order is pure noise that agents get wrong
  // constantly and the most common source of spurious PR diffs. No conflict
  // with @himynameisdave/oxlint-config: import/order isn't implemented there,
  // eslint/sort-imports is off, and import/newline-after-import was already
  // ceded to the formatter.
  sortImports: {
    // NON-DEFAULT (default ["~/", "@/", "#"]). SvelteKit's aliases match none
    // of the defaults and don't resolve from node_modules, so without this
    // they fall through to `unknown` and sort dead last — below relative
    // imports. $app and $env are framework-injected rather than first-party,
    // but grouping them here is the only placement that doesn't strand them.
    internalPattern: ['$lib', '$app', '$env'],

    // NON-DEFAULT. The default list omits side_effect_style, side_effect and
    // type entirely, so all three land in `unknown` at the bottom. Global CSS
    // goes first because import order determines cascade; type imports sink
    // near the bottom since nothing about them survives compilation.
    groups: [
      'side_effect_style', // import '../app.css'
      'side_effect', // import 'reflect-metadata'
      'builtin', // node:fs
      'external', // svelte, zod, @sveltejs/kit
      ['internal', 'subpath'], // $lib, $app, $env, #private
      ['parent', 'sibling', 'index'], // ../, ./, ./index
      'type', // erasable — nothing ships at runtime
      'unknown',
      'style', // bindings-carrying CSS; rare in Svelte
    ],

    // DEFAULT. Custom groups are claims about a consumer's directory layout,
    // and this config ships to other people. Framework-first ordering and a
    // separate ./$types group were both considered and dropped on portability.
    customGroups: [],

    // DEFAULT. Blank lines between groups. Nine groups were configured
    // deliberately; make that structure visible rather than invisible.
    newlinesBetween: true,

    // DEFAULT. Case-insensitive. Dictionary order is what a human scanning the
    // list expects; case-sensitive would cluster PascalCase components above
    // lowercase utilities by accident of ASCII rather than by design.
    ignoreCase: true,

    // DEFAULT. Ascending. Descending exists for API symmetry, not because
    // anyone wants to read imports backwards.
    order: 'asc',

    // DEFAULT. Comments don't fence the sort. "All comments" would include
    // tooling directives — an oxlint-disable-next-line sitting in the import
    // block would silently freeze everything below it out of order, with
    // nothing to surface why.
    partitionByComment: false,

    // DEFAULT. Blank lines don't fence the sort either. newlinesBetween: true
    // means the formatter writes those blank lines itself; it shouldn't then
    // consume its own output as an instruction.
    partitionByNewline: false,

    // DEFAULT. Never reorder bare imports. Their order is semantics, not style
    // — polyfills, decorator metadata, CSS cascade. Disabled upstream for
    // security reasons. Side effect: the two side_effect entries in `groups`
    // above are close to decorative while this stays false.
    sortSideEffects: false,
  },

  // ON BY DEFAULT — listed explicitly because default-on options deserve a
  // deliberate decision. Alphabetized dependency blocks kill the spurious
  // diffs from different machines adding packages in different orders.
  // Note: intentionally NOT compatible with prettier-plugin-sort-packagejson,
  // so a repo migrating from that plugin sees one-time churn.
  sortPackageJson: {
    // NON-DEFAULT (default false). Alphabetical scripts are findable rather
    // than narrative. Colon-namespaced names (format / format:check) stay
    // clustered for free, so little grouping is lost — but a hand-ordered
    // pipeline (build -> checks -> test -> release) does get scattered.
    sortScripts: true,
  },

  // OFF BY DEFAULT — enabled, and safe to ship in the base config. Verified on
  // oxfmt 0.61.0: with no Tailwind installed it no-ops rather than erroring,
  // exits 0, and never reorders unrecognized classes. The failure mode is
  // hardcoded `config`/`stylesheet` paths, which are omitted below.
  sortTailwindcss: {
    // DEFAULT. `class` and `className` are handled automatically. Anything
    // added here (overlayClass, contentClass) is a claim about a consumer's
    // component API, and matching is exact — no patterns — so a general
    // `*Class` rule isn't possible. Consumers add their own.
    attributes: [],

    // NON-DEFAULT (default []). Class strings passed to these helpers are
    // invisible to the sorter otherwise, which in a shadcn-svelte codebase is
    // most of them — cn() wraps every conditional class. Sorting reaches into
    // conditional branches and nested cva/tv variant objects. These are
    // ecosystem-standard names, so the list stays portable.
    functions: ['cn', 'clsx', 'cva', 'tv', 'twMerge'],

    // DEFAULT. Exact duplicate utilities are removed. A repeated class is a
    // provable no-op in CSS, so there's nothing to lose. Note this does NOT
    // resolve conflicts (`p-4 p-2` survives) — it just sorts them adjacent,
    // which at least makes the conflict visible. Custom classes are never
    // deduped.
    preserveDuplicates: false,

    // DEFAULT. Whitespace normalized to single spaces. `true` preserves gaps
    // *positionally* while classes move through them, so a hand-grouped
    // multi-line class string keeps its line breaks but loses what they
    // grouped. Neither setting ever creates a break, so long chains stay long
    // either way — this is the setting that at least yields byte-identical
    // strings for identical class sets.
    preserveWhitespace: false,

    // `config` (Tailwind v3) and `stylesheet` (v4) are deliberately OMITTED.
    // Paths resolve relative to the oxfmt config file, which for a published
    // package is node_modules/@himynameisdave/oxfmt-config/ — so any value
    // here is wrong for every consumer. A missing `config` at least warns on
    // stderr; a missing `stylesheet` fails SILENTLY (no warning, exit 0,
    // sorting just stops). Auto-detection works. Consumers with a
    // non-standard CSS entry point should set `stylesheet` locally.
  },

  // OFF BY DEFAULT — and off here. The svelte entry point (`./svelte`) turns
  // it on. It stays off in base because oxfmt loads prettier-plugin-svelte for
  // any run that touches a Markdown file, and errors (exit 2) when the `svelte`
  // package isn't installed — which no non-Svelte project has.
  svelte: false,

  // DEFAULT. Two spaces per level. Svelte markup nests deep — component,
  // {#if}, {#each}, element — and 4 would spend 16 columns of the 109 before
  // the first character.
  tabWidth: 2,

  // DEFAULT. Trailing commas everywhere, including function params and args.
  // Appending to any list is a one-line diff, so git blame stays accurate and
  // adjacent additions conflict less. ("es5" was considered — it keeps call
  // sites tidier but leaves multi-line TS signatures with the two-line-append
  // problem. Flip back if dangling commas in calls grate.)
  trailingComma: 'all',

  // DEFAULT. Spaces, not tabs. Renders identically in GitHub, terminals and
  // review tools, and makes printWidth exact rather than an estimate — tabs
  // render at 8 columns by default on GitHub, so deeply nested Svelte markup
  // blows well past 109 in the split-diff view where PRs get reviewed. Tabs'
  // reader-configurable width is a real accessibility argument on the other
  // side. Overturns useTabs: true in @himynameisdave/oxlint-config, so that
  // repo will see a one-time reformat.
  useTabs: false,

  // DEFAULT. Vue SFCs only, and inert here — no Vue in the stack. Left at the
  // Vue community's own convention (flush-left script) rather than made
  // consistent with svelte.indentScriptAndStyle by analogy.
  vueIndentScriptAndStyle: false,

  // Later entries win when a file matches several, so order matters.
  overrides: [
    {
      // Data files aren't code. objectWrap: "collapse" would jam a short
      // "scripts" block or a nested tsconfig key onto one line, which is far
      // more visible and less useful than the determinism it buys in source.
      files: ['**/*.json', '**/*.jsonc', '**/*.json5'],
      options: { objectWrap: 'preserve' },
    },
    {
      // Long expect(...).toBe(...) chains and inline mocks wrap awkwardly at
      // 109. 132 keeps assertions flat while still breaking fixture objects
      // into readable columns — at ~200 they collapse onto one line and a
      // single changed field becomes a whole-line diff.
      files: ['**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts', '**/*.spec.tsx'],
      options: { printWidth: 132 },
    },
  ],
});
