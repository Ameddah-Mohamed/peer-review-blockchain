import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { authService } from '../services/authService';
import { MOCK_USERS } from '../services/mockData';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  role: UserRole | null;
  login: (email: string, pass: string) => Promise<User>;
  register: (data: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
    affiliation?: string;
  }) => Promise<User>;
  logout: () => void;
  switchDemoUser: (role: UserRole) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'peer_review_auth_token';
const USER_KEY = 'peer_review_auth_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem(USER_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem(TOKEN_KEY) || null;
  });

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_KEY);
    }
  }, [user]);

  useEffect(() => {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  }, [token]);

  const login = async (email: string, pass: string): Promise<User> => {
    setIsLoading(true);
    try {
      const { token: receivedToken, user: receivedUser } = await authService.login(email, pass);
      setToken(receivedToken);
      setUser(receivedUser);
      return receivedUser;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
    affiliation?: string;
  }): Promise<User> => {
    setIsLoading(true);
    try {
      const { token: receivedToken, user: receivedUser } = await authService.register(data);
      setToken(receivedToken);
      setUser(receivedUser);
      return receivedUser;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  };

  const switchDemoUser = async (targetRole: UserRole): Promise<void> => {
    const demoCreds: Record<UserRole, { email: string; pass: string }> = {
      admin: { email: 'admin@conference.edu', pass: 'AdminPassword123!' },
      reviewer: { email: 'prof.smith@university.edu', pass: 'ReviewerPassword123!' },
      author: { email: 'alice.student@university.edu', pass: 'AuthorPassword123!' },
    };

    const cred = demoCreds[targetRole];
    if (cred) {
      setIsLoading(true);
      try {
        const { token: realToken, user: realUser } = await authService.login(cred.email, cred.pass);
        setToken(realToken);
        setUser(realUser);
      } catch (err) {
        console.warn('Real demo login failed, falling back to mock user representation:', err);
        const demoUser = MOCK_USERS.find((u) => u.role === targetRole);
        if (demoUser) {
          setUser(demoUser);
          setToken(`demo_token_${demoUser.id}`);
        }
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!user,
        role: user ? user.role : null,
        login,
        register,
        logout,
        switchDemoUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
