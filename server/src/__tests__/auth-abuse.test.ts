import app from '../server.js';
import supertest from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { resetAuthAbuseState } from '../modules/authAbuse.js';

const AUTH_ENV_KEYS = [
  'AUTH_SIGN_UP_RATE_LIMIT',
  'AUTH_SIGN_UP_WINDOW_MS',
  'AUTH_SIGN_IN_RATE_LIMIT',
  'AUTH_SIGN_IN_WINDOW_MS',
  'AUTH_SIGN_IN_MAX_FAILED_ATTEMPTS',
  'AUTH_SIGN_IN_FAILURE_WINDOW_MS',
  'AUTH_SIGN_IN_LOCKOUT_MS',
] as const;

const originalAuthEnv = new Map<string, string | undefined>();
for (const key of AUTH_ENV_KEYS) {
  originalAuthEnv.set(key, process.env[key]);
}

const restoreAuthEnv = (): void => {
  for (const key of AUTH_ENV_KEYS) {
    const value = originalAuthEnv.get(key);
    if (typeof value === 'undefined') {
      delete process.env[key];
      continue;
    }
    process.env[key] = value;
  }
};

const runId = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

describe('auth abuse protection', () => {
  beforeEach(() => {
    resetAuthAbuseState();
  });

  afterEach(() => {
    restoreAuthEnv();
    resetAuthAbuseState();
  });

  it('should lock sign-in attempts after repeated failures', async () => {
    process.env.AUTH_SIGN_UP_RATE_LIMIT = '100';
    process.env.AUTH_SIGN_IN_RATE_LIMIT = '100';
    process.env.AUTH_SIGN_IN_MAX_FAILED_ATTEMPTS = '2';
    process.env.AUTH_SIGN_IN_FAILURE_WINDOW_MS = '60000';
    process.env.AUTH_SIGN_IN_LOCKOUT_MS = '60000';

    const user = {
      email: `auth-lock-${runId}@test.com`,
      username: `authlk${runId.slice(0, 4)}`,
      password: '123_abc',
      name: 'Auth Lock',
    };

    const createResponse = await supertest(app).post('/create_new_user').send(user);
    expect(createResponse.status).toBe(200);
    const token = createResponse.body.token as string;

    const failedAttempt = await supertest(app).post('/sign_in').send({
      email: user.email,
      password: 'wrong-password',
    });
    expect(failedAttempt.status).toBe(401);

    const lockTriggerAttempt = await supertest(app).post('/sign_in').send({
      email: user.email,
      password: 'wrong-password',
    });
    expect(lockTriggerAttempt.status).toBe(429);
    expect(lockTriggerAttempt.headers['retry-after']).toBeDefined();

    const blockedValidAttempt = await supertest(app).post('/sign_in').send({
      email: user.email,
      password: user.password,
    });
    expect(blockedValidAttempt.status).toBe(429);
    expect(blockedValidAttempt.headers['retry-after']).toBeDefined();

    const deleteResponse = await supertest(app)
      .delete('/api/user')
      .set('Authorization', `Bearer ${token}`);
    expect(deleteResponse.status).toBe(200);
  });

  it('should rate limit create_new_user requests', async () => {
    process.env.AUTH_SIGN_UP_RATE_LIMIT = '1';
    process.env.AUTH_SIGN_UP_WINDOW_MS = '60000';
    process.env.AUTH_SIGN_IN_RATE_LIMIT = '100';

    const user = {
      email: `auth-signup-${runId}@test.com`,
      username: `authsu${runId.slice(0, 4)}`,
      password: '123_abc',
      name: 'Auth Signup',
    };
    const otherUser = {
      email: `auth-signup-2-${runId}@test.com`,
      username: `auths${runId.slice(-4)}`,
      password: '123_abc',
      name: 'Auth Signup 2',
    };

    const response = await supertest(app).post('/create_new_user').send(user);
    expect(response.status).toBe(200);

    const limitedResponse = await supertest(app).post('/create_new_user').send(otherUser);
    expect(limitedResponse.status).toBe(429);
    expect(limitedResponse.headers['retry-after']).toBeDefined();

    const deleteResponse = await supertest(app)
      .delete('/api/user')
      .set('Authorization', `Bearer ${response.body.token}`);
    expect(deleteResponse.status).toBe(200);
  });
});
