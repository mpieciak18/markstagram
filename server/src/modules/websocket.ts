import { Message } from '@prisma/client';
import prisma from '../db.js';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { SocketMessage, SocketMessageErr } from '@markstagram/shared-types';
import { Socket } from 'socket.io';

// Middleware for creating new messages from websocket
export const createMessage = async (
  data: SocketMessage,
  socket: Socket,
  user: JwtPayload,
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
export const retrieveUserFromToken = (
  token: string,
): string | JwtPayload | Error => {
  if (!token) {
    return new Error('Authentication error');
  }

  try {
    const user: string | JwtPayload = jwt.verify(
      token,
      process.env.JWT_SECRET ?? '',
    );
    return user;
  } catch (e) {
    return new Error('Authentication error');
  }
};
