import * as dotenv from 'dotenv';
dotenv.config();
import { config } from './config/index.js';
import app from './server.js';
// imports for websockets
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import {
  handleInputErrors,
  retrieveUserFromToken,
  createMessage,
} from './modules/websocket.js';
import { SocketMessage } from '@markstagram/shared-types';

// configure websockets
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
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
    // const newSocket = socket as SocketWithUser;
    const dbEntry = await createMessage(message, socket, (socket as any).user);
    io.to(message.id).emit('receiveNewMessage', dbEntry);
  });

  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});

const port = process.env.PORT || config.port; // Fallback to config.port if PORT is not set
httpServer.listen(port, () => {
  console.log('succesfully running on port ' + port);
});

// error handling
process.on('uncaughtException', () => {
  console.log('uncaught exception (sync) at top level of node process');
});

process.on('unhandledRejection', () => {
  console.log('unhandled rejection (async) at top level of node process');
});
