import { config } from '../config';

export interface Company {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface CompanyCreateData {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
}

export interface CompanyUpdateData {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
}

export interface CompanyResponse {
  success: boolean;
  data: Company[];
  pagination?: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
    from: number;
    to: number;
    has_more_pages: boolean;
  };
}

export interface SingleCompanyResponse {
  success: boolean;
  data: Company;
}

class CompaniesService {
  private baseURL = `${config.api.baseUrl}/companies`;

  // Get all companies with pagination and search
  async getCompanies(params?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<CompanyResponse> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params?.page) {
        queryParams.append('page', params.page.toString());
      }
      
      if (params?.limit) {
        queryParams.append('limit', params.limit.toString());
      }
      
      if (params?.search) {
        queryParams.append('search', params.search);
      }

      const response = await fetch(`${this.baseURL}?${queryParams.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching companies:', error);
      throw error;
    }
  }

  // Get single company
  async getCompany(id: number): Promise<SingleCompanyResponse> {
    try {
      const response = await fetch(`${this.baseURL}/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching company:', error);
      throw error;
    }
  }

  // Create new company
  async createCompany(data: CompanyCreateData): Promise<SingleCompanyResponse> {
    try {
      const response = await fetch(this.baseURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating company:', error);
      throw error;
    }
  }

  // Update company
  async updateCompany(id: number, data: CompanyUpdateData): Promise<SingleCompanyResponse> {
    try {
      const response = await fetch(`${this.baseURL}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating company:', error);
      throw error;
    }
  }

  // Delete company (soft delete)
  async deleteCompany(id: number): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${this.baseURL}/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error deleting company:', error);
      throw error;
    }
  }

  // Get companies for dropdown (simple format)
  async getCompaniesForDropdown(): Promise<Array<{ id: number; name: string }>> {
    try {
      const response = await this.getCompanies({ limit: 1000 }); // Get all companies
      
      if (!response.success) {
        throw new Error('Failed to fetch companies');
      }

      return response.data.map(company => ({
        id: company.id,
        name: company.name
      }));
    } catch (error) {
      console.error('Error fetching companies for dropdown:', error);
      throw error;
    }
  }
}

export const companiesService = new CompaniesService();
export default CompaniesService;