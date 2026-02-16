import { useNavigate } from 'react-router-dom';
import { Follows } from '../../other/Follows';
import { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { usePopUp } from '../../../contexts/PopUpContext';

const UserCard = () => {
  const { user } = useAuth();
  const { popUpState, updatePopUp } = usePopUp();

  const navigate = useNavigate();

  // Init state for user's profile image
  const [userImage, setUserImage] = useState<string | undefined>(undefined);

  // Init state to determine if pop-up shows following or followers
  const [followingVsFollower, setFollowingVsFollower] = useState('following');

  // Open Follows pop-up (following)
  const clickFollowing = () => {
    setFollowingVsFollower('following');
    updatePopUp('followsOn');
  };

  // Open Follows pop-up (followers)
  const clickFollowers = () => {
    setFollowingVsFollower('followers');
    updatePopUp('followsOn');
  };

  // Redirect to user's profile
  const redirectToProfile = () => navigate(`/${user?.id}`);

  // Redirect to sign-up
  const redirectToSignup = () => navigate('/signup');

  // Redirect to login
  const redirectToLogin = () => navigate('/login');

  // Update user card state or user image state when user prop changes
  useEffect(() => {
    if (user?.image) {
      setUserImage(user.image);
    }
  }, [user]);

  return user ? (
    <div id='user-card'>
      <div id='user-card-top' onClick={redirectToProfile}>
        <img id='user-card-icon' src={userImage} />
        <div id='user-card-names'>
          <div id='user-card-name'>{user.name}</div>
          <div id='user-card-username'>{`@${user.username}`}</div>
        </div>
      </div>
      <div id='user-card-bottom'>
        <div id='user-card-posts' onClick={redirectToProfile}>
          <p className='user-stats-child-num'>{user._count.posts}</p>
          <p className='user-stats-child-type'>Posts</p>
        </div>
        <div id='user-card-following' onClick={clickFollowing}>
          <p className='user-stats-child-num'>{user._count.givenFollows}</p>
          <p className='user-stats-child-type'>Following</p>
        </div>
        <div id='user-card-followers' onClick={clickFollowers}>
          <p className='user-stats-child-num'>{user._count.receivedFollows}</p>
          <p className='user-stats-child-type'>Followers</p>
        </div>
      </div>
      {popUpState.followsOn ? (
        <Follows otherUserId={user.id} initTab={followingVsFollower} />
      ) : null}
    </div>
  ) : (
    <div id='user-card'>
      <div id='user-card-sign-up' onClick={redirectToSignup}>
        Sign Up
      </div>
      <div id='user-card-login' onClick={redirectToLogin}>
        Login
      </div>
    </div>
  );
};

export { UserCard };
