import { useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ConvoPage } from './components/Conversation/Conversation';
import { Home } from './components/Home/Home';
import { HomeLoggedOut } from './components/Home/HomeLoggedOut';
import { Login } from './components/Login/Login';
import { Messages } from './components/Messages/Messages';
import { PostPage } from './components/Post/Post';
import { Profile } from './components/Profile/Profile';
import { Saved } from './components/SavedPosts/Saved';
import { Settings } from './components/Settings/Settings';
import { SignUp } from './components/SignUp/SignUp';
import { useAuth } from './contexts/AuthContext';
import { getLocalUser } from './services/localstor';
import './components/other/other.css';

const App = () => {
	// Init user context
	const { user, setUser } = useAuth();

	// Init loading state
	const [isLoading, setIsLoading] = useState(true);

	// Update user (with anything stored locally) and loading states on mount
	useEffect(() => {
		const localUser = getLocalUser();
		if (localUser && !user && setUser) {
			setUser(localUser);
			setIsLoading(false);
		} else {
			setIsLoading(false);
		}
	}, []);

	// return routes;
	return isLoading === false && user ? (
		<BrowserRouter>
			<Routes>
				<Route path="/" element={<Home />} />
				<Route path="/messages" element={<Messages />} />
				<Route path="/:postOwnerId/:postId" element={<PostPage />} />
				<Route path="/:otherUserId" element={<Profile />} />
				<Route path="/messages/:otherUserId" element={<ConvoPage />} />
				<Route path="/saved" element={<Saved />} />
				<Route path="/settings" element={<Settings />} />
				<Route path="/signup" element={<Navigate to="/" replace />} />
				<Route path="/login" element={<Navigate to="/" replace />} />
			</Routes>
		</BrowserRouter>
	) : isLoading === false && !user ? (
		<BrowserRouter>
			<Routes>
				<Route path="/signup" element={<SignUp />} />
				<Route path="/login" element={<Login />} />
				<Route path="*" element={<HomeLoggedOut />} />
			</Routes>
		</BrowserRouter>
	) : null;
};

export { App };
