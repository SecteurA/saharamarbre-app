// lib/mysql.ts - MySQL/API client wrapper
import ApiClient from './api';
import type { PaginatedResponse } from '../types/database.types';

export class MySQLClient {
  // Generic methods for API interaction
  static async get<T>(endpoint: string): Promise<T> {
    const response = await ApiClient.get<T>(endpoint);
    if (!response.success) {
      throw new Error(response.error || 'API request failed');
    }
    return response.data!;
  }

  static async post<T>(endpoint: string, data: any): Promise<T> {
    const response = await ApiClient.post<T>(endpoint, data);
    if (!response.success) {
      throw new Error(response.error || 'API request failed');
    }
    return response.data!;
  }

  static async put<T>(endpoint: string, data: any): Promise<T> {
    const response = await ApiClient.put<T>(endpoint, data);
    if (!response.success) {
      throw new Error(response.error || 'API request failed');
    }
    return response.data!;
  }

  static async delete<T>(endpoint: string): Promise<T> {
    const response = await ApiClient.delete<T>(endpoint);
    if (!response.success) {
      throw new Error(response.error || 'API request failed');
    }
    return response.data!;
  }

  // Paginated queries
  static async getPaginated<T>(endpoint: string, params?: Record<string, any>): Promise<PaginatedResponse<T>> {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
    const result = await this.get<PaginatedResponse<T>>(`${endpoint}${queryString}`);
    return result!;
  }
}

// Export as default for backward compatibility where needed
export default MySQLClient;