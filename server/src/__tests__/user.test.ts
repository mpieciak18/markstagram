import app from '../app.js';
import supertest from './helpers/httpClient.js';
import { SignJWT } from 'jose';
import { it, describe, expect } from 'bun:test';
import { deleteFileFromStorage } from '../config/gcloud.js';
import { UserStatsCount, User } from '@markstagram/shared-types';

const urlPattern = /^(http|https):\/\/[^ "]+$/;
const runId = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

describe('/create_new_user, /sign_in, & /api/user', () => {
  const jwtSecret = process.env.JWT_SECRET ?? 'test-jwt-secret';
  process.env.JWT_SECRET = jwtSecret;
  let token: string;
  let otherToken: string;
  const initUser = {
    email: `test11-${runId}@test11.com`,
    username: `test11${runId.slice(0, 4)}`,
    password: '123_abc',
    name: 'Tester',
  };
  const initOtherUser = {
    email: `test69-${runId}@test69.com`,
    username: `test69${runId.slice(0, 4)}`,
    password: '123_abc',
    name: 'Tester',
  };
  let user: User & UserStatsCount;
  let otherUser: User & UserStatsCount;
  const newUser = {
    email: `test12345-${runId}@test12345.com`,
    username: `test12345${runId.slice(0, 4)}`,
    password: '456_dfe',
    name: 'TESTER',
    bio: 'whattup',
  };
  //
  it('should fail to create a new user due to missing inputs & return a 400 status', async () => {
    const response = await supertest(app).post('/create_new_user').send({
      email: initUser.email,
      username: initUser.username,
      password: initUser.password,
    });
    expect(response.status).toBe(400);
  });
  it('should fail to create a new user due to an invalid email & return a 400 status', async () => {
    const response = await supertest(app).post('/create_new_user').send({
      email: 'this_is_not_an_email',
      username: initUser.username,
      password: initUser.password,
      name: initUser.name,
    });
    expect(response.status).toBe(400);
  });
  it('should create new users & return web tokens + 200 statuses + correct users info', async () => {
    const response = await supertest(app).post('/create_new_user').send({
      email: initUser.email,
      username: initUser.username,
      password: initUser.password,
      name: initUser.name,
    });
    const response2 = await supertest(app).post('/create_new_user').send({
      email: initOtherUser.email,
      username: initOtherUser.username,
      password: initOtherUser.password,
      name: initOtherUser.name,
    });
    token = response.body.token;
    user = response.body.user;
    otherToken = response2.body.token;
    otherUser = response2.body.user;
    expect(response.status).toBe(200);
    expect(token).toBeDefined();
    expect(user.email).toEqual(initUser.email);
    expect(user.username).toEqual(initUser.username);
    expect(user.name).toEqual(initUser.name);
    expect(user._count.posts).toBeDefined();
    expect(user._count.givenFollows).toBeDefined();
    expect(user._count.receivedFollows).toBeDefined();
    expect(response2.status).toBe(200);
    expect(otherToken).toBeDefined();
    expect(otherUser.email).toEqual(initOtherUser.email);
    expect(otherUser.username).toEqual(initOtherUser.username);
    expect(otherUser.name).toEqual(initOtherUser.name);
    expect(otherUser._count.posts).toBeDefined();
    expect(otherUser._count.givenFollows).toBeDefined();
    expect(otherUser._count.receivedFollows).toBeDefined();
  });
  it('should fail to create new users due to them already existing & return 400 statuses', async () => {
    const response = await supertest(app).post('/create_new_user').send({
      email: initUser.email,
      username: initUser.username,
      password: initUser.password,
      name: initUser.name,
    });
    const response2 = await supertest(app).post('/create_new_user').send({
      email: initOtherUser.email,
      username: initOtherUser.username,
      password: initOtherUser.password,
      name: initOtherUser.name,
    });
    expect(response.status).toBe(400);
    expect(response.body.notUnique[0]).toEqual('email');
    expect(response2.status).toBe(400);
    expect(response2.body.notUnique[0]).toEqual('email');
  });
  //
  it('should fail to login with fake email & return a 401 status', async () => {
    const response = await supertest(app).post('/sign_in').send({
      email: 'fake_email@email.com',
      password: initUser.password,
    });
    expect(response.status).toBe(401);
  });
  it('should fail to login with an incorrect password & return a 401 status', async () => {
    const response = await supertest(app).post('/sign_in').send({
      email: user.email,
      password: 'wrongpassword',
    });
    expect(response.status).toBe(401);
  });
  it('should fail to login with invalid inputs (ie, no username) & return a 400 status', async () => {
    const response = await supertest(app).post('/sign_in').send({
      password: initUser.password,
    });
    expect(response.status).toBe(400);
  });
  it('should fail to login with invalid inputs (ie, no password) & return a 400 status', async () => {
    const response = await supertest(app).post('/sign_in').send({
      email: user.email,
    });
    expect(response.status).toBe(400);
  });
  it('should login & return a 200 status + correct user info + token', async () => {
    const response = await supertest(app).post('/sign_in').send({
      email: user.email,
      password: initUser.password,
    });
    expect(response.status).toBe(200);
    expect(response.body.token).toBeDefined();
    expect(response.body.user.email).toEqual(user.email);
    expect(response.body.user.username).toEqual(user.username);
    expect(response.body.user.name).toEqual(user.name);
    expect(response.body.user._count.posts).toBeDefined();
    expect(response.body.user._count.givenFollows).toBeDefined();
    expect(response.body.user._count.receivedFollows).toBeDefined();
    expect(response.body.user).not.toHaveProperty('password');
  });
  //
  it('should fail to find a user due to a non-existent id & return a 404 status', async () => {
    const response = await supertest(app)
      .post('/api/user/single')
      .set('Authorization', `Bearer ${token}`)
      .send({
        id: -1,
      });
    expect(response.status).toBe(404);
  });
  it('should fail to find a user due to a invalid inputs & return a 400 status', async () => {
    const response = await supertest(app)
      .post('/api/user/single')
      .set('Authorization', `Bearer ${token}`)
      .send({
        id: 'abc',
      });
    expect(response.status).toBe(400);
  });
  it('should fail to find a user due to a missing auth token & return a 401 status', async () => {
    const response = await supertest(app)
      .post('/api/user/single')
      .set('Authorization', `Bearer `)
      .send({
        id: user.id,
      });
    expect(response.status).toBe(401);
  });
  it('should find a user & return a 200 status + correct user info', async () => {
    const response = await supertest(app)
      .post('/api/user/single')
      .set('Authorization', `Bearer ${token}`)
      .send({
        id: user.id,
      });
    const foundUser = response.body.user;
    expect(response.status).toBe(200);
    expect(foundUser.email == user.email).toBeTruthy();
    expect(foundUser.username == user.username).toBeTruthy();
    expect(foundUser.name == user.name).toBeTruthy();
    expect(foundUser.image == user.image).toBeTruthy();
    expect(foundUser.bio == user.bio).toBeTruthy();
    expect(foundUser._count.posts).toBeDefined();
    expect(foundUser._count.givenFollows).toBeDefined();
    expect(foundUser._count.receivedFollows).toBeDefined();
    expect(foundUser).not.toHaveProperty('password');
  });
  //
  it('should fail to search for users due to a invalid inputs & return a 400 status', async () => {
    const response = await supertest(app)
      .post('/api/user/search')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 12345,
      });
    expect(response.status).toBe(400);
  });
  it('should fail to search for users due to a missing auth token & return a 401 status', async () => {
    const response = await supertest(app)
      .post('/api/user/search')
      .set('Authorization', `Bearer `)
      .send({
        name: user.name,
      });
    expect(response.status).toBe(401);
  });
  it('should find no users & return a 200 status + empty users arr', async () => {
    const response = await supertest(app)
      .post('/api/user/search')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'this will never return any results',
      });
    expect(response.status).toBe(200);
    expect(response.body.users.length).toEqual(0);
  });
  it('should find users & return a 200 status + non-empty users arr', async () => {
    const response = await supertest(app)
      .post('/api/user/search')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: user.name,
      });
    expect(response.status).toBe(200);
    expect(response.body.users.length).toBeGreaterThan(0);
  });
  //
  it('should fail to check if email is unique due to a invalid inputs & return a 400 status', async () => {
    const response = await supertest(app)
      .post('/api/user/is-email-unique')
      .set('Authorization', `Bearer ${token}`)
      .send({
        email: 12345,
      });
    expect(response.status).toBe(400);
  });
  it('should fail to check if email is unique due to a missing auth token & return a 401 status', async () => {
    const response = await supertest(app)
      .post('/api/user/is-email-unique')
      .set('Authorization', `Bearer `)
      .send({
        email: user.email,
      });
    expect(response.status).toBe(401);
  });
  it('should check if email is unique & return a 200 status + "true" answer', async () => {
    const response = await supertest(app)
      .post('/api/user/is-email-unique')
      .set('Authorization', `Bearer ${token}`)
      .send({
        email: 'thisemailisunique@bro.com',
      });
    expect(response.status).toBe(200);
    expect(response.body.isEmailUnique).toBeTruthy();
  });
  it('should check if email is unique & return a 200 status + "false" answer', async () => {
    const response = await supertest(app)
      .post('/api/user/is-email-unique')
      .set('Authorization', `Bearer ${token}`)
      .send({
        email: user.email,
      });
    expect(response.status).toBe(200);
    expect(response.body.isEmailUnique).toBeFalsy();
  });
  //
  it('should fail to check if username is unique due to a invalid inputs & return a 400 status', async () => {
    const response = await supertest(app)
      .post('/api/user/is-username-unique')
      .set('Authorization', `Bearer ${token}`)
      .send({
        username: 12345,
      });
    expect(response.status).toBe(400);
  });
  it('should fail to check if username is unique due to a missing auth token & return a 401 status', async () => {
    const response = await supertest(app)
      .post('/api/user/is-username-unique')
      .set('Authorization', `Bearer `)
      .send({
        username: user.username,
      });
    expect(response.status).toBe(401);
  });
  it('should check if username is unique & return a 200 status + "true" answer', async () => {
    const response = await supertest(app)
      .post('/api/user/is-username-unique')
      .set('Authorization', `Bearer ${token}`)
      .send({
        username: 'thisusernameisunique',
      });
    expect(response.status).toBe(200);
    expect(response.body.isUsernameUnique).toBeTruthy();
  });
  it('should check if username is unique & return a 200 status + "false" answer', async () => {
    const response = await supertest(app)
      .post('/api/user/is-username-unique')
      .set('Authorization', `Bearer ${token}`)
      .send({
        username: user.username,
      });
    expect(response.status).toBe(200);
    expect(response.body.isUsernameUnique).toBeFalsy();
  });
  //
  it('should fail to update the user due to no auth token & return a 401 status', async () => {
    const response = await supertest(app)
      .put('/api/user')
      .set('Authorization', `Bearer `)
      .set('Content-Type', 'multipart/form-data')
      .field('name', newUser.name)
      .field('bio', newUser.bio)
      .field('email', newUser.email)
      .field('username', newUser.username)
      .field('password', newUser.password);
    // .attach('file', './src/__tests__/test2.png');
    expect(response.status).toBe(401);
  });
  it('should fail to update the user due to invalid inputs & return a 400 status', async () => {
    const response = await supertest(app)
      .put('/api/user')
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'multipart/form-data')
      .field('name', 1)
      .field('bio', newUser.bio)
      .field('email', 'thisisnotanemail')
      .field('username', 1)
      .field('password', 1);
    // .attach('file', './src/__tests__/test2.png');
    expect(response.status).toBe(400);
  });
  it('should fail to update the user due to duplicate email/username & return a 400 status', async () => {
    const response = await supertest(app)
      .put('/api/user')
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'multipart/form-data')
      .field('name', newUser.name)
      .field('bio', newUser.bio)
      .field('email', otherUser.email)
      .field('username', otherUser.username)
      .field('password', newUser.password);
    // .attach('file', './src/__tests__/test2.png');
    expect(response.status).toBe(400);
  });
  it('should update the user & return a 200 status + updated user attributes', async () => {
    const response = await supertest(app)
      .put('/api/user')
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'multipart/form-data')
      .field('name', newUser.name)
      .field('bio', newUser.bio)
      .field('email', newUser.email)
      .field('username', newUser.username)
      .field('password', newUser.password)
      .attach('file', './src/__tests__/test2.png');
    const updatedUser = response.body.user;
    user = updatedUser;
    expect(response.status).toBe(200);
    expect(updatedUser.email == newUser.email).toBeTruthy();
    expect(updatedUser.username == newUser.username).toBeTruthy();
    expect(updatedUser.name == newUser.name).toBeTruthy();
    expect(updatedUser.image).toMatch(urlPattern);
    expect(updatedUser.bio == newUser.bio).toBeTruthy();
    expect(updatedUser._count.posts).toBeDefined();
    expect(updatedUser._count.givenFollows).toBeDefined();
    expect(updatedUser._count.receivedFollows).toBeDefined();
    expect(updatedUser).not.toHaveProperty('password');
  });
  //
  it('should fail to delete a user due to a missing user id field within the auth token & return a 401 status', async () => {
    const secret = new TextEncoder().encode(jwtSecret);

    const fakeToken = await new SignJWT({ username: 'fake_user' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .sign(secret);
    const response = await supertest(app)
      .delete('/api/user')
      .set('Authorization', `Bearer ${fakeToken}`);
    expect(response.status).toBe(401);
  });
  it('should fail to delete a user due to a lack of auth token & return a 401 status', async () => {
    const response = await supertest(app)
      .delete('/api/user')
      .set('Authorization', `Bearer ${'test'}`);
    expect(response.status).toBe(401);
  });
  it('should delete users & return a 200 statuses + correct users info', async () => {
    const response = await supertest(app)
      .delete('/api/user')
      .set('Authorization', `Bearer ${token}`);
    const response2 = await supertest(app)
      .delete('/api/user')
      .set('Authorization', `Bearer ${otherToken}`);
    const delUser = response.body.user;
    expect(response.status).toBe(200);
    expect(delUser.id).toEqual(user.id);
    const delUser2 = response2.body.user;
    expect(response2.status).toBe(200);
    expect(delUser2.id).toEqual(otherUser.id);
    if (user.image && typeof user.image == 'string') {
      await deleteFileFromStorage(user.image);
    }
  });
});
