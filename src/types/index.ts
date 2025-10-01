// Import database types
import type { 
  Order, 
  OrderItem, 
  Client, 
  Product, 
  Company, 
  User 
} from './database.types';

// Export all database types
export * from './database.types';

// Common API Response Types
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  error?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T> {
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

// Order-related interfaces (for reception slips, issue slips, return slips)
export interface OrderRelatedSlip {
  id: number;
  human_id: string;
  client_id: number;
  company_id: number | null;
  salesperson: number | null;
  driver: string | null;
  plate: string | null;
  worksite: string | null;
  order_ref: string | null;
  is_free: boolean;
  tax_rate: number;
  template: string | null;
  taxable_amount: number;
  total_taxes: number;
  total_amount: number;
  paid_amount: number;
  remaining_amount: number;
  notes: string | null;
  status: string;
  payment_status: string;
  type: string;
  created_at: string;
  updated_at: string;
  // Relations
  client?: {
    id: number;
    nom: string;
    phone?: string;
    email?: string;
    address?: string;
  } | null;
  company?: {
    id: number;
    name: string;
    address?: string;
  } | null;
  user?: {
    id: number;
    name: string;
  } | null;
  items?: OrderItem[];
  items_count?: number;
  total_items_quantity?: number;
}

// Reception Slip specific types
export interface ReceptionSlip extends OrderRelatedSlip {
  type: 'receipt slip';
}

export interface ReceptionSlipFormData {
  client_id: number;
  company_id?: number | null;
  salesperson?: number | null;
  driver?: string | null;
  plate?: string | null;
  worksite?: string | null;
  order_ref?: string | null;
  is_free?: boolean;
  tax_rate?: number;
  template?: string | null;
  notes?: string | null;
  status?: string;
  payment_status?: string;
  items?: OrderItemFormData[];
}

export interface OrderItemFormData {
  product_id?: number | null;
  quantity?: number;
  unit_price?: number;
  total_price?: number;
  group_number?: number | null;
  type?: string | null;
  product_name?: string | null;
  options?: string | null;
  state?: string | null;
  splicer?: number | null;
  length?: number | null;
  width?: number | null;
  total_quantity?: number | null;
  full_product_description?: string | null;
  measures?: string | null;
  unit?: string | null;
}

// Statistics types
export interface ReceptionSlipStats {
  total: number;
  pending: number;
  confirmed: number;
  processing: number;
  completed: number;
  cancelled: number;
  unpaid: number;
  paid: number;
  partial: number;
  totalAmount: number;
  pendingAmount: number;
  completedAmount: number;
  avgAmount: number;
  maxAmount: number;
}

// Issue Slip types (reuse OrderRelatedSlip)
export interface IssueSlip extends OrderRelatedSlip {
  type: 'issue slip';
}

export interface IssueSlipFormData extends ReceptionSlipFormData {}

export interface IssueSlipStats extends ReceptionSlipStats {}

// Return Slip types (reuse OrderRelatedSlip)
export interface ReturnSlip extends OrderRelatedSlip {
  type: 'return slip';
}

export interface ReturnSlipFormData extends ReceptionSlipFormData {}

export interface ReturnSlipStats extends ReceptionSlipStats {}

// Quote types (reuse Order structure)
export interface Quote extends Order {
  type: 'quote';
  // Relations
  client?: {
    id: number;
    nom: string;
    phone?: string;
    email?: string;
    address?: string;
  } | null;
  company?: {
    id: number;
    name: string;
    address?: string;
  } | null;
  template_company?: {
    id: number;
    name: string;
    address?: string;
  } | null;
  user?: {
    id: number;
    name: string;
  } | null;
  items?: OrderItem[];
}

export interface QuoteFormData {
  client_id: number;
  company_id?: number | null;
  salesperson?: number | null;
  driver?: string | null;
  plate?: string | null;
  worksite?: string | null;
  order_ref?: string | null;
  is_free?: boolean;
  tax_rate?: number;
  template?: string | null;
  notes?: string | null;
  status?: string;
  payment_status?: string;
  items?: OrderItemFormData[];
}

export interface QuoteStats extends ReceptionSlipStats {}

// Enhanced Order interface
export interface OrderWithRelations extends Order {
  // Relations
  client?: {
    id: number;
    nom: string;
    phone?: string;
    email?: string;
    address?: string;
  } | null;
  company?: {
    id: number;
    name: string;
    address?: string;
  } | null;
  user?: {
    id: number;
    name: string;
  } | null;
  items?: OrderItem[];
  items_count?: number;
  total_items_quantity?: number;
}

export interface OrderFormData extends ReceptionSlipFormData {}

export interface OrderStats extends ReceptionSlipStats {}

// Search and filter types
export interface SearchFilters {
  search?: string;
  status?: string;
  client_id?: string;
  company_id?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Common status options
export const ORDER_STATUSES = [
  'pending',
  'confirmed', 
  'processing',
  'completed',
  'cancelled'
] as const;

export const PAYMENT_STATUSES = [
  'unpaid',
  'partial',
  'paid'
] as const;

export type OrderStatus = typeof ORDER_STATUSES[number];
export type PaymentStatus = typeof PAYMENT_STATUSES[number];

// Enhanced Client interface with additional fields
export interface ClientWithDetails extends Client {
  nom: string; // Laravel uses 'nom' instead of 'name'
  email?: string;
}

// Enhanced Product interface
export interface ProductWithDetails extends Product {
  // Product already has optional price, no need to override
}

// Enhanced Company interface
export interface CompanyWithDetails extends Company {
  // Already has all necessary fields
}

// Enhanced User interface
export interface UserWithDetails extends User {
  // Already has all necessary fields
}

// Form validation schemas
export interface ValidationErrors {
  [key: string]: string[];
}