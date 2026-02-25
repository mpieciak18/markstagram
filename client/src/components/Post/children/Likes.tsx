import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getLikes } from '../../../services/likes';
import { FollowButton } from '../../other/FollowButton';
import '../styles/Likes.css';
import type { Like, User } from '@markstagram/shared-types';
import { useLoading } from '../../../contexts/LoaderContext';
import { usePopUp } from '../../../contexts/PopUpContext';

interface LikeRecord extends Like {
	user: User;
}

const Likes = (props: { postId: number }) => {
	const { setLoading } = useLoading();
	const { updatePopUp } = usePopUp();
	const { postId } = props;

	// Init likesNumber state
	const [likesNumber, setLikesNumber] = useState(10);

	// Init likes array state
	const [likes, setLikes] = useState<LikeRecord[]>([]);

	// Init all likes loaded state
	const [allLoaded, setAllLoaded] = useState(false);

	// Update likesNumber upon render
	useEffect(() => {
		setLikesNumber(10);
	}, []);

	// Update likes when likesNumber changes (ie, upon render or upon scroll-to-bottom)
	useEffect(() => {
		setLoading(true);
		getLikes(postId, likesNumber)
			.then((newLikes) => {
				setLikes(newLikes);
				if (newLikes.length < likesNumber) {
					setAllLoaded(true);
				}
				setLoading(false);
			})
			.catch(() => setLoading(false));
	}, [likesNumber]);

	// Load more likes when user reaches bottom of pop-up
	const loadMore = (e: React.UIEvent<HTMLDivElement>) => {
		const elem = e.target as HTMLDivElement;
		if (
			Math.ceil(elem.scrollHeight - elem.scrollTop) === elem.clientHeight &&
			allLoaded === false
		) {
			const newLikesNumber = likesNumber + 20;
			setLikesNumber(newLikesNumber);
		}
	};

	// Closes likes pop-up
	const hideLikes = (e: React.MouseEvent<HTMLDivElement>) => {
		const id = (e.target as HTMLDivElement).id;
		if (id === 'likes' || id === 'likes-x-button') {
			updatePopUp();
		}
	};

	return (
		<div id="likes" onClick={hideLikes}>
			<div id="likes-pop-up">
				<div id="likes-header">
					<div id="likes-x-button">« Go Back</div>
					<div id="likes-title">Likes</div>
					<div id="likes-x-button-hidden">« Go Back</div>
				</div>
				<div id="likes-divider" />
				<div id="likes-list" onScroll={loadMore}>
					{likes.map((like) => (
						<div className="like-row" key={like.id}>
							<Link className="like-row-left" to={`/${like.user.id}`}>
								<img className="like-image" src={like.user.image ? like.user.image : undefined} />
								<div className="like-text">
									<div className="like-name">{like.user.name}</div>
									<div className="like-username">@{like.user.username}</div>
								</div>
							</Link>
							<div className="like-row-right">
								<FollowButton otherUserId={like.user.id} />
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
};

export { Likes };
