import ApiClient from '../lib/api';

export interface Company {
  id: number;
  name: string;
  code: string;
  main_color: string;
  phone: string;
  fax?: string;
  bin?: string;
  patent?: string;
  tax_id?: string;
  crn?: string;
  cnss?: string;
  email: string;
  logo?: string;
  address?: string;
  website?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface CreateCompanyData {
  name: string;
  code: string;
  main_color?: string;
  phone: string;
  fax?: string;
  bin?: string;
  patent?: string;
  tax_id?: string;
  crn?: string;
  cnss?: string;
  email: string;
  logo?: string;
  address?: string;
  website?: string;
}

export interface UpdateCompanyData extends Partial<CreateCompanyData> {}

export interface CompaniesResponse {
  data: Company[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Function exports
export async function getCompanies(page = 1, limit = 20, search = ''): Promise<CompaniesResponse> {
  try {
    const response = await ApiClient.get(`/companies?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`);
    console.log('API Response for companies:', response);
    
    // Server returns { success: true, data: [...], count: ... }
    if (response.success && Array.isArray(response.data)) {
      const companies = response.data;
      console.log('Loaded companies from API:', companies);
      
      return {
        data: companies,
        pagination: {
          page, 
          limit, 
          total: response.count || companies.length, 
          pages: Math.ceil((response.count || companies.length) / limit)
        }
      };
    }
    
    throw new Error('Invalid response format from server');
  } catch (error: any) {
    console.error('Failed to load companies from API:', error);
    throw error;
  }
}

export async function getCompanyById(id: number): Promise<Company> {
  try {
    const response = await ApiClient.get(`/companies/${id}`);
    return response.data?.data;
  } catch (error: any) {
    console.error('Failed to fetch company:', error);
    throw new Error(error.response?.data?.error || 'Failed to fetch company');
  }
}

export async function createCompany(companyData: CreateCompanyData): Promise<Company> {
  try {
    const response = await ApiClient.post('/companies', companyData);
    return response.data?.data;
  } catch (error: any) {
    console.error('Failed to create company:', error);
    throw new Error(error.response?.data?.error || 'Failed to create company');
  }
}

export async function updateCompany(id: number, companyData: UpdateCompanyData): Promise<Company> {
  try {
    const response = await ApiClient.put(`/companies/${id}`, companyData);
    return response.data?.data;
  } catch (error: any) {
    console.error('Failed to update company:', error);
    throw new Error(error.response?.data?.error || 'Failed to update company');
  }
}

export async function deleteCompany(id: number): Promise<void> {
  try {
    await ApiClient.delete(`/companies/${id}`);
  } catch (error: any) {
    console.error('Failed to delete company:', error);
    throw new Error(error.response?.data?.error || 'Failed to delete company');
  }
}

export async function getCompanyOptions(): Promise<{id: number, name: string, code: string}[]> {
  try {
    const response = await ApiClient.get('/companies/options');
    console.log('Company options API response:', response);
    return response.data || [];
  } catch (error: any) {
    console.error('Failed to fetch company options:', error);
    throw new Error(error.response?.data?.error || 'Failed to fetch company options');
  }
}

// Class-based service to match existing usage patterns
export class CompanyService {
  // Get all companies with pagination and search
  static async getAll(page = 1, limit = 20, search = '') {
    try {
      const response = await getCompanies(page, limit, search);
      return {
        data: response.data,
        pagination: response.pagination,
        success: true,
        error: null
      };
    } catch (error: any) {
      return {
        data: [] as Company[],
        pagination: { page, limit, total: 0, pages: 0 },
        success: false,
        error: error.message || 'Failed to fetch companies'
      };
    }
  }

  // Get company by ID
  static async getById(id: number) {
    try {
      const company = await getCompanyById(id);
      return {
        data: company,
        success: true,
        error: null
      };
    } catch (error: any) {
      return {
        data: null,
        success: false,
        error: error.message || 'Failed to fetch company'
      };
    }
  }

  // Create new company
  static async create(companyData: CreateCompanyData) {
    try {
      const company = await createCompany(companyData);
      return {
        data: company,
        success: true,
        error: null
      };
    } catch (error: any) {
      return {
        data: null,
        success: false,
        error: error.message || 'Failed to create company'
      };
    }
  }

  // Update company
  static async update(id: number, companyData: UpdateCompanyData) {
    try {
      const company = await updateCompany(id, companyData);
      return {
        data: company,
        success: true,
        error: null
      };
    } catch (error: any) {
      return {
        data: null,
        success: false,
        error: error.message || 'Failed to update company'
      };
    }
  }

  // Delete company
  static async delete(id: number) {
    try {
      await deleteCompany(id);
      return {
        success: true,
        error: null
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to delete company'
      };
    }
  }

  // Get company options for dropdowns
  static async getOptions() {
    try {
      const options = await getCompanyOptions();
      return {
        data: options,
        success: true,
        error: null
      };
    } catch (error: any) {
      return {
        data: [],
        success: false,
        error: error.message || 'Failed to fetch company options'
      };
    }
  }
}

// Export both named and default exports to match existing usage patterns
export default CompanyService;