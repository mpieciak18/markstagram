import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
	getReadNotifications,
	getUnreadNotifications,
	readNotifications,
} from '../services/notifications';
import { queryKeys } from './queryKeys';

export const useUnreadNotifications = (limit: number) => {
	return useQuery({
		queryKey: queryKeys.notifications.unread(limit),
		queryFn: () => getUnreadNotifications(limit),
	});
};

export const useReadNotifications = (limit: number) => {
	return useQuery({
		queryKey: queryKeys.notifications.read(limit),
		queryFn: () => getReadNotifications(limit),
	});
};

export const useMarkNotificationsRead = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: readNotifications,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['notifications'] });
		},
	});
};
