import type { Post, PostStatsCount, User } from '@markstagram/shared-types';
import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { usePostComments } from '../../../../queries/useCommentQueries';
import { timeSinceTrunc } from '../../../../other/timeSinceTrunc';

interface PostRecord extends Post, PostStatsCount {
	user: User;
}

const CommentsFull = (props: { post: PostRecord }) => {
	const { post } = props;

	// Init comment quantity (ie, how many comments are rendered) state
	const [commentQuantity, setCommentQuantity] = useState(10);

	const { data: comments = [] } = usePostComments(post.id, commentQuantity);

	const allLoaded = comments.length < commentQuantity;

	// Load more comments on scroll
	const loadMore = (e: React.UIEvent<HTMLDivElement>) => {
		const elem = e.target as HTMLDivElement;
		if (
			Math.ceil(elem.scrollHeight - elem.scrollTop) === elem.clientHeight &&
			allLoaded === false
		) {
			setCommentQuantity(commentQuantity + 10);
		}
	};

	// Return component
	return (
		<div id="comments-grid" onScroll={loadMore}>
			<div className="post-comment">
				<div className="post-comment-left" key={'first-comment'}>
					<Link to="/$otherUserId" params={{ otherUserId: String(post.user.id) }} className="post-comment-icon">
						<img src={post.user.image ? post.user.image : undefined} />
					</Link>
					<div className="post-comment-text">
						<Link to="/$otherUserId" params={{ otherUserId: String(post.user.id) }} className="post-comment-name">
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
						<Link to="/$otherUserId" params={{ otherUserId: String(comment.userId) }} className="post-comment-icon">
							<img src={comment.user.image ? comment.user.image : undefined} />
						</Link>
						<div className="post-comment-text">
							<Link to="/$otherUserId" params={{ otherUserId: String(comment.user.id) }} className="post-comment-name">
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
