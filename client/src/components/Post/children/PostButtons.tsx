import { useLocation, useNavigate } from 'react-router-dom';
import { CommentButton } from './PostButtons/CommentButton';
import { LikeButton } from './PostButtons/LikeButton';
import { SaveButton } from './PostButtons/SaveButton';
import { ShareButton } from './PostButtons/ShareButton';

const PostButtons = (props: {
	postId: number;
	postOwnerId: number;
	inputRef: React.MutableRefObject<HTMLInputElement | null>;
	likesNum: number | undefined;
	setLikesNum: React.Dispatch<React.SetStateAction<number | undefined>>;
	setLinkCopied: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
	const { postId, postOwnerId, inputRef, likesNum, setLikesNum, setLinkCopied } = props;

	const path = useLocation().pathname;

	const navigate = useNavigate();

	const redirectToSignUp = () => {
		navigate('/signup', { state: { path: path } });
	};

	return (
		<div className="post-buttons">
			<div className="post-buttons-left">
				<LikeButton
					postId={postId}
					postOwnerId={postOwnerId}
					redirect={redirectToSignUp}
					likesNum={likesNum}
					setLikesNum={setLikesNum}
				/>
				<CommentButton redirect={redirectToSignUp} inputRef={inputRef} />
				<ShareButton postId={postId} postOwnerId={postOwnerId} setLinkCopied={setLinkCopied} />
			</div>
			<SaveButton postId={postId} postOwnerId={postOwnerId} redirect={redirectToSignUp} />
		</div>
	);
};

export { PostButtons };
