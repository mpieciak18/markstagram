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

const [{ config }, { default: app }] = await Promise.all([
  import('./config/index.js'),
  import('./app.js'),
]);

const bunRuntime = (globalThis as { Bun?: BunRuntime }).Bun;
if (!bunRuntime) {
  throw new Error('Bun runtime is required for index.bun.ts');
}

const apiPort = Number(process.env.PORT || config.port);
const nativeRealtimeHub = new NativeRealtimeHub();

const apiServer = bunRuntime.serve({
  port: apiPort,
  fetch: (request, server) => {
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
  websocket: nativeRealtimeHub.getBunHandlers(),
});

console.log(`bun api server running on port ${apiServer.port}`);
console.log('native websocket server running on /ws');

const shutdown = async (): Promise<void> => {
  apiServer.stop(true);
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
