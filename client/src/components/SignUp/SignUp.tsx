import './SignUp.css';
import Logo from '../../assets/images/ig-logo-2.png';
import { UsernameFooter } from './children/UsernameFooter.js';
import { PasswordFooter } from './children/PasswordFooter.js';
import { NameFooter } from './children/NameFooter.js';
import { EmailFooter } from './children/EmailFooter.js';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { setLocalUser } from '../../services/localstor';
import { createUser } from '../../services/users';
import { useLoading } from '../../contexts/LoaderContext.js';
import { Loader } from '../other/Loader.js';

const SignUp = () => {
	const { loading, setLoading } = useLoading();
	const { setUser } = useAuth();

	const navigate = useNavigate();

	// Init criteria for form validation
	const [username, setUsername] = useState('');
	const [usernameUnique, setUsernameUnique] = useState(true);
	const [usernamePasses, setUsernamePasses] = useState(false);
	const updateUsername = (e: React.ChangeEvent<HTMLInputElement>) => {
		setUsername(e.target.value);
	};

	const [name, setName] = useState('');
	const [namePasses, setNamePasses] = useState(false);
	const updateName = (e: React.ChangeEvent<HTMLInputElement>) => {
		setName(e.target.value);
	};

	const [email, setEmail] = useState('');
	const [emailUnique, setEmailUnique] = useState(true);
	const [emailPasses, setEmailPasses] = useState(false);
	const updateEmail = (e: React.ChangeEvent<HTMLInputElement>) => {
		setEmail(e.target.value);
	};

	const [password, setPassword] = useState('');
	const [passwordPasses, setPasswordPasses] = useState(false);
	const updatePassword = (e: React.ChangeEvent<HTMLInputElement>) => {
		setPassword(e.target.value);
	};

	const [allPass, setAllPass] = useState(false);

	const [signUpButtonType, setSignUpButtonType] = useState<
		'button' | 'submit'
	>('button');

	const [signUpButtonClass, setSignUpButtonClass] = useState('inactive');

	const [errorClass, setErrorClass] = useState('inactive');

	// Update allPass when any of the input pass states change
	useEffect(() => {
		setAllPass(
			usernamePasses && namePasses && passwordPasses && emailPasses
		);
	}, [usernamePasses, namePasses, passwordPasses, emailPasses]);

	// Update sign-up button type & class when allPass changes
	useEffect(() => {
		if (allPass == true) {
			setSignUpButtonType('submit');
			setSignUpButtonClass('active');
		} else {
			setSignUpButtonType('button');
			setSignUpButtonClass('inactive');
		}
	}, [allPass]);

	// Hanldes any fields failed due to duplicates during sign-up
	const handleDups = (dups: string[]) => {
		setEmailUnique(dups.includes('email'));
		setUsernameUnique(dups.includes('username'));
	};

	const newSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		// Add new user to services/auth & return any errors
		setLoading(true);
		try {
			const newUser = await createUser(username, name, email, password);
			// if (newUser.notUnique) {
			if ('notUnique' in newUser) {
				handleDups(newUser.notUnique);
				throw new Error();
			} else {
				setUser(newUser);
				setLocalUser(newUser);
				setLoading(false);
				navigate('/settings', { state: { newSignUp: true } });
			}
		} catch {
			setLoading(false);
			setErrorClass('active');
			setTimeout(() => {
				setErrorClass('inactive');
			}, 3000);
		}
	};

	return (
		<div
			id='sign-up'
			className='page'
			style={{ pointerEvents: `${loading ? 'none' : 'auto'}` }}
		>
			<div id='navbar-logo-logged-out'>
				{loading ? <Loader /> : null}
				<img id='navbar-logo-icon' src={Logo} />
				<div id='navbar-logo-text'>Markstagram</div>
			</div>
			<div id='sign-up-parent'>
				<div id='sign-up-error' className={errorClass}>
					There was an error! Please try again.
				</div>
				<form id='sign-up-form' onSubmit={newSignUp}>
					<div id='sign-up-header'>
						<img id='sign-up-logo' />
						<div id='sign-up-title'>Sign Up</div>
					</div>
					<div id='sign-up-username-section'>
						<div id='sign-up-username-input-parent'>
							<div id='sign-up-username-symbol'>@</div>
							<input
								id='sign-up-username-input'
								value={username}
								placeholder='username'
								onChange={updateUsername}
							/>
							<div id='sign-up-username-symbol-hidden'>@</div>
						</div>
						<UsernameFooter
							setUsernamePasses={setUsernamePasses}
							username={username}
							isUnique={usernameUnique}
						/>
					</div>
					<div id='sign-up-name-section'>
						<input
							id='sign-up-name-input'
							value={name}
							placeholder='your real name'
							onChange={updateName}
						/>
						<NameFooter setNamePasses={setNamePasses} name={name} />
					</div>
					<div id='sign-up-email-section'>
						<input
							id='sign-up-email-input'
							value={email}
							placeholder='email'
							onChange={updateEmail}
						/>
						<EmailFooter
							setEmailPasses={setEmailPasses}
							email={email}
							isUnique={emailUnique}
						/>
					</div>
					<div id='sign-up-password-section'>
						<input
							id='sign-up-password-input'
							value={password}
							placeholder='password'
							type='password'
							onChange={updatePassword}
						/>
						<PasswordFooter
							setPasswordPasses={setPasswordPasses}
							password={password}
						/>
					</div>
					<button
						type={signUpButtonType}
						id='sign-up-button-submit'
						className={signUpButtonClass}
					>
						Sign Up
					</button>
					<div id='sign-up-login-section'>
						<div id='sign-up-login-message'>Already Signed Up?</div>
						<button
							id='sign-up-button-login'
							onClick={() => navigate('/login')}
						>
							Login
						</button>
					</div>
				</form>
			</div>
			<div />
		</div>
	);
};

export { SignUp };
