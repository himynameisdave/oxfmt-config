import { defineConfig } from 'oxfmt';

import base from './base.js';

/**
 * Svelte config: base plus `.svelte` formatting.
 *
 * Without `svelte` enabled, .svelte files are excluded from oxfmt's file set
 * entirely: the CLI exits 2 with "Expected at least one target file" and every
 * component goes unformatted (this is what leaves `if (!x) {return;}`
 * unexpanded — no lint rule catches it, since oxlint implements none of
 * ESLint's layout rules and `curly` only requires braces to exist).
 *
 * Requires the `svelte` package (v5+) at runtime: oxfmt bundles
 * prettier-plugin-svelte but not the compiler. Any Svelte project has it.
 */
export default defineConfig({
  ...base,

  svelte: {
    // DEFAULT. Collapses `value={value}` to `{value}`. Idiomatic Svelte and
    // meaningfully shorter on components forwarding many props. Note it's a
    // code transformation, not a layout change.
    allowShorthand: true,

    // DEFAULT. Indent inside <script> and <style>. The indent shows
    // containment — flush-left makes imports look file-scoped and the
    // </script> boundary harder to spot — and matches every Svelte codebase.
    // printWidth: 109 leaves room for the extra level.
    indentScriptAndStyle: true,

    // DEFAULT. Canonical script -> markup -> styles. "options-scripts-styles-
    // markup" is valid and arguably better (both definition blocks together,
    // usage last), but it physically relocates blocks in every adopting repo
    // into a layout nobody else uses. Set it locally if you want it; don't
    // impose it on consumers.
    sortOrder: 'options-scripts-markup-styles',
  },
});
