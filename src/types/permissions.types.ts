// Permission System Types - matching Laravel Spatie permission system

export interface Permission {
  id: number
  name: string
  guard_name: string
  description?: string
  module?: string
  action?: string
  created_at: string
  updated_at: string
}

export interface Role {
  id: number
  name: string
  guard_name: string
  description?: string
  is_default: boolean
  company_id?: number
  created_at: string
  updated_at: string
  
  // Relations
  company?: Company
  permissions?: Permission[]
  users_count?: number
}

export interface ModelHasPermissions {
  permission_id: number
  model_type: string
  model_id: number
  created_at: string
  
  // Relations
  permission?: Permission
}

export interface ModelHasRoles {
  role_id: number
  model_type: string
  model_id: number
  created_at: string
  
  // Relations
  role?: Role
}

export interface RoleHasPermissions {
  permission_id: number
  role_id: number
  created_at: string
  
  // Relations
  permission?: Permission
  role?: Role
}

// Enhanced User type with permissions and roles
export interface UserWithPermissions {
  id: number
  auth_user_id: string
  name: string
  email: string
  phone?: string
  role_name?: string
  role_id?: number
  company_id?: number
  created_at: string
  updated_at: string
  deleted_at?: string
  
  // Relations
  company?: Company
  role?: Role
  permissions?: Permission[]
  roles?: Role[]
  
  // Computed properties
  all_permissions?: Permission[]
  is_super_admin?: boolean
  is_admin?: boolean
}

// Permission checking utilities
export interface PermissionChecker {
  hasPermission: (permission: string) => boolean
  hasRole: (role: string) => boolean
  hasAnyPermission: (permissions: string[]) => boolean
  hasAllPermissions: (permissions: string[]) => boolean
  hasAnyRole: (roles: string[]) => boolean
  canAccessModule: (module: string, action?: string) => boolean
}

// Permission module definitions
export type PermissionModule = 
  | 'companies'
  | 'clients' 
  | 'products'
  | 'orders'
  | 'quotes'
  | 'payments'
  | 'cheques'
  | 'stocks'
  | 'drivers'
  | 'expenses'
  | 'reports'
  | 'users'
  | 'system'

export type PermissionAction = 
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'export'
  | 'import'
  | 'approve'
  | 'validate'
  | 'convert'
  | 'send'
  | 'print'
  | 'assign'
  | 'audit'
  | 'manage'
  | 'settings'
  | 'backup'
  | 'roles'
  | 'permissions'

// Default role names
export type DefaultRoleName = 
  | 'Super Administrator'
  | 'Administrator'
  | 'Manager'
  | 'Commercial'
  | 'Accountant'
  | 'Stock Manager'
  | 'Driver'
  | 'Viewer'

