import { UserContext } from '../contexts/AuthContext';

// Get signed-in user's info from local storage
export const getLocalUser = () => {
  const user = localStorage.getItem('markstagramUser');
  return user ? JSON.parse(user) : null;
};

// Assign signed-in user's info to local storage
export const setLocalUser = (user: UserContext) => {
  localStorage.setItem('markstagramUser', JSON.stringify(user));
};

// Get signed-in user's token from local storage
export const getToken = () => {
  const user = getLocalUser();
  return user?.token;
};

export const removeLocalUser = () => {
  localStorage.removeItem('markstagramUser');
};
