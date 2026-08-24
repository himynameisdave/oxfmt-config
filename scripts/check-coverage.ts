/**
 * Verifies the configs are exhaustive against the INSTALLED oxfmt version: every
 * option in oxfmt's `configuration_schema.json` — top level and nested (jsdoc,
 * sortImports, ...) — has an explicit decision in `src/base.ts` (and the svelte
 * block in `src/svelte.ts`), and nothing we set has been removed upstream.
 *
 * Exits non-zero with a diff when oxfmt added/removed/renamed options, which is
 * the signal to run the update workflow (.claude/skills/update-oxfmt-options).
 *
 * Runs under bun (TypeScript, no build step). Imports the compiled config from
 * dist/, so `check-coverage` runs tsc first.
 */
import base from '../dist/base.js';
import svelte from '../dist/svelte.js';

type Schema = {
  readonly $ref?: string;
  readonly allOf?: readonly Schema[];
  readonly anyOf?: readonly Schema[];
  readonly oneOf?: readonly Schema[];
  readonly properties?: Readonly<Record<string, Schema>>;
};

// Options deliberately absent from the config, with the reason living next to
// the omission in src/base.ts. Everything else in the schema must be decided.
const OMITTED = new Set([
  // Paths resolve relative to the config file, i.e. inside node_modules for consumers.
  'sortTailwindcss.config',
  'sortTailwindcss.stylesheet',
]);

const schema = (await Bun.file(
  `${import.meta.dir}/../node_modules/oxfmt/configuration_schema.json`,
).json()) as Schema & { readonly definitions: Readonly<Record<string, Schema>> };

/** Follows `$ref`/`allOf`/`anyOf` until it finds the object shape a property accepts. */
const propertiesOf = (node: Schema | undefined): Readonly<Record<string, Schema>> | undefined => {
  if (node === undefined) {
    return undefined;
  }
  if (node.properties !== undefined) {
    return node.properties;
  }
  if (node.$ref !== undefined) {
    return propertiesOf(schema.definitions[node.$ref.replace('#/definitions/', '')]);
  }
  for (const branch of [...(node.allOf ?? []), ...(node.anyOf ?? []), ...(node.oneOf ?? [])]) {
    const found = propertiesOf(branch);
    if (found !== undefined) {
      return found;
    }
  }
  return undefined;
};

const problems: string[] = [];

const check = (node: Schema, value: Readonly<Record<string, unknown>>, prefix: string): void => {
  const expected = propertiesOf(node) ?? {};
  for (const key of Object.keys(expected)) {
    const path = `${prefix}${key}`.replace(/^\w+: /u, '');
    if (!(key in value)) {
      if (!OMITTED.has(path)) {
        problems.push(`MISSING   ${prefix}${key}`);
      }
      continue;
    }
    if (OMITTED.has(path)) {
      problems.push(`SET       ${prefix}${key} (listed in OMITTED but present — pick one)`);
    }
    const nested = value[key];
    if (typeof nested === 'object' && nested !== null && !Array.isArray(nested)) {
      check(expected[key] ?? {}, nested as Record<string, unknown>, `${prefix}${key}.`);
    }
  }
  for (const key of Object.keys(value)) {
    if (!(key in expected)) {
      problems.push(`STALE     ${prefix}${key}`);
    }
  }
};

// svelte spreads base, so checking it covers both files and the nested svelte block.
check(schema, base, 'base: ');
check(schema, svelte, 'svelte: ');

if (problems.length > 0) {
  console.error('OPTION COVERAGE FAILED (see .claude/skills/update-oxfmt-options):');
  for (const problem of problems) {
    console.error(`  ${problem}`);
  }
  process.exitCode = 1;
} else {
  console.log('OK: every oxfmt option has an explicit decision.');
}
