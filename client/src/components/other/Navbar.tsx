import './other.css';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { NewPost } from './NewPost.js';
import { SettingsPopup } from './SettingsPopup.js';
import { Notifications } from './Notifications.js';
import { SearchPopup } from './SearchPopup.js';
import Logo from '../../assets/images/ig-logo-2.png';
import HomeHollow from '../../assets/images/home.png';
import HomeSolid from '../../assets/images/home-solid.png';
import SettingsHollow from '../../assets/images/profile.png';
import SettingsSolid from '../../assets/images/profile-solid.png';
import PostHollow from '../../assets/images/post.png';
import PostSolid from '../../assets/images/post-solid.png';
import NotificationsHollow from '../../assets/images/like.png';
import NotificationsSolid from '../../assets/images/like-solid.png';
import MessagesHollow from '../../assets/images/messages.png';
import MessagesSolid from '../../assets/images/messages-solid.png';
import { useAuth } from '../../contexts/AuthContext';
import { usePopUp } from '../../contexts/PopUpContext';
import { useLoading } from '../../contexts/LoaderContext.js';
import { Loader } from './Loader.js';

const Navbar = () => {
	const { user } = useAuth();
	const { loading } = useLoading();
	const { popUpState, updatePopUp } = usePopUp();

	const navigate = useNavigate();

	// Init navbar buttons
	const [homeImg, setHomeImg] = useState(HomeHollow);
	const [messageImg, setMessageImg] = useState(MessagesHollow);
	const [postImg, setPostImg] = useState(PostHollow);
	const [notifImg, setNotifImg] = useState(NotificationsHollow);
	const [settingsImg, setSettingsImg] = useState(SettingsHollow);

	// Init search bar value
	const [searchVal, setSearchVal] = useState('');

	const updateSearchVal = (e: React.ChangeEvent<HTMLInputElement>) => {
		setSearchVal(e.target.value);
	};

	// Update popUpState.searchOn
	const clickSearch = () => updatePopUp('searchOn');

	// Redirect to home & update popUpState
	const clickHome = () => {
		updatePopUp();
		navigate('/');
	};

	// Update popUpState.newPostOn (or redirect to sign-up page)
	const clickNewPost = () => {
		if (user == null) {
			navigate('/signup');
		} else if (popUpState.newPostOn) {
			updatePopUp();
		} else {
			updatePopUp('newPostOn');
		}
	};

	// Update popUpState.notifsOn (or redirect to sign-up page)
	const clickNotifications = () => {
		if (user == null) {
			navigate('/signup');
		} else if (popUpState.notifsOn) {
			updatePopUp();
		} else {
			updatePopUp('notifsOn');
		}
	};

	// Navigate to direct messages & update popUpState (or redirect to sign-up page)
	const clickMessages = () => {
		if (user == null) {
			navigate('/signup');
		} else {
			updatePopUp();
			navigate('/messages');
		}
	};

	// Update viewSettings (or redirect to sign-up page)
	const clickSettings = function () {
		if (user == null) {
			navigate('/signup');
		} else if (popUpState.settingsOn) {
			updatePopUp();
		} else {
			updatePopUp('settingsOn');
		}
	};

	return (
		<div id='navbar'>
			{/* <Loader /> */}
			{loading ? <Loader /> : null}
			{popUpState.notifsOn ? (
				<Notifications />
			) : popUpState.newPostOn ? (
				<NewPost />
			) : null}
			<div id='navbar-logo' onClick={clickHome}>
				<img id='navbar-logo-icon' src={Logo} />
				<div id='navbar-logo-text'>Markstagram</div>
			</div>
			<input
				id='navbar-search'
				type='text'
				placeholder='Search'
				onChange={updateSearchVal}
				onFocus={clickSearch}
			/>
			{popUpState.searchOn ? <SearchPopup searchVal={searchVal} /> : null}
			<div id='navbar-buttons'>
				<img
					id='home-button'
					src={homeImg}
					onClick={clickHome}
					onMouseDown={() => setHomeImg(HomeSolid)}
					onMouseUp={() => setHomeImg(HomeHollow)}
					onMouseOver={() => setHomeImg(HomeSolid)}
					onMouseOut={() => setHomeImg(HomeHollow)}
				/>
				<img
					id='messages-button'
					src={messageImg}
					onClick={clickMessages}
					onMouseDown={() => setMessageImg(MessagesSolid)}
					onMouseUp={() => setMessageImg(MessagesHollow)}
					onMouseOver={() => setMessageImg(MessagesSolid)}
					onMouseOut={() => setMessageImg(MessagesHollow)}
				/>
				<img
					id='post-button'
					src={postImg}
					onClick={clickNewPost}
					onMouseDown={() => setPostImg(PostSolid)}
					onMouseUp={() => setPostImg(PostHollow)}
					onMouseOver={() => setPostImg(PostSolid)}
					onMouseOut={() => setPostImg(PostHollow)}
				/>
				<div id='notifications-button-container'>
					<img
						id='notifications-button'
						src={notifImg}
						onClick={clickNotifications}
						onMouseDown={() => setNotifImg(NotificationsSolid)}
						onMouseUp={() => setNotifImg(NotificationsHollow)}
						onMouseOver={() => setNotifImg(NotificationsSolid)}
						onMouseOut={() => setNotifImg(NotificationsHollow)}
					/>
				</div>
				<img
					id='settings-button'
					src={settingsImg}
					onClick={clickSettings}
					onMouseDown={() => setSettingsImg(SettingsSolid)}
					onMouseUp={() => setSettingsImg(SettingsHollow)}
					onMouseOver={() => setSettingsImg(SettingsSolid)}
					onMouseOut={() => setSettingsImg(SettingsHollow)}
				/>
				{popUpState.settingsOn ? <SettingsPopup /> : null}
				{popUpState.settingsOn ? (
					<div
						onClick={clickSettings}
						style={{
							position: 'fixed',
							opacity: 0,
							height: '100vh',
							width: '100vw',
							left: 0,
							top: 0,
						}}
					/>
				) : null}
			</div>
		</div>
	);
};

export { Navbar };
