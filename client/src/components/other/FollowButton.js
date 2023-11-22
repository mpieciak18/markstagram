import {
	checkForFollow,
	addFollow,
	removeFollow,
} from '../../services/followers.js';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { findUser } from '../../services/users.js';
import { useAuth } from '../../contexts/AuthContext.js';

const FollowButton = (props) => {
	const { user, setUser } = useAuth();
	const { otherUserId } = props;

	const navigate = useNavigate();

	// Init states

	const [followingId, setFollowingId] = useState(null);

	const [isUpdating, setIsUpdating] = useState(false);

	const [followText, setFollowText] = useState('Follow');

	const [followButtonClass, setFollowButtonClass] = useState('inactive');

	// Update followingId on user prop change & on render
	useEffect(() => {
		if (user == null) {
			setFollowingId(null);
		} else {
			checkForFollow(otherUserId).then(setFollowingId);
		}
	}, [user]);

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
		} else if (isUpdating == false && followingId == null) {
			setFollowButtonClass('inactive');
			setIsUpdating(true);
			const newFollow = await addFollow(otherUserId);
			setFollowingId(newFollow.id);
			const updatedUser = await findUser(user.id);
			await setUser(updatedUser);
		} else if (isUpdating == false && followingId != null) {
			setFollowButtonClass('inactive');
			setIsUpdating(true);
			await removeFollow(followingId);
			setFollowingId(null);
			const updatedUser = await findUser(user.id);
			await setUser(updatedUser);
		}
	};

	return user?.id == otherUserId ? (
		<div className={`follow-button inactive`}>This is you.</div>
	) : (
		<div
			className={`follow-button ${followButtonClass}`}
			onClick={clickFollow}
		>
			{followText}
		</div>
	);
};

export { FollowButton };
