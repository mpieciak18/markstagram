import type { Follow, HasOtherUser } from '@markstagram/shared-types';
import { getToken } from './localstor';
import { addNotification } from './notifications';

// Add new follow
export const addFollow = async (id: number): Promise<Follow> => {
	const response = await fetch(`${import.meta.env.VITE_API_URL}/api/follow`, {
		method: 'POST',
		body: JSON.stringify({ id }),
		headers: {
			Authorization: `Bearer ${getToken()}`,
			'Content-Type': 'application/json',
		},
	});
	if (response.status === 200) {
		// add notification to recipient
		await addNotification('follow', id);
		const json = await response.json();
		return json.follow as Follow;
	}
	throw new Error();
};

// Remove follow from other user and self
export const removeFollow = async (id: number) => {
	const response = await fetch(`${import.meta.env.VITE_API_URL}/api/follow`, {
		method: 'DELETE',
		body: JSON.stringify({ id }),
		headers: {
			Authorization: `Bearer ${getToken()}`,
			'Content-Type': 'application/json',
		},
	});
	if (response.status === 200) {
		// const json = await response.json();
		// return json.follow;
		return;
	}
	throw new Error();
};

// Check if the signed-in user is following another user (& return follow id)
export const checkForFollow = async (id: number) => {
	const response = await fetch(`${import.meta.env.VITE_API_URL}/api/follow/user`, {
		method: 'POST',
		body: JSON.stringify({ id }),
		headers: {
			Authorization: `Bearer ${getToken()}`,
			'Content-Type': 'application/json',
		},
	});
	if (response.status === 200) {
		const json = await response.json();
		return json.givenFollow?.id ? json.givenFollow.id : null;
	}
	throw new Error();
};

interface FollowRecord extends Follow, HasOtherUser {}

// Return array of users that signed-in user follows
export const getFollowing = async (id: number, limit: number) => {
	const response = await fetch(`${import.meta.env.VITE_API_URL}/api/follow/given`, {
		method: 'POST',
		body: JSON.stringify({ id: Number(id), limit: Number(limit) }),
		headers: {
			Authorization: `Bearer ${getToken()}`,
			'Content-Type': 'application/json',
		},
	});
	if (response.status === 200) {
		const json = await response.json();
		return json.follows as FollowRecord[];
	}
	throw new Error();
};

// Return array of users that signed-in user is followed by
export const getFollowers = async (id: number, limit: number) => {
	const response = await fetch(`${import.meta.env.VITE_API_URL}/api/follow/received`, {
		method: 'POST',
		body: JSON.stringify({ id: Number(id), limit: Number(limit) }),
		headers: {
			Authorization: `Bearer ${getToken()}`,
			'Content-Type': 'application/json',
		},
	});
	if (response.status === 200) {
		const json = await response.json();
		return json.follows as FollowRecord[];
	}
	throw new Error();
};
