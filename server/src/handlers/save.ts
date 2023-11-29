import prisma from '../db';

// Creates a save
export const createSave = async (req, res, next) => {
	// First, attempt to create save
	let save;
	try {
		save = await prisma.save.create({
			data: {
				postId: req.body.id,
				userId: req.user.id,
			},
		});
	} catch (e) {
		// DB errors are handled at top-level (server.ts) as 500 error
		next(e);
		return;
	}

	// If no post is created, handle it at the top-level (server.ts) as 500 error
	if (!save) {
		const e = new Error();
		next(e);
		return;
	}

	// Second, send save data back to client
	res.json({ save });
};

// Gets (limited number of) saves from post
export const getSaves = async (req, res, next) => {
	// First, get all saves from user with limit
	// If no saves are found, handle it at the top-level (server.ts) as 500 error
	let saves;
	try {
		saves = await prisma.save.findMany({
			where: { userId: req.user.id },
			take: req.body.limit,
			orderBy: { createdAt: 'desc' },
			include: {
				post: {
					include: {
						_count: {
							select: {
								comments: true,
								likes: true,
							},
						},
					},
				},
			},
		});
	} catch (e) {
		// DB errors are handled at top-level (server.ts) as 500 error
		next(e);
		return;
	}
	if (!saves) {
		const e = new Error();
		next(e);
		return;
	}

	// Second, return saves back to client
	res.json({ saves });
};

// Deletes a save
export const deleteSave = async (req, res, next) => {
	// First, attempt to delete the save
	let save;
	try {
		save = await prisma.save.delete({
			where: { id: req.body.id },
		});
	} catch (e) {
		// DB errors are handled at top-level (server.ts) as 500 error
		next(e);
		return;
	}

	// If no save is found-and-deleted, handle it at the top-level (server.ts) as 500 error
	if (!save) {
		const e = new Error();
		next(e);
		return;
	}

	// Finally, send deleted save back to client
	res.json({ save });
};

// Gets save based on user id & post id
export const getSavePost = async (req, res, next) => {
	// First, get save for post based on user id & post id
	let save;
	try {
		save = await prisma.save.findFirst({
			where: { postId: req.body.id, userId: req.user.id },
		});
	} catch (e) {
		// DB errors are handled at top-level (server.ts) as 500 error
		next(e);
		return;
	}

	// Second, return save (found or not) back to client
	res.json({ save });
};
