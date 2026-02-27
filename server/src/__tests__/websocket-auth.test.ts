import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test';
import { eq, inArray } from 'drizzle-orm';
import { createJwt } from '../modules/auth.js';
import db from '../db.js';
import { conversations, conversationsToUsers, messages, users } from '../db/schema.js';
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

  const insertedUsers = await db
    .insert(users)
    .values([
      {
        email: `ws-a-${unique}@test.com`,
        username: `wsa${unique.slice(0, 6)}`,
        password: BCRYPT_TEST_PASSWORD_HASH,
        name: 'Websocket A',
      },
      {
        email: `ws-b-${unique}@test.com`,
        username: `wsb${unique.slice(0, 6)}`,
        password: BCRYPT_TEST_PASSWORD_HASH,
        name: 'Websocket B',
      },
      {
        email: `ws-c-${unique}@test.com`,
        username: `wsc${unique.slice(0, 6)}`,
        password: BCRYPT_TEST_PASSWORD_HASH,
        name: 'Websocket C',
      },
    ])
    .returning({ id: users.id, username: users.username });

  const [userA, userB, userC] = insertedUsers;

  const createdConversation = await db
    .insert(conversations)
    .values({})
    .returning({ id: conversations.id });

  const conversationId = createdConversation[0].id;

  await db.insert(conversationsToUsers).values([
    { conversationId, userId: userA.id },
    { conversationId, userId: userB.id },
  ]);

  fixture = {
    allowedUser: userA,
    allowedUserTwo: userB,
    blockedUser: userC,
    conversationId,
  };
});

afterEach(async () => {
  if (!fixture) {
    return;
  }

  await db.delete(messages).where(eq(messages.conversationId, fixture.conversationId));
  await db.delete(conversations).where(eq(conversations.id, fixture.conversationId));
  await db
    .delete(users)
    .where(
      inArray(users.id, [fixture.allowedUser.id, fixture.allowedUserTwo.id, fixture.blockedUser.id]),
    );
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

    await db.delete(users).where(eq(users.id, fixture.blockedUser.id));

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
