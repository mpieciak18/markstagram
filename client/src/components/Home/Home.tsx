import './Home.css';
import { findPosts } from '../../services/posts.js';
import { Navbar } from '../other/Navbar.js';
import { PostReel } from '../Post/children/PostReel.js';
import { UserCard } from './children/UserCard.js';
import { useEffect, useState } from 'react';
import { Post, PostStatsCount, User } from 'types';
import { useLoading } from '../../contexts/LoaderContext.js';

interface PostRecord extends Post, PostStatsCount {
	user: User;
}

const Home = () => {
	const { loading, setLoading } = useLoading();

	// Init postsNumber state
	const [postsNumber, setPostsNumber] = useState(5);

	// Init posts array state
	const [posts, setPosts] = useState<PostRecord[]>([]);

	// Init all loaded state
	const [allLoaded, setAllLoaded] = useState(false);

	// Init isLoading state
	const [isLoading, setIsLoading] = useState(false);

	// Load more content when user reaches bottom of document
	const loadMore = async (e: React.UIEvent<HTMLDivElement, UIEvent>) => {
		const elem = e.target as HTMLDivElement;
		if (
			Math.ceil(elem.scrollHeight - elem.scrollTop) ==
				elem.clientHeight &&
			allLoaded == false &&
			isLoading == false
		) {
			setLoading(true);
			setIsLoading(true);
			setPostsNumber(postsNumber + 5);
		}
	};

	// Update postsArr state when postsNumber state changes
	useEffect(() => {
		setLoading(true);
		findPosts(postsNumber)
			.then((newPosts) => {
				if (newPosts.length < postsNumber) {
					setAllLoaded(true);
				}
				setPosts(newPosts);
				setLoading(false);
				setIsLoading(false);
			})
			.catch(() => setLoading(false));
	}, [postsNumber]);

	return (
		<div
			id='home'
			className='page'
			style={{ pointerEvents: `${loading ? 'none' : 'auto'}` }}
		>
			<Navbar />
			<div id='home-container' onScroll={(e) => loadMore(e)}>
				<UserCard />
				<div id='home-posts'>
					{posts.map((post) => {
						return <PostReel key={post.id} post={post} />;
					})}
				</div>
			</div>
		</div>
	);
};

export { Home };
