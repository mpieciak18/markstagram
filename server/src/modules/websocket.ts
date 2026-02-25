import { Message } from '@prisma/client';
import prisma from '../db.js';
import { jwtVerify } from 'jose';
import { SocketMessage, SocketMessageErr } from '@markstagram/shared-types';
import { Socket } from 'socket.io';

interface TokenPayload {
  id: number;
  username: string;
}

// Middleware for creating new messages from websocket
export const createMessage = async (
  data: SocketMessage,
  socket: Socket,
  user: TokenPayload,
): Promise<Message | Error | undefined> => {
  try {
    const message: Message = await prisma.message.create({
      data: {
        conversationId: Number(data.id),
        senderId: user.id,
        message: data.message,
      },
    });

    if (message) {
      socket.emit('newMessage', message);
      return message;
    } else {
      // Handle error: No message created
      socket.emit('error', { message: 'Message creation failed.' });
    }
  } catch (e) {
    // Handle database error
    socket.emit('error', { message: 'Database error occurred.' });
  }
};

// Middleware for validating inputs within websocket
const isInt = (value: any) => typeof value === 'number' && value % 1 === 0;

const isString = (value: any) => typeof value === 'string';

export const handleInputErrors = (
  message: SocketMessage,
): SocketMessageErr[] | null => {
  const errors: SocketMessageErr[] = [];

  if (!isInt(message.id)) {
    errors.push({ message: 'Invalid id, must be an integer.' });
  }

  if (!isString(message.message)) {
    errors.push({ message: 'Invalid message, must be a string.' });
  }

  return errors.length > 0 ? errors : null;
};

// Middleware for validating JWT token from websocket
export const retrieveUserFromToken = async (
  token: string,
): Promise<TokenPayload> => {
  if (!token) {
    throw new Error('Authentication error');
  }

  const secret = new TextEncoder().encode(process.env.JWT_SECRET ?? '');

  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as TokenPayload;
  } catch (e) {
    throw new Error('Authentication error');
  }
};
