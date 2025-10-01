import ApiClient from '../lib/api';

export interface BankAccount {
  id: number;
  name: string;
  rib: string;
  type: string;
}

export interface CreateBankAccountData {
  name: string;
  rib: string;
  type: string;
}

export interface UpdateBankAccountData extends Partial<CreateBankAccountData> {}

export interface BankAccountsResponse {
  data: BankAccount[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface AccountType {
  value: string;
  label: string;
}

// Function exports
export async function getBankAccounts(page = 1, limit = 20, search = ''): Promise<BankAccountsResponse> {
  try {
    console.log('🔍 Fetching bank accounts from API...');
    const response = await ApiClient.get(`/bank-accounts?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`);
    console.log('📡 Bank accounts API response:', response);
    
    return {
      data: response.data || [],
      pagination: response.pagination || { page, limit, total: 0, pages: 0 }
    };
  } catch (error: any) {
    console.error('Failed to fetch bank accounts:', error);
    throw new Error(error.response?.data?.error || 'Failed to fetch bank accounts');
  }
}

export async function getBankAccountById(id: number): Promise<BankAccount> {
  try {
    const response = await ApiClient.get(`/bank-accounts/${id}`);
    return response.data?.data;
  } catch (error: any) {
    console.error('Failed to fetch bank account:', error);
    throw new Error(error.response?.data?.error || 'Failed to fetch bank account');
  }
}

export async function createBankAccount(accountData: CreateBankAccountData): Promise<BankAccount> {
  try {
    const response = await ApiClient.post('/bank-accounts', accountData);
    return response.data?.data;
  } catch (error: any) {
    console.error('Failed to create bank account:', error);
    throw new Error(error.response?.data?.error || 'Failed to create bank account');
  }
}

export async function updateBankAccount(id: number, accountData: UpdateBankAccountData): Promise<BankAccount> {
  try {
    const response = await ApiClient.put(`/bank-accounts/${id}`, accountData);
    return response.data?.data;
  } catch (error: any) {
    console.error('Failed to update bank account:', error);
    throw new Error(error.response?.data?.error || 'Failed to update bank account');
  }
}

export async function deleteBankAccount(id: number): Promise<void> {
  try {
    await ApiClient.delete(`/bank-accounts/${id}`);
  } catch (error: any) {
    console.error('Failed to delete bank account:', error);
    throw new Error(error.response?.data?.error || 'Failed to delete bank account');
  }
}

export async function getBankAccountOptions(): Promise<{id: number, name: string}[]> {
  try {
    const response = await ApiClient.get('/bank-accounts/options');
    return response.data?.data || [];
  } catch (error: any) {
    console.error('Failed to fetch bank account options:', error);
    throw new Error(error.response?.data?.error || 'Failed to fetch bank account options');
  }
}

export async function getAccountTypes(): Promise<AccountType[]> {
  try {
    const response = await ApiClient.get('/bank-accounts/types');
    return response.data?.data || [];
  } catch (error: any) {
    console.error('Failed to fetch account types:', error);
    throw new Error(error.response?.data?.error || 'Failed to fetch account types');
  }
}

// Class-based service to match existing usage patterns
export class BankAccountService {
  // Get all bank accounts with pagination and search
  static async getAll(page = 1, limit = 20, search = '') {
    try {
      const response = await getBankAccounts(page, limit, search);
      return {
        data: response.data,
        pagination: response.pagination,
        success: true,
        error: null
      };
    } catch (error: any) {
      return {
        data: [] as BankAccount[],
        pagination: { page, limit, total: 0, pages: 0 },
        success: false,
        error: error.message || 'Failed to fetch bank accounts'
      };
    }
  }

  // Get bank account by ID
  static async getById(id: number) {
    try {
      const account = await getBankAccountById(id);
      return {
        data: account,
        success: true,
        error: null
      };
    } catch (error: any) {
      return {
        data: null,
        success: false,
        error: error.message || 'Failed to fetch bank account'
      };
    }
  }

  // Create new bank account
  static async create(accountData: CreateBankAccountData) {
    try {
      const account = await createBankAccount(accountData);
      return {
        data: account,
        success: true,
        error: null
      };
    } catch (error: any) {
      return {
        data: null,
        success: false,
        error: error.message || 'Failed to create bank account'
      };
    }
  }

  // Update bank account
  static async update(id: number, accountData: UpdateBankAccountData) {
    try {
      const account = await updateBankAccount(id, accountData);
      return {
        data: account,
        success: true,
        error: null
      };
    } catch (error: any) {
      return {
        data: null,
        success: false,
        error: error.message || 'Failed to update bank account'
      };
    }
  }

  // Delete bank account
  static async delete(id: number) {
    try {
      await deleteBankAccount(id);
      return {
        success: true,
        error: null
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to delete bank account'
      };
    }
  }

  // Get bank account options for dropdowns
  static async getOptions() {
    try {
      const options = await getBankAccountOptions();
      return {
        data: options,
        success: true,
        error: null
      };
    } catch (error: any) {
      return {
        data: [],
        success: false,
        error: error.message || 'Failed to fetch bank account options'
      };
    }
  }

  // Get account types
  static async getTypes() {
    try {
      const types = await getAccountTypes();
      return {
        data: types,
        success: true,
        error: null
      };
    } catch (error: any) {
      return {
        data: [],
        success: false,
        error: error.message || 'Failed to fetch account types'
      };
    }
  }
}

// Export both named and default exports to match existing usage patterns
export default BankAccountService;