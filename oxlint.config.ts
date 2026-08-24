import base from '@himynameisdave/oxlint-config/base';
import typeAware from '@himynameisdave/oxlint-config/type-aware';
import { defineConfig } from 'oxlint';

// Self-lint with the sibling package (no components here, so no svelte add-on).
export default defineConfig({
  extends: [base, typeAware],
  overrides: [
    {
      // Repo scripts are CLIs — console IS their output.
      files: ['scripts/**'],
      rules: { 'eslint/no-console': 'off' },
    },
  ],
});
