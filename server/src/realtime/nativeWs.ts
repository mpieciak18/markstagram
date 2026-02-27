import {
  RealtimeClientFrameSchema,
  type RealtimeServerFrame,
  type RealtimeTokenUser,
  type SocketMessageErr,
} from '@markstagram/shared-types';
import type { ZodIssue } from 'zod';
import { getAllowedOrigins, isAllowedOrigin } from '../config/security.js';
import {
  createConversationMessage,
  isConversationParticipant,
  retrieveUserFromToken,
} from '../modules/websocket.js';

const DEFAULT_AUTH_TIMEOUT_MS = 5000;
const DEFAULT_MAX_FRAME_BYTES = 32 * 1024;

const frameToJson = (frame: RealtimeServerFrame): string => JSON.stringify(frame);

const inputError = (message: string): RealtimeServerFrame => ({
  type: 'input_error',
  payload: { errors: [{ message }] },
});

const authError = (message: string): RealtimeServerFrame => ({
  type: 'auth_error',
  payload: { message },
});

const serverError = (message: string): RealtimeServerFrame => ({
  type: 'server_error',
  payload: { message },
});

type ConnectionTimer = ReturnType<typeof setTimeout>;

export type NativeWsConnectionData = {
  id: string;
  authenticated: boolean;
  user: RealtimeTokenUser | null;
  joinedConversationIds: Set<number>;
  authTimer: ConnectionTimer | null;
};

type WsConnection = {
  data: NativeWsConnectionData;
  send: (message: string) => unknown;
  close: (code?: number, reason?: string) => unknown;
};

type RawWsMessage = string | ArrayBuffer | Uint8Array;

const toSafeIssues = (issues: string[]): SocketMessageErr[] =>
  issues.map((message) => ({ message }));

const getMaxFrameBytes = (): number => {
  const parsed = Number.parseInt(process.env.WS_MAX_FRAME_BYTES ?? '', 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return DEFAULT_MAX_FRAME_BYTES;
  }
  return parsed;
};

const getAuthTimeoutMs = (): number => {
  const parsed = Number.parseInt(process.env.WS_AUTH_TIMEOUT_MS ?? '', 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return DEFAULT_AUTH_TIMEOUT_MS;
  }
  return parsed;
};

export class NativeRealtimeHub {
  private readonly roomMembers = new Map<number, Set<WsConnection>>();
  private readonly allowedOrigins = getAllowedOrigins();
  private readonly maxFrameBytes = getMaxFrameBytes();
  private readonly authTimeoutMs = getAuthTimeoutMs();

  createConnectionData(): NativeWsConnectionData {
    return {
      id: globalThis.crypto.randomUUID(),
      authenticated: false,
      user: null,
      joinedConversationIds: new Set<number>(),
      authTimer: null,
    };
  }

  canUpgrade(request: Request): boolean {
    const origin = request.headers.get('origin');
    return isAllowedOrigin(origin, this.allowedOrigins);
  }

  getBunHandlers() {
    return {
      open: (ws: unknown) => {
        this.handleOpen(ws as WsConnection);
      },
      message: (ws: unknown, message: RawWsMessage) => {
        void this.handleMessage(ws as WsConnection, message);
      },
      close: (ws: unknown) => {
        this.handleClose(ws as WsConnection);
      },
    };
  }

  handleOpen(connection: WsConnection): void {
    connection.data.authTimer = setTimeout(() => {
      if (connection.data.authenticated) {
        return;
      }
      this.send(connection, authError('Authentication timeout.'));
      connection.close(4401, 'Authentication timeout');
    }, this.authTimeoutMs);
  }

  handleClose(connection: WsConnection): void {
    this.clearAuthTimer(connection);
    for (const conversationId of connection.data.joinedConversationIds) {
      const room = this.roomMembers.get(conversationId);
      if (!room) continue;
      room.delete(connection);
      if (room.size === 0) {
        this.roomMembers.delete(conversationId);
      }
    }
    connection.data.joinedConversationIds.clear();
  }

