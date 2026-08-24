import { defineConfig } from 'oxfmt';

import base from './dist/base.js';

// Self-format: this package eats its own dog food (base — no components here). Imports from dist/ because
// the config is what ships, and it proves the published shape loads — hence
// `format` and `format:check` run the build first.
export default defineConfig({ ...base });
