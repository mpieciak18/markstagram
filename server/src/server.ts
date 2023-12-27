import express, { NextFunction, Request, Response } from 'express';
import router from './router.js';
import morgan from 'morgan';
import cors from 'cors';
import { protect } from './modules/auth.js';
import { signIn, createNewUser } from './handlers/user.js';
import { handleInputErrors } from './modules/middleware.js';
import { body } from 'express-validator';
import { SyncErr } from './types/types.js';

// init express
const app = express();

// default middleware
app.use(
	// cors({
	// 	origin: process.env.CLIENT_URL,
	// })
	cors()
);
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// test handler
app.get('/', (req, res) => {
	res.status(200);
	res.json({ message: 'hello' });
});

// auth middleware
app.use('/api', protect, router);
// user handlers
app.post(
	'/create_new_user',
	body('email').isEmail(),
	body('username').isString().isLength({ min: 3, max: 15 }),
	body('password').isString().isLength({ min: 4 }),
	body('name').isString().isLength({ min: 3, max: 30 }),
	handleInputErrors,
	createNewUser
);
app.post(
	'/sign_in',
	body('email').isEmail(),
	body('password').isString(),
	handleInputErrors,
	signIn
);
// health route / handler
app.get('/health_status', (req, res) => {
	res.status(200);
	res.json({ message: 'the server is running' });
});

// synchronous error handler
app.use((err: SyncErr, req: Request, res: Response, next: NextFunction) => {
	if (err.type === 'auth') {
		res.status(401);
		res.json({ message: 'unauthorized' });
	} else if (err.type === 'input') {
		res.status(400);
		res.json({ message: 'invalid input' });
	} else {
		res.status(500);
		res.json({ message: 'server error' });
	}
});

export default app;
