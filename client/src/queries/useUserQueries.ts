import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { findUser, searchUsers, updateUser } from '../services/users';
import { queryKeys } from './queryKeys';

export const useUser = (userId: number) => {
	return useQuery({
		queryKey: queryKeys.users.single(userId),
		queryFn: () => findUser(userId),
		enabled: !!userId,
	});
};

export const useSearchUsers = (name: string) => {
	return useQuery({
		queryKey: queryKeys.users.search(name),
		queryFn: () => searchUsers(name),
		enabled: name.length > 0,
	});
};

export const useUpdateUser = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({
			name,
			bio,
			file,
		}: { name: string | null; bio: string | null; file: File | null }) =>
			updateUser(name, bio, file),
		onSuccess: (updatedUser) => {
			queryClient.invalidateQueries({ queryKey: queryKeys.users.single(updatedUser.id) });
		},
	});
};
