import ApiClient from '../lib/api'

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    pages: number;
    page: number;
    limit: number;
  };
  success: boolean;
  error?: string | null;
}

export interface IssueSlip {
  id: number
  human_id: string
  issue_number?: string
  client_id: number
  company_id: number
  salesperson?: number
  driver?: string
  plate?: string
  worksite?: string
  order_ref?: string
  is_free?: boolean
  tax_rate?: number
  taxable_amount?: number
  total_taxes?: number
  total_amount: number
  notes?: string
  type: string // 'issue slip'
  created_at: string
  updated_at: string
  deleted_at?: string | null
  
  // Relations
  client?: {
    id: number
    name: string
    phone?: string
    company?: string
  }
  company?: {
    id: number
    name: string
    phone?: string
    address?: string
  }
  user?: {
    id: number
    name: string
    email?: string
  }
  driver_info?: {
    id: number
    name: string
    phone?: string
  }
  items?: IssueSlipItem[]
}

export interface IssueSlipItem {
  id?: number
  group?: number
  type: string
  product: string
  options?: string
  state?: string
  splicer?: number
  length?: number
  width?: number
  quantity: number
  unit_price?: number
  total_quantity?: number
  total_price?: number
}

export interface CreateIssueSlipData {
  client_id: number
  company_id: number
  salesperson?: number
  driver?: string
  plate?: string
  worksite?: string
  order_ref?: string
  is_free?: boolean
  tax_rate?: number
  notes?: string
  items?: Omit<IssueSlipItem, 'id'>[]
}

export interface UpdateIssueSlipData {
  number?: string
  date?: string
  type?: 'issue' | 'return'
  quantity?: number
  notes?: string | null
  order_id?: number | null
  product_id?: number | null
  driver_id?: number | null
}

export interface IssueSlipResponse {
  success: boolean
  data?: IssueSlip | IssueSlip[]
  error?: string
  issueSlips?: IssueSlip[]
}

export class IssueSlipService {
  
  // ==================== ISSUE SLIP CRUD ====================
  
