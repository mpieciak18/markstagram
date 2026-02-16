import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { usePopUp } from '../../contexts/PopUpContext';
import { removeLocalUser } from '../../services/localstor';

const SettingsPopup = () => {
  const { user, setUser } = useAuth();
  const { popUpState, updatePopUp } = usePopUp();
  const navigate = useNavigate();

  // Logout user
  const logout = async () => {
    await setUser(null);
    removeLocalUser();
    navigate('/');
  };

  // Handles click for opening / closing pop-up
  const handleClick = () => {
    if (popUpState.settingsOn) updatePopUp(null);
    else updatePopUp('settingsOn');
  };

  return (
    <div id='settings-popup' onClick={handleClick}>
      <div
        id='settings-profile'
        className='settings-popup-button'
        onClick={() => navigate(`/${user?.id}`)}
      >
        View Profile
      </div>
      <div
        id='settings-settings'
        className='settings-popup-button'
        onClick={() => navigate('/settings')}
      >
        Change Settings
      </div>
      <div
        id='settings-posts'
        className='settings-popup-button'
        onClick={() => navigate('/saved')}
      >
        View Saved Posts
      </div>
      <div
        id='settings-logout'
        className='settings-popup-button'
        onClick={logout}
      >
        Sign Out
      </div>
    </div>
  );
};

export { SettingsPopup };
