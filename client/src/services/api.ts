const rawApiUrl = import.meta.env.VITE_API_URL;

if (!rawApiUrl) {
	throw new Error('VITE_API_URL is required');
}

export const API_BASE_URL = rawApiUrl.replace(/\/+$/, '');

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

export const SOCKET_BASE_URL = (
	import.meta.env.VITE_SOCKET_URL || inferLocalSocketBaseUrl(API_BASE_URL)
).replace(/\/+$/, '');

export const apiUrl = (path: `/${string}`): string => `${API_BASE_URL}${path}`;
