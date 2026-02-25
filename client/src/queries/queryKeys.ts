export const queryKeys = {
	posts: {
		all: ['posts'] as const,
		feed: (limit: number) => ['posts', 'feed', limit] as const,
		byUser: (userId: number, limit: number) => ['posts', 'user', userId, limit] as const,
		single: (postId: number) => ['posts', 'single', postId] as const,
	},
	users: {
		all: ['users'] as const,
		single: (userId: number) => ['users', 'single', userId] as const,
		search: (name: string) => ['users', 'search', name] as const,
	},
	comments: {
		byPost: (postId: number, limit: number) => ['comments', 'post', postId, limit] as const,
	},
	likes: {
		byPost: (postId: number, limit: number) => ['likes', 'post', postId, limit] as const,
		exists: (postId: number) => ['likes', 'exists', postId] as const,
	},
	saves: {
		all: (limit: number) => ['saves', limit] as const,
		exists: (postId: number) => ['saves', 'exists', postId] as const,
	},
	follows: {
		check: (userId: number) => ['follows', 'check', userId] as const,
		given: (userId: number, limit: number) => ['follows', 'given', userId, limit] as const,
		received: (userId: number, limit: number) =>
			['follows', 'received', userId, limit] as const,
	},
	conversations: {
		all: (limit: number) => ['conversations', limit] as const,
		single: (userId: number, limit: number) =>
			['conversations', 'single', userId, limit] as const,
	},
	notifications: {
		unread: (limit: number) => ['notifications', 'unread', limit] as const,
		read: (limit: number) => ['notifications', 'read', limit] as const,
	},
};