// Permission constants for easy reference
export const PERMISSIONS = {
  // Company permissions
  COMPANIES_CREATE: 'companies.create',
  COMPANIES_VIEW: 'companies.view',
  COMPANIES_UPDATE: 'companies.update',
  COMPANIES_DELETE: 'companies.delete',
  COMPANIES_EXPORT: 'companies.export',
  
  // Client permissions
  CLIENTS_CREATE: 'clients.create',
  CLIENTS_VIEW: 'clients.view',
  CLIENTS_UPDATE: 'clients.update',
  CLIENTS_DELETE: 'clients.delete',
  CLIENTS_EXPORT: 'clients.export',
  CLIENTS_IMPORT: 'clients.import',
  
  // Product permissions
  PRODUCTS_CREATE: 'products.create',
  PRODUCTS_VIEW: 'products.view',
  PRODUCTS_UPDATE: 'products.update',
  PRODUCTS_DELETE: 'products.delete',
  PRODUCTS_EXPORT: 'products.export',
  PRODUCTS_MANAGE_INVENTORY: 'products.manage_inventory',
  
  // Order permissions
  ORDERS_CREATE: 'orders.create',
  ORDERS_VIEW: 'orders.view',
  ORDERS_UPDATE: 'orders.update',
  ORDERS_DELETE: 'orders.delete',
  ORDERS_APPROVE: 'orders.approve',
  ORDERS_EXPORT: 'orders.export',
  ORDERS_PRINT: 'orders.print',
  
  // Quote permissions
  QUOTES_CREATE: 'quotes.create',
  QUOTES_VIEW: 'quotes.view',
  QUOTES_UPDATE: 'quotes.update',
  QUOTES_DELETE: 'quotes.delete',
  QUOTES_CONVERT: 'quotes.convert',
  QUOTES_SEND: 'quotes.send',
  QUOTES_EXPORT: 'quotes.export',
  
  // Payment permissions
  PAYMENTS_CREATE: 'payments.create',
  PAYMENTS_VIEW: 'payments.view',
  PAYMENTS_UPDATE: 'payments.update',
  PAYMENTS_DELETE: 'payments.delete',
  PAYMENTS_APPROVE: 'payments.approve',
  PAYMENTS_EXPORT: 'payments.export',
  
  // Cheque permissions
  CHEQUES_CREATE: 'cheques.create',
  CHEQUES_VIEW: 'cheques.view',
  CHEQUES_UPDATE: 'cheques.update',
  CHEQUES_DELETE: 'cheques.delete',
  CHEQUES_VALIDATE: 'cheques.validate',
  CHEQUES_EXPORT: 'cheques.export',
  
  // Stock permissions
  STOCKS_VIEW: 'stocks.view',
  STOCKS_UPDATE: 'stocks.update',
  STOCKS_EXPORT: 'stocks.export',
  STOCKS_AUDIT: 'stocks.audit',
  
  // Driver permissions
  DRIVERS_CREATE: 'drivers.create',
  DRIVERS_VIEW: 'drivers.view',
  DRIVERS_UPDATE: 'drivers.update',
  DRIVERS_DELETE: 'drivers.delete',
  DRIVERS_ASSIGN: 'drivers.assign',
  
  // Expense permissions
  EXPENSES_CREATE: 'expenses.create',
  EXPENSES_VIEW: 'expenses.view',
  EXPENSES_UPDATE: 'expenses.update',
  EXPENSES_DELETE: 'expenses.delete',
  EXPENSES_APPROVE: 'expenses.approve',
  EXPENSES_EXPORT: 'expenses.export',
  
  // Report permissions
  REPORTS_VIEW: 'reports.view',
  REPORTS_EXPORT: 'reports.export',
  REPORTS_CREATE: 'reports.create',
  
  // User permissions
  USERS_CREATE: 'users.create',
  USERS_VIEW: 'users.view',
  USERS_UPDATE: 'users.update',
  USERS_DELETE: 'users.delete',
  USERS_MANAGE_ROLES: 'users.manage_roles',
  USERS_MANAGE_PERMISSIONS: 'users.manage_permissions',
  
  // System permissions
  SYSTEM_SETTINGS: 'system.settings',
  SYSTEM_BACKUP: 'system.backup',
  SYSTEM_AUDIT: 'system.audit',
} as const

export const ROLES = {
  SUPER_ADMIN: 'Super Administrator',
  ADMIN: 'Administrator',
  MANAGER: 'Manager',
  COMMERCIAL: 'Commercial',
  ACCOUNTANT: 'Accountant',
  STOCK_MANAGER: 'Stock Manager',
  DRIVER: 'Driver',
  VIEWER: 'Viewer',
} as const

// Helper type for permission checking
export interface PermissionGuard {
  module: PermissionModule
  action: PermissionAction
  resource?: string
}

// API Response types for permission operations
export interface PermissionResponse {
  success: boolean
  data?: any
  error?: string
  permissions?: Permission[]
}

export interface RoleResponse {
  success: boolean
  data?: any
  error?: string
  roles?: Role[]
}

// Re-export existing types with permission extensions
import type { Company } from './database.types'

export type { Company }