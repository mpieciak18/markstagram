import './styles/Post.css';
import { useAuth } from '@/contexts/AuthContext';
import { usePopUp } from '@/contexts/PopUpContext';
import { timeSince } from '@/other/timeSince';
import type { Comment, User } from '@markstagram/shared-types';
import { Link, useLocation, useNavigate, useParams } from '@tanstack/react-router';
import { useRef, useState } from 'react';
import { useSinglePost } from '../../queries/usePostQueries';
import { Navbar } from '../other/Navbar';
import { CommentsBar } from './children/Comments/CommentsBar';
import { CommentsFull } from './children/Comments/CommentsFull';
import { Likes } from './children/Likes';
import { LinkCopied } from './children/LinkCopied';
import { PostButtons } from './children/PostButtons';

interface CommentRecord extends Comment {
	user: User;
}

const PostPage = () => {
	const { user } = useAuth();
	const { popUpState, updatePopUp } = usePopUp();

	const params = useParams({ strict: false });
	const postOwnerId = Number(params.postOwnerId);
	const postId = Number(params.postId);

	const { data: post, isPending } = useSinglePost(postId);

	const [commentsNum, setCommentsNum] = useState<number>();
	const [comments, setComments] = useState<CommentRecord[]>([]);
	const [likesNum, setLikesNum] = useState<number>();

	// Sync commentsNum and likesNum from query data
	if (post && commentsNum === undefined) setCommentsNum(post._count.comments);
	if (post && likesNum === undefined) setLikesNum(post._count.likes);

	const inputRef = useRef<HTMLInputElement>(null);

	const [linkCopied, setLinkCopied] = useState(false);

	const path = useLocation().pathname;
	const navigate = useNavigate();
	const clickLikes = () => {
		if (user == null) {
			navigate({ to: '/signup', state: { path: path } });
		} else {
			updatePopUp('likesOn');
		}
	};

	const addCommentToPostState = (comment: CommentRecord) => {
		if (!post) return;
		setComments([comment, ...comments]);
	};

	return (
		<div id="post" className="page" style={{ pointerEvents: isPending ? 'none' : 'auto' }}>
			<Navbar />
			{popUpState.likesOn ? <Likes postId={postId} /> : null}
			{post !== undefined && commentsNum !== undefined && likesNum !== undefined ? (
				<div id="single-post-page">
					<LinkCopied linkCopied={linkCopied} />
					<div id="content-grid">
						<img id="post-image" src={post.image} />
					</div>
					<div id="user-grid">
						<div id="user-grid-child">
							<Link id="user-link" to="/$otherUserId" params={{ otherUserId: String(postOwnerId) }}>
								<img id="user-avatar" src={post.user.image ? post.user.image : undefined} />
								<div id="user-name-parent">
									<div id="user-name">{post.user.name}</div>
									<div id="user-username">@{post.user.username}</div>
								</div>
							</Link>
							<div id="date">{timeSince(post.createdAt)}</div>
						</div>
					</div>
					<CommentsFull
						post={post}
						commentsNum={commentsNum}
						comments={comments}
						setComments={setComments}
					/>
					<div id="buttons-grid">
						<PostButtons
							postId={postId}
							postOwnerId={postOwnerId}
							inputRef={inputRef}
							likesNum={likesNum}
							setLikesNum={setLikesNum}
							setLinkCopied={setLinkCopied}
						/>
						<div id="beneath-buttons">
							<div id="likes-count" onClick={clickLikes}>
								{likesNum === 0 ? '0 likes' : likesNum === 1 ? '1 like' : `${likesNum} likes`}
							</div>
						</div>
					</div>
					<div id="comment-bar-grid">
						<CommentsBar
							postId={postId}
							postOwnerId={postOwnerId}
							commentsNum={commentsNum}
							setCommentsNum={setCommentsNum}
							addCommentToPostState={addCommentToPostState}
							inputRef={inputRef}
						/>
					</div>
				</div>
			) : null}
		</div>
	);
};

export { PostPage };
