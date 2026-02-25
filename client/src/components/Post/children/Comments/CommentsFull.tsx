import type { Comment, Post, PostStatsCount, User } from '@markstagram/shared-types';
import { type SetStateAction, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLoading } from '../../../../contexts/LoaderContext';
import { timeSinceTrunc } from '../../../../other/timeSinceTrunc';
import { getComments } from '../../../../services/comments';

interface PostRecord extends Post, PostStatsCount {
	user: User;
}
interface CommentRecord extends Comment {
	user: User;
}

const CommentsFull = (props: {
	post: PostRecord;
	commentsNum: number;
	comments: CommentRecord[];
	setComments: React.Dispatch<SetStateAction<CommentRecord[]>>;
}) => {
	const { post, commentsNum, comments, setComments } = props;
	const { setLoading } = useLoading();

	// Init comment quantity (ie, how many comments are rendered) state
	const [commentQuantity, setCommentQuantity] = useState(10);

	// Init all loaded state
	const [allLoaded, setAllLoaded] = useState(false);

	// Update commentsArr when commentsNum (total comments on a post) or commentQuantity (how many are rendered) changes
	// E.g., user submits new comment on a post OR scrolls to load more
	useEffect(() => {
		getComments(post.id, commentQuantity)
			.then((array) => {
				setComments(array);
				if (array.length < commentQuantity) {
					setAllLoaded(true);
				}
			})
			.catch(() => setComments([]));
	}, [commentsNum, commentQuantity]);

	// Load more comments on scroll
	const loadMore = (e: React.UIEvent<HTMLDivElement>) => {
		const elem = e.target as HTMLDivElement;
		if (
			Math.ceil(elem.scrollHeight - elem.scrollTop) === elem.clientHeight &&
			allLoaded === false
		) {
			const newCommentQuantity = commentQuantity + 10;
			setCommentQuantity(newCommentQuantity);
		}
	};

	// Update comments arr state on init render
	useEffect(() => {
		setLoading(true);
		getComments(post.id, 10)
			.then((results) => {
				setComments(results);
				setLoading(false);
			})
			.catch(() => {
				setComments([]);
				setLoading(false);
			});
	}, []);

	// Return component
	return (
		<div id="comments-grid" onScroll={loadMore}>
			<div className="post-comment">
				<div className="post-comment-left" key={'first-comment'}>
					<Link to={`/${post.user.id}`} className="post-comment-icon">
						<img src={post.user.image ? post.user.image : undefined} />
					</Link>
					<div className="post-comment-text">
						<Link to={`/${post.user.id}`} className="post-comment-name">
							{post.user.name}
						</Link>
						<div className="post-comment-text">{post.caption}</div>
					</div>
				</div>
				<div className="post-comment-right">...</div>
			</div>
			{comments.map((comment) => (
				<div className="post-comment" key={comment.id}>
					<div className="post-comment-left">
						<Link to={`/${comment.userId}`} className="post-comment-icon">
							<img src={comment.user.image ? comment.user.image : undefined} />
						</Link>
						<div className="post-comment-text">
							<Link to={`/${comment.user.id}`} className="post-comment-name">
								{comment.user.name}
							</Link>
							<div className="post-comment-text">{comment.message}</div>
						</div>
					</div>
					<div className="post-comment-right">{timeSinceTrunc(comment.createdAt)}</div>
				</div>
			))}
		</div>
	);
};

export { CommentsFull };
