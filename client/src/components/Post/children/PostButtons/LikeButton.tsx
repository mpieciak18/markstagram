import { useEffect, useState } from 'react';
import LikeSolid from '../../../../assets/images/like-solid.png';
import LikeHollow from '../../../../assets/images/like.png';
import { useAuth } from '../../../../contexts/AuthContext';
import { useLikeExists, useAddLike, useRemoveLike } from '../../../../queries/useLikeQueries';

const LikeButton = (props: {
	postId: number;
	postOwnerId: number;
	redirect: () => void;
	setLikesNum: React.Dispatch<React.SetStateAction<number | undefined>>;
	likesNum: number | undefined;
}) => {
	const { user } = useAuth();
	const { postId, postOwnerId, redirect, setLikesNum, likesNum } = props;

	const { data: likeId = null } = useLikeExists(postId);
	const addLikeMutation = useAddLike(postId, postOwnerId);
	const removeLikeMutation = useRemoveLike(postId);

	const isUpdating = addLikeMutation.isPending || removeLikeMutation.isPending;

	const [img, setImg] = useState(LikeHollow);

	useEffect(() => {
		if (likeId != null) {
			setImg(LikeSolid);
		} else {
			setImg(LikeHollow);
		}
	}, [likeId]);

	const addRemoveLike = async () => {
		if (likeId == null) {
			await addLikeMutation.mutateAsync();
			setImg(LikeSolid);
			if (likesNum !== undefined) setLikesNum(likesNum + 1);
		} else {
			await removeLikeMutation.mutateAsync(likeId);
			setImg(LikeHollow);
			if (likesNum !== undefined) setLikesNum(likesNum - 1);
		}
	};

	const likeButtonFunction = () => {
		if (user == null) {
			redirect();
		} else if (!isUpdating) {
			addRemoveLike();
		}
	};

	return (
		<img
			className="post-like-button"
			src={img}
			onClick={likeButtonFunction}
			onMouseDown={() => {
				if (likeId == null) {
					setImg(LikeSolid);
				} else {
					setImg(LikeHollow);
				}
			}}
			onMouseUp={() => {
				if (likeId == null) {
					setImg(LikeHollow);
				} else {
					setImg(LikeSolid);
				}
			}}
			onMouseOver={() => {
				if (likeId == null) {
					setImg(LikeSolid);
				} else {
					setImg(LikeHollow);
				}
			}}
			onMouseOut={() => {
				if (likeId == null) {
					setImg(LikeHollow);
				} else {
					setImg(LikeSolid);
				}
			}}
		/>
	);
};

export { LikeButton };
