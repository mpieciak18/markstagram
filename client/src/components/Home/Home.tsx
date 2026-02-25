import './Home.css';
import { useState } from 'react';
import { useFeedPosts } from '../../queries/usePostQueries';
import { PostReel } from '../Post/children/PostReel';
import { Navbar } from '../other/Navbar';
import { UserCard } from './children/UserCard';

const Home = () => {
	const [postsNumber, setPostsNumber] = useState(5);

	const { data: posts = [], isPending, isFetching, isSuccess } = useFeedPosts(postsNumber);

	const isAllLoaded = isSuccess && posts.length < postsNumber;

	const loadMore = (e: React.UIEvent<HTMLDivElement, UIEvent>) => {
		const elem = e.target as HTMLDivElement;
		if (
			Math.ceil(elem.scrollHeight - elem.scrollTop) === elem.clientHeight &&
			!isAllLoaded &&
			!isFetching
		) {
			setPostsNumber(postsNumber + 5);
		}
	};

	return (
		<div id="home" className="page" style={{ pointerEvents: isPending ? 'none' : 'auto' }}>
			<Navbar />
			<div id="home-container" onScroll={(e) => loadMore(e)}>
				<UserCard />
				<div id="home-posts">
					{posts.map((post) => {
						return <PostReel key={post.id} post={post} />;
					})}
				</div>
			</div>
		</div>
	);
};

export { Home };
