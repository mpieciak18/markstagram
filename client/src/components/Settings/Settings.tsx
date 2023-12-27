import './Settings.css';
import { updateUser } from '../../services/users.js';
import { useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { NameFooter } from './children/NameFooter.js';
import { ImageInput } from './children/ImageInput.js';
import { Navbar } from '../other/Navbar.js';
import { useAuth } from '../../contexts/AuthContext';
import { setLocalUser } from '../../services/localstor';
import { useLoading } from '../../contexts/LoaderContext.js';

const Settings = () => {
	const { user, setUser } = useAuth();
	const { loading, setLoading } = useLoading();

	const location = useLocation();

	// Store (potential) state from previous page to variable
	const [prevState, setPrevState] = useState(null);

	// Init useNavigate function
	const navigate = useNavigate();

	// Redirect to own profile page
	const redirectToProfile = () => navigate(`/${user?.id}`);

	// Init file state
	const [file, setFile] = useState<File | null>(null);

	// Init ref for ImageInput component
	const inputRef = useRef<HTMLInputElement | null>(null);

	// Init error message class state
	const [errorClass, setErrorClass] = useState('inactive');

	// Init new user registration message class state
	const [welcomeClass, setWelcomeClass] = useState('inactive');

	// Init name field value form validation state
	const [namePasses, setNamePasses] = useState(true);

	// Init name field value state
	const [name, setName] = useState<string>(user?.name ? user.name : '');

	// Init bio field value state
	const [bio, setBio] = useState<string>(user?.bio ? user.bio : '');

	// OnChange event handler for for name field on form
	const updateName = (e: React.ChangeEvent<HTMLInputElement>) => {
		setName(e.target.value);
	};

	// OnChange event handler for for bio field on form
	const updateBio = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		setBio(e.target.value);
	};

	// Init form button type state
	const [button, setButton] = useState<'button' | 'submit'>('submit');

	// Init form buttonc class state
	const [buttonClass, setButtonClass] = useState<'active' | 'inactive'>(
		'active'
	);

	// Updates user's settings with form values
	const updateSettings = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		// Check validation first
		if (namePasses == true) {
			setLoading(true);
			updateUser(name, bio, file)
				.then((updatedUser) => {
					setUser(updatedUser);
					setLocalUser(updatedUser);
					setLoading(false);
					navigate(`/${user?.id}`);
				})
				.catch(() => {
					setLoading(false);
					setErrorClass('active');
					setTimeout(() => {
						setErrorClass('inactive');
					}, 2000);
				});
		}
	};

	// Update prev state upon render
	useEffect(() => {
		setPrevState(location.state);
	}, []);

	// Update welcomeClass state when prev state change
	useEffect(() => {
		if (prevState != null) {
			setWelcomeClass('active');
			setTimeout(() => {
				setWelcomeClass('inactive');
			}, 3500);
		}
	}, [prevState]);

	useEffect(() => {
		if (namePasses == true) {
			setButton('submit');
			setButtonClass('active');
		} else {
			setButton('button');
			setButtonClass('inactive');
		}
	}, [namePasses]);

	return (
		<div
			id='settings'
			className='page'
			style={{ pointerEvents: `${loading ? 'none' : 'auto'}` }}
		>
			<Navbar />
			{user != null ? (
				<div id='settings-parent'>
					<div id='settings-welcome' className={welcomeClass}>
						<p>You've successfully registered!</p>
						<p>Please update your bio and image.</p>
					</div>
					<form id='settings-form' onSubmit={updateSettings}>
						<div id='settings-error' className={errorClass}>
							<p>There was an error!</p>
							<p>Please try again.</p>
						</div>
						<div id='settings-header'>
							<div id='settings-title'>Settings</div>
						</div>
						<div id='settings-image-section'>
							<label id='settings-image-footer' htmlFor='image'>
								File size limit: 5 mb
							</label>
							<ImageInput
								setFile={setFile}
								setErrorClass={setErrorClass}
								inputRef={inputRef}
								// name='image'
							/>
						</div>
						<div id='settings-name-section'>
							<label id='settings-name-label' htmlFor='name'>
								Your Name:
							</label>
							<input
								id='settings-name-input'
								name='name'
								type='text'
								value={name}
								onChange={updateName}
							></input>
							<NameFooter
								setNamePasses={setNamePasses}
								name={name}
							/>
						</div>
						<div id='settings-bio-section'>
							<label id='settings-bio-label' htmlFor='bio'>
								Your Bio:
							</label>
							<textarea
								id='settings-bio-input'
								name='bio'
								value={bio}
								maxLength={150}
								onChange={updateBio}
							/>
						</div>
						<div id='settings-buttons-section'>
							<button
								id='settings-button-submit'
								type={button}
								className={buttonClass}
							>
								Update Settings
							</button>
							<button
								id='settings-button-back'
								type='button'
								onClick={redirectToProfile}
							>
								Back to Profile
							</button>
						</div>
					</form>
				</div>
			) : null}
		</div>
	);
};

export { Settings };
