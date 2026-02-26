import supertest from 'supertest';
import app from '../server.js';
import { it, describe, expect } from 'vitest';
import type { Conversation, Message } from '@markstagram/shared-types';
import { HasUsers } from '@markstagram/shared-types';
import { createSeededUserWithToken } from './helpers/userFactory.js';

describe('messages', () => {
  let token: string;
  let otherToken: string;
  let conversation: Conversation & HasUsers;
  let message: Message;
  const messageText = 'what is up';
  const user = {
    email: 'test111@test111.com',
    username: 'test111',
    password: '123_abc',
    name: 'Tester',
    bio: "I'm a test account.",
    image:
      'https://images.rawpixel.com/image_png_1300/cHJpdmF0ZS9sci9pbWFnZXMvd2Vic2l0ZS8yMDIzLTAxL3JtNjA5LXNvbGlkaWNvbi13LTAwMi1wLnBuZw.png',
    id: undefined as number | undefined,
  };
  const otherUser = {
    email: 'test222@test222.com',
    username: 'test222',
    password: '456_dfe',
    name: 'TESTER',
    image:
      'https://e7.pngegg.com/pngimages/178/595/png-clipart-user-profile-computer-icons-login-user-avatars-monochrome-black-thumbnail.png',
    bio: 'whattup',
    id: undefined as number | undefined,
  };
  it('should seed users and get web tokens + user ids', async () => {
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
  it('should create a conversation & return a 200 error + correct conversation info', async () => {
    const response = await supertest(app)
      .post('/api/conversation')
      .set('Authorization', `Bearer ${token}`)
      .send({ id: otherUser.id });
    conversation = response.body.conversation;
    const idOne = conversation.users[0].id;
    const idTwo = conversation.users[1].id;
    expect(response.status).toBe(200);
    expect(idOne == user.id || idOne == otherUser.id).toBeTruthy();
    expect(idTwo == user.id || idTwo == otherUser.id).toBeTruthy();
  });
  //
  it('should fail to create a message due to a non-existent conversation id & return a 404 code', async () => {
    const response = await supertest(app)
      .post('/api/message')
      .set('Authorization', `Bearer ${token}`)
      .send({ id: -1, message: messageText });
    expect(response.status).toBe(404);
  });
  it('should fail to create a message due to an invalid inputs & return a 400 code', async () => {
    const response = await supertest(app)
      .post('/api/message')
      .set('Authorization', `Bearer ${token}`)
      .send({ id: 'abc', message: null });
    expect(response.status).toBe(400);
  });
  it('should fail to create a message due to a missing inputs & return a 400 code', async () => {
    const response = await supertest(app)
      .post('/api/message')
      .set('Authorization', `Bearer ${token}`)
      .send({});
    expect(response.status).toBe(400);
  });
  it('should fail to create a message due to a missing auth token & return a 401 code', async () => {
    const response = await supertest(app)
      .post('/api/message')
      .set('Authorization', `Bearer`)
      .send({ id: conversation.id, message: messageText });
    expect(response.status).toBe(401);
  });
  it('should create a message & return a 200 code + correct message info', async () => {
    const response = await supertest(app)
      .post('/api/message')
      .set('Authorization', `Bearer ${token}`)
      .send({ id: conversation.id, message: messageText });
    message = response.body.message;
    expect(response.status).toBe(200);
    expect(message.conversationId).toBe(conversation.id);
    expect(message.senderId).toBe(user.id);
    expect(message.message).toBe(messageText);
  });
  //
  it('should fail to get all messages from a conversation due to an invalid inputs & return a 400 code', async () => {
    const response = await supertest(app)
      .post('/api/message/conversation')
      .set('Authorization', `Bearer ${token}`)
      .send({
        id: 'abc',
      });
    expect(response.status).toBe(400);
  });
  it('should fail to get all messages from a conversation due to a missing inputs & return a 400 code', async () => {
    const response = await supertest(app)
      .post('/api/message/conversation')
      .set('Authorization', `Bearer ${token}`)
      .send({});
    expect(response.status).toBe(400);
  });
  it('should fail to get all messages from a conversation due to a missing auth token & return a 401 code', async () => {
    const response = await supertest(app)
      .post('/api/message/conversation')
      .set('Authorization', `Bearer`)
      .send({ id: conversation.id });
    expect(response.status).toBe(401);
  });
  it('should get all messages from a conversation & return a 200 code + correct message info', async () => {
    const response = await supertest(app)
      .post('/api/message/conversation')
      .set('Authorization', `Bearer ${token}`)
      .send({ id: conversation.id });
    expect(response.status).toBe(200);
    expect(response.body.messages.length).toBeGreaterThan(0);
    expect(response.body.messages[0].senderId).toBe(message.senderId);
    expect(response.body.messages[0].conversationId).toBe(
      message.conversationId,
    );
    expect(response.body.messages[0].id).toBe(message.id);
    expect(response.body.messages[0].message).toBe(message.message);
  });
  //
  it('should fail to delete a message due to a non-existent message id & return a 404 code', async () => {
    const response = await supertest(app)
      .delete('/api/message')
      .set('Authorization', `Bearer ${token}`)
      .send({
        id: -1,
      });
    expect(response.status).toBe(404);
  });
  it('should fail to delete a message due to an invalid message id & return a 400 code', async () => {
    const response = await supertest(app)
      .delete('/api/message')
      .set('Authorization', `Bearer ${token}`)
      .send({
        id: 'abc',
      });
    expect(response.status).toBe(400);
  });
  it('should fail to delete a message due to a missing message id & return a 400 code', async () => {
    const response = await supertest(app)
      .delete('/api/message')
      .set('Authorization', `Bearer ${token}`)
      .send({});
    expect(response.status).toBe(400);
  });
  it('should fail to delete a message due to a missing auth token & return a 401 code', async () => {
    const response = await supertest(app)
      .delete('/api/message')
      .set('Authorization', `Bearer`)
      .send({ id: message.id });
    expect(response.status).toBe(401);
  });
  it('should delete a message & return a 200 code + correct message info', async () => {
    const response = await supertest(app)
      .delete('/api/message')
      .set('Authorization', `Bearer ${token}`)
      .send({
        id: message.id,
      });
    expect(response.status).toBe(200);
    expect(response.body.message.id).toBe(message.id);
    expect(response.body.message.senderId).toBe(message.senderId);
    expect(response.body.message.conversationId).toBe(message.conversationId);
  });
  //
  it('should delete a conversation & return a 200 code + correct conversation info', async () => {
    const response = await supertest(app)
      .delete('/api/conversation')
      .set('Authorization', `Bearer ${token}`)
      .send({
        id: conversation.id,
      });
    expect(response.status).toBe(200);
    expect(response.body.conversation.id).toBe(conversation.id);
  });
  //
  it('should delete the users & return a 200 code + correct user info', async () => {
    const response = await supertest(app)
      .delete('/api/user')
      .set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(200);
    expect(response.body.user.id).toBe(user.id);
    const response2 = await supertest(app)
      .delete('/api/user')
      .set('Authorization', `Bearer ${otherToken}`);
    expect(response2.status).toBe(200);
    expect(response2.body.user.id).toBe(otherUser.id);
  });
});
