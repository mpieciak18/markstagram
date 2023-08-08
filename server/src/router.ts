import { Router } from 'express';
import { body } from 'express-validator';
import { deleteUser } from './handlers/user';

const router = Router();

// // // // // //
//    Users    //
// // // // // //

// Delete a user's account
router.delete('/user', deleteUser);

// // // // // //
//   Follows   //
// // // // // //

// Gets a user's given follows (e.g., to see who they follow)
router.get('/follows/given');
// Gets a user's received follows (e.g., to see their followers)
router.get('/follows/received');
// Creates a new follow when one user (the giver) follows another (the receiver)
router.post('/follows');
// Deletes a follow when one user (the giver) unfollows another (the receiver)
router.delete('/follows');

// // // // // //
//    Posts    //
// // // // // //

// Gets (a limited number of) posts for home page
router.get('/posts/all');
// Gets (a limited number of) a user's posts
router.get('/posts/user');
// Gets a single post
router.get('/posts/:id');
// Updates a single post
router.put('/posts');
// Deletes a single posts
router.delete('/posts');

// synchronous error handler
// // add code once all handlers + auth middleware are created // //

export default router;
