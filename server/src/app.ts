import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import type { SafeUser } from './modules/publicUser.js';
import { authMiddleware } from './middleware/auth.js';
import { authRoutes } from './routes/auth.js';
import { userRoutes } from './routes/user.js';
import { postRoutes } from './routes/post.js';
import { commentRoutes } from './routes/comment.js';
import { likeRoutes } from './routes/like.js';
import { saveRoutes } from './routes/save.js';
import { followRoutes } from './routes/follow.js';
import { notificationRoutes } from './routes/notification.js';
import { conversationRoutes } from './routes/conversation.js';
import { messageRoutes } from './routes/message.js';

export type AppEnv = {
  Variables: {
    user: SafeUser;
  };
};

const app = new Hono<AppEnv>();

// Global middleware
app.use('*', cors());
app.use('*', logger());

// Health / test routes
app.get('/', (c) => c.json({ message: 'hello' }));
app.get('/health_status', (c) => c.json({ message: 'the server is running' }));

// Public auth routes
app.route('/', authRoutes);

// Protected API routes
const api = new Hono<AppEnv>();
api.use('*', authMiddleware);
api.route('/user', userRoutes);
api.route('/post', postRoutes);
api.route('/comment', commentRoutes);
api.route('/like', likeRoutes);
api.route('/save', saveRoutes);
api.route('/follow', followRoutes);
api.route('/notification', notificationRoutes);
api.route('/conversation', conversationRoutes);
api.route('/message', messageRoutes);
app.route('/api', api);

// Global error handler
app.onError((err, c) => {
  console.error(err);
  return c.json({ message: 'server error' }, 500);
});

export default app;
