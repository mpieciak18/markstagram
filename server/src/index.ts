import { serve } from '@hono/node-server';
import { loadEnvForRuntime } from './config/runtime.js';

await loadEnvForRuntime();

const [{ config }, { default: app }, { attachSocketServer }] = await Promise.all([
  import('./config/index.js'),
  import('./app.js'),
  import('./socketServer.js'),
]);

// Start the Hono server via @hono/node-server
const port = Number(process.env.PORT || config.port);
const server = serve({
  fetch: app.fetch,
  port,
});

attachSocketServer(server);

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
