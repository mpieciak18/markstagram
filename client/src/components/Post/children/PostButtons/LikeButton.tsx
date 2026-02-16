import { likeExists, addLike, removeLike } from '../../../../services/likes';
import LikeHollow from '../../../../assets/images/like.png';
import LikeSolid from '../../../../assets/images/like-solid.png';
import { useEffect, useState } from 'react';
import { useAuth } from '../../../../contexts/AuthContext';
import { useLoading } from '../../../../contexts/LoaderContext';

const LikeButton = (props: {
  postId: number;
  postOwnerId: number;
  redirect: () => void;
  setLikesNum: React.Dispatch<React.SetStateAction<number | undefined>>;
  likesNum: number | undefined;
}) => {
  const { user } = useAuth();
  const { setLoading } = useLoading();
  const { postId, postOwnerId, redirect, setLikesNum, likesNum } = props;

  const [likeId, setLikeId] = useState<number | null>(null);

  const [isUpdating, setIsUpdating] = useState(false);

  const [img, setImg] = useState(LikeHollow);

  useEffect(() => {
    if (user != null) {
      setLoading(true);
      likeExists(postId)
        .then((id) => {
          setLikeId(id);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [user]);

  useEffect(() => {
    if (likeId != null) {
      setImg(LikeSolid);
    } else {
      setImg(LikeHollow);
    }
  }, [likeId]);

  // Called on by likeButtonFunction and runs lbfIsRunning is false
  const addRemoveLike = async () => {
    // disable like button function while functions run
    setIsUpdating(true);
    // perform db updates & state changes
    if (likeId == null) {
      addLike(postId, postOwnerId).then((id) => {
        setLikeId(id);
        setImg(LikeSolid);
        if (likesNum !== undefined) setLikesNum(likesNum + 1);
      });
    } else {
      removeLike(likeId).then(() => {
        setLikeId(null);
        setImg(LikeHollow);
        if (likesNum !== undefined) setLikesNum(likesNum - 1);
      });
    }
    // enable like button once everything is done
    setIsUpdating(false);
  };

  // Runs when like button is clicked and calls addRemoveLike() when lbfIsrunning is false
  const likeButtonFunction = () => {
    if (user == null) {
      redirect();
    } else if (isUpdating == false && user != null) {
      addRemoveLike();
    }
  };

  return (
    <img
      className='post-like-button'
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
