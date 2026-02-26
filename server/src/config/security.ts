const splitOrigins = (value: string | undefined): string[] => {
  if (!value) return [];
  return value
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
};

export const getAllowedOrigins = (): string[] => {
  const origins = new Set<string>([
    ...splitOrigins(process.env.CLIENT_URL),
    ...splitOrigins(process.env.CORS_ORIGINS),
  ]);

  if (process.env.NODE_ENV !== 'production') {
    origins.add('http://localhost:5173');
    origins.add('http://127.0.0.1:5173');
  }

  return Array.from(origins);
};

export const isAllowedOrigin = (
  origin: string | undefined | null,
  allowedOrigins: string[],
): boolean => {
  if (!origin) return true;
  return allowedOrigins.includes(origin);
};
