import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { addLike, getLikes, likeExists, removeLike } from '../services/likes';
import { queryKeys } from './queryKeys';

export const useLikeExists = (postId: number) => {
	return useQuery({
		queryKey: queryKeys.likes.exists(postId),
		queryFn: () => likeExists(postId),
		enabled: !!postId,
	});
};

export const usePostLikes = (postId: number, limit: number) => {
	return useQuery({
		queryKey: queryKeys.likes.byPost(postId, limit),
		queryFn: () => getLikes(postId, limit),
		enabled: !!postId,
	});
};

export const useAddLike = (postId: number, postOwnerId: number) => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: () => addLike(postId, postOwnerId),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: queryKeys.likes.exists(postId) });
			queryClient.invalidateQueries({ queryKey: queryKeys.posts.single(postId) });
		},
	});
};

export const useRemoveLike = (postId: number) => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (likeId: number) => removeLike(likeId),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: queryKeys.likes.exists(postId) });
			queryClient.invalidateQueries({ queryKey: queryKeys.posts.single(postId) });
		},
	});
};
