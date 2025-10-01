import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import * as clientService from '../services/clientServiceApi';
import { CompanyService } from '../services/companyServiceApi';
import * as productService from '../services/productServiceApi';
import { UserService } from '../services/userServiceApi';
import { useAuth } from '../contexts/AuthContext';
import { getProductStates } from '../services/productServiceApi';
import { orderStockIntegration } from '../services/automaticStockService';
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
import { OrderService } from '../services/orderServiceApi'
import type { PaginationParams } from '../services/orderServiceApi'
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



export default function Orders() {
  const navigate = useNavigate()
  const { user: currentUser } = useAuth() // Get logged-in user
  const [orders, setOrders] = useState<Order[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [editingOrder, setEditingOrder] = useState<Order | null>(null)
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null)
  const [isViewMode, setIsViewMode] = useState(false) // Track if form is in view mode
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [clientSearchQuery, setClientSearchQuery] = useState('')
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

  // Stock management state
  const [stockWarnings, setStockWarnings] = useState<string[]>([])
  const [checkingStock, setCheckingStock] = useState(false)

  // Load product états from database
  useEffect(() => {
    const loadProductStates = async () => {
      try {
        const states = await getProductStates()
        setProductStates(states)
      } catch (error) {
        console.error('Failed to load product states:', error)
        // Keep fallback states
      }
    }
    loadProductStates()
  }, [])

  // Additional state for new Laravel-style form
  const [loadingClients, setLoadingClients] = useState(false)
  const [loadingCompanies, setLoadingCompanies] = useState(false)
  const [addClientDialogOpen, setAddClientDialogOpen] = useState(false)
  const [addCompanyDialogOpen, setAddCompanyDialogOpen] = useState(false)
  
  // Form data
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
  const [productStates, setProductStates] = useState<string[]>(['Poli', 'Brut', 'Adouci']) // Default fallback, loaded dynamically

  const orderStatuses = ['draft', 'sent', 'accepted', 'rejected', 'expired', 'converted']
  const paymentStatuses = ['unpaid', 'partial', 'paid', 'refunded']

  useEffect(() => {
    fetchOrders()
  }, [page, limit, searchTerm])

  useEffect(() => {
    fetchRelatedData()
  }, [])

  // Update form user_id when current user is available
  useEffect(() => {
    if (currentUser && currentUser.id) {
      setFormData(prev => ({
        ...prev,
        user_id: currentUser.id
      }))
    }
  }, [currentUser])

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const params: PaginationParams = {
        page,
        limit,
        search: searchTerm || undefined,
        sortBy: 'order_date',
        sortOrder: 'desc'
      }

      let result
      
      if (searchTerm) {
        result = await OrderService.search(searchTerm, params)
      } else {
        result = await OrderService.getAll(params)
      }
      
      if (result.success) {
        // Convert service Order[] to database Order[] by mapping the items
        const convertedOrders = (result.data || []).map(order => ({
          ...order,
          items: order.items?.map(item => ({
            ...item,
            order_id: order.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }))
        }))
        setOrders(convertedOrders as Order[])
        if (result.pagination) {
          setTotalItems(result.pagination.total)
          setTotalPages(result.pagination.pages)
        }
        // Calculate statistics
        calculateStats(convertedOrders as Order[])
      } else {
        showSnackbar(result.error || 'Failed to fetch orders', 'error')
      }
    } catch (error) {
      showSnackbar('Error fetching orders', 'error')
    }
    setLoading(false)
  }

  const fetchRelatedData = async () => {
    try {
      setLoadingClients(true)
      setLoadingCompanies(true)
      
      const [clientsResult, companiesResult, productsResult] = await Promise.all([
        clientService.getClients(1, 100, ''), // Load 100 clients like in Quotes
        CompanyService.getAll(),
        productService.getProducts({ limit: 10000 }).then(response => response.data) // Get ALL products like Stock page
      ])
      
      // Handle clients response properly (same as Quotes)
      if (clientsResult && clientsResult.clients) {
        setClients(clientsResult.clients)
      } else if (Array.isArray(clientsResult)) {
        setClients(clientsResult)
      } else {
        setClients([])
      }

      // Handle companies response properly (same as Quotes)
      if (Array.isArray(companiesResult)) {
        setCompanies(companiesResult)
      } else if (companiesResult && companiesResult.data) {
        setCompanies(companiesResult.data)
      } else {
        setCompanies([])
      }

      // Handle products response properly (same as Quotes)
      if (Array.isArray(productsResult)) {
        setProducts(productsResult)
      } else if (productsResult && productsResult.data) {
        setProducts(productsResult.data)
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

  // Debounced search for orders table
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setSearchTerm(searchQuery)
      setPage(1) // Reset to first page when searching
    }, 500) // 500ms debounce for table search

    return () => clearTimeout(timeoutId)
  }, [searchQuery])

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
      
      // Fetch complete order details with items from API
      const result = await OrderService.getById(order.id)
      
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
        
        // Force set order items regardless
        const items = fullOrder.items || []
        
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
      const result = await OrderService.getById(order.id)
      
      if (result.success && result.data) {
        const fullOrder = result.data

        
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

          setOrderItems(mappedItems)
          setFormData(prev => ({ ...prev, items: mappedItems }))
        } else {
          setOrderItems([])
        }
        
        // Set view mode and open form dialog
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

      
      // Basic required field validation for orders
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

        showSnackbar(requiredErrors.join(', '), 'error');
        return;
      }
      


      // Map orderItems to the format expected by the service, filtering out invalid items
      const serviceItems = orderItems
        .filter(item => item.quantity > 0)
        .map(item => ({
          // Keep all Laravel fields for proper database insertion
          group: item.group || 1,
          type: item.type || 'DÉBIT',
          product: item.product || '',
          options: item.options || '',
          state: item.state || 'Poli',
          splicer: item.splicer || 2,
          length: item.length || null,
          width: item.width || null,
          quantity: item.quantity,
          unit_price: item.unit_price || 0,
          total_quantity: item.total_quantity || '',
          total_price: item.total_price || 0,
          unit: item.unit || 'M2',
          full_product_description: item.full_product_description || item.product || '',
          measures: item.measures || null,
          // Keep these for stock checking
          product_id: item.product_id
        }))



      // 🚀 AUTOMATIC STOCK MANAGEMENT: Temporarily disabled to focus on payment issue


      const orderData = {
        ...formData,
        items: serviceItems,
        payments: formData.payments || [] // Explicitly include payments
      }
      

      
      const result = editingOrder
        ? await OrderService.update(editingOrder.id, orderData as any)
        : await OrderService.create(orderData as any)

      if (result.success) {
        showSnackbar(
          editingOrder ? 'Order updated successfully' : `✅ Commande créée avec succès (stock vérifié automatiquement)`,
          'success'
        )
        setDialogOpen(false)
        setStockWarnings([]) // Clear warnings on success
        fetchOrders()
      } else {
        showSnackbar(result.error || 'Failed to save order', 'error')
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
      const result = await OrderService.delete(orderToDelete.id)
      if (result.success) {
        showSnackbar('Order deleted successfully', 'success')
        setDeleteDialogOpen(false)
        setOrderToDelete(null)
        fetchOrders()
      } else {
        showSnackbar(result.error || 'Failed to delete order', 'error')
      }
    } catch (error) {
      showSnackbar('Error deleting order', 'error')
    }
  }

  const handleMarkAsDelivered = async (order: Order) => {
    try {
      // 🚀 AUTOMATIC STOCK MANAGEMENT: Reduce stock when order is delivered
      if (order.company_id && order.items && order.items.length > 0 && order.status !== 'delivered') {
        try {
          const stockItems = order.items.map(item => ({
            product_id: item.product_id,
            quantity: item.quantity
          }))

          await orderStockIntegration.processDeliveredOrder(order.company_id, stockItems)

        } catch (stockError) {
          console.error('Failed to reduce stock:', stockError)
          showSnackbar('⚠️ Commande livrée mais erreur lors de la mise à jour du stock', 'warning')
        }
      }

      const result = await OrderService.update(order.id, { status: 'delivered' })
      if (result.success) {
        showSnackbar('📦 Commande marquée comme livrée (stock réduit automatiquement)', 'success')
        fetchOrders()
      } else {
        showSnackbar(result.error || 'Failed to mark order as delivered', 'error')
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

  }

  const removeOrderItem = (index: number) => {
    setOrderItems(prev => prev.filter((_, i) => i !== index))

  }

  const updateOrderItem = (index: number, field: string, value: string | number) => {
    setOrderItems(prev => prev.map((item, i) => {
      if (i === index) {
        const updatedItem = { ...item, [field]: value }
        
        // Auto-calculate total_quantity and total_price when relevant fields change using Laravel logic
        if (['quantity', 'length', 'width', 'unit_price', 'type', 'product'].includes(field)) {
          const calculatedItem = calculateItemTotals(updatedItem)
          return calculatedItem
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
      quantity: 1,
      unit_price: 0,
      total_quantity: 0,
      total_price: 0
    }
    
    const calculatedItem = calculateItemTotals(newOrderItem)
    setOrderItems(prev => [...prev, calculatedItem])

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

  // Calculate item totals with Laravel logic (same as Quotes)
  const calculateItemTotals = (item) => {
    let unit = 'M2' // Default unit
    let totalQuantity = 0
    let calculatedTotalPrice = 0

    // Determine unit based on type and product (Laravel logic)
    if (item.type === 'PLINTHE' || item.type === 'DOUBLE NEZ' || item.type.includes('ML')) {
      unit = 'ML'
      totalQuantity = (item.length || 0) * item.quantity / 100 // Convert to ML
    } else if (item.type === 'BLOC') {
      unit = 'TON'
      totalQuantity = item.quantity
    } else if (item.type === 'VOYAGE') {
      unit = 'M3'
      totalQuantity = item.quantity
    } else if (['FONTAINE', 'AROSASSE', 'VASQUE', 'CHEMINÉE', 'MASSIF', 'GALÉ', 'DIVERS'].includes(item.type)) {
      unit = 'PIÉCE'
      totalQuantity = item.quantity
    } else if (item.type === 'SERVICE' && !item.product.startsWith('COUPE')) {
      unit = 'F'
      totalQuantity = item.quantity
    } else {
      unit = 'M2'
      totalQuantity = ((item.length || 0) * (item.width || 0) * item.quantity) / 10000 // Convert to M2
    }

    calculatedTotalPrice = parseFloat((totalQuantity * item.unit_price).toFixed(2))

    return {
      ...item,
      unit,
      total_quantity: totalQuantity,
      total_price: calculatedTotalPrice
    }
  }

  // Calculate all totals with Laravel logic (same as Quotes)
  const calculateAllTotals = () => {

    
    if (formData.is_free) {

      showSnackbar('Commande gratuite - pas de calcul nécessaire', 'info')
      return
    }

    // Recalculate all items with Laravel logic
    const recalculatedItems = orderItems.map(item => {
      console.log(`📊 Calculating item ${item.group}: ${item.type} ${item.product}`)
      
      // Force recalculation of all totals
      const recalculatedItem = calculateItemTotals(item)
      
      console.log(`✅ Item ${item.group} calculated:`, {
        dimensions: `${item.length}x${item.width}x${item.quantity}`,
        unit_price: item.unit_price,
        total_quantity: recalculatedItem.total_quantity,
        total_price: recalculatedItem.total_price
      })
      
      return recalculatedItem
    })

    // Update order items with recalculated values
    setOrderItems(recalculatedItems)

    // Calculate totals
    const subtotal = recalculatedItems.reduce((sum, item) => sum + (item.total_price || 0), 0)
    let total_taxes = 0
    let total_amount = subtotal

    // Apply tax if TTC is selected
    if (formData.tax_rate === 20) {
      total_taxes = subtotal * 0.2
      total_amount = subtotal + total_taxes
    }

    console.log('💰 Final calculations:', {
      subtotal: subtotal.toFixed(2),
      tax_rate: formData.tax_rate,
      total_taxes: total_taxes.toFixed(2),
      total_amount: total_amount.toFixed(2)
    })

    // Update form data with calculated totals (for API submission)
    setFormData(prev => ({
      ...prev,
      taxable_amount: subtotal,
      total_taxes: total_taxes,
      total_amount: total_amount
    }))

    showSnackbar(`Calculs terminés! Total: ${total_amount.toFixed(2)} DHs`, 'success')
  }

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
  const calculateStats = (ordersData: Order[]) => {
    const now = new Date()
    const thisMonth = ordersData.filter(o => {
      const orderDate = new Date(o.created_at)
      return orderDate.getMonth() === now.getMonth() && orderDate.getFullYear() === now.getFullYear()
    })
    
    const totalValue = ordersData.reduce((sum, o) => sum + (o.total_amount || 0), 0)
    const avgValue = ordersData.length > 0 ? totalValue / ordersData.length : 0
    
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
      await fetchOrders()
      showSnackbar('Données actualisées avec succès', 'success')
    } catch (error) {
      showSnackbar('Erreur lors de l\'actualisation', 'error')
    }
    setRefreshing(false)
  }

  const handleAdd = async () => {
    setEditingOrder(null)
    
    // Fetch related data first
    console.log('🔍 Fetching related data for new order...')
    await fetchRelatedData()
    
    setFormData({
      client_id: null,
      company_id: null,
      user_id: currentUser?.id || 1, // Auto-assign current user
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
    setDialogOpen(true)
    console.log('✅ Dialog opened with data loaded')
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
                COMMANDES
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Gestion des commandes et bons de commande
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
              Nouveau Commande
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
                    Total Commandes
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
              helperText="La recherche se fait automatiquement pendant que vous tapez"
            />
            {searchQuery && (
              <Button 
                variant="outlined" 
                onClick={() => {
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
              ) : orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                      <DocumentIcon sx={{ fontSize: 64, color: 'text.disabled' }} />
                      <Typography variant="h6" color="text.secondary">
                        Aucune commande trouvée
                      </Typography>
                      <Typography variant="body2" color="text.disabled">
                        {searchTerm ? 'Essayez de modifier vos critères de recherche' : 'Commencez par créer votre première commande'}
                      </Typography>
                      {!searchTerm && (
                        <Button variant="contained" startIcon={<AddIcon />} onClick={handleAdd} sx={{ mt: 2 }}>
                          Créer une Commande
                        </Button>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((order, index) => (
                  <TableRow 
                    key={order.id} 
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
                            {order.order_number || `O-${order.id}`}
                          </Typography>
                          {order.order_ref && (
                            <Typography variant="caption" color="text.secondary">
                              Réf: {order.order_ref}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ py: 2 }}>
                      <Box>
                        <Typography variant="body2" fontWeight="500">
                          {order.client?.name || 'Client Inconnu'}
                        </Typography>
                        {order.client?.phone && (
                          <Typography variant="caption" color="text.secondary">
                            {order.client.phone}
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell sx={{ py: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PersonIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Typography variant="body2">
                          {order.user?.name || 'Non Assigné'}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="right" sx={{ py: 2 }}>
                      <Box>
                        <Typography variant="body2" fontWeight="600" color="success.main">
                          {(order.total_amount || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} MAD
                        </Typography>
                        {order.tax_rate && order.tax_rate > 0 ? (
                          <Typography variant="caption" color="text.secondary">
                            TTC {order.tax_rate}%
                          </Typography>
                        ) : null}
                      </Box>
                    </TableCell>
                    <TableCell sx={{ py: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CalendarIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Typography variant="body2">
                          {new Date(order.created_at).toLocaleDateString('fr-FR')}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="center" sx={{ py: 2 }}>
                      <Stack direction="row" spacing={1} justifyContent="center">
                        <Tooltip title="Voir la commande">
                          <IconButton 
                            size="small" 
                            onClick={() => handleView(order)}
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
                            onClick={() => handleEdit(order)}
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
                            onClick={() => handlePrintOrder(order)}
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
                        {(order.status === 'confirmed' || order.status === 'processing') && (
                          <Tooltip title="Marquer comme livré">
                            <IconButton 
                              size="small" 
                              onClick={() => handleMarkAsDelivered(order)}
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
                            onClick={() => handleDeleteClick(order)}
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
            {isViewMode ? 'VOIR COMMANDE' : editingOrder ? 'MODIFIER COMMANDE' : 'CRÉER COMMANDE'}
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
                        editingOrder?.user_name ||
                        editingOrder?.salesperson_name || 
                        (editingOrder?.user_id ? `Utilisateur ID: ${editingOrder.user_id}` : 'Non assigné')
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
                        InputProps={{
                          startAdornment: (
                            <PersonIcon sx={{ color: '#2e7d32', mr: 1, fontSize: 18 }} />
                          ),
                        }}
                      />
                      <Typography variant="caption" sx={{ color: '#6c757d', mt: 0.5, display: 'block' }}>
                        Connecté automatiquement en tant que responsable
                      </Typography>
                      <Button 
                        size="small" 
                        variant="text" 
                        sx={{ mt: 1, fontSize: '0.75rem', textTransform: 'none' }}
                        onClick={() => {
                          // Show advanced selection if needed
                          alert('Fonctionnalité avancée: Pour changer le responsable, contactez l\'administrateur');
                        }}
                      >
                        Changer le responsable?
                      </Button>
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
                      getOptionLabel={(option) => option.name || ''}
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
                              {option.name}
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
                RÉFÉRENCES DE LA COMMANDE
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

                {/* 🚀 STOCK WARNINGS DISPLAY */}
                {stockWarnings.length > 0 && (
                  <Box sx={{ 
                    gridColumn: 'span 13',
                    p: 2,
                    bgcolor: '#fff3cd',
                    border: '1px solid #ffecb5',
                    borderRadius: 1,
                    mb: 2 
                  }}>
                    <Typography variant="subtitle2" sx={{ color: '#856404', fontWeight: 'bold', mb: 1 }}>
                      ⚠️ Attention - Stock insuffisant:
                    </Typography>
                    {stockWarnings.map((warning, index) => (
                      <Typography key={index} variant="body2" sx={{ color: '#856404', ml: 2 }}>
                        • {warning}
                      </Typography>
                    ))}
                  </Box>
                )}

                {/* Existing Items */}
                {(() => {
                  console.log('🔍 Rendering items section. orderItems.length:', orderItems.length);
                  console.log('🔍 orderItems:', orderItems);
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
                      console.log('🔍 Rendering item:', index, item);
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
                <Box sx={{ display: 'flex', justifyContent: 'flex-start', mt: 2, gap: 2 }}>
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
                    <Box 
                      onClick={calculateAllTotals}
                      sx={{ 
                        bgcolor: '#dc3545',
                        color: 'white',
                        p: 1.5,
                        textAlign: 'center',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        cursor: 'pointer',
                        '&:hover': {
                          bgcolor: '#c82333'
                        }
                      }}>
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
              disabled={checkingStock}
              sx={{ 
                bgcolor: checkingStock ? '#6c757d' : '#007bff',
                '&:hover': { bgcolor: checkingStock ? '#6c757d' : '#0056b3' },
                fontWeight: 600,
                px: 3
              }}
            >
              {checkingStock ? '🔄 Vérification stock...' : (editingOrder ? 'MODIFIER' : 'CRÉER')}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Order Details</DialogTitle>
        <DialogContent>
          {(() => {
            console.log('🔍 View Dialog Render - viewingOrder:', viewingOrder)
            console.log('🔍 View Dialog Render - viewDialogOpen:', viewDialogOpen)
            return null
          })()}
          {viewingOrder && (
            <Box sx={{ pt: 1 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  <Box sx={{ flex: '1 1 300px' }}>
                    <Typography variant="subtitle2">Order Number:</Typography>
                    <Typography variant="body1" gutterBottom>{viewingOrder.order_number || `O-${viewingOrder.id}`}</Typography>
                  </Box>
                  <Box sx={{ flex: '1 1 300px' }}>
                    <Typography variant="subtitle2">Status:</Typography>
                    <Chip label={viewingOrder.status} size="small" color={getStatusColor(viewingOrder.status)} />
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  <Box sx={{ flex: '1 1 300px' }}>
                    <Typography variant="subtitle2">Client:</Typography>
                    <Typography variant="body1" gutterBottom>
                      {viewingOrder.client?.name || viewingOrder.client_name || 'No client name'}
                    </Typography>
                  </Box>
                  <Box sx={{ flex: '1 1 300px' }}>
                    <Typography variant="subtitle2">Company:</Typography>
                    <Typography variant="body1" gutterBottom>
                      {viewingOrder.company?.name || viewingOrder.company_name || 'No company name'}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  <Box sx={{ flex: '1 1 300px' }}>
                    <Typography variant="subtitle2">Order Date:</Typography>
                    <Typography variant="body1" gutterBottom>
                      {viewingOrder.order_date ? new Date(viewingOrder.order_date).toLocaleDateString() : 
                       viewingOrder.created_at ? new Date(viewingOrder.created_at).toLocaleDateString() : 'No date'}
                    </Typography>
                  </Box>
                  <Box sx={{ flex: '1 1 300px' }}>
                    <Typography variant="subtitle2">Expiry Date:</Typography>
                    <Typography variant="body1" gutterBottom>
                      {viewingOrder.delivery_date ? new Date(viewingOrder.delivery_date).toLocaleDateString() : 'No delivery date'}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  <Box sx={{ flex: '1 1 300px' }}>
                    <Typography variant="subtitle2">Total Amount:</Typography>
                    <Typography variant="h6" gutterBottom>${Number(viewingOrder.total_amount || 0).toFixed(2)}</Typography>
                  </Box>
                </Box>
                {viewingOrder.notes && (
                  <Box>
                    <Typography variant="subtitle2">Notes:</Typography>
                    <Typography variant="body1" gutterBottom>{viewingOrder.notes}</Typography>
                  </Box>
                )}
              </Box>

              {viewingOrder.items && viewingOrder.items.length > 0 && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="h6" gutterBottom>Order Items</Typography>
                  <TableContainer component={Paper} variant="outlined">
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Product</TableCell>
                          <TableCell>Quantity</TableCell>
                          <TableCell>Unit Price</TableCell>
                          <TableCell>Total</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {viewingOrder.items.map((item: any, index: number) => (
                          <TableRow key={index}>
                            <TableCell>{item.product?.name || item.product_name || 'Unknown Product'}</TableCell>
                            <TableCell>{item.quantity}</TableCell>
                            <TableCell>${Number(item.unit_price || 0).toFixed(2)}</TableCell>
                            <TableCell>${Number(item.total_price || 0).toFixed(2)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
          {viewingOrder && (viewingOrder.status === 'confirmed' || viewingOrder.status === 'processing') && (
            <Button 
              variant="contained" 
              startIcon={<ConvertIcon />}
              onClick={() => {
                viewingOrder && handleMarkAsDelivered(viewingOrder)
                setViewDialogOpen(false)
              }}
            >
              Mark as Delivered
            </Button>
          )}
          <Button 
            variant="contained" 
            startIcon={<PrintIcon />}
            onClick={() => viewingOrder && handlePrintOrder(viewingOrder)}
          >
            Print Order
          </Button>
        </DialogActions>
      </Dialog>

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