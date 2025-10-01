import ApiClient from '../lib/api';

export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role: string;
  company_id?: number;
  company_name?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateUserData {
  name: string;
  email: string;
  phone?: string;
  role: string;
  company_id?: number;
  password: string;
}

export interface UpdateUserData extends Partial<Omit<CreateUserData, 'password'>> {
  password?: string;
}

export async function getUsers(): Promise<User[]> {
  try {
    console.log('🔍 Fetching users from API...');
    // Add timestamp to avoid caching issues
    const timestamp = Date.now();
    const response = await ApiClient.get(`/users?t=${timestamp}`);
    console.log('📡 Full API Response:', response);
    console.log('📊 Response data:', response.data);
    console.log('📊 Response success:', response.success);
    
    // Check if this is the expected format {success: true, data: [...]}
    if (response.success && response.data) {
      console.log('✅ API returned success=true with data');
      const users = response.data || [];
      console.log('👥 Users found:', users.length);
      console.log('🎯 First user:', users[0]?.name || 'None');
      return users;
    } else {
      console.log('❌ Unexpected API response format');
      return [];
    }
  } catch (error: any) {
    console.error('❌ Failed to fetch users:', error);
    console.error('📊 Error response:', error.response?.data);
    // Return empty array instead of throwing to prevent page crash
    return [];
  }
}

export async function getUserById(id: number): Promise<User> {
  try {
    const response = await ApiClient.get(`/users/${id}`);
    return response.data?.data;
  } catch (error: any) {
    console.error('Failed to fetch user:', error);
    throw new Error(error.response?.data?.error || 'Failed to fetch user');
  }
}

export async function createUser(userData: CreateUserData): Promise<User> {
  try {
    const response = await ApiClient.post('/users', userData);
    return response.data?.data;
  } catch (error: any) {
    console.error('Failed to create user:', error);
    throw new Error(error.response?.data?.error || 'Failed to create user');
  }
}

export async function updateUser(id: number, userData: UpdateUserData): Promise<User> {
  try {
    const response = await ApiClient.put(`/users/${id}`, userData);
    return response.data?.data;
  } catch (error: any) {
    console.error('Failed to update user:', error);
    throw new Error(error.response?.data?.error || 'Failed to update user');
  }
}

export async function deleteUser(id: number): Promise<void> {
  try {
    await ApiClient.delete(`/users/${id}`);
  } catch (error: any) {
    console.error('Failed to delete user:', error);
    throw new Error(error.response?.data?.error || 'Failed to delete user');
  }
}

export async function searchUsers(query: string): Promise<User[]> {
  try {
    const response = await ApiClient.get(`/users/search?q=${encodeURIComponent(query)}`);
    return response.data?.data || [];
  } catch (error: any) {
    console.error('Failed to search users:', error);
    throw new Error(error.response?.data?.error || 'Failed to search users');
  }
}

// Create a class-based service to match the structure used in some components
export class UserService {
  static async getAll() {
    return getUsers();
  }

  static async getById(id: number) {
    return getUserById(id);
  }

  static async create(data: CreateUserData) {
    return createUser(data);
  }

  static async update(id: number, data: UpdateUserData) {
    return updateUser(id, data);
  }

  static async delete(id: number) {
    return deleteUser(id);
  }

  static async search(query: string) {
    return searchUsers(query);
  }
}

// Export both named and default exports to match existing usage patterns
export default UserService;