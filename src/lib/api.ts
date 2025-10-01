import { config } from '../config'

// Base API configuration
const API_BASE_URL = config.api.baseUrl;

// Types for API client
interface ApiResponse<T = any> extends Record<string, any> {
  data?: T;
  pagination?: any;
  error?: string;
}

interface RequestOptions extends RequestInit {
  headers?: Record<string, string>;
}

// Generic API client
class ApiClient {
  static async request<T = any>(endpoint: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    console.log(`Making API request to: ${url}`);
    
    const defaultOptions: RequestOptions = {
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const config = { ...defaultOptions, ...options };
    
    // Merge headers properly
    config.headers = {
      ...defaultOptions.headers,
      ...options.headers,
    };
    
    // Add auth token if available
    const token = localStorage.getItem('auth_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    try {
      console.log('Fetch config:', { url, method: config.method || 'GET', headers: config.headers });
      
      const response = await fetch(url, config);
      
      console.log('Response status:', response.status, response.statusText);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Network error' }));
        console.error('API error response:', errorData);
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('API response data:', data);
      return data; // Return data directly, not wrapped
    } catch (error) {
      console.error('API request failed:', error);
      console.error('Error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error; // Throw error instead of returning wrapped response
    }
  }

  static async get<T = any>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  static async post<T = any>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async put<T = any>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  static async delete<T = any>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export default ApiClient;