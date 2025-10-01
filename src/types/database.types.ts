// Database Types - MySQL Backend
// These types match the MySQL database structure from the Laravel backend

export interface User {
  id: number;
  name: string;
  email: string;
  email_verified_at?: string | null;
  role: string;
  created_at: string;
  updated_at: string;
}

export interface Company {
  id: number;
  name: string;
  address?: string | null;
  city?: string | null;
  phone?: string | null;
  email?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: number;
  name: string;
  nom: string; // Laravel uses 'nom' field
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: number;
  name: string;
  description?: string | null;
  price?: number;
  stock_quantity?: number;
  unit?: string | null;
  category?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: number;
  human_id?: string | null;
  order_number?: string | null;
  order_date: string;
  delivery_date?: string | null;
  status: string;
  payment_status?: string;
  client_id: number;
  company_id?: number | null;
  user_id?: number | null;
  template_id?: number | null; // Added for Laravel ENTETE DE field
  salesperson?: number | null;
  driver?: string | null;
  plate?: string | null;
  worksite?: string | null;
  order_ref?: string | null;
  is_free?: boolean;
  tax_rate?: number;
  template?: string | null;
  taxable_amount?: number;
  total_taxes?: number;
  total_amount?: number;
  paid_amount?: number;
  remaining_amount?: number;
  notes?: string | null;
  type?: string;
  created_at: string;
  updated_at: string;
  // Relations
  client?: Client;
  company?: Company;
  user?: User;
  items?: OrderItem[];
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id?: number | null;
  product_name?: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
  group_number?: number | null;
  type?: string | null;
  options?: string | null;
  state?: string | null;
  splicer?: number | null;
  length?: number | null;
  width?: number | null;
  total_quantity?: number | null;
  full_product_description?: string | null;
  measures?: string | null;
  unit?: string | null;
  created_at: string;
  updated_at: string;
  // Relations
  product?: Product;
  order?: Order;
}

