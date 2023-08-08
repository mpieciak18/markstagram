import prisma from '../db';
import { comparePasswords, createJwt, hashPassword } from '../modules/auth';

// Creates a new user in the database and returns a signed JWT to the client.
// Any error is assumed to be related to user input and is returned to the client as such.
export const createNewUser = async (req, res, next) => {
	try {
		const user = await prisma.user.create({
			data: {
				email: req.body.email,
				username: req.body.username,
				password: await hashPassword(req.body.password),
				name: req.body.name,
				bio: req.body.bio,
				image: req.body.image,
			},
		});
		const token = await createJwt(user);
		res.json({ token });
	} catch (e) {
		// Checks if error is a 'unique constraint failure'
		if (e.code == 'P2002') {
			if (e.meta.target.includes('email')) {
				res.status(400);
				res.json({ message: 'email in use' });
			} else if (e.meta.target.includes('username')) {
				res.status(400);
				res.json({ message: 'username in use' });
			} else {
				e.type = 'input';
				next(e);
			}
		} else {
			e.type = 'input';
			next(e);
		}
	}
};

// Verifies sign-in attempt by checking if username exists and if passwords match.
// If both conditions don't pass, then an error message is returned to the client.
// Otherwise, a signed JWT is returned back to the client.
export const signIn = async (req, res, next) => {
	// First, find user in database by username.
	const user = await prisma.user.findUnique({
		where: {
			username: req.body.username,
		},
	});
	if (!user) {
		res.status(401);
		res.json({ message: 'Invalid Username or Password' });
		return;
	}
	// Second, compare passwords (ie, user input vs database value).
	const isValid = await comparePasswords(req.body.password, user.password);
	if (!isValid) {
		res.status(401);
		res.json({ message: 'Invalid Username or Password' });
		return;
	}
	// Third, return auth token to client.
	const token = await createJwt(user);
	res.json({ token });
};

// Deletes a user's account from the database
// NOTE: Currently only used for testing purposes
export const deleteUser = async (req, res, next) => {
	// Check if user to be deleted belongs to signed in user
	let user;
	try {
		user = await prisma.user.findUnique({ where: { id: req.userId } });
	} catch (e) {
		next(e);
	}

	// Throw error if does not belong to user / not found
	if (!user) {
		const e = new Error();
		// @ts-expect-error
		e.type = 'auth';
		next(e);
	}

	// Delete user
	let deletedUser;
	try {
		deletedUser = await user.delete({ where: { id: user.id } });
	} catch (e) {
		next(e);
	}

	// Throw error (default AKA 500) if no deleted user is returned from the db
	if (!deletedUser) {
		const e = new Error();
		next(e);
	}

	// Return deleted user data
	res.json({ deletedUser });
};
