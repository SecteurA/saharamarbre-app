import { config } from '../config';

// Inline types to avoid import issues
interface Expense {
  id: number;
  name: string;
  amount: number;
  company_id: number | null;
  user_id: number | null;
  created_at: string;
  updated_at: string;
  user?: {
    id: number;
    name: string;
  } | null;
  company?: {
    id: number;
    name: string;
  } | null;
}

interface PaginationMeta {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

interface ExpenseResponse {
  success: boolean;
  data: Expense[];
  pagination?: PaginationMeta;
}

interface SingleExpenseResponse {
  success: boolean;
  data: Expense;
}

interface StatsResponse {
  success: boolean;
  data: {
    total: number;
    totalAmount: number;
    avgAmount: number;
    today: number;
    thisWeek: number;
    thisMonth: number;
    thisYear: number;
  };
}

interface CreateExpenseData {
  name: string;
  amount: number;
  company_id: number;
  user_id?: number;
}

interface UpdateExpenseData {
  name?: string;
  amount?: number;
  company_id?: number;
  user_id?: number;
}

// Expense Categories (common expense types for businesses)
export const EXPENSE_CATEGORIES = [
  { value: 'office_supplies', label: 'Fournitures de bureau' },
  { value: 'travel', label: 'Voyage & Transport' },
  { value: 'utilities', label: 'Services publics' },
  { value: 'rent', label: 'Loyer & Immobilier' },
  { value: 'equipment', label: 'Équipement & Outils' },
  { value: 'maintenance', label: 'Maintenance & Réparations' },
  { value: 'fuel', label: 'Carburant & Véhicule' },
  { value: 'materials', label: 'Matériaux & Stock' },
  { value: 'insurance', label: 'Assurance' },
  { value: 'marketing', label: 'Marketing & Publicité' },
  { value: 'professional', label: 'Services professionnels' },
  { value: 'taxes', label: 'Taxes & Frais' },
  { value: 'meals', label: 'Repas & Divertissement' },
  { value: 'communication', label: 'Téléphone & Internet' },
  { value: 'other', label: 'Autre' },
];

class ExpenseServiceApi {
  private baseURL: string;

  constructor() {
    this.baseURL = `${config.api.baseUrl}/expenses`;
  }

  // Get all expenses with pagination and search
  async getAll(params?: {
    page?: number;
    limit?: number;
    search?: string;
    company_id?: number;
  }): Promise<{ data: Expense[]; pagination: PaginationMeta }> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params?.page) queryParams.set('page', params.page.toString());
      if (params?.limit) queryParams.set('limit', params.limit.toString());
      if (params?.search) queryParams.set('search', params.search);
      if (params?.company_id) queryParams.set('company_id', params.company_id.toString());

      const url = queryParams.toString() 
        ? `${this.baseURL}?${queryParams.toString()}`
        : this.baseURL;

      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result: ExpenseResponse = await response.json();
      
      if (!result.success) {
        throw new Error('Failed to fetch expenses');
      }

