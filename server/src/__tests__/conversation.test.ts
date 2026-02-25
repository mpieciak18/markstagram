import supertest from 'supertest';
import app from '../server.js';
import { it, describe, expect } from 'vitest';
import type { Conversation } from '@markstagram/shared-types';
import { HasUsers } from '@markstagram/shared-types';

describe('conversations', () => {
  let token: string;
  let otherToken: string;
  let conversation: Conversation & HasUsers;
  const user = {
    email: 'test88@test88.com',
    username: 'test88',
    password: '123_abc',
    name: 'Tester',
    bio: "I'm a test account.",
    image:
      'https://images.rawpixel.com/image_png_1300/cHJpdmF0ZS9sci9pbWFnZXMvd2Vic2l0ZS8yMDIzLTAxL3JtNjA5LXNvbGlkaWNvbi13LTAwMi1wLnBuZw.png',
    id: undefined,
  };
  const otherUser = {
    email: 'test99@test99.com',
    username: 'test99',
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
  it('should fail to create a conversation due to an missing input & return a 400 error', async () => {
    const response = await supertest(app)
      .post('/api/conversation')
      .set('Authorization', `Bearer ${token}`)
      .send({});
    expect(response.status).toBe(400);
  });
  it('should fail to create a conversation due to an invalid input & return a 400 error', async () => {
    const response = await supertest(app)
      .post('/api/conversation')
      .set('Authorization', `Bearer ${token}`)
      .send({ id: 'abc' });
    expect(response.status).toBe(400);
  });
  it('should fail to create a conversation due to no auth token & return a 401 error', async () => {
    const response = await supertest(app)
      .post('/api/conversation')
      .set('Authorization', `Bearer`)
      .send({
        id: otherUser.id,
      });
    expect(response.status).toBe(401);
  });
  it('should fail to create a conversation due to a non-existent other user & return a 500 error', async () => {
    const response = await supertest(app)
      .post('/api/conversation')
      .set('Authorization', `Bearer ${token}`)
      .send({
        id: 1,
      });
    expect(response.status).toBe(500);
  });
  it('should create a conversation & return a 200 error + correct conversation info', async () => {
    const response = await supertest(app)
      .post('/api/conversation')
      .set('Authorization', `Bearer ${token}`)
      .send({
        id: otherUser.id,
      });
    conversation = response.body.conversation;
    const idOne = conversation.users[0].id;
    const idTwo = conversation.users[1].id;
    expect(response.status).toBe(200);
    expect(idOne == user.id || idOne == otherUser.id).toBeTruthy();
    expect(idTwo == user.id || idTwo == otherUser.id).toBeTruthy();
  });
  //
  it('should fail to get a conversation due to missing inputs & return a 400 error', async () => {
    const response = await supertest(app)
      .post('/api/conversation/otherUser')
      .set('Authorization', `Bearer ${token}`)
      .send({});
    expect(response.status).toBe(400);
  });
  it('should fail to get a conversation due to invalid inputs & return a 400 error', async () => {
    const response = await supertest(app)
      .post('/api/conversation/otherUser')
      .set('Authorization', `Bearer ${token}`)
      .send({ id: 'abc', limit: 'abc' });
    expect(response.status).toBe(400);
  });
  it('should fail to get a conversation due to no auth token & return a 401 error', async () => {
    const response = await supertest(app)
      .post('/api/conversation/otherUser')
      .set('Authorization', `Bearer`)
      .send({ id: otherUser.id, limit: 10 });
    expect(response.status).toBe(401);
  });
  it('should fail to get a conversation due to a non-existent other user & return a 500 error', async () => {
    const response = await supertest(app)
      .post('/api/conversation/otherUser')
      .set('Authorization', `Bearer ${token}`)
      .send({ id: 1, limit: 10 });
    expect(response.status).toBe(500);
  });
  it('should get a conversation & return a 200 error + correct conversation info', async () => {
    const response = await supertest(app)
      .post('/api/conversation/otherUser')
      .set('Authorization', `Bearer ${token}`)
      .send({ id: otherUser.id, limit: 10 });
    const idOne = response.body.conversation.users[0].id;
    const idTwo = response.body.conversation.users[1].id;
    expect(response.status).toBe(200);
    expect(idOne == user.id || idOne == otherUser.id).toBeTruthy();
    expect(idTwo == user.id || idTwo == otherUser.id).toBeTruthy();
  });
  //
  it("should fail to get a user's conversations due to no auth token & return a 401 error", async () => {
    const response = await supertest(app)
      .post('/api/conversation/user')
      .set('Authorization', `Bearer`)
      .send({ limit: 10 });
    expect(response.status).toBe(401);
  });
  it("should fail to get a user's conversations due missing / invalid inputs & return a 401 error", async () => {
    const response = await supertest(app)
      .post('/api/conversation/user')
      .set('Authorization', `Bearer`)
      .send({ limit: 'abc' });
    expect(response.status).toBe(401);
  });
  it("should get a user's conversations & return a 200 error + correct conversations info", async () => {
    const response = await supertest(app)
      .post('/api/conversation/user')
      .set('Authorization', `Bearer ${token}`)
      .send({ limit: 10 });
    expect(response.status).toBe(200);
    expect(response.body.conversations.length).toBeGreaterThan(0);
    const response2 = await supertest(app)
      .post('/api/conversation/user')
      .set('Authorization', `Bearer ${token}`)
      .send({ limit: 10 });
    expect(response2.status).toBe(200);
    expect(response2.body.conversations.length).toBeGreaterThan(0);
  });
  //
  it('should fail to delete a conversation due to an missing input & return a 400 error', async () => {
    const response = await supertest(app)
      .delete('/api/conversation')
      .set('Authorization', `Bearer ${token}`)
      .send({});
    expect(response.status).toBe(400);
  });
  it('should fail to delete a conversation due to an invalid input & return a 400 error', async () => {
    const response = await supertest(app)
      .delete('/api/conversation')
      .set('Authorization', `Bearer ${token}`)
      .send({ id: 'abc' });
    expect(response.status).toBe(400);
  });
  it('should fail to delete a conversation due to no auth token & return a 401 error', async () => {
    const response = await supertest(app).delete('/api/conversation').send({
      id: conversation.id,
    });
    expect(response.status).toBe(401);
  });
  it('should fail to delete a conversation due to a non-existent conversation id & return a 500 error', async () => {
    const response = await supertest(app)
      .delete('/api/conversation')
      .set('Authorization', `Bearer ${token}`)
      .send({
        id: 1,
      });
    expect(response.status).toBe(500);
  });
  it('should delete a conversation & return a 200 error + correct conversation info', async () => {
    const response = await supertest(app)
      .delete('/api/conversation')
      .set('Authorization', `Bearer ${token}`)
      .send({
        id: conversation.id,
      });
    const idOne = response.body.conversation.users[0].id;
    const idTwo = response.body.conversation.users[1].id;
    expect(response.status).toBe(200);
    expect(idOne == user.id || idOne == otherUser.id).toBeTruthy();
    expect(idTwo == user.id || idTwo == otherUser.id).toBeTruthy();
    const res2 = await supertest(app)
      .delete('/api/user')
      .set('Authorization', `Bearer ${token}`);
    const res3 = await supertest(app)
      .delete('/api/user')
      .set('Authorization', `Bearer ${otherToken}`);
    expect(res2.body.user.id).toEqual(user.id);
    expect(res3.body.user.id).toEqual(otherUser.id);
  });
});
