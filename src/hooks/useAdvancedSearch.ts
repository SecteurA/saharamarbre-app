import { useState, useEffect, useMemo } from 'react';
import { MySQLClient } from '../lib/mysql';

export interface SearchConfig {
  table: string;
  searchFields: string[];
  selectFields?: string;
  joinTables?: Array<{
    table: string;
    on: string;
    select: string;
  }>;
}

export interface SearchFilters {
  search?: string;
  filters: Record<string, any>;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

export interface PaginationConfig {
  page: number;
  pageSize: number;
}

export interface SearchResult<T> {
  data: T[];
  count: number;
  loading: boolean;
  error: string | null;
}

export function useAdvancedSearch<T = any>(
  config: SearchConfig,
  initialFilters: SearchFilters = { filters: {} },
  pagination: PaginationConfig = { page: 0, pageSize: 25 }
): SearchResult<T> & {
  setFilters: (filters: SearchFilters) => void;
  setPagination: (pagination: PaginationConfig) => void;
  refetch: () => Promise<void>;
} {
  const [data, setData] = useState<T[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<SearchFilters>(initialFilters);
  const [paginationState, setPagination] = useState<PaginationConfig>(pagination);

  const buildParams = useMemo(() => {
    const params: Record<string, any> = {};
    
    // Add search term
    if (filters.search && filters.search.trim()) {
      params.search = filters.search.trim();
    }
    
    // Add custom filters
    Object.entries(filters.filters).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        params[key] = value;
      }
    });
    
    // Add sorting
    if (filters.sortBy) {
      params.sortBy = filters.sortBy;
      params.sortDirection = filters.sortDirection || 'asc';
    }
    
    // Add pagination
    params.page = paginationState.page + 1; // API expects 1-based pages
    params.limit = paginationState.pageSize;
    
    return params;
  }, [filters, paginationState]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = buildParams;
      const endpoint = `/${config.table}`;
      const response = await MySQLClient.getPaginated<T>(endpoint, params);

      setData(response.data || []);
      setCount(response.pagination.total || 0);
    } catch (err) {
      console.error('Search error:', err);
      setError(err instanceof Error ? err.message : 'Search failed');
      setData([]);
      setCount(0);
    } finally {
      setLoading(false);
    }
  };

  const refetch = async () => {
    await fetchData();
  };

  useEffect(() => {
    fetchData();
  }, [filters, paginationState, buildParams]);

  return {
    data,
    count,
    loading,
    error,
    setFilters,
    setPagination,
    refetch
  };
}

// Utility functions for common search operations
export const searchHelpers = {
  // Create a text search filter
  textSearch: (field: string, value: string) => ({
    [field]: `%${value}%`
  }),

  // Create a date range filter
  dateRange: (field: string, startDate: string, endDate: string) => ({
    [`${field}_start`]: { operator: 'gte', value: startDate },
    [`${field}_end`]: { operator: 'lte', value: endDate }
  }),

  // Create a number range filter
  numberRange: (field: string, min?: number, max?: number) => {
    const filters: Record<string, any> = {};
    if (min !== undefined) {
      filters[`${field}_min`] = { operator: 'gte', value: min };
    }
    if (max !== undefined) {
      filters[`${field}_max`] = { operator: 'lte', value: max };
    }
    return filters;
  },

  // Create an "in" filter for multiple values
  inFilter: (field: string, values: any[]) => ({
    [field]: { operator: 'in', value: values }
  }),

  // Create a "not equal" filter
  notEqual: (field: string, value: any) => ({
    [field]: { operator: 'not', value }
  })
};

// Pre-configured search configs for common tables
export const searchConfigs = {
  orders: {
    table: 'orders',
    searchFields: ['human_id', 'order_ref', 'worksite'],
    selectFields: `
      *,
      clients(name),
      companies(name)
    `
  },
  
  clients: {
    table: 'clients',
    searchFields: ['name', 'email', 'phone', 'address'],
    selectFields: '*'
  },
  
  products: {
    table: 'products',
    searchFields: ['name', 'reference'],
    selectFields: `
      *,
      types(name)
    `
  },
  
  companies: {
    table: 'companies',
    searchFields: ['name', 'email', 'phone', 'address'],
    selectFields: '*'
  },
  
  drivers: {
    table: 'drivers',
    searchFields: ['name', 'phone', 'cin'],
    selectFields: '*'
  },
  
  users: {
    table: 'users',
    searchFields: ['name', 'email'],
    selectFields: '*'
  },
  
  payments: {
    table: 'payments',
    searchFields: ['payment_method', 'notes'],
    selectFields: `
      *,
      orders(human_id, clients(name))
    `
  },
  
  cheques: {
    table: 'cheques',
    searchFields: ['cheque_number', 'bank_name', 'drawer_name'],
    selectFields: `
      *,
      orders(human_id, clients(name))
    `
  }
};