      return {
        data: result.data || [],
        pagination: result.pagination || {
          currentPage: 1,
          totalPages: 1,
          totalItems: result.data?.length || 0,
          itemsPerPage: 20,
          hasNextPage: false,
          hasPreviousPage: false
        }
      };
    } catch (error) {
      console.error('Error fetching expenses:', error);
      return {
        data: [],
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalItems: 0,
          itemsPerPage: 20,
          hasNextPage: false,
          hasPreviousPage: false
        }
      };
    }
  }

  // Search expenses
  async search(searchTerm: string, params?: {
    page?: number;
    limit?: number;
  }): Promise<{ data: Expense[]; pagination: PaginationMeta }> {
    try {
      const queryParams = new URLSearchParams();
      queryParams.set('q', searchTerm);
      
      if (params?.page) queryParams.set('page', params.page.toString());
      if (params?.limit) queryParams.set('limit', params.limit.toString());

      const response = await fetch(`${this.baseURL}/search?${queryParams.toString()}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result: ExpenseResponse = await response.json();
      
      if (!result.success) {
        throw new Error('Failed to search expenses');
      }

      return {
        data: result.data || [],
        pagination: result.pagination || {
          currentPage: 1,
          totalPages: 1,
          totalItems: result.data?.length || 0,
          itemsPerPage: 20,
          hasNextPage: false,
          hasPreviousPage: false
        }
      };
    } catch (error) {
      console.error('Error searching expenses:', error);
      return {
        data: [],
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalItems: 0,
          itemsPerPage: 20,
          hasNextPage: false,
          hasPreviousPage: false
        }
      };
    }
  }

  // Get expense statistics
  async getStats(): Promise<{
    total: number;
    totalAmount: number;
    avgAmount: number;
    today: number;
    thisWeek: number;
    thisMonth: number;
    thisYear: number;
  }> {
    try {
      const response = await fetch(`${this.baseURL}/stats`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result: StatsResponse = await response.json();
      
      if (!result.success) {
        throw new Error('Failed to fetch expense statistics');
      }

      return result.data;
    } catch (error) {
      console.error('Error fetching expense statistics:', error);
      return {
        total: 0,
        totalAmount: 0,
        avgAmount: 0,
        today: 0,
        thisWeek: 0,
        thisMonth: 0,
        thisYear: 0
      };
    }
  }

  // Get expense by ID
  async getById(id: number): Promise<Expense | null> {
    try {
      const response = await fetch(`${this.baseURL}/${id}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result: SingleExpenseResponse = await response.json();
      
      if (!result.success) {
        throw new Error('Failed to fetch expense');
      }

      return result.data;
    } catch (error) {
      console.error('Error fetching expense:', error);
      return null;
    }
  }

  // Create new expense
  async create(data: CreateExpenseData): Promise<Expense> {
    try {
      const response = await fetch(this.baseURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to create expense');
      }

      // Return the created expense by fetching it
      const newExpense = await this.getById(result.data.id);
      if (!newExpense) {
        throw new Error('Failed to retrieve created expense');
      }

      return newExpense;
    } catch (error) {
      console.error('Error creating expense:', error);
      throw error;
    }
  }

  // Update expense
  async update(id: number, data: UpdateExpenseData): Promise<Expense> {
    try {
      const response = await fetch(`${this.baseURL}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to update expense');
      }

      // Return the updated expense by fetching it
      const updatedExpense = await this.getById(id);
      if (!updatedExpense) {
        throw new Error('Failed to retrieve updated expense');
      }

      return updatedExpense;
    } catch (error) {
      console.error('Error updating expense:', error);
      throw error;
    }
  }

  // Delete expense
  async delete(id: number): Promise<void> {
    try {
      const response = await fetch(`${this.baseURL}/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to delete expense');
      }
    } catch (error) {
      console.error('Error deleting expense:', error);
      throw error;
    }
  }

  // Format currency for display
  formatCurrency(amount: number | null): string {
    if (amount === null || amount === undefined) return 'N/A';
    return new Intl.NumberFormat('fr-MA', {
      style: 'currency',
      currency: 'MAD',
    }).format(amount);
  }

  // Format date for display
  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Get category label by value
  getCategoryLabel(category: string): string {
    const found = EXPENSE_CATEGORIES.find(cat => cat.value === category);
    return found ? found.label : category;
  }

  // Export expenses to CSV (client-side)
  exportToCSV(expenses: Expense[]): string {
    const headers = ['ID', 'Nom', 'Montant', 'Utilisateur', 'Entreprise', 'Date de création'];
    const csvContent = [
      headers.join(','),
      ...expenses.map(expense => [
        expense.id,
        `"${expense.name}"`,
        expense.amount,
        `"${expense.user?.name || 'N/A'}"`,
        `"${expense.company?.name || 'N/A'}"`,
        `"${this.formatDate(expense.created_at)}"`
      ].join(','))
    ].join('\n');

    return csvContent;
  }

  // Download CSV file
  downloadCSV(expenses: Expense[], filename = 'expenses.csv'): void {
    const csvContent = this.exportToCSV(expenses);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }
}

export const expenseServiceApi = new ExpenseServiceApi();
export type { Expense, CreateExpenseData, UpdateExpenseData, PaginationMeta };