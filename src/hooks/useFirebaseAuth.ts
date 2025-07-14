import { useState, useEffect } from 'react';
import { 
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  UserCredential
} from 'firebase/auth';
import { auth, googleProvider } from '../config/firebase';

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

export const useFirebaseAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null
  });

  const signInWithEmailPassword = async (email: string, password: string): Promise<UserCredential | null> => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      const result = await signInWithEmailAndPassword(auth, email, password);
      return result;
    } catch (error: any) {
      setAuthState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error.message || 'Failed to sign in with email/password' 
      }));
      return null;
    }
  };

  const registerWithEmailPassword = async (name: string, email: string, password: string): Promise<UserCredential | null> => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update profile with name
      if (result.user) {
        await updateProfile(result.user, { displayName: name });
      }
      
      return result;
    } catch (error: any) {
      setAuthState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error.message || 'Failed to create account' 
      }));
      return null;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setAuthState({
        user,
        loading: false,
        error: null
      });
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async (): Promise<UserCredential | null> => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      const result = await signInWithPopup(auth, googleProvider);
      return result;
    } catch (error: any) {
      setAuthState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error.message || 'Failed to sign in with Google' 
      }));
      return null;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await signOut(auth);
    } catch (error: any) {
      setAuthState(prev => ({ 
        ...prev, 
        error: error.message || 'Failed to sign out' 
      }));
    }
  };

  const clearError = () => {
    setAuthState(prev => ({ ...prev, error: null }));
  };

  return {
    user: authState.user,
    loading: authState.loading,
    error: authState.error,
    signInWithEmailPassword,
    registerWithEmailPassword,
    signInWithGoogle,
    logout,
    clearError,
    isAuthenticated: !!authState.user
  };
};