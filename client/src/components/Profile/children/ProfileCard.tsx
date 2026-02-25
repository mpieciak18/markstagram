import { useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useAuth } from '../../../contexts/AuthContext';
import { usePopUp } from '../../../contexts/PopUpContext';
import { useUser } from '../../../queries/useUserQueries';
import { useState } from 'react';
import { Follows } from '../../other/Follows';

const ProfileCard = (props: { otherUserId: number }) => {
	const { user } = useAuth();
	const { popUpState, updatePopUp } = usePopUp();
	const { otherUserId } = props;

	const navigate = useNavigate();

	const { data: otherUser } = useUser(otherUserId);

	const [followingVsFollower, setFollowingVsFollower] = useState('following');

	const clickFollowing = () => {
		if (user != null) {
			setFollowingVsFollower('following');
			updatePopUp('followsOn');
		} else {
			navigate({ to: '/signup' });
		}
	};

	const clickFollowers = () => {
		if (user != null) {
			setFollowingVsFollower('followers');
			updatePopUp('followsOn');
		} else {
			navigate({ to: '/signup' });
		}
	};

	useEffect(() => {
		const body = document.querySelector('body');
		if (popUpState?.followsOn && body) {
			body.style.overflow = 'hidden';
		} else if (body) {
			body.style.overflow = 'auto';
		}
	}, [popUpState]);

	return otherUser ? (
		<div id="profile-card">
			<div id="profile-card-top">
				<img id="profile-card-icon" src={otherUser.image ? otherUser.image : undefined} />
				<div id="profile-card-text">
					<div id="profile-card-name">{otherUser.name}</div>
					<div id="profile-card-username">@{otherUser.username}</div>
				</div>
			</div>
			<div id="profile-card-bottom">
				<div id="profile-card-stats">
					<div id="profile-card-posts">
						<p className="profile-stats-child-num">{otherUser._count.posts}</p>
						<p className="profile-stats-child-type">Posts</p>
					</div>
					<div id="profile-card-following" onClick={clickFollowing}>
						<p className="profile-stats-child-num">{otherUser._count.givenFollows}</p>
						<p className="profile-stats-child-type">Following</p>
					</div>
					<div id="profile-card-followers" onClick={clickFollowers}>
						<p className="profile-stats-child-num">{otherUser._count.receivedFollows}</p>
						<p className="profile-stats-child-type">Followers</p>
					</div>
				</div>
				<div id="profile-card-bio">{otherUser.bio}</div>
			</div>
			{popUpState?.followsOn ? (
				<Follows otherUserId={otherUserId} initTab={followingVsFollower} />
			) : null}
		</div>
	) : null;
};

export { ProfileCard };
