import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import * as clientService from '../services/clientServiceApi';
import { CompanyService } from '../services/companyServiceApi';
import * as productService from '../services/productServiceApi';
import { receptionSlipServiceApi } from '../services/receptionSlipServiceApi';
import type { PaginationParams } from '../services/orderServiceApi';
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

import OrderPDF from '../components/pdf/OrderPDF'
import { pdf } from '@react-pdf/renderer'
import { orderValidationSchema, validateForm } from '../utils/validation'
import type { 
  Order, 
  OrderItem, 
  NewOrderItem,
  Client, 
  Product, 
  Company,
  CreateOrderData,
  UpdateOrderData
} from '../types/database.types'



export default function ReceptionSlips() {
  const navigate = useNavigate()
  const [receptionSlips, setReceptionSlips] = useState<Order[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingOrder, setEditingOrder] = useState<Order | null>(null)
  const [isViewMode, setIsViewMode] = useState(false) // Track if form is in view mode
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null)
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
    thisMonth: 0,
    totalValue: 0,
    avgValue: 0
  })
  
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' })

  // Additional state for new Laravel-style form
  const [loadingClients, setLoadingClients] = useState(false)
  const [loadingCompanies, setLoadingCompanies] = useState(false)
  const [addClientDialogOpen, setAddClientDialogOpen] = useState(false)
  const [addCompanyDialogOpen, setAddCompanyDialogOpen] = useState(false)
  
  // Client search and add functionality (same as Quotes)
  const [clientSearchQuery, setClientSearchQuery] = useState('')
  
  // Form data
  const [formData, setFormData] = useState({
    client_id: 0,
    company_id: 0, // Laravel: company relationship
    user_id: 0, // Laravel: salesperson 
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

  // Order items with complete Laravel structure
  const [orderItems, setOrderItems] = useState<any[]>([])
  const [newItem, setNewItem] = useState({
    group: 1,
    type: 'DÉBIT',
    product: '',
    options: '',
    state: 'Poli',
    splicer: 2,
    length: null,
    width: null,
    quantity: 1,
    unit_price: 0,
    total_quantity: '',
    total_price: 0,
    unit: 'M2'
  })

  // Laravel product types and options
  const productTypes = ['DÉBIT', 'TRANCHE', 'CARREAUX', 'PLINTHE', 'DOUBLE NEZ', 'SERVICE', 'BLOC', 'ESCALIER', 'ESCALIER ML', 'MASSIF', 'FONTAINE', 'VASQUE', 'CHEMINÉE', 'AROSASSE', 'GALÉ', 'DIVERS', 'VOYAGE']
  const productOptions = ['Finition', 'Coupe', 'Polissage', 'Sciage']
  const [productStates, setProductStates] = useState<string[]>(['Poli', 'Brut', 'Adouci']) // Dynamic états

  const receptionSlipStatuses = ['draft', 'sent', 'accepted', 'rejected', 'expired', 'converted']
  const paymentStatuses = ['unpaid', 'partial', 'paid', 'refunded']

  useEffect(() => {
    fetchReceptionSlips()
  }, [page, limit, searchTerm])

  useEffect(() => {
    fetchRelatedData()
    loadProductStates()
  }, [])

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
      // Keep fallback states
    }
  }

  const fetchReceptionSlips = async () => {
    setLoading(true)
    try {
      let result
      
      if (searchTerm) {
        result = await receptionSlipServiceApi.searchReceptionSlips(searchTerm, page, limit)
      } else {
        result = await receptionSlipServiceApi.getReceptionSlips(page, limit, '')
      }
      
      if (result.success) {
        // Convert service Order[] to database Order[] by mapping the items
        const convertedReceptionSlips = (result.data || []).map(receptionSlip => ({
          ...receptionSlip,
          items: receptionSlip.items?.map(item => ({
            ...item,
            order_id: receptionSlip.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }))
        }))
        
        setReceptionSlips(convertedReceptionSlips as Order[])
        if ((result as any).pagination) {
          setTotalItems((result as any).pagination.totalCount)
          setTotalPages((result as any).pagination.totalPages)
        }
        // Calculate statistics
        calculateStats(convertedReceptionSlips as Order[])
      } else {
        showSnackbar(result.error || 'Failed to fetch reception slips', 'error')
      }
    } catch (error) {
      showSnackbar('Error fetching reception slips', 'error')
    }
    setLoading(false)
  }

  const fetchRelatedData = async () => {
    try {
      setLoadingClients(true)
      setLoadingCompanies(true)
      

      
      const [clientsResult, companiesResult, productsResult] = await Promise.all([
        clientService.getClients(1, 100, '').catch(err => {
          console.error('❌ Error fetching clients:', err)
          return { data: [], success: false, error: err.message }
        }),
        CompanyService.getAll().catch(err => {
          console.error('❌ Error fetching companies:', err)
          return { data: [], success: false, error: err.message }
        }),
        productService.getProducts({ limit: 10000 }).then(response => response.data).catch(err => {
          console.error('❌ Error fetching products:', err)
          return { data: [], success: false, error: err.message }
        })
      ])



      // Handle clients response
      if (clientsResult && (clientsResult as any).clients) {
        setClients((clientsResult as any).clients)

      } else if (clientsResult && (clientsResult as any).data) {
        setClients((clientsResult as any).data)

      } else if (Array.isArray(clientsResult)) {
        setClients(clientsResult)

      } else {
        setClients([])

      }

      // Handle companies response  
      if (companiesResult && (companiesResult as any).companies) {
        setCompanies((companiesResult as any).companies)

      } else if (companiesResult && (companiesResult as any).data) {
        setCompanies((companiesResult as any).data)

      } else if (Array.isArray(companiesResult)) {
        setCompanies(companiesResult)

      } else {
        setCompanies([])

      }

      // Handle products response
      if (productsResult && (productsResult as any).products) {
        setProducts((productsResult as any).products)

      } else if (productsResult && (productsResult as any).data) {
        setProducts((productsResult as any).data)

      } else if (Array.isArray(productsResult)) {
        setProducts(productsResult)

      } else {
        setProducts([])

      }
      
    } catch (error) {
      console.error('❌ Error fetching related data:', error)
      setClients([])
      setCompanies([])
      setProducts([])
    } finally {
      setLoadingClients(false)
      setLoadingCompanies(false)
    }
  }





  const handleEdit = async (order: Order) => {
    try {
      setLoading(true)
      
      // Ensure related data is loaded first
      if (clients.length === 0 || companies.length === 0) {
        await fetchRelatedData()
      }
      
      // If client is not in the current clients list, add it from the order data
      if (order.client && !clients.find(c => c.id === order.client_id)) {
        setClients(prev => [order.client!, ...prev])
      }
      
      // If company is not in the current companies list, add it from the order data
      if (order.company && !companies.find(c => c.id === order.company_id)) {
        setCompanies(prev => [order.company!, ...prev])
      }
      
      // Fetch complete reception slip details with items from API
      const result = await receptionSlipServiceApi.getReceptionSlip(order.id)
      
      if (result.success && result.data) {
        const fullOrder = result.data
        setEditingOrder(fullOrder as any)
        
        // Populate ALL form fields matching Laravel exactly
        const populatedFormData = {
          client_id: fullOrder.client_id || 0,
          company_id: fullOrder.company_id || 0,
          user_id: (fullOrder as any).user_id || 0,
          template_id: (fullOrder as any).template_id || fullOrder.company_id || 0,
          order_ref: fullOrder.order_ref || '',
          driver: (fullOrder as any).driver || '',
          plate: (fullOrder as any).plate || '',
          worksite: (fullOrder as any).worksite || '',
          tax_rate: fullOrder.tax_rate || 20,
          is_free: (fullOrder as any).is_free || false,
          notes: fullOrder.notes || '',
          status: fullOrder.status || 'draft',
          items: fullOrder.items || [],
          payments: (fullOrder as any).payments || [], // Add payments
          taxable_amount: (fullOrder as any).taxable_amount || 0,
          total_taxes: (fullOrder as any).total_taxes || 0,
          total_amount: fullOrder.total_amount || 0
        }
        
        setFormData(populatedFormData)
        
        // FORCE ITEMS TO SHOW - Direct simple approach

        
        // Force set order items regardless
        const items = fullOrder.items || []

        
        if (items.length > 0) {
          const mappedItems = items.map((item: any, index: number) => {
            console.log(`🔥 MAPPING ITEM ${index + 1}:`, item)
            console.log(`🔥 PRODUCT FIELD:`, item.product)
            console.log(`🔥 OPTIONS FIELD:`, item.options)
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
          console.log('✅ Items mapped successfully:', mappedItems.length)
          setOrderItems(mappedItems)
          
          // Update form data with items
          setFormData(prev => ({
            ...prev,
            items: mappedItems
          }))
        } else {
          console.log('ℹ️ No items found for this order')
          setOrderItems([])
        }
        
        // Set edit mode and open dialog
        setIsViewMode(false)
        setDialogOpen(true)
      } else {
        showSnackbar('Error loading order details', 'error')
      }
    } catch (error) {
      console.error('Error fetching order details:', error)
      showSnackbar('Error loading order details', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleView = async (order: Order) => {
    try {
      console.log('🔍 handleView called with order:', order)
      setLoading(true)
      
      // Ensure related data is loaded first
      if (clients.length === 0 || companies.length === 0) {
        await fetchRelatedData()
      }
      
      // If client is not in the current clients list, add it from the order data
      if (order.client && !clients.find(c => c.id === order.client_id)) {
        setClients(prev => [order.client!, ...prev])
      }
      
      // If company is not in the current companies list, add it from the order data
      if (order.company && !companies.find(c => c.id === order.company_id)) {
        setCompanies(prev => [order.company!, ...prev])
      }
      
      // Fetch complete order details with items from API
      console.log('📞 Calling receptionSlipServiceApi.getReceptionSlip for ID:', order.id)
      const result = await receptionSlipServiceApi.getReceptionSlip(order.id)
      console.log('📋 receptionSlipServiceApi.getReceptionSlip result:', result)
      
      if (result.success && result.data) {
        const fullOrder = result.data
        console.log('✅ Setting viewing order for form:', fullOrder)
        
        setEditingOrder(fullOrder as any)
        
        // Populate ALL form fields exactly like edit but for viewing
        const populatedFormData = {
          client_id: fullOrder.client_id || 0,
          company_id: fullOrder.company_id || 0,
          user_id: (fullOrder as any).user_id || 0,
          template_id: (fullOrder as any).template_id || fullOrder.company_id || 0,
          order_ref: fullOrder.order_ref || '',
          driver: (fullOrder as any).driver || '',
          plate: (fullOrder as any).plate || '',
          worksite: (fullOrder as any).worksite || '',
          tax_rate: fullOrder.tax_rate || 20,
          is_free: (fullOrder as any).is_free || false,
          notes: fullOrder.notes || '',
          status: fullOrder.status || 'draft',
          items: fullOrder.items || [],
          payments: (fullOrder as any).payments || [],
          taxable_amount: (fullOrder as any).taxable_amount || 0,
          total_taxes: (fullOrder as any).total_taxes || 0,
          total_amount: fullOrder.total_amount || 0
        }
        
        setFormData(populatedFormData)
        
        // Debug payments
        console.log('🔍 PAYMENTS from API:', (fullOrder as any).payments)
        console.log('🔍 Full order payments:', fullOrder.payments)
        console.log('🔍 Order keys:', Object.keys(fullOrder))
        
        // Set items if they exist
        const items = fullOrder.items || []
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
          console.log('✅ All items mapped:', mappedItems)
          setOrderItems(mappedItems)
          setFormData(prev => ({ ...prev, items: mappedItems }))
        } else {
          setOrderItems([])
        }
        
        // Set the data for the EDIT FORM but in VIEW MODE (all inputs disabled)
        setEditingOrder(fullOrder as any)
        
        // Set view mode and open EDIT dialog (same form, inputs disabled)
        setIsViewMode(true)
        setDialogOpen(true)
      } else {
        console.error('❌ Failed to load order details:', result.error)
        showSnackbar(`Error loading order details: ${result.error}`, 'error')
      }
    } catch (error) {
      console.error('💥 Exception in handleView:', error)
      showSnackbar('Error loading order details', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      // Validate form data
      const errors = await validateForm(orderValidationSchema, formData);
      if (Object.keys(errors).length > 0) {
        showSnackbar('Please fix validation errors', 'error');
        return;
      }

      // Map orderItems to the format expected by the service
      const serviceItems = orderItems.map(item => ({
        group: item.group || item.group_number || 1,
        type: item.type || 'DÉBIT',
        product: item.product || 'N/A',
        options: item.options || '',
        state: item.state || 'Poli',
        splicer: item.splicer || 2,
        length: item.length || null,
        width: item.width || null,
        quantity: item.quantity || 1,
        unit_price: item.unit_price || 0,
        total_quantity: item.total_quantity || '',
        total_price: item.total_price || 0,
        unit: item.unit || 'M2',
        full_product_description: item.full_product_description || item.product || 'N/A',
        measures: item.measures || null,
        product_id: item.product_id || null,
        product_name: item.product_name || item.product || 'N/A'
      }))

      const orderData = {
        ...formData,
        items: serviceItems
      }
      

      
      const result = editingOrder
        ? await receptionSlipServiceApi.updateReceptionSlip(editingOrder.id, orderData as any)
        : await receptionSlipServiceApi.createReceptionSlip(orderData as any)

      if (result.success) {
        showSnackbar(
          editingOrder ? 'Order updated successfully' : 'Order created successfully',
          'success'
        )
        setDialogOpen(false)
        fetchReceptionSlips()
      } else {
        showSnackbar(result.error || 'Failed to save reception slip', 'error')
      }
    } catch (error) {
      showSnackbar('Error saving order', 'error')
    }
  }

  const handleDeleteClick = (order: Order) => {
    setOrderToDelete(order)
    setDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!orderToDelete) return

    try {
      console.log('🗑️ Deleting reception slip:', orderToDelete.id);
      const result = await receptionSlipServiceApi.deleteReceptionSlip(orderToDelete.id)
      console.log('🗑️ Delete result:', result);
      
      if (result.success) {
        showSnackbar('Order deleted successfully', 'success')
        setDeleteDialogOpen(false)
        setOrderToDelete(null)
        fetchReceptionSlips()
      } else {
        console.error('❌ Delete failed:', result.error);
        showSnackbar(result.error || 'Failed to delete reception slip', 'error')
      }
    } catch (error) {
      showSnackbar('Error deleting order', 'error')
    }
  }

  const handleMarkAsDelivered = async (order: Order) => {
    try {
      // 🚀 AUTOMATIC STOCK MANAGEMENT: Increase stock when reception slip is delivered/confirmed
      if (order.company_id && order.items && order.items.length > 0 && order.status !== 'delivered') {
        try {
          const stockItems = order.items
            .filter(item => item.product_id && item.quantity)
            .map(item => ({
              product_id: item.product_id!,
              quantity: item.quantity || 1
            }))

          if (stockItems.length > 0) {
            await orderStockIntegration.processReceptionSlipConfirmation(order.company_id, stockItems, order.id)
            console.log(`✅ Stock automatically increased for reception slip ${order.id}`)
          }
        } catch (stockError) {
          console.error('Failed to increase stock:', stockError)
          showSnackbar('⚠️ Réception confirmée mais erreur lors de la mise à jour du stock', 'error')
        }
      }

      const result = await receptionSlipServiceApi.updateReceptionSlip(order.id, { status: 'delivered' })
      if (result.success) {
        showSnackbar('📦 Bon de réception confirmé (stock augmenté automatiquement)', 'success')
        fetchReceptionSlips()
      } else {
        showSnackbar(result.error || 'Failed to mark reception slip as delivered', 'error')
      }
    } catch (error) {
      showSnackbar('Error marking order as delivered', 'error')
    }
  }

  const addNewPayment = () => {
    const newPayment = {
      type: 'CHÈQUE',
      amount: '',
      check_number: '', // Use database field name
      date: new Date().toISOString().split('T')[0],
      notes: ''
    }
    
    setFormData(prev => ({
      ...prev,
      payments: [...prev.payments, newPayment]
    }))
    console.log('✅ New payment added:', newPayment)
  }

  const updatePayment = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      payments: prev.payments.map((payment: any, i: number) => 
        i === index ? { ...payment, [field]: value } : payment
      )
    }))
  }

  const removePayment = (index: number) => {
    setFormData(prev => ({
      ...prev,
      payments: prev.payments.filter((_: any, i: number) => i !== index)
    }))
    console.log('✅ Payment removed at index:', index)
  }

  const removeOrderItem = (index: number) => {
    setOrderItems(prev => prev.filter((_, i) => i !== index))
    console.log('✅ Item removed at index:', index)
  }

  const updateOrderItem = (index: number, field: string, value: string | number) => {
    setOrderItems(prev => prev.map((item, i) => {
      if (i === index) {
        const updatedItem = { ...item, [field]: value }
        
        // Auto-calculate total_quantity and total_price when relevant fields change
        if (['quantity', 'length', 'width', 'unit_price'].includes(field)) {
          const qty = Number(updatedItem.quantity) || 0
          const length = Number(updatedItem.length) || 0
          const width = Number(updatedItem.width) || 0
          const unitPrice = Number(updatedItem.unit_price) || 0
          
          // Calculate total quantity (quantity * length * width for area-based items)
          if (length > 0 && width > 0) {
            updatedItem.total_quantity = (qty * length * width).toFixed(2)
          } else {
            updatedItem.total_quantity = qty.toString()
          }
          
          // Calculate total price
          updatedItem.total_price = (qty * unitPrice).toFixed(2)
        }
        
        return updatedItem
      }
      return item
    }))
  }

  const addNewOrderItem = () => {
    const newOrderItem = {
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
    
    setOrderItems(prev => [...prev, newOrderItem])
    console.log('✅ New item added:', newOrderItem)
  }

  const addOrderItem = () => {
    if (newItem.product_id === 0) return

    const product = products.find(p => p.id === newItem.product_id)
    if (!product) return

    const item = {
      ...newItem,
      unit_price: product.price || 0,
      total_price: newItem.quantity * (product.price || 0),
      order_id: 0, // Will be set when the order is created
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    } as Omit<OrderItem, 'id'>

    setOrderItems(prev => [...prev, item])
    setNewItem({
      product_id: 0,
      quantity: 1,
      unit_price: 0,
      total_price: 0
    })
  }

  const calculateTotal = () => {
    return orderItems.reduce((sum, item) => sum + item.total_price, 0)
  }

  // Laravel-style calculation functions (exact same logic as Laravel CreateOrderTrait)
  const getUnit = (type: string, product: string): string => {
    if (type === 'PLINTHE' || type === 'DOUBLE NEZ' || product.startsWith('FINITION') || type.includes(' ML')) {
      return 'ML';
    } else if (type === 'BLOC') {
      return 'TON';
    } else if (type === 'VOYAGE') {
      return 'M3';
    } else if (['FONTAINE', 'AROSASSE', 'VASQUE', 'CHEMINÉE', 'MASSIF', 'GALÉ', 'DIVERS'].includes(type)) {
      return 'PIÉCE';
    } else if (type === 'SERVICE' && !product.startsWith('COUPE')) {
      return 'F';
    } else {
      return 'M2';
    }
  };

  const calculateItemQuantity = (type: string, unit: string, width: number, length: number, splicer: number, quantity: number): number => {
    switch (unit) {
      case 'M2':
        return length * width * quantity;
      case 'M3':
        return quantity;
      case 'ML':
        return length * quantity;
      case 'TON':
        if (type === 'MASSIF') {
          return length * width * splicer;
        }
        return quantity;
      default:
        return quantity;
    }
  };

  const convertToUnit = (unit: string, total: number, type: string): number => {
    switch (unit) {
      case 'M2':
        return total / 10000;
      case 'M3':
        return total;
      case 'ML':
        return total / 100;
      case 'TON':
        if (type === 'MASSIF') {
          return (total / 1000000) * 2.7;
        }
        return total;
      default:
        return total;
    }
  };

  const calculateTotalQuantity = (items: any[], unit: string): number => {
    let totalQuantity = 0;
    
    items.forEach((item) => {
      totalQuantity += calculateItemQuantity(
        item.type,
        unit,
        parseFloat(item.width) || 0,
        parseFloat(item.length) || 0,
        parseFloat(item.splicer) || 0,
        parseFloat(item.quantity) || 0
      );
    });

    if (totalQuantity !== 0) {
      totalQuantity = convertToUnit(unit, totalQuantity, items[0]?.type);
    }

    return Math.round(totalQuantity * 100) / 100; // Round to 2 decimals
  };

  // Laravel-style CALCULER! function (exact same as Laravel)
  const calculateAllTotals = () => {
    if (formData.is_free) {
      showSnackbar('Bon de réception gratuit - pas de calcul nécessaire', 'success');
      return;
    }

    // Group items by group number (Laravel logic)
    const groupedItems = orderItems.reduce((groups: any, item: any) => {
      const group = item.group || item.group_number || 1;
      if (!groups[group]) {
        groups[group] = [];
      }
      groups[group].push(item);
      return groups;
    }, {});

    // Recalculate each group (Laravel logic)
    const recalculatedItems: any[] = [];
    
    Object.entries(groupedItems).forEach(([groupNumber, items]: [string, any]) => {
      const groupItems = items as any[];
      const firstItem = groupItems[0];
      const unit = getUnit(firstItem.type, firstItem.product);
      const totalQuantity = calculateTotalQuantity(groupItems, unit);

      groupItems.forEach((item, index) => {
        if (index !== 0) {
          // Not first item in group - clear totals
          recalculatedItems.push({
            ...item,
            total_quantity: null,
            total_price: null
          });
        } else {
          // First item in group - calculate totals
          const calculatedTotalPrice = totalQuantity && item.unit_price 
            ? Math.round(totalQuantity * parseFloat(item.unit_price) * 100) / 100
            : null;

          recalculatedItems.push({
            ...item,
            total_quantity: `${totalQuantity}${unit}`,
            total_price: calculatedTotalPrice
          });
        }
      });
    });

    // Update items
    setOrderItems(recalculatedItems);

    // Calculate taxes (Laravel logic)
    const taxableAmount = recalculatedItems.reduce((sum, item) => sum + (parseFloat(item.total_price) || 0), 0);
    let totalTaxes = 0;
    let totalAmount = taxableAmount;

    if (formData.tax_rate === 20) {
      totalTaxes = taxableAmount * 0.2;
      totalAmount = taxableAmount + totalTaxes;
    }

    // Update form data with calculated totals
    setFormData(prev => ({
      ...prev,
      taxable_amount: taxableAmount,
      total_taxes: totalTaxes,
      total_amount: totalAmount
    }));

    showSnackbar(`Calculs terminés! Total: ${totalAmount.toFixed(2)} DHs`, 'success');
  };

  // Calculate total payments for an order
  const calculateTotalPayments = (payments: any[] = []) => {
    return payments.reduce((sum: number, payment: any) => {
      return sum + (parseFloat(payment.amount) || 0)
    }, 0)
  }

  // Calculate remaining amount (total - paid)
  const calculateRemainingAmount = (totalAmount: number, payments: any[] = []) => {
    const totalPaid = calculateTotalPayments(payments)
    return totalAmount - totalPaid
  }

  // Convert date from DD/MM/YYYY to YYYY-MM-DD format for HTML date input
  const convertDateToInputFormat = (dateString: string | null) => {
    if (!dateString || dateString === 'null') return ''
    
    // If already in YYYY-MM-DD format, return as is
    if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return dateString
    }
    
    // Convert from DD/MM/YYYY to YYYY-MM-DD
    if (dateString.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
      const [day, month, year] = dateString.split('/')
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
    }
    
    return ''
  }

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity })
  }

  // Calculate statistics from orders data
  const calculateStats = (receptionSlipsData: Order[]) => {
    const now = new Date()
    const thisMonth = receptionSlipsData.filter(o => {
      const orderDate = new Date(o.created_at)
      return orderDate.getMonth() === now.getMonth() && orderDate.getFullYear() === now.getFullYear()
    })
    
    const totalValue = receptionSlipsData.reduce((sum, o) => sum + (o.total_amount || 0), 0)
    const avgValue = receptionSlipsData.length > 0 ? totalValue / receptionSlipsData.length : 0
    
    setStats({
      total: totalItems, // Use totalItems from pagination for accurate count
      thisMonth: thisMonth.length,
      totalValue: totalValue,
      avgValue: avgValue
    })
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await fetchReceptionSlips()
      showSnackbar('Données actualisées avec succès', 'success')
    } catch (error) {
      showSnackbar('Erreur lors de l\'actualisation', 'error')
    }
    setRefreshing(false)
  }

  const handleAdd = async () => {
    try {
      console.log('🚀 Starting handleAdd...')
      setEditingOrder(null)
      
      // Fetch related data first
      console.log('🔍 Fetching related data for new reception slip...')
      await fetchRelatedData()
      console.log('✅ Related data fetched successfully')
      
      setFormData({
        client_id: 0,
        company_id: 0,
        user_id: 0,
        template_id: 0,
        order_ref: '',
        driver: '',
        plate: '',
        worksite: '',
        tax_rate: 20,
        is_free: false,
        notes: '',
        status: 'draft',
        items: [],
        payments: [], // Add missing payments field
        taxable_amount: 0,
        total_taxes: 0,
        total_amount: 0
      })
      setOrderItems([])
      console.log('✅ Form data reset')
      
      setDialogOpen(true)
      console.log('✅ Dialog opened - dialogOpen set to true')
    } catch (error) {
      console.error('❌ Error in handleAdd:', error)
      showSnackbar('Error opening new reception slip dialog', 'error')
    }
  }

  const handlePrintOrder = async (order: Order) => {
    try {
      // Order data for PDF
      const orderForPdf = {
        id: order.id,
        order_number: order.order_number || `O-${order.id}`,
        order_date: order.order_date,
        delivery_date: order.delivery_date,
        status: order.status,
        notes: order.notes,
        total_amount: order.total_amount,
        client_id: order.client_id,
        company_id: order.company_id,
        client: order.client || clients.find(c => c.id === order.client_id),
        company: order.company || companies.find(c => c.id === order.company_id),
        order_items: order.items?.map((item: OrderItem) => ({
          ...item,
          product: item.product || products.find(p => p.id === item.product_id)
        })) || []
      }

      const blob = await pdf(
        <OrderPDF order={orderForPdf} isQuote={true} />
      ).toBlob()
      
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `order-${order.order_number || order.id}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      showSnackbar('Order PDF generated successfully', 'success')
    } catch (error) {
      console.error('Error generating PDF:', error)
      showSnackbar('Error generating PDF', 'error')
    }
  }

  const handleInputChange = (field: keyof CreateOrderData) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }))
  }

  const handleSelectChange = (field: string) => (
    event: any
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }))
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'default'
      case 'sent': return 'info'
      case 'accepted': return 'success'
      case 'rejected': return 'error'
      case 'expired': return 'warning'
      case 'converted': return 'primary'
      default: return 'default'
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
                BONS DE LIVRAISON
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Gestion des bons de livraison et réceptions
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
              Nouveau Bon de Livraison
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
                    Total Bons de Livraison
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
              ) : receptionSlips.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                      <DocumentIcon sx={{ fontSize: 64, color: 'text.disabled' }} />
                      <Typography variant="h6" color="text.secondary">
                        Aucun bon de livraison trouvé
                      </Typography>
                      <Typography variant="body2" color="text.disabled">
                        {searchTerm ? 'Essayez de modifier vos critères de recherche' : 'Commencez par créer votre premier bon de livraison'}
                      </Typography>
                      {!searchTerm && (
                        <Button variant="contained" startIcon={<AddIcon />} onClick={handleAdd} sx={{ mt: 2 }}>
                          Créer un Bon de Livraison
                        </Button>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                receptionSlips.map((receptionSlip, index) => (
                  <TableRow 
                    key={receptionSlip.id} 
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
                            {receptionSlip.order_number || `R-${receptionSlip.id}`}
                          </Typography>
                          {receptionSlip.order_ref && (
                            <Typography variant="caption" color="text.secondary">
                              Réf: {receptionSlip.order_ref}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ py: 2 }}>
                      <Box>
                        <Typography variant="body2" fontWeight="500">
                          {receptionSlip.client?.name || 'Client Inconnu'}
                        </Typography>
                        {receptionSlip.client?.phone && (
                          <Typography variant="caption" color="text.secondary">
                            {receptionSlip.client.phone}
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell sx={{ py: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PersonIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Typography variant="body2">
                          {receptionSlip.user?.name || 'Non Assigné'}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ py: 2 }}>
                      <Typography variant="body2">
                        {receptionSlip.driver || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ py: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        {receptionSlip.plate || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell align="right" sx={{ py: 2 }}>
                      <Box>
                        <Typography variant="body2" fontWeight="600" color="success.main">
                          {(receptionSlip.total_amount || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} MAD
                        </Typography>
                        {receptionSlip.tax_rate && receptionSlip.tax_rate > 0 ? (
                          <Typography variant="caption" color="text.secondary">
                            TTC {receptionSlip.tax_rate}%
                          </Typography>
                        ) : null}
                      </Box>
                    </TableCell>
                    <TableCell sx={{ py: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CalendarIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Typography variant="body2">
                          {new Date(receptionSlip.created_at).toLocaleDateString('fr-FR')}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="center" sx={{ py: 2 }}>
                      <Stack direction="row" spacing={1} justifyContent="center">
                        <Tooltip title="Voir le bon de livraison">
                          <IconButton 
                            size="small" 
                            onClick={() => handleView(receptionSlip)}
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
                            onClick={() => handleEdit(receptionSlip)}
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
                            onClick={() => handlePrintOrder(receptionSlip)}
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
                        {(receptionSlip.status === 'confirmed' || receptionSlip.status === 'processing') && (
                          <Tooltip title="Marquer comme livré">
                            <IconButton 
                              size="small" 
                              onClick={() => handleMarkAsDelivered(receptionSlip)}
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
                            onClick={() => handleDeleteClick(receptionSlip)}
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
            Affichage de <strong>{Math.min((page - 1) * limit + 1, totalItems)}</strong> à{' '}
            <strong>{Math.min(page * limit, totalItems)}</strong> sur{' '}
            <strong>{totalItems.toLocaleString()}</strong> entrées
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

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => {
        setDialogOpen(false)
        setIsViewMode(false) // Reset view mode when dialog closes
      }} maxWidth="xl" fullWidth>
        <DialogTitle sx={{ bgcolor: '#f8f9fa', borderBottom: '1px solid #e9ecef' }}>
          <Typography variant="h5" component="span" sx={{ fontWeight: 600, color: '#495057' }}>
            {isViewMode ? 'VOIR BON DE LIVRAISON' : editingOrder ? 'MODIFIER BON DE LIVRAISON' : 'CRÉER BON DE LIVRAISON'}
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          <Box sx={{ bgcolor: '#fff' }}>
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
                        editingOrder?.user?.name || 
                        (editingOrder?.user_id === 9 ? 'Anas' : 'ADMIN USER')
                      }
                      sx={{ bgcolor: 'white' }}
                    />
                  ) : (
                    <FormControl fullWidth size="small">
                      <Select
                        value={formData.user_id || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, user_id: Number(e.target.value) || 0 }))}
                        displayEmpty
                        disabled={isViewMode}
                        sx={{ bgcolor: 'white' }}
                      >
                        <MenuItem value="">ADMIN USER</MenuItem>
                        <MenuItem value={9}>Anas</MenuItem>
                        <MenuItem value={10}>Dounia EL</MenuItem>
                        {/* Add more users when available */}
                      </Select>
                    </FormControl>
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
                      value={formData.order_ref || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, order_ref: e.target.value }))}
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
                          (option.phone || '').toLowerCase().includes(searchTerm)
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
                            {option.city && (
                              <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                                • {option.city}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      )}
                      noOptionsText="Aucun client trouvé"
                      loading={loadingClients}
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
                      noOptionsText="Aucune société trouvée"
                      loading={loadingCompanies}
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
                      noOptionsText="Aucune société trouvée"
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

            {/* PRODUCTS SECTION - EXACT LARAVEL TABLE */}
            <Box sx={{ p: 3, borderTop: '1px solid #e9ecef' }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: '#495057', textTransform: 'uppercase' }}>
                RÉFÉRENCES DU BON DE LIVRAISON
              </Typography>
              <Box sx={{ overflow: 'auto', mb: 3 }}>
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
                      value={item.group || index + 1}
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
                      value={item.thickness || ''}
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
                      value={item.total_price || ''}
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
                  fontSize: '0.75rem',
                  textAlign: 'center',
                  alignItems: 'center'
                }}>
                  <Box sx={{ gridColumn: 'span 11', textAlign: 'right', pr: 1 }}>TOTAL H.T</Box>
                  <Box sx={{ textAlign: 'center' }}>
                    {Number(formData.taxable_amount || 0).toFixed(2) || '0.00'} €
                  </Box>
                  <Box></Box>
                </Box>
                </Box>
              </Box>

              {/* ADD ITEM BUTTON */}
              <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 3 }}>
                <Button
                  variant="contained"
                  onClick={addNewOrderItem}
                  disabled={isViewMode}
                  sx={{
                    bgcolor: '#28a745',
                    '&:hover': { bgcolor: '#218838' },
                    fontWeight: 600,
                    textTransform: 'uppercase'
                  }}
                >
                  + AJOUTER UNE RÉFÉRENCE
                </Button>
              </Box>

              {/* TOTALS SECTION */}
              <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr auto', 
                gap: 3,
                mt: 3
              }}>
              {/* PAYMENT SECTION - LARAVEL STYLE */}
              <Box sx={{ mt: 3, mb: 3 }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: '#495057', textTransform: 'uppercase' }}>
                  PAIEMENTS
                </Typography>
                <Box sx={{ 
                  bgcolor: '#fff3cd', 
                  border: '1px solid #ffeaa7',
                  borderRadius: 1,
                  overflow: 'hidden'
                }}>
                  {/* Payment Table Header */}
                  <Box sx={{ 
                    display: 'grid', 
                    gridTemplateColumns: '150px 150px 1fr 150px 50px',
                    gap: 1,
                    p: 1,
                    bgcolor: '#f1c40f',
                    color: '#2c3e50',
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    textAlign: 'center',
                    alignItems: 'center'
                  }}>
                    <Box sx={{ textAlign: 'center' }}>TYPE</Box>
                    <Box sx={{ textAlign: 'center' }}>MONTANT</Box>
                    <Box sx={{ textAlign: 'center' }}>N° CHÈQUE/COMPTE BANQUAIRE</Box>
                    <Box sx={{ textAlign: 'center' }}>DATE</Box>
                    <Box></Box>
                  </Box>

                  {/* Payment Rows */}
                  {formData.payments && formData.payments.length > 0 ? (
                    formData.payments.map((payment: any, index: number) => (
                      <Box key={index} sx={{ 
                        display: 'grid', 
                        gridTemplateColumns: '150px 150px 1fr 150px 50px',
                        gap: 1,
                        p: 1,
                        bgcolor: index % 2 === 0 ? 'white' : '#f8f9fa',
                        alignItems: 'center',
                        borderBottom: '1px solid #e9ecef'
                      }}>
                        <FormControl size="small" fullWidth>
                          <Select
                            value={payment.type || 'CHÈQUE'}
                            onChange={(e) => updatePayment(index, 'type', e.target.value)}
                            disabled={isViewMode}
                            sx={{ fontSize: '0.75rem' }}
                          >
                            {['CHÈQUE', 'TRAITE', 'ESPÈCES', 'VIREMENT', 'TPE'].map(type => (
                              <MenuItem key={type} value={type}>{type}</MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                        <TextField
                          size="small"
                          value={payment.amount || ''}
                          onChange={(e) => updatePayment(index, 'amount', e.target.value)}
                          disabled={isViewMode}
                          placeholder="0.00"
                          sx={{ 
                            '& .MuiInputBase-input': { 
                              textAlign: 'center',
                              fontSize: '0.75rem'
                            }
                          }}
                        />
                        <TextField
                          size="small"
                          value={payment.check_number || payment.reference || ''}
                          onChange={(e) => updatePayment(index, 'check_number', e.target.value)}
                          disabled={isViewMode}
                          placeholder="Numéro de référence..."
                          sx={{ 
                            '& .MuiInputBase-input': { 
                              fontSize: '0.75rem'
                            }
                          }}
                        />
                        <TextField
                          size="small"
                          type="date"
                          value={convertDateToInputFormat(payment.date || '')}
                          onChange={(e) => updatePayment(index, 'date', e.target.value)}
                          disabled={isViewMode}
                          sx={{ 
                            '& .MuiInputBase-input': { 
                              fontSize: '0.75rem'
                            }
                          }}
                        />
                        <IconButton
                          size="small"
                          onClick={() => removePayment(index)}
                          disabled={isViewMode}
                          sx={{ color: '#dc3545' }}
                        >
                          <DeleteIcon sx={{ fontSize: '16px' }} />
                        </IconButton>
                      </Box>
                    ))
                  ) : (
                    <Box sx={{ 
                      gridColumn: 'span 5',
                      p: 3,
                      textAlign: 'center',
                      color: '#6c757d',
                      fontStyle: 'italic'
                    }}>
                      Il n'y a aucun élément à afficher.
                    </Box>
                  )}
                </Box>

                {/* ADD PAYMENT BUTTON */}
                <Box sx={{ display: 'flex', justifyContent: 'flex-start', mt: 2 }}>
                  <Button
                    variant="contained"
                    onClick={addNewPayment}
                    disabled={isViewMode}
                    sx={{
                      bgcolor: '#28a745',
                      '&:hover': { bgcolor: '#218838' },
                      fontWeight: 600,
                      textTransform: 'uppercase'
                    }}
                  >
                    + AJOUTER UNE RÉFÉRENCE
                  </Button>
                </Box>
              </Box>

              {/* TOTALS SECTION - RIGHT SIDE */}
              <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr auto', 
                gap: 3,
                mt: 3
              }}>
                {/* Left side - Payment table (handled above) */}
                <Box></Box>

                {/* Right side - Calculation totals */}
                <Box sx={{ minWidth: '300px' }}>
                  <Box sx={{ 
                    border: '2px solid #17a2b8',
                    borderRadius: 1,
                    overflow: 'hidden'
                  }}>
                    <Box sx={{ p: 2, bgcolor: 'white' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">TOTAL H.T:</Typography>
                        <Typography variant="body2" fontWeight={500}>
                          {Number(formData.taxable_amount || 0).toFixed(2) || '0.00'} DHs
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">TOTAL T.T.C:</Typography>
                        <Typography variant="body2" fontWeight={500}>
                          {Number(formData.total_amount || 0).toFixed(2) || '0.00'} DHs
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">PAYÉ:</Typography>
                        <Typography variant="body2" fontWeight={500}>
                          {calculateTotalPayments(formData.payments).toFixed(2)} DHs
                        </Typography>
                      </Box>
                      <Box sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between',
                        pt: 1,
                        borderTop: '1px solid #e9ecef',
                        fontWeight: 600
                      }}>
                        <Typography variant="body2" fontWeight={600}>RESTE/AVOIR:</Typography>
                        <Typography variant="body2" fontWeight={600}>
                          {calculateRemainingAmount(Number(formData.total_amount || 0), formData.payments).toFixed(2)} DHs
                        </Typography>
                      </Box>
                    </Box>
                    <Box sx={{ 
                      bgcolor: '#dc3545',
                      color: 'white',
                      p: 1.5,
                      textAlign: 'center',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      cursor: 'pointer'
                    }}
                    onClick={calculateAllTotals}>
                      CALCULER!
                    </Box>
                  </Box>
                </Box>
              </Box>
              </Box>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, borderTop: '1px solid #e9ecef', bgcolor: '#f8f9fa' }}>
          <Button onClick={() => {
            setDialogOpen(false)
            setIsViewMode(false) // Reset view mode
          }} sx={{ color: '#6c757d' }}>
            {isViewMode ? 'FERMER' : 'ANNULER'}
          </Button>
          {!isViewMode && (
            <Button 
              variant="contained" 
              onClick={handleSave}
              sx={{ 
                bgcolor: '#007bff',
                '&:hover': { bgcolor: '#0056b3' },
                fontWeight: 600,
                px: 3
              }}
            >
              {editingOrder ? 'MODIFIER' : 'CRÉER'}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* View Dialog */}
      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete order "{orderToDelete?.order_number || `O-${orderToDelete?.id}`}"?
            This action cannot be undone and will also remove all order items.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDelete} variant="contained" color="error">
            Delete
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