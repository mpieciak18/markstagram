import type { JwtPayload } from 'jsonwebtoken';
import type { Request } from 'express';
import type { User } from '@markstagram/shared-types';
import type { Field } from 'multer';
import type { Socket } from 'socket.io';

export interface PreAuth {
  user: string | JwtPayload;
}

export interface AuthReq extends Request {
  user: User;
}

export interface MayHaveFile {
  file: Field;
}

export interface HasId {
  body: { id: number };
}

export interface HasLimit {
  body: { id: number };
}

export interface MayHavePostId {
  body: { postId?: number };
}

export interface HasCaption {
  body: { caption: string };
}

export interface HasType {
  body: { type: string };
}

export interface HasMessage {
  body: { message: string };
}

export interface SocketWithUser extends Socket {
  user: User;
}
