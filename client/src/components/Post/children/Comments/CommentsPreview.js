import { getComments } from '../../../../services/comments.js';
import { findUser } from '../../../../services/users.js';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const CommentsPreview = (props) => {
	const { postId, postOwnerId, commentsNum } = props;

	const navigate = useNavigate();

	// Init comments array state
	const [commentsArr, setCommentsArr] = useState(null);

	// Init comment component state
	const [comments, setComments] = useState(null);

	// Update commentsArr when comments count changes
	useEffect(() => {
		getComments(postId, 2).then((array) => {
			if (array != undefined) {
				array.reverse();
				setCommentsArr(array);
			} else {
				setCommentsArr(null);
			}
		});
	}, [commentsNum]);

	const updateComments = async () => {
		const commentsObjs = commentsArr.map(async (comment) => {
			const commenterId = comment.data.user;
			const commenter = await findUser(commenterId);
			const commenterName = commenter.data.name;
			return (
				<div
					className='post-comment'
					key={comment.id}
					onClick={() => navigate(`/${commenterId}`)}
				>
					<div className='post-comment-name'>{commenterName}</div>
					<div className='post-comment-text'>{comment.data.text}</div>
				</div>
			);
		});
		const returnVal = await Promise.all(commentsObjs);
		setComments(returnVal);
	};

	// Update comments component when commentsArr changes
	useEffect(() => {
		if (commentsArr != null) {
			updateComments();
		} else {
			setComments(null);
		}
	}, [commentsArr]);

	// Update comments arr state on render
	useEffect(() => {
		getComments(postId, 2).then((array) => {
			if (array != undefined) {
				array.reverse();
				setCommentsArr(array);
			} else {
				setCommentsArr(null);
			}
		});
	}, []);

	// Return component
	return <div className='post-comments'>{comments}</div>;
};

export { CommentsPreview };
