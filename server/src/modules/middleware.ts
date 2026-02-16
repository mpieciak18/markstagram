import { validationResult } from 'express-validator';
import { bucket, getUrl } from '../config/gcloud.js';
import { randomUUID } from 'crypto';
import { NextFunction, Response, Request } from 'express';
import { MayHaveImage } from '@markstagram/shared-types';
import { AuthReq, MayHaveFile } from '@/types/types.js';

export const handleInputErrors = (
  req: Request | AuthReq,
  res: Response,
  next: NextFunction,
): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400);
    res.json({ errors: errors.array() });
  } else {
    next();
  }
};

export const uploadImage = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.file && req.path == '/user') {
      next();
      return;
    } else if (!req.file && req.path != '/user') {
      res.status(400).send();
      return;
    }
    const fileName: string = randomUUID();
    try {
      const fileRef = bucket.file(fileName);
      await fileRef.save((req as Request & MayHaveFile).file.buffer, {
        contentType: (req as Request & MayHaveFile).file.mimetype,
      });
      const image: string = await getUrl(fileRef);
      (req as Request & MayHaveImage).image = image;
      delete (req as AuthReq).file;
      next();
      return;
    } catch (err) {
      res.status(500).send(err);
      return;
    }
  } catch (err) {
    res.status(500).send(err);
  }
};
