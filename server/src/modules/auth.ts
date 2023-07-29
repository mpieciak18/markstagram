import jwt from 'jsonwebtoken';
import * as bcrypt from 'bcrypt';

// Receives a user object, passes it along with the jwt_secret to the 'jwt' libary,
// and returns a signed JWT token.
export const createJwt = async (user: { id: any; username: any }) => {
	const token = jwt.sign(
		{
			id: user.id,
			username: user.username,
		},
		process.env.JWT_SECRET
	);
	return token;
};
// Validates a JWT token sent from the client and sends the verified token back.
// If there's no bearer inside the headers, no token inside the bearer, or the JWT token is unverified,
// then an error is sent back to the client instead.
export const protect = async (req, res, next) => {
	const bearer = req.headers.authorization;
	if (!bearer) {
		res.status(401);
		res.json({ message: 'Not Authorized' });
		return;
	}

	const [, token] = bearer.split(' ');
	if (!token) {
		res.status(401);
		res.json({ message: 'Invalid Token' });
		return;
	}

	try {
		const user = jwt.verify(token, process.env.JWT_SECRET);
		req.user = user;
		next();
	} catch (e) {
		console.log(e);
		res.status(401);
		res.json({ message: 'Token Unverifiable' });
		return;
	}
};

// Compares a password string (e.g., user input) to a password hash (e.g., database value)
// and returns a 'salt' if it passes or an error if it doesn't pass.
export const comparePasswords = async (password, hash) => {
	return bcrypt.compare(password, hash);
};

// Uses bcrypt to create a hash of a password (e.g., to then be stored in the database).
export const hashPassword = async (password) => {
	return bcrypt.hash(password, 5);
};
