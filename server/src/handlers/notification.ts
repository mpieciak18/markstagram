import { NextFunction, Response, Request } from 'express';
import prisma from '../db.js';
import { AuthReq } from '@/types/types.js';
import { NewNotificationData } from '@markstagram/shared-types';

// Creates a new notification
export const createNotif = async (
  // req: AuthReq & HasType & HasId & MayHavePostId,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    // First, confirm other user exists
    const otherUser = await prisma.user.findUnique({
      where: { id: req.body.id },
    });
    // If no user is found, handle it at the top-level (server.js) as 500 error
    if (!otherUser) throw new Error();
    // Second, create notification
    const data: NewNotificationData = {
      userId: req.body.id,
      otherUserId: (req as AuthReq).user.id,
      type: req.body.type,
      read: false,
    };
    if (req.body.postId) data.postId = req.body.postId;
    const notification = await prisma.notification.create({
      data,
    });
    // If no notification is created, handle it at the top-level (server.js) as 500 error
    if (!notification) throw new Error();
    // Third (and finally), send notification data back to client
    res.json({ notification });
  } catch (e) {
    // DB errors are handled at top-level (server.js) as 500 error
    next(e);
    return;
  }
};

// Deletes a notification
export const deleteNotif = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    // First, delete notification
    const notification = await prisma.notification.delete({
      where: { id: req.body.id },
    });
    // If no notification is found-and-deleted, handle it at the top-level (server.js) as 500 error
    if (!notification) throw new Error();
    // Send deleted follow data back to client
    res.json({ notification });
  } catch (e) {
    // DB errors are handled at top-level (server.js) as 500 error
    next(e);
    return;
  }
};

// Gets the user's unread notifications
export const getNotifsUnread = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    // First, try to get unread notifications
    // If nothing is return (as oppposed to an empty array),
    // then handle it at the top-level (server.js) as 500 error
    const notifications = await prisma.notification.findMany({
      where: { userId: (req as AuthReq).user.id, read: false },
      orderBy: { createdAt: 'desc' },
      take: req.body.limit,
      include: { otherUser: true },
    });
    if (!notifications) throw new Error();
    // Second, return unread notifications back to client
    res.json({ notifications });
  } catch (e) {
    // DB errors are handled at top-level (server.js) as 500 error
    next(e);
    return;
  }
};

// Gets the user's read notifications
export const getNotifsRead = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    // First, try to get read notifications
    // If nothing is return (as oppposed to an empty array),
    // then handle it at the top-level (server.js) as 500 error
    const notifications = await prisma.notification.findMany({
      where: { userId: (req as AuthReq).user.id, read: true },
      orderBy: { createdAt: 'desc' },
      take: req.body.limit,
      include: { otherUser: true },
    });
    if (!notifications) throw new Error();
    // Second, return read notifications back to client
    res.json({ notifications });
  } catch (e) {
    // DB errors are handled at top-level (server.js) as 500 error
    next(e);
    return;
  }
};

// Updates all notifications (as read)
export const updateNotifsRead = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  // Update notification
  // let response: { count: number } | undefined;
  try {
    const response = await prisma.notification.updateMany({
      data: { read: true },
    });
    // While the previous try/catch (along with the 'protect' middleware) should catch all errors,
    // this is added as an extra step of error handling (in case the update 'runs' but nothing is returned).
    if (!response.count) throw new Error();
    // Return number of updated records
    res.json({ count: response.count });
  } catch (e) {
    // If error, handle it as a 500 error
    next(e);
    return;
  }
};
