import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import * as clientService from '../services/clientServiceApi';
import { CompanyService } from '../services/companyServiceApi';
import * as productService from '../services/productServiceApi';
import { orderStockIntegration } from '../services/automaticStockService';
import { getProductStates } from '../services/productServiceApi';
import {
  Box,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Alert,
  Snackbar,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Pagination,
  Card,
  CardContent,
  Avatar,
  Tooltip,
  Stack,
  Autocomplete
} from '@mui/material'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Print as PrintIcon,
  Search as SearchIcon,
  Transform as ConvertIcon,
  Description as DocumentIcon,
  Person as PersonIcon,
  Euro as EuroIcon,
  CalendarToday as CalendarIcon,
  GetApp as ExportIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material'
import { ReturnSlipServiceApi, type ReturnSlip, type ReturnSlipItem } from '../services/returnSlipServiceApi'
import OrderPDF from '../components/pdf/OrderPDF'
import { pdf } from '@react-pdf/renderer'
import type { Order, OrderItem, Client, Company, Product } from '../types/database.types'

// Use static service methods
const returnSlipService = {
  getAll: ReturnSlipServiceApi.getAllReturnSlips,
  search: ReturnSlipServiceApi.searchReturnSlips,
  create: ReturnSlipServiceApi.createReturnSlip,
  update: ReturnSlipServiceApi.updateReturnSlip,
  delete: ReturnSlipServiceApi.deleteReturnSlip,
  getById: ReturnSlipServiceApi.getReturnSlipById,
  getStats: ReturnSlipServiceApi.getReturnSlipStats
}

// Define interfaces for forms - matching Orders structure
export interface CreateReturnSlipDto {
  client_id: number
  company_id: number
  user_id: number
  template_id: number
  driver: string
  plate: string
  worksite: string
  order_ref: string
  is_free: boolean
  tax_rate: number
  taxable_amount: number
  total_amount: number
  notes: string
  status: string
  items: OrderItem[]
}

export interface UpdateReturnSlipDto {
  client_id?: number
  company_id?: number
  user_id?: number
  template_id?: number
  driver?: string
  plate?: string
  worksite?: string
  order_ref?: string
  is_free?: boolean
  tax_rate?: number
  taxable_amount?: number
  total_amount?: number
  notes?: string
  status?: string
  items?: OrderItem[]
}

export interface ReturnItem {
  id?: number
  product_id: number
  quantity: number
  reason: string
  condition: string
  product?: any
}

