import { createContext, useContext, useState, PropsWithChildren } from 'react';
import { User, UserStatsCount } from '@markstagram/shared-types';

export interface UserContext extends User, UserStatsCount {
  token: string;
}

interface AuthContextType {
  user: UserContext | null;
  setUser: React.Dispatch<React.SetStateAction<UserContext | null>>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  setUser: () => null,
});

export const AuthProvider = ({ children }: PropsWithChildren) => {
  const [user, setUser] = useState<UserContext | null>(null);

  return (
    <AuthContext.Provider value={{ user, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
