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
import { getAllowedOrigins, isAllowedOrigin } from './config/security.js';

export type AppEnv = {
  Variables: {
    user: SafeUser;
  };
};

const app = new Hono<AppEnv>();
const allowedOrigins = getAllowedOrigins();

// Global middleware
app.use(
  '*',
  cors({
    origin: (origin) => {
      if (!isAllowedOrigin(origin, allowedOrigins)) return undefined;
      return origin;
    },
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    exposeHeaders: ['Retry-After'],
    maxAge: 600,
    credentials: true,
  }),
);
app.use('*', logger());
app.use('*', async (c, next) => {
  c.header('X-Content-Type-Options', 'nosniff');
  c.header('X-Frame-Options', 'DENY');
  c.header('Referrer-Policy', 'no-referrer');
  c.header('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  c.header('Cross-Origin-Resource-Policy', 'same-site');
  c.header('X-Permitted-Cross-Domain-Policies', 'none');
  c.header('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'; base-uri 'none'");

  if (process.env.NODE_ENV === 'production') {
    c.header('Strict-Transport-Security', 'max-age=15552000; includeSubDomains');
  }

  await next();
});

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
