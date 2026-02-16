import '../styles/PostPreview.css';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import LikeIcon from '../../../assets/images/like.png';
import CommentsIcon from '../../../assets/images/messages.png';
import { Post, PostStatsCount } from '@markstagram/shared-types';

const PostPreview = (props: { post: Post & PostStatsCount }) => {
  const { post } = props;

  const [overlay, setOverlay] = useState('inactive');

  return (
    <Link
      className='single-post-box'
      to={`/${post.userId}/${post.id}`}
      onPointerDown={() => setOverlay('active')}
      onPointerUp={() => setOverlay('inactive')}
      onMouseOver={() => setOverlay('active')}
      onMouseOut={() => setOverlay('inactive')}
    >
      <img className='single-post-box-image' src={post.image} />
      <div className={`single-post-box-overlay ${overlay}`}>
        <div className='single-post-box-likes'>
          <img className='single-post-box-likes-icon' src={LikeIcon} />
          <div className='single-post-box-likes-number'>
            {post._count.likes}
          </div>
        </div>
        <div className='single-post-box-comments'>
          <img className='single-post-box-comments-icon' src={CommentsIcon} />
          <div className='single-post-box-comments-number'>
            {post._count.comments}
          </div>
        </div>
      </div>
    </Link>
  );
};

export { PostPreview };
