// <reference types="vitest" />

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    env: {
      // Keep local test runtime reasonable while production uses a higher default.
      BCRYPT_SALT_ROUNDS: '8',
    },
  },
});
