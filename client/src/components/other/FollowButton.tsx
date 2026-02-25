import { useNavigate } from '@tanstack/react-router';
import { useAuth } from '../../contexts/AuthContext';
import { useAddFollow, useCheckFollow, useRemoveFollow } from '../../queries/useFollowQueries';
import { setLocalUser } from '../../services/localstor';

const FollowButton = (props: { otherUserId: number }) => {
	const { user, setUser } = useAuth();
	const { otherUserId } = props;

	const navigate = useNavigate();

	const { data: followingId = null } = useCheckFollow(otherUserId);
	const addFollowMutation = useAddFollow(otherUserId);
	const removeFollowMutation = useRemoveFollow(otherUserId);

	const isUpdating = addFollowMutation.isPending || removeFollowMutation.isPending;

	const followText = followingId != null ? 'Unfollow' : 'Follow';
	const followButtonClass = isUpdating ? 'inactive' : 'active';

	const clickFollow = async () => {
		if (user == null) {
			navigate({ to: '/signup' });
		} else if (!isUpdating && followingId == null) {
			const newFollow = await addFollowMutation.mutateAsync();
			if (newFollow.id) {
				const updatedUser = {
					...user,
					_count: { ...user._count, givenFollows: user._count.givenFollows + 1 },
				};
				setUser(updatedUser);
				setLocalUser(updatedUser);
			}
		} else if (!isUpdating && followingId != null) {
			await removeFollowMutation.mutateAsync(followingId);
			const updatedUser = {
				...user,
				_count: { ...user._count, givenFollows: user._count.givenFollows - 1 },
			};
			setUser(updatedUser);
			setLocalUser(updatedUser);
		}
	};

	return user?.id === otherUserId ? (
		<div className={'follow-button inactive'}>This is you.</div>
	) : (
		<div className={`follow-button ${followButtonClass}`} onClick={clickFollow}>
			{followText}
		</div>
	);
};

export { FollowButton };
