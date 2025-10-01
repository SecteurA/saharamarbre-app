import ApiClient from '../lib/api';

export interface QuoteItem {
  id?: number;
  product_id: number;
  quantity: number;
  unit_price: number;
  total_price: number;
  // Relations
  product?: {
    id: number;
    name: string;
    unit: string;
  };
}

export interface Quote {
  id: number;
  uuid?: string;
  quote_number: string;
  client_id: number;
  company_id?: number | null;
  user_id?: number;
  quote_date: string;
  valid_until?: string;
  expiry_date?: string;
  status: string;
  subtotal?: number;
  tax_amount?: number;
  tax_rate?: number;
  total_amount: number;
  total_with_tax?: number;
  discount_amount?: number;
  notes?: string | null;
  converted_to_order?: boolean;
  order_id?: number;
  order_ref?: string;
  worksite?: string;
  driver?: string;
  plate?: string;
  is_free?: boolean;
  payment_status?: string;
  created_at: string;
  updated_at: string;
  formatted_date?: string;
  // Relations
  client?: {
    id: number;
    name: string;
    nom: string; // Laravel uses 'nom' field
    address?: string | null;
    city?: string | null;
    phone?: string | null;
    email?: string | null;
    company?: string;
    patent?: string;
    created_at: string;
    updated_at: string;
  };
  company?: {
    id: number;
    name: string;
    address?: string | null;
    city?: string | null;
    phone?: string | null;
    email?: string | null;
    created_at: string;
    updated_at: string;
  };
  user?: {
    id: number;
    name: string;
    email: string;
    role: string;
    created_at: string;
    updated_at: string;
  };
  items?: QuoteItem[];
}

export interface CreateQuoteData {
  client_id: number;
  company_id?: number | null;
  quote_date?: string;
  valid_until?: string | null;
  expiry_date?: string | null;
  status?: string;
  total_amount?: number;
  discount_amount?: number;
  tax_amount?: number;
  notes?: string;
  items?: {
    product_id: number;
    quantity: number;
    unit_price: number;
    total_price: number;
  }[];
  quote_items?: Omit<QuoteItem, "id">[];
}

export interface UpdateQuoteData extends Partial<CreateQuoteData> {}

