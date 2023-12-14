import { addNotification } from './notifications.js';
import { getToken } from './localstor.js';

// Create new comment & return comment ID
export const addComment = async (postOwnerId, postId, message) => {
	const response = await fetch(
		import.meta.env.VITE_API_URL + '/api/comment',
		{
			method: 'POST',
			body: JSON.stringify({
				id: Number(postId),
				message,
			}),
			headers: {
				Authorization: `Bearer ${getToken()}`,
				'Content-Type': 'application/json',
			},
		},
	);
	if (response.status == 200) {
		// add notification to recipient
		await addNotification('comment', postOwnerId, postId);
		const json = await response.json();
		return json.comment;
	} else {
		throw new Error();
	}
};

// Remove comment
export const removeComment = async (id) => {
	const response = await fetch(
		import.meta.env.VITE_API_URL + '/api/comment',
		{
			method: 'DELETE',
			body: JSON.stringify({
				id: Number(id),
			}),
			headers: {
				Authorization: `Bearer ${getToken()}`,
				'Content-Type': 'application/json',
			},
		},
	);
	if (response.status == 200) {
		const json = await response.json();
		return json.comment;
	} else {
		throw new Error();
	}
};

// Get comments
export const getComments = async (id, limit) => {
	const response = await fetch(
		import.meta.env.VITE_API_URL + '/api/comment/post',
		{
			method: 'POST',
			body: JSON.stringify({
				id: Number(id),
				limit: Number(limit),
			}),
			headers: {
				Authorization: `Bearer ${getToken()}`,
				'Content-Type': 'application/json',
			},
		},
	);
	if (response.status == 200) {
		const json = await response.json();
		return json.comments;
	} else {
		throw new Error();
	}
};