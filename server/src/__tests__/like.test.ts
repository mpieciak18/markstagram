import supertest from 'supertest';
import app from '../server.js';
import { it, describe, expect } from 'vitest';
import type { Like, Post } from '@markstagram/shared-types';

const urlPattern = /^(http|https):\/\/[^ "]+$/;
const runId = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

describe('likes', () => {
  let token: string;
  const user = {
    email: `test66-${runId}@test66.com`,
    username: `t66${runId.slice(0, 4)}`,
    password: '123_abc',
    name: 'Tester',
    bio: "I'm a test account.",
    image:
      'https://firebasestorage.googleapis.com/v0/b/ig-clone-5b7ab.appspot.com/o/lsNWDlodVDUB7RmeRY9qZDe1S3k2%2FScreenshot%202023-04-14%20at%2017-10-51%20Markstagram.png?alt=media&token=7a1080c3-c648-4ef4-b5e4-f6da3760182d',
    id: undefined,
  };
  let token2: string;
  const user2 = {
    email: `test654-${runId}@test654.com`,
    username: `t65${runId.slice(-4)}`,
    password: '123_abc',
    name: 'Tester',
    bio: "I'm a test account.",
    image:
      'https://firebasestorage.googleapis.com/v0/b/ig-clone-5b7ab.appspot.com/o/lsNWDlodVDUB7RmeRY9qZDe1S3k2%2FScreenshot%202023-04-14%20at%2017-10-51%20Markstagram.png?alt=media&token=7a1080c3-c648-4ef4-b5e4-f6da3760182d',
    id: undefined,
  };
  const caption = 'testing, 1, 2, 3';
  let post: Post;
  const limit = 10;
  let like: Like;
  it('should create users, get web tokens, user ids, & a 200 status', async () => {
    const response = await supertest(app).post('/create_new_user').send(user);
    token = response.body.token;
    expect(response.body.token).toBeDefined();
    user.id = response.body.user?.id;
    expect(response.body.user?.id).toBeDefined();
    expect(response.status).toBe(200);
    //
    const response2 = await supertest(app).post('/create_new_user').send(user2);
    token2 = response2.body.token;
    expect(response2.body.token).toBeDefined();
    user2.id = response2.body.user?.id;
    expect(response2.body.user?.id).toBeDefined();
    expect(response2.status).toBe(200);
  });
  it('should create a post & return a 200 error + correct post info', async () => {
    const response = await supertest(app)
      .post('/api/post')
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'multipart/form-data')
      .field('caption', caption)
      .attach('file', './src/__tests__/test.png');
    post = response.body.post;
    expect(response.status).toBe(200);
    expect(post?.userId).toBe(user.id);
    expect(post?.caption).toBe(caption);
    expect(post?.image).toMatch(urlPattern);
  });
  //
  it('should fail to create a like due to a non-existent post id & return a 404 code', async () => {
    const response = await supertest(app)
      .post('/api/like')
      .set('Authorization', `Bearer ${token}`)
      .send({
        id: -1,
      });
    expect(response.status).toBe(404);
  });
  it('should fail to create a like due to an invalid inputs & return a 400 code', async () => {
    const response = await supertest(app)
      .post('/api/like')
      .set('Authorization', `Bearer ${token}`)
      .send({
        id: 'abc',
      });
    expect(response.status).toBe(400);
  });
  it('should fail to create a like due to a missing inputs & return a 400 code', async () => {
    const response = await supertest(app)
      .post('/api/like')
      .set('Authorization', `Bearer ${token}`)
      .send({});
    expect(response.status).toBe(400);
  });
  it('should fail to create a like due to a missing auth token & return a 401 code', async () => {
    const response = await supertest(app)
      .post('/api/like')
      .set('Authorization', `Bearer`)
      .send({ id: post.id });
    expect(response.status).toBe(401);
  });
  it('should create a like & return a 200 code + correct like info', async () => {
    const response = await supertest(app)
      .post('/api/like')
      .set('Authorization', `Bearer ${token}`)
      .send({ id: post.id });
    expect(response.status).toBe(200);
    expect(response.body.like.postId).toBe(post.id);
    expect(response.body.like.userId).toBe(user.id);
    like = response.body.like;
  });
  it('should be idempotent for duplicate like creation & return the existing like', async () => {
    const response = await supertest(app)
      .post('/api/like')
      .set('Authorization', `Bearer ${token}`)
      .send({ id: post.id });
    expect(response.status).toBe(200);
    expect(response.body.like.id).toBe(like.id);
    expect(response.body.like.postId).toBe(post.id);
    expect(response.body.like.userId).toBe(user.id);
  });
  //
  it("should fail to get user's like from a post due to an invalid inputs & return a 400 code", async () => {
    const response = await supertest(app)
      .post('/api/like/user')
      .set('Authorization', `Bearer ${token}`)
      .send({
        id: '1',
      });
    expect(response.status).toBe(400);
  });
  it("should fail to get user's like from a post due to a missing inputs & return a 400 code", async () => {
    const response = await supertest(app)
      .post('/api/like/user')
      .set('Authorization', `Bearer ${token}`)
      .send({});
    expect(response.status).toBe(400);
  });
  it("should fail to get user's like from a post due to a missing auth token & return a 401 code", async () => {
    const response = await supertest(app)
      .post('/api/like/user')
      .set('Authorization', `Bearer`)
      .send({ id: post.id });
    expect(response.status).toBe(401);
  });
  it("should get user's like from a post & return a 200 code + correct like info", async () => {
    const response = await supertest(app)
      .post('/api/like/user')
      .set('Authorization', `Bearer ${token}`)
      .send({ id: post.id });
    expect(response.status).toBe(200);
    expect(response.body.like).toBeDefined();
    expect(response.body.like.userId).toBe(user.id);
  });
  it("should not find ther other user's like from a post & return a 200 code", async () => {
    const response = await supertest(app)
      .post('/api/like/user')
      .set('Authorization', `Bearer ${token2}`)
      .send({ id: post.id });
    expect(response.status).toBe(200);
    expect(response.body.like).toBeFalsy();
  });
  //
  it('should fail to get all likes from a post due to an invalid inputs & return a 400 code', async () => {
    const response = await supertest(app)
      .post('/api/like/post')
      .set('Authorization', `Bearer ${token}`)
      .send({
        id: '1',
        limit: 'ten',
      });
    expect(response.status).toBe(400);
  });
  it('should fail to get all likes from a post due to a missing inputs & return a 400 code', async () => {
    const response = await supertest(app)
      .post('/api/like/post')
      .set('Authorization', `Bearer ${token}`)
      .send({});
    expect(response.status).toBe(400);
  });
  it('should fail to get all likes from a post due to a missing auth token & return a 401 code', async () => {
    const response = await supertest(app)
      .post('/api/like/post')
      .set('Authorization', `Bearer`)
      .send({ id: post.id, limit });
    expect(response.status).toBe(401);
  });
  it('should get all likes from a post & return a 200 code + correct like info', async () => {
    const response = await supertest(app)
      .post('/api/like/post')
      .set('Authorization', `Bearer ${token}`)
      .send({ id: post.id, limit });
    expect(response.status).toBe(200);
    expect(response.body.likes.length).toBeGreaterThan(0);
    expect(response.body.likes.length).toBeLessThanOrEqual(limit);
    expect(response.body.likes[0].userId).toBe(user.id);
  });
  //
  it('should fail to delete a like due to a non-existent like id & return a 404 code', async () => {
    const response = await supertest(app)
      .delete('/api/like')
      .set('Authorization', `Bearer ${token}`)
      .send({
        id: -1,
      });
    expect(response.status).toBe(404);
  });
  it('should fail to delete a like due to an invalid like id & return a 400 code', async () => {
    const response = await supertest(app)
      .delete('/api/like')
      .set('Authorization', `Bearer ${token}`)
      .send({
        id: 'abc',
      });
    expect(response.status).toBe(400);
  });
  it('should fail to delete a like due to a missing like id & return a 400 code', async () => {
    const response = await supertest(app)
      .delete('/api/like')
      .set('Authorization', `Bearer ${token}`)
      .send({});
    expect(response.status).toBe(400);
  });
  it('should fail to delete a like due to a missing auth token & return a 401 code', async () => {
    const response = await supertest(app)
      .delete('/api/like')
      .set('Authorization', `Bearer`)
      .send({ id: post.id });
    expect(response.status).toBe(401);
  });
  it('should delete a like & return a 200 code + correct like info', async () => {
    const response = await supertest(app)
      .delete('/api/like')
      .set('Authorization', `Bearer ${token}`)
      .send({
        id: like.id,
      });
    expect(response.status).toBe(200);
    expect(response.body.like.id).toBe(like.id);
    expect(response.body.like.userId).toBe(like.userId);
    expect(response.body.like.postId).toBe(like.postId);
  });
  //
  it('should delete a post & return a 200 code + correct post info', async () => {
    const response = await supertest(app)
      .delete('/api/post')
      .set('Authorization', `Bearer ${token}`)
      .send({
        id: post.id,
      });
    expect(response.status).toBe(200);
    expect(response.body.post.id).toBe(post.id);
    expect(response.body.post.caption).toBe(post.caption);
    expect(response.body.post.image).toMatch(urlPattern);
  });
  //
  it('should delete the users & return a 200 code + correct users info', async () => {
    const response = await supertest(app)
      .delete('/api/user')
      .set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(200);
    expect(response.body.user.id).toBe(user.id);
    //
    const response2 = await supertest(app)
      .delete('/api/user')
      .set('Authorization', `Bearer ${token2}`);
    expect(response2.status).toBe(200);
    expect(response2.body.user.id).toBe(user2.id);
  });
});
