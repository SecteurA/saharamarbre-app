// services/chequeService.ts - Cheque management service
import { MySQLClient } from '../lib/mysql';
import type { 
  Cheque, 
  CreateChequeData, 
  UpdateChequeData,
  ChequesResponse
} from '../types/database.types';

export class ChequeService {
  // Get all cheques with pagination
  static async getAll(params?: Record<string, any>): Promise<ChequesResponse> {
    return MySQLClient.getPaginated<Cheque>('/cheques', params);
  }

  // Get cheque by ID
  static async getById(id: number): Promise<Cheque> {
    return MySQLClient.get<Cheque>(`/cheques/${id}`);
  }

  // Create new cheque
  static async create(data: CreateChequeData): Promise<Cheque> {
    return MySQLClient.post<Cheque>('/cheques', data);
  }

  // Update cheque
  static async update(id: number, data: UpdateChequeData): Promise<Cheque> {
    return MySQLClient.put<Cheque>(`/cheques/${id}`, data);
  }

  // Delete cheque
  static async delete(id: number): Promise<void> {
    return MySQLClient.delete<void>(`/cheques/${id}`);
  }

  // Get cheque statistics
  static async getStats(): Promise<{
    total: number;
    pending: number;
    cleared: number;
    bounced: number;
    totalAmount: number;
    pendingAmount: number;
  }> {
    return MySQLClient.get('/cheques/stats');
  }

  // Search cheques
  static async search(query: string, params?: Record<string, any>): Promise<ChequesResponse> {
    return MySQLClient.getPaginated<Cheque>('/cheques/search', { q: query, ...params });
  }

  // Get cheques by status
  static async getByStatus(status: string, params?: Record<string, any>): Promise<ChequesResponse> {
    return MySQLClient.getPaginated<Cheque>('/cheques', { status, ...params });
  }

  // Mark cheque as cleared
  static async markAsCleared(id: number): Promise<Cheque> {
    return MySQLClient.put<Cheque>(`/cheques/${id}/clear`, {});
  }

  // Mark cheque as bounced
  static async markAsBounced(id: number): Promise<Cheque> {
    return MySQLClient.put<Cheque>(`/cheques/${id}/bounce`, {});
  }
}

// Export default service instance
export const chequeService = ChequeService;