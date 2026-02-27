import { createServer } from 'node:http';
import type { Server as HttpServer } from 'node:http';
import { NativeRealtimeHub } from './realtime/nativeWs.js';

type BunApiServer = {
  port: number;
  upgrade: (request: Request, options?: { data?: unknown }) => boolean;
  stop: (closeActiveConnections?: boolean) => void;
};

type BunRuntime = {
  serve: (options: {
    port: number;
    fetch: (request: Request, server: BunApiServer) => Response | Promise<Response> | undefined;
    websocket?: {
      open?: (ws: unknown) => void;
      message?: (ws: unknown, message: string | ArrayBuffer | Uint8Array) => void;
      close?: (ws: unknown) => void;
    };
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

const [{ config }, { default: app }] = await Promise.all([
  import('./config/index.js'),
  import('./app.js'),
]);

const bunRuntime = (globalThis as { Bun?: BunRuntime }).Bun;
if (!bunRuntime) {
  throw new Error('Bun runtime is required for index.bun.ts');
}

const apiPort = Number(process.env.PORT || config.port);
const realtimeTransport = (process.env.REALTIME_TRANSPORT ?? 'native-ws').toLowerCase();

if (realtimeTransport !== 'native-ws' && realtimeTransport !== 'socketio') {
  throw new Error('REALTIME_TRANSPORT must be one of: native-ws, socketio');
}

const nativeRealtimeHub = realtimeTransport === 'native-ws' ? new NativeRealtimeHub() : null;

const socketPort = Number(process.env.SOCKET_PORT || apiPort + 1);

if (realtimeTransport === 'socketio' && socketPort === apiPort) {
  throw new Error('SOCKET_PORT must differ from PORT when running index.bun.ts');
}

const apiServer = bunRuntime.serve({
  port: apiPort,
  fetch: (request, server) => {
    if (!nativeRealtimeHub) {
      return app.fetch(request);
    }

    const url = new URL(request.url);
    if (url.pathname !== '/ws') {
      return app.fetch(request);
    }

    if (!nativeRealtimeHub.canUpgrade(request)) {
      return new Response('Not allowed by CORS', { status: 403 });
    }

    if (!server.upgrade(request, { data: nativeRealtimeHub.createConnectionData() })) {
      return new Response('WebSocket upgrade failed.', { status: 400 });
    }

    return;
  },
  websocket: nativeRealtimeHub?.getBunHandlers(),
});

let socketHttpServer: HttpServer | null = null;

if (realtimeTransport === 'socketio') {
  const { attachSocketServer } = await import('./socketServer.js');
  socketHttpServer = createServer((_, res) => {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: 'not found' }));
  });

  attachSocketServer(socketHttpServer);

  await new Promise<void>((resolve, reject) => {
    socketHttpServer?.once('error', reject);
    socketHttpServer?.listen(socketPort, () => resolve());
  });
}

console.log(`bun api server running on port ${apiServer.port}`);
if (realtimeTransport === 'socketio') {
  console.log(`socket.io compatibility server running on port ${socketPort}`);
} else {
  console.log('native websocket server running on /ws');
}

const shutdown = async (): Promise<void> => {
  try {
    if (socketHttpServer) {
      await closeServer(socketHttpServer);
    }
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
