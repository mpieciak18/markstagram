const rawApiUrl = import.meta.env.VITE_API_URL;

if (!rawApiUrl) {
	throw new Error('VITE_API_URL is required');
}

export const API_BASE_URL = rawApiUrl.replace(/\/+$/, '');

export const apiUrl = (path: `/${string}`): string => `${API_BASE_URL}${path}`;
