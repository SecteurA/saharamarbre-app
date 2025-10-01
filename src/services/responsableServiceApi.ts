import ApiClient from '../lib/api';

export interface Responsable {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role_name: 'Super administrator' | 'Administrator' | 'Manager' | 'stock manager' | 'Siège social' | 'Employee';
  company_id?: number;
  company_name?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface CreateResponsableData {
  name: string;
  email: string;
  phone?: string;
  role_name: 'Super administrator' | 'Administrator' | 'Manager' | 'stock manager' | 'Siège social' | 'Employee';
  company_id?: number;
  password: string;
}

export interface UpdateResponsableData extends Partial<Omit<CreateResponsableData, 'password'>> {
  password?: string;
}

export async function getResponsables(): Promise<Responsable[]> {
  try {
    console.log('🔍 Fetching responsables from API...');
    // Add timestamp to avoid caching issues
    const timestamp = Date.now();
    const response = await ApiClient.get(`/responsables?t=${timestamp}`);
    console.log('📡 Full API Response:', response);
    console.log('📊 Response data:', response.data);
    console.log('📊 Response success:', response.success);
    
    // Check if this is the expected format {success: true, data: [...]}
    if (response.success && response.data) {
      console.log('✅ API returned success=true with data');
      const responsables = response.data || [];
      console.log('👥 Responsables found:', responsables.length);
      console.log('🎯 First responsable:', responsables[0]?.name || 'None');
      return responsables;
    } else {
      console.log('❌ Unexpected API response format');
      return [];
    }
  } catch (error: any) {
    console.error('❌ Failed to fetch responsables:', error);
    console.error('📊 Error response:', error.response?.data);
    throw new Error(error.response?.data?.error || 'Failed to fetch responsables');
  }
}

export async function getResponsableById(id: number): Promise<Responsable> {
  try {
    const response = await ApiClient.get(`/responsables/${id}`);
    return response.data?.data;
  } catch (error: any) {
    console.error('Failed to fetch responsable:', error);
    throw new Error(error.response?.data?.error || 'Failed to fetch responsable');
  }
}

export async function createResponsable(responsableData: CreateResponsableData): Promise<Responsable> {
  try {
    const response = await ApiClient.post('/responsables', responsableData);
    return response.data?.data;
  } catch (error: any) {
    console.error('Failed to create responsable:', error);
    throw new Error(error.response?.data?.error || 'Failed to create responsable');
  }
}

export async function updateResponsable(id: number, responsableData: UpdateResponsableData): Promise<Responsable> {
  try {
    const response = await ApiClient.put(`/responsables/${id}`, responsableData);
    return response.data?.data;
  } catch (error: any) {
    console.error('Failed to update responsable:', error);
    throw new Error(error.response?.data?.error || 'Failed to update responsable');
  }
}

export async function deleteResponsable(id: number): Promise<void> {
  try {
    await ApiClient.delete(`/responsables/${id}`);
  } catch (error: any) {
    console.error('Failed to delete responsable:', error);
    throw new Error(error.response?.data?.error || 'Failed to delete responsable');
  }
}

export async function searchResponsables(query: string): Promise<Responsable[]> {
  try {
    const response = await ApiClient.get(`/responsables/search?q=${encodeURIComponent(query)}`);
    return response.data?.data || [];
  } catch (error: any) {
    console.error('Failed to search responsables:', error);
    throw new Error(error.response?.data?.error || 'Failed to search responsables');
  }
}

// Create a class-based service to match the structure used in some components
export class ResponsableService {
  static async getAll() {
    return getResponsables();
  }

  static async getById(id: number) {
    return getResponsableById(id);
  }

  static async create(data: CreateResponsableData) {
    return createResponsable(data);
  }

  static async update(id: number, data: UpdateResponsableData) {
    return updateResponsable(id, data);
  }

  static async delete(id: number) {
    return deleteResponsable(id);
  }

  static async search(query: string) {
    return searchResponsables(query);
  }
}

// Export both named and default exports to match existing usage patterns
export default ResponsableService;