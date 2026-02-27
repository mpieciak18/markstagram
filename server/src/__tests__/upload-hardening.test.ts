import supertest from './helpers/httpClient.js';
import { afterEach, describe, expect, it } from 'bun:test';
import app from '../app.js';
import prisma from '../db.js';
import { createSeededUserWithToken } from './helpers/userFactory.js';

const runId = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
const originalUploadMaxBytes = process.env.UPLOAD_MAX_BYTES;
const originalAllowedMimeTypes = process.env.UPLOAD_ALLOWED_MIME_TYPES;
const tokensToCleanup: string[] = [];
const userIdsToCleanup: number[] = [];

const restoreEnvVar = (
  key: 'UPLOAD_MAX_BYTES' | 'UPLOAD_ALLOWED_MIME_TYPES',
  value: string | undefined,
) => {
  if (value === undefined) {
    delete process.env[key];
    return;
  }

  process.env[key] = value;
};

const createUserAndToken = async (suffix: string) => {
  const seeded = await createSeededUserWithToken({
    email: `upload-hardening-${suffix}-${runId}@test.com`,
    username: `uph${suffix}${runId.slice(0, 4)}`,
    name: `Upload ${suffix}`,
  });

  tokensToCleanup.push(seeded.token);
  userIdsToCleanup.push(seeded.user.id);

  return {
    token: seeded.token,
    userId: seeded.user.id,
  };
};

afterEach(async () => {
  restoreEnvVar('UPLOAD_MAX_BYTES', originalUploadMaxBytes);
  restoreEnvVar('UPLOAD_ALLOWED_MIME_TYPES', originalAllowedMimeTypes);

  while (tokensToCleanup.length > 0) {
    const token = tokensToCleanup.pop();
    if (!token) continue;
    await supertest(app).delete('/api/user').set('Authorization', `Bearer ${token}`);
  }

  if (userIdsToCleanup.length > 0) {
    await prisma.user.deleteMany({
      where: {
        id: { in: userIdsToCleanup.splice(0, userIdsToCleanup.length) },
      },
    });
  }
});

describe('upload hardening', () => {
  it('should reject unsupported upload mime types', async () => {
    const { token, userId } = await createUserAndToken('mime');

    const response = await supertest(app)
      .post('/api/post')
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'multipart/form-data')
      .field('caption', 'bad mime')
      .attach('file', Buffer.from('not-an-image'), {
        filename: 'payload.txt',
        contentType: 'text/plain',
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Unsupported file type');

    const count = await prisma.post.count({ where: { userId } });
    expect(count).toBe(0);
  });

  it('should reject spoofed mime type when image signature is invalid', async () => {
    process.env.UPLOAD_ALLOWED_MIME_TYPES = 'image/jpeg';

    const { token, userId } = await createUserAndToken('sig');

    const response = await supertest(app)
      .post('/api/post')
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'multipart/form-data')
      .field('caption', 'spoofed mime')
      .attach('file', './src/__tests__/test.png', {
        filename: 'fake.jpg',
        contentType: 'image/jpeg',
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Invalid file signature');

    const count = await prisma.post.count({ where: { userId } });
    expect(count).toBe(0);
  });

  it('should enforce maximum upload size', async () => {
    process.env.UPLOAD_MAX_BYTES = '16';
    process.env.UPLOAD_ALLOWED_MIME_TYPES = 'image/png';

    const { token, userId } = await createUserAndToken('size');

    const response = await supertest(app)
      .post('/api/post')
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'multipart/form-data')
      .field('caption', 'too large')
      .attach('file', './src/__tests__/test.png');

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('File is too large');

    const count = await prisma.post.count({ where: { userId } });
    expect(count).toBe(0);
  });
});
