import type { Message } from '@markstagram/shared-types';
import { and, eq } from 'drizzle-orm';
import db from '../db.js';
import { conversationsToUsers, messages, users } from '../db/schema.js';
import { jwtVerify } from 'jose';
import { SocketMessage, SocketMessageErr } from '@markstagram/shared-types';

export interface TokenPayload {
  id: number;
  username: string;
}

export interface SocketEventClient {
  emit(event: string, ...args: unknown[]): boolean;
}

export interface SocketRoomClient extends SocketEventClient {
  join(room: string): void | Promise<void>;
}

export const parseConversationId = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isSafeInteger(value) && value > 0) {
    return value;
  }

  if (typeof value === 'string') {
    const normalized = value.trim();
    if (!/^\d+$/.test(normalized)) {
      return null;
    }
    const parsed = Number(normalized);
    if (Number.isSafeInteger(parsed) && parsed > 0) {
      return parsed;
    }
  }

  return null;
};

const normalizeSocketToken = (tokenInput: unknown): string => {
  if (typeof tokenInput !== 'string') return '';
  const raw = tokenInput.trim();
  if (!raw) return '';

  if (raw.toLowerCase().startsWith('bearer ')) {
    return raw.slice(7).trim();
  }

  return raw;
};

export const isConversationParticipant = async (
  userId: number,
  conversationId: number,
): Promise<boolean> => {
  const rows = await db
    .select({ conversationId: conversationsToUsers.conversationId })
    .from(conversationsToUsers)
    .where(
      and(
        eq(conversationsToUsers.userId, userId),
        eq(conversationsToUsers.conversationId, conversationId),
      ),
    )
    .limit(1);

  return rows.length > 0;
};

export const createConversationMessage = async (
  userId: number,
  conversationId: number,
  message: string,
): Promise<Message> => {
  const inserted = await db
    .insert(messages)
    .values({
      conversationId,
      senderId: userId,
      message,
    })
    .returning();

  return inserted[0] as Message;
};

// Middleware for creating new messages from websocket
export const createMessage = async (
  data: SocketMessage | { id: unknown; message: unknown },
  socket: SocketEventClient,
  user: TokenPayload,
): Promise<Message | undefined> => {
  const errors = handleInputErrors(data as SocketMessage);
  if (errors) {
    socket.emit('inputError', errors);
    return;
  }

  const conversationId = parseConversationId(data.id);
  if (!conversationId) {
    socket.emit('inputError', [{ message: 'Invalid conversation id, must be an integer.' }]);
    return;
  }

  try {
    const hasAccess = await isConversationParticipant(user.id, conversationId);
    if (!hasAccess) {
      socket.emit('authError', { message: 'Not authorized for this conversation.' });
      return;
    }

    const message = await createConversationMessage(user.id, conversationId, data.message as string);

    if (message) {
      socket.emit('newMessage', message);
      return message;
    }

    socket.emit('error', { message: 'Message creation failed.' });
  } catch {
    socket.emit('error', { message: 'Database error occurred.' });
  }
};

export const joinConversationRoom = async (
  socket: SocketRoomClient,
  user: TokenPayload,
  conversationIdInput: unknown,
): Promise<boolean> => {
  const conversationId = parseConversationId(conversationIdInput);
  if (!conversationId) {
    socket.emit('inputError', [{ message: 'Invalid conversation id, must be an integer.' }]);
    return false;
  }

  const hasAccess = await isConversationParticipant(user.id, conversationId);
  if (!hasAccess) {
    socket.emit('authError', { message: 'Not authorized for this conversation.' });
    return false;
  }

  await socket.join(String(conversationId));
  return true;
};

// Middleware for validating inputs within websocket
export const handleInputErrors = (
  message: SocketMessage | { id: unknown; message: unknown },
): SocketMessageErr[] | null => {
  const errors: SocketMessageErr[] = [];

  if (!parseConversationId(message.id)) {
    errors.push({ message: 'Invalid id, must be an integer.' });
  }

  if (typeof message.message !== 'string') {
    errors.push({ message: 'Invalid message, must be a string.' });
  } else if (message.message.trim().length === 0) {
    errors.push({ message: 'Invalid message, must not be empty.' });
  } else if (message.message.length > 2000) {
    errors.push({ message: 'Invalid message, must be at most 2000 characters.' });
  }

  return errors.length > 0 ? errors : null;
};

// Middleware for validating JWT token from websocket
export const retrieveUserFromToken = async (
  tokenInput: unknown,
): Promise<TokenPayload> => {
  const token = normalizeSocketToken(tokenInput);
  if (!token) {
    throw new Error('Authentication error');
  }

  if (!process.env.JWT_SECRET) {
    throw new Error('Authentication error');
  }

  const secret = new TextEncoder().encode(process.env.JWT_SECRET);

  try {
    const { payload } = await jwtVerify(token, secret, { algorithms: ['HS256'] });
    const id = Number(payload.id);
    if (!Number.isSafeInteger(id) || id <= 0) {
      throw new Error('Authentication error');
    }

    const rows = await db
      .select({ id: users.id, username: users.username })
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    const user = rows[0];

    if (!user) {
      throw new Error('Authentication error');
    }

    return user;
  } catch {
    throw new Error('Authentication error');
  }
};
