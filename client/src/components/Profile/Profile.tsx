import './Profile.css';
import { Navbar } from '../other/Navbar.js';
import { PostPreview } from '../Post/children/PostPreview.js';
import { ProfileCard } from './children/ProfileCard.js';
import { ProfileButtons } from './children/ProfileButtons.js';
import { findPostsFromUser } from '../../services/posts.js';
import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { ProfileProvider } from '../../contexts/ProfileContext.js';
import { Post, PostStatsCount } from 'types';
import { useLoading } from '../../contexts/LoaderContext.js';

interface PostRecord extends Post, PostStatsCount {}

const Profile = () => {
	const { loading, setLoading } = useLoading();

	// Get other user id from url parameters
	const otherUserId = Number(useParams().otherUserId);

	// Init postsNumber state
	const [postsNumber, setPostsNumber] = useState(21);

	// Init posts component state
	const [posts, setPosts] = useState<PostRecord[]>([]);

	// Init all loaded state
	const [allLoaded, setAllLoaded] = useState(false);

	// Update posts state when postsNumber state changes
	useEffect(() => {
		setLoading(true);
		findPostsFromUser(otherUserId, postsNumber)
			.then((newPosts) => {
				if (newPosts.length > 0) {
					setPosts(newPosts);
					if (newPosts.length < postsNumber) {
						setAllLoaded(true);
					}
				} else {
					setPosts([]);
				}
				setLoading(false);
			})
			.catch(() => setLoading(false));
	}, [postsNumber]);

	// Load-more function that updates the posts reel
	const loadMore = () => {
		if (allLoaded == false) {
			const newPostsNumber = postsNumber + 9;
			setPostsNumber(newPostsNumber);
		}
	};

	// Load more content when user reaches bottom of document
	window.addEventListener('scroll', () => {
		if (
			window.innerHeight + Math.ceil(window.pageYOffset) >=
			document.body.offsetHeight - 2
		) {
			loadMore();
		}
	});

	return (
		<div
			id='profile'
			className='page'
			style={{ pointerEvents: `${loading ? 'none' : 'auto'}` }}
		>
			<Navbar />
			<ProfileProvider>
				<div id='profile-contents'>
					<div id='profile-contents-left'>
						<ProfileCard otherUserId={otherUserId} />
					</div>
					<div id='profile-contents-right'>
						<ProfileButtons otherUserId={otherUserId} />
						{posts.length > 0 ? (
							<div id='user-posts'>
								{posts.map((post) => {
									return (
										<PostPreview
											key={post.id}
											post={post}
										/>
									);
								})}
							</div>
						) : (
							<div id='user-posts-empty'>
								This user has no posts.
							</div>
						)}
					</div>
				</div>
			</ProfileProvider>
		</div>
	);
};

export { Profile };
