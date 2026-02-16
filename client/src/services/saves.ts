import { Post, PostStatsCount, Save } from '@markstagram/shared-types';
import { getToken } from './localstor';

// Add post to a new "save"
export const addSave = async (id: number): Promise<Save | null> => {
  const response = await fetch(import.meta.env.VITE_API_URL + '/api/save', {
    method: 'POST',
    body: JSON.stringify({ id }),
    headers: {
      Authorization: `Bearer ${getToken()}`,
      'Content-Type': 'application/json',
    },
  });
  if (response.status == 200) {
    const json = await response.json();
    return json.save as Save | null;
  } else {
    throw new Error();
  }
};

// Remove saved post
export const removeSave = async (id: number) => {
  const response = await fetch(import.meta.env.VITE_API_URL + '/api/save', {
    method: 'DELETE',
    body: JSON.stringify({ id }),
    headers: {
      Authorization: `Bearer ${getToken()}`,
      'Content-Type': 'application/json',
    },
  });
  if (response.status == 200) {
    const json = await response.json();
    return json.save;
  } else {
    throw new Error();
  }
};

interface SaveRecord extends Save {
  post: Post & PostStatsCount;
}

// Retrieves saved posts
export const getSaves = async (limit: number) => {
  const response = await fetch(
    import.meta.env.VITE_API_URL + '/api/save/user',
    {
      method: 'POST',
      body: JSON.stringify({ limit }),
      headers: {
        Authorization: `Bearer ${getToken()}`,
        'Content-Type': 'application/json',
      },
    },
  );
  if (response.status == 200) {
    const json = await response.json();
    return json.saves as SaveRecord[];
  } else {
    throw new Error();
  }
};

// Check if user saved a certain post
export const saveExists = async (id: number) => {
  const response = await fetch(
    import.meta.env.VITE_API_URL + '/api/save/post',
    {
      method: 'POST',
      body: JSON.stringify({ id }),
      headers: {
        Authorization: `Bearer ${getToken()}`,
        'Content-Type': 'application/json',
      },
    },
  );
  if (response.status == 200) {
    const json = await response.json();
    return json.save;
  } else {
    throw new Error();
  }
};
