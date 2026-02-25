import { useState } from 'react';
import { useAddComment } from '../../../../queries/useCommentQueries';

const CommentsBar = (props: {
	postId: number;
	postOwnerId: number;
	commentsNum: number | undefined;
	setCommentsNum: React.Dispatch<React.SetStateAction<number | undefined>>;
	inputRef: React.MutableRefObject<HTMLInputElement | null>;
}) => {
	const { postId, postOwnerId, commentsNum, setCommentsNum, inputRef } = props;

	const addCommentMutation = useAddComment(postId, postOwnerId);

	// Set initial comment input value & reset it on submission
	const [commentValue, setCommentValue] = useState('');

	// Updates comment state / field
	const updateComment = (e: React.ChangeEvent<HTMLInputElement>) => {
		const val = e.target.value;
		setCommentValue(val);
	};

	// Adds comment to comments of post
	const addNewComment = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (commentValue.length > 0) {
			try {
				await addCommentMutation.mutateAsync(commentValue);
				setCommentValue('');
				if (commentsNum !== undefined) setCommentsNum(commentsNum + 1);
			} catch {
				// error is handled by query state
			}
		}
	};

	return (
		<form className="post-comment-bar" onSubmit={addNewComment}>
			<input
				type="text"
				className="post-comment-bar-input"
				placeholder="Add a comment..."
				onChange={updateComment}
				value={commentValue}
				ref={inputRef}
			/>
			<button type="submit" className="post-comment-bar-button inactive">
				Post
			</button>
		</form>
	);
};

export { CommentsBar };
