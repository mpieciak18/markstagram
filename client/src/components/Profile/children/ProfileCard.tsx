import { useState, useEffect } from 'react';
import { findUser } from '../../../services/users';
import { Follows } from '../../other/Follows';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { usePopUp } from '../../../contexts/PopUpContext';
import { useProfile } from '../../../contexts/ProfileContext';
import { useLoading } from '../../../contexts/LoaderContext';

const ProfileCard = (props: { otherUserId: number }) => {
  const { user } = useAuth();
  const { setLoading } = useLoading();
  const { otherUser, setOtherUser } = useProfile();
  const { popUpState, updatePopUp } = usePopUp();
  const { otherUserId } = props;

  const navigate = useNavigate();

  // Init profile image state
  const [img, setImg] = useState<string | undefined>(undefined);

  // Init state to determine if pop-up shows following or followers
  const [followingVsFollower, setFollowingVsFollower] = useState('following');

  // Open Follows pop-up (following)
  const clickFollowing = () => {
    if (user != null) {
      setFollowingVsFollower('following');
      updatePopUp('followsOn');
    } else {
      navigate('/signup');
    }
  };

  // Open Follows pop-up (followers)
  const clickFollowers = () => {
    if (user != null) {
      setFollowingVsFollower('followers');
      updatePopUp('followsOn');
    } else {
      navigate('/signup');
    }
  };

  // Update img, otherUser, & otherUserFollowers states on render
  useEffect(() => {
    setLoading(true);
    findUser(otherUserId)
      .then((newUser) => {
        setImg(newUser?.image ? newUser.image : undefined);
        setOtherUser(newUser);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Update follows state if followsOn state changes
  useEffect(() => {
    const body = document.querySelector('body');
    if (popUpState?.followsOn && body) {
      body.style.overflow = 'hidden';
    } else if (body) {
      body.style.overflow = 'auto';
    }
  }, [popUpState]);

  return otherUser ? (
    <div id='profile-card'>
      <div id='profile-card-top'>
        <img id='profile-card-icon' src={img} />
        <div id='profile-card-text'>
          <div id='profile-card-name'>{otherUser.name}</div>
          <div id='profile-card-username'>@{otherUser.username}</div>
        </div>
      </div>
      <div id='profile-card-bottom'>
        <div id='profile-card-stats'>
          <div id='profile-card-posts'>
            <p className='profile-stats-child-num'>{otherUser._count.posts}</p>
            <p className='profile-stats-child-type'>Posts</p>
          </div>
          <div id='profile-card-following' onClick={clickFollowing}>
            <p className='profile-stats-child-num'>
              {otherUser._count.givenFollows}
            </p>
            <p className='profile-stats-child-type'>Following</p>
          </div>
          <div id='profile-card-followers' onClick={clickFollowers}>
            <p className='profile-stats-child-num'>
              {otherUser._count.receivedFollows}
            </p>
            <p className='profile-stats-child-type'>Followers</p>
          </div>
        </div>
        <div id='profile-card-bio'>{otherUser.bio}</div>
      </div>
      {popUpState?.followsOn ? (
        <Follows otherUserId={otherUserId} initTab={followingVsFollower} />
      ) : null}
    </div>
  ) : null;
};

export { ProfileCard };