export interface PaginationParams {
  page: number
  limit: number
  search?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export default function ReturnSlips() {
  const { user: currentUser } = useAuth() // Get logged-in user
  const navigate = useNavigate()
  const [returnSlips, setReturnSlips] = useState<ReturnSlip[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingReturnSlip, setEditingReturnSlip] = useState<ReturnSlip | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [returnSlipToDelete, setReturnSlipToDelete] = useState<ReturnSlip | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [refreshing, setRefreshing] = useState(false)
  
  // Pagination state - match Laravel Filament defaults
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20) // Laravel Filament default
  const [totalItems, setTotalItems] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  
  // Statistics state
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    processing: 0,
    completed: 0,
    cancelled: 0,
    thisMonth: 0,
    totalValue: 0,
    avgValue: 0
  })
  
  // Return slip statuses
  const returnStatuses = ['pending', 'processing', 'completed', 'cancelled', 'refunded']
  const [productStates, setProductStates] = useState<string[]>(['Poli', 'Brut', 'Adouci'])
  
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' })

  
  // Form data - matching Orders structure
  const [formData, setFormData] = useState({
    client_id: null as number | null,
    company_id: null as number | null, // Laravel: company relationship
    user_id: currentUser?.id || 1, // Laravel: salesperson - auto-assign current user 
    template_id: 0, // Laravel: template (ENTETE DE field)
    order_ref: '', // Laravel: order_ref
    driver: '',
    plate: '',
    worksite: '',
    tax_rate: 20,
    is_free: false,
    notes: '',
    status: 'draft',
    items: [] as any[], // Laravel-style items array
    payments: [] as any[], // Laravel-style payments array
    // Calculated totals (updated by CALCULER!)
    taxable_amount: 0,
    total_taxes: 0,
    total_amount: 0
  })

  // Order items and view mode
  const [orderItems, setOrderItems] = useState<OrderItem[]>([])
  const [newOrderItem, setNewOrderItem] = useState<Omit<OrderItem, 'id'>>({
    product_id: 0,
    quantity: 1,
    unit_price: 0,
    total_price: 0,
    type: 'RETOUR',
    product: '',
    full_product_description: ''
  })
  const [isViewMode, setIsViewMode] = useState(false)
  const [loadingClients, setLoadingClients] = useState(false)
  const [loadingCompanies, setLoadingCompanies] = useState(false)
  const [addClientDialogOpen, setAddClientDialogOpen] = useState(false)
  const [addCompanyDialogOpen, setAddCompanyDialogOpen] = useState(false)
  
  // Client search and add functionality (same as Quotes)
  const [clientSearchQuery, setClientSearchQuery] = useState('')

  useEffect(() => {
    fetchReturnSlips()
  }, [page, limit, searchTerm])

  useEffect(() => {
    fetchRelatedData()
    loadProductStates()
  }, [])

  // Auto-assign current user when available (same as Orders)
  useEffect(() => {
    if (currentUser && currentUser.id && !editingReturnSlip) {
      setFormData(prev => ({ ...prev, user_id: currentUser.id }))
    }
  }, [currentUser, editingReturnSlip])

  // Search clients when search query changes (same as Quotes)
  useEffect(() => {
    const searchClients = async () => {
      if (clientSearchQuery.length >= 2) {
        try {
          setLoadingClients(true)
          const clientsResult = await clientService.getClients(1, 50, clientSearchQuery)
          if (clientsResult && clientsResult.clients) {
            setClients(clientsResult.clients)
          }
        } catch (error) {
          console.error('Error searching clients:', error)
          setClients([])
        } finally {
          setLoadingClients(false)
        }
      } else if (clientSearchQuery === '') {
        // Reload all clients when search is cleared
        fetchRelatedData()
      }
    }
    const timeoutId = setTimeout(searchClients, 300) // Debounce search
    return () => clearTimeout(timeoutId)
  }, [clientSearchQuery])

  const loadProductStates = async () => {
    try {
      const states = await getProductStates()
      setProductStates(states)
    } catch (error) {
      console.error('Failed to load product states:', error)
    }
  }

  const fetchReturnSlips = async () => {
    setLoading(true)
    try {
      const params: PaginationParams = {
        page,
        limit,
        search: searchTerm || undefined,
        sortBy: 'date_return',
        sortOrder: 'desc'
      }

      let result
      
      if (searchTerm) {
        result = await returnSlipService.search(searchTerm, params)
      } else {
        result = await returnSlipService.getAll(page, limit, searchTerm)
      }
      
      if (result.success) {
        setReturnSlips(result.data || [])
        if (result.pagination) {
          setTotalItems(result.pagination.totalCount || 0)
          setTotalPages(result.pagination.totalPages || 1)
        }
        // Calculate statistics
        calculateStats(result.data || [])
      } else {
        showSnackbar(result.error || 'Failed to fetch return slips', 'error')
      }
    } catch (error) {
      showSnackbar('Error fetching return slips', 'error')
    }
    setLoading(false)
  }

  const fetchRelatedData = async () => {
    try {
      setLoadingClients(true)
      setLoadingCompanies(true)
      
      const [clientsResult, companiesResult, productsResult] = await Promise.all([
        clientService.getClients(1, 100, ''), // Load 100 clients like in Orders
        CompanyService.getAll(),
        productService.getProducts({ limit: 10000 }).then(response => response.data)
      ])

      // Handle clients response properly (same as Orders)
      if (clientsResult && clientsResult.clients) {
        setClients(clientsResult.clients)

      } else if (Array.isArray(clientsResult)) {
        setClients(clientsResult)

      } else {
        console.warn('⚠️ No clients found in response')
        setClients([])
      }

      // Handle companies response properly (same as Orders)
      if (Array.isArray(companiesResult)) {
        setCompanies(companiesResult)

      } else if (companiesResult && companiesResult.data) {
        setCompanies(companiesResult.data)

      } else {
        setCompanies([])

      }

      // Handle products response properly (same as Orders)
      if (Array.isArray(productsResult)) {
        setProducts(productsResult)

      } else if (productsResult && productsResult.data) {
        setProducts(productsResult.data)

      } else {
        setProducts([])

      }
    } catch (error) {
      console.error('Error fetching related data:', error)
      setClients([])
      setCompanies([])
      setProducts([])
    } finally {
      setLoadingClients(false)
      setLoadingCompanies(false)
    }
  }





  const handleEdit = async (returnSlip: ReturnSlip) => {
    try {
      setLoading(true)
      
      // Ensure related data is loaded first
      if (clients.length === 0 || companies.length === 0) {
        await fetchRelatedData()
      }
      
      // If client is not in the current clients list, add it from the returnSlip data
      if (returnSlip.client && !clients.find(c => c.id === returnSlip.client_id)) {
        setClients(prev => [returnSlip.client!, ...prev])
      }
      
      // If company is not in the current companies list, add it from the returnSlip data
      if (returnSlip.company && !companies.find(c => c.id === returnSlip.company_id)) {
        setCompanies(prev => [returnSlip.company!, ...prev])
      }
      
      // Fetch complete return slip details with items from API
      const response = await fetch(`http://localhost:3001/api/return-slips/${returnSlip.id}`)
      const result = await response.json()
      
      if (result.success && result.data) {
        const fullReturnSlip = result.data

        
        // Make sure we store the complete data with proper user structure

        setEditingReturnSlip({
          ...fullReturnSlip,
          user: {
            name: fullReturnSlip.user_name || fullReturnSlip.user?.name,
            id: fullReturnSlip.user_id,
            email: fullReturnSlip.user_email
          },
          user_name: fullReturnSlip.user_name, // Ensure user_name is preserved
          user_id: fullReturnSlip.user_id
        } as any)
        
        // Populate ALL form fields matching Laravel exactly
        const populatedFormData = {
          client_id: fullReturnSlip.client_id || 0,
          company_id: fullReturnSlip.company_id || 0,
          user_id: (fullReturnSlip as any).user_id || 0,
          template_id: (fullReturnSlip as any).template_id || fullReturnSlip.company_id || 0,
          order_ref: fullReturnSlip.order_ref || '',
          driver: (fullReturnSlip as any).driver || '',
          plate: (fullReturnSlip as any).plate || '',
          worksite: (fullReturnSlip as any).worksite || '',
          tax_rate: fullReturnSlip.tax_rate || 20,
          is_free: (fullReturnSlip as any).is_free || false,
          notes: fullReturnSlip.notes || '',
          status: fullReturnSlip.status || 'draft',
          items: fullReturnSlip.items || []
        }
        
        setFormData(populatedFormData)
        
        // FORCE ITEMS TO SHOW - Direct simple approach
        // Force set order items regardless
        const items = fullReturnSlip.items || []
        
        if (items.length > 0) {
          const mappedItems = items.map((item: any, index: number) => {

            return {
              group: item.group_number || item.group || (index + 1),
              type: item.type || 'DÉBIT',
              product: item.product || item.product_name || item.designation || '',
              options: item.options || item.op || '',
              state: item.state || 'Poli',
              splicer: Number(item.splicer) || 2,
              length: item.length ? Number(item.length) : null,
              width: item.width ? Number(item.width) : null,
              quantity: Number(item.quantity) || 1,
              unit_price: Number(item.unit_price) || 0,
              total_quantity: String(item.total_quantity || ''),
              total_price: Number(item.total_price) || 0,
              unit: item.unit || 'M2'
            }
          })

          setOrderItems(mappedItems)
          
          // Update form data with items
          setFormData(prev => ({
            ...prev,
            items: mappedItems
          }))
        } else {

          setOrderItems([])
        }
        
        // Set edit mode and open dialog
        setIsViewMode(false)
        setDialogOpen(true)
      } else {
        showSnackbar('Error loading return slip details', 'error')
      }
    } catch (error) {
      console.error('Error fetching return slip details:', error)
      showSnackbar('Error loading return slip details', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleView = async (returnSlip: ReturnSlip) => {
    try {

      setLoading(true)
      
      // Ensure related data is loaded first
      if (clients.length === 0 || companies.length === 0) {
        await fetchRelatedData()
      }
      
      // If client is not in the current clients list, add it from the returnSlip data
      if (returnSlip.client && !clients.find(c => c.id === returnSlip.client_id)) {
        setClients(prev => [returnSlip.client!, ...prev])
      }
      
      // If company is not in the current companies list, add it from the returnSlip data
      if (returnSlip.company && !companies.find(c => c.id === returnSlip.company_id)) {
        setCompanies(prev => [returnSlip.company!, ...prev])
      }
      
      // Fetch complete return slip details with items from API
      const response = await fetch(`http://localhost:3001/api/return-slips/${returnSlip.id}`)
      const result = await response.json()
      
      if (result.success && result.data) {
        const fullReturnSlip = result.data

        
        // Make sure we store the complete data with proper user structure for VIEW

        setEditingReturnSlip({
          ...fullReturnSlip,
          user: {
            name: fullReturnSlip.user_name || fullReturnSlip.user?.name,
            id: fullReturnSlip.user_id,
            email: fullReturnSlip.user_email
          },
          user_name: fullReturnSlip.user_name, // Ensure user_name is preserved
          user_id: fullReturnSlip.user_id
        } as any)
        
        // Populate ALL form fields exactly like edit but for viewing
        const populatedFormData = {
          client_id: fullReturnSlip.client_id || 0,
          company_id: fullReturnSlip.company_id || 0,
          user_id: (fullReturnSlip as any).user_id || 0,
          template_id: (fullReturnSlip as any).template_id || fullReturnSlip.company_id || 0,
          order_ref: fullReturnSlip.order_ref || '',
          driver: (fullReturnSlip as any).driver || '',
          plate: (fullReturnSlip as any).plate || '',
          worksite: (fullReturnSlip as any).worksite || '',
          tax_rate: fullReturnSlip.tax_rate || 20,
          is_free: (fullReturnSlip as any).is_free || false,
          notes: fullReturnSlip.notes || '',
          status: fullReturnSlip.status || 'draft',
          items: fullReturnSlip.items || []
        }
        
        setFormData(populatedFormData)
        
        // Set items if they exist
        const items = fullReturnSlip.items || []
        if (items.length > 0) {
          const mappedItems = items.map((item: any, index: number) => ({
            group: item.group_number || item.group || (index + 1),
            type: item.type || 'DÉBIT',
            product: item.product || item.product_name || item.designation || '',
            options: item.options || item.op || '',
            state: item.state || item.etat || 'Poli',
            splicer: Number(item.splicer) || 2,
            length: item.length ? Number(item.length) : null,
            width: item.width ? Number(item.width) : null,
            quantity: Number(item.quantity) || 1,
            unit_price: Number(item.unit_price) || 0,
            total_quantity: String(item.total_quantity || ''),
            total_price: Number(item.total_price) || 0,
            unit: item.unit || 'M2'
          }))

          setOrderItems(mappedItems)
          setFormData(prev => ({ ...prev, items: mappedItems }))
        } else {
          setOrderItems([])
        }
        
  // Keep enriched editingReturnSlip (with user object) intact
        
        // Set view mode and open EDIT dialog (same form, inputs disabled)
        setIsViewMode(true)
        setDialogOpen(true)
      } else {

        showSnackbar(`Error loading return slip details: ${result.error}`, 'error')
      }
    } catch (error) {

      showSnackbar(`Error loading return slip details: ${error.message}`, 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      // Validation exactly like Orders
      const requiredErrors: string[] = [];
      if (!formData.client_id) {
        requiredErrors.push('Veuillez sélectionner un client');
      }
      if (!formData.company_id) {
        requiredErrors.push('Veuillez sélectionner une entreprise');
      }
      if (!formData.user_id || formData.user_id === 0) {
        requiredErrors.push('Veuillez sélectionner un responsable');
      }
      if (orderItems.length === 0) {
        requiredErrors.push('Veuillez ajouter au moins un article');
      }

      if (requiredErrors.length > 0) {
        showSnackbar(`Erreur: ${requiredErrors.join(', ')}`, 'error');
        return;
      }

      const returnSlipData = { ...formData, items: orderItems }
      const result = editingReturnSlip
        ? await returnSlipService.update(editingReturnSlip.id, returnSlipData as UpdateReturnSlipDto)
        : await returnSlipService.create(returnSlipData)

      if (result.success) {
        showSnackbar(
          editingReturnSlip ? 'Bon de retour modifié avec succès' : 'Bon de retour créé avec succès',
          'success'
        )
        setDialogOpen(false)
        fetchReturnSlips()
      } else {
        showSnackbar(result.error || 'Erreur lors de la sauvegarde', 'error')
      }
    } catch (error) {
      showSnackbar('Erreur lors de la sauvegarde', 'error')
    }
  }

  const handleDeleteClick = (returnSlip: ReturnSlip) => {
    setReturnSlipToDelete(returnSlip)
    setDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!returnSlipToDelete) return

    try {
      const result = await returnSlipService.delete(returnSlipToDelete.id)
      if (result.success) {
        showSnackbar('Return slip deleted successfully', 'success')
        setDeleteDialogOpen(false)
        setReturnSlipToDelete(null)
        fetchReturnSlips()
      } else {
        showSnackbar(result.error || 'Failed to delete return slip', 'error')
      }
    } catch (error) {
      showSnackbar('Error deleting return slip', 'error')
    }
  }

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity })
  }

  // Calculate statistics from return slips data
  const calculateStats = (returnSlipsData: ReturnSlip[]) => {
    const pending = returnSlipsData.filter(rs => rs.status === 'pending').length
    const processing = returnSlipsData.filter(rs => rs.status === 'processing').length
    const completed = returnSlipsData.filter(rs => rs.status === 'completed').length
    const cancelled = returnSlipsData.filter(rs => rs.status === 'cancelled').length
    
    // Calculate additional stats
    const currentMonth = new Date().getMonth()
    const currentYear = new Date().getFullYear()
    const thisMonth = returnSlipsData.filter(rs => {
      const rsDate = new Date(rs.date_return || rs.created_at)
      return rsDate.getMonth() === currentMonth && rsDate.getFullYear() === currentYear
    }).length
    
    const totalValue = returnSlipsData.reduce((sum, rs) => sum + (rs.total_amount || 0), 0)
    const avgValue = (totalItems || 0) > 0 ? totalValue / (totalItems || 1) : 0
    
    setStats({
      total: totalItems || 0, // Use totalItems from pagination for accurate count
      pending,
      processing,
      completed,
      cancelled,
      thisMonth,
      totalValue,
      avgValue
    })
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await fetchReturnSlips()
      showSnackbar('Données actualisées avec succès', 'success')
    } catch (error) {
      showSnackbar('Erreur lors de l\'actualisation', 'error')
    }
    setRefreshing(false)
  }

  const handleAdd = () => {
    setEditingReturnSlip(null)
    setFormData({
      client_id: 0,
      company_id: 0,
      user_id: 0,
      template_id: 0,
      driver: '',
      plate: '',
      worksite: '',
      order_ref: '',
      is_free: false,
      tax_rate: 20,
      taxable_amount: 0,
      total_amount: 0,
      notes: '',
      status: 'draft',
      items: []
    })
    setOrderItems([])
    setIsViewMode(false)
    setDialogOpen(true)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'default'
      case 'confirmed': return 'info'
      case 'processing': return 'warning'
      case 'completed': return 'success'
      case 'cancelled': return 'error'
      default: return 'default'
    }
  }

  const calculateTotal = () => {
    return orderItems.reduce((sum, item) => {
      const price = Number(item.total_price) || 0
      return sum + price
    }, 0)
  }

  const removeOrderItem = (index: number) => {
    setOrderItems(prev => prev.filter((_, i) => i !== index))
  }

  const updateOrderItem = (index: number, field: string, value: any) => {
    setOrderItems(prev => prev.map((item, i) => {
      if (i === index) {
        const updatedItem = { ...item, [field]: value }
        // Auto-calculate total_price when quantity or unit_price changes
        if (field === 'quantity' || field === 'unit_price') {
          updatedItem.total_price = (updatedItem.quantity || 0) * (updatedItem.unit_price || 0)
        }
        return updatedItem
      }
      return item
    }))
  }

  const addOrderItem = () => {
    if (!newOrderItem.product?.trim()) return

    const item: OrderItem = {
      ...newOrderItem,
      total_price: newOrderItem.quantity * newOrderItem.unit_price
    }

    setOrderItems(prev => [...prev, item])
    setNewOrderItem({
      product_id: 0,
      quantity: 1,
      unit_price: 0,
      total_price: 0,
      type: 'RETOUR',
      product: '',
      full_product_description: ''
    })
  }

  const addNewOrderItem = () => {
    const newItem = {
      group: orderItems.length + 1,
      type: 'DÉBIT',
      product: '',
      options: '',
      state: 'Poli',
      thickness: '',
      length: '',
      width: '',
      quantity: '1',
      unit_price: '0',
      total_quantity: '',
      total_price: '0'
    }
    
    setOrderItems(prev => [...prev, newItem])

  }

  const handlePrintReturnSlip = async (returnSlip: ReturnSlip) => {
    try {
      // Convert returnSlip to Order format for PDF
      const orderForPdf = {
        id: returnSlip.id,
        order_number: returnSlip.human_id || `BR-${returnSlip.id}`,
        order_date: returnSlip.created_at,
        delivery_date: returnSlip.created_at,
        status: returnSlip.status,
        notes: returnSlip.notes,
        total_amount: returnSlip.total_amount,
        client_id: returnSlip.client_id,
        company_id: returnSlip.company_id,
        client: returnSlip.client || clients.find(c => c.id === returnSlip.client_id),
        company: returnSlip.company || companies.find(c => c.id === returnSlip.company_id),
        order_items: returnSlip.items || []
      }

      const blob = await pdf(
        <OrderPDF order={orderForPdf} isQuote={false} />
      ).toBlob()
      
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `return-slip-${returnSlip.human_id || returnSlip.id}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      showSnackbar('PDF généré avec succès', 'success')
    } catch (error) {
      console.error('Error generating PDF:', error)
      showSnackbar('Erreur lors de la génération du PDF', 'error')
    }
  }

  const handleMarkAsProcessed = async (returnSlip: ReturnSlip) => {
    try {
      // 🚀 AUTOMATIC STOCK MANAGEMENT: Increase stock when return slip is processed
      if (returnSlip.company_id && returnSlip.items && returnSlip.items.length > 0 && returnSlip.status !== 'completed') {
        try {
          const stockItems = returnSlip.items
            .filter(item => item.product_id && item.quantity)
            .map(item => ({
              product_id: item.product_id!,
              quantity: item.quantity || 1
            }))

          if (stockItems.length > 0) {
            await orderStockIntegration.processReturnSlipConfirmation(returnSlip.company_id, stockItems, returnSlip.id)

          }
        } catch (stockError) {
          console.error('Failed to increase stock:', stockError)
          showSnackbar('⚠️ Retour traité mais erreur lors de la mise à jour du stock', 'error')
        }
      }

      const result = await returnSlipService.update(returnSlip.id, { status: 'completed' })
      if (result.success) {
        showSnackbar('↩️ Bon de retour traité (stock augmenté automatiquement)', 'success')
        fetchReturnSlips()
      } else {
        showSnackbar(result.error || 'Erreur lors de la mise à jour', 'error')
      }
    } catch (error) {
      showSnackbar('Erreur lors de la mise à jour', 'error')
    }
  }



  return (
    <Box>
      {/* Modern Header with Statistics Cards */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: 'primary.main', width: 48, height: 48 }}>
              <DocumentIcon />
            </Avatar>
            <Box>
              <Typography variant="h4" component="h1" sx={{ fontWeight: 600, color: 'text.primary' }}>
                BONS DE RETOUR
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Gestion des bons de retour et reprises de marchandises
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Actualiser">
              <IconButton onClick={handleRefresh} disabled={refreshing}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            <Button 
              variant="outlined" 
              startIcon={<ExportIcon />}
              sx={{ 
                borderColor: 'primary.main', 
                color: 'primary.main',
                '&:hover': { 
                  borderColor: 'primary.dark', 
                  backgroundColor: 'primary.50' 
                }
              }}
            >
              Exporter
            </Button>
            <Button 
              variant="contained" 
              startIcon={<AddIcon />} 
              onClick={handleAdd}
              sx={{ 
                bgcolor: 'primary.main',
                '&:hover': { bgcolor: 'primary.dark' },
                boxShadow: 2
              }}
            >
              Nouveau Bon de Retour
            </Button>
          </Box>
        </Box>

        {/* Statistics Cards */}
        <Box sx={{ 
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr 1fr' },
          gap: 3,
          mb: 3
        }}>
          <Card sx={{ 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            height: '100%'
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="body2" sx={{ opacity: 0.8, mb: 1 }}>
                    Total Devis
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {(stats.total || 0).toLocaleString()}
                  </Typography>
                </Box>
                <DocumentIcon sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
          
          <Card sx={{ 
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            color: 'white',
            height: '100%'
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="body2" sx={{ opacity: 0.8, mb: 1 }}>
                    Ce Mois
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {(stats.thisMonth || 0).toLocaleString()}
                  </Typography>
                </Box>
                <CalendarIcon sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
          
          <Card sx={{ 
            background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            color: 'white',
            height: '100%'
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="body2" sx={{ opacity: 0.8, mb: 1 }}>
                    Valeur Totale
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {(stats.totalValue || 0).toLocaleString()} MAD
                  </Typography>
                </Box>
                <EuroIcon sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
          
          <Card sx={{ 
            background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
            color: 'white',
            height: '100%'
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="body2" sx={{ opacity: 0.8, mb: 1 }}>
                    Valeur Moyenne
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {(stats.avgValue || 0).toLocaleString()} MAD
                  </Typography>
                </Box>
                <PersonIcon sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>


        {/* Modern Search and Filters */}
        <Card sx={{ mb: 3, p: 3 }}>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <TextField
              placeholder="Rechercher par référence, client, responsable..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setSearchTerm(searchQuery)
                  setPage(1)
                }
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                ),
              }}
              sx={{ 
                minWidth: 400,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2
                }
              }}
              variant="outlined"
            />
            <Button 
              variant="contained" 
              onClick={() => {
                setSearchTerm(searchQuery)
                setPage(1)
              }}
              sx={{ height: 56, px: 3, borderRadius: 2 }}
            >
              Rechercher
            </Button>
            {searchTerm && (
              <Button 
                variant="outlined" 
                onClick={() => {
                  setSearchTerm('')
                  setSearchQuery('')
                  setPage(1)
                }}
                sx={{ height: 56, px: 3, borderRadius: 2 }}
              >
                Effacer
              </Button>
            )}
          </Box>
        </Card>

        {/* Modern Data Table */}
        <Card sx={{ overflow: 'hidden', boxShadow: 3 }}>
          <TableContainer>
            <Table sx={{ minWidth: 650 }}>
              <TableHead>
                <TableRow sx={{ 
                  backgroundColor: '#f8fafc',
                  '& .MuiTableCell-head': {
                    fontWeight: 600,
                    color: '#374151',
                    fontSize: '0.875rem',
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                    borderBottom: '2px solid #e5e7eb'
                  }
                }}>
                  <TableCell>N° DE RÉFÉRENCE</TableCell>
                  <TableCell>CLIENT</TableCell>
                  <TableCell>RESPONSABLE</TableCell>
                  <TableCell>CHAUFFEUR</TableCell>
                  <TableCell>BCN/BCX</TableCell>
                  <TableCell align="right">TOTAL</TableCell>
                  <TableCell>DATE D'ÉMISSION</TableCell>
                  <TableCell align="center">ACTIONS</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">Loading...</TableCell>
                </TableRow>
              ) : returnSlips.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 8 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                      <DocumentIcon sx={{ fontSize: 64, color: 'text.disabled' }} />
                      <Typography variant="h6" color="text.secondary">
                        Aucun bon de retour trouvé
                      </Typography>
                      <Typography variant="body2" color="text.disabled">
                        {searchTerm ? 'Essayez de modifier vos critères de recherche' : 'Commencez par créer votre premier bon de retour'}
                      </Typography>
                      {!searchTerm && (
                        <Button variant="contained" startIcon={<AddIcon />} onClick={handleAdd} sx={{ mt: 2 }}>
                          Créer un Bon de Retour
                        </Button>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                returnSlips.map((returnSlip, index) => (
                  <TableRow 
                    key={returnSlip.id} 
                    hover
                    sx={{ 
                      '&:hover': { 
                        backgroundColor: '#f8fafc' 
                      },
                      '& .MuiTableCell-root': {
                        borderBottom: '1px solid #e5e7eb'
                      }
                    }}
                  >
                    <TableCell sx={{ py: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: '0.875rem' }}>
                          {index + 1 + (page - 1) * limit}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight="600" color="primary.main">
                            {returnSlip.human_id || `R-${returnSlip.id}`}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ py: 2 }}>
                      <Box>
                        <Typography variant="body2" fontWeight="500">
                          {returnSlip.client?.name || 'Client Inconnu'}
                        </Typography>
                        {returnSlip.client?.phone && (
                          <Typography variant="caption" color="text.secondary">
                            {returnSlip.client.phone}
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell sx={{ py: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PersonIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Typography variant="body2">
                          {returnSlip.user?.name || 'Non Assigné'}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ py: 2 }}>
                      <Typography variant="body2">
                        {returnSlip.driver || 'Non Assigné'}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ py: 2 }}>
                      <Typography variant="body2" fontWeight="500" color="primary.main">
                        {returnSlip.order_ref || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell align="right" sx={{ py: 2 }}>
                      <Typography variant="body2" fontWeight="600" color="success.main">
                        {(returnSlip.total_amount || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} MAD
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ py: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CalendarIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Typography variant="body2">
                          {new Date(returnSlip.created_at).toLocaleDateString('fr-FR')}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="center" sx={{ py: 2 }}>
                      <Stack direction="row" spacing={1} justifyContent="center">
                        <Tooltip title="Voir le devis">
                          <IconButton 
                            size="small" 
                            onClick={() => handleView(returnSlip)}
                            sx={{ 
                              color: 'primary.main',
                              '&:hover': { 
                                bgcolor: 'primary.50',
                                transform: 'scale(1.1)' 
                              }
                            }}
                          >
                            <ViewIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Modifier">
                          <IconButton 
                            size="small" 
                            onClick={() => handleEdit(returnSlip)}
                            sx={{ 
                              color: 'warning.main',
                              '&:hover': { 
                                bgcolor: 'warning.50',
                                transform: 'scale(1.1)' 
                              }
                            }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Imprimer PDF">
                          <IconButton 
                            size="small" 
                            onClick={() => handlePrintReturnSlip(returnSlip)}
                            sx={{ 
                              color: 'info.main',
                              '&:hover': { 
                                bgcolor: 'info.50',
                                transform: 'scale(1.1)' 
                              }
                            }}
                          >
                            <PrintIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        {(returnSlip.status === 'confirmed' || returnSlip.status === 'processing') && (
                          <Tooltip title="Marquer comme livré">
                            <IconButton 
                              size="small" 
                              onClick={() => handleMarkAsProcessed(returnSlip)}
                              sx={{ 
                                color: 'success.main',
                                '&:hover': { 
                                  bgcolor: 'success.50',
                                  transform: 'scale(1.1)' 
                                }
                              }}
                            >
                              <ConvertIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        <Tooltip title="Supprimer">
                          <IconButton 
                            size="small" 
                            onClick={() => handleDeleteClick(returnSlip)}
                            sx={{ 
                              color: 'error.main',
                              '&:hover': { 
                                bgcolor: 'error.50',
                                transform: 'scale(1.1)' 
                              }
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Modern Pagination */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          p: 3,
          borderTop: '1px solid #e5e7eb',
          bgcolor: '#f8fafc'
        }}>
          <Typography variant="body2" color="text.secondary">
            Affichage de <strong>{Math.min((page - 1) * limit + 1, totalItems || 0)}</strong> à{' '}
            <strong>{Math.min(page * limit, totalItems || 0)}</strong> sur{' '}
            <strong>{(totalItems || 0).toLocaleString()}</strong> entrées
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <FormControl size="small" sx={{ minWidth: 80 }}>
              <InputLabel>Par page</InputLabel>
              <Select
                value={limit}
                label="Par page"
                onChange={(e) => {
                  setLimit(Number(e.target.value))
                  setPage(1)
                }}
              >
                <MenuItem value={10}>10</MenuItem>
                <MenuItem value={20}>20</MenuItem>
                <MenuItem value={50}>50</MenuItem>
                <MenuItem value={100}>100</MenuItem>
              </Select>
            </FormControl>
            <Pagination
              count={totalPages}
              page={page}
              onChange={(_, value) => setPage(value)}
              color="primary"
              showFirstButton
              showLastButton
              siblingCount={1}
              boundaryCount={1}
              sx={{
                '& .MuiPaginationItem-root': {
                  borderRadius: 2
                }
              }}
            />
          </Box>
        </Box>
      </Card>

      {/* Add/Edit Dialog - EXACT MATCH WITH ORDERS */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="xl" fullWidth>
        <DialogTitle sx={{ bgcolor: '#f8f9fa', borderBottom: '1px solid #e9ecef' }}>
          <Typography variant="h5" component="span" sx={{ fontWeight: 600, color: '#495057' }}>
            {isViewMode ? 'VOIR BON DE RETOUR' : editingReturnSlip ? 'MODIFIER BON DE RETOUR' : 'CRÉER BON DE RETOUR'}
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          <Box sx={{ display: 'flex', bgcolor: '#fff' }}>
            {/* MAIN CONTENT - Left side */}
            <Box sx={{ flex: 1 }}>
              {/* LARAVEL-STYLE FORM LAYOUT */}
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 0, minHeight: '600px' }}>
              
              {/* LEFT SECTION - RESPONSABLE */}
              <Box sx={{ p: 3, borderRight: '1px solid #e9ecef', bgcolor: '#f8f9fa' }}>
                <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, color: '#495057', textTransform: 'uppercase' }}>
                  RESPONSABLE
                </Typography>
                
                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" sx={{ mb: 1, fontWeight: 500, color: '#6c757d' }}>
                    RESPONSABLE
                  </Typography>
                  {isViewMode ? (
                    <TextField
                      size="small"
                      fullWidth
                      disabled
                      value={
                        editingReturnSlip?.user?.name || 
                        editingReturnSlip?.user_name ||
                        editingReturnSlip?.salesperson_name || 
                        (editingReturnSlip?.user_id ? `Utilisateur ID: ${editingReturnSlip.user_id}` : 'Non assigné')
                      }
                      sx={{ bgcolor: 'white' }}
                    />
                  ) : (
                    <Box>
                      <TextField
                        size="small"
                        fullWidth
                        disabled
                        value={currentUser?.name || 'Utilisateur non connecté'}
                        sx={{ 
                          bgcolor: '#e8f5e8',
                          '& .MuiInputBase-input': { 
                            color: '#2e7d32',
                            fontWeight: 500
                          }
                        }}
                      />
                      <Typography variant="caption" sx={{ color: '#666', mt: 0.5, display: 'block' }}>
                        Responsable assigné automatiquement
                      </Typography>
                    </Box>
                  )}
                </Box>

                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 3 }}>
                  <Box>
                    <Typography variant="body2" sx={{ mb: 1, fontWeight: 500, color: '#6c757d' }}>
                      MATRICULE
                    </Typography>
                    <TextField
                      size="small"
                      fullWidth
                      disabled={isViewMode}
                      value={formData.plate || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, plate: e.target.value }))}
                      sx={{ bgcolor: 'white' }}
                    />
                  </Box>
                  <Box>
                    <Typography variant="body2" sx={{ mb: 1, fontWeight: 500, color: '#6c757d' }}>
                      CHAUFFEUR
                    </Typography>
                    <TextField
                      size="small"
                      fullWidth
                      disabled={isViewMode}
                      value={formData.driver || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, driver: e.target.value }))}
                      sx={{ bgcolor: 'white' }}
                    />
                  </Box>
                </Box>

                <Box>
                  <Typography variant="body2" sx={{ mb: 1, fontWeight: 500, color: '#6c757d' }}>
                    CHANTIER
                  </Typography>
                  <TextField
                    size="small"
                    fullWidth
                    disabled={isViewMode}
                    value={formData.worksite || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, worksite: e.target.value }))}
                    sx={{ bgcolor: 'white' }}
                  />
                </Box>
              </Box>

              {/* MIDDLE SECTION - DETAILS */}
              <Box sx={{ p: 3, borderRight: '1px solid #e9ecef' }}>
                <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, color: '#495057', textTransform: 'uppercase' }}>
                  DETAILS
                </Typography>

                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" sx={{ mb: 1, fontWeight: 500, color: '#6c757d' }}>
                    CLIENT *
                  </Typography>
                  {isViewMode ? (
                    <TextField
                      size="small"
                      fullWidth
                      disabled
                      value={
                        editingReturnSlip?.client?.name || 
                        clients.find(c => c.id === formData.client_id)?.name || 
                        'Aucun client sélectionné'
                      }
                      sx={{ bgcolor: 'white' }}
                    />
                  ) : (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Autocomplete
                        size="small"
                        fullWidth
                        disabled={isViewMode}
                        options={clients}
                        getOptionLabel={(option) => option.name || option.nom || ''}
                        value={clients.find(c => c.id === formData.client_id) || null}
                        onChange={(event, newValue) => {
                          setFormData(prev => ({ ...prev, client_id: newValue ? newValue.id : 0 }))
                        }}
                        onInputChange={(event, newInputValue) => {
                          setClientSearchQuery(newInputValue)
                        }}
                        filterOptions={(options, { inputValue }) => {
                          if (!inputValue) return options;
                          const searchTerm = inputValue.toLowerCase();
                          return options.filter(option =>
                            (option.name || '').toLowerCase().includes(searchTerm) ||
                            (option.nom || '').toLowerCase().includes(searchTerm) ||
                            (option.phone || '').toLowerCase().includes(searchTerm) ||
                            (option.company || '').toLowerCase().includes(searchTerm)
                          )
                        }}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            placeholder="Rechercher un client..."
                            sx={{ bgcolor: 'white' }}
                          />
                        )}
                        renderOption={(props, option) => (
                          <Box component="li" {...props}>
                            <Box>
                              <Typography variant="body2" fontWeight={500}>
                                {option.name || option.nom}
                              </Typography>
                              {option.phone && (
                                <Typography variant="caption" color="text.secondary">
                                  {option.phone}
                                </Typography>
                              )}
                              {option.company && (
                                <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                                  • {option.company}
                                </Typography>
                              )}
                            </Box>
                          </Box>
                        )}
                      />
                      <IconButton 
                        size="small" 
                        sx={{ color: '#28a745' }}
                        onClick={() => setAddClientDialogOpen(true)}
                        title="Ajouter un nouveau client"
                      >
                        <AddIcon />
                      </IconButton>
                    </Box>
                  )}
                </Box>

                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 3 }}>
                  <Box>
                    <Typography variant="body2" sx={{ mb: 1, fontWeight: 500, color: '#6c757d' }}>
                      GRATUIT
                    </Typography>
                    <FormControl fullWidth size="small">
                      <Select
                        value={formData.is_free ? 'true' : 'false'}
                        onChange={(e) => setFormData(prev => ({ ...prev, is_free: e.target.value === 'true' }))}
                        disabled={isViewMode}
                        sx={{ bgcolor: 'white' }}
                      >
                        <MenuItem value="false">Non</MenuItem>
                        <MenuItem value="true">Oui</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>
                  <Box>
                    <Typography variant="body2" sx={{ mb: 1, fontWeight: 500, color: '#6c757d' }}>
                      TVA
                    </Typography>
                    <FormControl fullWidth size="small">
                      <Select
                        value={formData.tax_rate?.toString() || '20'}
                        onChange={(e) => setFormData(prev => ({ ...prev, tax_rate: Number(e.target.value) }))}
                        disabled={formData.is_free || isViewMode}
                        sx={{ bgcolor: 'white' }}
                      >
                        <MenuItem value="0">H.T</MenuItem>
                        <MenuItem value="20">TTC</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>
                </Box>

                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" sx={{ mb: 1, fontWeight: 500, color: '#6c757d' }}>
                    SOCIÉTÉ *
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Autocomplete
                      size="small"
                      fullWidth
                      disabled={isViewMode}
                      options={companies}
                      getOptionLabel={(option) => option.name || ''}
                      value={companies.find(c => c.id === formData.company_id) || null}
                      onChange={(event, newValue) => {
                        setFormData(prev => ({ ...prev, company_id: newValue ? newValue.id : 0 }))
                      }}
                      filterOptions={(options, { inputValue }) => {
                        return options.filter(option =>
                          (option.name || '').toLowerCase().includes(inputValue.toLowerCase()) ||
                          (option.city || '').toLowerCase().includes(inputValue.toLowerCase())
                        )
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          placeholder="Rechercher une société..."
                          sx={{ bgcolor: 'white' }}
                        />
                      )}
                      renderOption={(props, option) => (
                        <Box component="li" {...props}>
                          <Box>
                            <Typography variant="body2" fontWeight={500}>
                              {option.name}
                            </Typography>
                            {option.city && (
                              <Typography variant="caption" color="text.secondary">
                                {option.city}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      )}
                    />
                    <IconButton 
                      size="small" 
                      sx={{ color: '#28a745' }}
                      onClick={() => setAddCompanyDialogOpen(true)}
                      title="Ajouter une nouvelle société"
                    >
                      <AddIcon />
                    </IconButton>
                  </Box>
                </Box>

                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                  <Box>
                    <Typography variant="body2" sx={{ mb: 1, fontWeight: 500, color: '#6c757d' }}>
                      ENTETE DE
                    </Typography>
                    <Autocomplete
                      size="small"
                      fullWidth
                      disabled={isViewMode}
                      options={companies}
                      getOptionLabel={(option) => option.name || ''}
                      value={companies.find(c => c.id === formData.template_id) || null}
                      onChange={(event, newValue) => {
                        setFormData(prev => ({ ...prev, template_id: newValue ? newValue.id : 0 }))
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          placeholder="SÉLECTIONNEZ UNE OPTION"
                          sx={{ bgcolor: 'white' }}
                        />
                      )}
                      renderOption={(props, option) => (
                        <Box component="li" {...props}>
                          <Box>
                            <Typography variant="body2" fontWeight={500}>
                              {option.name}
                            </Typography>
                            {option.city && (
                              <Typography variant="caption" color="text.secondary">
                                {option.city}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      )}
                    />
                  </Box>
                  <Box>
                    <Typography variant="body2" sx={{ mb: 1, fontWeight: 500, color: '#6c757d' }}>
                      BCN/BCX
                    </Typography>
                    <TextField
                      size="small"
                      fullWidth
                      disabled={isViewMode}
                      value={formData.order_ref || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, order_ref: e.target.value }))}
                      placeholder="BCN/BCX"
                      sx={{ bgcolor: 'white' }}
                    />
                  </Box>
                </Box>
              </Box>

              {/* RIGHT SECTION - NOTES & DATE */}
              <Box sx={{ p: 3, bgcolor: '#f8f9fa' }}>
                <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, color: '#495057', textTransform: 'uppercase' }}>
                  NOTES
                </Typography>

                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" sx={{ mb: 1, fontWeight: 500, color: '#6c757d' }}>
                    DATE D'ÉMISSION
                  </Typography>
                  <TextField
                    size="small"
                    fullWidth
                    value={new Date().toLocaleString('fr-FR')}
                    disabled
                    sx={{ bgcolor: 'white' }}
                  />
                </Box>

                <Box>
                  <Typography variant="body2" sx={{ mb: 1, fontWeight: 500, color: '#6c757d' }}>
                    REMARQUES
                  </Typography>
                  <TextField
                    size="small"
                    fullWidth
                    multiline
                    rows={8}
                    disabled={isViewMode}
                    value={formData.notes || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    sx={{ bgcolor: 'white' }}
                  />
                </Box>
              </Box>
            </Box>

            {/* PRODUCTS SECTION */}
            <Box sx={{ p: 3, borderTop: '1px solid #e9ecef' }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: '#495057', textTransform: 'uppercase' }}>
                RÉFÉRENCES DU BON DE RETOUR
              </Typography>
              
              <Box sx={{ 
                bgcolor: '#fff3cd', 
                border: '1px solid #ffeaa7',
                borderRadius: 1,
                overflow: 'hidden',
                minWidth: '1100px' // Ensure minimum width for proper display
              }}>
                {/* Table Header */}
                <Box sx={{ 
                  display: 'grid', 
                  gridTemplateColumns: '40px 100px 1.5fr 80px 80px 50px 80px 80px 80px 80px 100px 80px 50px',
                  gap: 1,
                  p: 1,
                  bgcolor: '#f1c40f',
                  color: '#2c3e50',
                  fontWeight: 600,
                  fontSize: '0.75rem',
                  textAlign: 'center',
                  alignItems: 'center'
                }}>
                  <Box sx={{ textAlign: 'center' }}>#</Box>
                  <Box sx={{ textAlign: 'center' }}>TYPE</Box>
                  <Box sx={{ textAlign: 'center' }}>DÉSIGNATION</Box>
                  <Box sx={{ textAlign: 'center' }}>OP</Box>
                  <Box sx={{ textAlign: 'center' }}>ÉTAT</Box>
                  <Box sx={{ textAlign: 'center' }}>ÉP</Box>
                  <Box sx={{ textAlign: 'center' }}>LONGUEUR</Box>
                  <Box sx={{ textAlign: 'center' }}>LARGEUR</Box>
                  <Box sx={{ textAlign: 'center' }}>QTÉ</Box>
                  <Box sx={{ textAlign: 'center' }}>P.U</Box>
                  <Box sx={{ textAlign: 'center' }}>QTÉ/U</Box>
                  <Box sx={{ textAlign: 'center' }}>P.T</Box>
                  <Box></Box>
                </Box>

                {/* Existing Items */}
                {(() => {
                  return orderItems.length === 0 ? (
                    <Box sx={{ 
                      gridColumn: 'span 13',
                      p: 3,
                      textAlign: 'center',
                      color: '#6c757d',
                      fontStyle: 'italic'
                    }}>
                      Aucun élément ajouté. Cliquez sur "AJOUTER UNE RÉFÉRENCE" pour commencer.
                    </Box>
                  ) : (
                    orderItems.map((item, index) => {
                      return (
                    <Box key={index} sx={{ 
                      display: 'grid', 
                      gridTemplateColumns: '40px 100px 1.5fr 80px 80px 50px 80px 80px 80px 80px 100px 80px 50px',
                      gap: 1,
                      p: 1,
                      bgcolor: index % 2 === 0 ? 'white' : '#f8f9fa',
                      alignItems: 'center',
                      borderBottom: '1px solid #e9ecef'
                    }}>
                      <TextField
                        size="small"
                        value={item.group_number || item.group || index + 1}
                        disabled
                        sx={{ 
                          width: '100%',
                          '& .MuiInputBase-input': { 
                            textAlign: 'center',
                            fontSize: '0.75rem',
                            padding: '4px 6px'
                          }
                        }}
                      />
                      <FormControl size="small" fullWidth>
                        <Select
                          value={item.type || 'DÉBIT'}
                          onChange={(e) => updateOrderItem(index, 'type', e.target.value)}
                          disabled={isViewMode}
                          sx={{ 
                            fontSize: '0.75rem',
                            '& .MuiSelect-select': { 
                              fontSize: '0.75rem',
                              padding: '4px 8px'
                            }
                          }}
                        >
                          {['DÉBIT', 'TRANCHE', 'CARREAUX', 'PLINTHE', 'DOUBLE NEZ', 'SERVICE', 'BLOC', 'ESCALIER', 'ESCALIER ML', 'MASSIF', 'FONTAINE', 'VASQUE', 'CHEMINÉE', 'AROSASSE', 'GALÉ', 'DIVERS'].map(type => (
                            <MenuItem key={type} value={type}>{type}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      {isViewMode ? (
                        <TextField
                          size="small"
                          value={item.product || ''}
                          disabled
                          sx={{ 
                            width: '100%',
                            '& .MuiInputBase-input': { 
                              fontSize: '0.75rem',
                              padding: '4px 8px'
                            }
                          }}
                        />
                      ) : (
                        <FormControl size="small" fullWidth>
                          <Select
                            value={item.product || ''}
                            onChange={(e) => updateOrderItem(index, 'product', e.target.value)}
                            displayEmpty
                            sx={{ 
                              fontSize: '0.75rem',
                              '& .MuiSelect-select': { 
                                fontSize: '0.75rem',
                                padding: '4px 8px'
                              }
                            }}
                          >
                            <MenuItem value="">SÉLECTIONNER UNE OPTION</MenuItem>
                            {/* Add current product value if not in list */}
                            {item.product && !products.find(p => p.name === item.product) && (
                              <MenuItem key={item.product} value={item.product}>
                                {item.product}
                              </MenuItem>
                            )}
                            {products.map(product => (
                              <MenuItem key={product.id} value={product.name}>
                                {product.name}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      )}
                      {isViewMode ? (
                        <TextField
                          size="small"
                          value={item.options || ''}
                          disabled
                          sx={{ 
                            width: '100%',
                            '& .MuiInputBase-input': { 
                              fontSize: '0.75rem',
                              padding: '4px 8px'
                            }
                          }}
                        />
                      ) : (
                        <FormControl size="small" fullWidth>
                          <Select
                            value={item.options || ''}
                            onChange={(e) => updateOrderItem(index, 'options', e.target.value)}
                            displayEmpty
                            sx={{ 
                              fontSize: '0.75rem',
                              '& .MuiSelect-select': { 
                                fontSize: '0.75rem',
                                padding: '4px 8px'
                              }
                            }}
                          >
                            <MenuItem value="">SÉLECTIONNER</MenuItem>
                            {/* Add current options value if not in list */}
                            {item.options && !['Finition', 'Coupe', 'Polissage', 'Sciage'].includes(item.options) && (
                              <MenuItem key={item.options} value={item.options}>
                                {item.options}
                              </MenuItem>
                            )}
                            {['Finition', 'Coupe', 'Polissage', 'Sciage'].map(option => (
                              <MenuItem key={option} value={option}>{option}</MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      )}
                      <FormControl size="small" fullWidth>
                        <Select
                          value={item.state || 'Poli'}
                          onChange={(e) => updateOrderItem(index, 'state', e.target.value)}
                          disabled={isViewMode}
                          sx={{ 
                            fontSize: '0.75rem',
                            '& .MuiSelect-select': { 
                              fontSize: '0.75rem',
                              padding: '4px 8px'
                            }
                          }}
                        >
                          {productStates.map(state => (
                            <MenuItem key={state} value={state}>{state}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      <TextField
                        size="small"
                        value={item.splicer || item.thickness || ''}
                        onChange={(e) => updateOrderItem(index, 'thickness', e.target.value)}
                        disabled={isViewMode}
                        placeholder="2"
                        sx={{ 
                          width: '100%',
                          '& .MuiInputBase-input': { 
                            textAlign: 'center',
                            fontSize: '0.75rem',
                            padding: '4px 6px'
                          }
                        }}
                      />
                      <TextField
                        size="small"
                        type="number"
                        value={item.length || ''}
                        onChange={(e) => updateOrderItem(index, 'length', e.target.value)}
                        disabled={isViewMode}
                        placeholder="0"
                        sx={{ 
                          width: '100%',
                          '& .MuiInputBase-input': { 
                            textAlign: 'center',
                            fontSize: '0.75rem',
                            padding: '4px 6px'
                          }
                        }}
                      />
                      <TextField
                        size="small"
                        type="number"
                        value={item.width || ''}
                        onChange={(e) => updateOrderItem(index, 'width', e.target.value)}
                        disabled={isViewMode}
                        placeholder="0"
                        sx={{ 
                          width: '100%',
                          '& .MuiInputBase-input': { 
                            textAlign: 'center',
                            fontSize: '0.75rem',
                            padding: '4px 6px'
                          }
                        }}
                      />
                      <TextField
                        size="small"
                        type="number"
                        value={item.quantity || '1'}
                        onChange={(e) => updateOrderItem(index, 'quantity', e.target.value)}
                        disabled={isViewMode}
                        placeholder="1"
                        sx={{ 
                          width: '100%',
                          '& .MuiInputBase-input': { 
                            textAlign: 'center',
                            fontSize: '0.75rem',
                            padding: '4px 6px'
                          }
                        }}
                      />
                      <TextField
                        size="small"
                        type="number"
                        value={item.unit_price || '0'}
                        onChange={(e) => updateOrderItem(index, 'unit_price', e.target.value)}
                        disabled={isViewMode}
                        placeholder="0.00"
                        sx={{ 
                          width: '100%',
                          '& .MuiInputBase-input': { 
                            textAlign: 'center',
                            fontSize: '0.75rem',
                            padding: '4px 6px'
                          }
                        }}
                      />
                      <TextField
                        size="small"
                        value={item.total_quantity || ''}
                        disabled
                        sx={{ 
                          width: '100%',
                          '& .MuiInputBase-input': { 
                            textAlign: 'center',
                            fontSize: '0.75rem',
                            padding: '4px 6px'
                          }
                        }}
                      />
                      <TextField
                        size="small"
                        value={item.total_price || '0'}
                        disabled
                        sx={{ 
                          width: '100%',
                          '& .MuiInputBase-input': { 
                            textAlign: 'center',
                            fontSize: '0.75rem',
                            padding: '4px 6px',
                            fontWeight: 500
                          }
                        }}
                      />
                      <IconButton
                        size="small"
                        onClick={() => removeOrderItem(index)}
                        disabled={isViewMode}
                        sx={{ color: '#dc3545' }}
                      >
                        <DeleteIcon sx={{ fontSize: '16px' }} />
                      </IconButton>
                    </Box>
                      )
                    })
                  )
                })()}

                {/* Summary Row */}
                <Box sx={{ 
                  display: 'grid', 
                  gridTemplateColumns: '40px 100px 1.5fr 80px 80px 50px 80px 80px 80px 80px 100px 80px 50px',
                  gap: 1,
                  p: 1,
                  bgcolor: '#17a2b8',
                  color: 'white',
                  fontWeight: 600,
                  fontSize: '0.75rem'
                }}>
                  <Box></Box>
                  <Box></Box>
                  <Box sx={{ textAlign: 'right' }}>TOTAL:</Box>
                  <Box></Box>
                  <Box></Box>
                  <Box></Box>
                  <Box></Box>
                  <Box></Box>
                  <Box></Box>
                  <Box></Box>
                  <Box></Box>
                  <Box></Box>
                  <Box sx={{ textAlign: 'center' }}>{calculateTotal().toFixed(2)}</Box>
                  <Box></Box>
                </Box>
              </Box>

              {/* Add Reference Button */}
              {!isViewMode && (
                <Box sx={{ mt: 2 }}>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={addNewOrderItem}
                    sx={{
                      bgcolor: '#28a745',
                      color: 'white',
                      '&:hover': { bgcolor: '#218838' },
                      textTransform: 'none',
                      fontWeight: 600
                    }}
                  >
                    + AJOUTER UNE RÉFÉRENCE
                  </Button>
                </Box>
              )}

              {/* PAIEMENTS Section with Summary Panel */}
              <Box sx={{ mt: 4 }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: '#495057', textTransform: 'uppercase' }}>
                  PAIEMENTS
                </Typography>
                
                <Box sx={{ display: 'flex', gap: 3 }}>
                  {/* Payments Table - Left side */}
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ 
                      bgcolor: '#fff3cd', 
                      border: '1px solid #ffeaa7',
                      borderRadius: 1,
                      overflow: 'hidden'
                    }}>
                      {/* Payments Header */}
                      <Box sx={{ 
                        display: 'grid', 
                        gridTemplateColumns: '1fr 1fr 2fr 1fr',
                        gap: 1,
                        p: 1,
                        bgcolor: '#f1c40f',
                        color: '#2c3e50',
                        fontWeight: 600,
                        fontSize: '0.875rem',
                        textAlign: 'center',
                        alignItems: 'center'
                      }}>
                        <Box>TYPE</Box>
                        <Box>MONTANT</Box>
                        <Box>N° CHÈQUE/COMPTE BANCQUAIRE</Box>
                        <Box>DATE</Box>
                      </Box>

                      {/* No payments message */}
                      <Box sx={{ 
                        p: 3,
                        textAlign: 'center',
                        color: '#6c757d',
                        fontStyle: 'italic',
                        bgcolor: 'white'
                      }}>
                        Il n'y a aucun élément à afficher.
                      </Box>
                    </Box>

                    {/* Add Payment Button */}
                    {!isViewMode && (
                      <Box sx={{ mt: 2 }}>
                        <Button
                          variant="contained"
                          startIcon={<AddIcon />}
                          sx={{
                            bgcolor: '#28a745',
                            color: 'white',
                            '&:hover': { bgcolor: '#218838' },
                            textTransform: 'none',
                            fontWeight: 600
                          }}
                        >
                          + AJOUTER UNE RÉFÉRENCE
                        </Button>
                      </Box>
                    )}
                  </Box>

                  {/* Summary Panel - Right side */}
                  <Box sx={{ 
                    width: '300px',
                    bgcolor: 'white',
                    border: '1px solid #dee2e6',
                    borderRadius: 1,
                    p: 2,
                    alignSelf: 'flex-start'
                  }}>
                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" fontWeight={600}>TOTAL H.T:</Typography>
                        <Typography variant="body2" fontWeight={600}>{calculateTotal().toFixed(2)} DHs</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" fontWeight={600}>TOTAL T.T.C:</Typography>
                        <Typography variant="body2" fontWeight={600}>{calculateTotal().toFixed(2)} DHs</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" fontWeight={600}>0.00 DHs</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="body2" fontWeight={600}>RESTE/AVOIR:</Typography>
                        <Typography variant="body2" fontWeight={600}>{calculateTotal().toFixed(2)} DHs</Typography>
                      </Box>
                      <Button
                        variant="contained"
                        fullWidth
                        sx={{
                          bgcolor: '#dc3545',
                          color: 'white',
                          '&:hover': { bgcolor: '#c82333' },
                          textTransform: 'none',
                          fontWeight: 600,
                          py: 1.5
                        }}
                      >
                        CALCULER!
                      </Button>
                    </Box>
                  </Box>
                </Box>
              </Box>
            </Box>
            </Box> {/* Close main content */}
          </Box> {/* Close flex container */}
        </DialogContent>
        <DialogActions sx={{ p: 3, borderTop: '1px solid #e9ecef', bgcolor: '#f8f9fa' }}>
          <Button onClick={() => setDialogOpen(false)} sx={{ mr: 2 }}>
            Annuler
          </Button>
          {!isViewMode && (
            <Button onClick={handleSave} variant="contained">
              {editingReturnSlip ? 'Modifier' : 'Créer'}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirmer la suppression</DialogTitle>
        <DialogContent>
          <Typography>
            Êtes-vous sûr de vouloir supprimer le bon de retour "{returnSlipToDelete?.human_id || `R-${returnSlipToDelete?.id}`}" ?
            Cette action ne peut pas être annulée.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Annuler</Button>
          <Button onClick={handleDelete} variant="contained" color="error">
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
      >
        <Alert
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}