  static async getAll(params?: PaginationParams): Promise<PaginatedResponse<IssueSlip>> {
    try {
      // Build query params
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);

      const response = await ApiClient.get(`/issue-slips?${queryParams.toString()}`);
      console.log('IssueSlips.getAll API response:', response);
      
      // Server returns { success: true, data: [...], pagination: {...} }
      if (response.success && response.data) {
        // API already returns the correct structure with nested client/user objects
        return {
          data: response.data,
          pagination: response.pagination || { total: response.data.length, pages: 1, page: 1, limit: 10 },
          success: true,
          error: null
        };
      }
      
      throw new Error('Invalid response format from server');
    } catch (error: any) {
      return {
        data: [],
        pagination: { total: 0, pages: 0, page: 1, limit: 10 },
        success: false,
        error: error.message || 'Failed to fetch issue slips'
      };
    }
  }

  static async search(query: string, params?: PaginationParams): Promise<PaginatedResponse<IssueSlip>> {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('q', query);
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);

      const response = await ApiClient.get(`/issue-slips/search?${queryParams.toString()}`);
      console.log('IssueSlips.search API response:', response);
      
      // Server returns { success: true, data: [...], pagination: {...} }
      if (response.success && response.data) {
        return {
          data: response.data,
          pagination: response.pagination || { total: response.data.length, pages: 1, page: 1, limit: 10 },
          success: true,
          error: null
        };
      }
      
      throw new Error('Invalid response format from server');
    } catch (error: any) {
      return {
        data: [],
        pagination: { total: 0, pages: 0, page: 1, limit: 10 },
        success: false,
        error: error.message || 'Failed to search issue slips'
      };
    }
  }

  static async getIssueSlipById(id: number): Promise<IssueSlipResponse> {
    try {
      const result = await ApiClient.get<IssueSlip>(`/issue-slips/${id}`);
      
      if (!result.success) {
        return {
          success: false,
          error: result.error || 'Failed to fetch issue slip'
        };
      }

      return {
        success: true,
        data: result.data
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch issue slip'
      };
    }
  }

  static async createIssueSlip(issueSlipData: CreateIssueSlipData): Promise<IssueSlipResponse> {
    try {
      const result = await ApiClient.post<IssueSlip>('/issue-slips', issueSlipData);
      
      if (!result.success) {
        return {
          success: false,
          error: result.error || 'Failed to create issue slip'
        };
      }

      return {
        success: true,
        data: result.data
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create issue slip'
      };
    }
  }

  static async updateIssueSlip(id: number, updates: UpdateIssueSlipData): Promise<IssueSlipResponse> {
    try {
      const result = await ApiClient.put<IssueSlip>(`/issue-slips/${id}`, updates);
      
      if (!result.success) {
        return {
          success: false,
          error: result.error || 'Failed to update issue slip'
        };
      }

      return {
        success: true,
        data: result.data
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update issue slip'
      };
    }
  }

  static async deleteIssueSlip(id: number): Promise<IssueSlipResponse> {
    try {
      const result = await ApiClient.delete(`/issue-slips/${id}`);
      
      if (!result.success) {
        return {
          success: false,
          error: result.error || 'Failed to delete issue slip'
        };
      }

      return {
        success: true,
        data: undefined
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete issue slip'
      };
    }
  }

  // ==================== SEARCH & FILTERING ====================

  static async searchIssueSlips(searchTerm: string, companyId?: number): Promise<IssueSlipResponse> {
    try {
      let endpoint = `/issue-slips/search?q=${encodeURIComponent(searchTerm)}`;
      if (companyId) {
        endpoint += `&company_id=${companyId}`;
      }
      
      const result = await ApiClient.get<IssueSlip[]>(endpoint);
      
      if (!result.success) {
        return {
          success: false,
          error: result.error || 'Failed to search issue slips'
        };
      }

      return {
        success: true,
        data: result.data,
        issueSlips: result.data
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to search issue slips'
      };
    }
  }

  static async getIssueSlipsByType(type: 'issue' | 'return', companyId?: number): Promise<IssueSlipResponse> {
    try {
      let endpoint = `/issue-slips?type=${type}`;
      if (companyId) {
        endpoint += `&company_id=${companyId}`;
      }
      
      const result = await ApiClient.get<IssueSlip[]>(endpoint);
      
      if (!result.success) {
        return {
          success: false,
          error: result.error || 'Failed to fetch issue slips by type'
        };
      }

      return {
        success: true,
        data: result.data,
        issueSlips: result.data
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch issue slips by type'
      };
    }
  }

  static async getIssueSlipsByDateRange(startDate: string, endDate: string, companyId?: number): Promise<IssueSlipResponse> {
    try {
      let endpoint = `/issue-slips?start_date=${startDate}&end_date=${endDate}`;
      if (companyId) {
        endpoint += `&company_id=${companyId}`;
      }
      
      const result = await ApiClient.get<IssueSlip[]>(endpoint);
      
      if (!result.success) {
        return {
          success: false,
          error: result.error || 'Failed to fetch issue slips by date range'
        };
      }

      return {
        success: true,
        data: result.data,
        issueSlips: result.data
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch issue slips by date range'
      };
    }
  }

  // ==================== STATISTICS ====================

  static async getIssueSlipStats(companyId?: number): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      let endpoint = '/issue-slips/stats';
      if (companyId) {
        endpoint += `?company_id=${companyId}`;
      }
      
      const result = await ApiClient.get(endpoint);
      
      if (!result.success) {
        return {
          success: false,
          error: result.error || 'Failed to fetch issue slip statistics'
        };
      }

      return {
        success: true,
        data: result.data
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch issue slip statistics'
      };
    }
  }

  // Backward compatibility methods
  static async getAllIssueSlips(_companyId?: number) {
    const result = await this.getAll({ limit: 50 });
    return {
      success: result.success,
      data: result.data,
      issueSlips: result.data,
      error: result.error
    };
  }
}
