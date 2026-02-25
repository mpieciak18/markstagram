import type { Post, PostStatsCount, User } from '@markstagram/shared-types';
import { compressFile } from './compress';
import { getToken } from './localstor';

interface PostRecord extends Post, PostStatsCount {
	user: User;
}

// Retrieve single post by post id
export const findSinglePost = async (id: number) => {
	const response = await fetch(`${import.meta.env.VITE_API_URL}/api/post/single`, {
		body: JSON.stringify({ id: Number(id) }),
		// body: { id },
		method: 'POST',
		headers: {
			Authorization: `Bearer ${getToken()}`,
			'Content-Type': 'application/json',
		},
	});
	if (response.status === 200) {
		const json = await response.json();
		return json.post as PostRecord;
	}
	throw new Error();
};

// Retrieve all posts
export const findPosts = async (limit: number) => {
	const response = await fetch(`${import.meta.env.VITE_API_URL}/api/post/all`, {
		body: JSON.stringify({ limit }),
		method: 'POST',
		headers: {
			Authorization: `Bearer ${getToken()}`,
			'Content-Type': 'application/json',
		},
	});
	if (response.status === 200) {
		const json = await response.json();
		return json.posts as PostRecord[];
	}
	throw new Error();
};

interface PostRecord extends Post, PostStatsCount {}

// Retrieve all posts from user
export const findPostsFromUser = async (id: number, limit: number) => {
	const response = await fetch(`${import.meta.env.VITE_API_URL}/api/post/user`, {
		body: JSON.stringify({ id: Number(id), limit: Number(limit) }),
		method: 'POST',
		headers: {
			Authorization: `Bearer ${getToken()}`,
			'Content-Type': 'application/json',
		},
	});
	if (response.status === 200) {
		const json = await response.json();
		// const result: Post[] = json.posts
		return json.posts as PostRecord[];
	}
	throw new Error();
};

// Create new post & return new post data
export const newPost = async (caption: string, image: File) => {
	const body = new FormData();
	body.append('caption', caption);
	const compressedImage = await compressFile(image);
	body.append('file', compressedImage);
	const response = await fetch(`${import.meta.env.VITE_API_URL}/api/post`, {
		body,
		method: 'POST',
		headers: {
			Authorization: `Bearer ${getToken()}`,
		},
	});
	if (response.status === 200) {
		const json = await response.json();
		return json.post as Post;
	}
	throw new Error();
};

// Delete a user's post
// export const removePost = async (id) => {
// 	const response = await fetch(import.meta.env.VITE_API_URL + '/api/post', {
// 		body: JSON.stringify({ id: Number(id) }),
// 		method: 'DELETE',
// 		headers: {
// 			Authorization: `Bearer ${getToken()}`,
// 			'Content-Type': 'application/json',
// 		},
// 	});
// 	if (response.status == 200) {
// 		const json = await response.json();
// 		return json.post;
// 	} else {
// 		throw new Error();
// 	}
// };
