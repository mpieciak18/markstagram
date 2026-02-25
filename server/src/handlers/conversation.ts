import { NextFunction, Response, Request } from 'express';
import prisma from '../db.js';
import { AuthReq } from '@/types/types.js';
import type { Conversation } from '@markstagram/shared-types';

// Creates a conversation
export const createConversation = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    // First, attempt to create conversation
    const conversation = await prisma.conversation.create({
      data: {
        users: {
          connect: [{ id: (req as AuthReq).user.id }, { id: req.body.id }],
        },
      },
      include: {
        users: true,
        messages: true,
      },
    });
    // If no conversation is created, handle it at the top-level (server.js) as 500 error
    if (!conversation) throw new Error();
    // Second, send conversation data back to client
    res.json({ conversation });
  } catch (e) {
    // DB errors are handled at top-level (server.js) as 500 error
    next(e);
    return;
  }
};

// Attempts to get a conversation by the other user's id
export const getConversation = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    // First, try to get single conversation by other user id
    // If no conversations are found, handle it at the top-level (server.js) as 500 error
    const conversation = await prisma.conversation.findFirst({
      where: {
        AND: [
          {
            users: {
              some: {
                id: (req as AuthReq).user.id,
              },
            },
          },
          {
            users: {
              some: {
                id: req.body.id,
              },
            },
          },
        ],
      },
      include: {
        users: true,
        messages: {
          orderBy: { createdAt: 'desc' },
          take: req.body.limit,
        },
      },
    });

    if (!conversation) throw new Error();

    // Second, return conversation back to client
    res.json({ conversation });
  } catch (e) {
    // DB errors are handled at top-level (server.js) as 500 error
    next(e);
    return;
  }
};

// Gets conversations from user
export const getConversations = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    // First, get all conversations from user
    // If no conversations are found, handle it at the top-level (server.js) as 500 error
    const conversations = await prisma.conversation.findMany({
      where: {
        users: {
          some: {
            id: (req as AuthReq).user.id,
          },
        },
      },
      take: req.body.limit,
      include: {
        users: true,
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });
    if (!conversations) throw new Error();
    // Second, return conversations back to client
    res.json({ conversations });
  } catch (e) {
    // DB errors are handled at top-level (server.js) as 500 error
    next(e);
    return;
  }
};

// Deletes a conversation
export const deleteConversation = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    // First, attempt to delete the conversation
    const conversation = await prisma.conversation.delete({
      where: { id: req.body.id },
      include: {
        users: true,
        messages: true,
      },
    });
    // If no conversation is found-and-deleted, handle it at the top-level (server.js) as 500 error
    if (!conversation) throw new Error();
    // Finally, send deleted conversation back to client
    res.json({ conversation });
  } catch (e) {
    // DB errors are handled at top-level (server.js) as 500 error
    next(e);
    return;
  }
};
