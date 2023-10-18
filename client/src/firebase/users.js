// Firebase modules
import { db } from './firebase.js';
import {
	doc,
	collection,
	getDocs,
	getDoc,
	query,
	where,
} from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';

const { user, setUser } = useAuth();

// Register new user
export const newUser = async (username, name, email, password) => {
	const body = {
		email,
		username,
		password,
		name,
		bio: '',
		image: import.meta.env.VITE_DEFAULT_IMG,
	};
	try {
		const response = await fetch(
			import.meta.env.VITE_API_URL + '/create_new_user',
			{ body, method: 'POST' }
		);
		if (response.status == 200) {
			const json = await response.json();
			const newUser = json.user;
			newUser.token = json.token;
			setUser(newUser);
			return;
		} else {
			throw new Error();
		}
	} catch (error) {
		throw error;
	}
};

// Sign in user
export const signInUser = async (email, password) => {
	const body = {
		email,
		password,
	};
	try {
		const response = fetch(import.meta.env.VITE_API_URL + '/sign_in', {
			body,
			method: 'POST',
		});
		if (response.status == 200) {
			const json = await response.json();
			const signedInUser = json.user;
			signedInUser.token = json.token;
			setUser(signedInUser);
			return;
		} else {
			throw new Error();
		}
	} catch (error) {
		throw error;
	}
};

// Sign out user
export const signOutUser = async () => {
	await setUser(null);
};

// Retrieve user
export const findUser = async (userId) => {
	const usersRef = collection(db, 'users');
	const userRef = doc(usersRef, userId);
	const userDoc = await getDoc(userRef);
	const user = {
		id: userDoc.id,
		data: userDoc.data(),
	};
	return user;
};

// Retrieve all users
export const findAllUsers = async () => {
	const usersRef = collection(db, 'users');
	const usersDocs = await getDocs(usersRef);
	let users = [];
	usersDocs.docs.forEach((doc) => {
		const user = {
			id: doc.id,
			data: doc.data(),
		};
		users = [...users, user];
	});
	return users;
};

// Update user
export const updateUser = async (image, name, bio) => {
	if (image) body.image = image;
	if (name) body.name = name;
	if (bio) body.bio = bio;
	try {
		const response = await fetch(
			import.meta.env.VITE_API_URL + '/api/user',
			{
				body,
				method: 'PUT',
				headers: {
					Authorization: `Bearer ${user.token}`,
				},
			}
		);
		if (response.status == 200) {
			const json = await response.json();
			const updatedUser = json.user;
			updatedUser.token = user.token;
			await setUser(updatedUser);
			return;
		} else {
			throw new Error();
		}
	} catch (error) {
		throw error;
	}
};

// Query for username & return true if it exists in db
export const usernameExists = async (username) => {
	const usersRef = collection(db, 'users');
	const userQuery = query(usersRef, where('username', '==', username));
	const userDoc = await getDocs(userQuery);
	if (userDoc.empty != true) {
		return true;
	} else {
		return false;
	}
};

// Query for email & return true if it exists in db
export const emailExists = async (email) => {
	const usersRef = collection(db, 'users');
	const userQuery = query(usersRef, where('email', '==', email));
	const userDoc = await getDocs(userQuery);
	if (userDoc.empty != true) {
		return true;
	} else {
		return false;
	}
};
