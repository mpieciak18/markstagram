import { createMiddleware } from 'hono/factory';
import { bucket, getUrl } from '../config/gcloud.js';
import { randomUUID } from 'crypto';
import type { AppEnv } from '../app.js';

type UploadEnv = AppEnv & {
  Variables: AppEnv['Variables'] & {
    image: string;
  };
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

  try {
    const fileName = randomUUID();
    const fileRef = bucket.file(fileName);
    const buffer = Buffer.from(await file.arrayBuffer());
    await fileRef.save(buffer, { contentType: file.type });
    const image = await getUrl(fileRef);
    c.set('image', image);
    await next();
  } catch (err) {
    return c.json({ message: 'Upload failed' }, 500);
  }
});
