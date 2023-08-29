import prisma from '../db';

export const createPost = async (req, res, next) => {
	// If no image url is passed from the upload middleware, handle it at the top-level (server.ts) as 500 error
	if (!req.file) {
		const e = new Error();
		next(e);
		return;
	}

	// First, create post
	const { buffer } = req.file;
	let post;
	try {
		post = await prisma.post.create({
			data: {
				image: buffer,
				caption: req.body.caption,
				userId: req.user.id,
			},
		});
	} catch (e) {
		// DB errors are handled at top-level (server.ts) as 500 error
		next(e);
		return;
	}

	// If no post is created, handle it at the top-level (server.ts) as 500 error
	if (!post) {
		const e = new Error();
		next(e);
		return;
	}

	// Second, send post data back to client
	res.json({ post });
};

// Deletes a post
export const deletePost = async (req, res, next) => {
	// Delete the post
	let post;
	try {
		post = await prisma.post.delete({
			where: { id: req.body.id },
		});
	} catch (e) {
		// DB errors are handled at top-level (server.ts) as 500 error
		next(e);
		return;
	}

	// If no post is found-and-deleted, handle it at the top-level (server.ts) as 500 error
	if (!post) {
		const e = new Error();
		next(e);
		return;
	}

	// Send deleted follow data back to client
	res.json({ post });
};

// Updates a post
export const updatePost = async (req, res, next) => {
	// Format data needed for update
	const keys = ['caption'];
	const data = {};
	keys.forEach((key) => {
		if (req.body[key]) data[key] = req.body[key];
	});

	// Update post
	let post;
	try {
		post = await prisma.post.update({
			where: { id: req.body.id },
			data,
		});
	} catch (e) {
		// If error, handle it as a 500 error
		next(e);
	}

	// While the previous try/catch (along with the 'protect' middleware) should catch all errors,
	// this is added as an extra step of error handling (in case the update 'runs' but nothing is returned).
	if (!post) {
		const e = new Error();
		next(e);
		return;
	}

	// Return updated user data
	res.json({ post });
};
