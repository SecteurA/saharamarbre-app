import React, { createContext, useContext, useEffect, useState } from 'react';
import { authService, type User } from '../services/authService';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  hasRole: (role: string) => boolean;
  isAdmin: () => boolean;
  isSuperAdmin: () => boolean;
  isManager: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize authentication state
  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    setIsLoading(true);
    
    try {
      // Check if we have a stored token
      if (authService.isAuthenticated()) {
        const storedUser = authService.getUser();
        
        if (storedUser) {
          // Verify token is still valid
          const isValid = await authService.verifyToken();
          
          if (isValid) {
            // Refresh user data from server
            const response = await authService.getCurrentUser();
            
            if (response.success && response.data) {
              setUser(response.data.user);
              setIsAuthenticated(true);
            } else {
              // Invalid or expired session
              await handleLogout();
            }
          } else {
            // Invalid token
            await handleLogout();
          }
        } else {
          // No stored user
          await handleLogout();
        }
      } else {
        // No authentication data
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      await handleLogout();
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const response = await authService.login({ email, password });
      
      if (response.success) {
        setUser(response.data.user);
        setIsAuthenticated(true);
        return { success: true };
      } else {
        return { success: false, message: response.message };
      }
    } catch (error) {
      console.error('Login error in context:', error);
      return { 
        success: false, 
        message: 'Une erreur inattendue s\'est produite lors de la connexion' 
      };
    }
  };

  const logout = async (): Promise<void> => {
    await handleLogout();
  };

  const handleLogout = async (): Promise<void> => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  const refreshUser = async (): Promise<void> => {
    try {
      if (isAuthenticated) {
        const updatedUser = await authService.refreshUser();
        if (updatedUser) {
          setUser(updatedUser);
        }
      }
    } catch (error) {
      console.error('Refresh user error:', error);
    }
  };

  const hasRole = (role: string): boolean => {
    return authService.hasRole(role);
  };

  const isAdmin = (): boolean => {
    return authService.isAdmin();
  };

  const isSuperAdmin = (): boolean => {
    return authService.isSuperAdmin();
  };

  const isManager = (): boolean => {
    return authService.isManager();
  };

  const contextValue: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    refreshUser,
    hasRole,
    isAdmin,
    isSuperAdmin,
    isManager,
  };

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};

export default AuthContext;