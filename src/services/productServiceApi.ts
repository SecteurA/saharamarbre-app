const API_BASE_URL = 'http://localhost:3001/api';

export interface Product {
  id: number;
  name: string;
  type?: 'Marbre' | 'Service';
  description?: string | null;
  unit?: string | null;
  category?: string | null;
  created_at: string;
  updated_at: string;
  // Company-specific stock information (only when company_id is provided)
  total_stock?: number;
  stock_records?: number;
  avg_unit_cost?: number;
  avg_selling_price?: number;
}

export interface CreateProductData {
  name: string;
  type?: 'Marbre' | 'Service';
  description?: string | null;
  unit?: string | null;
}

export interface UpdateProductData {
  name?: string;
  type?: 'Marbre' | 'Service';
  description?: string | null;
  unit?: string | null;
}

class ProductServiceApi {
  // Get all products from shared catalog (optionally with company-specific stock info)
  async getProducts(params?: {
    page?: number;
    limit?: number;
    search?: string;
    type?: string;
    company_id?: number; // Include to get company-specific stock information
  }): Promise<{ data: Product[]; pagination?: { page: number; limit: number; total: number; pages: number } }> {
    const queryParams = new URLSearchParams();
    
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.type) queryParams.append('type', params.type);
    if (params?.company_id) queryParams.append('company_id', params.company_id.toString());

    const url = `${API_BASE_URL}/products${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorResult = await response.json();
      throw new Error(errorResult.error || `Failed to fetch products: ${response.statusText}`);
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch products');
    }
    
    return {
      data: result.data,
      pagination: result.pagination
    };
  }

  // Get single product by ID (optionally with company-specific stock info)
  async getProduct(id: number, companyId?: number): Promise<Product> {
    const queryParams = new URLSearchParams();
    if (companyId) queryParams.append('company_id', companyId.toString());
    
    const url = `${API_BASE_URL}/products/${id}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorResult = await response.json();
      throw new Error(errorResult.error || `Failed to fetch product: ${response.statusText}`);
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch product');
    }
    
    return result.data;
  }

  // Create new product
  async createProduct(data: CreateProductData): Promise<Product> {
    const response = await fetch(`${API_BASE_URL}/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorResult = await response.json();
      throw new Error(errorResult.error || `Failed to create product: ${response.statusText}`);
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to create product');
    }
    
    return result.data;
  }

  // Update existing product
  async updateProduct(id: number, data: UpdateProductData): Promise<Product> {
    const response = await fetch(`${API_BASE_URL}/products/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorResult = await response.json();
      throw new Error(errorResult.error || `Failed to update product: ${response.statusText}`);
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to update product');
    }
    
    return result.data;
  }

  // Delete product (soft delete)
  async deleteProduct(id: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/products/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorResult = await response.json();
      throw new Error(errorResult.error || `Failed to delete product: ${response.statusText}`);
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to delete product');
    }
  }

  // Get product types for dropdown
  async getProductTypes(): Promise<Array<{value: string; label: string}>> {
    const response = await fetch(`${API_BASE_URL}/products/types/options`);
    
    if (!response.ok) {
      const errorResult = await response.json();
      throw new Error(errorResult.error || `Failed to fetch product types: ${response.statusText}`);
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch product types');
    }
    
    return result.data;
  }

  // Get distinct states/états from database
  async getProductStates(): Promise<string[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/products/states`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch product states');
      }
      
      return result.data || [];
    } catch (error) {
      console.error('Error fetching product states:', error);
      // Return fallback états found in database
      return ['Adouci', 'Bouchardé', 'Bouchardée', 'Brut', 'Chevron', 'Eclacte', 'Eclaté', 'Flammé', 'Flammée', 'Poli', 'Sablé', 'SAC', 'veilli', 'Vieilli', 'Vielli'];
    }
  }
}

// Export singleton instance
export const productService = new ProductServiceApi();

// Export individual functions for named imports
export const getProducts = (params?: { page?: number; limit?: number; search?: string; type?: string; company_id?: number }) => 
  productService.getProducts(params);

export const getProduct = (id: number, companyId?: number) => 
  productService.getProduct(id, companyId);

export const createProduct = (data: CreateProductData) => 
  productService.createProduct(data);

export const updateProduct = (id: number, data: UpdateProductData) => 
  productService.updateProduct(id, data);

export const deleteProduct = (id: number) => 
  productService.deleteProduct(id);

export const getProductTypes = () => 
  productService.getProductTypes();

export const getProductStates = () => 
  productService.getProductStates();

export default productService;