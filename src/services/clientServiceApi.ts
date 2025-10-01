import ApiClient from '../lib/api';

export interface Client {
  id: number;
  name: string;
  nom: string; // Laravel uses 'nom' field
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  company?: string;
  bin?: string;
  patent?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface CreateClientData {
  name: string;
  nom: string; // Laravel uses 'nom' field
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  company?: string;
  bin?: string;
  patent?: string;
}

export interface UpdateClientData extends Partial<CreateClientData> {}

export interface ClientsResponse {
  clients: Client[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export async function getClients(page = 1, limit = 50, search = ''): Promise<ClientsResponse> {
  try {
    const response = await ApiClient.get(`/clients?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`);
    console.log('API Response for clients:', response);
    
    // Server returns { success: true, data: [...], count: ..., pagination: ... }
    if (response.success && Array.isArray(response.data)) {
      const clients = response.data.map((client: any) => ({
        ...client,
        name: client.name || '',
        nom: client.name || '' // Keep nom for compatibility but use name field
      }));
      
      console.log('Loaded clients from API:', clients);
      
      return {
        clients,
        pagination: response.pagination || {
          page,
          limit,
          total: response.count || clients.length,
          pages: Math.ceil((response.count || clients.length) / limit)
        }
      };
    }
    
    throw new Error('Invalid response format from server');
  } catch (error: any) {
    console.error('Failed to load clients from API:', error);
    throw error;
  }
}

export async function getClientById(id: number): Promise<Client> {
  try {
    const response = await ApiClient.get(`/clients/${id}`);
    return response.data?.data;
  } catch (error: any) {
    console.error('Failed to fetch client:', error);
    throw new Error(error.response?.data?.error || 'Failed to fetch client');
  }
}

export async function createClient(clientData: CreateClientData): Promise<Client> {
  try {
    const response = await ApiClient.post('/clients', clientData);
    return response.data?.data;
  } catch (error: any) {
    console.error('Failed to create client:', error);
    throw new Error(error.response?.data?.error || 'Failed to create client');
  }
}

export async function updateClient(id: number, clientData: UpdateClientData): Promise<Client> {
  try {
    const response = await ApiClient.put(`/clients/${id}`, clientData);
    return response.data?.data;
  } catch (error: any) {
    console.error('Failed to update client:', error);
    throw new Error(error.response?.data?.error || 'Failed to update client');
  }
}

export async function deleteClient(id: number): Promise<void> {
  try {
    await ApiClient.delete(`/clients/${id}`);
  } catch (error: any) {
    console.error('Failed to delete client:', error);
    throw new Error(error.response?.data?.error || 'Failed to delete client');
  }
}

export async function searchClients(query: string): Promise<Client[]> {
  try {
    const response = await ApiClient.get(`/clients/search?q=${encodeURIComponent(query)}`);
    return response.data?.data || [];
  } catch (error: any) {
    console.error('Failed to search clients:', error);
    throw new Error(error.response?.data?.error || 'Failed to search clients');
  }
}

// Create a class-based service to match the structure used in some components
export class ClientService {
  static async getAll(page = 1, limit = 50, search = ''): Promise<ClientsResponse> {
    return getClients(page, limit, search);
  }

  static async getById(id: number) {
    return getClientById(id);
  }

  static async create(data: CreateClientData) {
    return createClient(data);
  }

  static async update(id: number, data: UpdateClientData) {
    return updateClient(id, data);
  }

  static async delete(id: number) {
    return deleteClient(id);
  }

  static async search(query: string) {
    return searchClients(query);
  }
}

// Test function to verify API connectivity
export async function testApiConnection(): Promise<boolean> {
  try {
    console.log('Testing API connection...');
    const response = await fetch('http://localhost:3001/health');
    console.log('Health check response:', response.status, response.statusText);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Health check data:', data);
      return true;
    }
    return false;
  } catch (error) {
    console.error('API connection test failed:', error);
    return false;
  }
}

// Export both named and default exports to match existing usage patterns
export default ClientService;