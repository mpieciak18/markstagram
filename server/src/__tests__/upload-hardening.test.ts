import supertest from 'supertest';
import { afterEach, describe, expect, it } from 'vitest';
import app from '../server.js';
import prisma from '../db.js';

const runId = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
const originalUploadMaxBytes = process.env.UPLOAD_MAX_BYTES;
const originalAllowedMimeTypes = process.env.UPLOAD_ALLOWED_MIME_TYPES;
const tokensToCleanup: string[] = [];
const userIdsToCleanup: number[] = [];

const createUserAndToken = async (suffix: string) => {
  const response = await supertest(app).post('/create_new_user').send({
    email: `upload-hardening-${suffix}-${runId}@test.com`,
    username: `uph${suffix}${runId.slice(0, 4)}`,
    password: '123_abc',
    name: `Upload ${suffix}`,
  });

  expect(response.status).toBe(200);
  tokensToCleanup.push(response.body.token as string);
  userIdsToCleanup.push(response.body.user.id as number);

  return {
    token: response.body.token as string,
    userId: response.body.user.id as number,
  };
};

afterEach(async () => {
  process.env.UPLOAD_MAX_BYTES = originalUploadMaxBytes;
  process.env.UPLOAD_ALLOWED_MIME_TYPES = originalAllowedMimeTypes;

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