export interface NewOrderItem {
  product_id: number;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface QuoteItem {
  id: number;
  quote_id: number;
  product_id?: number | null;
  product_name?: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at: string;
  updated_at: string;
  // Relations
  product?: Product;
}

export interface Expense {
  id: number;
  name: string;
  amount: number;
  category: string;
  description?: string | null;
  user_id: number;
  created_at: string;
  updated_at: string;
  // Relations
  user?: User;
}

export interface Cheque {
  id: number;
  cheque_number: string;
  amount: number;
  bank_name?: string | null;
  issue_date: string;
  due_date?: string | null;
  status: string;
  client_id?: number | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  // Relations
  client?: Client;
}

export interface BankAccount {
  id: number;
  account_name: string;
  bank_name: string;
  account_number: string;
  balance: number;
  created_at: string;
  updated_at: string;
}

export interface Stock {
  id: number;
  product_id: number;
  quantity: number;
  minimum_stock?: number;
  maximum_stock?: number;
  location?: string | null;
  created_at: string;
  updated_at: string;
  // Relations
  product?: Product;
}

export interface Driver {
  id: number;
  name: string;
  license_number?: string | null;
  phone?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Responsable {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  role: string;
  company_id?: number | null;
  created_at: string;
  updated_at: string;
  // Relations
  company?: Company;
}

// API Response types for paginated data
export interface PaginationInfo {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  pages: number;
  from: number;
  to: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationInfo;
  success: boolean;
  message?: string;
}

// Specific response types for services
export type OrdersResponse = PaginatedResponse<Order>;
export type ClientsResponse = PaginatedResponse<Client>;
export type ProductsResponse = PaginatedResponse<Product>;
export type CompaniesResponse = PaginatedResponse<Company>;
export type UsersResponse = PaginatedResponse<User>;
export type ExpensesResponse = PaginatedResponse<Expense>;
export type ChequesResponse = PaginatedResponse<Cheque>;
export type StocksResponse = PaginatedResponse<Stock>;
export type DriversResponse = PaginatedResponse<Driver>;
export type ResponsablesResponse = PaginatedResponse<Responsable>;

// Form Data types (for creating/updating)
export interface CreateOrderData {
  client_id: number;
  company_id?: number | null;
  order_date: string;
  delivery_date?: string | null;
  status?: string;
  payment_status?: string;
  salesperson?: number | null;
  driver?: string | null;
  plate?: string | null;
  worksite?: string | null;
  order_ref?: string | null;
  is_free?: boolean;
  tax_rate?: number;
  notes?: string | null;
  type?: string;
  items?: Omit<OrderItem, 'id' | 'order_id' | 'created_at' | 'updated_at'>[];
  order_items?: Omit<OrderItem, 'id' | 'order_id' | 'created_at' | 'updated_at'>[];
}

export interface UpdateOrderData extends Partial<CreateOrderData> {
  id: number;
}

export interface CreateClientData {
  name: string;
  nom: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
}

export interface UpdateClientData extends Partial<CreateClientData> {
  id: number;
}

export interface CreateQuoteData {
  client_id: number;
  company_id?: number | null;
  quote_date: string;
  expiry_date?: string | null;
  status?: string;
  payment_status?: string;
  salesperson?: number | null;
  driver?: string | null;
  plate?: string | null;
  worksite?: string | null;
  order_ref?: string | null;
  is_free?: boolean;
  tax_rate?: number;
  notes?: string | null;
  type?: string;
  items?: Omit<QuoteItem, 'id' | 'quote_id' | 'created_at' | 'updated_at'>[];
  quote_items?: Omit<QuoteItem, 'id' | 'quote_id' | 'created_at' | 'updated_at'>[];
}

export interface UpdateQuoteData extends Partial<CreateQuoteData> {
  id: number;
}

export interface Quote {
  id: number;
  uuid?: string;
  quote_number: string;
  human_id?: string;
  client_id: number;
  company_id?: number | null;
  user_id?: number | null;
  quote_date?: string; // For compatibility
  created_at: string;
  updated_at: string;
  expiry_date?: string | null;
  status: string;
  payment_status?: string | null;
  taxable_amount?: number;
  total_amount?: number;
  total_taxes?: number;
  tax_rate?: number;
  driver?: string | null;
  plate?: string | null;
  worksite?: string | null;
  order_ref?: string | null;
  is_free?: boolean;
  notes?: string | null;
  type?: string;
  converted_to_order?: boolean;
  // Relations
  client?: Client;
  company?: Company;
  user?: User;
  items?: any[]; // Laravel OrderItem structure
}

export interface CreateProductData {
  name: string;
  description?: string;
  price: number;
  stock_quantity?: number;
  unit?: string;
  category?: string;
}

export interface UpdateProductData extends Partial<CreateProductData> {
  id: number;
}

export interface CreateCompanyData {
  name: string;
  address?: string;
  city?: string;
  phone?: string;
  email?: string;
}

export interface UpdateCompanyData extends Partial<CreateCompanyData> {
  id: number;
}

export interface CreateExpenseData {
  name: string;
  amount: number;
  category: string;
  description?: string;
  company_id?: number;
  user_id?: number;
}

export interface UpdateExpenseData extends Partial<CreateExpenseData> {
  id: number;
}

export interface CreateChequeData {
  cheque_number: string;
  amount: number;
  bank_name?: string;
  issue_date: string;
  due_date?: string;
  status?: string;
  client_id?: number;
  notes?: string;
}

export interface UpdateChequeData extends Partial<CreateChequeData> {
  id: number;
}

export interface CreateResponsableData {
  name: string;
  email: string;
  phone?: string;
  role: string;
  company_id?: number;
}

export interface UpdateResponsableData extends Partial<CreateResponsableData> {
  id: number;
}

// Auth types
export interface AuthUser extends User {
  permissions?: string[];
}

export interface AuthContextType {
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  signOut: () => void;
  loading: boolean;
  isConfigured: boolean;
  isDemoMode: boolean;
}