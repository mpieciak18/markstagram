const rawApiUrl = import.meta.env.VITE_API_URL;

if (!rawApiUrl) {
	throw new Error('VITE_API_URL is required');
}

export const API_BASE_URL = rawApiUrl.replace(/\/+$/, '');

const inferWsEndpoint = (apiBaseUrl: string): string => {
	try {
		const parsed = new URL(apiBaseUrl);
		const wsProtocol = parsed.protocol === 'https:' ? 'wss:' : 'ws:';
		return `${wsProtocol}//${parsed.host}/ws`;
	} catch {
		return 'ws://localhost:3001/ws';
	}
};

export const WS_ENDPOINT_URL = (
	import.meta.env.VITE_WS_URL || inferWsEndpoint(API_BASE_URL)
).replace(/\/+$/, '');

export const apiUrl = (path: `/${string}`): string => `${API_BASE_URL}${path}`;
