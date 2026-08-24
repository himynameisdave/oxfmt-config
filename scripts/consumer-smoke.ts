/**
 * Consumer smoke test: exercises the package the way a consumer does, packed into a
 * tarball, installed by name, spread into an `oxfmt.config.ts`, formatting real
 * app-shaped files. Two scratch projects, one per entry point:
 *
 * - `svelte`: `./svelte` with `oxfmt` + `svelte` installed. Proves quotes, import sorting, JSDoc, package.json
 *   sorting and the svelte options all apply.
 * - `base`: `./base` with ONLY `oxfmt` installed (no `svelte` package). Proves a non-Svelte project can format
 *   a Markdown file without the svelte plugin crashing — the whole reason the config is split.
 *
 * The other gates only ever exercise the source repo. This is the only one that
 * catches a typo'd `exports` path, a config shape oxfmt rejects at load time, or a
 * plugin that works in-repo but blows up from a consumer install.
 *
 * Load-bearing findings, learned by running this end to end:
 *
 * - `npm pack` does NOT run `prepublishOnly` (that fires only on `npm publish`), so the tarball is empty
 *   unless `dist/` was built first. Hence the guard below and the `tsc &&` in the `test:consumer` script.
 * - With `svelte` enabled, oxfmt loads prettier-plugin-svelte for EVERY run that touches a Markdown file, and
 *   errors (exit 2) if the `svelte` package is absent.
 * - `oxfmt --check` exits 1 on unformatted files and 2 on a config/plugin error. The assertions below tell
 *   those apart on purpose.
 *
 * Runs under bun (see `test:consumer`): `Bun.$` for subprocesses, `Bun.file`/`Bun.write`
 * for IO, `node:fs/promises`/`node:os`/`node:path` for the bits Bun has no equivalent of.
 * Node runs the resolve check on purpose: real consumers resolve the package with Node.
 */
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

type Fixture = { readonly path: string; readonly content: string };
type Manifest = { readonly devDependencies: Readonly<Record<string, string>> };

const REPO_ROOT = join(import.meta.dir, '..');

// Fixtures live as strings, not committed files: committed ones would be rewritten by
// our own self-format and linted by oxlint.
const MESSY_TS: Fixture = {
  path: 'src/messy.ts',
  content:
    'import { join } from "node:path";\n'
    + 'import { readFileSync } from "node:fs";\n'
    + 'import helper from "./helper.js";\n'
    + '\n'
    + '/** does a thing */\n'
    + 'export const thing = { join, readFileSync, helper, label: "hi" }\n',
};
const WIDGET_SVELTE: Fixture = {
  path: 'src/Widget.svelte',
  content: '<script lang="ts">\nlet { value } = $props();\n</script>\n\n<Child value={value} />\n',
};
// Every real project has one; it is what trips the svelte plugin when `svelte` is absent.
const README_MD: Fixture = { path: 'README.md', content: '# Scratch\n\nSome   prose.\n' };

const consumerConfig = (subpath: string): string => `import { defineConfig } from 'oxfmt';
import config from '@himynameisdave/oxfmt-config${subpath}';

export default defineConfig({ ...config });
`;

const RESOLVE_CHECK = `import { createRequire } from 'node:module';

for (const sub of ['', '/base', '/svelte']) {
  const specifier = \`@himynameisdave/oxfmt-config\${sub}\`;
  const mod = await import(specifier);
  if (typeof mod.default !== 'object' || mod.default === null) {
    throw new Error(\`\${specifier} resolved but has no default export object\`);
  }
}

// The ./package.json export: publint, Renovate and some bundlers read it, and an
// exports map without it blocks the subpath outright.
const pkg = createRequire(import.meta.url)('@himynameisdave/oxfmt-config/package.json');
if (typeof pkg.version !== 'string') {
  throw new Error('package.json subpath resolved but has no version string');
}
`;

const failures: string[] = [];

// --- 1. Pack the package exactly as npm would ---------------------------------
if (!(await Bun.file(join(REPO_ROOT, 'dist', 'index.js')).exists())) {
  console.error('dist/ is missing. Build first (`bun run build`, or `bun run test:consumer`).');
  process.exitCode = 1;
  throw new Error('dist/ not built');
}

const manifest = (await Bun.file(join(REPO_ROOT, 'package.json')).json()) as Manifest;
const workDir = await mkdtemp(join(tmpdir(), 'oxfmt-consumer-'));

// `--silent` reduces npm pack's output to the tarball filename alone.
const packed = await Bun.$`npm pack --silent --pack-destination ${workDir}`.cwd(REPO_ROOT).text();
const tarball = join(workDir, packed.trim().split('\n').at(-1) ?? '');

/**
 * Scaffolds a scratch consumer, installs the tarball plus `peers` (pinned to this
 * repo's devDependency versions), and runs `oxfmt --check` then `--write`.
 * Returns the project dir so callers can assert on the formatted files.
 */
