import './Profile.css';
import { useState } from 'react';
import { useParams } from '@tanstack/react-router';
import { useUserPosts } from '../../queries/usePostQueries';
import { PostPreview } from '../Post/children/PostPreview';
import { Navbar } from '../other/Navbar';
import { ProfileButtons } from './children/ProfileButtons';
import { ProfileCard } from './children/ProfileCard';

const Profile = () => {
	const otherUserId = Number(useParams({ strict: false }).otherUserId);

	const [postsNumber, setPostsNumber] = useState(21);

	const {
		data: posts = [],
		isPending,
		isFetching,
		isSuccess,
	} = useUserPosts(otherUserId, postsNumber);

	const isAllLoaded = isSuccess && posts.length < postsNumber;

	const loadMore = () => {
		if (!isAllLoaded && !isFetching) {
			setPostsNumber(postsNumber + 9);
		}
	};

	window.addEventListener('scroll', () => {
		if (window.innerHeight + Math.ceil(window.pageYOffset) >= document.body.offsetHeight - 2) {
			loadMore();
		}
	});

	return (
		<div id="profile" className="page" style={{ pointerEvents: isPending ? 'none' : 'auto' }}>
			<Navbar />
			<div id="profile-contents">
				<div id="profile-contents-left">
					<ProfileCard otherUserId={otherUserId} />
				</div>
				<div id="profile-contents-right">
					<ProfileButtons otherUserId={otherUserId} />
					{posts.length > 0 ? (
						<div id="user-posts">
							{posts.map((post) => {
								return <PostPreview key={post.id} post={post} />;
							})}
						</div>
					) : (
						<div id="user-posts-empty">This user has no posts.</div>
					)}
				</div>
			</div>
		</div>
	);
};

export { Profile };
