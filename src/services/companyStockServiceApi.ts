import { config } from '../config';

export interface CompanyStock {
  stock_id: number;
  company_id: number;
  company_name: string;
  product_id: number;
  product_name: string;
  product_type: string;
  product_description?: string;
  product_unit?: string;
  quantity: number;
  reserved_quantity?: number;
  unit_cost?: number;
  selling_price?: number;
  state?: string;
  splicer?: string;
  width?: number;
  length?: number;
  location?: string;
  supplier?: string;
  stock_created_at: string;
  stock_updated_at: string;
}

export interface CompanyStockCreateData {
  company_id: number;
  product_id: number;
  quantity?: number;
  unit_cost?: number;
  selling_price?: number;
  state?: string;
  splicer?: string;
  width?: number;
  length?: number;
  location?: string;
  supplier?: string;
}

export interface CompanyStockUpdateData {
  quantity?: number;
  unit_cost?: number;
  selling_price?: number;
  state?: string;
  splicer?: string;
  width?: number;
  length?: number;
  location?: string;
  supplier?: string;
}

export interface CompanyStockFilters {
  company_id?: number;
  search?: string;
  product_type?: string;
  page?: number;
  limit?: number;
}

export interface CompanyStockResponse {
  success: boolean;
  data: CompanyStock[];
  pagination: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
    from: number;
    to: number;
    has_more_pages: boolean;
  };
}

export interface SingleCompanyStockResponse {
  success: boolean;
  data: CompanyStock;
}

class CompanyStockService {
  private baseURL = `${config.api.baseUrl}/company-stocks`;

  // Get company stocks with filters and pagination
  async getCompanyStocks(filters: CompanyStockFilters): Promise<CompanyStockResponse> {
    try {
      const params = new URLSearchParams();
      
      // Company ID (can be optional for admin view)
      if (filters.company_id) {
        params.append('company_id', filters.company_id.toString());
      }
      
      if (filters.search) {
        params.append('search', filters.search);
      }
      
      if (filters.product_type && filters.product_type !== 'TOUT') {
        params.append('product_type', filters.product_type);
      }
      
      if (filters.page) {
        params.append('page', filters.page.toString());
      }
      
      if (filters.limit) {
        params.append('limit', filters.limit.toString());
      }

      const response = await fetch(`${this.baseURL}?${params.toString()}`, {
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
      console.error('Error fetching company stocks:', error);
      throw error;
    }
  }

  // Get single company stock
  async getCompanyStock(stockId: number, companyId: number): Promise<SingleCompanyStockResponse> {
    try {
      const params = new URLSearchParams();
      params.append('company_id', companyId.toString());

      const response = await fetch(`${this.baseURL}/${stockId}?${params.toString()}`, {
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
      console.error('Error fetching company stock:', error);
      throw error;
    }
  }

  // Create new company stock
  async createCompanyStock(data: CompanyStockCreateData): Promise<SingleCompanyStockResponse> {
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
      console.error('Error creating company stock:', error);
      throw error;
    }
  }

  // Update company stock
  async updateCompanyStock(
    stockId: number, 
    companyId: number, 
    data: CompanyStockUpdateData
  ): Promise<SingleCompanyStockResponse> {
    try {
      const response = await fetch(`${this.baseURL}/${stockId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          company_id: companyId, // Include for security validation
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating company stock:', error);
      throw error;
    }
  }

  // Delete company stock (soft delete)
  async deleteCompanyStock(stockId: number, companyId: number): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${this.baseURL}/${stockId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          company_id: companyId, // Include for security validation
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error deleting company stock:', error);
      throw error;
    }
  }

  // Get product types for filtering
  async getProductTypes(): Promise<{ success: boolean; data: Array<{ value: string; label: string }> }> {
    try {
      const response = await fetch(`${config.api.baseUrl}/products/types/options`, {
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
      console.error('Error fetching product types:', error);
      throw error;
    }
  }

  // Get stock summary for a company or all companies
  async getCompanyStockSummary(companyId?: number): Promise<{
    success: boolean;
    data: {
      total_products: number;
      total_quantity: number;
      low_stock_products: number;
      total_value: number;
    };
  }> {
    try {
      const response = await this.getCompanyStocks({ 
        company_id: companyId, 
        limit: 5000 // Get all records for summary
      });

      if (!response.success) {
        throw new Error('Failed to fetch stock data for summary');
      }

      const stocks = response.data;
      const summary = {
        total_products: stocks.length,
        total_quantity: Math.round(stocks.reduce((sum, stock) => {
          const qty = Number(stock.quantity) || 0;
          return sum + qty;
        }, 0) * 100) / 100, // Round to 2 decimal places
        low_stock_products: stocks.filter(stock => {
          const qty = Number(stock.quantity) || 0;
          return qty < 10 && qty > 0;
        }).length,
        total_value: Math.round(stocks.reduce((sum, stock) => {
          const quantity = Number(stock.quantity) || 0;
          const unitCost = Number(stock.unit_cost) || 0;
          return sum + (quantity * unitCost);
        }, 0) * 100) / 100, // Round to 2 decimal places
      };

      return {
        success: true,
        data: summary,
      };
    } catch (error) {
      console.error('Error calculating stock summary:', error);
      throw error;
    }
  }
}

export const companyStockService = new CompanyStockService();
export default CompanyStockService;