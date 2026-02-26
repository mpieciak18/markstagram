import supertest from './helpers/httpClient.js';
import app from '../app.js';
import { it, describe, expect } from 'vitest';
import type { Post, Save } from '@markstagram/shared-types';
import { createSeededUserWithToken } from './helpers/userFactory.js';

const urlPattern = /^(http|https):\/\/[^ "]+$/;
const runId = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

describe('saves', () => {
  let token: string;
  const user = {
    email: `test77-${runId}@test77.com`,
    username: `t77${runId.slice(0, 4)}`,
    password: '123_abc',
    name: 'Tester',
    bio: "I'm a test account.",
    image:
      'https://firebasestorage.googleapis.com/v0/b/ig-clone-5b7ab.appspot.com/o/lsNWDlodVDUB7RmeRY9qZDe1S3k2%2FScreenshot%202023-04-14%20at%2017-10-51%20Markstagram.png?alt=media&token=7a1080c3-c648-4ef4-b5e4-f6da3760182d',
    id: undefined as number | undefined,
  };
  const caption = 'testing, 1, 2, 3';
  let post: Post;
  const limit = 10;
  let save: Save;
  it('should seed user and get web token + user id', async () => {
    const seeded = await createSeededUserWithToken(user);
    token = seeded.token;
    expect(token).toBeDefined();
    user.id = seeded.user.id;
    expect(user.id).toBeDefined();
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
  it('should fail to create a save due to a non-existent post id & return a 404 code', async () => {
    const response = await supertest(app)
      .post('/api/save')
      .set('Authorization', `Bearer ${token}`)
      .send({
        id: -1,
      });
    expect(response.status).toBe(404);
  });
  it('should fail to create a save due to an invalid inputs & return a 400 code', async () => {
    const response = await supertest(app)
      .post('/api/save')
      .set('Authorization', `Bearer ${token}`)
      .send({
        id: 'abc',
      });
    expect(response.status).toBe(400);
  });
  it('should fail to create a save due to a missing inputs & return a 400 code', async () => {
    const response = await supertest(app)
      .post('/api/save')
      .set('Authorization', `Bearer ${token}`)
      .send({});
    expect(response.status).toBe(400);
  });
  it('should fail to create a save due to a missing auth token & return a 401 code', async () => {
    const response = await supertest(app)
      .post('/api/save')
      .set('Authorization', `Bearer`)
      .send({ id: post.id });
    expect(response.status).toBe(401);
  });
  it('should create a save & return a 200 code + correct save info', async () => {
    const response = await supertest(app)
      .post('/api/save')
      .set('Authorization', `Bearer ${token}`)
      .send({ id: post.id });
    expect(response.status).toBe(200);
    expect(response.body.save.postId).toBe(post.id);
    expect(response.body.save.userId).toBe(user.id);
    save = response.body.save;
  });
  it('should be idempotent for duplicate save creation & return the existing save', async () => {
    const response = await supertest(app)
      .post('/api/save')
      .set('Authorization', `Bearer ${token}`)
      .send({ id: post.id });
    expect(response.status).toBe(200);
    expect(response.body.save.id).toBe(save.id);
    expect(response.body.save.postId).toBe(post.id);
    expect(response.body.save.userId).toBe(user.id);
  });
  //
  it("should fail to get user's save from a post due to an invalid inputs & return a 400 code", async () => {
    const response = await supertest(app)
      .post('/api/save/post')
      .set('Authorization', `Bearer ${token}`)
      .send({
        id: '1',
      });
    expect(response.status).toBe(400);
  });
  it("should fail to get user's save from a post due to a missing inputs & return a 400 code", async () => {
    const response = await supertest(app)
      .post('/api/save/post')
      .set('Authorization', `Bearer ${token}`)
      .send({});
    expect(response.status).toBe(400);
  });
  it("should fail to get user's save from a post due to a missing auth token & return a 401 code", async () => {
    const response = await supertest(app)
      .post('/api/save/post')
      .set('Authorization', `Bearer`)
      .send({ id: post.id });
    expect(response.status).toBe(401);
  });
  it("should get user's save from a post & return a 200 code + correct like info", async () => {
    const response = await supertest(app)
      .post('/api/save/post')
      .set('Authorization', `Bearer ${token}`)
      .send({ id: post.id });
    expect(response.status).toBe(200);
    expect(response.body.save).toBeDefined();
    expect(response.body.save.userId).toBe(user.id);
  });
  //
  it('should fail to get all saves from a user due to an invalid inputs & return a 400 code', async () => {
    const response = await supertest(app)
      .post('/api/save/user')
      .set('Authorization', `Bearer ${token}`)
      .send({
        id: '1',
        limit: 'ten',
      });
    expect(response.status).toBe(400);
  });
  it('should fail to get all saves from a user due to a missing inputs & return a 400 code', async () => {
    const response = await supertest(app)
      .post('/api/save/user')
      .set('Authorization', `Bearer ${token}`)
      .send({});
    expect(response.status).toBe(400);
  });
  it('should fail to get all saves from a user due to a missing auth token & return a 401 code', async () => {
    const response = await supertest(app)
      .post('/api/save/user')
      .set('Authorization', `Bearer`)
      .send({ id: post.id, limit });
    expect(response.status).toBe(401);
  });
  it('should get all saves from a user & return a 200 code + correct save info', async () => {
    const response = await supertest(app)
      .post('/api/save/user')
      .set('Authorization', `Bearer ${token}`)
      .send({ id: post.id, limit });
    expect(response.status).toBe(200);
    expect(response.body.saves.length).toBeGreaterThan(0);
    expect(response.body.saves.length).toBeLessThanOrEqual(limit);
    expect(response.body.saves[0].userId).toBe(user.id);
  });
  //
  it('should fail to delete a save due to a non-existent save id & return a 404 code', async () => {
    const response = await supertest(app)
      .delete('/api/save')
      .set('Authorization', `Bearer ${token}`)
      .send({
        id: -1,
      });
    expect(response.status).toBe(404);
  });
  it('should fail to delete a save due to an invalid save id & return a 400 code', async () => {
    const response = await supertest(app)
      .delete('/api/save')
      .set('Authorization', `Bearer ${token}`)
      .send({
        id: 'abc',
      });
    expect(response.status).toBe(400);
  });
  it('should fail to delete a save due to a missing save id & return a 400 code', async () => {
    const response = await supertest(app)
      .delete('/api/save')
      .set('Authorization', `Bearer ${token}`)
      .send({});
    expect(response.status).toBe(400);
  });
  it('should fail to delete a save due to a missing auth token & return a 401 code', async () => {
    const response = await supertest(app)
      .delete('/api/save')
      .set('Authorization', `Bearer`)
      .send({ id: post.id });
    expect(response.status).toBe(401);
  });
  it('should delete a save & return a 200 code + correct save info', async () => {
    const response = await supertest(app)
      .delete('/api/save')
      .set('Authorization', `Bearer ${token}`)
      .send({
        id: save.id,
      });
    expect(response.status).toBe(200);
    expect(response.body.save.id).toBe(save.id);
    expect(response.body.save.userId).toBe(save.userId);
    expect(response.body.save.postId).toBe(save.postId);
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
  it('should delete the user & return a 200 code + correct user info', async () => {
    const response = await supertest(app)
      .delete('/api/user')
      .set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(200);
    expect(response.body.user.id).toBe(user.id);
  });
});
