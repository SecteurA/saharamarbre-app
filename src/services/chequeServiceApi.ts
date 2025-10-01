import { config } from '../config/index';

// Inline types to avoid import issues
interface Cheque {
  id: number;
  check_number: string;
  type: string;
  amount: number;
  date: string;
  client: string;
  excution_date: string | null;
  bank_account: string | null;
  status: string;
  observations: string | null;
  created_at: string;
  updated_at: string;
  user_id: number | null;
  order_id: number | null;
  user?: {
    id: number;
    name: string;
  } | null;
  order?: {
    id: number;
    human_id: string;
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

interface ChequeResponse {
  success: boolean;
  data: Cheque[];
  pagination?: PaginationMeta;
}

interface SingleChequeResponse {
  success: boolean;
  data: Cheque;
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
    byStatus: {
      enCours: number;
      valide: number;
      paye: number;
      impaye: number;
    };
    byType: {
      cheques: number;
      traites: number;
    };
  };
}

interface CreateChequeData {
  check_number: string;
  type: string;
  amount: number;
  date: string;
  client: string;
  excution_date?: string;
  bank_account?: string;
  status?: string;
  observations?: string;
  user_id?: number;
  order_id?: number;
}

interface UpdateChequeData {
  check_number?: string;
  type?: string;
  amount?: number;
  date?: string;
  client?: string;
  excution_date?: string;
  bank_account?: string;
  status?: string;
  observations?: string;
  user_id?: number;
  order_id?: number;
}

// Cheque Types
export const CHEQUE_TYPES = [
  { value: 'CHÈQUE', label: 'Chèque' },
  { value: 'TRAITE', label: 'Traite' },
];

// Cheque Statuses
export const CHEQUE_STATUSES = [
  { value: 'En attente de validation', label: 'En attente de validation' },
  { value: 'En Cours', label: 'En Cours' },
  { value: 'Validé', label: 'Validé' },
  { value: 'Payé', label: 'Payé' },
  { value: 'Impayer', label: 'Impayé' },
];

// Bank Accounts (from Laravel)
export const BANK_ACCOUNTS = [
  { category: 'Professionel', accounts: [
    { value: 'SM', label: 'SM' },
    { value: 'MS', label: 'MS' },
    { value: 'SR', label: 'SR' },
    { value: 'RM', label: 'RM' },
    { value: 'MAR', label: 'MAR' },
    { value: 'ALBAYT', label: 'ALBAYT' },
    { value: 'TRAV', label: 'TRAV' },
    { value: 'CHERAT', label: 'CHERAT' },
    { value: 'STONEM', label: 'STONEM' },
    { value: 'NADINE C', label: 'NADINE C' },
    { value: 'SOURM', label: 'SOURM' },
    { value: 'NORAT', label: 'NOTRAT' },
  ]},
  { category: 'Personnel', accounts: [
    { value: 'HZ', label: 'HZ' },
    { value: 'BB', label: 'BB' },
    { value: 'BL', label: 'BL' },
    { value: 'BZ', label: 'BZ' },
    { value: 'BM', label: 'BM' },
    { value: 'MERYEM', label: 'MERYEM' },
  ]},
];

class ChequeServiceApi {
  private baseURL: string;

  constructor() {
    this.baseURL = `${config.api.baseUrl}/cheques`;
  }