  async handleMessage(connection: WsConnection, rawMessage: RawWsMessage): Promise<void> {
    if (typeof rawMessage !== 'string') {
      this.send(connection, inputError('WebSocket messages must be JSON text frames.'));
      connection.close(1003, 'Unsupported frame type');
      return;
    }

    const bytes = new TextEncoder().encode(rawMessage).byteLength;
    if (bytes > this.maxFrameBytes) {
      this.send(connection, inputError('WebSocket payload too large.'));
      connection.close(1009, 'Payload too large');
      return;
    }

    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(rawMessage);
    } catch {
      this.send(connection, inputError('Invalid JSON message payload.'));
      return;
    }

    const parsedFrame = RealtimeClientFrameSchema.safeParse(parsedJson);
    if (!parsedFrame.success) {
      const issues = parsedFrame.error.issues.map((issue: ZodIssue) => issue.message);
      this.send(connection, {
        type: 'input_error',
        payload: { errors: toSafeIssues(issues) },
      });
      return;
    }

    const frame = parsedFrame.data;

    if (frame.type === 'auth') {
      await this.handleAuthFrame(connection, frame.payload.token);
      return;
    }

    if (!connection.data.authenticated || !connection.data.user) {
      this.send(connection, authError('Authentication required.'));
      return;
    }

    if (frame.type === 'join_conversation') {
      await this.handleJoinConversationFrame(connection, frame.payload.conversationId);
      return;
    }

    if (frame.type === 'send_message') {
      await this.handleSendMessageFrame(
        connection,
        frame.payload.conversationId,
        frame.payload.message,
      );
      return;
    }
  }

  private async handleAuthFrame(connection: WsConnection, token: string): Promise<void> {
    try {
      const user = await retrieveUserFromToken(token);
      connection.data.user = user;
      connection.data.authenticated = true;
      this.clearAuthTimer(connection);
      this.send(connection, {
        type: 'auth_ok',
        payload: { user },
      });
    } catch {
      this.send(connection, authError('Authentication error.'));
      connection.close(4401, 'Authentication error');
    }
  }

  private async handleJoinConversationFrame(
    connection: WsConnection,
    conversationId: number,
  ): Promise<void> {
    const user = connection.data.user;
    if (!user) {
      this.send(connection, authError('Authentication required.'));
      return;
    }

    const hasAccess = await isConversationParticipant(user.id, conversationId);
    if (!hasAccess) {
      this.send(connection, authError('Not authorized for this conversation.'));
      return;
    }

    this.joinConversation(connection, conversationId);
  }

  private async handleSendMessageFrame(
    connection: WsConnection,
    conversationId: number,
    messageText: string,
  ): Promise<void> {
    const user = connection.data.user;
    if (!user) {
      this.send(connection, authError('Authentication required.'));
      return;
    }

    const hasAccess = await isConversationParticipant(user.id, conversationId);
    if (!hasAccess) {
      this.send(connection, authError('Not authorized for this conversation.'));
      return;
    }

    // Ensure sender receives broadcast stream even if they skipped join_conversation.
    this.joinConversation(connection, conversationId);

    try {
      const message = await createConversationMessage(user.id, conversationId, messageText);
      this.send(connection, {
        type: 'new_message',
        payload: { message },
      });

      this.broadcastToConversation(conversationId, {
        type: 'receive_new_message',
        payload: { message },
      });
    } catch {
      this.send(connection, serverError('Database error occurred.'));
    }
  }

  private joinConversation(connection: WsConnection, conversationId: number): void {
    connection.data.joinedConversationIds.add(conversationId);
    const room = this.roomMembers.get(conversationId) ?? new Set<WsConnection>();
    room.add(connection);
    this.roomMembers.set(conversationId, room);
  }

  private broadcastToConversation(conversationId: number, frame: RealtimeServerFrame): void {
    const room = this.roomMembers.get(conversationId);
    if (!room) {
      return;
    }

    for (const member of room) {
      this.send(member, frame);
    }
  }

  private send(connection: WsConnection, frame: RealtimeServerFrame): void {
    connection.send(frameToJson(frame));
  }

  private clearAuthTimer(connection: WsConnection): void {
    if (!connection.data.authTimer) {
      return;
    }
    clearTimeout(connection.data.authTimer);
    connection.data.authTimer = null;
  }
}
