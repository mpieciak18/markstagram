import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { eq, inArray } from 'drizzle-orm';
import {
  RealtimeServerFrameSchema,
  type RealtimeServerFrame,
} from '@markstagram/shared-types';
import db from '../db.js';
import { conversations, conversationsToUsers, messages, users } from '../db/schema.js';
import { createJwt } from '../modules/auth.js';
import { NativeRealtimeHub, type NativeWsConnectionData } from '../realtime/nativeWs.js';

const runId = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
const BCRYPT_TEST_PASSWORD_HASH =
  '$2b$10$7EqJtq98hPqEX7fNZaFWoOHiA6f6S4WQ5lHppZArYrusS4x2QV/pW';

type Fixture = {
  userA: { id: number; username: string };
  userB: { id: number; username: string };
  blockedUser: { id: number; username: string };
  conversationId: number;
};

class FakeWsConnection {
  data: NativeWsConnectionData;
  frames: RealtimeServerFrame[] = [];
  closed: Array<{ code?: number; reason?: string }> = [];

  constructor(data: NativeWsConnectionData) {
    this.data = data;
  }

  send = (payload: string) => {
    const frame = RealtimeServerFrameSchema.parse(JSON.parse(payload));
    this.frames.push(frame);
  };

  close = (code?: number, reason?: string) => {
    this.closed.push({ code, reason });
  };

  getFramesByType<T extends RealtimeServerFrame['type']>(type: T) {
    return this.frames.filter(
      (frame): frame is Extract<RealtimeServerFrame, { type: T }> => frame.type === type,
    );
  }
}

let fixture: Fixture;
let hub: NativeRealtimeHub;

beforeEach(async () => {
  process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'test-jwt-secret';
  hub = new NativeRealtimeHub();

  const unique = `${runId}-${Math.random().toString(36).slice(2, 6)}`;

  const insertedUsers = await db
    .insert(users)
    .values([
      {
        email: `native-ws-a-${unique}@test.com`,
        username: `nwsA${unique.slice(0, 6)}`,
        password: BCRYPT_TEST_PASSWORD_HASH,
        name: 'Native WebSocket A',
      },
      {
        email: `native-ws-b-${unique}@test.com`,
        username: `nwsB${unique.slice(0, 6)}`,
        password: BCRYPT_TEST_PASSWORD_HASH,
        name: 'Native WebSocket B',
      },
      {
        email: `native-ws-c-${unique}@test.com`,
        username: `nwsC${unique.slice(0, 6)}`,
        password: BCRYPT_TEST_PASSWORD_HASH,
        name: 'Native WebSocket Blocked',
      },
    ])
    .returning({ id: users.id, username: users.username });

  const [userA, userB, blockedUser] = insertedUsers;

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
    userA,
    userB,
    blockedUser,
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
    .where(inArray(users.id, [fixture.userA.id, fixture.userB.id, fixture.blockedUser.id]));
});

describe('native websocket realtime hub', () => {
  it('auth success and failure', async () => {
    const goodConnection = new FakeWsConnection(hub.createConnectionData());
    hub.handleOpen(goodConnection);
    const goodToken = await createJwt(fixture.userA);
    await hub.handleMessage(
      goodConnection,
      JSON.stringify({ type: 'auth', payload: { token: goodToken } }),
    );

    const authOkFrames = goodConnection.getFramesByType('auth_ok');
    expect(authOkFrames.length).toBe(1);
    expect(authOkFrames[0]?.payload.user.id).toBe(fixture.userA.id);

    const badConnection = new FakeWsConnection(hub.createConnectionData());
    hub.handleOpen(badConnection);
    await hub.handleMessage(
      badConnection,
      JSON.stringify({ type: 'auth', payload: { token: 'invalid-token' } }),
    );
    expect(badConnection.getFramesByType('auth_error').length).toBe(1);
    expect(badConnection.closed.length).toBe(1);
  });

  it('rejects unauthorized conversation join', async () => {
    const connection = new FakeWsConnection(hub.createConnectionData());
    hub.handleOpen(connection);
    const token = await createJwt(fixture.blockedUser);

    await hub.handleMessage(
      connection,
      JSON.stringify({ type: 'auth', payload: { token } }),
    );
    await hub.handleMessage(
      connection,
      JSON.stringify({
        type: 'join_conversation',
        payload: { conversationId: fixture.conversationId },
      }),
    );

    const authErrorFrames = connection.getFramesByType('auth_error');
    expect(authErrorFrames.some((frame) => frame.payload.message.includes('Not authorized'))).toBe(true);
  });

  it('broadcasts conversation messages to joined participants', async () => {
    const sender = new FakeWsConnection(hub.createConnectionData());
    const receiver = new FakeWsConnection(hub.createConnectionData());
    hub.handleOpen(sender);
    hub.handleOpen(receiver);

    const tokenA = await createJwt(fixture.userA);
    const tokenB = await createJwt(fixture.userB);

    await hub.handleMessage(sender, JSON.stringify({ type: 'auth', payload: { token: tokenA } }));
    await hub.handleMessage(receiver, JSON.stringify({ type: 'auth', payload: { token: tokenB } }));

    await hub.handleMessage(
      sender,
      JSON.stringify({
        type: 'join_conversation',
        payload: { conversationId: fixture.conversationId },
      }),
    );
    await hub.handleMessage(
      receiver,
      JSON.stringify({
        type: 'join_conversation',
        payload: { conversationId: fixture.conversationId },
      }),
    );

    await hub.handleMessage(
      sender,
      JSON.stringify({
        type: 'send_message',
        payload: { conversationId: fixture.conversationId, message: 'hello native ws' },
      }),
    );

    expect(sender.getFramesByType('new_message').length).toBe(1);
    const senderBroadcasts = sender.getFramesByType('receive_new_message');
    const receiverBroadcasts = receiver.getFramesByType('receive_new_message');
    expect(senderBroadcasts.length).toBe(1);
    expect(receiverBroadcasts.length).toBe(1);
    expect(receiverBroadcasts[0]?.payload.message.message).toBe('hello native ws');
  });

  it('handles malformed payloads', async () => {
    const connection = new FakeWsConnection(hub.createConnectionData());
    hub.handleOpen(connection);
    const token = await createJwt(fixture.userA);

    await hub.handleMessage(
      connection,
      JSON.stringify({ type: 'auth', payload: { token } }),
    );
    await hub.handleMessage(connection, '{not-json');

    expect(connection.getFramesByType('input_error').length).toBe(1);

    await hub.handleMessage(
      connection,
      JSON.stringify({
        type: 'send_message',
        payload: { conversationId: fixture.conversationId, message: '' },
      }),
    );
    expect(connection.getFramesByType('input_error').length).toBe(2);
  });
});
