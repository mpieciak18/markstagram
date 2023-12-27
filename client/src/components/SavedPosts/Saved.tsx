import './Saved.css';
import { getSaves } from '../../services/saves.js';
import { PostPreview } from '../Post/children/PostPreview.js';
import { useState, useEffect } from 'react';
import { Navbar } from '../other/Navbar.js';
import { useAuth } from '../../contexts/AuthContext';
import { Post, PostStatsCount, Save } from 'types';
import { useLoading } from '../../contexts/LoaderContext.js';

interface SaveRecord extends Save {
	post: Post & PostStatsCount;
}

const Saved = () => {
	const { user } = useAuth();
	const { loading, setLoading } = useLoading();

	// Init savesNumber state
	const [savesNumber, setSavesNumber] = useState(21);

	// Init savesArr state
	const [savesArr, setSavesArr] = useState<SaveRecord[]>([]);

	// Init all loaded state
	const [allLoaded, setAllLoaded] = useState(false);

	// Update savesArr state when savesNumber or user state changes
	useEffect(() => {
		setLoading(true);
		getSaves(savesNumber)
			.then((savedArr) => {
				setSavesArr(savedArr);
				if (savedArr.length < savesNumber) {
					setAllLoaded(true);
				}
				setLoading(false);
			})
			.catch(() => setLoading(false));
	}, [savesNumber, user]);

	// Load-more function that updates the saves reel
	const loadMore = () => {
		if (allLoaded == false) {
			const newSavesNumber = savesNumber + 9;
			setSavesNumber(newSavesNumber);
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
			id='saved'
			className='page'
			style={{ pointerEvents: `${loading ? 'none' : 'auto'}` }}
		>
			<Navbar />
			{savesArr?.length > 0 ? (
				<div id='saved-posts'>
					<div id='saved-posts-title'>Saved Posts</div>
					<div id='saved-posts-content'>
						{savesArr.map((save) => {
							return (
								<PostPreview
									key={save.postId}
									post={save.post}
								/>
							);
						})}
					</div>
				</div>
			) : (
				<div id='user-posts-empty'>This user has no posts.</div>
			)}
		</div>
	);
};

export { Saved };
