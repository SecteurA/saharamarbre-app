import ApiClient from '../lib/api'

// Interface definitions matching Laravel ReturnSlip structure
export interface ReturnSlipItem {
  id?: number
  group?: number
  type?: string
  product?: string
  options?: string
  state?: string
  splicer?: number
  length?: number
  width?: number
  quantity: number
  unit_price: number
  total_quantity?: number
  total_price?: number
  full_product_description?: string
  measures?: string
  unit?: string
}

export interface ReturnSlip {
  id: number
  human_id: string
  slip_number: string
  client_id: number
  company_id: number
  salesperson?: number
  driver?: string
  plate?: string
  worksite?: string
  order_ref?: string
  is_free?: boolean
  tax_rate?: number
  template?: number
  taxable_amount: number
  total_taxes: number
  total_amount: number
  paid_amount: number
  remaining_amount: number
  notes?: string
  status: string
  payment_status: string
  type: string
  return_date: string
  created_at: string
  updated_at: string

  // Relations
  client?: {
    id: number
    name: string
    phone?: string
    company?: string
    bin?: string
    patent?: string
  }
  user?: {
    id: number
    name: string
  }
  company?: {
    id: number
    name: string
  }
  items?: ReturnSlipItem[]
  payments?: {
    id: number
    type: string
    amount: number
    check_number?: string
    date?: string
  }[]
}

export interface CreateReturnSlipData {
  client_id: number
  company_id?: number
  salesperson?: number
  driver?: string
  plate?: string
  worksite?: string
  order_ref?: string
  is_free?: boolean
  tax_rate?: number
  template?: number
  notes?: string
  status?: string
  items: Omit<ReturnSlipItem, 'id' | 'total_price'>[]
  payments?: {
    type: string
    amount: number
    check_number?: string
    date?: string
  }[]
}

export interface ReturnSlipStats {
  total: number
  pending: number
  approved: number
  processed: number
  cancelled: number
  unpaid: number
  paid: number
  partial: number
  totalAmount: number
  pendingAmount: number
  processedAmount: number
  avgAmount: number
  maxAmount: number
}

export interface PaginationInfo {
  currentPage: number
  totalPages: number
  totalCount: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination?: PaginationInfo
}

export class ReturnSlipServiceApi {
  private static readonly BASE_PATH = '/return-slips'

