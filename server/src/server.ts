// Compatibility shim for supertest in tests.
// The actual app is defined in app.ts using Hono.
import { createAdaptorServer } from '@hono/node-server';
import app from './app.js';

export default createAdaptorServer(app);
