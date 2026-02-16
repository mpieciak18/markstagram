import CommentHollow from '@/assets/images/messages.png';
import CommentSolid from '@/assets/images/messages-solid.png';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

const CommentButton = (props: {
  redirect: () => void;
  inputRef: React.MutableRefObject<HTMLInputElement | null>;
}) => {
  const { user } = useAuth();
  const { redirect, inputRef } = props;

  const [img, setImg] = useState(CommentHollow);

  // Runs when comment button is clicked and sets focus on ref (which is the comment input bar on the post)
  const commentButtonFunction = () => {
    if (user && inputRef.current) {
      inputRef.current.focus();
    } else {
      redirect();
    }
  };

  return (
    <img
      className='post-comment-button'
      onClick={commentButtonFunction}
      onMouseDown={() => setImg(CommentSolid)}
      onMouseUp={() => setImg(CommentHollow)}
      onMouseOver={() => setImg(CommentSolid)}
      onMouseOut={() => setImg(CommentHollow)}
      src={img}
    />
  );
};

export { CommentButton };
