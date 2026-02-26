import type { SocketMessage } from '@markstagram/shared-types';
import { Server as SocketIOServer } from 'socket.io';
import { getAllowedOrigins, isAllowedOrigin } from './config/security.js';
import {
  createMessage,
  handleInputErrors,
  joinConversationRoom,
  retrieveUserFromToken,
} from './modules/websocket.js';

type SocketIoAttachTarget = ConstructorParameters<typeof SocketIOServer>[0];

export const attachSocketServer = (server: SocketIoAttachTarget): SocketIOServer => {
  const allowedOrigins = getAllowedOrigins();
  const io = new SocketIOServer(server, {
    cors: {
      origin: (origin, callback) => {
        if (isAllowedOrigin(origin, allowedOrigins)) {
          callback(null, true);
          return;
        }
        callback(new Error('Not allowed by CORS'));
      },
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token ?? socket.handshake.headers.authorization;

    try {
      const user = await retrieveUserFromToken(token);
      socket.data.user = user;
      next();
    } catch (e) {
      next(e instanceof Error ? e : new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log('connected');
    socket.on('joinConversation', async ({ conversationId }) => {
      console.log('a user connected');
      const user = socket.data.user;
      if (!user) {
        socket.emit('authError', { message: 'Authentication error' });
        return;
      }

      await joinConversationRoom(socket, user, conversationId);
    });

    socket.on(
      'sendNewMessage',
      async (message: SocketMessage | { id: unknown; message: unknown }) => {
        const user = socket.data.user;
        if (!user) {
          socket.emit('authError', { message: 'Authentication error' });
          return;
        }

        const errors = handleInputErrors(message);
        if (errors) {
          socket.emit('inputError', errors);
          return;
        }

        const dbEntry = await createMessage(message, socket, user);
        if (!dbEntry) {
          return;
        }

        io.to(String(dbEntry.conversationId)).emit('receiveNewMessage', dbEntry);
      },
    );

    socket.on('disconnect', () => {
      console.log('user disconnected');
    });
  });

  return io;
};
