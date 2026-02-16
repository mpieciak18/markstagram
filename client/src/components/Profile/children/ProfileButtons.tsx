import { FollowButton } from '../../other/FollowButton';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import MessageHollow from '../../../assets/images/dm.png';
import MessageSolid from '../../../assets/images/dm-solid.png';
import { useAuth } from '../../../contexts/AuthContext';
import { removeLocalUser } from '../../../services/localstor';

const ProfileButtons = (props: { otherUserId: number }) => {
  const { user, setUser } = useAuth();
  const { otherUserId } = props;

  const navigate = useNavigate();

  // Init img state
  const [img, setImg] = useState(MessageHollow);

  // Logs user out
  const clickLogout = async () => {
    await setUser(null);
    removeLocalUser();
    navigate('/');
  };

  // Sends user to settings
  const clickSettings = () => {
    navigate('/settings');
  };

  // Sends user to messages
  const clickMessages = () => {
    if (user != null) {
      navigate(`/messages/${otherUserId}`);
    } else {
      navigate('/signup');
    }
  };

  return user?.id == otherUserId ? (
    <div id='profile-buttons-section'>
      <div id='profile-settings-button' onClick={clickSettings}>
        Settings
      </div>
      <div id='profile-logout-button' onClick={clickLogout}>
        Logout
      </div>
    </div>
  ) : (
    <div id='profile-buttons-section'>
      <FollowButton otherUserId={otherUserId} />
      <div id='profile-direct-message-button-container'>
        <img
          id='profile-direct-message-button'
          src={img}
          onClick={clickMessages}
          onMouseDown={() => setImg(MessageSolid)}
          onMouseUp={() => setImg(MessageHollow)}
          onMouseOver={() => setImg(MessageSolid)}
          onMouseOut={() => setImg(MessageHollow)}
        />
      </div>
    </div>
  );
};

export { ProfileButtons };
