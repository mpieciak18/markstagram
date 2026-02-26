import { createMiddleware } from 'hono/factory';
import { bucket, getUrl } from '../config/gcloud.js';
import { randomUUID } from 'crypto';
import type { AppEnv } from '../app.js';

type UploadEnv = AppEnv & {
  Variables: AppEnv['Variables'] & {
    image: string;
  };
};

const DEFAULT_ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
] as const;

const MIME_TO_EXTENSION: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

const parsePositiveInt = (value: string | undefined, fallback: number): number => {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const getAllowedMimeTypes = (): Set<string> => {
  const configured = process.env.UPLOAD_ALLOWED_MIME_TYPES;
  if (!configured) return new Set(DEFAULT_ALLOWED_MIME_TYPES);

  const parsedTypes = configured
    .split(',')
    .map((type) => type.trim().toLowerCase())
    .filter(Boolean);

  return parsedTypes.length > 0
    ? new Set(parsedTypes)
    : new Set(DEFAULT_ALLOWED_MIME_TYPES);
};

const hasAllowedImageSignature = (buffer: Buffer, mimeType: string): boolean => {
  if (mimeType === 'image/png') {
    if (buffer.length < 8) return false;
    const signature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
    return signature.every((byte, index) => buffer[index] === byte);
  }

  if (mimeType === 'image/jpeg') {
    if (buffer.length < 3) return false;
    return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }

  if (mimeType === 'image/gif') {
    if (buffer.length < 6) return false;
    const header = buffer.subarray(0, 6).toString('ascii');
    return header === 'GIF87a' || header === 'GIF89a';
  }

  if (mimeType === 'image/webp') {
    if (buffer.length < 12) return false;
    const riff = buffer.subarray(0, 4).toString('ascii');
    const webp = buffer.subarray(8, 12).toString('ascii');
    return riff === 'RIFF' && webp === 'WEBP';
  }

  return false;
};

export const uploadImage = createMiddleware<UploadEnv>(async (c, next) => {
  const body = await c.req.parseBody();
  const file = body['file'];

  if (!(file instanceof File)) {
    // For user profile updates, file is optional
    if (c.req.path.endsWith('/user') && c.req.method === 'PUT') {
      await next();
      return;
    }
    return c.json({ message: 'File is required' }, 400);
  }

  const maxUploadBytes = parsePositiveInt(process.env.UPLOAD_MAX_BYTES, 5 * 1024 * 1024);
  const allowedMimeTypes = getAllowedMimeTypes();
  const normalizedMimeType = file.type.toLowerCase();

  if (!allowedMimeTypes.has(normalizedMimeType)) {
    return c.json({ message: 'Unsupported file type' }, 400);
  }

  if (file.size <= 0) {
    return c.json({ message: 'File is empty' }, 400);
  }

  if (file.size > maxUploadBytes) {
    return c.json({ message: 'File is too large' }, 400);
  }

  const extension = MIME_TO_EXTENSION[normalizedMimeType];
  if (!extension) {
    return c.json({ message: 'Unsupported file type' }, 400);
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    if (!hasAllowedImageSignature(buffer, normalizedMimeType)) {
      return c.json({ message: 'Invalid file signature' }, 400);
    }

    const fileName = `${randomUUID()}.${extension}`;
    const fileRef = bucket.file(fileName);
    await fileRef.save(buffer, { contentType: normalizedMimeType });
    const image = await getUrl(fileRef);
    c.set('image', image);
    await next();
  } catch (err) {
    return c.json({ message: 'Upload failed' }, 500);
  }
});
