import * as dotenv from 'dotenv';
dotenv.config();
import { serve } from '@hono/node-server';
// imports for websockets
import { Server as SocketIOServer } from 'socket.io';
import { SocketMessage } from '@markstagram/shared-types';

const [{ config }, { default: app }, websocket] = await Promise.all([
  import('./config/index.js'),
  import('./app.js'),
  import('./modules/websocket.js'),
]);

const { handleInputErrors, retrieveUserFromToken, createMessage } = websocket;

// Start the Hono server via @hono/node-server
const port = Number(process.env.PORT || config.port);
const server = serve({
  fetch: app.fetch,
  port,
});

// configure websockets
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.CLIENT_URL,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// validates an incoming message from a websocket
io.use(async (socket, next) => {
  const token = socket.handshake.auth.token;

  try {
    const user = await retrieveUserFromToken(token);
    (socket as any).user = user;
    next();
  } catch (e) {
    next(e instanceof Error ? e : new Error('Authentication error'));
  }
});

io.on('connection', (socket) => {
  console.log('connected');
  socket.on('joinConversation', ({ conversationId }) => {
    console.log('a user connected');
    socket.join(conversationId);
  });

  socket.on('sendNewMessage', async (message: SocketMessage) => {
    const errors = handleInputErrors(message);
    if (errors) {
      socket.emit('inputError', errors);
      return;
    }
    const dbEntry = await createMessage(message, socket, (socket as any).user);
    io.to(message.id).emit('receiveNewMessage', dbEntry);
  });

  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});

console.log('successfully running on port ' + port);

// error handling
process.on('uncaughtException', () => {
  console.log('uncaught exception (sync) at top level of node process');
});

process.on('unhandledRejection', () => {
  console.log('unhandled rejection (async) at top level of node process');
});
