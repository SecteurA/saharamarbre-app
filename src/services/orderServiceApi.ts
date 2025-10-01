import ApiClient from '../lib/api';

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

export interface OrderItem {
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

export interface Order {
  id: number;
  order_number?: string;
  order_ref?: string;
  client_id: number;
  company_id?: number | null;
  order_date: string;
  delivery_date?: string | null;
  status: string;
  subtotal?: number;
  tax_amount?: number;
  tax_rate?: number;
  total_amount: number;
  discount_amount?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  // Relations
  client?: {
    id: number;
    name: string;
    nom: string; // Laravel uses 'nom' field
    address?: string | null;
    city?: string | null;
    phone?: string | null;
    email?: string | null;
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
  items?: OrderItem[];
}

export interface CreateOrderData {
  client_id: number;
  company_id?: number | null;
  order_date?: string;
  delivery_date?: string | null;
  status?: string;
  total_amount?: number;
  discount_amount?: number;
  tax_amount?: number;
  notes?: string | null;
  items?: {
    product_id: number;
    quantity: number;
    unit_price: number;
    total_price: number;
  }[];
  order_items?: Omit<OrderItem, "id">[];
}

export interface UpdateOrderData extends Partial<CreateOrderData> {}

// Function exports
export async function getOrders(): Promise<Order[]> {
  try {
    const response = await ApiClient.get('/orders');
    console.log('Orders API response:', response);
    
    // Server returns { success: true, data: [...] }
    if (response.success && Array.isArray(response.data)) {
      return response.data;
    }
    
    throw new Error('Invalid response format from server');
  } catch (error: any) {
    console.error('Failed to fetch orders:', error);
    throw error;
  }
}

export async function getOrderById(id: number): Promise<Order> {
  try {
    const response = await ApiClient.get(`/orders/${id}`);
    console.log('Order by ID API response:', response);
    
    // Server returns { success: true, data: {...} }
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error('Invalid response format from server');
  } catch (error: any) {
    console.error('Failed to fetch order:', error);
    throw error;
  }
}

export async function createOrder(orderData: CreateOrderData): Promise<Order> {
  try {
    const response = await ApiClient.post('/orders', orderData);
    console.log('Create order API response:', response);
    
    // Server returns { success: true, data: {...} }
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error('Invalid response format from server');
  } catch (error: any) {
    console.error('Failed to create order:', error);
    throw error;
  }
}

export async function updateOrder(id: number, orderData: UpdateOrderData): Promise<Order> {
  try {
    const response = await ApiClient.put(`/orders/${id}`, orderData);
    console.log('Update order API response:', response);
    
    // Server returns { success: true, data: {...} }
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error('Invalid response format from server');
  } catch (error: any) {
    console.error('Failed to update order:', error);
    throw error;
  }
}

export async function deleteOrder(id: number): Promise<void> {
  try {
    await ApiClient.delete(`/orders/${id}`);
  } catch (error: any) {
    console.error('Failed to delete order:', error);
    throw new Error(error.response?.data?.error || 'Failed to delete order');
  }
}

// Class-based service to match existing usage patterns
export class OrderService {
  static async getAll(params?: PaginationParams): Promise<PaginatedResponse<Order>> {
    try {
      // Build query params
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);

      const response = await ApiClient.get(`/orders?${queryParams.toString()}`);
      console.log('OrderService.getAll API response:', response);
      
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
        error: error.message || 'Failed to fetch orders'
      };
    }
  }

  static async getById(id: number) {
    try {
      const order = await getOrderById(id);
      return {
        data: order,
        success: true,
        error: null
      };
    } catch (error: any) {
      return {
        data: null,
        success: false,
        error: error.message || 'Failed to fetch order'
      };
    }
  }

  static async create(data: CreateOrderData) {
    try {
      const order = await createOrder(data);
      return {
        data: order,
        success: true,
        error: null
      };
    } catch (error: any) {
      return {
        data: null,
        success: false,
        error: error.message || 'Failed to create order'
      };
    }
  }

  static async update(id: number, data: UpdateOrderData) {
    try {
      const order = await updateOrder(id, data);
      return {
        data: order,
        success: true,
        error: null
      };
    } catch (error: any) {
      return {
        data: null,
        success: false,
        error: error.message || 'Failed to update order'
      };
    }
  }

  static async delete(id: number) {
    try {
      await deleteOrder(id);
      return {
        success: true,
        error: null
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to delete order'
      };
    }
  }

  // Statistics and search methods
  static async getStatistics() {
    try {
      const response = await ApiClient.get('/orders/statistics');
      console.log('Order statistics API response:', response);
      
      // Server returns { success: true, data: {...} }
      if (response.success && response.data) {
        return {
          data: response.data,
          success: true,
          error: null
        };
      }
      
      throw new Error('Invalid response format from server');
    } catch (error: any) {
      return {
        data: null,
        success: false,
        error: error.message || 'Failed to get order statistics'
      };
    }
  }

  static async getStats() {
    return this.getStatistics();
  }

  static async getByStatus(status: string) {
    try {
      const response = await ApiClient.get(`/orders?status=${status}`);
      console.log('Orders by status API response:', response);
      
      // Server returns { success: true, data: [...] }
      if (response.success && response.data) {
        return {
          data: response.data,
          success: true,
          error: null
        };
      }
      
      throw new Error('Invalid response format from server');
    } catch (error: any) {
      return {
        data: [],
        success: false,
        error: error.message || 'Failed to get orders by status'
      };
    }
  }

  static async search(query: string, params?: PaginationParams): Promise<PaginatedResponse<Order>> {
    try {
      // Use the same endpoint as getAll() but with search parameter
      const queryParams = new URLSearchParams();
      queryParams.append('search', query); // Use 'search' parameter instead of 'q'
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);

      const response = await ApiClient.get(`/orders?${queryParams.toString()}`);
      console.log('Order search API response:', response);
      
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
        error: error.message || 'Failed to search orders'
      };
    }
  }
}

// Export both named and default exports to match existing usage patterns
export default OrderService;