  // Get all return slips with pagination
  static async getAllReturnSlips(
    page: number = 1,
    limit: number = 20,
    search?: string,
    status?: string
  ): Promise<PaginatedResponse<ReturnSlip>> {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      })

      if (search) {
        params.append('search', search)
      }

      if (status) {
        params.append('status', status)
      }

      const response = await ApiClient.get(`${ReturnSlipServiceApi.BASE_PATH}?${params}`)
      console.log('ReturnSlips.getAll API response:', response);
      
      // Server returns { success: true, data: [...], pagination: {...} }
      if (response.success && response.data) {
        return {
          success: true,
          data: response.data,
          pagination: response.pagination || { total: response.data.length, pages: 1, page: 1, limit: 10 }
        };
      }
      
      throw new Error('Invalid response format from server');
    } catch (error: any) {
      console.error('Error fetching return slips:', error)
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to fetch return slips',
        data: []
      }
    }
  }

  // Get return slip by ID
  static async getReturnSlipById(id: number): Promise<ApiResponse<ReturnSlip>> {
    try {
      const response = await ApiClient.get(`${ReturnSlipServiceApi.BASE_PATH}/${id}`)
      return {
        success: true,
        data: response.data.data
      }
    } catch (error: any) {
      console.error('Error fetching return slip:', error)
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to fetch return slip'
      }
    }
  }

  // Create new return slip
  static async createReturnSlip(data: CreateReturnSlipData): Promise<ApiResponse<ReturnSlip>> {
    try {
      const response = await ApiClient.post(ReturnSlipServiceApi.BASE_PATH, data)
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      }
    } catch (error: any) {
      console.error('Error creating return slip:', error)
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to create return slip'
      }
    }
  }

  // Update return slip
  static async updateReturnSlip(id: number, data: CreateReturnSlipData): Promise<ApiResponse<ReturnSlip>> {
    try {
      const response = await ApiClient.put(`${ReturnSlipServiceApi.BASE_PATH}/${id}`, data)
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      }
    } catch (error: any) {
      console.error('Error updating return slip:', error)
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to update return slip'
      }
    }
  }

  // Delete return slip
  static async deleteReturnSlip(id: number): Promise<ApiResponse<void>> {
    try {
      const response = await ApiClient.delete(`${ReturnSlipServiceApi.BASE_PATH}/${id}`)
      return {
        success: true,
        message: response.data.message
      }
    } catch (error: any) {
      console.error('Error deleting return slip:', error)
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to delete return slip'
      }
    }
  }

  // Get return slip statistics
  static async getReturnSlipStats(): Promise<ApiResponse<ReturnSlipStats>> {
    try {
      const response = await ApiClient.get(`${ReturnSlipServiceApi.BASE_PATH}/stats`)
      return {
        success: true,
        data: response.data.data
      }
    } catch (error: any) {
      console.error('Error fetching return slip stats:', error)
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to fetch return slip statistics'
      }
    }
  }

  // Search return slips
  static async searchReturnSlips(
    query: string,
    page: number = 1,
    limit: number = 20
  ): Promise<PaginatedResponse<ReturnSlip>> {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      })

      const response = await ApiClient.get(`${ReturnSlipServiceApi.BASE_PATH}/search/${encodeURIComponent(query)}?${params}`)
      return {
        success: true,
        data: response.data.data || [],
        pagination: response.data.pagination
      }
    } catch (error: any) {
      console.error('Error searching return slips:', error)
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to search return slips',
        data: []
      }
    }
  }

  // Get return slips by status
  static async getReturnSlipsByStatus(
    status: string,
    page: number = 1,
    limit: number = 20
  ): Promise<PaginatedResponse<ReturnSlip>> {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        status: status
      })

      const response = await ApiClient.get(`${ReturnSlipServiceApi.BASE_PATH}?${params}`)
      return {
        success: true,
        data: response.data.data || [],
        pagination: response.data.pagination
      }
    } catch (error: any) {
      console.error('Error fetching return slips by status:', error)
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to fetch return slips by status',
        data: []
      }
    }
  }

  // Duplicate return slip
  static async duplicateReturnSlip(id: number): Promise<ApiResponse<ReturnSlip>> {
    try {
      // First get the original return slip
      const originalResult = await this.getReturnSlipById(id)
      if (!originalResult.success || !originalResult.data) {
        throw new Error('Original return slip not found')
      }

      const original = originalResult.data

      // Create new return slip data
      const newReturnSlipData: CreateReturnSlipData = {
        client_id: original.client_id,
        company_id: original.company_id,
        salesperson: original.salesperson,
        driver: original.driver,
        plate: original.plate,
        worksite: original.worksite,
        order_ref: original.order_ref,
        is_free: original.is_free,
        tax_rate: original.tax_rate,
        template: original.template,
        notes: `Copy of ${original.slip_number}${original.notes ? ` - ${original.notes}` : ''}`,
        status: 'pending', // Reset to pending
        items: original.items?.map(item => ({
          group: item.group,
          type: item.type,
          product: item.product,
          options: item.options,
          state: item.state,
          splicer: item.splicer,
          length: item.length,
          width: item.width,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_quantity: item.total_quantity,
          full_product_description: item.full_product_description,
          measures: item.measures,
          unit: item.unit
        })) || [],
        payments: original.payments?.map(payment => ({
          type: payment.type,
          amount: payment.amount,
          check_number: payment.check_number,
          date: payment.date
        })) || []
      }

      // Create the duplicate
      return await this.createReturnSlip(newReturnSlipData)
    } catch (error: any) {
      console.error('Error duplicating return slip:', error)
      return {
        success: false,
        error: error.message || 'Failed to duplicate return slip'
      }
    }
  }

  // Update return slip status
  static async updateSlipStatus(id: number, status: string): Promise<ApiResponse<ReturnSlip>> {
    try {
      // Get current return slip data
      const currentResult = await this.getReturnSlipById(id)
      if (!currentResult.success || !currentResult.data) {
        throw new Error('Return slip not found')
      }

      const currentData = currentResult.data

      // Update with new status
      const updateData: CreateReturnSlipData = {
        client_id: currentData.client_id,
        company_id: currentData.company_id,
        salesperson: currentData.salesperson,
        driver: currentData.driver,
        plate: currentData.plate,
        worksite: currentData.worksite,
        order_ref: currentData.order_ref,
        is_free: currentData.is_free,
        tax_rate: currentData.tax_rate,
        template: currentData.template,
        notes: currentData.notes,
        status: status,
        items: currentData.items?.map(item => ({
          group: item.group,
          type: item.type,
          product: item.product,
          options: item.options,
          state: item.state,
          splicer: item.splicer,
          length: item.length,
          width: item.width,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_quantity: item.total_quantity,
          full_product_description: item.full_product_description,
          measures: item.measures,
          unit: item.unit
        })) || [],
        payments: currentData.payments?.map(payment => ({
          type: payment.type,
          amount: payment.amount,
          check_number: payment.check_number,
          date: payment.date
        })) || []
      }

      return await this.updateReturnSlip(id, updateData)
    } catch (error: any) {
      console.error('Error updating return slip status:', error)
      return {
        success: false,
        error: error.message || 'Failed to update return slip status'
      }
    }
  }

  // Process return (update inventory, create financial records, etc.)
  static async processReturn(id: number, processNote?: string): Promise<ApiResponse<ReturnSlip>> {
    try {
      // Get current return slip data
      const currentResult = await this.getReturnSlipById(id)
      if (!currentResult.success || !currentResult.data) {
        throw new Error('Return slip not found')
      }

      const currentData = currentResult.data

      // Update with processed status and note
      const updateData: CreateReturnSlipData = {
        client_id: currentData.client_id,
        company_id: currentData.company_id,
        salesperson: currentData.salesperson,
        driver: currentData.driver,
        plate: currentData.plate,
        worksite: currentData.worksite,
        order_ref: currentData.order_ref,
        is_free: currentData.is_free,
        tax_rate: currentData.tax_rate,
        template: currentData.template,
        notes: processNote ? `${processNote}` : currentData.notes,
        status: 'processed',
        items: currentData.items?.map(item => ({
          group: item.group,
          type: item.type,
          product: item.product,
          options: item.options,
          state: item.state,
          splicer: item.splicer,
          length: item.length,
          width: item.width,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_quantity: item.total_quantity,
          full_product_description: item.full_product_description,
          measures: item.measures,
          unit: item.unit
        })) || [],
        payments: currentData.payments?.map(payment => ({
          type: payment.type,
          amount: payment.amount,
          check_number: payment.check_number,
          date: payment.date
        })) || []
      }

      return await this.updateReturnSlip(id, updateData)
    } catch (error: any) {
      console.error('Error processing return slip:', error)
      return {
        success: false,
        error: error.message || 'Failed to process return slip'
      }
    }
  }

  // Get return slips by date range
  static async getReturnSlipsByDateRange(
    startDate: string,
    endDate: string,
    page: number = 1,
    limit: number = 20
  ): Promise<PaginatedResponse<ReturnSlip>> {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        start_date: startDate,
        end_date: endDate
      })

      const response = await ApiClient.get(`${ReturnSlipServiceApi.BASE_PATH}?${params}`)
      return {
        success: true,
        data: response.data.data || [],
        pagination: response.data.pagination
      }
    } catch (error: any) {
      console.error('Error fetching return slips by date range:', error)
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to fetch return slips by date range',
        data: []
      }
    }
  }

  // Get return slips by client
  static async getReturnSlipsByClient(
    clientId: number,
    page: number = 1,
    limit: number = 20
  ): Promise<PaginatedResponse<ReturnSlip>> {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        client_id: clientId.toString()
      })

      const response = await ApiClient.get(`${ReturnSlipServiceApi.BASE_PATH}?${params}`)
      return {
        success: true,
        data: response.data.data || [],
        pagination: response.data.pagination
      }
    } catch (error: any) {
      console.error('Error fetching return slips by client:', error)
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to fetch client return slips',
        data: []
      }
    }
  }
}

export default ReturnSlipServiceApi