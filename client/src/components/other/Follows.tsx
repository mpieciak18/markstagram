import { useNavigate } from '@tanstack/react-router';
import { getFollowers, getFollowing } from '../../services/followers';
import { FollowButton } from './FollowButton';
import './other.css';
import type { Follow, HasOtherUser } from '@markstagram/shared-types';
import { useEffect, useState } from 'react';
import { useLoading } from '../../contexts/LoaderContext';
import { usePopUp } from '../../contexts/PopUpContext';

interface FollowRecord extends Follow, HasOtherUser {}

const Follows = (props: { otherUserId: number; initTab: string }) => {
	const { otherUserId, initTab } = props;
	const { setLoading } = useLoading();
	const { updatePopUp } = usePopUp();

	const navigate = useNavigate();


	// Init following/follower users count
	const [followsCount, setFollowsCount] = useState(20);

	// Init following/follower users arr state
	const [followsArr, setFollowsArr] = useState<FollowRecord[]>([]);

	// Init all loaded state
	const [allLoaded, setAllLoaded] = useState(false);

	// Init loading state
	const [isLoading, setIsLoading] = useState(false);

	// Init whichTab state
	const [whichTab, setWhichTab] = useState(initTab);

	// Init followers & following buttons classes
	const [buttonOne, setButtonOne] = useState(whichTab === 'following' ? 'active' : 'inactive');
	const [buttonTwo, setButtonTwo] = useState(whichTab !== 'following' ? 'active' : 'inactive');

	// Change whichTab upon render & initTab prop change
	useEffect(() => {
		setWhichTab(initTab);
	}, [initTab]);

	// Change followsArr, allLoaded, and button states when whichTab changes
	useEffect(() => {
		setAllLoaded(false);
		setLoading(true);
		if (whichTab === 'following') {
			setButtonOne('active');
			setButtonTwo('inactive');
			getFollowing(otherUserId, followsCount)
				.then((newArr) => {
					setFollowsArr(newArr);
					setLoading(false);
				})
				.catch(() => setLoading(false));
		} else {
			setButtonOne('inactive');
			setButtonTwo('active');
			getFollowers(otherUserId, followsCount)
				.then((newArr) => {
					setFollowsArr(newArr);
					setLoading(false);
				})
				.catch(() => setLoading(false));
		}
	}, [whichTab]);

	// Load more follows/followers when user reaches bottom of pop-up
	const loadMore = async (e: React.UIEvent<HTMLDivElement>) => {
		if (allLoaded === false && isLoading === false) {
			const elem = e.target as HTMLDivElement;
			if (Math.ceil(elem.scrollHeight - elem.scrollTop) === elem.clientHeight) {
				setIsLoading(true);
				setLoading(true);
				const newCount = followsCount + 20;
				setFollowsCount(newCount);
				let newFollowsArr;
				if (whichTab === 'following') {
					newFollowsArr = await getFollowing(otherUserId, newCount);
					setFollowsArr(newFollowsArr);
				} else {
					newFollowsArr = await getFollowers(otherUserId, newCount);
					setFollowsArr(newFollowsArr);
				}
				if (newFollowsArr.length < newCount) {
					setAllLoaded(true);
				}
				setIsLoading(false);
				setLoading(false);
			}
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
