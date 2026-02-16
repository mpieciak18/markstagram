import { getToken } from './localstor';
import { compressFile } from './compress';
import { UserContext } from '../contexts/AuthContext';
import { User, UserStatsCount } from '@markstagram/shared-types';

interface NotUnique {
  notUnique: string[];
}

// Register new user
export const createUser = async (
  username: string,
  name: string,
  email: string,
  password: string,
): Promise<UserContext | NotUnique> => {
  const body = JSON.stringify({
    email,
    username,
    password,
    name,
    bio: '',
    image: import.meta.env.VITE_DEFAULT_IMG,
  });
  const response = await fetch(
    import.meta.env.VITE_API_URL + '/create_new_user',
    {
      body,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
  );
  if (response.status == 200) {
    const json = await response.json();
    const newUser = json.user;
    newUser.token = json.token;
    return newUser;
  } else if (response.status == 400) {
    const json = await response.json();
    if (!json.notUnique) {
      throw new Error();
    } else {
      // If there is a unique constraint error in the database,
      // here is how the response is handled on the back-end:
      // ...
      // const notUnique = [];
      // if (e.meta?.target) {
      // 	e.meta.target.forEach((field) => notUnique.push(field));
      // }
      // res.status(400);
      // res.json({ notUnique });
      // ...
      const result: NotUnique = json;
      return result;
    }
  } else {
    throw new Error();
  }
};

// Sign in user
export const signInUser = async (
  email: string,
  password: string,
): Promise<UserContext> => {
  const body = JSON.stringify({
    email,
    password,
  });
  const response = await fetch(import.meta.env.VITE_API_URL + '/sign_in', {
    body,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (response.status == 200) {
    const json = await response.json();
    const signedInUser = json.user as UserContext;
    signedInUser.token = json.token;
    return signedInUser;
  } else {
    throw new Error();
  }
};

// Retrieve user
export const findUser = async (id: number) => {
  const response = await fetch(
    import.meta.env.VITE_API_URL + '/api/user/single',
    {
      body: JSON.stringify({ id: Number(id) }),
      method: 'POST',
      headers: {
        Authorization: `Bearer ${getToken()}`,
        'Content-Type': 'application/json',
      },
    },
  );
  if (response.status == 200) {
    const json = await response.json();
    return json.user as User & UserStatsCount;
  } else {
    throw new Error();
  }
};

// Searches users by name
export const searchUsers = async (name: string) => {
  const response = await fetch(
    import.meta.env.VITE_API_URL + '/api/user/search',
    {
      body: JSON.stringify({ name }),
      method: 'POST',
      headers: {
        Authorization: `Bearer ${getToken()}`,
        'Content-Type': 'application/json',
      },
    },
  );
  if (response.status == 200) {
    const json = await response.json();
    return json.users as User[];
  } else {
    throw new Error();
  }
};

// Updates the user's name, bio, and/or image
export const updateUser = async (
  name: string | null,
  bio: string | null,
  image: File | null,
): Promise<UserContext> => {
  const body = new FormData();
  if (name) body.append('name', name);
  if (bio) body.append('bio', bio);
  if (image) {
    await compressFile(image).then((newImage) => {
      body.append('file', newImage);
    });
  }
  const response = await fetch(import.meta.env.VITE_API_URL + '/api/user', {
    body,
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${getToken()}`,
    },
  });
  if (response.status == 200) {
    const json = await response.json();
    const prevUserState = json.user as UserContext;
    const updatedUser = {
      ...prevUserState,
      _count: { ...prevUserState._count },
      token: getToken(),
    };
    return updatedUser;
  } else {
    throw new Error();
  }
};

// Query for username & return true if it is not taken
// export const isUsernameUnique = async (username) => {
// 	const response = await fetch(
// 		import.meta.env.VITE_API_URL + '/api/user/is-username-unique',
// 		{
// 			body: JSON.stringify({ username }),
// 			method: 'POST',
// 			headers: {
// 				Authorization: `Bearer ${getToken()}`,
// 				'Content-Type': 'application/json',
// 			},
// 		}
// 	);
// 	if (response.status == 200) {
// 		const json = await response.json();
// 		const { isUsernameUnique } = json;
// 		return isUsernameUnique;
// 	} else {
// 		throw new Error();
// 	}
// };

// Query for email & return true if it is not taken
// export const isEmailUnique = async (email) => {
// 	const response = await fetch(
// 		import.meta.env.VITE_API_URL + '/api/user/is-email-unique',
// 		{
// 			body: JSON.stringify({ email }),
// 			method: 'POST',
// 			headers: {
// 				Authorization: `Bearer ${getToken()}`,
// 				'Content-Type': 'application/json',
// 			},
// 		}
// 	);
// 	if (response.status == 200) {
// 		const json = await response.json();
// 		const { isEmailUnique } = json;
// 		return isEmailUnique;
// 	} else {
// 		throw new Error();
// 	}
// };
