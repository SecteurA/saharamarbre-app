// API Response Types
interface ApiResponse<T> {
  data: T | null;
  success: boolean;
  error?: string;
}

interface PaginatedResponse<T> extends ApiResponse<T> {
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

// Reception Slip Types
interface ReceptionSlip {
  id: number;
  human_id: string;
  client_id: number;
  company_id: number | null;
  salesperson: number | null;
  driver: string | null;
  plate: string | null;
  worksite: string | null;
  order_ref: string | null;
  is_free: boolean;
  tax_rate: number;
  template: string | null;
  taxable_amount: number;
  total_taxes: number;
  total_amount: number;
  paid_amount: number;
  remaining_amount: number;
  notes: string | null;
  status: string;
  payment_status: string;
  type: string;
  created_at: string;
  updated_at: string;
  // Relations
  client?: {
    id: number;
    name: string;  // Changed from 'nom' to 'name' to match Laravel
    phone?: string;
    email?: string;
    address?: string;
  } | null;
  company?: {
    id: number;
    name: string;
    address?: string;
  } | null;
  user?: {
    id: number;
    name: string;
  } | null;
  items?: any[];
  items_count?: number;
  total_items_quantity?: number;
}

interface ReceptionSlipFormData {
  client_id: number;
  company_id?: number | null;
  salesperson?: number | null;
  driver?: string | null;
  plate?: string | null;
  worksite?: string | null;
  order_ref?: string | null;
  is_free?: boolean;
  tax_rate?: number;
  template?: string | null;
  notes?: string | null;
  status?: string;
  payment_status?: string;
  items?: any[];
}

interface ReceptionSlipStats {
  total: number;
  pending: number;
  confirmed: number;
  processing: number;
  completed: number;
  cancelled: number;
  unpaid: number;
  paid: number;
  partial: number;
  totalAmount: number;
  pendingAmount: number;
  completedAmount: number;
  avgAmount: number;
  maxAmount: number;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

class ReceptionSlipServiceApi {
  private baseUrl = `${API_BASE_URL}/reception-slips`;

  // Get paginated reception slips with search and filters
  // Get reception slips with pagination (simplified to match backend)
  async getReceptionSlips(
    page: number = 1,
    limit: number = 20,
    search: string = ''
  ): Promise<PaginatedResponse<ReceptionSlip[]>> {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        search
      });

      const response = await fetch(`${this.baseUrl}?${params}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch reception slips');
      }

      return {
        data: data.data,
        pagination: data.pagination,
        success: true
      };
    } catch (error) {
      console.error('Error fetching reception slips:', error);
      return {
        data: [],
        pagination: {
          currentPage: page,
          totalPages: 0,
          totalCount: 0,
          hasNextPage: false,
          hasPrevPage: false
        },
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  // Get single reception slip by ID
  async getReceptionSlip(id: string | number): Promise<ApiResponse<ReceptionSlip>> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Reception slip not found');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch reception slip');
      }

      return {
        data: data.data,
        success: true
      };
    } catch (error) {
      console.error('Error fetching reception slip:', error);
      return {
        data: null,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      } as ApiResponse<ReceptionSlip>;
    }
  }

  // Create new reception slip
  async createReceptionSlip(receptionSlipData: ReceptionSlipFormData): Promise<ApiResponse<ReceptionSlip>> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(receptionSlipData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to create reception slip');
      }

      return {
        data: data.data,
        success: true
      };
    } catch (error) {
      console.error('Error creating reception slip:', error);
      return {
        data: null,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      } as ApiResponse<ReceptionSlip>;
    }
  }

  // Update existing reception slip
  async updateReceptionSlip(id: string | number, receptionSlipData: Partial<ReceptionSlipFormData>): Promise<ApiResponse<ReceptionSlip>> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(receptionSlipData),
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Reception slip not found');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to update reception slip');
      }

      return {
        data: data.data,
        success: true
      };
    } catch (error) {
      console.error('Error updating reception slip:', error);
      return {
        data: null,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      } as ApiResponse<ReceptionSlip>;
    }
  }

  // Delete reception slip
  async deleteReceptionSlip(id: string | number): Promise<ApiResponse<boolean>> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Reception slip not found');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to delete reception slip');
      }

      return {
        data: true,
        success: true
      };
    } catch (error) {
      console.error('Error deleting reception slip:', error);
      return {
        data: false,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  // Search reception slips
  // Search reception slips
  async searchReceptionSlips(
    term: string,
    page: number = 1,
    limit: number = 20
  ): Promise<ApiResponse<ReceptionSlip[]>> {
    try {
      const params = new URLSearchParams({
        q: term,
        page: page.toString(),
        limit: limit.toString()
      });

      const response = await fetch(`${this.baseUrl}/search?${params}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to search reception slips');
      }