const formatAsConsumer = async (
  name: string,
  subpath: string,
  peers: readonly string[],
  fixtures: readonly Fixture[],
): Promise<string> => {
  const projectDir = join(workDir, name);
  // Bun.write creates missing parent directories, so the fixture paths need no mkdir.
  await Promise.all([
    // Scripts deliberately out of order: proves sortPackageJson.sortScripts from a consumer.
    Bun.write(
      join(projectDir, 'package.json'),
      `${JSON.stringify({ type: 'module', scripts: { zeta: 'true', alpha: 'true' } }, null, 2)}\n`,
    ),
    // node_modules is skipped by default; resolve-check.mjs is harness scaffolding, not a
    // fixture, and must not be reformatted or counted.
    Bun.write(join(projectDir, '.gitignore'), 'resolve-check.mjs\n'),
    Bun.write(join(projectDir, 'oxfmt.config.ts'), consumerConfig(subpath)),
    Bun.write(join(projectDir, 'resolve-check.mjs'), RESOLVE_CHECK),
    ...fixtures.map(async (fixture) => Bun.write(join(projectDir, fixture.path), fixture.content)),
  ]);

  const peerSpecs = peers.map((dep) => `${dep}@${manifest.devDependencies[dep] ?? 'latest'}`);
  await Bun.$`npm install --silent --no-audit --no-fund ${tarball} ${peerSpecs}`.cwd(projectDir).quiet();

  // Exit 1 = unformatted files (expected: the fixtures are messy on purpose).
  // Exit 2 = oxfmt could not load the config or a plugin — the failure this test exists for.
  const checked = await Bun.$`./node_modules/.bin/oxfmt --check`.cwd(projectDir).nothrow().quiet();
  if (checked.exitCode !== 1) {
    failures.push(
      `[${name}] oxfmt --check exited ${checked.exitCode}, expected 1:\n${checked.stderr.toString().trim()}`,
    );
  }
  const written = await Bun.$`./node_modules/.bin/oxfmt --write`.cwd(projectDir).nothrow().quiet();
  if (written.exitCode !== 0) {
    failures.push(
      `[${name}] oxfmt --write exited ${written.exitCode}:\n${written.stderr.toString().trim()}`,
    );
  }
  return projectDir;
};

/** Asserts a formatted file contains a fragment, naming what the failure would mean. */
const expectContains = async (
  dir: string,
  file: string,
  fragment: string,
  proves: string,
): Promise<void> => {
  const content = await Bun.file(join(dir, file)).text();
  if (!content.includes(fragment)) {
    failures.push(
      `expected ${JSON.stringify(fragment)} in ${file} (${proves})\n    got: ${JSON.stringify(content)}`,
    );
  }
};

// --- 2. The svelte entry point, in a Svelte-shaped project ------------------------
const svelteDir = await formatAsConsumer(
  'svelte',
  '/svelte',
  ['oxfmt', 'svelte'],
  [MESSY_TS, WIDGET_SVELTE, README_MD],
);

await expectContains(
  svelteDir,
  'src/messy.ts',
  "label: 'hi' };\n",
  'singleQuote, bracketSpacing and semi apply',
);
await expectContains(
  svelteDir,
  'src/messy.ts',
  "import { readFileSync } from 'node:fs';\nimport { join } from 'node:path';\n\nimport helper from './helper.js';\n",
  'sortImports orders within a group and puts a blank line between builtin and sibling',
);
await expectContains(
  svelteDir,
  'src/messy.ts',
  '/** Does a thing. */',
  'jsdoc capitalizeDescriptions + descriptionWithDot apply',
);
await expectContains(
  svelteDir,
  'src/Widget.svelte',
  '<Child {value} />',
  'svelte.allowShorthand applies from a consumer install',
);
await expectContains(
  svelteDir,
  'src/Widget.svelte',
  '\n  let { value } = $props();\n',
  'svelte.indentScriptAndStyle applies',
);
await expectContains(
  svelteDir,
  'package.json',
  '"alpha": "true",\n    "zeta": "true"',
  'sortPackageJson.sortScripts applies',
);

// --- 3. The base entry point, with no `svelte` package installed --------------------
const baseDir = await formatAsConsumer('base', '/base', ['oxfmt'], [MESSY_TS, README_MD]);
await expectContains(
  baseDir,
  'src/messy.ts',
  "label: 'hi' };\n",
  'base formats a plain project without svelte installed',
);

// --- 4. Assert every subpath resolves by package name under Node -------------------
const resolved = await Bun.$`node resolve-check.mjs`.cwd(svelteDir).nothrow().quiet();
if (resolved.exitCode !== 0) {
  // Node leads with a stack frame, so pick the line that actually names the failure.
  const lines = resolved.stderr.toString().trim().split('\n');
  const reason = lines.find((line) => /(?:Error|ERR_[A-Z_]+)/u.test(line)) ?? lines[0];
  failures.push(`subpath imports failed (exports map): ${reason?.trim() ?? '(no output)'}`);
}

// --- 5. Report ------------------------------------------------------------------
if (failures.length > 0) {
  console.error('CONSUMER SMOKE TEST FAILED:');
  for (const failure of failures) {
    console.error(`  ${failure}`);
  }
  console.error(`\nScratch projects kept for debugging: ${workDir}`);
  process.exitCode = 1;
} else {
  await rm(workDir, { recursive: true, force: true });
  console.log(
    'OK: packed tarball installs, all 3 subpaths + ./package.json resolve, base and svelte format as expected.',
  );
}
