import { useQuery } from '@tanstack/react-query';
import { getConvos, getSingleConvo } from '../services/messages';
import { queryKeys } from './queryKeys';

export const useConversations = (limit: number) => {
	return useQuery({
		queryKey: queryKeys.conversations.all(limit),
		queryFn: () => getConvos(limit),
	});
};

export const useSingleConvo = (otherUserId: number, limit: number) => {
	return useQuery({
		queryKey: queryKeys.conversations.single(otherUserId, limit),
		queryFn: () => getSingleConvo(otherUserId, limit),
		enabled: !!otherUserId && !!limit,
	});
};
