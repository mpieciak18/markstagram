import { createServer } from 'node:http';
import type { Server as HttpServer } from 'node:http';
import { loadEnvForRuntime } from './config/runtime.js';

type BunApiServer = {
  port: number;
  stop: (closeActiveConnections?: boolean) => void;
};

type BunRuntime = {
  serve: (options: {
    port: number;
    fetch: (request: Request) => Response | Promise<Response>;
  }) => BunApiServer;
};

const closeServer = async (server: HttpServer): Promise<void> => {
  await new Promise<void>((resolve, reject) => {
    server.close((err) => {
      if (err) {
        reject(err);
        return;
      }
      resolve();
    });
  });
};

await loadEnvForRuntime();

const [{ config }, { default: app }, { attachSocketServer }] = await Promise.all([
  import('./config/index.js'),
  import('./app.js'),
  import('./socketServer.js'),
]);

const bunRuntime = (globalThis as { Bun?: BunRuntime }).Bun;
if (!bunRuntime) {
  throw new Error('Bun runtime is required for index.bun.ts');
}

const apiPort = Number(process.env.PORT || config.port);
const socketPort = Number(process.env.SOCKET_PORT || apiPort + 1);

if (socketPort === apiPort) {
  throw new Error('SOCKET_PORT must differ from PORT when running index.bun.ts');
}

const apiServer = bunRuntime.serve({
  port: apiPort,
  fetch: app.fetch,
});

const socketHttpServer = createServer((_, res) => {
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ message: 'not found' }));
});

attachSocketServer(socketHttpServer);

await new Promise<void>((resolve, reject) => {
  socketHttpServer.once('error', reject);
  socketHttpServer.listen(socketPort, () => resolve());
});

console.log(`bun api server running on port ${apiServer.port}`);
console.log(`socket.io compatibility server running on port ${socketPort}`);

const shutdown = async (): Promise<void> => {
  try {
    await closeServer(socketHttpServer);
  } finally {
    apiServer.stop(true);
  }
};

process.on('SIGINT', () => {
  shutdown()
    .catch((error) => console.error(error))
    .finally(() => process.exit(0));
});

process.on('SIGTERM', () => {
  shutdown()
    .catch((error) => console.error(error))
    .finally(() => process.exit(0));
});

process.on('uncaughtException', (error) => {
  console.error('uncaught exception (sync) at top level of node process');
  console.error(error);
});

process.on('unhandledRejection', (reason) => {
  console.error('unhandled rejection (async) at top level of node process');
  console.error(reason);
});
