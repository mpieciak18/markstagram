import supertest from 'supertest';
import app from '../server.js';
import { it, describe, expect } from 'vitest';
import { Follow } from '@prisma/client';

describe('POST /api/follow & DELETE /api/follow', () => {
  let token: string;
  let otherToken: string;
  let follow: Follow;
  const user = {
    email: 'test33@test33.com',
    username: 'test33',
    password: '123_abc',
    name: 'Tester',
    bio: "I'm a test account.",
    image:
      'https://images.rawpixel.com/image_png_1300/cHJpdmF0ZS9sci9pbWFnZXMvd2Vic2l0ZS8yMDIzLTAxL3JtNjA5LXNvbGlkaWNvbi13LTAwMi1wLnBuZw.png',
    id: undefined,
  };
  const otherUser = {
    email: 'test23456@test23456.com',
    username: 'test23456',
    password: '456_dfe',
    name: 'TESTER',
    image:
      'https://e7.pngegg.com/pngimages/178/595/png-clipart-user-profile-computer-icons-login-user-avatars-monochrome-black-thumbnail.png',
    bio: 'whattup',
    id: undefined,
  };
  it('should create both users, get own web token, other user id, & a 200 status', async () => {
    const response = await supertest(app).post('/create_new_user').send(user);
    token = response.body.token;
    expect(response.body.token).toBeDefined();
    user.id = response.body.user?.id;
    expect(response.body.user?.id).toBeDefined();
    expect(response.status).toBe(200);
    // // //
    const response2 = await supertest(app)
      .post('/create_new_user')
      .send(otherUser);
    otherToken = response2.body.token;
    otherUser.id = response2.body.user?.id;
    expect(response2.body.user?.id).toBeDefined();
    expect(response2.status).toBe(200);
  });
  //
  it('should fail to create a follow due to an invalid input (ie, no other user id) & return a 400 error', async () => {
    const response = await supertest(app)
      .post('/api/follow')
      .set('Authorization', `Bearer ${token}`)
      .send({});
    expect(response.status).toBe(400);
  });
  it('should fail to create a follow due to no auth token & return a 401 error', async () => {
    const response = await supertest(app)
      .post('/api/follow')
      .set('Authorization', `Bearer`)
      .send({
        id: otherUser.id,
      });
    expect(response.status).toBe(401);
  });
  it('should fail to create a follow due to a non-existent other user & return a 500 error', async () => {
    const response = await supertest(app)
      .post('/api/follow')
      .set('Authorization', `Bearer ${token}`)
      .send({
        id: 1,
      });
    expect(response.status).toBe(500);
  });
  it('should create a follow & return a 200 error + correct follow info', async () => {
    const response = await supertest(app)
      .post('/api/follow')
      .set('Authorization', `Bearer ${token}`)
      .send({
        id: otherUser.id,
      });
    follow = response.body.follow;
    expect(response.status).toBe(200);
    expect(response.body.follow.giverId).toBe(user.id);
    expect(response.body.follow.receiverId).toBe(otherUser.id);
  });
  //
  it('should fail to find follow data due to an invalid input (ie, no other user id) & return a 400 error', async () => {
    const response = await supertest(app)
      .post('/api/follow/user')
      .set('Authorization', `Bearer ${token}`)
      .send({});
    expect(response.status).toBe(400);
  });
  it('should fail to find follow data due to no auth token & return a 401 error', async () => {
    const response = await supertest(app)
      .post('/api/follow/user')
      .set('Authorization', `Bearer`)
      .send({ id: otherUser.id });
    expect(response.status).toBe(401);
  });
  it('should fail to find follow data due to a non-existent other user & return a 500 error', async () => {
    const response = await supertest(app)
      .post('/api/follow/user')
      .set('Authorization', `Bearer ${token}`)
      .send({ id: 1 });
    expect(response.status).toBe(500);
  });
  it('should find follow data & return a 200 error + correct follow info', async () => {
    const response = await supertest(app)
      .post('/api/follow/user')
      .set('Authorization', `Bearer ${token}`)
      .send({ id: otherUser.id });
    expect(response.status).toBe(200);
    expect(response.body.givenFollow.giverId).toBe(user.id);
    expect(response.body.givenFollow.receiverId).toBe(otherUser.id);
    expect(response.body.receivedFollow).toBeNull();
  });
  //
  it('should fail to find given follows due to an invalid / missing inputs & return a 400 error', async () => {
    const response = await supertest(app)
      .post('/api/follow/given')
      .set('Authorization', `Bearer ${token}`)
      .send({ limit: 'cheese' });
    expect(response.status).toBe(400);
  });
  it('should fail to find given follows due to no auth token & return a 401 error', async () => {
    const response = await supertest(app)
      .post('/api/follow/given')
      .set('Authorization', `Bearer 1234`)
      .send({ id: user.id, limit: 10 });
    expect(response.status).toBe(401);
  });
  it('should fail to find given follows due to a non-existent other user & return a 500 error', async () => {
    const response = await supertest(app)
      .post('/api/follow/given')
      .set('Authorization', `Bearer ${token}`)
      .send({ id: 1, limit: 10 });
    expect(response.status).toBe(500);
  });
  it('should find given follows for both users & return a 200 error + correct follows data', async () => {
    const response = await supertest(app)
      .post('/api/follow/given')
      .set('Authorization', `Bearer ${token}`)
      .send({ id: user.id, limit: 10 });
    expect(response.status).toBe(200);
    expect(response.body.follows.length).toBeGreaterThan(0);
    expect(response.body.follows[0].giverId).toBe(user.id);
    expect(response.body.follows[0].otherUser.id).toBe(otherUser.id);
    expect(response.body.follows[0].receiverId).toBe(otherUser.id);
    const response2 = await supertest(app)
      .post('/api/follow/given')
      .set('Authorization', `Bearer ${token}`)
      .send({ id: otherUser.id, limit: 10 });
    expect(response2.status).toBe(200);
    expect(response2.body.follows.length).toEqual(0);
  });
  //
  it('should fail to find received follows due to an invalid / missing inputs & return a 400 error', async () => {
    const response = await supertest(app)
      .post('/api/follow/received')
      .set('Authorization', `Bearer ${token}`)
      .send({ limit: 'hey now' });
    expect(response.status).toBe(400);
  });
  it('should fail to find given follows due to no auth token & return a 401 error', async () => {
    const response = await supertest(app)
      .post('/api/follow/received')
      .set('Authorization', `Bearer 1234`)
      .send({ id: otherUser.id, limit: 10 });
    expect(response.status).toBe(401);
  });
  it('should fail to find given follows due to a non-existent other user & return a 500 error', async () => {
    const response = await supertest(app)
      .post('/api/follow/received')
      .set('Authorization', `Bearer ${token}`)
      .send({ id: 1, limit: 10 });
    expect(response.status).toBe(500);
  });
  it('should find given follows for both users & return a 200 error + correct follows data', async () => {
    const response = await supertest(app)
      .post('/api/follow/received')
      .set('Authorization', `Bearer ${token}`)
      .send({ id: otherUser.id, limit: 10 });
    expect(response.status).toBe(200);
    expect(response.body.follows.length).toBeGreaterThan(0);
    expect(response.body.follows[0].receiverId).toBe(otherUser.id);
    expect(response.body.follows[0].giverId).toBe(user.id);
    expect(response.body.follows[0].otherUser.id).toBe(user.id);
    const response2 = await supertest(app)
      .post('/api/follow/received')
      .set('Authorization', `Bearer ${token}`)
      .send({ id: user.id, limit: 10 });
    expect(response2.status).toBe(200);
    expect(response2.body.follows.length).toEqual(0);
  });
  //
  it('should fail to delete a follow due to an invalid input (ie, no follow id) & return a 400 error', async () => {
    const response = await supertest(app)
      .delete('/api/follow')
      .set('Authorization', `Bearer ${token}`)
      .send({});
    expect(response.status).toBe(400);
  });
  it('should fail to delete a follow due to no auth token & return a 401 error', async () => {
    const response = await supertest(app).delete('/api/follow').send({
      id: follow.id,
    });
    expect(response.status).toBe(401);
  });
  it('should fail to delete a follow due to a non-existent follow id & return a 500 error', async () => {
    const response = await supertest(app)
      .delete('/api/follow')
      .set('Authorization', `Bearer ${token}`)
      .send({
        id: 1,
      });
    expect(response.status).toBe(500);
  });
  it('should delete a follow & return a 200 error + correct follow info', async () => {
    const response = await supertest(app)
      .delete('/api/follow')
      .set('Authorization', `Bearer ${token}`)
      .send({
        id: follow.id,
      });
    expect(response.status).toBe(200);
    expect(response.body.follow.giverId).toBe(user.id);
    expect(response.body.follow.receiverId).toBe(otherUser.id);
    expect(response.body.follow.id).toBe(follow.id);
    await supertest(app)
      .delete('/api/user')
      .set('Authorization', `Bearer ${token}`);
    await supertest(app)
      .delete('/api/user')
      .set('Authorization', `Bearer ${otherToken}`);
  });
});
