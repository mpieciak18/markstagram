import supertest from 'supertest';
import { describe, expect, it } from 'vitest';
import app from '../server.js';
import prisma from '../db.js';

const runId = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
const imageUrlPattern = /^(http|https):\/\/[^ "]+$/;

describe('delete integrity and cascade behavior', () => {
  it('should delete a conversation that still has messages', async () => {
    const suffix = `${runId}-conv`;
    const userA = await supertest(app).post('/create_new_user').send({
      email: `delete-conv-a-${suffix}@test.com`,
      username: `dcva${suffix.slice(0, 6)}`,
      password: '123_abc',
      name: 'Delete Conv A',
    });
    const userB = await supertest(app).post('/create_new_user').send({
      email: `delete-conv-b-${suffix}@test.com`,
      username: `dcvb${suffix.slice(0, 6)}`,
      password: '123_abc',
      name: 'Delete Conv B',
    });

    expect(userA.status).toBe(200);
    expect(userB.status).toBe(200);

    const tokenA = userA.body.token as string;
    const tokenB = userB.body.token as string;
    const userBId = userB.body.user.id as number;

    const createConvo = await supertest(app)
      .post('/api/conversation')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ id: userBId });
    expect(createConvo.status).toBe(200);
    const conversationId = createConvo.body.conversation.id as number;

    const createMessage = await supertest(app)
      .post('/api/message')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ id: conversationId, message: 'message before delete' });
    expect(createMessage.status).toBe(200);

    const deleteConvo = await supertest(app)
      .delete('/api/conversation')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ id: conversationId });
    expect(deleteConvo.status).toBe(200);

    const remainingMessages = await prisma.message.count({
      where: { conversationId },
    });
    expect(remainingMessages).toBe(0);

    const deleteA = await supertest(app)
      .delete('/api/user')
      .set('Authorization', `Bearer ${tokenA}`);
    const deleteB = await supertest(app)
      .delete('/api/user')
      .set('Authorization', `Bearer ${tokenB}`);

    expect(deleteA.status).toBe(200);
    expect(deleteB.status).toBe(200);
  }, 20000);

  it('should delete a user and cascade/remove dependent records', async () => {
    const suffix = `${runId}-user`;
    const userA = await supertest(app).post('/create_new_user').send({
      email: `delete-user-a-${suffix}@test.com`,
      username: `dua${suffix.slice(0, 6)}`,
      password: '123_abc',
      name: 'Delete User A',
    });
    const userB = await supertest(app).post('/create_new_user').send({
      email: `delete-user-b-${suffix}@test.com`,
      username: `dub${suffix.slice(0, 6)}`,
      password: '123_abc',
      name: 'Delete User B',
    });

    expect(userA.status).toBe(200);
    expect(userB.status).toBe(200);

    const tokenA = userA.body.token as string;
    const tokenB = userB.body.token as string;
    const userAId = userA.body.user.id as number;
    const userBId = userB.body.user.id as number;

    const createdPost = await supertest(app)
      .post('/api/post')
      .set('Authorization', `Bearer ${tokenA}`)
      .set('Content-Type', 'multipart/form-data')
      .field('caption', 'cascade post')
      .attach('file', './src/__tests__/test.png');

    expect(createdPost.status).toBe(200);
    expect(createdPost.body.post.image).toMatch(imageUrlPattern);
    const postId = createdPost.body.post.id as number;

    const comment = await supertest(app)
      .post('/api/comment')
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ id: postId, message: 'comment from user B' });
    expect(comment.status).toBe(200);

    const like = await supertest(app)
      .post('/api/like')
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ id: postId });
    expect(like.status).toBe(200);

    const save = await supertest(app)
      .post('/api/save')
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ id: postId });
    expect(save.status).toBe(200);

    const followAB = await supertest(app)
      .post('/api/follow')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ id: userBId });
    expect(followAB.status).toBe(200);

    const followBA = await supertest(app)
      .post('/api/follow')
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ id: userAId });
    expect(followBA.status).toBe(200);

    const notifFromA = await supertest(app)
      .post('/api/notification')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ id: userBId, type: 'like', postId });
    expect(notifFromA.status).toBe(200);

    const notifFromB = await supertest(app)
      .post('/api/notification')
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ id: userAId, type: 'follow' });
    expect(notifFromB.status).toBe(200);

    const createdConversation = await supertest(app)
      .post('/api/conversation')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ id: userBId });
    expect(createdConversation.status).toBe(200);
    const conversationId = createdConversation.body.conversation.id as number;

    const createdMessage = await supertest(app)
      .post('/api/message')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ id: conversationId, message: 'hello there' });
    expect(createdMessage.status).toBe(200);

    const deleteA = await supertest(app)
      .delete('/api/user')
      .set('Authorization', `Bearer ${tokenA}`);
    expect(deleteA.status).toBe(200);

    const [
      remainingUserA,
      remainingPosts,
      remainingComments,
      remainingLikes,
      remainingSaves,
      remainingFollows,
      remainingMessages,
      remainingNotifications,
    ] = await Promise.all([
      prisma.user.findUnique({ where: { id: userAId } }),
      prisma.post.count({ where: { OR: [{ userId: userAId }, { id: postId }] } }),
      prisma.comment.count({
        where: {
          OR: [{ userId: userAId }, { postId }],
        },
      }),
      prisma.like.count({
        where: {
          OR: [{ userId: userAId }, { postId }],
        },
      }),
      prisma.save.count({
        where: {
          OR: [{ userId: userAId }, { postId }],
        },
      }),
      prisma.follow.count({
        where: {
          OR: [{ giverId: userAId }, { receiverId: userAId }],
        },
      }),
      prisma.message.count({ where: { senderId: userAId } }),
      prisma.notification.count({
        where: {
          OR: [{ userId: userAId }, { otherUserId: userAId }, { postId }],
        },
      }),
    ]);

    expect(remainingUserA).toBeNull();
    expect(remainingPosts).toBe(0);
    expect(remainingComments).toBe(0);
    expect(remainingLikes).toBe(0);
    expect(remainingSaves).toBe(0);
    expect(remainingFollows).toBe(0);
    expect(remainingMessages).toBe(0);
    expect(remainingNotifications).toBe(0);

    const deleteB = await supertest(app)
      .delete('/api/user')
      .set('Authorization', `Bearer ${tokenB}`);
    expect(deleteB.status).toBe(200);
  }, 30000);
});
