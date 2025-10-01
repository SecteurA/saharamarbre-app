// API Response Types (inlined to avoid import issues)
interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
}

interface PaginationInfo {
  currentPage: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

interface PaginatedResponse<T> {
  success: boolean
  data: T[]
  pagination: PaginationInfo
}

interface PaginationParams {
  page?: number
  limit?: number
  search?: string
  company_id?: number
}

// Payment Slip Types
export interface PaymentSlip {
  id: number
  human_id: string
  order_ref: string
  client_id: number
  company_id?: number
  user_id?: number
  driver?: string
  plate?: string
  worksite?: string
  tax_rate: number
  template_id?: number
  notes?: string
  total_amount: number
  taxable_amount: number
  payment_status: string
  created_at: string
  updated_at: string
  client?: {
    id: number
    name: string
    phone?: string
    address?: string
  }
  user?: {
    id: number
    name: string
  }
  company?: {
    id: number
    name: string
  }
  payments?: PaymentSlipPayment[]
}

export interface PaymentSlipPayment {
  id?: number
  type: string
  amount: number
  check_number?: string
  date?: string
  notes?: string
}

export interface CreatePaymentSlipData {
  order_ref: string
  client_id: number
  company_id?: number
  user_id?: number
  driver?: string
  plate?: string
  worksite?: string
  tax_rate?: number
  template_id?: number
  notes?: string
  payments?: Omit<PaymentSlipPayment, 'id'>[]
  is_free?: boolean
  payment_type?: string
  amount?: string | number
  check_number?: string
  payment_date?: string
}

export interface UpdatePaymentSlipData extends Partial<CreatePaymentSlipData> {
  id: number
}

export interface PaymentSlipStats {
  total: number
  paid: number
  unpaid: number
  partial: number
  today: number
  thisWeek: number
  thisMonth: number
  totalValue: number
  avgValue: number
}

export class PaymentSlipServiceApi {
  private static baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

  static async getAll(params?: PaginationParams): Promise<PaginatedResponse<PaymentSlip>> {
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    if (params?.search) queryParams.append('search', params.search)
    if (params?.company_id) queryParams.append('company_id', params.company_id.toString())

    const response = await fetch(`${this.baseUrl}/payment-slips?${queryParams}`)
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to fetch payment slips')
    }
    return response.json()
  }

  static async getById(id: number): Promise<ApiResponse<PaymentSlip>> {
    const response = await fetch(`${this.baseUrl}/payment-slips/${id}`)
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to fetch payment slip')
    }
    return response.json()
  }

  static async search(term: string, params?: PaginationParams): Promise<PaginatedResponse<PaymentSlip>> {
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    if (params?.company_id) queryParams.append('company_id', params.company_id.toString())

    const response = await fetch(`${this.baseUrl}/payment-slips/search/${encodeURIComponent(term)}?${queryParams}`)
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to search payment slips')
    }
    return response.json()
  }

  static async create(data: CreatePaymentSlipData): Promise<ApiResponse<{ id: number; human_id: string }>> {
    const response = await fetch(`${this.baseUrl}/payment-slips`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to create payment slip')
    }
    return response.json()
  }

  static async update(id: number, data: Partial<CreatePaymentSlipData>): Promise<ApiResponse<void>> {
    const response = await fetch(`${this.baseUrl}/payment-slips/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to update payment slip')
    }
    return response.json()
  }

  static async delete(id: number): Promise<ApiResponse<void>> {
    const response = await fetch(`${this.baseUrl}/payment-slips/${id}`, {
      method: 'DELETE',
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to delete payment slip')
    }
    return response.json()
  }

  static async getStats(companyId?: number): Promise<ApiResponse<PaymentSlipStats>> {
    const queryParams = new URLSearchParams()
    if (companyId) queryParams.append('company_id', companyId.toString())

    const response = await fetch(`${this.baseUrl}/payment-slips/stats/overview?${queryParams}`)
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to fetch payment slip statistics')
    }
    return response.json()
  }

  // Utility methods
  static async getAllPaymentSlips(companyId?: number): Promise<PaymentSlip[]> {
    let allPaymentSlips: PaymentSlip[] = []
    let page = 1
    let hasMore = true

    while (hasMore) {
      const response = await this.getAll({ page, limit: 100, company_id: companyId })
      allPaymentSlips.push(...response.data)
      hasMore = response.pagination.hasNextPage
      page++
    }

    return allPaymentSlips
  }

  static formatAmount(amount: number): string {
    return new Intl.NumberFormat('fr-MA', {
      style: 'currency',
      currency: 'MAD',
      minimumFractionDigits: 2,
    }).format(amount)
  }

  static formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
  }

  static getPaymentStatusColor(status: string): string {
    switch (status) {
      case 'paid':
        return 'success'
      case 'unpaid':
        return 'error'
      case 'partial':
        return 'warning'
      default:
        return 'default'
    }
  }

  static getPaymentStatusLabel(status: string): string {
    switch (status) {
      case 'paid':
        return 'Payé'
      case 'unpaid':
        return 'Non payé'
      case 'partial':
        return 'Partiellement payé'
      default:
        return status
    }
  }

  static getPaymentTypeLabel(type: string): string {
    switch (type) {
      case 'CHÈQUE':
        return 'Chèque'
      case 'ESPÈCES':
        return 'Espèces'
      case 'VIREMENT':
        return 'Virement'
      case 'CARTE':
        return 'Carte bancaire'
      default:
        return type
    }
  }
}