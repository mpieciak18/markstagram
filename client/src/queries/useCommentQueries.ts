import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { addComment, getComments } from '../services/comments';
import { queryKeys } from './queryKeys';

export const usePostComments = (postId: number, limit: number) => {
	return useQuery({
		queryKey: queryKeys.comments.byPost(postId, limit),
		queryFn: () => getComments(postId, limit),
		enabled: !!postId,
	});
};

export const useAddComment = (postId: number, postOwnerId: number) => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (message: string) => addComment(postOwnerId, postId, message),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['comments', 'post', postId] });
			queryClient.invalidateQueries({ queryKey: queryKeys.posts.single(postId) });
		},
	});
};
