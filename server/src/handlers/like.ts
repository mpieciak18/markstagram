import prisma from '../db';

// Creates a like
export const createLike = async (req, res, next) => {
	// First, attempt to create like
	let like;
	try {
		like = await prisma.like.create({
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

	// If no like is created, handle it at the top-level (server.ts) as 500 error
	if (!like) {
		const e = new Error();
		next(e);
		return;
	}

	// Second, send like data back to client
	res.json({ like });
};

// Gets (limited number of) likes from post
export const getLikes = async (req, res, next) => {
	// First, get all likes from post with limit
	// If no likes are found, handle it at the top-level (server.ts) as 500 error
	let likes;
	try {
		likes = await prisma.like.findMany({
			where: { postId: req.body.id },
			take: req.body.limit,
			orderBy: { createdAt: 'desc' },
			include: {
				user: true,
			},
		});
	} catch (e) {
		// DB errors are handled at top-level (server.ts) as 500 error
		next(e);
		return;
	}
	if (!likes) {
		const e = new Error();
		next(e);
		return;
	}

	// Second, return likes back to client
	res.json({ likes });
};

// Deletes a like
export const deleteLike = async (req, res, next) => {
	// First, attempt to delete the like
	let like;
	try {
		like = await prisma.like.delete({
			where: { id: req.body.id },
		});
	} catch (e) {
		// DB errors are handled at top-level (server.ts) as 500 error
		next(e);
		return;
	}

	// If no like is found-and-deleted, handle it at the top-level (server.ts) as 500 error
	if (!like) {
		const e = new Error();
		next(e);
		return;
	}

	// Finally, send deleted like back to client
	res.json({ like });
};

// Gets like from signed-in user (if it exists for a post)
export const getLikeUser = async (req, res, next) => {
	// First, get like from post based on user id
	let like;
	try {
		like = await prisma.like.findFirst({
			where: { postId: req.body.id, userId: req.user.id },
		});
	} catch (e) {
		// DB errors are handled at top-level (server.ts) as 500 error
		next(e);
		return;
	}

	// Second, return like (found or not) back to client
	res.json({ like });
};
