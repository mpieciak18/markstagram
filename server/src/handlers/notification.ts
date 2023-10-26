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
	try {
		notification = await prisma.notification.create({
			data: {
				userId: req.user.id,
				message: req.body.message,
				urlPath: req.body.urlPath,
				read: false,
			},
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

// Gets a follow based on the other user's ID (if it exists)
export const findFollow = async (req, res, next) => {
	// First, confirm other user exists
	// If no user is found, handle it at the top-level (server.ts) as 500 error
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
	if (!otherUser) {
		const e = new Error();
		next(e);
		return;
	}

	// Second, find if signed-in user followed other user
	let givenFollow;
	try {
		givenFollow = await prisma.follow.findFirst({
			where: { giverId: req.user.id, receiverId: req.body.id },
		});
	} catch (e) {
		// DB errors are handled at top-level (server.ts) as 500 error
		next(e);
		return;
	}

	// Third, find if signed-in user is followed by other user
	let receivedFollow;
	try {
		receivedFollow = await prisma.follow.findFirst({
			where: { giverId: req.body.id, receiverId: req.user.id },
		});
	} catch (e) {
		// DB errors are handled at top-level (server.ts) as 500 error
		next(e);
		return;
	}

	// Fourth, return data back to client
	res.json({ givenFollow, receivedFollow });
};

// Gets the follows given by (any) user
export const getGivenFollows = async (req, res, next) => {
	// First, confirm if provided user exists
	// If no user is found, handle it at the top-level (server.ts) as 500 error
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
	if (!otherUser) {
		const e = new Error();
		next(e);
		return;
	}

	// Second, retrieve given follows
	let givenFollows;
	try {
		givenFollows = await prisma.follow.findMany({
			where: { giverId: req.body.id },
		});
	} catch (e) {
		// DB errors are handled at top-level (server.ts) as 500 error
		next(e);
		return;
	}

	// Third, return given follows back to client
	res.json({ follows: givenFollows });
};

// Gets the follows received by (any) user
export const getReceivedFollows = async (req, res, next) => {
	// First, confirm if provided user exists
	// If no user is found, handle it at the top-level (server.ts) as 500 error
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
	if (!otherUser) {
		const e = new Error();
		next(e);
		return;
	}

	// Second, retrieve received follows
	let receivedFollows;
	try {
		receivedFollows = await prisma.follow.findMany({
			where: { receiverId: req.body.id },
		});
	} catch (e) {
		// DB errors are handled at top-level (server.ts) as 500 error
		next(e);
		return;
	}

	// Third, return given follows back to client
	res.json({ follows: receivedFollows });
};
