import { serve } from '@hono/node-server';
// imports for websockets
import { Server as SocketIOServer } from 'socket.io';
import { SocketMessage } from '@markstagram/shared-types';
import { loadEnvForRuntime } from './config/runtime.js';

await loadEnvForRuntime();

const [{ config }, { default: app }, websocket] = await Promise.all([
  import('./config/index.js'),
  import('./app.js'),
  import('./modules/websocket.js'),
]);
const { getAllowedOrigins, isAllowedOrigin } = await import('./config/security.js');

const {
  handleInputErrors,
  retrieveUserFromToken,
  createMessage,
  joinConversationRoom,
} = websocket;
const allowedOrigins = getAllowedOrigins();

// Start the Hono server via @hono/node-server
const port = Number(process.env.PORT || config.port);
const server = serve({
  fetch: app.fetch,
  port,
});

// configure websockets
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

// validates an incoming message from a websocket
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

  socket.on('sendNewMessage', async (message: SocketMessage | { id: unknown; message: unknown }) => {
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
  });

  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});

console.log('successfully running on port ' + port);

// error handling
process.on('uncaughtException', (error) => {
  console.error('uncaught exception (sync) at top level of node process');
  console.error(error);
});

process.on('unhandledRejection', (reason) => {
  console.error('unhandled rejection (async) at top level of node process');
  console.error(reason);
});
