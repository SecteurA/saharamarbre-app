import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
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
  Refresh as RefreshIcon,
  ContentCopy as CopyIcon
} from '@mui/icons-material'
import { QuoteService } from '../services/quoteServiceApi'
import type { PaginationParams } from '../services/quoteServiceApi'
import OrderPDF from '../components/pdf/OrderPDF'
import { pdf } from '@react-pdf/renderer'
import { quoteValidationSchema, validateForm } from '../utils/validation'
import type { Quote, CreateQuoteData, UpdateQuoteData, QuoteItem, NewOrderItem, Company, Client, Product } from '../types/database.types'



export default function Quotes() {
  const navigate = useNavigate()
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null)
  const [viewingQuote, setViewingQuote] = useState<Quote | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [quoteToDelete, setQuoteToDelete] = useState<Quote | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [refreshing, setRefreshing] = useState(false)
  
  // Client search and add functionality
  const [clientSearchQuery, setClientSearchQuery] = useState('')
  const [loadingClients, setLoadingClients] = useState(false)
  const [addClientDialogOpen, setAddClientDialogOpen] = useState(false)
  const [newClientData, setNewClientData] = useState({
    name: '',
    nom: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    company: '',
    patent: ''
  })

  // Company search and add functionality
  const [companySearchQuery, setCompanySearchQuery] = useState('')
  const [loadingCompanies, setLoadingCompanies] = useState(false)
  const [addCompanyDialogOpen, setAddCompanyDialogOpen] = useState(false)
  const [newCompanyData, setNewCompanyData] = useState({
    name: '',
    address: '',
    city: '',
    phone: '',
    email: ''
  })

  // Product search functionality
  const [productSearchQuery, setProductSearchQuery] = useState('')
  const [loadingProducts, setLoadingProducts] = useState(false)
  
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

  // 🚀 STOCK MANAGEMENT STATE (for availability checking only)
  const [stockWarnings, setStockWarnings] = useState<string[]>([])
  const [checkingStock, setCheckingStock] = useState(false)
  
  // Form data - MATCHING LARAVEL STRUCTURE EXACTLY
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
    items: [],
    // Calculated totals (updated by CALCULER!)
    taxable_amount: 0,
    total_taxes: 0,
    total_amount: 0
  })

  // Quote items with complete Laravel structure
  const [quoteItems, setQuoteItems] = useState([])
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
    total_price: 0
  })

  // Laravel product types and options
  const productTypes = ['DÉBIT', 'TRANCHE', 'CARREAUX', 'PLINTHE', 'DOUBLE NEZ', 'SERVICE', 'BLOC', 'ESCALIER', 'ESCALIER ML', 'MASSIF', 'FONTAINE', 'VASQUE', 'CHEMINÉE', 'AROSASSE', 'GALÉ', 'DIVERS', 'VOYAGE']
  const productOptions = ['Finition', 'Coupe', 'Polissage', 'Sciage']
  const [productStates, setProductStates] = useState<string[]>(['Poli', 'Brut', 'Adouci'])

  const quoteStatuses = ['draft', 'sent', 'accepted', 'rejected', 'expired', 'converted']



  // Search clients when search query changes
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

  // Search companies when search query changes
  useEffect(() => {
    const searchCompanies = async () => {
      if (companySearchQuery.length >= 2) {
        try {
          setLoadingCompanies(true)
          // If CompanyService has search functionality, use it
          const companiesResult = await CompanyService.getAll()
          if (Array.isArray(companiesResult)) {
            const filtered = companiesResult.filter(company =>
              (company.name || '').toLowerCase().includes(companySearchQuery.toLowerCase()) ||
              (company.city || '').toLowerCase().includes(companySearchQuery.toLowerCase())
            )
            setCompanies(filtered)
          }
        } catch (error) {
          console.error('Error searching companies:', error)
        } finally {
          setLoadingCompanies(false)
        }
      } else if (companySearchQuery === '') {
        // Reload all companies when search is cleared
        fetchRelatedData()
      }
    }

    const timeoutId = setTimeout(searchCompanies, 300) // Debounce search
    return () => clearTimeout(timeoutId)
  }, [companySearchQuery])

  useEffect(() => {
    fetchQuotes()
  }, [page, limit, searchTerm])

  useEffect(() => {
    fetchRelatedData()
    loadProductStates()
  }, [])

  const loadProductStates = async () => {
    try {
      const states = await getProductStates()
      setProductStates(states)
    } catch (error) {
      console.error('Failed to load product states:', error)
    }
  }

  const fetchQuotes = async () => {
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
        result = await QuoteService.search(searchTerm, params)
      } else {
        result = await QuoteService.getAll(params)
      }
      
      if (result.success) {
        // Convert service Quote[] to database Quote[] by mapping the items
        const convertedQuotes = (result.data || []).map(quote => ({
          ...quote,
          items: quote.items?.map(item => ({
            ...item,
            quote_id: quote.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }))
        }))
        setQuotes(convertedQuotes as Quote[])
        if (result.pagination) {
          setTotalItems(result.pagination.total || 0)
          setTotalPages(result.pagination.pages || 1)
        }
        // Calculate statistics
        calculateStats(convertedQuotes as Quote[])
      } else {
        showSnackbar(result.error || 'Failed to fetch quotes', 'error')
      }
    } catch (error) {
      showSnackbar('Error fetching quotes', 'error')
    }
    setLoading(false)
  }

  const fetchRelatedData = async () => {
    try {
      setLoadingClients(true)
      setLoadingCompanies(true)
      setLoadingProducts(true)
      

      
      const [clientsResult, companiesResult, productsResult] = await Promise.all([
        clientService.getClients(1, 100, ''), // Load 100 clients with search
        CompanyService.getAll(),
        productService.getProducts().then(response => response.data)
      ])



      // Handle clients response properly (same as Orders)
      if (clientsResult && clientsResult.clients) {
        setClients(clientsResult.clients)

      } else if (Array.isArray(clientsResult)) {
        setClients(clientsResult)

      } else {
        console.warn('⚠️ [Quotes] No clients found in response')
        setClients([])
      }

      // Handle companies response properly (same as Orders)
      if (Array.isArray(companiesResult)) {
        setCompanies(companiesResult)

      } else if (companiesResult && companiesResult.data) {
        setCompanies(companiesResult.data)

      } else {
        setCompanies([])
        console.warn('⚠️ [Quotes] No companies found in response')
      }

      // Handle products response properly (same as Orders)
      if (Array.isArray(productsResult)) {
        setProducts(productsResult)

      } else if (productsResult && productsResult.data) {
        setProducts(productsResult.data)

      } else {
        setProducts([])
        console.warn('⚠️ [Quotes] No products found in response')
      }
      
    } catch (error) {
      console.error('❌ [Quotes] Error fetching related data:', error)
      setClients([])
      setCompanies([])
      setProducts([])
    } finally {
      setLoadingClients(false)
      setLoadingCompanies(false)
      setLoadingProducts(false)
    }
  }





  const handleEdit = async (quote: Quote) => {
    try {
      setLoading(true)
      
      // Ensure related data is loaded first
      if (clients.length === 0 || companies.length === 0) {
        await fetchRelatedData()
      }
      
      // If client is not in the current clients list, add it from the quote data
      if (quote.client && !clients.find(c => c.id === quote.client_id)) {
        setClients(prev => [quote.client, ...prev])
      }
      
      // If company is not in the current companies list, add it from the quote data
      if (quote.company && !companies.find(c => c.id === quote.company_id)) {
        setCompanies(prev => [quote.company, ...prev])
      }
      
      // Fetch complete quote details with items from API
      const result = await QuoteService.getById(quote.id)
      
      if (result.success && result.data) {
        const fullQuote = result.data
        setEditingQuote(fullQuote)
        
        // Auto-load items if available

        if (fullQuote.items && fullQuote.items.length > 0) {

          const mappedItems = fullQuote.items.map((item, index) => ({
            group: item.group_number || item.group || (index + 1),
            type: item.type || 'DÉBIT',
            product: item.product || '',
            options: item.options || '',
            state: item.state || 'Poli',
            splicer: parseFloat(item.splicer) || 2,
            length: item.length ? parseFloat(item.length) : null,
            width: item.width ? parseFloat(item.width) : null,
            quantity: parseFloat(item.quantity) || 1,
            unit_price: parseFloat(item.unit_price) || 0,
            total_price: parseFloat(item.total_price) || 0,
            unit: item.unit || 'M2'
          }));
          setQuoteItems(mappedItems);

        }
        
        // Populate ALL form fields matching Laravel exactly
        const populatedFormData = {
          client_id: fullQuote.client_id || 0,
          company_id: fullQuote.company_id || 0, // Laravel: company relationship
          user_id: fullQuote.user_id || 0, // Laravel: salesperson
          template_id: fullQuote.template_id || fullQuote.company_id || 0, // Laravel: template (ENTETE DE)
          order_ref: fullQuote.order_ref || '', // Laravel: order_ref
          driver: fullQuote.driver || '',
          plate: fullQuote.plate || '',
          worksite: fullQuote.worksite || '',
          tax_rate: fullQuote.tax_rate || 20,
          is_free: fullQuote.is_free || false,
          notes: fullQuote.notes || '',
          status: fullQuote.status || 'draft',
          items: fullQuote.items || [],
          // Calculated totals
          taxable_amount: fullQuote.taxable_amount || 0,
          total_taxes: fullQuote.total_taxes || 0,
          total_amount: fullQuote.total_amount || 0
        }
        
        setFormData(populatedFormData)
        
        // Force set quote items regardless
        const items = fullQuote.items || []
        
        if (items.length > 0) {
          const mappedItems = items.map((item, index) => {
            console.log(`� FORCE MAPPING ITEM ${index + 1}:`, item)
            return {
              group: item.group_number || item.group || (index + 1),
              type: item.type && ['DÉBIT', 'TRANCHE', 'CARREAUX', 'PLINTHE', 'DOUBLE NEZ', 'SERVICE', 'BLOC', 'ESCALIER', 'ESCALIER ML', 'MASSIF', 'FONTAINE', 'VASQUE', 'CHEMINÉE', 'AROSASSE', 'GALÉ', 'DIVERS', 'VOYAGE'].includes(item.type.toUpperCase()) ? item.type.toUpperCase() : 'DÉBIT',
              product: item.product || '',
              options: item.options || '',
              state: item.state || 'Poli',
              splicer: parseFloat(item.splicer) || 2,
              length: item.length ? parseFloat(item.length) : null,
              width: item.width ? parseFloat(item.width) : null,
              quantity: parseFloat(item.quantity) || 1,
              unit_price: parseFloat(item.unit_price) || 0,
              total_quantity: item.total_quantity || '',
              total_price: parseFloat(item.total_price) || 0,
              unit: item.unit || 'M2'
            }
          })

          setQuoteItems(mappedItems)
          
          // Update form data with items
          setFormData(prev => ({
            ...prev,
            items: mappedItems
          }))
        } else {

          // Don't clear items here - let the form show empty state
        }
        
        setDialogOpen(true)
      } else {
        showSnackbar('Erreur lors du chargement du devis', 'error')
      }
    } catch (error) {
      console.error('Error fetching quote details:', error)
      showSnackbar('Erreur lors du chargement du devis', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleView = async (quote: Quote) => {
    try {
      setLoading(true)
      
      // Fetch complete quote details with items from API
      const result = await QuoteService.getById(quote.id)
      
      if (result.success && result.data) {
        setViewingQuote(result.data)
        setViewDialogOpen(true)
      } else {
        showSnackbar('Erreur lors du chargement du devis', 'error')
      }
    } catch (error) {
      console.error('Error fetching quote details:', error)
      showSnackbar('Erreur lors du chargement du devis', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      // Validate required fields
      if (!formData.client_id || !formData.company_id) {
        showSnackbar('Client et société sont obligatoires', 'error');
        return;
      }

      // 🚀 STOCK AVAILABILITY CHECK for quotes (informational only - no stock reduction)
      if (!editingQuote && formData.company_id && quoteItems.length > 0) {
        setCheckingStock(true)
        try {
          const stockItems = quoteItems
            .filter(item => item.product_id && item.quantity)
            .map(item => ({
              product_id: item.product_id!,
              quantity: item.quantity || 1
            }))

          if (stockItems.length > 0) {
            const stockCheck = await orderStockIntegration.validateOrderStock(
              formData.company_id,
              stockItems
            )

            if (!stockCheck.canProceed) {
              setStockWarnings(stockCheck.warnings)
              showSnackbar('⚠️ Attention: Stock insuffisant pour certains produits du devis', 'warning')
              // Continue with quote creation even with stock warnings (quotes don't consume stock)
            } else {
              setStockWarnings([]) // Clear any previous warnings
            }
          }
        } catch (error) {
          console.error('Stock check failed:', error)
          // Don't prevent quote creation if stock check fails
        }
        setCheckingStock(false)
      }

      // Prepare quote data matching Laravel structure

      
      const quoteData = {
        ...formData,
        user_id: formData.user_id || null,
        items: quoteItems.map(item => ({
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
          total_price: item.total_price,
          unit: item.unit,
          full_product_description: `${item.options} ${item.type} ${item.product} ${item.state} ${item.splicer}CM`,
          measures: item.length && item.width ? `${item.length} x ${item.width} x ${item.quantity}` : null
        }))
      }
      
      const result = editingQuote
        ? await QuoteService.update(editingQuote.id, quoteData)
        : await QuoteService.create(quoteData)

      if (result.success) {
        showSnackbar(
          editingQuote ? 'Devis modifié avec succès' : 'Devis créé avec succès',
          'success'
        )
        setDialogOpen(false)
        resetForm()
        fetchQuotes()
      } else {
        showSnackbar(result.error || 'Erreur lors de la sauvegarde', 'error')
      }
    } catch (error) {
      console.error('Save error:', error)
      showSnackbar('Erreur lors de la sauvegarde', 'error')
    }
  }

  const resetForm = () => {
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
      taxable_amount: 0,
      total_taxes: 0,
      total_amount: 0
    })
    setQuoteItems([])
    setEditingQuote(null)
  }

  const handleDeleteClick = (quote: Quote) => {
    setQuoteToDelete(quote)
    setDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!quoteToDelete) return

    try {
      const result = await QuoteService.delete(quoteToDelete.id)
      if (result.success) {
        showSnackbar('Quote deleted successfully', 'success')
        setDeleteDialogOpen(false)
        setQuoteToDelete(null)
        fetchQuotes()
      } else {
        showSnackbar(result.error || 'Failed to delete quote', 'error')
      }
    } catch (error) {
      showSnackbar('Error deleting quote', 'error')
    }
  }

  const handleConvertToOrder = async (quote: Quote) => {
    try {
      const result = await QuoteService.convertToOrder(quote.id)
      if (result.success) {
        showSnackbar('Quote converted to order successfully', 'success')
        fetchQuotes()
      } else {
        showSnackbar(result.error || 'Failed to convert quote to order', 'error')
      }
    } catch (error) {
      showSnackbar('Error converting quote', 'error')
    }
  }

  const addQuoteItem = () => {
    if (!newItem.product.trim()) return

    // Calculate total price and unit based on Laravel logic
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
        total_quantity: `${totalQuantity.toFixed(2)}${unit}`,
        total_price: calculatedTotalPrice
      }
    }

    const calculatedItem = calculateItemTotals(newItem)
    setQuoteItems(prev => [...prev, calculatedItem])
    
    // Reset form with incremented group
    const maxGroup = quoteItems.length > 0 ? Math.max(...quoteItems.map(i => i.group)) : 0
    setNewItem({
      group: maxGroup + 1,
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
      total_price: 0
    })
  }

  const removeQuoteItem = (index: number) => {
    setQuoteItems(prev => prev.filter((_, i) => i !== index))
  }

  const addEmptyReference = () => {
    // Get the next group number
    const maxGroup = quoteItems.length > 0 ? Math.max(...quoteItems.map(i => i.group)) : 0
    
    // Add an empty reference item
    const emptyReference = {
      group: maxGroup + 1,
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
    }

    setQuoteItems(prev => [...prev, emptyReference])
  }

  const cloneReference = (index: number) => {
    const itemToClone = quoteItems[index]
    const maxGroup = quoteItems.length > 0 ? Math.max(...quoteItems.map(i => i.group)) : 0
    
    // Clone the reference with a new group number
    const clonedReference = {
      ...itemToClone,
      group: maxGroup + 1,
      total_quantity: '', // Reset calculated fields
      total_price: 0
    }

    setQuoteItems(prev => [...prev, clonedReference])
    showSnackbar('Référence dupliquée avec succès', 'success')
  }

  const updateQuoteItem = (index: number, field: string, value: any) => {
    setQuoteItems(prev => prev.map((item, i) => {
      if (i === index) {
        const updatedItem = { ...item, [field]: value }
        
        // Recalculate totals if relevant fields change
        if (['length', 'width', 'quantity', 'unit_price', 'type'].includes(field)) {
          const calculatedItem = calculateItemTotals(updatedItem)
          return calculatedItem
        }
        
        return updatedItem
      }
      return item
    }))
  }

  // Helper function to calculate item totals (extracted from addQuoteItem)
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
      total_quantity: `${totalQuantity.toFixed(2)}${unit}`, // Force recalculation when using CALCULER!
      total_price: calculatedTotalPrice
    }
  }

  // Laravel-style CALCULER! function
  const calculateAllTotals = () => {

    
    if (formData.is_free) {

      showSnackbar('Devis gratuit - pas de calcul nécessaire', 'info')
      return
    }

    // Recalculate all items with Laravel logic
    const recalculatedItems = quoteItems.map(item => {
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

    // Update quote items with recalculated values
    setQuoteItems(recalculatedItems)

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

  const calculateTotal = () => {
    if (formData.is_free) return 0
    
    const taxableAmount = quoteItems.reduce((sum, item) => sum + (item.total_price || 0), 0)
    
    if (formData.tax_rate === 20) {
      const taxes = taxableAmount * 0.2
      return taxableAmount + taxes
    }
    
    return taxableAmount
  }

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity })
  }

  // Calculate statistics from quotes data
  const calculateStats = (quotesData: Quote[]) => {
    const now = new Date()
    const thisMonth = quotesData.filter(q => {
      const quoteDate = new Date(q.created_at)
      return quoteDate.getMonth() === now.getMonth() && quoteDate.getFullYear() === now.getFullYear()
    })
    
    const totalValue = quotesData.reduce((sum, q) => sum + (q.total_amount || 0), 0)
    const avgValue = quotesData.length > 0 ? totalValue / quotesData.length : 0
    
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
      await fetchQuotes()
      showSnackbar('Données actualisées avec succès', 'success')
    } catch (error) {
      showSnackbar('Erreur lors de l\'actualisation', 'error')
    }
    setRefreshing(false)
  }

  const handleAdd = async () => {
    resetForm()
    // Ensure all related data is loaded before opening dialog
    if (products.length === 0 || clients.length === 0 || companies.length === 0) {
      console.log('🔄 [Quotes] Loading related data for create dialog...')
      await fetchRelatedData()
    }
    setDialogOpen(true)
  }

  const handleAddClient = async () => {
    try {
      if (!newClientData.name.trim()) {
        showSnackbar('Le nom du client est obligatoire', 'error')
        return
      }

      console.log('🔄 Creating client with data:', newClientData)
      setLoadingClients(true)
      
      const clientDataToSend = {
        name: newClientData.name.trim(),
        nom: newClientData.name.trim(), // Laravel uses 'nom' field
        phone: newClientData.phone.trim() || null,
        email: newClientData.email.trim() || null,
        address: newClientData.address.trim() || null,
        city: newClientData.city.trim() || null,
        company: newClientData.company.trim() || null,
        patent: newClientData.patent.trim() || null
      }
      
      console.log('📤 Sending client data:', clientDataToSend)
      const result = await clientService.createClient(clientDataToSend)
      console.log('✅ Client created successfully:', result)

      // Add the new client to the clients list
      const newClient = {
        id: result?.id || Date.now(), // Fallback ID if not returned
        name: newClientData.name.trim(),
        nom: newClientData.name.trim(),
        phone: newClientData.phone.trim() || null,
        email: newClientData.email.trim() || null,
        address: newClientData.address.trim() || null,
        city: newClientData.city.trim() || null,
        company: newClientData.company.trim() || null,
        patent: newClientData.patent.trim() || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      console.log('👤 Adding new client to list:', newClient)
      setClients(prev => [newClient, ...prev])
      
      // Select the new client in the form
      setFormData(prev => ({ ...prev, client_id: newClient.id }))
      
      // Close dialog and reset form
      setAddClientDialogOpen(false)
      setNewClientData({
        name: '',
        nom: '',
        phone: '',
        email: '',
        address: '',
        city: '',
        company: '',
        patent: ''
      })

      showSnackbar('Client ajouté avec succès', 'success')
    } catch (error) {
      console.error('❌ Error adding client:', error)
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de l\'ajout du client'
      showSnackbar(errorMessage, 'error')
    } finally {
      setLoadingClients(false)
    }
  }

  const handleAddCompany = async () => {
    try {
      if (!newCompanyData.name.trim()) {
        showSnackbar('Le nom de la société est obligatoire', 'error')
        return
      }

      setLoadingCompanies(true)
      const result = await CompanyService.create({
        name: newCompanyData.name.trim(),
        phone: newCompanyData.phone.trim() || null,
        email: newCompanyData.email.trim() || null,
        address: newCompanyData.address.trim() || null,
        city: newCompanyData.city.trim() || null
      })

      // Add the new company to the companies list
      const newCompany = {
        id: result.id || Date.now(), // Fallback ID if not returned
        name: newCompanyData.name.trim(),
        phone: newCompanyData.phone.trim() || null,
        email: newCompanyData.email.trim() || null,
        address: newCompanyData.address.trim() || null,
        city: newCompanyData.city.trim() || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      setCompanies(prev => [newCompany, ...prev])
      
      // Select the new company in the form
      setFormData(prev => ({ ...prev, company_id: newCompany.id }))
      
      // Close dialog and reset form
      setAddCompanyDialogOpen(false)
      setNewCompanyData({
        name: '',
        address: '',
        city: '',
        phone: '',
        email: ''
      })

      showSnackbar('Société ajoutée avec succès', 'success')
    } catch (error) {
      console.error('Error adding company:', error)
      showSnackbar('Erreur lors de l\'ajout de la société', 'error')
    } finally {
      setLoadingCompanies(false)
    }
  }

  const handlePrintQuote = async (quote: Quote) => {
    try {
      // Transform quote to order format for PDF compatibility
      const orderForPdf = {
        id: quote.id,
        order_number: `Q-${quote.quote_number}`,
        order_date: quote.quote_date,
        delivery_date: quote.expiry_date,
        status: quote.status,
        notes: quote.notes,
        total_amount: quote.total_amount,
        client_id: quote.client_id,
        company_id: quote.company_id,
        client: quote.client || clients.find(c => c.id === quote.client_id),
        company: quote.company || companies.find(c => c.id === quote.company_id),
        order_items: quote.items?.map((item: QuoteItem) => ({
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
      link.download = `quote-${quote.quote_number}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      showSnackbar('Quote PDF generated successfully', 'success')
    } catch (error) {
      console.error('Error generating PDF:', error)
      showSnackbar('Error generating PDF', 'error')
    }
  }

  // Simplified handlers - no longer needed with direct onChange

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
                DEVIS
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Gestion des devis et propositions commerciales
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
              Nouveau Devis
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
              ) : quotes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                      <DocumentIcon sx={{ fontSize: 64, color: 'text.disabled' }} />
                      <Typography variant="h6" color="text.secondary">
                        Aucun devis trouvé
                      </Typography>
                      <Typography variant="body2" color="text.disabled">
                        {searchTerm ? 'Essayez de modifier vos critères de recherche' : 'Commencez par créer votre premier devis'}
                      </Typography>
                      {!searchTerm && (
                        <Button variant="contained" startIcon={<AddIcon />} onClick={handleAdd} sx={{ mt: 2 }}>
                          Créer un Devis
                        </Button>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                quotes.map((quote, index) => (
                  <TableRow 
                    key={quote.id} 
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
                            {quote.quote_number}
                          </Typography>
                          {quote.order_ref && (
                            <Typography variant="caption" color="text.secondary">
                              Réf: {quote.order_ref}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ py: 2 }}>
                      <Box>
                        <Typography variant="body2" fontWeight="500">
                          {quote.client?.name || 'Client Inconnu'}
                        </Typography>
                        {quote.client?.phone && (
                          <Typography variant="caption" color="text.secondary">
                            {quote.client.phone}
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell sx={{ py: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PersonIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Typography variant="body2">
                          {quote.user?.name || 'Non Assigné'}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="right" sx={{ py: 2 }}>
                      <Box>
                        <Typography variant="body2" fontWeight="600" color="success.main">
                          {(quote.total_amount || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} MAD
                        </Typography>
                        {quote.tax_rate && quote.tax_rate > 0 && (
                          <Typography variant="caption" color="text.secondary">
                            TTC {quote.tax_rate}%
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell sx={{ py: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CalendarIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Typography variant="body2">
                          {new Date(quote.created_at).toLocaleDateString('fr-FR')}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="center" sx={{ py: 2 }}>
                      <Stack direction="row" spacing={1} justifyContent="center">
                        <Tooltip title="Voir le devis">
                          <IconButton 
                            size="small" 
                            onClick={() => handleView(quote)}
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
                            onClick={() => handleEdit(quote)}
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
                            onClick={() => handlePrintQuote(quote)}
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
                        {quote.status === 'accepted' && !quote.converted_to_order && (
                          <Tooltip title="Convertir en commande">
                            <IconButton 
                              size="small" 
                              onClick={() => handleConvertToOrder(quote)}
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
                            onClick={() => handleDeleteClick(quote)}
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

      {/* Add/Edit Dialog - EXACT LARAVEL LAYOUT */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="xl" fullWidth>
        <DialogTitle sx={{ bgcolor: '#f8f9fa', borderBottom: '1px solid #e9ecef' }}>
          <Typography variant="h5" component="span" sx={{ fontWeight: 600, color: '#495057' }}>
            {editingQuote ? 'MODIFIER DEVIS' : 'CRÉER DEVIS'}
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
                  <FormControl fullWidth size="small">
                    <Select
                      value={formData.user_id || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, user_id: Number(e.target.value) || 0 }))}
                      displayEmpty
                      sx={{ bgcolor: 'white' }}
                    >
                      <MenuItem value="">ADMIN USER</MenuItem>
                      <MenuItem value={10}>Dounia EL</MenuItem>
                      {/* Add more users when available */}
                    </Select>
                  </FormControl>
                </Box>

                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 3 }}>
                  <Box>
                    <Typography variant="body2" sx={{ mb: 1, fontWeight: 500, color: '#6c757d' }}>
                      MATRICULE
                    </Typography>
                    <TextField
                      size="small"
                      fullWidth
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
                        disabled={formData.is_free}
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
                      options={companies}
                      getOptionLabel={(option) => option.name || ''}
                      value={companies.find(c => c.id === formData.company_id) || null}
                      onChange={(event, newValue) => {
                        setFormData(prev => ({ ...prev, company_id: newValue ? newValue.id : 0 }))
                      }}
                      onInputChange={(event, newInputValue) => {
                        setCompanySearchQuery(newInputValue)
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
                RÉFÉRENCES DU DEVIS
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
                  gridTemplateColumns: '40px 100px 1.5fr 80px 80px 50px 80px 80px 80px 80px 100px 80px 80px',
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

                {/* Add Item Row - Only show when specifically adding a reference */}
                {false && (
                <Box sx={{ 
                  display: 'grid', 
                  gridTemplateColumns: '40px 100px 1.5fr 80px 80px 50px 80px 80px 80px 80px 100px 80px 50px',
                  gap: 1,
                  p: 1,
                  bgcolor: 'white',
                  alignItems: 'center'
                }}>
                  <TextField
                    size="small"
                    value={newItem.group}
                    onChange={(e) => setNewItem(prev => ({ ...prev, group: Number(e.target.value) }))}
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
                      value={newItem.type}
                      onChange={(e) => setNewItem(prev => ({ ...prev, type: e.target.value }))}
                      sx={{ 
                        fontSize: '0.75rem',
                        '& .MuiSelect-select': { 
                          fontSize: '0.75rem',
                          padding: '4px 8px'
                        }
                      }}
                    >
                      {productTypes.map((type) => (
                        <MenuItem key={type} value={type} sx={{ fontSize: '0.75rem' }}>{type}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <Autocomplete
                    size="small"
                    fullWidth
                    options={products || []}
                    getOptionLabel={(option) => `${option.name}${option.description ? ` - ${option.description}` : ''}` || ''}
                    value={products.find(p => p.name === newItem.product) || null}
                    onChange={(event, newValue) => {
                      console.log('🎯 [Quotes] Product selected:', newValue)
                      setNewItem(prev => ({ ...prev, product: newValue ? newValue.name : '' }))
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        placeholder="Sélectionner un produit..."
                        size="small"
                        sx={{ 
                          '& .MuiInputBase-input': { 
                            fontSize: '0.75rem',
                            padding: '4px 8px'
                          }
                        }}
                      />
                    )}
                    renderOption={(props, option) => (
                      <Box component="li" {...props}>
                        <Box>
                          <Typography variant="body2" fontWeight={500} sx={{ fontSize: '0.75rem' }}>
                            {option.name}
                          </Typography>
                          {option.description && (
                            <Typography variant="caption" color="text.secondary">
                              {option.description}
                            </Typography>
                          )}
                          {option.unit && (
                            <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                              • {option.unit}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    )}
                    noOptionsText={`Aucun produit trouvé (${products.length} produits chargés)`}
                    loading={loadingProducts}
                    loadingText="Chargement des produits..."
                  />
                  <FormControl size="small" fullWidth>
                    <Select
                      value={newItem.options}
                      onChange={(e) => setNewItem(prev => ({ ...prev, options: e.target.value }))}
                      displayEmpty
                      sx={{ 
                        fontSize: '0.75rem',
                        '& .MuiSelect-select': { 
                          fontSize: '0.75rem',
                          padding: '4px 8px'
                        }
                      }}
                    >
                      <MenuItem value="" sx={{ fontSize: '0.75rem' }}>-</MenuItem>
                      {productOptions.map((option) => (
                        <MenuItem key={option} value={option} sx={{ fontSize: '0.75rem' }}>{option}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <FormControl size="small" fullWidth>
                    <Select
                      value={newItem.state}
                      onChange={(e) => setNewItem(prev => ({ ...prev, state: e.target.value }))}
                      sx={{ 
                        fontSize: '0.75rem',
                        '& .MuiSelect-select': { 
                          fontSize: '0.75rem',
                          padding: '4px 8px'
                        }
                      }}
                    >
                      {productStates.map((state) => (
                        <MenuItem key={state} value={state} sx={{ fontSize: '0.75rem' }}>{state}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <TextField
                    size="small"
                    value={newItem.splicer}
                    onChange={(e) => setNewItem(prev => ({ ...prev, splicer: Number(e.target.value) }))}
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
                    value={newItem.length || ''}
                    onChange={(e) => setNewItem(prev => ({ ...prev, length: e.target.value ? Number(e.target.value) : null }))}
                    sx={{ 
                      width: '100%',
                      '& .MuiInputBase-input': { 
                        textAlign: 'center',
                        fontSize: '0.75rem',
                        padding: '4px 6px'
                      }
                    }}
                    placeholder="100"
                  />
                  <TextField
                    size="small"
                    type="number"
                    value={newItem.width || ''}
                    onChange={(e) => setNewItem(prev => ({ ...prev, width: e.target.value ? Number(e.target.value) : null }))}
                    sx={{ 
                      width: '100%',
                      '& .MuiInputBase-input': { 
                        textAlign: 'center',
                        fontSize: '0.75rem',
                        padding: '4px 6px'
                      }
                    }}
                    placeholder="30"
                  />
                  <TextField
                    size="small"
                    type="number"
                    value={newItem.quantity}
                    onChange={(e) => setNewItem(prev => ({ ...prev, quantity: Number(e.target.value) }))}
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
                    value={newItem.unit_price}
                    onChange={(e) => setNewItem(prev => ({ ...prev, unit_price: Number(e.target.value) }))}
                    disabled={formData.is_free}
                    sx={{ 
                      width: '100%',
                      '& .MuiInputBase-input': { 
                        textAlign: 'center',
                        fontSize: '0.75rem',
                        padding: '4px 6px'
                      }
                    }}
                    placeholder="143.33"
                  />
                  <TextField
                    size="small"
                    value={newItem.total_quantity || ''}
                    onChange={(e) => setNewItem(prev => ({ ...prev, total_quantity: e.target.value }))}
                    sx={{ 
                      width: '100%',
                      '& .MuiInputBase-input': { 
                        textAlign: 'center',
                        fontSize: '0.75rem',
                        padding: '4px 6px'
                      }
                    }}
                    placeholder="30.00"
                  />
                  <Box sx={{ 
                    width: '100%', 
                    textAlign: 'center', 
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: formData.is_free ? '#666' : '#28a745'
                  }}>
                    {formData.is_free ? '0.00' : (newItem.total_price || 0).toFixed(2)}
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                    <IconButton size="small" color="primary" onClick={addQuoteItem}>
                      <AddIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>
                )}

                {/* Existing Items - Only show actual quote items */}
                {quoteItems.length === 0 && editingQuote && (
                  <Box sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontStyle: 'italic' }}>
                      {editingQuote.items ? `${editingQuote.items.length} références trouvées dans l'API` : 'Aucune référence trouvée'}
                    </Typography>
                    {editingQuote.items && editingQuote.items.length > 0 && (
                      <Button 
                        size="small" 
                        variant="outlined" 
                        onClick={() => {
                          console.log('🔥 FORCE LOADING ITEMS:', editingQuote.items);
                          const mappedItems = editingQuote.items.map((item, index) => ({
                            group: item.group_number || item.group || (index + 1),
                            type: item.type || 'DÉBIT',
                            product: item.product || '',
                            options: item.options || '',
                            state: item.state || 'Poli',
                            splicer: parseFloat(item.splicer) || 2,
                            length: item.length ? parseFloat(item.length) : null,
                            width: item.width ? parseFloat(item.width) : null,
                            quantity: parseFloat(item.quantity) || 1,
                            unit_price: parseFloat(item.unit_price) || 0,
                            total_price: parseFloat(item.total_price) || 0,
                            unit: item.unit || 'M2'
                          }));
                          console.log('✅ FORCE MAPPED:', mappedItems);
                          setQuoteItems(mappedItems);
                        }}
                      >
                        Charger les {editingQuote.items.length} références
                      </Button>
                    )}
                  </Box>
                )}
                {quoteItems.map((item, index) => (
                  <Box key={index} sx={{ 
                    display: 'grid', 
                    gridTemplateColumns: '40px 100px 1.5fr 80px 80px 50px 80px 80px 80px 80px 100px 80px 80px',
                    gap: 1,
                    p: 1,
                    bgcolor: 'white',
                    borderTop: '1px solid #f0f0f0',
                    alignItems: 'center'
                  }}>
                    {/* Row Number */}
                    <Box sx={{ 
                      textAlign: 'center', 
                      fontSize: '0.75rem', 
                      fontWeight: 500,
                      color: '#666'
                    }}>
                      {item.group || (index + 1)}
                    </Box>

                    <FormControl size="small" fullWidth>
                      <Select
                        value={item.type && productTypes.includes(item.type) ? item.type : 'DÉBIT'}
                        onChange={(e) => updateQuoteItem(index, 'type', e.target.value)}
                        sx={{ 
                          fontSize: '0.75rem',
                          '& .MuiSelect-select': {
                            fontSize: '0.75rem',
                            padding: '4px 8px'
                          }
                        }}
                        displayEmpty
                        renderValue={(value) => {
                          return value || 'DÉBIT';
                        }}
                      >
                        {productTypes.map((type) => (
                          <MenuItem key={type} value={type} sx={{ fontSize: '0.75rem' }}>
                            {type}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <Autocomplete
                      size="small"
                      fullWidth
                      freeSolo
                      options={products || []}
                      getOptionLabel={(option) => {
                        if (typeof option === 'string') return option;
                        return `${option.name}${option.description ? ` - ${option.description}` : ''}` || '';
                      }}
                      value={item.product || ''}
                      onChange={(event, newValue) => {
                        console.log('🎯 [Quotes-Edit] Product selected:', newValue)
                        const productValue = typeof newValue === 'string' ? newValue : (newValue ? newValue.name : '');
                        updateQuoteItem(index, 'product', productValue);
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          size="small"
                          placeholder="Sélectionner un produit..."
                          value={item.product || ''}
                          sx={{ 
                            '& .MuiInputBase-input': { 
                              fontSize: '0.75rem',
                              padding: '4px 8px'
                            }
                          }}
                        />
                      )}
                      renderOption={(props, option) => (
                        <Box component="li" {...props}>
                          <Box>
                            <Typography variant="body2" fontWeight={500} sx={{ fontSize: '0.75rem' }}>
                              {typeof option === 'string' ? option : option.name}
                            </Typography>
                            {typeof option === 'object' && option.description && (
                              <Typography variant="caption" color="text.secondary">
                                {option.description}
                              </Typography>
                            )}
                            {typeof option === 'object' && option.unit && (
                              <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                                • {option.unit}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      )}
                      noOptionsText={`Aucun produit trouvé (${products.length} produits chargés)`}
                      loading={loadingProducts}
                      loadingText="Chargement des produits..."
                    />
                    <FormControl size="small" fullWidth>
                      <Select
                        value={item.options || ''}
                        onChange={(e) => updateQuoteItem(index, 'options', e.target.value)}
                        sx={{ 
                          fontSize: '0.75rem',
                          '& .MuiSelect-select': { 
                            fontSize: '0.75rem',
                            padding: '4px 8px'
                          }
                        }}
                        displayEmpty
                      >
                        <MenuItem value="" sx={{ fontSize: '0.75rem' }}>-</MenuItem>
                        {productOptions.map((option) => (
                          <MenuItem key={option} value={option} sx={{ fontSize: '0.75rem' }}>{option}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <FormControl size="small" fullWidth>
                      <Select
                        value={item.state || 'Poli'}
                        onChange={(e) => updateQuoteItem(index, 'state', e.target.value)}
                        sx={{ 
                          fontSize: '0.75rem',
                          '& .MuiSelect-select': { 
                            fontSize: '0.75rem',
                            padding: '4px 8px'
                          }
                        }}
                      >
                        {productStates.map((state) => (
                          <MenuItem key={state} value={state} sx={{ fontSize: '0.75rem' }}>{state}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <TextField
                      size="small"
                      type="number"
                      value={item.splicer || 2}
                      onChange={(e) => updateQuoteItem(index, 'splicer', Number(e.target.value))}
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
                      value={item.length && item.length > 0 ? Number(item.length) : ''}
                      onChange={(e) => updateQuoteItem(index, 'length', e.target.value ? parseFloat(e.target.value) : null)}
                      sx={{ 
                        width: '100%',
                        '& .MuiInputBase-input': { 
                          textAlign: 'center',
                          fontSize: '0.75rem',
                          padding: '4px 6px'
                        }
                      }}
                      inputProps={{ min: 0, step: 1 }}
                    />
                    <TextField
                      size="small"
                      type="number"
                      value={item.width && item.width > 0 ? Number(item.width) : ''}
                      onChange={(e) => updateQuoteItem(index, 'width', e.target.value ? parseFloat(e.target.value) : null)}
                      sx={{ 
                        width: '100%',
                        '& .MuiInputBase-input': { 
                          textAlign: 'center',
                          fontSize: '0.75rem',
                          padding: '4px 6px'
                        }
                      }}
                      inputProps={{ min: 0, step: 1 }}
                    />
                    <TextField
                      size="small"
                      type="number"
                      value={item.quantity ? Number(parseFloat(item.quantity).toFixed(2)) : 1}
                      onChange={(e) => updateQuoteItem(index, 'quantity', parseFloat(e.target.value) || 1)}
                      sx={{ 
                        width: '100%',
                        '& .MuiInputBase-input': { 
                          textAlign: 'center',
                          fontSize: '0.75rem',
                          padding: '4px 6px'
                        }
                      }}
                      inputProps={{ min: 0.01, step: 0.01 }}
                    />
                    <TextField
                      size="small"
                      type="number"
                      value={item.unit_price ? Number(parseFloat(item.unit_price).toFixed(2)) : 0}
                      onChange={(e) => updateQuoteItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                      disabled={formData.is_free}
                      sx={{ 
                        width: '100%',
                        '& .MuiInputBase-input': { 
                          textAlign: 'center',
                          fontSize: '0.75rem',
                          padding: '4px 6px'
                        }
                      }}
                      inputProps={{ min: 0, step: 0.01 }}
                    />
                    <TextField
                      size="small"
                      value={item.total_quantity || ''}
                      onChange={(e) => updateQuoteItem(index, 'total_quantity', e.target.value)}
                      sx={{ 
                        width: '100%',
                        '& .MuiInputBase-input': { 
                          textAlign: 'center',
                          fontSize: '0.75rem',
                          padding: '4px 6px'
                        }
                      }}
                    />
                    <Box sx={{ 
                      textAlign: 'center', 
                      fontSize: '0.75rem', 
                      fontWeight: 600,
                      color: formData.is_free ? '#666' : '#28a745',
                      px: 1
                    }}>
                      {formData.is_free ? '0.00' : (item.total_price || 0).toFixed(2)}
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                      <Tooltip title="Dupliquer cette référence">
                        <IconButton size="small" color="primary" onClick={() => cloneReference(index)}>
                          <CopyIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Supprimer">
                        <IconButton size="small" color="error" onClick={() => removeQuoteItem(index)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>
                ))}
              </Box>

              {/* Add Reference Button */}
              <Box sx={{ textAlign: 'center', mt: 4, mb: 4 }}>
                <Button
                  variant="outlined"
                  onClick={addEmptyReference}
                  sx={{ 
                    color: '#dc3545',
                    borderColor: '#dc3545',
                    '&:hover': {
                      bgcolor: '#dc3545',
                      color: 'white'
                    }
                  }}
                >
                  AJOUTER UNE RÉFÉRENCE
                </Button>
              </Box>

              {/* Totals */}
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 4, mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    TOTAL H.T
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700, minWidth: 100, textAlign: 'right', color: formData.taxable_amount > 0 ? '#28a745' : 'inherit' }}>
                    {formData.is_free ? '0.00' : (formData.taxable_amount || 0).toFixed(2)} DHs
                  </Typography>
                </Box>
              </Box>
              
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 4, mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    TOTAL T.T.C
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700, minWidth: 100, textAlign: 'right', color: formData.total_amount > 0 ? '#28a745' : 'inherit' }}>
                    {formData.is_free ? '0.00' : (formData.total_amount || 0).toFixed(2)} DHs
                  </Typography>
                </Box>
              </Box>

              {/* Tax Information */}
              {formData.tax_rate === 20 && formData.total_taxes > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 4, mb: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography variant="body2" sx={{ fontWeight: 500, color: '#6c757d' }}>
                      TVA (20%)
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600, minWidth: 100, textAlign: 'right', color: '#dc3545' }}>
                      {formData.total_taxes.toFixed(2)} DHs
                    </Typography>
                  </Box>
                </Box>
              )}

              {/* Calculate Button */}
              <Box sx={{ textAlign: 'center' }}>
                <Button
                  variant="contained"
                  onClick={calculateAllTotals}
                  sx={{ 
                    bgcolor: '#dc3545',
                    color: 'white',
                    px: 4,
                    py: 1,
                    '&:hover': {
                      bgcolor: '#c82333'
                    }
                  }}
                >
                  CALCULER!
                </Button>
              </Box>
              </Box>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, bgcolor: '#f8f9fa', borderTop: '1px solid #e9ecef' }}>
          <Button 
            onClick={() => setDialogOpen(false)} 
            sx={{ color: '#6c757d' }}
          >
            Annuler
          </Button>
          <Button 
            onClick={handleSave} 
            variant="contained"
            sx={{ 
              bgcolor: '#28a745',
              '&:hover': { bgcolor: '#218838' }
            }}
          >
            {editingQuote ? 'MODIFIER' : 'CRÉER'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Dialog - EXACT SAME LAYOUT AS EDIT */}
      <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="xl" fullWidth>
        <DialogTitle sx={{ bgcolor: '#f8f9fa', borderBottom: '1px solid #e9ecef' }}>
          <Typography variant="h5" component="span" sx={{ fontWeight: 600, color: '#495057' }}>
            CONSULTER LE DEVIS
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          {viewingQuote && (
            <Box sx={{ bgcolor: '#fff' }}>
              {/* SAME 3-COLUMN LAYOUT AS EDIT */}
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
                    <TextField
                      size="small"
                      fullWidth
                      value={viewingQuote.user?.name || 'ADMIN USER'}
                      disabled
                      sx={{ bgcolor: '#f5f5f5' }}
                    />
                  </Box>

                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 3 }}>
                    <Box>
                      <Typography variant="body2" sx={{ mb: 1, fontWeight: 500, color: '#6c757d' }}>
                        MATRICULE
                      </Typography>
                      <TextField
                        size="small"
                        fullWidth
                        value={viewingQuote.order_ref || ''}
                        disabled
                        sx={{ bgcolor: '#f5f5f5' }}
                      />
                    </Box>
                    <Box>
                      <Typography variant="body2" sx={{ mb: 1, fontWeight: 500, color: '#6c757d' }}>
                        CHAUFFEUR
                      </Typography>
                      <TextField
                        size="small"
                        fullWidth
                        value={viewingQuote.driver || ''}
                        disabled
                        sx={{ bgcolor: '#f5f5f5' }}
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
                      value={viewingQuote.worksite || ''}
                      disabled
                      sx={{ bgcolor: '#f5f5f5' }}
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
                    <TextField
                      size="small"
                      fullWidth
                      value={viewingQuote.client?.name || ''}
                      disabled
                      sx={{ bgcolor: '#f5f5f5' }}
                    />
                  </Box>

                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 3 }}>
                    <Box>
                      <Typography variant="body2" sx={{ mb: 1, fontWeight: 500, color: '#6c757d' }}>
                        GRATUIT
                      </Typography>
                      <TextField
                        size="small"
                        fullWidth
                        value={viewingQuote.is_free ? 'Oui' : 'Non'}
                        disabled
                        sx={{ bgcolor: '#f5f5f5' }}
                      />
                    </Box>
                    <Box>
                      <Typography variant="body2" sx={{ mb: 1, fontWeight: 500, color: '#6c757d' }}>
                        TVA
                      </Typography>
                      <TextField
                        size="small"
                        fullWidth
                        value={viewingQuote.tax_rate === 20 ? 'TTC' : 'H.T'}
                        disabled
                        sx={{ bgcolor: '#f5f5f5' }}
                      />
                    </Box>
                  </Box>

                  <Box sx={{ mb: 3 }}>
                    <Typography variant="body2" sx={{ mb: 1, fontWeight: 500, color: '#6c757d' }}>
                      SOCIÉTÉ *
                    </Typography>
                    <TextField
                      size="small"
                      fullWidth
                      value={viewingQuote.company?.name || ''}
                      disabled
                      sx={{ bgcolor: '#f5f5f5' }}
                    />
                  </Box>

                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                    <Box>
                      <Typography variant="body2" sx={{ mb: 1, fontWeight: 500, color: '#6c757d' }}>
                        ENTETE DE
                      </Typography>
                      <TextField
                        size="small"
                        fullWidth
                        value={viewingQuote.template_company?.name || ''}
                        disabled
                        sx={{ bgcolor: '#f5f5f5' }}
                      />
                    </Box>
                    <Box>
                      <Typography variant="body2" sx={{ mb: 1, fontWeight: 500, color: '#6c757d' }}>
                        PLAQUE
                      </Typography>
                      <TextField
                        size="small"
                        fullWidth
                        value={viewingQuote.plate || ''}
                        disabled
                        sx={{ bgcolor: '#f5f5f5' }}
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
                      value={new Date(viewingQuote.created_at || viewingQuote.quote_date).toLocaleDateString('fr-FR')}
                      disabled
                      sx={{ bgcolor: '#f5f5f5' }}
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
                      value={viewingQuote.notes || ''}
                      disabled
                      sx={{ bgcolor: '#f5f5f5' }}
                    />
                  </Box>
                </Box>
              </Box>

              {/* PRODUCTS SECTION - SAME AS EDIT */}
              {viewingQuote.items && viewingQuote.items.length > 0 && (
                <Box sx={{ p: 3, borderTop: '1px solid #e9ecef' }}>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: '#495057', textTransform: 'uppercase' }}>
                    RÉFÉRENCES DU DEVIS
                  </Typography>
                  <Box sx={{ overflow: 'auto', mb: 3 }}>
                    <Box sx={{ 
                      bgcolor: '#fff3cd', 
                      border: '1px solid #ffeaa7',
                      borderRadius: 1,
                      overflow: 'hidden',
                      minWidth: '1100px'
                    }}>
                      <TableContainer>
                        <Table size="small">
                          <TableHead>
                            <TableRow sx={{ bgcolor: '#fff3cd' }}>
                              <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', p: 1 }}>GROUP</TableCell>
                              <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', p: 1 }}>TYPE</TableCell>
                              <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', p: 1 }}>PRODUIT</TableCell>
                              <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', p: 1 }}>OPTIONS</TableCell>
                              <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', p: 1 }}>ÉTAT</TableCell>
                              <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', p: 1 }}>ÉPAIS.</TableCell>
                              <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', p: 1 }}>LONG.</TableCell>
                              <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', p: 1 }}>LARG.</TableCell>
                              <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', p: 1 }}>QTÉ</TableCell>
                              <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', p: 1 }}>P.U</TableCell>
                              <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', p: 1 }}>QTÉ/U</TableCell>
                              <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', p: 1 }}>P.T</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {viewingQuote.items.map((item, index) => (
                              <TableRow key={index} sx={{ bgcolor: index % 2 === 0 ? '#fff' : '#f8f9fa' }}>
                                <TableCell sx={{ p: 1, fontSize: '0.75rem' }}>{item.group_number || (index + 1)}</TableCell>
                                <TableCell sx={{ p: 1, fontSize: '0.75rem' }}>{item.type || 'DÉBIT'}</TableCell>
                                <TableCell sx={{ p: 1, fontSize: '0.75rem' }}>{item.product || item.full_product_description}</TableCell>
                                <TableCell sx={{ p: 1, fontSize: '0.75rem' }}>{item.options || '-'}</TableCell>
                                <TableCell sx={{ p: 1, fontSize: '0.75rem' }}>{item.state || 'Poli'}</TableCell>
                                <TableCell sx={{ p: 1, fontSize: '0.75rem' }}>{item.splicer || '-'}</TableCell>
                                <TableCell sx={{ p: 1, fontSize: '0.75rem' }}>{item.length || '-'}</TableCell>
                                <TableCell sx={{ p: 1, fontSize: '0.75rem' }}>{item.width || '-'}</TableCell>
                                <TableCell sx={{ p: 1, fontSize: '0.75rem' }}>{item.quantity || 1}</TableCell>
                                <TableCell sx={{ p: 1, fontSize: '0.75rem' }}>
                                  {viewingQuote.is_free ? 'GRATUIT' : `${parseFloat(item.unit_price || '0').toFixed(2)} DH`}
                                </TableCell>
                                <TableCell sx={{ p: 1, fontSize: '0.75rem' }}>{item.total_quantity || '-'}</TableCell>
                                <TableCell sx={{ p: 1, fontSize: '0.75rem' }}>
                                  {viewingQuote.is_free ? 'GRATUIT' : `${parseFloat(item.total_price || '0').toFixed(2)} DH`}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Box>
                    
                    {/* Totals Section */}
                    <Box sx={{ mt: 3 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 4, mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Typography variant="body1" sx={{ fontWeight: 600 }}>
                            TOTAL H.T
                          </Typography>
                          <Typography variant="h6" sx={{ fontWeight: 700, minWidth: 100, textAlign: 'right', color: viewingQuote.taxable_amount > 0 ? '#28a745' : 'inherit' }}>
                            {viewingQuote.is_free ? '0.00' : (viewingQuote.taxable_amount || 0).toFixed(2)} DHs
                          </Typography>
                        </Box>
                      </Box>
                      
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 4, mb: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Typography variant="body1" sx={{ fontWeight: 600 }}>
                            TOTAL T.T.C
                          </Typography>
                          <Typography variant="h6" sx={{ fontWeight: 700, minWidth: 100, textAlign: 'right', color: viewingQuote.total_amount > 0 ? '#28a745' : 'inherit' }}>
                            {viewingQuote.is_free ? '0.00' : (viewingQuote.total_amount || 0).toFixed(2)} DHs
                          </Typography>
                        </Box>
                      </Box>

                      {/* Tax Information */}
                      {viewingQuote.tax_rate === 20 && viewingQuote.total_taxes > 0 && (
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 4, mb: 3 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Typography variant="body2" sx={{ fontWeight: 500, color: '#6c757d' }}>
                              TVA (20%)
                            </Typography>
                            <Typography variant="body1" sx={{ fontWeight: 600, minWidth: 100, textAlign: 'right', color: '#dc3545' }}>
                              {viewingQuote.total_taxes.toFixed(2)} DHs
                            </Typography>
                          </Box>
                        </Box>
                      )}
                    </Box>
                  </Box>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
          {viewingQuote && viewingQuote.status === 'accepted' && !viewingQuote.converted_to_order && (
            <Button 
              variant="contained" 
              startIcon={<ConvertIcon />}
              onClick={() => {
                handleConvertToOrder(viewingQuote)
                setViewDialogOpen(false)
              }}
            >
              Convert to Order
            </Button>
          )}
          <Button 
            variant="contained" 
            startIcon={<PrintIcon />}
            onClick={() => viewingQuote && handlePrintQuote(viewingQuote)}
          >
            Print Quote
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>
          <Typography variant="h6" component="span" sx={{ fontWeight: 600 }}>
            Confirmer la Suppression
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete quote "{quoteToDelete?.quote_number}"?
            This action cannot be undone and will also remove all quote items.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDelete} variant="contained" color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Company Dialog */}
      <Dialog open={addCompanyDialogOpen} onClose={() => setAddCompanyDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Typography variant="h6" component="span" sx={{ fontWeight: 600 }}>
            Ajouter une Nouvelle Société
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 3 }}>
              <TextField
                label="Nom de la Société *"
                fullWidth
                value={newCompanyData.name}
                onChange={(e) => setNewCompanyData(prev => ({ ...prev, name: e.target.value }))}
                required
              />
              <TextField
                label="Téléphone"
                fullWidth
                value={newCompanyData.phone}
                onChange={(e) => setNewCompanyData(prev => ({ ...prev, phone: e.target.value }))}
              />
            </Box>
            
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 3 }}>
              <TextField
                label="Email"
                fullWidth
                type="email"
                value={newCompanyData.email}
                onChange={(e) => setNewCompanyData(prev => ({ ...prev, email: e.target.value }))}
              />
              <TextField
                label="Ville"
                fullWidth
                value={newCompanyData.city}
                onChange={(e) => setNewCompanyData(prev => ({ ...prev, city: e.target.value }))}
              />
            </Box>

            <Box sx={{ mb: 3 }}>
              <TextField
                label="Adresse"
                fullWidth
                multiline
                rows={2}
                value={newCompanyData.address}
                onChange={(e) => setNewCompanyData(prev => ({ ...prev, address: e.target.value }))}
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setAddCompanyDialogOpen(false)
            setNewCompanyData({
              name: '',
              address: '',
              city: '',
              phone: '',
              email: ''
            })
          }}>
            Annuler
          </Button>
          <Button 
            onClick={handleAddCompany} 
            variant="contained"
            disabled={!newCompanyData.name.trim()}
            sx={{ 
              bgcolor: '#28a745',
              '&:hover': { bgcolor: '#218838' }
            }}
          >
            Ajouter Société
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Client Dialog */}
      <Dialog open={addClientDialogOpen} onClose={() => setAddClientDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Typography variant="h6" component="span" sx={{ fontWeight: 600 }}>
            Ajouter un Nouveau Client
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 3 }}>
              <TextField
                label="Nom du Client *"
                fullWidth
                value={newClientData.name}
                onChange={(e) => setNewClientData(prev => ({ ...prev, name: e.target.value, nom: e.target.value }))}
                required
              />
              <TextField
                label="Téléphone"
                fullWidth
                value={newClientData.phone}
                onChange={(e) => setNewClientData(prev => ({ ...prev, phone: e.target.value }))}
              />
            </Box>
            
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 3 }}>
              <TextField
                label="Email"
                fullWidth
                type="email"
                value={newClientData.email}
                onChange={(e) => setNewClientData(prev => ({ ...prev, email: e.target.value }))}
              />
              <TextField
                label="Ville"
                fullWidth
                value={newClientData.city}
                onChange={(e) => setNewClientData(prev => ({ ...prev, city: e.target.value }))}
              />
            </Box>

            <Box sx={{ mb: 3 }}>
              <TextField
                label="Adresse"
                fullWidth
                multiline
                rows={2}
                value={newClientData.address}
                onChange={(e) => setNewClientData(prev => ({ ...prev, address: e.target.value }))}
              />
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <TextField
                label="Société"
                fullWidth
                value={newClientData.company}
                onChange={(e) => setNewClientData(prev => ({ ...prev, company: e.target.value }))}
              />
              <TextField
                label="Patente"
                fullWidth
                value={newClientData.patent}
                onChange={(e) => setNewClientData(prev => ({ ...prev, patent: e.target.value }))}
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setAddClientDialogOpen(false)
            setNewClientData({
              name: '',
              nom: '',
              phone: '',
              email: '',
              address: '',
              city: '',
              company: '',
              patent: ''
            })
          }}>
            Annuler
          </Button>
          <Button 
            onClick={handleAddClient} 
            variant="contained"
            disabled={!newClientData.name.trim()}
            sx={{ 
              bgcolor: '#28a745',
              '&:hover': { bgcolor: '#218838' }
            }}
          >
            Ajouter Client
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