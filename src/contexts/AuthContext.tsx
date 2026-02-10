import { createContext, useContext, useState, ReactNode } from 'react';
import { User, UserRole } from '@/types';

interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  login: (role: UserRole) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoggedIn: false,
  login: () => {},
  logout: () => {},
});

export const useAuth = () => useContext(AuthContext);

const dummyUsers: Record<Exclude<UserRole, 'GUEST'>, User> = {
  STUDENT: {
    id: 'student-1',
    email: 'student@learnhub.com',
    firstName: 'Kebede',
    lastName: 'Mengistu',
    role: 'STUDENT',
    isVerified: true,
    isActive: true,
    language: 'en',
    referralCode: 'KEBEDE2024',
    profileImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    createdAt: '2024-01-01',
    updatedAt: '2024-06-01',
  },
  INSTRUCTOR: {
    id: 'instructor-1',
    email: 'instructor@learnhub.com',
    firstName: 'Abebe',
    lastName: 'Bekele',
    role: 'INSTRUCTOR',
    isVerified: true,
    isActive: true,
    language: 'en',
    profileImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    createdAt: '2023-01-01',
    updatedAt: '2024-01-01',
  },
  ADMIN: {
    id: 'admin-1',
    email: 'admin@learnhub.com',
    firstName: 'Tigist',
    lastName: 'Haile',
    role: 'ADMIN',
    isVerified: true,
    isActive: true,
    language: 'en',
    profileImage: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face',
    createdAt: '2022-01-01',
    updatedAt: '2024-01-01',
  },
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  const login = (role: UserRole) => {
    if (role === 'GUEST') {
      setUser(null);
      return;
    }
    setUser(dummyUsers[role]);
  };

  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, isLoggedIn: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
