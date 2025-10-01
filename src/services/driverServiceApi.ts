import ApiClient from '../lib/api';

export interface Driver {
  id: number;
  name: string;
  phone: string;
  cin?: string; // CIN (National ID)
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface CreateDriverData {
  name: string;
  phone: string;
  cin?: string;
}

export interface UpdateDriverData extends Partial<CreateDriverData> {}

export async function getDrivers(): Promise<Driver[]> {
  try {
    const response = await ApiClient.get('/drivers');
    // API returns { success: true, data: [...] }, so we need response.data.data
    return response.data?.data || [];
  } catch (error: any) {
    console.error('Failed to fetch drivers:', error);
    throw new Error(error.response?.data?.error || 'Failed to fetch drivers');
  }
}

export async function getDriverById(id: number): Promise<Driver> {
  try {
    const response = await ApiClient.get(`/drivers/${id}`);
    return response.data?.data;
  } catch (error: any) {
    console.error('Failed to fetch driver:', error);
    throw new Error(error.response?.data?.error || 'Failed to fetch driver');
  }
}

export async function createDriver(driverData: CreateDriverData): Promise<Driver> {
  try {
    const response = await ApiClient.post('/drivers', driverData);
    return response.data?.data;
  } catch (error: any) {
    console.error('Failed to create driver:', error);
    throw new Error(error.response?.data?.error || 'Failed to create driver');
  }
}

export async function updateDriver(id: number, driverData: UpdateDriverData): Promise<Driver> {
  try {
    const response = await ApiClient.put(`/drivers/${id}`, driverData);
    return response.data?.data;
  } catch (error: any) {
    console.error('Failed to update driver:', error);
    throw new Error(error.response?.data?.error || 'Failed to update driver');
  }
}

export async function deleteDriver(id: number): Promise<void> {
  try {
    await ApiClient.delete(`/drivers/${id}`);
  } catch (error: any) {
    console.error('Failed to delete driver:', error);
    throw new Error(error.response?.data?.error || 'Failed to delete driver');
  }
}

export async function searchDrivers(query: string): Promise<Driver[]> {
  try {
    const response = await ApiClient.get(`/drivers/search?q=${encodeURIComponent(query)}`);
    return response.data?.data || [];
  } catch (error: any) {
    console.error('Failed to search drivers:', error);
    throw new Error(error.response?.data?.error || 'Failed to search drivers');
  }
}

// Create a class-based service to match the structure used in some components
export class DriverService {
  static async getAll() {
    return getDrivers();
  }

  static async getById(id: number) {
    return getDriverById(id);
  }

  static async create(data: CreateDriverData) {
    return createDriver(data);
  }

  static async update(id: number, data: UpdateDriverData) {
    return updateDriver(id, data);
  }

  static async delete(id: number) {
    return deleteDriver(id);
  }

  static async search(query: string) {
    return searchDrivers(query);
  }
}

// Export both named and default exports to match existing usage patterns
export default DriverService;