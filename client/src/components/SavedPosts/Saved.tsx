import './Saved.css';
import { useCallback, useEffect, useState } from 'react';
import { useSavedPosts } from '../../queries/useSaveQueries';
import { PostPreview } from '../Post/children/PostPreview';
import { Navbar } from '../other/Navbar';

const Saved = () => {
	const [savesNumber, setSavesNumber] = useState(21);

	const { data: savesArr = [], isPending, isFetching, isSuccess } = useSavedPosts(savesNumber);

	const isAllLoaded = isSuccess && savesArr.length < savesNumber;

	const loadMore = useCallback(() => {
		if (!isAllLoaded && !isFetching) {
			setSavesNumber((prev) => prev + 9);
		}
	}, [isAllLoaded, isFetching]);

	useEffect(() => {
		const handleScroll = () => {
			if (window.innerHeight + Math.ceil(window.pageYOffset) >= document.body.offsetHeight - 2) {
				loadMore();
			}
		};
		window.addEventListener('scroll', handleScroll);
		return () => window.removeEventListener('scroll', handleScroll);
	}, [loadMore]);

	return (
		<div id="saved" className="page" style={{ pointerEvents: isPending ? 'none' : 'auto' }}>
			<Navbar />
			{savesArr?.length > 0 ? (
				<div id="saved-posts">
					<div id="saved-posts-title">Saved Posts</div>
					<div id="saved-posts-content">
						{savesArr.map((save) => {
							return <PostPreview key={save.postId} post={save.post} />;
						})}
					</div>
				</div>
			) : (
				<div id="user-posts-empty">This user has no posts.</div>
			)}
		</div>
	);
};

export { Saved };
