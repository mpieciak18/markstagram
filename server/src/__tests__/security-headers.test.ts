import supertest from './helpers/httpClient.js';
import { describe, expect, it } from 'bun:test';
import app from '../app.js';

describe('cors and security headers', () => {
  it('should allow configured origins via CORS', async () => {
    const origin = process.env.CLIENT_URL ?? 'http://localhost:5173';
    const response = await supertest(app).get('/health_status').set('Origin', origin);

    expect(response.status).toBe(200);
    expect(response.headers['access-control-allow-origin']).toBe(origin);
    expect(response.headers['access-control-allow-credentials']).toBe('true');
  });

  it('should reject unconfigured origins via CORS', async () => {
    const response = await supertest(app)
      .get('/health_status')
      .set('Origin', 'http://untrusted-origin.test');

    expect(response.status).toBe(200);
    expect(response.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('should return hardened security headers', async () => {
    const response = await supertest(app).get('/health_status');

    expect(response.status).toBe(200);
    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['x-frame-options']).toBe('DENY');
    expect(response.headers['referrer-policy']).toBe('no-referrer');
    expect(response.headers['permissions-policy']).toBe(
      'camera=(), microphone=(), geolocation=()',
    );
    expect(response.headers['cross-origin-resource-policy']).toBe('same-site');
    expect(response.headers['x-permitted-cross-domain-policies']).toBe('none');
    expect(response.headers['content-security-policy']).toBe(
      "default-src 'none'; frame-ancestors 'none'; base-uri 'none'",
    );
  });
});