  // Get all cheques with pagination and search
  async getAll(params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    type?: string;
  }): Promise<{ data: Cheque[]; pagination: PaginationMeta }> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params?.page) queryParams.set('page', params.page.toString());
      if (params?.limit) queryParams.set('limit', params.limit.toString());
      if (params?.search) queryParams.set('search', params.search);
      if (params?.status) queryParams.set('status', params.status);
      if (params?.type) queryParams.set('type', params.type);

      const url = queryParams.toString() 
        ? `${this.baseURL}?${queryParams.toString()}`
        : this.baseURL;

      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result: ChequeResponse = await response.json();
      
      if (!result.success) {
        throw new Error('Failed to fetch cheques');
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
      console.error('Error fetching cheques:', error);
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

  // Search cheques
  async search(searchTerm: string, params?: {
    page?: number;
    limit?: number;
  }): Promise<{ data: Cheque[]; pagination: PaginationMeta }> {
    try {
      const queryParams = new URLSearchParams();
      queryParams.set('q', searchTerm);
      
      if (params?.page) queryParams.set('page', params.page.toString());
      if (params?.limit) queryParams.set('limit', params.limit.toString());

      const response = await fetch(`${this.baseURL}/search?${queryParams.toString()}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result: ChequeResponse = await response.json();
      
      if (!result.success) {
        throw new Error('Failed to search cheques');
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
      console.error('Error searching cheques:', error);
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

  // Get cheque statistics
  async getStats(): Promise<{
    total: number;
    totalAmount: number;
    avgAmount: number;
    today: number;
    thisWeek: number;
    thisMonth: number;
    thisYear: number;
    byStatus: {
      enCours: number;
      valide: number;
      paye: number;
      impaye: number;
    };
    byType: {
      cheques: number;
      traites: number;
    };
  }> {
    try {
      const response = await fetch(`${this.baseURL}/stats`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result: StatsResponse = await response.json();
      
      if (!result.success) {
        throw new Error('Failed to fetch cheque statistics');
      }

      return result.data;
    } catch (error) {
      console.error('Error fetching cheque statistics:', error);
      return {
        total: 0,
        totalAmount: 0,
        avgAmount: 0,
        today: 0,
        thisWeek: 0,
        thisMonth: 0,
        thisYear: 0,
        byStatus: {
          enCours: 0,
          valide: 0,
          paye: 0,
          impaye: 0
        },
        byType: {
          cheques: 0,
          traites: 0
        }
      };
    }
  }

  // Get cheque by ID
  async getById(id: number): Promise<Cheque | null> {
    try {
      const response = await fetch(`${this.baseURL}/${id}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result: SingleChequeResponse = await response.json();
      
      if (!result.success) {
        throw new Error('Failed to fetch cheque');
      }

      return result.data;
    } catch (error) {
      console.error('Error fetching cheque:', error);
      return null;
    }
  }

  // Create new cheque
  async create(data: CreateChequeData): Promise<Cheque> {
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
        throw new Error(result.message || 'Failed to create cheque');
      }

      // Return the created cheque by fetching it
      const newCheque = await this.getById(result.data.id);
      if (!newCheque) {
        throw new Error('Failed to retrieve created cheque');
      }

      return newCheque;
    } catch (error) {
      console.error('Error creating cheque:', error);
      throw error;
    }
  }

  // Update cheque
  async update(id: number, data: UpdateChequeData): Promise<Cheque> {
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
        throw new Error(result.message || 'Failed to update cheque');
      }

      // Return the updated cheque by fetching it
      const updatedCheque = await this.getById(id);
      if (!updatedCheque) {
        throw new Error('Failed to retrieve updated cheque');
      }

      return updatedCheque;
    } catch (error) {
      console.error('Error updating cheque:', error);
      throw error;
    }
  }

  // Delete cheque
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
        throw new Error(result.message || 'Failed to delete cheque');
      }
    } catch (error) {
      console.error('Error deleting cheque:', error);
      throw error;
    }
  }

  // Get status color for UI
  getStatusColor(status: string): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' {
    switch (status) {
      case 'Payé':
        return 'success';
      case 'Validé':
        return 'info';
      case 'En Cours':
        return 'primary';
      case 'Impayer':
        return 'error';
      case 'En attente de validation':
        return 'warning';
      default:
        return 'default';
    }
  }

  // Get type color for UI
  getTypeColor(type: string): 'default' | 'primary' | 'secondary' {
    switch (type) {
      case 'CHÈQUE':
        return 'primary';
      case 'TRAITE':
        return 'secondary';
      default:
        return 'default';
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
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  }

  // Format datetime for display
  formatDateTime(date: string): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Export cheques to CSV (client-side)
  exportToCSV(cheques: Cheque[]): string {
    const headers = [
      'ID', 'N° Chèque', 'Type', 'Montant', 'Date Échéance', 'Client', 
      'Bénéficiaire', 'Statut', 'Date Création', 'Utilisateur'
    ];
    const csvContent = [
      headers.join(','),
      ...cheques.map(cheque => [
        cheque.id,
        `"${cheque.check_number}"`,
        `"${cheque.type}"`,
        cheque.amount,
        `"${this.formatDate(cheque.date)}"`,
        `"${cheque.client}"`,
        `"${cheque.bank_account || 'N/A'}"`,
        `"${cheque.status}"`,
        `"${this.formatDateTime(cheque.created_at)}"`,
        `"${cheque.user?.name || 'N/A'}"`
      ].join(','))
    ].join('\n');

    return csvContent;
  }

  // Download CSV file
  downloadCSV(cheques: Cheque[], filename = 'cheques.csv'): void {
    const csvContent = this.exportToCSV(cheques);
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

  // Get flat bank accounts list for select options
  getFlatBankAccounts(): Array<{ value: string; label: string }> {
    const flat: Array<{ value: string; label: string }> = [];
    BANK_ACCOUNTS.forEach(category => {
      category.accounts.forEach(account => {
        flat.push(account);
      });
    });
    return flat;
  }
}

export const chequeServiceApi = new ChequeServiceApi();
export type { Cheque, CreateChequeData, UpdateChequeData, PaginationMeta };