      return {
        data: data.data,
        success: true
      };
    } catch (error) {
      console.error('Error searching reception slips:', error);
      return {
        data: [],
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  // Get reception slip statistics
  async getReceptionSlipStats(): Promise<ApiResponse<ReceptionSlipStats>> {
    try {
      const response = await fetch(`${this.baseUrl}/stats/summary`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch reception slip statistics');
      }

      return {
        data: data.data,
        success: true
      };
    } catch (error) {
      console.error('Error fetching reception slip statistics:', error);
      return {
        data: null,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      } as ApiResponse<ReceptionSlipStats>;
    }
  }

  // Export reception slips to CSV
  async exportToCSV(filters?: {
    search?: string;
    status?: string;
    client_id?: string;
    company_id?: string;
  }): Promise<ApiResponse<Blob>> {
    try {
      const params = new URLSearchParams({
        format: 'csv',
        ...Object.fromEntries(
          Object.entries(filters || {}).filter(([_, value]) => value !== undefined && value !== '')
        )
      });

      const response = await fetch(`${this.baseUrl}/export?${params}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const blob = await response.blob();
      
      return {
        data: blob,
        success: true
      };
    } catch (error) {
      console.error('Error exporting reception slips:', error);
      return {
        data: null,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      } as ApiResponse<Blob>;
    }
  }

  // Generate PDF for reception slip
  async generatePDF(id: string | number): Promise<ApiResponse<Blob>> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}/pdf`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Reception slip not found');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const blob = await response.blob();
      
      return {
        data: blob,
        success: true
      };
    } catch (error) {
      console.error('Error generating reception slip PDF:', error);
      return {
        data: null,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      } as ApiResponse<Blob>;
    }
  }

  // Duplicate reception slip
  async duplicateReceptionSlip(id: string | number): Promise<ApiResponse<ReceptionSlip>> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}/duplicate`, {
        method: 'POST',
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Reception slip not found');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to duplicate reception slip');
      }

      return {
        data: data.data,
        success: true
      };
    } catch (error) {
      console.error('Error duplicating reception slip:', error);
      return {
        data: null,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      } as ApiResponse<ReceptionSlip>;
    }
  }

  // Bulk operations
  async bulkUpdateStatus(
    ids: (string | number)[],
    status: string
  ): Promise<ApiResponse<boolean>> {
    try {
      const response = await fetch(`${this.baseUrl}/bulk/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ids, status }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to bulk update reception slip status');
      }

      return {
        data: true,
        success: true
      };
    } catch (error) {
      console.error('Error bulk updating reception slip status:', error);
      return {
        data: false,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  async bulkDelete(ids: (string | number)[]): Promise<ApiResponse<boolean>> {
    try {
      const response = await fetch(`${this.baseUrl}/bulk/delete`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ids }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to bulk delete reception slips');
      }

      return {
        data: true,
        success: true
      };
    } catch (error) {
      console.error('Error bulk deleting reception slips:', error);
      return {
        data: false,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
}

// Create and export a singleton instance
export const receptionSlipServiceApi = new ReceptionSlipServiceApi();
export default receptionSlipServiceApi;