import './Home.css';
import Logo from '../../assets/images/ig-logo-2.png';
import { UserCard } from './children/UserCard';

export const HomeLoggedOut = () => {
	return (
		<div id="home-logged-out" className="page">
			<div id="home-container-logged-out">
				<div id="navbar-logo-logged-out">
					<img id="navbar-logo-icon" src={Logo} />
					<div id="navbar-logo-text">Markstagram</div>
				</div>
				<UserCard />
				<div />
			</div>
		</div>
	);
};
