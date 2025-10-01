import axios from 'axios';
import { authService } from './authService';

const API_BASE_URL = 'http://localhost:3001/api';

export interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  totalClients: number;
  totalProducts: number;
  monthlyGrowth: number;
}

export interface RecentOrder {
  id: number;
  human_id: string;
  client_name: string;
  total_amount: number;
  status: string;
  created_at: string;
}

export interface OrderStatusData {
  name: string;
  value: number;
}

export interface RecentActivity {
  id: string;
  type: 'order' | 'client' | 'product' | 'payment';
  title: string;
  subtitle: string;
  time: string;
  status?: string;
}

// Configure axios to include auth token
const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

apiClient.interceptors.request.use((config) => {
  const token = authService.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const dashboardService = {
  // Get dashboard statistics
  async getStats(): Promise<{ success: boolean; data?: DashboardStats; message?: string }> {
    try {
      const response = await apiClient.get('/dashboard/stats');
      return {
        success: true,
        data: response.data.data
      };
    } catch (error: any) {
      console.error('Error fetching dashboard stats:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Erreur lors de la récupération des statistiques'
      };
    }
  },

  // Get recent orders
  async getRecentOrders(limit: number = 5): Promise<{ success: boolean; data?: RecentOrder[]; message?: string }> {
    try {
      const response = await apiClient.get(`/dashboard/recent-orders?limit=${limit}`);
      return {
        success: true,
        data: response.data.data
      };
    } catch (error: any) {
      console.error('Error fetching recent orders:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Erreur lors de la récupération des commandes récentes'
      };
    }
  },

  // Get order status distribution
  async getOrderStatusData(): Promise<{ success: boolean; data?: OrderStatusData[]; message?: string }> {
    try {
      const response = await apiClient.get('/dashboard/order-status');
      return {
        success: true,
        data: response.data.data
      };
    } catch (error: any) {
      console.error('Error fetching order status data:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Erreur lors de la récupération du statut des commandes'
      };
    }
  },

  // Get recent activities
  async getRecentActivities(limit: number = 10): Promise<{ success: boolean; data?: RecentActivity[]; message?: string }> {
    try {
      const response = await apiClient.get(`/dashboard/recent-activities?limit=${limit}`);
      return {
        success: true,
        data: response.data.data
      };
    } catch (error: any) {
      console.error('Error fetching recent activities:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Erreur lors de la récupération des activités récentes'
      };
    }
  }
};