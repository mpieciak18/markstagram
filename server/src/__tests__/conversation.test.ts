import supertest from './helpers/httpClient.js';
import app from '../app.js';
import { it, describe, expect } from 'bun:test';
import type { Conversation } from '@markstagram/shared-types';
import { HasUsers } from '@markstagram/shared-types';
import { createSeededUserWithToken } from './helpers/userFactory.js';

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
    id: undefined as number | undefined,
  };
  const otherUser = {
    email: 'test99@test99.com',
    username: 'test99',
    password: '456_dfe',
    name: 'TESTER',
    image:
      'https://e7.pngegg.com/pngimages/178/595/png-clipart-user-profile-computer-icons-login-user-avatars-monochrome-black-thumbnail.png',
    bio: 'whattup',
    id: undefined as number | undefined,
  };
  it('should seed both users and get own web token + other user id', async () => {
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
  it('should fail to create a conversation due to a non-existent other user & return a 404 error', async () => {
    const response = await supertest(app)
      .post('/api/conversation')
      .set('Authorization', `Bearer ${token}`)
      .send({
        id: -1,
      });
    expect(response.status).toBe(404);
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
  it('should fail to get a conversation due to a non-existent other user & return a 404 error', async () => {
    const response = await supertest(app)
      .post('/api/conversation/otherUser')
      .set('Authorization', `Bearer ${token}`)
      .send({ id: -1, limit: 10 });
    expect(response.status).toBe(404);
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
  it('should fail to delete a conversation due to a non-existent conversation id & return a 404 error', async () => {
    const response = await supertest(app)
      .delete('/api/conversation')
      .set('Authorization', `Bearer ${token}`)
      .send({
        id: -1,
      });
    expect(response.status).toBe(404);
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
