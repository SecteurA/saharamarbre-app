// services/expenseService.ts - Expense management service
import { MySQLClient } from '../lib/mysql';
import type { 
  Expense, 
  CreateExpenseData, 
  UpdateExpenseData,
  ExpensesResponse
} from '../types/database.types';

// Expense categories from the Laravel application
export const EXPENSE_CATEGORIES = [
  { value: 'office_supplies', label: 'Fournitures de bureau' },
  { value: 'travel', label: 'Frais de déplacement' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'utilities', label: 'Services publics' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'training', label: 'Formation' },
  { value: 'insurance', label: 'Assurance' },
  { value: 'rent', label: 'Loyer' },
  { value: 'equipment', label: 'Équipement' },
  { value: 'other', label: 'Autre' }
];

export class ExpenseService {
  // Get all expenses with pagination
  static async getAll(params?: Record<string, any>): Promise<ExpensesResponse> {
    return MySQLClient.getPaginated<Expense>('/expenses', params);
  }

  // Get expense by ID
  static async getById(id: number): Promise<Expense> {
    return MySQLClient.get<Expense>(`/expenses/${id}`);
  }

  // Create new expense
  static async create(data: CreateExpenseData): Promise<Expense> {
    return MySQLClient.post<Expense>('/expenses', data);
  }

  // Update expense
  static async update(id: number, data: UpdateExpenseData): Promise<Expense> {
    return MySQLClient.put<Expense>(`/expenses/${id}`, data);
  }

  // Delete expense
  static async delete(id: number): Promise<void> {
    return MySQLClient.delete<void>(`/expenses/${id}`);
  }

  // Get expense statistics
  static async getStats(): Promise<{
    total: number;
    thisMonth: number;
    totalAmount: number;
    avgAmount: number;
    byCategory: Record<string, number>;
  }> {
    return MySQLClient.get('/expenses/stats');
  }

  // Search expenses
  static async search(query: string, params?: Record<string, any>): Promise<ExpensesResponse> {
    return MySQLClient.getPaginated<Expense>('/expenses/search', { q: query, ...params });
  }

  // Helper method to get category label
  static getCategoryLabel(categoryValue: string): string {
    const category = EXPENSE_CATEGORIES.find(cat => cat.value === categoryValue);
    return category?.label || categoryValue;
  }

  // Helper method to format expense amount
  static formatAmount(amount: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'MAD',
      minimumFractionDigits: 2
    }).format(amount);
  }

  // Helper method to format currency (alias for formatAmount)
  static formatCurrency(amount: number): string {
    return this.formatAmount(amount);
  }

  // Helper method to format date
  static formatDate(date: string): string {
    return new Date(date).toLocaleDateString('fr-FR');
  }
}

// Export default service instance
export const expenseService = ExpenseService;

// Export create/update data types for components
export type { CreateExpenseData, UpdateExpenseData };