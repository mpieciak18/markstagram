import { Router } from 'express';
import { body } from 'express-validator';
import {
	deleteUser,
	updateUser,
	getSingleUser,
	getUsersByName,
	isEmailUnique,
	isUsernameUnique,
} from './handlers/user';
import { handleInputErrors, uploadImage } from './modules/middleware';
import {
	createFollow,
	deleteFollow,
	findFollow,
	getGivenFollows,
	getReceivedFollows,
} from './handlers/follow';
import {
	createPost,
	getPosts,
	getSinglePost,
	getUserPosts,
	deletePost,
	updatePost,
} from './handlers/post';
import multer from 'multer';
import {
	createComment,
	deleteComment,
	updateComment,
	getComments,
	getSingleComment,
} from './handlers/comment';
import { createLike, deleteLike, getLikes } from './handlers/like';
import { createSave, deleteSave, getSaves } from './handlers/save';
import {
	createConversation,
	deleteConversation,
	getConversations,
	getConversation,
} from './handlers/conversation';
import { createMessage, deleteMessage, getMessages } from './handlers/message';

// export const upload = multer({
// 	storage: multer.memoryStorage(),
// 	limits: {
// 		fileSize: 5 * 1024 * 1024, // limit to 5MB
// 	},
// });

const storage = multer.memoryStorage();
export const upload = multer({ storage: storage });

const router = Router();

// // // // // //
//    Users    //
// // // // // //

// Update a user's account
router.put(
	'/user',
	body('email').optional().isEmail(),
	body('username').optional().isString().isLength({ min: 3, max: 15 }),
	body('password').optional().isString().isLength({ min: 4 }),
	body('name').optional().isString().isLength({ min: 3, max: 30 }),
	body('bio').optional().isString(),
	body('image').optional().isURL(),
	handleInputErrors,
	updateUser
);
// Gets a single user
router.post(
	'/user/single',
	body('id').isInt(),
	handleInputErrors,
	getSingleUser
);
// Searches for users (by name)
router.post(
	'/user/search',
	body('name').isString(),
	handleInputErrors,
	getUsersByName
);
// Checks if an email is unique (ie, not taken by another user)
router.post(
	'/user/is-email-unique',
	body('email').isString(),
	handleInputErrors,
	isEmailUnique
);
// Checks if a username is unique (ie, not taken by another user)
router.post(
	'/user/is-username-unique',
	body('username').isString(),
	handleInputErrors,
	isUsernameUnique
);
// Delete a user's account
router.delete('/user', handleInputErrors, deleteUser);

// // // // // //
//   Follows   //
// // // // // //

// Gets a user's given follows (e.g., to see who they follow)
router.post(
	'/follow/given',
	body('id').isInt(),
	handleInputErrors,
	getGivenFollows
);
// Gets a user's received follows (e.g., to see their followers)
router.post(
	'/follow/received',
	body('id').isInt(),
	handleInputErrors,
	getReceivedFollows
);
// Finds the follow data between the signed-in user & another user (if it exists)
router.post('/follow/user', body('id').isInt(), handleInputErrors, findFollow);
// Creates a follow when the signed-in user follows another user
router.post('/follow', body('id').isInt(), handleInputErrors, createFollow);
// Deletes a follow when the signed-in user unfollows another user
router.delete('/follow', body('id').isInt(), handleInputErrors, deleteFollow);

// // // // // //
//    Posts    //
// // // // // //

// Gets (a limited number of) posts for home page
router.post('/post/all', body('limit').isInt(), handleInputErrors, getPosts);
// Gets (a limited number of) a user's posts
router.post(
	'/post/user',
	body('id').isInt(),
	body('limit').isInt(),
	handleInputErrors,
	getUserPosts
);
// Gets a single post
router.post(
	'/post/single',
	body('id').isInt(),
	handleInputErrors,
	getSinglePost
);
// Creates a new post
router.post(
	'/post',
	upload.single('file'),
	body('caption').isString(),
	handleInputErrors,
	uploadImage,
	createPost
);
// Updates a single post
router.put(
	'/post',
	body('id').isInt(),
	body('caption').isString(),
	handleInputErrors,
	updatePost
);
// Deletes a single post
router.delete('/post', body('id').isInt(), handleInputErrors, deletePost);

// // // // // //
//   Comments  //
// // // // // //

// Gets (a limited number of) a post's comments
router.post(
	'/comment/post',
	body('id').isInt(),
	body('limit').isInt(),
	handleInputErrors,
	getComments
);
// Gets a single comment by id
router.post(
	'/comment/single',
	body('id').isInt(),
	handleInputErrors,
	getSingleComment
);
// Creates a new comment
router.post(
	'/comment',
	body('id').isInt(),
	body('message').isString(),
	handleInputErrors,
	createComment
);
// Updates a comment
router.put(
	'/comment',
	body('id').isInt(),
	body('message').isString(),
	handleInputErrors,
	updateComment
);
// Deletes a single post
router.delete('/comment', body('id').isInt(), handleInputErrors, deleteComment);

// // // // // //
//    Likes    //
// // // // // //

// Gets (a limited number of) a post's likes
router.post(
	'/like/post',
	body('id').isInt(),
	body('limit').isInt(),
	handleInputErrors,
	getLikes
);
// Creates a new comment
router.post('/like', body('id').isInt(), handleInputErrors, createLike);
// Deletes a single post
router.delete('/like', body('id').isInt(), handleInputErrors, deleteLike);

// // // // // //
//    Saves    //
// // // // // //

// Gets (a limited number of) a user's saves
router.post('/save/user', body('limit').isInt(), handleInputErrors, getSaves);
// Creates a new save
router.post('/save', body('id').isInt(), handleInputErrors, createSave);
// Deletes a single save
router.delete('/save', body('id').isInt(), handleInputErrors, deleteSave);

// // // // // //
//Conversations//
// // // // // //

// Gets a user's conversations
router.get('/conversation/user', getConversations);
// Gets a single conversation
router.post(
	'/conversation/single',
	body('id').isInt(),
	handleInputErrors,
	getConversation
);
// Creates a new conversation
router.post(
	'/conversation',
	body('id').isInt(),
	handleInputErrors,
	createConversation
);
// Deletes a single conversation
router.delete(
	'/conversation',
	body('id').isInt(),
	handleInputErrors,
	deleteConversation
);

// // // // // //
//   Messages  //
// // // // // //

// Gets a conversation's messages
router.post(
	'/message/conversation',
	body('id').isInt(),
	handleInputErrors,
	getMessages
);
// Creates a new message
router.post('/message', body('id').isInt(), handleInputErrors, createMessage);
// Deletes a single message
router.delete('/message', body('id').isInt(), handleInputErrors, deleteMessage);

// synchronous error handler
// @ts-ignore
router.use((err, req, res, next) => {
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

export default router;
