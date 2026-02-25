import { useNavigate } from '@tanstack/react-router';
import { usePostComments } from '../../../../queries/useCommentQueries';

const CommentsPreview = (props: { postId: number }) => {
	const { postId } = props;

	const navigate = useNavigate();

	const { data: commentsArr = [] } = usePostComments(postId, 2);

	// Return component
	return (
		<div className="post-comments">
			{[...commentsArr].reverse().map((comment) => (
				<div
					className="post-comment"
					key={comment.id}
					onClick={() =>
						navigate({ to: '/$otherUserId', params: { otherUserId: String(comment.user.id) } })
					}
				>
					<div className="post-comment-name">{comment.user.name}</div>
					<div className="post-comment-text">{comment.message}</div>
				</div>
			))}
		</div>
	);
};

export { CommentsPreview };
