const rawApiUrl = import.meta.env.VITE_API_URL;

if (!rawApiUrl) {
	throw new Error('VITE_API_URL is required');
}

export const API_BASE_URL = rawApiUrl.replace(/\/+$/, '');

export const REALTIME_TRANSPORT = (
	import.meta.env.VITE_REALTIME_TRANSPORT || 'native-ws'
).toLowerCase();

const inferLocalSocketBaseUrl = (apiBaseUrl: string): string => {
	try {
		const parsed = new URL(apiBaseUrl);
		const isLocalhost = parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1';
		if (!isLocalhost || !parsed.port) {
			return apiBaseUrl;
		}

		const incrementedPort = Number(parsed.port) + 1;
		if (!Number.isFinite(incrementedPort) || incrementedPort <= 0) {
			return apiBaseUrl;
		}

		return `${parsed.protocol}//${parsed.hostname}:${incrementedPort}`;
	} catch {
		return apiBaseUrl;
	}
};

const inferWsEndpoint = (apiBaseUrl: string): string => {
	try {
		const parsed = new URL(apiBaseUrl);
		const wsProtocol = parsed.protocol === 'https:' ? 'wss:' : 'ws:';
		return `${wsProtocol}//${parsed.host}/ws`;
	} catch {
		return 'ws://localhost:3001/ws';
	}
};

export const SOCKET_BASE_URL = (
	import.meta.env.VITE_SOCKET_URL || inferLocalSocketBaseUrl(API_BASE_URL)
).replace(/\/+$/, '');

export const WS_ENDPOINT_URL = (
	import.meta.env.VITE_WS_URL || inferWsEndpoint(API_BASE_URL)
).replace(/\/+$/, '');

export const apiUrl = (path: `/${string}`): string => `${API_BASE_URL}${path}`;
