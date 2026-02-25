import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLoading } from '../../contexts/LoaderContext';
import { useProfile } from '../../contexts/ProfileContext';
import { addFollow, checkForFollow, removeFollow } from '../../services/followers';
import { setLocalUser } from '../../services/localstor';

const FollowButton = (props: { otherUserId: number }) => {
	const { setLoading } = useLoading();
	const { user, setUser } = useAuth();
	const { otherUser, setOtherUser } = useProfile();
	const { otherUserId } = props;

	const navigate = useNavigate();

	// Init states

	const [followingId, setFollowingId] = useState<number>();

	const [isUpdating, setIsUpdating] = useState(false);

	const [followText, setFollowText] = useState<'Follow' | 'Unfollow'>('Follow');

	const [followButtonClass, setFollowButtonClass] = useState<'active' | 'inactive'>('inactive');

	// Update followingId on user prop change & on render
	useEffect(() => {
		setLoading(false);
		checkForFollow(otherUserId)
			.then((id) => {
				setFollowingId(id);
			})
			.catch(() => setLoading(false));
	}, []);

	// Update isUpdating, followText, & followButtonClass when followingId changes
	useEffect(() => {
		if (followingId != null) {
			setFollowText('Unfollow');
		} else {
			setFollowText('Follow');
		}
	}, [followingId]);

	// Change followButtonClass back to loaded when followText changes
	useEffect(() => {
		setIsUpdating(false);
		setFollowButtonClass('active');
	}, [followText]);

	// User clicks on follow button & either follows or unfollows other user
	const clickFollow = async () => {
		if (user == null) {
			navigate('/signup');
		} else if (isUpdating === false && followingId == null) {
			setFollowButtonClass('inactive');
			setIsUpdating(true);
			// Create follow
			const newFollow = await addFollow(otherUserId);
			if (newFollow.id) setFollowingId(newFollow.id);
			// Update signed-in user's stats
			const updatedUser = {
				...user,
				_count: {
					...user._count,
					givenFollows: user._count.givenFollows + 1,
				},
			};
			setUser(updatedUser);
			setLocalUser(updatedUser);
			// Update other user's states, if applicable
			if (otherUser) {
				const updatedOtherUser = {
					...otherUser,
					_count: {
						...otherUser._count,
						givenFollows: otherUser._count.givenFollows + 1,
					},
				};
				setOtherUser(updatedOtherUser);
			}
		} else if (isUpdating === false && followingId != null) {
			setFollowButtonClass('inactive');
			setIsUpdating(true);
			// Delete follow
			await removeFollow(followingId);
			setFollowingId(undefined);
			// Update signed-in user's stats
			const updatedUser = {
				...user,
				_count: {
					...user._count,
					givenFollows: user._count.givenFollows - 1,
				},
			};
			setUser(updatedUser);
			setLocalUser(updatedUser);
			// Update other user's states
			if (otherUser) {
				const updatedOtherUser = {
					...otherUser,
					_count: {
						...otherUser._count,
						givenFollows: otherUser._count.givenFollows - 1,
					},
				};
				setOtherUser(updatedOtherUser);
			}
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
