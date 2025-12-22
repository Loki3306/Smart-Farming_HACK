import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import {
  User,
  SignupPayload,
  LoginPayload,
  AuthService,
} from "../services/AuthService";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isDemoUser: boolean;
  isLoading: boolean;
  error: string | null;

  // Auth methods
  signup: (payload: SignupPayload) => Promise<void>;
  login: (payload: LoginPayload) => Promise<void>;
  logout: () => Promise<void>;
  skipLoginAsDemo: () => void;
  clearError: () => void;
  markOnboardingComplete: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthContextProviderProps {
  children: React.ReactNode;
}

export const AuthContextProvider: React.FC<AuthContextProviderProps> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isDemoUser, setIsDemoUser] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize auth state on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setIsLoading(true);
        const currentUser = await AuthService.getCurrentUser();
        if (currentUser) {
          console.log('[AuthContext] User restored:', currentUser.fullName);
          setUser(currentUser);
          setIsDemoUser(currentUser.isDemoUser || false);
        } else {
          console.log('[AuthContext] No user session found');
          setUser(null);
        }
      } catch (err) {
        console.error("[AuthContext] Failed to initialize auth:", err);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const signup = useCallback(async (payload: SignupPayload) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await AuthService.signup(payload);
      setUser(response.user);
      setIsDemoUser(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Signup failed";
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (payload: LoginPayload) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await AuthService.login(payload);
      console.log('[AuthContext] Login response user:', response.user);
      console.log('[AuthContext] hasCompletedOnboarding:', response.user.hasCompletedOnboarding);
      setUser(response.user);
      setIsDemoUser(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Login failed";
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      await AuthService.logout();
      setUser(null);
      setIsDemoUser(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Logout failed";
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const skipLoginAsDemo = useCallback(() => {
    const demoUser = AuthService.getDemoUser();
    setUser(demoUser);
    setIsDemoUser(true);
    setError(null);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const markOnboardingComplete = useCallback(() => {
    if (user) {
      const updatedUser = {
        ...user,
        hasCompletedOnboarding: true,
      };
      setUser(updatedUser);
      
      // Persist to localStorage for mock users
      const token = localStorage.getItem('auth_token');
      if (token) {
        // Store updated user status AND update the cached user object
        localStorage.setItem('onboarding_completed', 'true');
        localStorage.setItem('current_user', JSON.stringify(updatedUser));
      }
    }
  }, [user]);

  const isAuthenticated = user !== null;

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isDemoUser,
    isLoading,
    error,
    signup,
    login,
    logout,
    skipLoginAsDemo,
    clearError,
    markOnboardingComplete,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthContextProvider");
  }
  return context;
};
