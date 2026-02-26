const hasBunGlobal = (): boolean => {
  return typeof (globalThis as { Bun?: unknown }).Bun !== 'undefined';
};

export const isBunRuntime = hasBunGlobal();

export const loadEnvForRuntime = async (): Promise<void> => {
  if (isBunRuntime) {
    // Bun auto-loads .env files by default.
    return;
  }

  // Node >= 20 supports loading .env natively.
  const processWithEnvLoader = process as NodeJS.Process & {
    loadEnvFile?: (path?: string) => void;
  };
  processWithEnvLoader.loadEnvFile?.();
};
