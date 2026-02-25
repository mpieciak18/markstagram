import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { addSave, getSaves, removeSave, saveExists } from '../services/saves';
import { queryKeys } from './queryKeys';

export const useSavedPosts = (limit: number) => {
	return useQuery({
		queryKey: queryKeys.saves.all(limit),
		queryFn: () => getSaves(limit),
	});
};

export const useSaveExists = (postId: number) => {
	return useQuery({
		queryKey: queryKeys.saves.exists(postId),
		queryFn: () => saveExists(postId),
		enabled: !!postId,
	});
};

export const useAddSave = (postId: number) => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: () => addSave(postId),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: queryKeys.saves.exists(postId) });
			queryClient.invalidateQueries({ queryKey: ['saves'] });
		},
	});
};

export const useRemoveSave = (postId: number) => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (saveId: number) => removeSave(saveId),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: queryKeys.saves.exists(postId) });
			queryClient.invalidateQueries({ queryKey: ['saves'] });
		},
	});
};
