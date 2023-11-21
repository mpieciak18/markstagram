import prisma from '../db';

// Creates a new notification
export const createNotif = async (req, res, next) => {
	// First, confirm other user exists
	let otherUser;
	try {
		otherUser = await prisma.user.findUnique({
			where: { id: req.body.id },
		});
	} catch (e) {
		// DB errors are handled at top-level (server.ts) as 500 error
		next(e);
		return;
	}

	// If no user is found, handle it at the top-level (server.ts) as 500 error
	if (!otherUser) {
		const e = new Error();
		next(e);
		return;
	}

	// Second, create notification
	let notification;
	const data = {
		userId: req.body.id,
		otherUserId: req.user.id,
		type: req.body.type,
		read: false,
	};
	// @ts-ignore
	if (req.body.postId) data.postId = req.body.postId;
	try {
		notification = await prisma.notification.create({
			data,
		});
	} catch (e) {
		// DB errors are handled at top-level (server.ts) as 500 error
		next(e);
		return;
	}

	// If no notification is created, handle it at the top-level (server.ts) as 500 error
	if (!notification) {
		const e = new Error();
		next(e);
		return;
	}

	// Third (and finally), send notification data back to client
	res.json({ notification });
};

// Deletes a notification
export const deleteNotif = async (req, res, next) => {
	// First, delete notification
	let notification;
	try {
		notification = await prisma.notification.delete({
			where: { id: req.body.id },
		});
	} catch (e) {
		// DB errors are handled at top-level (server.ts) as 500 error
		next(e);
		return;
	}

	// If no notification is found-and-deleted, handle it at the top-level (server.ts) as 500 error
	if (!notification) {
		const e = new Error();
		next(e);
		return;
	}

	// Send deleted follow data back to client
	res.json({ notification });
};

// Gets the user's unread notifications
export const getNotifsUnread = async (req, res, next) => {
	// First, try to get unread notifications
	// If nothing is return (as oppposed to an empty array),
	// then handle it at the top-level (server.ts) as 500 error
	let notifications;
	try {
		notifications = await prisma.notification.findMany({
			where: { userId: req.user.id, read: false },
		});
	} catch (e) {
		// DB errors are handled at top-level (server.ts) as 500 error
		next(e);
		return;
	}
	if (!notifications) {
		const e = new Error();
		next(e);
		return;
	}

	// Second, return unread notifications back to client
	res.json({ notifications });
};

// Gets the user's read notifications
export const getNotifsRead = async (req, res, next) => {
	// First, try to get read notifications
	// If nothing is return (as oppposed to an empty array),
	// then handle it at the top-level (server.ts) as 500 error
	let notifications;
	try {
		notifications = await prisma.notification.findMany({
			where: { userId: req.user.id, read: true },
		});
	} catch (e) {
		// DB errors are handled at top-level (server.ts) as 500 error
		next(e);
		return;
	}
	if (!notifications) {
		const e = new Error();
		next(e);
		return;
	}

	// Second, return read notifications back to client
	res.json({ notifications });
};

// Updates a notification (as read)
export const updateNotifRead = async (req, res, next) => {
	// Update notification
	let notification;
	try {
		notification = await prisma.notification.update({
			where: { id: req.body.id },
			data: { read: true },
		});
	} catch (e) {
		// If error, handle it as a 500 error
		next(e);
		return;
	}

	// While the previous try/catch (along with the 'protect' middleware) should catch all errors,
	// this is added as an extra step of error handling (in case the update 'runs' but nothing is returned).
	if (!notification) {
		const e = new Error();
		next(e);
		return;
	}

	// Return updated user data
	res.json({ notification });
};
