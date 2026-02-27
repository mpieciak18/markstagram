import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test';
import { createJwt } from '../modules/auth.js';
import prisma from '../db.js';
import {
  createMessage,
  joinConversationRoom,
  retrieveUserFromToken,
  type TokenPayload,
  type SocketEventClient,
  type SocketRoomClient,
} from '../modules/websocket.js';

const runId = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
const BCRYPT_TEST_PASSWORD_HASH =
  '$2b$10$7EqJtq98hPqEX7fNZaFWoOHiA6f6S4WQ5lHppZArYrusS4x2QV/pW';

type TestFixture = {
  allowedUser: TokenPayload;
  allowedUserTwo: TokenPayload;
  blockedUser: TokenPayload;
  conversationId: number;
};

const createFakeSocket = () => {
  const events: Array<{ event: string; args: unknown[] }> = [];
  const joinedRooms: string[] = [];
  const socket = {
    emit: mock((event: string, ...args: unknown[]) => {
      events.push({ event, args });
      return true;
    }),
    join: mock((room: string) => {
      joinedRooms.push(String(room));
    }),
  };

  return {
    socket,
    events,
    joinedRooms,
  };
};

let fixture: TestFixture;

beforeEach(async () => {
  process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'test-jwt-secret';

  const unique = `${runId}-${Math.random().toString(36).slice(2, 6)}`;
  const userA = await prisma.user.create({
    data: {
      email: `ws-a-${unique}@test.com`,
      username: `wsa${unique.slice(0, 6)}`,
      password: BCRYPT_TEST_PASSWORD_HASH,
      name: 'Websocket A',
    },
    select: { id: true, username: true },
  });
  const userB = await prisma.user.create({
    data: {
      email: `ws-b-${unique}@test.com`,
      username: `wsb${unique.slice(0, 6)}`,
      password: BCRYPT_TEST_PASSWORD_HASH,
      name: 'Websocket B',
    },
    select: { id: true, username: true },
  });
  const userC = await prisma.user.create({
    data: {
      email: `ws-c-${unique}@test.com`,
      username: `wsc${unique.slice(0, 6)}`,
      password: BCRYPT_TEST_PASSWORD_HASH,
      name: 'Websocket C',
    },
    select: { id: true, username: true },
  });

  const conversation = await prisma.conversation.create({
    data: {
      users: {
        connect: [{ id: userA.id }, { id: userB.id }],
      },
    },
    select: { id: true },
  });

  fixture = {
    allowedUser: userA,
    allowedUserTwo: userB,
    blockedUser: userC,
    conversationId: conversation.id,
  };
});

afterEach(async () => {
  if (!fixture) {
    return;
  }

  await prisma.message.deleteMany({
    where: {
      conversationId: fixture.conversationId,
    },
  });

  await prisma.conversation.deleteMany({
    where: {
      id: fixture.conversationId,
    },
  });

  await prisma.user.deleteMany({
    where: {
      id: {
        in: [fixture.allowedUser.id, fixture.allowedUserTwo.id, fixture.blockedUser.id],
      },
    },
  });
});

describe('websocket auth hardening', () => {
  it('should validate websocket token and support bearer prefix', async () => {
    const token = await createJwt(fixture.allowedUser);
    const payload = await retrieveUserFromToken(`Bearer ${token}`);
    expect(payload.id).toBe(fixture.allowedUser.id);
    expect(payload.username).toBe(fixture.allowedUser.username);
  });

  it('should reject websocket token when user no longer exists', async () => {
    const token = await createJwt({
      id: fixture.blockedUser.id,
      username: fixture.blockedUser.username,
    });

    await prisma.user.delete({ where: { id: fixture.blockedUser.id } });

    await expect(retrieveUserFromToken(token)).rejects.toThrow('Authentication error');
  });

  it('should only allow participants to join a conversation room', async () => {
    const allowed = createFakeSocket();
    const blocked = createFakeSocket();

    const allowedJoin = await joinConversationRoom(
      allowed.socket as unknown as SocketRoomClient,
      fixture.allowedUser,
      fixture.conversationId,
    );
    expect(allowedJoin).toBe(true);
    expect(allowed.joinedRooms).toContain(String(fixture.conversationId));

    const blockedJoin = await joinConversationRoom(
      blocked.socket as unknown as SocketRoomClient,
      fixture.blockedUser,
      fixture.conversationId,
    );
    expect(blockedJoin).toBe(false);
    expect(blocked.joinedRooms).toEqual([]);
    expect(blocked.events.some((entry) => entry.event === 'authError')).toBe(true);
  });

  it('should only allow participants to create websocket messages', async () => {
    const allowed = createFakeSocket();
    const blocked = createFakeSocket();

    const created = await createMessage(
      { id: String(fixture.conversationId), message: 'hello from ws' },
      allowed.socket as unknown as SocketEventClient,
      fixture.allowedUser,
    );

    expect(created).toBeDefined();
    expect(created?.conversationId).toBe(fixture.conversationId);
    expect(created?.senderId).toBe(fixture.allowedUser.id);

    const blockedResult = await createMessage(
      { id: String(fixture.conversationId), message: 'blocked hello' },
      blocked.socket as unknown as SocketEventClient,
      fixture.blockedUser,
    );

    expect(blockedResult).toBeUndefined();
    expect(blocked.events.some((entry) => entry.event === 'authError')).toBe(true);
  });
});
