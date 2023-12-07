import { NextFunction, Response } from 'express';
import prisma from '../db';
import { AuthReq, HasId, HasLimit } from '../types/types';
import { Follow, User } from '@prisma/client';

// Creates a new follow
export const createFollow = async (
	req: AuthReq & HasId,
	res: Response,
	next: NextFunction
) => {
	// First, confirm other user exists
	let otherUser: User | undefined;
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

	// Second, create follow
	let follow: Follow | undefined;
	try {
		follow = await prisma.follow.create({
			data: { giverId: req.user.id, receiverId: req.body.id },
		});
	} catch (e) {
		// DB errors are handled at top-level (server.ts) as 500 error
		next(e);
		return;
	}

	// If no follow is created, handle it at the top-level (server.ts) as 500 error
	if (!follow) {
		const e = new Error();
		next(e);
		return;
	}

	// Third (and finally), send follow data back to client
	res.json({ follow });
};

// Deletes a follow
export const deleteFollow = async (
	req: AuthReq & HasId,
	res: Response,
	next: NextFunction
) => {
	// First, delete follow
	let follow: Follow | undefined;
	try {
		follow = await prisma.follow.delete({
			where: { id: req.body.id },
		});
	} catch (e) {
		// DB errors are handled at top-level (server.ts) as 500 error
		next(e);
		return;
	}

	// If no follow is found-and-deleted, handle it at the top-level (server.ts) as 500 error
	if (!follow) {
		const e = new Error();
		next(e);
		return;
	}

	// Send deleted follow data back to client
	res.json({ follow });
};

// Gets a follow based on the other user's ID (if it exists)
export const findFollow = async (
	req: AuthReq & HasId,
	res: Response,
	next: NextFunction
) => {
	// First, confirm other user exists
	// If no user is found, handle it at the top-level (server.ts) as 500 error
	let otherUser: User | undefined;
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
	let givenFollow: Follow | undefined;
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
	let receivedFollow: Follow | undefined;
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
export const getGivenFollows = async (
	req: AuthReq & HasId & HasLimit,
	res: Response,
	next: NextFunction
) => {
	// First, confirm if provided user exists
	// If no user is found, handle it at the top-level (server.ts) as 500 error
	let otherUser: User | undefined;
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
	let givenFollows: Follow[] | undefined;
	try {
		givenFollows = await prisma.follow.findMany({
			where: { giverId: req.body.id },
			take: req.body.limit,
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
export const getReceivedFollows = async (
	req: AuthReq & HasId & HasLimit,
	res: Response,
	next: NextFunction
) => {
	// First, confirm if provided user exists
	// If no user is found, handle it at the top-level (server.ts) as 500 error
	let otherUser: User | undefined;
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
	let receivedFollows: Follow[];
	try {
		receivedFollows = await prisma.follow.findMany({
			where: { receiverId: req.body.id },
			take: req.body.limit,
		});
	} catch (e) {
		// DB errors are handled at top-level (server.ts) as 500 error
		next(e);
		return;
	}

	// Third, return given follows back to client
	res.json({ follows: receivedFollows });
};
