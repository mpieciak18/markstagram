import { PropsWithChildren, createContext, useContext, useState } from 'react';
import { User, UserStatsCount } from '@markstagram/shared-types';

interface ProfileContextType {
  otherUser: (User & UserStatsCount) | null;
  setOtherUser: React.Dispatch<
    React.SetStateAction<(User & UserStatsCount) | null>
  >;
}

const ProfileContext = createContext<ProfileContextType>({
  otherUser: null,
  setOtherUser: () => null,
});

export const ProfileProvider = ({ children }: PropsWithChildren) => {
  const [otherUser, setOtherUser] = useState<(User & UserStatsCount) | null>(
    null,
  );

  return (
    <ProfileContext.Provider value={{ otherUser, setOtherUser }}>
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfile = () => {
  return useContext(ProfileContext);
};
