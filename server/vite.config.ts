// <reference types="vitest" />

import { defineConfig } from 'vite';

export default defineConfig({
  //@ts-ignore
  test: {
    /* for example, use global to avoid globals imports (describe, test, expect): */
    // globals: true,
  },
});
