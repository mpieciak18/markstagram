import { NextFunction, Response, Request } from 'express';
import prisma from '../db.js';
import { AuthReq, HasId, HasMessage } from '@/types/types.js';
import type { Message } from '@markstagram/shared-types';

// Creates a message
export const createMessage = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    // First, attempt to create message
    const message = await prisma.message.create({
      data: {
        conversationId: req.body.id,
        senderId: (req as AuthReq).user.id,
        message: req.body.message,
      },
    });
    // If no message is created, handle it at the top-level (server.js) as 500 error
    if (!message) throw new Error();
    // Second, send message data back to client
    res.json({ message });
  } catch (e) {
    // DB errors are handled at top-level (server.js) as 500 error
    next(e);
    return;
  }
};

// Gets messages from user
export const getMessages = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  // First, get all messages from user
  // If no messages are found, handle it at the top-level (server.js) as 500 error
  let messages: Message[] | undefined;
  try {
    messages = await prisma.message.findMany({
      where: {
        conversationId: req.body.id,
      },
    });
  } catch (e) {
    // DB errors are handled at top-level (server.js) as 500 error
    next(e);
    return;
  }
  if (!messages) {
    const e = new Error();
    next(e);
    return;
  }

  // Second, return messages back to client
  res.json({ messages });
};

// Deletes a message
export const deleteMessage = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    // First, attempt to delete the message
    const message = await prisma.message.delete({
      where: { id: req.body.id },
    });
    // If no message is found-and-deleted, handle it at the top-level (server.js) as 500 error
    if (!message) {
      const e = new Error();
      next(e);
      return;
    }
    // Finally, send deleted message back to client
    res.json({ message });
  } catch (e) {
    // DB errors are handled at top-level (server.js) as 500 error
    next(e);
    return;
  }
};
