// services/userService.ts - User management service
import { MySQLClient } from '../lib/mysql';
import type { 
  User, 
  UsersResponse,
  AuthUser
} from '../types/database.types';

export class UserService {
  // Get all users with pagination
  static async getAll(params?: Record<string, any>): Promise<UsersResponse> {
    return MySQLClient.getPaginated<User>('/users', params);
  }

  // Get all users without pagination (alias for compatibility)
  static async getAllUsers(): Promise<UsersResponse> {
    return this.getAll();
  }

  // Get user by ID
  static async getById(id: number): Promise<User> {
    return MySQLClient.get<User>(`/users/${id}`);
  }

  // Get current authenticated user
  static async getCurrentUser(): Promise<AuthUser> {
    return MySQLClient.get<AuthUser>('/auth/user');
  }

  // Login user
  static async login(email: string, password: string): Promise<{
    user: AuthUser;
    token: string;
  }> {
    return MySQLClient.post('/auth/login', { email, password });
  }

  // Logout user
  static async logout(): Promise<void> {
    return MySQLClient.post<void>('/auth/logout', {});
  }

  // Update user profile
  static async updateProfile(id: number, data: Partial<User>): Promise<User> {
    return MySQLClient.put<User>(`/users/${id}`, data);
  }

  // Change password
  static async changePassword(oldPassword: string, newPassword: string): Promise<void> {
    return MySQLClient.post<void>('/auth/change-password', { 
      old_password: oldPassword, 
      new_password: newPassword 
    });
  }

  // Search users
  static async search(query: string, params?: Record<string, any>): Promise<UsersResponse> {
    return MySQLClient.getPaginated<User>('/users/search', { q: query, ...params });
  }

  // Get user permissions
  static async getUserPermissions(userId: number): Promise<string[]> {
    return MySQLClient.get<string[]>(`/users/${userId}/permissions`);
  }

  // Check if user has permission
  static hasPermission(user: AuthUser | null, permission: string): boolean {
    if (!user || !user.permissions) return false;
    return user.permissions.includes(permission) || user.role === 'Super administrator';
  }

  // Get user roles
  static getUserRoles(): string[] {
    return ['Super administrator', 'Administrator', 'Manager', 'Employee'];
  }
}

// Export default service instance
export const userService = UserService;