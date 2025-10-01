import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';

// Types for authentication
export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role_name: string;
  company_id?: number;
  company_name?: string;
  email_verified_at?: string;
  created_at: string;
  updated_at: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    token: string;
    expires_in: string;
  };
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data?: {
    user: User;
  };
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
  new_password_confirmation: string;
}

class AuthService {
  private tokenKey = 'auth_token';
  private userKey = 'auth_user';

  // Get stored token
  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  // Get stored user
  getUser(): User | null {
    const userStr = localStorage.getItem(this.userKey);
    return userStr ? JSON.parse(userStr) : null;
  }

  // Set authentication data
  private setAuthData(token: string, user: User): void {
    localStorage.setItem(this.tokenKey, token);
    localStorage.setItem(this.userKey, JSON.stringify(user));
  }

  // Clear authentication data
  private clearAuthData(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    const token = this.getToken();
    const user = this.getUser();
    return !!(token && user);
  }

  // Get authorization headers
  getAuthHeaders(): Record<string, string> {
    const token = this.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  // Login user
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    try {
      const response = await axios.post<LoginResponse>(
        `${API_BASE_URL}/auth/login`,
        credentials,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.success) {
        const { token, user } = response.data.data;
        this.setAuthData(token, user);
      }

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return error.response.data as LoginResponse;
      }
      return {
        success: false,
        message: 'Erreur de connexion réseau',
        data: {} as any
      };
    }
  }

  // Logout user
  async logout(): Promise<void> {
    try {
      const token = this.getToken();
      if (token) {
        await axios.post(
          `${API_BASE_URL}/auth/logout`,
          {},
          {
            headers: this.getAuthHeaders(),
          }
        );
      }
    } catch (error) {
      console.warn('Erreur lors de la déconnexion:', error);
    } finally {
      this.clearAuthData();
    }
  }

  // Get current user from server
  async getCurrentUser(): Promise<AuthResponse> {
    try {
      const response = await axios.get<AuthResponse>(
        `${API_BASE_URL}/auth/me`,
        {
          headers: this.getAuthHeaders(),
        }
      );

      if (response.data.success && response.data.data) {
        // Update stored user data
        localStorage.setItem(this.userKey, JSON.stringify(response.data.data.user));
      }

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        // If unauthorized, clear stored data
        if (error.response.status === 401 || error.response.status === 403) {
          this.clearAuthData();
        }
        return error.response.data as AuthResponse;
      }
      this.clearAuthData();
      return {
        success: false,
        message: 'Erreur lors de la récupération des données utilisateur'
      };
    }
  }

  // Verify token validity
  async verifyToken(): Promise<boolean> {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/auth/verify`,
        {},
        {
          headers: this.getAuthHeaders(),
        }
      );

      return response.data.success;
    } catch (error) {
      this.clearAuthData();
      return false;
    }
  }

  // Change password
  async changePassword(passwordData: ChangePasswordRequest): Promise<AuthResponse> {
    try {
      const response = await axios.put<AuthResponse>(
        `${API_BASE_URL}/auth/change-password`,
        passwordData,
        {
          headers: {
            ...this.getAuthHeaders(),
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return error.response.data as AuthResponse;
      }
      return {
        success: false,
        message: 'Erreur lors du changement de mot de passe'
      };
    }
  }

  // Refresh user data
  async refreshUser(): Promise<User | null> {
    try {
      const response = await this.getCurrentUser();
      if (response.success && response.data) {
        return response.data.user;
      }
      return null;
    } catch (error) {
      console.error('Erreur lors de la mise à jour des données utilisateur:', error);
      return null;
    }
  }

  // Check user role permissions
  hasRole(role: string): boolean {
    const user = this.getUser();
    if (!user) return false;
    
    const userRole = user.role_name.toLowerCase();
    const requiredRole = role.toLowerCase();
    
    // Role hierarchy: Super administrator > Administrator > Manager > User
    const roleHierarchy = {
      'super administrator': 4,
      'administrator': 3,
      'manager': 2,
      'user': 1,
    };

    const userLevel = roleHierarchy[userRole as keyof typeof roleHierarchy] || 0;
    const requiredLevel = roleHierarchy[requiredRole as keyof typeof roleHierarchy] || 0;
    
    return userLevel >= requiredLevel;
  }

  // Check if user is administrator or higher
  isAdmin(): boolean {
    return this.hasRole('administrator');
  }

  // Check if user is super administrator
  isSuperAdmin(): boolean {
    return this.hasRole('super administrator');
  }

  // Check if user is manager or higher
  isManager(): boolean {
    return this.hasRole('manager');
  }
}

// Export singleton instance
export const authService = new AuthService();
export default authService;