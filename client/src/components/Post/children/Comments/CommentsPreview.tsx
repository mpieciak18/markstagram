import type { Comment, User } from '@markstagram/shared-types';
import { useEffect, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useLoading } from '../../../../contexts/LoaderContext';
import { getComments } from '../../../../services/comments';

interface CommentRecord extends Comment {
	user: User;
}

const CommentsPreview = (props: {
	postId: number;
	commentsNum: number | undefined;
}) => {
	const { postId, commentsNum } = props;
	const { setLoading } = useLoading();

	const navigate = useNavigate();

	// Init comments array state
	const [commentsArr, setCommentsArr] = useState<CommentRecord[]>([]);

	// Update commentsArr when comments count changes and on init render
	useEffect(() => {
		setLoading(true);
		getComments(postId, 2)
			.then((array) => {
				setCommentsArr(array.toReversed());
				setLoading(false);
			})
			.catch(() => {
				setCommentsArr([]);
				setLoading(false);
			});
	}, [commentsNum]);

	// Return component
	return (
		<div className="post-comments">
			{commentsArr.map((comment) => (
				<div
					className="post-comment"
					key={comment.id}
					onClick={() => navigate({ to: `/${comment.user.id}` })}
				>
					<div className="post-comment-name">{comment.user.name}</div>
					<div className="post-comment-text">{comment.message}</div>
				</div>
			))}
		</div>
	);
};

export { CommentsPreview };
