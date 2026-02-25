import type { Conversation, HasUsers, Message } from '@markstagram/shared-types';
// import { addNotification } from './notifications';
import { getToken } from './localstor';
import { apiUrl } from './api';

interface ConvoRecord extends Conversation, HasUsers {
	messages: Message[];
}

// Send message from logged-in user to other user
// NOTE: user A's ID is the convo ID for user B & vice-versa
// export const sendMessage = async (message, id, recipientId) => {
// 	const response = await fetch(
// 		import.meta.env.VITE_API_URL + '/api/message',
// 		{
// 			method: 'POST',
// 			body: JSON.stringify({ message, id }),
// 			headers: {
// 				Authorization: `Bearer ${getToken()}`,
// 				'Content-Type': 'application/json',
// 			},
// 		}
// 	);
// 	if (response.status == 200) {
// 		// add notification to recipient
// 		await addNotification('message', recipientId);
// 		const json = await response.json();
// 		return json.message;
// 	} else {
// 		throw new Error();
// 	}
// };

// Create a new convo between signed-in user and other user
export const createConvo = async (id: number) => {
	const response = await fetch(apiUrl('/api/conversation'), {
		method: 'POST',
		body: JSON.stringify({ id: Number(id) }),
		headers: {
			Authorization: `Bearer ${getToken()}`,
			'Content-Type': 'application/json',
		},
	});
	if (response.status === 200) {
		const json = await response.json();
		return json.conversation as ConvoRecord;
	}
	throw new Error();
};

// Attempt to get single conversation between to users
export const getSingleConvo = async (id: number, limit: number) => {
	const response = await fetch(apiUrl('/api/conversation/otherUser'), {
		method: 'POST',
		body: JSON.stringify({ id, limit }),
		headers: {
			Authorization: `Bearer ${getToken()}`,
			'Content-Type': 'application/json',
		},
	});
	if (response.status === 200) {
		const json = await response.json();
		return json.conversation as ConvoRecord;
	}
	return null;
};

// Get all of user's conversations
export const getConvos = async (limit: number) => {
	const response = await fetch(apiUrl('/api/conversation/user'), {
		method: 'POST',
		body: JSON.stringify({ limit }),
		headers: {
			Authorization: `Bearer ${getToken()}`,
			'Content-Type': 'application/json',
		},
	});
	if (response.status === 200) {
		const json = await response.json();
		return json.conversations as ConvoRecord[];
	}
	throw new Error();
};
