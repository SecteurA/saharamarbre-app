// Stock service for API operations
import ApiClient from '../lib/api';

export interface Stock {
  id: number;
  company: string | null;
  type: string | null;
  product: string | null;
  full_product_description: string | null;
  state: string | null;
  splicer: string | null;
  width: number | null;
  length: number | null;
  quantity: number;
  total_quantity: number | null;
  unit: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateStockData {
  company?: string;
  type?: string;
  product?: string;
  full_product_description?: string;
  state?: string;
  splicer?: string;
  width?: number;
  length?: number;
  quantity: number;
  total_quantity?: number;
  unit?: string;
}

export interface UpdateStockData {
  company?: string;
  type?: string;
  product?: string;
  full_product_description?: string;
  state?: string;
  splicer?: string;
  width?: number;
  length?: number;
  quantity?: number;
  total_quantity?: number;
  unit?: string;
}

export interface StockFilters {
  company?: string;
  type?: string;
  product?: string;
  state?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface FilterOptions {
  companies: string[];
  types: string[];
  products: string[];
  states: string[];
}

export interface PaginationInfo {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
  from: number;
  to: number;
  has_more_pages: boolean;
}

export interface PaginatedStocksResponse {
  data: Stock[];
  pagination: PaginationInfo;
}

// Get all stocks with optional filtering and pagination
export const getStocks = async (filters?: StockFilters): Promise<PaginatedStocksResponse> => {
  const params = new URLSearchParams();
  
  if (filters?.company) params.append('company', filters.company);
  if (filters?.type) params.append('type', filters.type);
  if (filters?.product) params.append('product', filters.product);
  if (filters?.state) params.append('state', filters.state);
  if (filters?.search) params.append('search', filters.search);
  if (filters?.page) params.append('page', filters.page.toString());
  if (filters?.limit) params.append('limit', filters.limit.toString());

  const queryString = params.toString();
  const url = queryString ? `/stocks?${queryString}` : '/stocks';
  
  try {
    const response = await ApiClient.get(url);
    console.log('Stocks API response:', response);
    
    // Server returns { success: true, data: [...], pagination: {...} }
    if (response.success && response.data) {
      return {
        data: response.data,
        pagination: response.pagination || { current_page: 1, per_page: 100, total: 0, last_page: 1, from: 0, to: 0, has_more_pages: false }
      };
    }
    
    throw new Error('Invalid response format from server');
  } catch (error) {
    console.error('Failed to fetch stocks:', error);
    throw error;
  }
};

// Get stock by ID
export const getStock = async (id: number): Promise<Stock> => {
  try {
    const response = await ApiClient.get(`/stocks/${id}`);
    console.log('Stock API response:', response);
    
    // Server returns { success: true, data: {...} }
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error('Invalid response format from server');
  } catch (error) {
    console.error('Failed to fetch stock:', error);
    throw error;
  }
};

// Get filter options (unique values for dropdowns)
export const getFilterOptions = async (): Promise<FilterOptions> => {
  try {
    const response = await ApiClient.get('/stocks/filter-options/all');
    console.log('Filter options API response:', response);
    
    // Server returns { success: true, data: { companies: [...], types: [...], ... } }
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error('Invalid response format from server');
  } catch (error) {
    console.error('Failed to fetch filter options:', error);
    throw error;
  }
};

// Create new stock
export const createStock = async (stockData: CreateStockData): Promise<Stock> => {
  try {
    const response = await ApiClient.post('/stocks', stockData);
    console.log('Create stock API response:', response);
    
    // Server returns { success: true, data: {...} }
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error('Invalid response format from server');
  } catch (error) {
    console.error('Failed to create stock:', error);
    throw error;
  }
};

// Update stock
export const updateStock = async (id: number, stockData: UpdateStockData): Promise<Stock> => {
  try {
    const response = await ApiClient.put(`/stocks/${id}`, stockData);
    console.log('Update stock API response:', response);
    
    // Server returns { success: true, data: {...} }
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error('Invalid response format from server');
  } catch (error) {
    console.error('Failed to update stock:', error);
    throw error;
  }
};

// Delete stock
export const deleteStock = async (id: number): Promise<void> => {
  try {
    const response = await ApiClient.delete(`/stocks/${id}`);
    console.log('Delete stock API response:', response);
    
    // Server returns { success: true, message: '...' }
    if (response.success) {
      return;
    }
    
    throw new Error('Invalid response format from server');
  } catch (error) {
    console.error('Failed to delete stock:', error);
    throw error;
  }
};