// Pagination interface
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
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Function exports
export async function getQuotes(params?: PaginationParams): Promise<PaginatedResponse<Quote>> {
  try {
    console.log('🔍 Fetching quotes from API...');
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);
    
    const url = `/quotes${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await ApiClient.get(url);
    console.log('📡 Quotes API response:', response);
    
    // Handle the API response structure {success: true, data: [...], pagination: {...}}
    if (response.success && response.data) {
      console.log('✅ API returned success=true with data');
      return {
        data: response.data || [],
        pagination: response.pagination || { page: 1, limit: 10, total: 0, pages: 0 }
      };
    } else {
      console.log('❌ Unexpected API response format');
      return { data: [], pagination: { page: 1, limit: 10, total: 0, pages: 0 } };
    }
  } catch (error: any) {
    console.error('❌ Failed to fetch quotes:', error);
    console.error('📊 Error response:', error.response?.data);
    throw new Error(error.response?.data?.error || 'Failed to fetch quotes');
  }
}

export async function getQuoteById(id: number): Promise<Quote> {
  try {
    const response = await ApiClient.get(`/quotes/${id}`);
    console.log('🔍 getQuoteById API response:', response);
    // The API returns {success: true, data: quote}, so we need response.data
    return response.data;
  } catch (error: any) {
    console.error('Failed to fetch quote:', error);
    throw new Error(error.response?.data?.error || 'Failed to fetch quote');
  }
}

export async function createQuote(quoteData: CreateQuoteData): Promise<Quote> {
  try {
    const response = await ApiClient.post('/quotes', quoteData);
    return response.data?.data;
  } catch (error: any) {
    console.error('Failed to create quote:', error);
    throw new Error(error.response?.data?.error || 'Failed to create quote');
  }
}

export async function updateQuote(id: number, quoteData: UpdateQuoteData): Promise<Quote> {
  try {
    const response = await ApiClient.put(`/quotes/${id}`, quoteData);
    return response.data?.data;
  } catch (error: any) {
    console.error('Failed to update quote:', error);
    throw new Error(error.response?.data?.error || 'Failed to update quote');
  }
}

export async function deleteQuote(id: number): Promise<void> {
  try {
    await ApiClient.delete(`/quotes/${id}`);
  } catch (error: any) {
    console.error('Failed to delete quote:', error);
    throw new Error(error.response?.data?.error || 'Failed to delete quote');
  }
}

export async function convertQuoteToOrder(id: number): Promise<{ order_id: number }> {
  try {
    const response = await ApiClient.post(`/quotes/${id}/convert-to-order`, {});
    return response.data?.data;
  } catch (error: any) {
    console.error('Failed to convert quote to order:', error);
    throw new Error(error.response?.data?.error || 'Failed to convert quote to order');
  }
}

  // Class-based service to match existing usage patterns
export class QuoteService {
  static async getAll(params?: PaginationParams) {
    try {
      const result = await getQuotes(params);
      return {
        data: result.data,
        pagination: result.pagination,
        success: true,
        error: null
      };
    } catch (error: any) {
      return {
        data: [],
        pagination: { page: 1, limit: 10, total: 0, pages: 0 },
        success: false,
        error: error.message || 'Failed to fetch quotes'
      };
    }
  }  static async getById(id: number) {
    try {
      const quote = await getQuoteById(id);
      return {
        data: quote,
        success: true,
        error: null
      };
    } catch (error: any) {
      return {
        data: null,
        success: false,
        error: error.message || 'Failed to fetch quote'
      };
    }
  }

  static async create(data: CreateQuoteData) {
    try {
      const quote = await createQuote(data);
      return {
        data: quote,
        success: true,
        error: null
      };
    } catch (error: any) {
      return {
        data: null,
        success: false,
        error: error.message || 'Failed to create quote'
      };
    }
  }

  static async update(id: number, data: UpdateQuoteData) {
    try {
      const quote = await updateQuote(id, data);
      return {
        data: quote,
        success: true,
        error: null
      };
    } catch (error: any) {
      return {
        data: null,
        success: false,
        error: error.message || 'Failed to update quote'
      };
    }
  }

  static async delete(id: number) {
    try {
      await deleteQuote(id);
      return {
        success: true,
        error: null
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to delete quote'
      };
    }
  }

  static async convertToOrder(id: number) {
    try {
      const result = await convertQuoteToOrder(id);
      return {
        data: result,
        success: true,
        error: null
      };
    } catch (error: any) {
      return {
        data: null,
        success: false,
        error: error.message || 'Failed to convert quote to order'
      };
    }
  }

  // Statistics and search methods
  static async getStatistics() {
    try {
      const response = await ApiClient.get('/quotes/statistics');
      return {
        data: response.data,
        success: true,
        error: null
      };
    } catch (error: any) {
      return {
        data: null,
        success: false,
        error: error.message || 'Failed to get quote statistics'
      };
    }
  }

  static async getStats() {
    return this.getStatistics();
  }

  static async getByStatus(status: string) {
    try {
      const response = await ApiClient.get(`/quotes?status=${status}`);
      return {
        data: response.data || [],
        success: true,
        error: null
      };
    } catch (error: any) {
      return {
        data: [],
        success: false,
        error: error.message || 'Failed to get quotes by status'
      };
    }
  }

  static async search(query: string, params?: PaginationParams) {
    try {
      const searchParams = { ...params, search: query };
      const result = await getQuotes(searchParams);
      return {
        data: result.data,
        pagination: result.pagination,
        success: true,
        error: null
      };
    } catch (error: any) {
      return {
        data: [],
        pagination: { page: 1, limit: 10, total: 0, pages: 0 },
        success: false,
        error: error.message || 'Failed to search quotes'
      };
    }
  }

  static async getExpired() {
    try {
      const response = await ApiClient.get('/quotes?status=expired');
      return {
        data: response.data || [],
        success: true,
        error: null
      };
    } catch (error: any) {
      return {
        data: [],
        success: false,
        error: error.message || 'Failed to get expired quotes'
      };
    }
  }
}

// Export both named and default exports to match existing usage patterns
export default QuoteService;
