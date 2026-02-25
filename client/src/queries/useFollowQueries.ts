import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
	addFollow,
	checkForFollow,
	getFollowers,
	getFollowing,
	removeFollow,
} from '../services/followers';
import { queryKeys } from './queryKeys';

export const useCheckFollow = (userId: number) => {
	return useQuery({
		queryKey: queryKeys.follows.check(userId),
		queryFn: () => checkForFollow(userId),
		enabled: !!userId,
	});
};

export const useFollowing = (userId: number, limit: number) => {
	return useQuery({
		queryKey: queryKeys.follows.given(userId, limit),
		queryFn: () => getFollowing(userId, limit),
		enabled: !!userId,
	});
};

export const useFollowers = (userId: number, limit: number) => {
	return useQuery({
		queryKey: queryKeys.follows.received(userId, limit),
		queryFn: () => getFollowers(userId, limit),
		enabled: !!userId,
	});
};

export const useAddFollow = (userId: number) => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: () => addFollow(userId),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: queryKeys.follows.check(userId) });
			queryClient.invalidateQueries({ queryKey: queryKeys.users.single(userId) });
		},
	});
};

export const useRemoveFollow = (userId: number) => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (followId: number) => removeFollow(followId),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: queryKeys.follows.check(userId) });
			queryClient.invalidateQueries({ queryKey: queryKeys.users.single(userId) });
		},
	});
};
