const hasBunGlobal = (): boolean => {
  return typeof (globalThis as { Bun?: unknown }).Bun !== 'undefined';
};

export const isBunRuntime = hasBunGlobal();

export const loadEnvForRuntime = async (): Promise<void> => {
  if (isBunRuntime) {
    // Bun auto-loads .env files by default.
    return;
  }

  const dotenv = await import('dotenv');
  dotenv.config();
};
