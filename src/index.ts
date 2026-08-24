export { default as base } from './base.js';
export { default as svelte } from './svelte.js';

/**
 * Kitchen sink: base + svelte. Requires the `svelte` package installed.
 *
 * Non-Svelte projects should spread `./base` instead:
 *
 * ```ts
 * import base from '@himynameisdave/oxfmt-config/base';
 * export default defineConfig({ ...base });
 * ```
 */
export { default } from './svelte.js';
