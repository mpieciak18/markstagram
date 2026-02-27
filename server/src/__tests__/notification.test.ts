import supertest from './helpers/httpClient.js';
import app from '../app.js';
import { it, describe, expect } from 'bun:test';
import type { Notification, Post } from '@markstagram/shared-types';
import { createSeededUserWithToken } from './helpers/userFactory.js';

const urlPattern = /^(http|https):\/\/[^ "]+$/;
const runId = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

describe('/api/notification', () => {
  let token: string;
  let otherToken: string;
  let notification: Notification;
  const user = {
    email: `test888-${runId}@test3888.com`,
    username: `test3888${runId.slice(0, 4)}`,
    password: '123_abc',
    name: 'Tester',
    id: undefined as number | undefined,
  };
  const otherUser = {
    email: `test999-${runId}@test999.com`,
    username: `test999${runId.slice(0, 4)}`,
    password: '456_dfe',
    name: 'TESTER',
    id: undefined as number | undefined,
  };
  let post: Post;
  it('should seed both users + a post, get web tokens + user ids', async () => {
    const seeded = await createSeededUserWithToken(user);
    token = seeded.token;
    expect(token).toBeDefined();
    user.id = seeded.user.id;
    expect(user.id).toBeDefined();
    // // //
    const seededOther = await createSeededUserWithToken(otherUser);
    otherToken = seededOther.token;
    otherUser.id = seededOther.user.id;
    expect(otherUser.id).toBeDefined();
    // // //
    const caption = 'this is a test';
    const response3 = await supertest(app)
      .post('/api/post')
      .set('Authorization', `Bearer ${otherToken}`)
      .set('Content-Type', 'multipart/form-data')
      .field('caption', caption)
      .attach('file', './src/__tests__/test.png');
    post = response3.body.post;
    expect(response3.status).toBe(200);
    expect(post?.userId).toBe(otherUser.id);
    expect(post?.caption).toBe(caption);
    expect(post?.image).toMatch(urlPattern);
  });
  //
  it('should fail to create a notification due to an invalid / missing inputs & return a 400 error', async () => {
    const response = await supertest(app)
      .post('/api/notification')
      .set('Authorization', `Bearer ${token}`)
      .send({
        id: otherUser.id,
        // type: 'post',
        postId: 'this is an error',
      });
    expect(response.status).toBe(400);
  });
  it('should fail to create a notification due to no auth token & return a 401 error', async () => {
    const response = await supertest(app)
      .post('/api/notification')
      .set('Authorization', `Bearer`)
      .send({
        id: otherUser.id,
        type: 'post',
        postId: post.id,
      });
    expect(response.status).toBe(401);
  });
  it('should fail to create a notification due to a non-existent other user & return a 404 error', async () => {
    const response = await supertest(app)
      .post('/api/notification')
      .set('Authorization', `Bearer ${token}`)
      .send({
        id: -1,
        type: 'post',
        postId: post.id,
      });
    expect(response.status).toBe(404);
  });
  it('should create a notification & return a 200 code + correct notification info', async () => {
    const response = await supertest(app)
      .post('/api/notification')
      .set('Authorization', `Bearer ${token}`)
      .send({
        id: otherUser.id,
        type: 'post',
        postId: post.id,
      });
    notification = response.body.notification;
    expect(response.status).toBe(200);
    expect(response.body.notification.userId).toBe(otherUser.id);
    expect(response.body.notification.otherUserId).toBe(user.id);
    expect(response.body.notification.type).toBe('post');
    expect(response.body.notification.read).toBeFalsy();
  });
  //
  it('should fail to find unread notifications due to no auth token & return a 401 error', async () => {
    const response = await supertest(app)
      .post('/api/notification/unread')
      .set('Authorization', `Bearer`)
      .send({
        limit: 10,
      });
    expect(response.status).toBe(401);
  });
  it('should fail to find unread notifications due to invalid / missing inputs & return a 400 error', async () => {
    const response = await supertest(app)
      .post('/api/notification/unread')
      .set('Authorization', `Bearer ${token}`)
      .send({
        // limit: 10,
      });
    expect(response.status).toBe(400);
  });
  it('should find unread notifications & return a 200 error + correct notification info', async () => {
    const response = await supertest(app)
      .post('/api/notification/unread')
      .set('Authorization', `Bearer ${otherToken}`)
      .send({
        limit: 10,
      });
    expect(response.status).toBe(200);
    expect(response.body.notifications?.length).toBeGreaterThan(0);
    const newNotif = response.body.notifications[0];
    expect(newNotif.id).toEqual(notification.id);
  });
  //
  it('should fail to update notifications due to no auth token & return a 401 error', async () => {
    const response = await supertest(app)
      .put('/api/notification/read')
      .set('Authorization', `Bearer`);
    expect(response.status).toBe(401);
  });
  it('should update notifications & return a 200 error + updated records count', async () => {
    const response = await supertest(app)
      .put('/api/notification/read')
      .set('Authorization', `Bearer ${otherToken}`)
      .send({
        id: notification.id,
      });
    expect(response.status).toBe(200);
    const newNotif = notification;
    newNotif.read = true;
    expect(response.body.count).toBeGreaterThanOrEqual(0);
    notification.read = newNotif.read;
  });
  //
  it('should fail to find read notifications due to no auth token & return a 401 error', async () => {
    const response = await supertest(app)
      .post('/api/notification/read')
      .set('Authorization', `Bearer`)
      .send({ limit: 10 });
    expect(response.status).toBe(401);
  });
  it('should fail to find read notifications due to invalid / missing inputs & return a 400 error', async () => {
    const response = await supertest(app)
      .post('/api/notification/read')
      .set('Authorization', `Bearer ${token}`)
      .send({
        // limit: 10,
      });
    expect(response.status).toBe(400);
  });
  it('should find read notifications & return a 200 error + correct notification info', async () => {
    const response = await supertest(app)
      .post('/api/notification/read')
      .set('Authorization', `Bearer ${otherToken}`)
      .send({ limit: 10 });
    expect(response.status).toBe(200);
    expect(response.body.notifications?.length).toBeGreaterThan(0);
    const newNotif = response.body.notifications[0];
    expect(newNotif.id).toEqual(notification.id);
  });
  //
  it('should fail to delete a notification due to an invalid input & return a 400 error', async () => {
    const response = await supertest(app)
      .delete('/api/notification')
      .set('Authorization', `Bearer ${otherToken}`)
      .send({});
    expect(response.status).toBe(400);
  });
  it('should fail to delete a notification due to no auth token & return a 401 error', async () => {
    const response = await supertest(app).delete('/api/notification').send({
      id: notification.id,
    });
    expect(response.status).toBe(401);
  });
  it('should fail to delete a follow notification to a non-existent notification id & return a 404 error', async () => {
    const response = await supertest(app)
      .delete('/api/notification')
      .set('Authorization', `Bearer ${otherToken}`)
      .send({
        id: 0,
      });
    expect(response.status).toBe(404);
  });
  it('should delete a notification & return a 200 error + correct notification info', async () => {
    const response = await supertest(app)
      .delete('/api/notification')
      .set('Authorization', `Bearer ${otherToken}`)
      .send({
        id: notification.id,
      });
    expect(response.status).toBe(200);
    expect(response.body.notification.id).toBe(notification.id);
    await supertest(app)
      .delete('/api/post')
      .set('Authorization', `Bearer ${otherToken}`)
      .send({
        id: post.id,
      });
    await supertest(app)
      .delete('/api/user')
      .set('Authorization', `Bearer ${token}`);
    await supertest(app)
      .delete('/api/user')
      .set('Authorization', `Bearer ${otherToken}`);
  });
});
