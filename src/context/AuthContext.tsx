
import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  auth, 
  signInAnonymous, 
  onAuthChange, 
  createUserProfile, 
  generateRandomUsername, 
  generateRandomAvatarColor, 
  updateUserStatus, 
  signOut 
} from '../firebase/firebase';

type User = {
  uid: string;
  username: string;
  avatarColor: string;
  isAnonymous: boolean;
};

type AuthContextType = {
  currentUser: User | null;
  loading: boolean;
  error: string | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  loading: true,
  error: null,
  login: async () => {},
  logout: async () => {}
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthChange(async (user) => {
      if (user) {
        // Set user online status when the app starts
        try {
          await updateUserStatus(user.uid, true);
        } catch (error) {
          console.error("Error updating user status:", error);
        }

        // Get or create user profile
        setCurrentUser({
          uid: user.uid,
          username: localStorage.getItem(`username_${user.uid}`) || generateRandomUsername(),
          avatarColor: localStorage.getItem(`avatarColor_${user.uid}`) || generateRandomAvatarColor(),
          isAnonymous: user.isAnonymous
        });
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    // Set up beforeunload event to mark user as offline when closing the app
    window.addEventListener('beforeunload', async () => {
      const user = auth.currentUser;
      if (user) {
        try {
          await updateUserStatus(user.uid, false);
        } catch (error) {
          console.error("Error updating user status on unload:", error);
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const login = async () => {
    try {
      setLoading(true);
      setError(null);
      const user = await signInAnonymous();
      
      const username = generateRandomUsername();
      const avatarColor = generateRandomAvatarColor();
      
      // Save username and avatar color to localStorage for persistence
      localStorage.setItem(`username_${user.uid}`, username);
      localStorage.setItem(`avatarColor_${user.uid}`, avatarColor);
      
      // Create user profile in the database
      await createUserProfile(user.uid, username, avatarColor);
      
      setCurrentUser({
        uid: user.uid,
        username,
        avatarColor,
        isAnonymous: true
      });
    } catch (error) {
      console.error("Login error:", error);
      setError('Failed to sign in anonymously');
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      const user = auth.currentUser;
      if (user) {
        await updateUserStatus(user.uid, false);
      }
      await signOut();
      setCurrentUser(null);
    } catch (error) {
      console.error("Logout error:", error);
      setError('Failed to sign out');
    } finally {
      setLoading(false);
    }
  };

  const value = {
    currentUser,
    loading,
    error,
    login,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
