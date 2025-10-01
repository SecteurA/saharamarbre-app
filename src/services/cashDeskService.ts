import axios from 'axios';
import { authService } from './authService';

const API_BASE_URL = 'http://localhost:3001/api';

export interface CashDeskData {
  date: string;
  company: {
    id: number;
    name: string;
    code: string;
  };
  expenses: Array<{
    id: number;
    amount: number;
    description: string;
    created_at: string;
  }>;
  orders: Record<string, Array<{
    id: number;
    human_id: string;
    client_name: string;
    total_amount: number;
    status: string;
    type: string;
    created_at: string;
  }>>;
  orderTypes: string[];
  totals: {
    expenses: number;
    orders: number;
    net: number;
  };
  maxCount: number;
}

export interface CashDeskPreview {
  date: string;
  company_id: number;
  expenses: {
    count: number;
    total: number;
  };
  orders: {
    count: number;
    total: number;
  };
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

export const cashDeskService = {
  // Generate cash desk report
  async generate(date: string, company_id?: number): Promise<{ success: boolean; data?: CashDeskData; message?: string }> {
    try {
      const response = await apiClient.post('/cash-desk/generate', {
        date,
        company_id
      });
      
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error: any) {
      console.error('Error generating cash desk report:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Erreur lors de la génération du rapport'
      };
    }
  },

  // Get cash desk preview
  async getPreview(date: string, company_id?: number): Promise<{ success: boolean; data?: CashDeskPreview; message?: string }> {
    try {
      const params: any = { date };
      if (company_id) {
        params.company_id = company_id;
      }

      const response = await apiClient.get('/cash-desk/preview', { params });
      
      return {
        success: true,
        data: response.data.data
      };
    } catch (error: any) {
      console.error('Error getting cash desk preview:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Erreur lors de la prévisualisation'
      };
    }
  },

  // Download cash desk PDF (placeholder for future implementation)
  async downloadPDF(date: string, company_id?: number): Promise<{ success: boolean; message?: string }> {
    try {
      // For now, just generate the data
      const result = await this.generate(date, company_id);
      
      if (result.success) {
        // TODO: Implement PDF generation or download
        console.log('Cash desk data ready for PDF:', result.data);
        return {
          success: true,
          message: 'PDF généré avec succès (fonctionnalité à implémenter)'
        };
      }
      
      return result;
    } catch (error: any) {
      console.error('Error downloading cash desk PDF:', error);
      return {
        success: false,
        message: 'Erreur lors du téléchargement du PDF'
      };
    }
  }
};