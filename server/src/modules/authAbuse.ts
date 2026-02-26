import type { Context } from 'hono';

type RequestCounter = {
  count: number;
  windowStartMs: number;
};

type FailedSignInCounter = {
  count: number;
  firstFailureAtMs: number;
  lockedUntilMs: number;
};

type LimitDecision = {
  limited: boolean;
  retryAfterSeconds: number;
};

const requestCounters = new Map<string, RequestCounter>();
const failedSignInCounters = new Map<string, FailedSignInCounter>();

const parsePositiveInt = (value: string | undefined, fallback: number): number => {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const pruneExpiredRequestCounters = (nowMs: number): void => {
  for (const [key, counter] of requestCounters) {
    const windowMs = counter.windowStartMs;
    const maxWindowMs = Math.max(
      parsePositiveInt(process.env.AUTH_SIGN_IN_WINDOW_MS, 60_000),
      parsePositiveInt(process.env.AUTH_SIGN_UP_WINDOW_MS, 10 * 60_000),
    );
    if (windowMs + maxWindowMs <= nowMs) {
      requestCounters.delete(key);
    }
  }
};

const pruneExpiredFailedSignInCounters = (nowMs: number): void => {
  const failureWindowMs = parsePositiveInt(
    process.env.AUTH_SIGN_IN_FAILURE_WINDOW_MS,
    15 * 60_000,
  );
  for (const [key, counter] of failedSignInCounters) {
    const isWindowExpired = counter.firstFailureAtMs + failureWindowMs <= nowMs;
    const isLockExpired = counter.lockedUntilMs <= nowMs;
    if (counter.count === 0 && isLockExpired) {
      failedSignInCounters.delete(key);
      continue;
    }
    if (isWindowExpired && isLockExpired) {
      failedSignInCounters.delete(key);
    }
  }
};

const applyWindowRateLimit = (
  key: string,
  limit: number,
  windowMs: number,
  nowMs: number,
): LimitDecision => {
  if (requestCounters.size > 5_000) {
    pruneExpiredRequestCounters(nowMs);
  }

  const existing = requestCounters.get(key);
  if (!existing || existing.windowStartMs + windowMs <= nowMs) {
    requestCounters.set(key, { count: 1, windowStartMs: nowMs });
    return { limited: false, retryAfterSeconds: 0 };
  }

  existing.count += 1;
  requestCounters.set(key, existing);

  if (existing.count > limit) {
    const retryAfterMs = Math.max(existing.windowStartMs + windowMs - nowMs, 0);
    return {
      limited: true,
      retryAfterSeconds: Math.ceil(retryAfterMs / 1000),
    };
  }

  return { limited: false, retryAfterSeconds: 0 };
};

export const getAuthClientId = (c: Context): string => {
  const forwardedFor = c.req.header('x-forwarded-for');
  if (forwardedFor) {
    const firstIp = forwardedFor.split(',')[0]?.trim();
    if (firstIp) return firstIp;
  }

  const realIp = c.req.header('x-real-ip') ?? c.req.header('cf-connecting-ip');
  if (realIp) return realIp;

  return 'unknown';
};

export const applySignUpRateLimit = (
  clientId: string,
  nowMs = Date.now(),
): LimitDecision => {
  const limit = parsePositiveInt(process.env.AUTH_SIGN_UP_RATE_LIMIT, 30);
  const windowMs = parsePositiveInt(process.env.AUTH_SIGN_UP_WINDOW_MS, 10 * 60_000);
  return applyWindowRateLimit(`signup:${clientId}`, limit, windowMs, nowMs);
};

export const applySignInRateLimit = (
  clientId: string,
  nowMs = Date.now(),
): LimitDecision => {
  const limit = parsePositiveInt(process.env.AUTH_SIGN_IN_RATE_LIMIT, 60);
  const windowMs = parsePositiveInt(process.env.AUTH_SIGN_IN_WINDOW_MS, 60_000);
  return applyWindowRateLimit(`signin:${clientId}`, limit, windowMs, nowMs);
};

export const getSignInAttemptKey = (clientId: string, email: string): string => {
  return `${clientId}:${email.toLowerCase()}`;
};

export const checkSignInLock = (
  attemptKey: string,
  nowMs = Date.now(),
): LimitDecision => {
  const counter = failedSignInCounters.get(attemptKey);
  if (!counter || counter.lockedUntilMs <= nowMs) {
    return { limited: false, retryAfterSeconds: 0 };
  }

  return {
    limited: true,
    retryAfterSeconds: Math.ceil((counter.lockedUntilMs - nowMs) / 1000),
  };
};

export const recordFailedSignIn = (
  attemptKey: string,
  nowMs = Date.now(),
): LimitDecision => {
  if (failedSignInCounters.size > 5_000) {
    pruneExpiredFailedSignInCounters(nowMs);
  }

  const maxAttempts = parsePositiveInt(process.env.AUTH_SIGN_IN_MAX_FAILED_ATTEMPTS, 5);
  const failureWindowMs = parsePositiveInt(
    process.env.AUTH_SIGN_IN_FAILURE_WINDOW_MS,
    15 * 60_000,
  );
  const lockoutMs = parsePositiveInt(process.env.AUTH_SIGN_IN_LOCKOUT_MS, 15 * 60_000);
  const existing = failedSignInCounters.get(attemptKey);

  if (!existing) {
    failedSignInCounters.set(attemptKey, {
      count: 1,
      firstFailureAtMs: nowMs,
      lockedUntilMs: 0,
    });
    return { limited: false, retryAfterSeconds: 0 };
  }

  if (existing.lockedUntilMs > nowMs) {
    return {
      limited: true,
      retryAfterSeconds: Math.ceil((existing.lockedUntilMs - nowMs) / 1000),
    };
  }

  if (nowMs - existing.firstFailureAtMs > failureWindowMs) {
    existing.count = 1;
    existing.firstFailureAtMs = nowMs;
    existing.lockedUntilMs = 0;
    failedSignInCounters.set(attemptKey, existing);
    return { limited: false, retryAfterSeconds: 0 };
  }

  existing.count += 1;
  if (existing.count >= maxAttempts) {
    existing.count = 0;
    existing.firstFailureAtMs = nowMs;
    existing.lockedUntilMs = nowMs + lockoutMs;
    failedSignInCounters.set(attemptKey, existing);
    return {
      limited: true,
      retryAfterSeconds: Math.ceil(lockoutMs / 1000),
    };
  }

  failedSignInCounters.set(attemptKey, existing);
  return { limited: false, retryAfterSeconds: 0 };
};

export const clearFailedSignIns = (attemptKey: string): void => {
  failedSignInCounters.delete(attemptKey);
};

export const resetAuthAbuseState = (): void => {
  requestCounters.clear();
  failedSignInCounters.clear();
};
