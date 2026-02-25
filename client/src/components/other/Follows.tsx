import { useEffect, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { FollowButton } from './FollowButton';
import './other.css';
import type { Follow, HasOtherUser } from '@markstagram/shared-types';
import { useFollowers, useFollowing } from '../../queries/useFollowQueries';
import { usePopUp } from '../../contexts/PopUpContext';

interface FollowRecord extends Follow, HasOtherUser {}

const Follows = (props: { otherUserId: number; initTab: string }) => {
	const { otherUserId, initTab } = props;
	const { updatePopUp } = usePopUp();

	const navigate = useNavigate();

	// Init following/follower users count
	const [followsCount, setFollowsCount] = useState(20);

	// Init whichTab state
	const [whichTab, setWhichTab] = useState(initTab);

	const buttonOne = whichTab === 'following' ? 'active' : 'inactive';
	const buttonTwo = whichTab !== 'following' ? 'active' : 'inactive';

	// Change whichTab upon render & initTab prop change
	useEffect(() => {
		setWhichTab(initTab);
	}, [initTab]);

	const { data: followingData = [], isFetching: isFetchingFollowing } = useFollowing(
		otherUserId,
		followsCount,
	);
	const { data: followersData = [], isFetching: isFetchingFollowers } = useFollowers(
		otherUserId,
		followsCount,
	);

	const followsArr: FollowRecord[] = whichTab === 'following' ? followingData : followersData;
	const isFetching = isFetchingFollowing || isFetchingFollowers;
	const allLoaded =
		whichTab === 'following'
			? followingData.length < followsCount
			: followersData.length < followsCount;

	// Load more follows/followers when user reaches bottom of pop-up
	const loadMore = (e: React.UIEvent<HTMLDivElement>) => {
		const elem = e.target as HTMLDivElement;
		if (
			Math.ceil(elem.scrollHeight - elem.scrollTop) === elem.clientHeight &&
			allLoaded === false &&
			isFetching === false
		) {
			setFollowsCount(followsCount + 20);
		}
	};

	// Event handlers for buttons
	const followingClick = () => setWhichTab('following');

	const followersClick = () => setWhichTab('followers');

	const xButtonClick = () => updatePopUp();

	return (
		<div id="follow">
			<div id="follows-pop-up">
				<div id="follows-header">
					<div id="follows-x-button" onClick={xButtonClick}>
						« Go Back
					</div>
					<div id="follows-header-menu">
						<div id="following-button" className={buttonOne} onClick={followingClick}>
							Following
						</div>
						<div id="followers-button" className={buttonTwo} onClick={followersClick}>
							Followers
						</div>
					</div>
					<div id="follows-x-button-hidden">« Go Back</div>
				</div>
				<div id="follows-divider" />
				<div id="follows-list" onScroll={loadMore}>
					{followsArr.map((follow) => {
						const redirect = () => {
							updatePopUp();
							navigate({ to: '/$otherUserId', params: { otherUserId: String(follow.otherUser.id) } });
						};
						return (
							<div className="follow-row" key={follow.id}>
								<div className="follow-row-left" onClick={redirect}>
									<img
										className="follow-image"
										src={follow.otherUser.image ? follow.otherUser.image : undefined}
									/>
									<div className="follow-text">
										<div className="follow-name">{follow.otherUser.name}</div>
										<div className="follow-username">@{follow.otherUser.username}</div>
									</div>
								</div>
								<div className="follow-row-right">
									<FollowButton otherUserId={follow.otherUser.id} />
								</div>
							</div>
						);
					})}
				</div>
			</div>
		</div>
	);
};

export { Follows };
