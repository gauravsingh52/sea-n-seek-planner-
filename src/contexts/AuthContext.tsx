import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import Cookies from 'js-cookie';

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Create a mock anonymous user with persistent ID
const createAnonymousUser = (): User => {
  let userId = Cookies.get('anonUserId');
  if (!userId) {
    userId = `anon-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    Cookies.set('anonUserId', userId, { expires: 7 }); // Set cookie to expire in 7 days
  }

  return {
    id: userId,
    aud: 'authenticated',
    role: 'authenticated',
    email: `${userId}@anonymous.local`,
    email_confirmed_at: new Date().toISOString(),
    phone: null,
    confirmed_at: new Date().toISOString(),
    last_sign_in_at: new Date().toISOString(),
    app_metadata: { provider: 'anonymous' },
    user_metadata: { is_anonymous: true },
    identities: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  } as User;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initialize anonymous user
    setUser(createAnonymousUser());
    setLoading(false);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
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
