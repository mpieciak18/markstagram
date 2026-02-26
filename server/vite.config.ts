// <reference types="vitest" />

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    testTimeout: 15000,
    hookTimeout: 15000,
    env: {
      // Keep local test runtime reasonable while production uses a higher default.
      BCRYPT_SALT_ROUNDS: '8',
    },
  },
});
