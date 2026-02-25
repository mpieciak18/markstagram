import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { findPosts, findPostsFromUser, findSinglePost, newPost } from '../services/posts';
import { queryKeys } from './queryKeys';

export const useFeedPosts = (limit: number) => {
	return useQuery({
		queryKey: queryKeys.posts.feed(limit),
		queryFn: () => findPosts(limit),
	});
};

export const useSinglePost = (postId: number) => {
	return useQuery({
		queryKey: queryKeys.posts.single(postId),
		queryFn: () => findSinglePost(postId),
		enabled: !!postId,
	});
};

export const useUserPosts = (userId: number, limit: number) => {
	return useQuery({
		queryKey: queryKeys.posts.byUser(userId, limit),
		queryFn: () => findPostsFromUser(userId, limit),
		enabled: !!userId,
	});
};

export const useCreatePost = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ caption, file }: { caption: string; file: File }) =>
			newPost(caption, file),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: queryKeys.posts.all });
		},
	});
};
