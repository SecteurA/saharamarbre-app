import React, { useState, useEffect } from 'react'
import * as clientService from '../services/clientServiceApi'
import { CompanyService } from '../services/companyServiceApi'
import { useAuth } from '../contexts/AuthContext'

import {
  Paper,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
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
  Card,
  CardContent,
  IconButton,
  Alert,
  Snackbar,
  InputAdornment,
  CircularProgress,
  Pagination,
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
  Euro as EuroIcon,
  CalendarToday as CalendarIcon,
  GetApp as ExportIcon,
  Refresh as RefreshIcon,
  Person as PersonIcon,
  Payment as PaymentIcon,
  Receipt as ReceiptIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon
} from '@mui/icons-material'

// Import types from service
import { 
  PaymentSlipServiceApi, 
  type PaymentSlip, 
  type PaymentSlipPayment,
  type CreatePaymentSlipData
} from '../services/paymentSlipServiceApi'

type Client = {
  id: number
  name: string
  phone?: string
}

type Company = {
  id: number
  name: string
}



type PaginationParams = {
  page: number
  limit: number
  search?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}



export default function PaymentSlips() {
  const [paymentSlips, setPaymentSlips] = useState<PaymentSlip[]>([])
  const [loading, setLoading] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [editingPaymentSlip, setEditingPaymentSlip] = useState<PaymentSlip | null>(null)
  const [viewingPaymentSlip, setViewingPaymentSlip] = useState<PaymentSlip | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [paymentSlipToDelete, setPaymentSlipToDelete] = useState<PaymentSlip | null>(null)
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
    paid: 0,
    unpaid: 0,
    partial: 0,
    thisMonth: 0,
    totalValue: 0
  })

  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' })
  
  // Form data
  const [formData, setFormData] = useState<CreatePaymentSlipData>({
    order_ref: '',
    client_id: 0,
    company_id: 0,
    notes: '',
    payments: []
  })

  // Payment item form
  const [payments, setPayments] = useState<Omit<PaymentSlipPayment, 'id'>[]>([])
  const [newPayment, setNewPayment] = useState<Omit<PaymentSlipPayment, 'id'>>({
    type: 'ESPÈCES',
    amount: 0,
    check_number: '',
    date: new Date().toISOString().slice(0, 16),
    notes: ''
  })

  // Related data
  const [clients, setClients] = useState<Client[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [clientSearchQuery, setClientSearchQuery] = useState('')
  
  // Additional state for the new form
  const [isViewMode, setIsViewMode] = useState(false)
  const [loadingClients, setLoadingClients] = useState(false)
  const [loadingCompanies, setLoadingCompanies] = useState(false)
  const [addClientDialogOpen, setAddClientDialogOpen] = useState(false)
  const [addCompanyDialogOpen, setAddCompanyDialogOpen] = useState(false)
  
  // Get current user from auth context
  const { user } = useAuth()
  
  const paymentTypes = ['CHÈQUE', 'ESPÈCES', 'VIREMENT', 'CARTE']

  useEffect(() => {
    fetchPaymentSlips()
  }, [page, limit, searchTerm])

  useEffect(() => {
    fetchRelatedData()
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

  const fetchPaymentSlips = async () => {
    setLoading(true)
    try {
      const params: PaginationParams = {
        page,
        limit,
        search: searchTerm || undefined,
        sortBy: 'created_at',
        sortOrder: 'desc'
      }

      let result
      
      if (searchTerm) {
        result = await PaymentSlipServiceApi.search(searchTerm, params)
      } else {
        result = await PaymentSlipServiceApi.getAll(params)
      }
      
      if (result.success) {
        setPaymentSlips(result.data || [])
        if (result.pagination) {
          setTotalItems(result.pagination.totalItems)
          setTotalPages(result.pagination.totalPages)
        }
        // Calculate statistics
        calculateStats(result.data || [])
      }
    } catch (error) {
      showSnackbar('Error fetching payment slips', 'error')
    }
    setLoading(false)
  }

  const fetchRelatedData = async () => {
    try {
      setLoadingClients(true)
      setLoadingCompanies(true)
      

      
      const [clientsResult, companiesResult] = await Promise.all([
        clientService.getClients(1, 100, ''), // Load 100 clients like in Quotes
        CompanyService.getAll()
      ])


      
      // Handle clients response properly (same as Quotes)
      if (clientsResult && clientsResult.clients) {
        setClients(clientsResult.clients)

      } else if (Array.isArray(clientsResult)) {
        setClients(clientsResult)

      } else {
        console.warn('⚠️ No clients found in response')
        setClients([])
      }

      // Handle companies response properly (same as Quotes)
      if (Array.isArray(companiesResult)) {
        setCompanies(companiesResult)

      } else if (companiesResult && companiesResult.data) {
        setCompanies(companiesResult.data)

      } else {
        setCompanies([])
        console.warn('⚠️ No companies found in response')
      }

    } catch (error) {
      console.error('❌ Error fetching related data:', error)
      setClients([])
      setCompanies([])
    } finally {
      setLoadingClients(false)
      setLoadingCompanies(false)
    }
  }

  const handleEdit = (paymentSlip: PaymentSlip) => {
    // Ensure the client is present in the clients array for the Select
    if (paymentSlip.client && !clients.find(c => c.id === paymentSlip.client_id)) {
      setClients(prev => [...prev, { id: paymentSlip.client.id, name: paymentSlip.client.name || paymentSlip.client.nom || '' }]);
    }
    setEditingPaymentSlip(paymentSlip);
    setIsViewMode(false);

    // Load the first payment data if available
    const firstPayment = paymentSlip.payments && paymentSlip.payments.length > 0 ? paymentSlip.payments[0] : undefined;

    // Ensure client_id is always a number and matches the clients array
    let clientId = '';
    if (paymentSlip.client_id) {
      clientId = Number(paymentSlip.client_id);
    } else if (paymentSlip.client && paymentSlip.client.id) {
      clientId = Number(paymentSlip.client.id);
    }

    setFormData({
      order_ref: paymentSlip.order_ref || '',
      client_id: clientId,
      company_id: paymentSlip.company_id
        ? Number(paymentSlip.company_id)
        : (paymentSlip.company && paymentSlip.company.id ? Number(paymentSlip.company.id) : ''),
      notes: paymentSlip.notes || '',
      payments: paymentSlip.payments || [],
      plate: paymentSlip.plate || '',
      driver: paymentSlip.driver || '',
      worksite: paymentSlip.worksite || '',
      is_free: typeof paymentSlip.is_free === 'boolean' ? paymentSlip.is_free : Boolean(paymentSlip.is_free),
      tax_rate: paymentSlip.tax_rate ?? 20,
      template_id: paymentSlip.template_id
        ? Number(paymentSlip.template_id)
        : (paymentSlip.company_id ? Number(paymentSlip.company_id) : (paymentSlip.company && paymentSlip.company.id ? Number(paymentSlip.company.id) : '')),
      payment_type: firstPayment?.type || 'CHÈQUE',
      amount: firstPayment?.amount !== undefined && firstPayment?.amount !== null ? String(firstPayment.amount) : '',
      check_number: firstPayment?.check_number || '',
      payment_date: firstPayment?.date || ''
    });
    setPayments(paymentSlip.payments || []);
    setDialogOpen(true);
  }

  const handleView = (paymentSlip: PaymentSlip) => {
    setViewingPaymentSlip(paymentSlip)
    setViewDialogOpen(true)
  }

  const handleSave = async () => {
    try {
      const paymentSlipData = { ...formData, payments }
      const result = editingPaymentSlip
        ? await PaymentSlipServiceApi.update(editingPaymentSlip.id, paymentSlipData)
        : await PaymentSlipServiceApi.create(paymentSlipData)

      if (result.success) {
        showSnackbar(
          editingPaymentSlip ? 'Payment slip updated successfully' : 'Payment slip created successfully',
          'success'
        )
        setDialogOpen(false)
        fetchPaymentSlips()
        resetForm()
        return true
      } else {
        showSnackbar('Failed to save payment slip', 'error')
        return false
      }
    } catch (error) {
      showSnackbar('Error saving payment slip', 'error')
      return false
    }
  }

  const handleDeleteClick = (paymentSlip: PaymentSlip) => {
    setPaymentSlipToDelete(paymentSlip)
    setDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!paymentSlipToDelete) return

    try {
      const result = await PaymentSlipServiceApi.delete(paymentSlipToDelete.id)
      if (result.success) {
        showSnackbar('Payment slip deleted successfully', 'success')
        setDeleteDialogOpen(false)
        setPaymentSlipToDelete(null)
        fetchPaymentSlips()
      } else {
        showSnackbar('Failed to delete payment slip', 'error')
      }
    } catch (error) {
      showSnackbar('Error deleting payment slip', 'error')
    }
  }

  const addPayment = () => {
    if (newPayment.amount <= 0) return

    setPayments(prev => [...prev, newPayment])
    setNewPayment({
      type: 'ESPÈCES',
      amount: 0,
      check_number: '',
      date: new Date().toISOString().slice(0, 16),
      notes: ''
    })
  }

  const removePayment = (index: number) => {
    setPayments(prev => prev.filter((_, i) => i !== index))
  }

  const calculateTotalPayments = () => {
    return payments.reduce((sum, payment) => sum + payment.amount, 0)
  }

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity })
  }

  // Calculate statistics from payment slips data
  const calculateStats = (paymentSlipsData: PaymentSlip[]) => {
    const now = new Date()
    const thisMonth = paymentSlipsData.filter(ps => {
      const createdDate = new Date(ps.created_at)
      return createdDate.getMonth() === now.getMonth() && createdDate.getFullYear() === now.getFullYear()
    })
    
    const totalValue = paymentSlipsData.reduce((sum, ps) => sum + (ps.total_amount || 0), 0)
    const paid = paymentSlipsData.filter(ps => ps.payment_status === 'paid').length
    const unpaid = paymentSlipsData.filter(ps => ps.payment_status === 'unpaid').length
    const partial = paymentSlipsData.filter(ps => ps.payment_status === 'partial').length
    
    setStats({
      total: totalItems, // Use totalItems from pagination for accurate count
      paid,
      unpaid,
      partial,
      thisMonth: thisMonth.length,
      totalValue: totalValue
    })
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await fetchPaymentSlips()
      showSnackbar('Données actualisées avec succès', 'success')
    } catch (error) {
      showSnackbar('Erreur lors de l\'actualisation', 'error')
    }
    setRefreshing(false)
  }

  const resetForm = () => {
    setFormData({
      order_ref: '',
      client_id: 0,
      company_id: 0,
      notes: '',
      payments: [],
      plate: '',
      driver: '',
      worksite: '',
      is_free: false,
      tax_rate: 20,
      template_id: undefined,
      payment_type: 'CHÈQUE',
      amount: '',
      check_number: '',
      payment_date: new Date().toISOString().split('T')[0]
    })
    setPayments([])
    setEditingPaymentSlip(null)
  }

  const handleAdd = () => {
    resetForm()
    setIsViewMode(false)
    setEditingPaymentSlip(null)
    setDialogOpen(true)
  }

  const handleInputChange = (field: keyof CreatePaymentSlipData) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }))
  }

  const handleSelectChange = (field: keyof CreatePaymentSlipData) => (
    event: any
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }))
  }

  // Additional handlers for the new form
  const handleSubmit = async () => {
    await handleSave()
  }

  const handleSaveAndAddAnother = async () => {
    const success = await handleSave()
    if (success) {
      // Reset form but keep dialog open
      setFormData({
        client_id: 0,
        company_id: undefined,
        amount: 0,
        payment_type: 'cash',
        check_number: '',
        payment_date: new Date().toISOString().split('T')[0],
        notes: '',
        plate: '',
        driver: '',
        worksite: '',
        is_free: false,
        tax_rate: 20,
        template_id: undefined,
        order_ref: ''
      })
      setEditingPaymentSlip(null)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'success'
      case 'unpaid': return 'error'
      case 'partial': return 'warning'
      default: return 'default'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'paid': return 'Payé'
      case 'unpaid': return 'Non payé'
      case 'partial': return 'Partiellement payé'
      default: return status
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-MA', {
      style: 'currency',
      currency: 'MAD'
    }).format(amount)
  }

  return (
    <Box>
      {/* Modern Header with Statistics Cards */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: 'primary.main', width: 48, height: 48 }}>
              <PaymentIcon />
            </Avatar>
            <Box>
              <Typography variant="h4" component="h1" sx={{ fontWeight: 600, color: 'text.primary' }}>
                BONS DE RÈGLEMENT
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Gestion des paiements et règlements clients
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
              NOUVEAU BON DE RÈGLEMENT
            </Button>
          </Box>
        </Box>

        {/* Statistics Cards */}
        <Box sx={{ 
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr 1fr 1fr 1fr' },
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
                    Total
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    {(stats.total || 0).toLocaleString()}
                  </Typography>
                </Box>
                <ReceiptIcon sx={{ fontSize: 32, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
          
          <Card sx={{ 
            background: 'linear-gradient(135deg, #56ab2f 0%, #a8e6cf 100%)',
            color: 'white',
            height: '100%'
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="body2" sx={{ opacity: 0.8, mb: 1 }}>
                    Payés
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    {(stats.paid || 0).toLocaleString()}
                  </Typography>
                </Box>
                <PaymentIcon sx={{ fontSize: 32, opacity: 0.8 }} />
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
                    Non payés
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    {(stats.unpaid || 0).toLocaleString()}
                  </Typography>
                </Box>
                <EuroIcon sx={{ fontSize: 32, opacity: 0.8 }} />
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
                    Partiels
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    {(stats.partial || 0).toLocaleString()}
                  </Typography>
                </Box>
                <CalendarIcon sx={{ fontSize: 32, opacity: 0.8 }} />
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
                    Ce Mois
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    {(stats.thisMonth || 0).toLocaleString()}
                  </Typography>
                </Box>
                <CalendarIcon sx={{ fontSize: 32, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>

          <Card sx={{ 
            background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
            color: '#333',
            height: '100%'
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="body2" sx={{ opacity: 0.8, mb: 1 }}>
                    Valeur Totale
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    {formatCurrency(stats.totalValue)}
                  </Typography>
                </Box>
                <EuroIcon sx={{ fontSize: 32, opacity: 0.8 }} />
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
                <TableCell>COMMANDE</TableCell>
                <TableCell align="right">MONTANT</TableCell>
                <TableCell>DATE D'ÉMISSION</TableCell>
                <TableCell align="center">ACTIONS</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : paymentSlips.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                    <PaymentIcon sx={{ fontSize: 64, color: 'text.disabled' }} />
                    <Typography variant="h6" color="text.secondary">
                      Aucun bon de règlement trouvé
                    </Typography>
                    <Typography variant="body2" color="text.disabled">
                      {searchTerm ? 'Essayez de modifier vos critères de recherche' : 'Commencez par créer votre premier bon de règlement'}
                    </Typography>
                    {!searchTerm && (
                      <Button variant="contained" startIcon={<AddIcon />} onClick={handleAdd} sx={{ mt: 2 }}>
                        Créer un Bon
                      </Button>
                    )}
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              paymentSlips.map((paymentSlip, index) => (
                <TableRow 
                  key={paymentSlip.id} 
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
                          {paymentSlip.human_id}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ py: 2 }}>
                    <Box>
                      <Typography variant="body2" fontWeight="500">
                        {paymentSlip.client?.name || 'Client Inconnu'}
                      </Typography>
                      {paymentSlip.client?.phone && (
                        <Typography variant="caption" color="text.secondary">
                          {paymentSlip.client.phone}
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell sx={{ py: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PersonIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                      <Typography variant="body2">
                        {paymentSlip.user?.name || 'Non Assigné'}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ py: 2 }}>
                    <Typography variant="body2">
                      {paymentSlip.order_ref || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 2 }}>
                    <Typography variant="body2" fontWeight="600" color="success.main">
                      {formatCurrency(paymentSlip.total_amount)}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ py: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CalendarIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                      <Typography variant="body2">
                        {new Date(paymentSlip.created_at).toLocaleDateString('fr-FR')}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="center" sx={{ py: 2 }}>
                    <Stack direction="row" spacing={1} justifyContent="center">
                      <Tooltip title="Voir le bon">
                        <IconButton 
                          size="small" 
                          onClick={() => handleView(paymentSlip)}
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
                          onClick={() => handleEdit(paymentSlip)}
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
                      <Tooltip title="Supprimer">
                        <IconButton 
                          size="small" 
                          onClick={() => handleDeleteClick(paymentSlip)}
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

    {/* Add/Edit Dialog - ACTUALLY MUCH WIDER NOW */}
    <Dialog 
      open={dialogOpen} 
      onClose={() => setDialogOpen(false)} 
      maxWidth={false}
      fullWidth
      PaperProps={{
        sx: { 
          width: '98vw', 
          maxWidth: 'none', 
          minWidth: '1400px',
          margin: '20px'
        }
      }}
    >
      <DialogTitle sx={{ bgcolor: '#f8f9fa', borderBottom: '1px solid #e9ecef' }}>
        <Typography variant="h5" component="span" sx={{ fontWeight: 600, color: '#495057' }}>
          {isViewMode ? 'VOIR BON DE RÈGLEMENT' : editingPaymentSlip ? 'MODIFIER BON DE RÈGLEMENT' : 'CRÉER BON DE RÈGLEMENT'}
        </Typography>
      </DialogTitle>
      <DialogContent sx={{ p: 0 }}>
        {/* 3-COLUMN SECTION - COMPLETELY SEPARATE */}
        <Box sx={{ bgcolor: '#fff' }}>
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
                    value={editingPaymentSlip?.user?.name || 'Non Assigné'}
                    sx={{ bgcolor: 'white' }}
                  />
                ) : (
                  <TextField
                    size="small"
                    fullWidth
                    disabled
                    value={user?.name || 'Utilisateur non connecté'}
                    sx={{ bgcolor: 'white' }}
                  />
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
                  BONS DE RETOUR*
                </Typography>
                {isViewMode ? (
                  <TextField
                    size="small"
                    fullWidth
                    disabled
                    value={
                      editingPaymentSlip?.client?.name || 
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
                                Tel: {option.phone}
                              </Typography>
                            )}
                            {option.company && (
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                {option.company}  
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
                {isViewMode ? (
                  <TextField
                    size="small"
                    fullWidth
                    disabled
                    value={
                      editingPaymentSlip?.company?.name || 
                      companies.find(c => c.id === formData.company_id)?.name || 
                      'Aucune société sélectionnée'
                    }
                    sx={{ bgcolor: 'white' }}
                  />
                ) : (
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
                )}
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
                    filterOptions={(options, { inputValue }) => {
                      return options.filter(option =>
                        (option.name || '').toLowerCase().includes(inputValue.toLowerCase()) ||
                        (option.city || '').toLowerCase().includes(inputValue.toLowerCase())
                      )
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
                    BCN/BCX *
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
        </Box>

        {/* PAYMENT SECTION - COMPLETELY INDEPENDENT */}
        <Box sx={{ bgcolor: '#fff', borderTop: '1px solid #e9ecef' }}>
          <Box sx={{ p: 3, width: '100%' }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: '#495057', textTransform: 'uppercase' }}>
              RÈGLEMENTS
            </Typography>
            <TableContainer sx={{ border: '1px solid #e9ecef', width: '100%' }}>
              <Table sx={{ width: '100%' }}>
                <TableHead>
                  <TableRow sx={{ bgcolor: '#ffc107' }}>
                    <TableCell sx={{ fontWeight: 'bold', color: 'black', textTransform: 'uppercase', p: 3, fontSize: '1.2rem', minWidth: '250px' }}>
                      TYPE *
                    </TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: 'black', textTransform: 'uppercase', p: 3, fontSize: '1.2rem', minWidth: '250px' }}>
                      MONTANT *
                    </TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: 'black', textTransform: 'uppercase', p: 3, fontSize: '1.2rem', minWidth: '350px' }}>
                      N° CHÈQUE/COMPTE BANQUAIRE
                    </TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: 'black', textTransform: 'uppercase', p: 3, fontSize: '1.2rem', minWidth: '250px' }}>
                      DATE
                    </TableCell>
                    {!isViewMode && (
                      <TableCell />
                    )}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {payments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 3, color: 'text.disabled' }}>
                        Aucun règlement ajouté
                      </TableCell>
                    </TableRow>
                  ) : (
                    payments.map((payment, idx) => (
                      <TableRow key={idx}>
                        <TableCell sx={{ p: 3, minWidth: '250px' }}>
                          <FormControl fullWidth size="medium">
                            <Select
                              value={payment.type}
                              onChange={e => {
                                if (isViewMode) return;
                                const updated = [...payments];
                                updated[idx] = { ...updated[idx], type: e.target.value };
                                setPayments(updated);
                              }}
                              disabled={isViewMode}
                              sx={{ bgcolor: 'white', height: '60px', fontSize: '1.1rem' }}
                            >
                              <MenuItem value="CHÈQUE">CHÈQUE</MenuItem>
                              <MenuItem value="ESPÈCES">ESPÈCES</MenuItem>
                              <MenuItem value="VIREMENT">VIREMENT</MenuItem>
                              <MenuItem value="CARTE">CARTE</MenuItem>
                            </Select>
                          </FormControl>
                        </TableCell>
                        <TableCell sx={{ p: 3, minWidth: '250px' }}>
                          <TextField
                            fullWidth
                            size="medium"
                            value={payment.amount}
                            onChange={e => {
                              if (isViewMode) return;
                              const updated = [...payments];
                              updated[idx] = { ...updated[idx], amount: e.target.value };
                              setPayments(updated);
                            }}
                            disabled={isViewMode}
                            sx={{ 
                              bgcolor: 'white',
                              '& .MuiInputBase-root': { height: '60px', fontSize: '1.1rem' }
                            }}
                          />
                        </TableCell>
                        <TableCell sx={{ p: 3, minWidth: '350px' }}>
                          <TextField
                            fullWidth
                            size="medium"
                            value={payment.check_number}
                            onChange={e => {
                              if (isViewMode) return;
                              const updated = [...payments];
                              updated[idx] = { ...updated[idx], check_number: e.target.value };
                              setPayments(updated);
                            }}
                            disabled={isViewMode}
                            sx={{ 
                              bgcolor: 'white',
                              '& .MuiInputBase-root': { height: '60px', fontSize: '1.1rem' }
                            }}
                          />
                        </TableCell>
                        <TableCell sx={{ p: 3, minWidth: '250px' }}>
                          <TextField
                            fullWidth
                            size="medium"
                            type="date"
                            value={payment.date ? payment.date.slice(0, 10) : ''}
                            onChange={e => {
                              if (isViewMode) return;
                              const updated = [...payments];
                              updated[idx] = { ...updated[idx], date: e.target.value };
                              setPayments(updated);
                            }}
                            disabled={isViewMode}
                            sx={{ 
                              bgcolor: 'white',
                              '& .MuiInputBase-root': { height: '60px', fontSize: '1.1rem' }
                            }}
                          />
                        </TableCell>
                        {!isViewMode && (
                          <TableCell sx={{ width: 60 }}>
                            <IconButton color="error" onClick={() => removePayment(idx)}>
                              <DeleteIcon />
                            </IconButton>
                          </TableCell>
                        )}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Button
                variant="text"
                sx={{ 
                  color: '#dc3545',
                  textTransform: 'uppercase',
                  fontSize: '0.875rem',
                  fontWeight: 600
                }}
                onClick={() => setPayments(prev => [...prev, { type: 'CHÈQUE', amount: '', check_number: '', date: new Date().toISOString().slice(0, 10) }])}
                disabled={isViewMode}
              >
                AJOUTER UNE RÉFÉRENCE
                <KeyboardArrowDownIcon sx={{ ml: 1 }} />
              </Button>
            </Box>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{ bgcolor: '#f8f9fa', justifyContent: 'flex-start', gap: 2, p: 3 }}>
        {!isViewMode && (
          <>
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={loading}
              sx={{ 
                bgcolor: '#dc3545', 
                '&:hover': { bgcolor: '#c82333' },
                textTransform: 'uppercase',
                fontWeight: 600,
                px: 4
              }}
            >
              {editingPaymentSlip ? 'MODIFIER' : 'CRÉER'}
            </Button>
            <Button
              variant="outlined"
              onClick={handleSaveAndAddAnother}
              disabled={loading}
              sx={{ 
                color: '#dc3545', 
                borderColor: '#dc3545',
                textTransform: 'uppercase',
                fontWeight: 600,
                px: 3,
                '&:hover': { bgcolor: 'rgba(220, 53, 69, 0.04)' }
              }}
            >
              CRÉER & AJOUTER UN AUTRE
            </Button>
          </>
        )}
        <Button
          variant="text"
          onClick={() => setDialogOpen(false)}
          sx={{ 
            color: '#dc3545',
            textTransform: 'uppercase',
            fontWeight: 600
          }}
        >
          ANNULER
        </Button>
      </DialogActions>
    </Dialog>

    {/* View Dialog - Same layout as main form but grayed out */}
    <Dialog 
      open={viewDialogOpen} 
      onClose={() => setViewDialogOpen(false)} 
      maxWidth={false}
      fullWidth
      PaperProps={{
        sx: { 
          width: '98vw', 
          maxWidth: 'none', 
          minWidth: '1400px'
        }
      }}
    >
      <DialogTitle sx={{ bgcolor: '#f8f9fa', borderBottom: '1px solid #e9ecef' }}>
        <Typography variant="h5" sx={{ fontWeight: 600, color: '#495057' }}>
          VOIR BON DE RÈGLEMENT
        </Typography>
      </DialogTitle>
      <DialogContent sx={{ p: 0 }}>
        {viewingPaymentSlip && (
          <>
            {/* 3-COLUMN SECTION - EXACTLY SAME AS MAIN FORM */}
            <Box sx={{ bgcolor: '#fff' }}>
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
                      value={viewingPaymentSlip.user?.name || 'Non Assigné'}
                      disabled
                      sx={{ bgcolor: 'white' }}
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
                        value={viewingPaymentSlip.plate || ''}
                        disabled
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
                        value={viewingPaymentSlip.driver || ''}
                        disabled
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
                      value={viewingPaymentSlip.worksite || ''}
                      disabled
                      sx={{ bgcolor: 'white' }}
                    />
                  </Box>
                </Box>

                {/* MIDDLE SECTION - DETAILS */}
                <Box sx={{ p: 3, borderRight: '1px solid #e9ecef', bgcolor: '#fff' }}>
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
                      value={viewingPaymentSlip.client?.name || ''}
                      disabled
                      sx={{ bgcolor: 'white' }}
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
                        value={viewingPaymentSlip.is_free ? 'Oui' : 'Non'}
                        disabled
                        sx={{ bgcolor: 'white' }}
                      />
                    </Box>
                    <Box>
                      <Typography variant="body2" sx={{ mb: 1, fontWeight: 500, color: '#6c757d' }}>
                        TVA
                      </Typography>
                      <TextField
                        size="small"
                        fullWidth
                        value={viewingPaymentSlip.tax_rate === 0 ? 'H.T' : 'TTC'}
                        disabled
                        sx={{ bgcolor: 'white' }}
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
                      value={viewingPaymentSlip.company?.name || ''}
                      disabled
                      sx={{ bgcolor: 'white' }}
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
                        value={companies.find(c => c.id === viewingPaymentSlip.template_id)?.name || viewingPaymentSlip.company?.name || ''}
                        disabled
                        sx={{ bgcolor: 'white' }}
                      />
                    </Box>
                    <Box>
                      <Typography variant="body2" sx={{ mb: 1, fontWeight: 500, color: '#6c757d' }}>
                        BCN/BCX
                      </Typography>
                      <TextField
                        size="small"
                        fullWidth
                        value={viewingPaymentSlip.order_ref || ''}
                        disabled
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
                      value={new Date(viewingPaymentSlip.created_at).toLocaleString('fr-FR')}
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
                      value={viewingPaymentSlip.notes || ''}
                      disabled
                      sx={{ bgcolor: 'white' }}
                    />
                  </Box>
                </Box>
              </Box>
            </Box>

            {/* PAYMENT SECTION - EXACTLY SAME AS MAIN FORM */}
            <Box sx={{ bgcolor: '#fff', borderTop: '1px solid #e9ecef' }}>
              <Box sx={{ p: 3, width: '100%' }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: '#495057', textTransform: 'uppercase' }}>
                  RÈGLEMENTS
                </Typography>
                
                <TableContainer sx={{ border: '1px solid #e9ecef', width: '100%' }}>
                  <Table sx={{ width: '100%' }}>
                    <TableHead>
                      <TableRow sx={{ bgcolor: '#ffc107' }}>
                        <TableCell sx={{ fontWeight: 'bold', color: 'black', textTransform: 'uppercase', p: 3, fontSize: '1.2rem', minWidth: '250px' }}>
                          TYPE *
                        </TableCell>
                        <TableCell sx={{ fontWeight: 'bold', color: 'black', textTransform: 'uppercase', p: 3, fontSize: '1.2rem', minWidth: '250px' }}>
                          MONTANT *
                        </TableCell>
                        <TableCell sx={{ fontWeight: 'bold', color: 'black', textTransform: 'uppercase', p: 3, fontSize: '1.2rem', minWidth: '350px' }}>
                          N° CHÈQUE/COMPTE BANQUAIRE
                        </TableCell>
                        <TableCell sx={{ fontWeight: 'bold', color: 'black', textTransform: 'uppercase', p: 3, fontSize: '1.2rem', minWidth: '250px' }}>
                          DATE
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      <TableRow>
                        <TableCell sx={{ p: 3, minWidth: '250px' }}>
                          <FormControl fullWidth size="medium">
                            <Select
                              value={viewingPaymentSlip.payments?.[0]?.type || 'CHÈQUE'}
                              disabled
                              sx={{ bgcolor: 'white', height: '60px', fontSize: '1.1rem' }}
                            >
                              <MenuItem value="CHÈQUE">CHÈQUE</MenuItem>
                              <MenuItem value="ESPÈCES">ESPÈCES</MenuItem>
                              <MenuItem value="VIREMENT">VIREMENT</MenuItem>
                              <MenuItem value="CARTE">CARTE</MenuItem>
                            </Select>
                          </FormControl>
                        </TableCell>
                        <TableCell sx={{ p: 3, minWidth: '250px' }}>
                          <TextField
                            fullWidth
                            size="medium"
                            value={viewingPaymentSlip.payments?.[0]?.amount || ''}
                            disabled
                            sx={{ 
                              bgcolor: 'white',
                              '& .MuiInputBase-root': { height: '60px', fontSize: '1.1rem' }
                            }}
                          />
                        </TableCell>
                        <TableCell sx={{ p: 3, minWidth: '350px' }}>
                          <TextField
                            fullWidth
                            size="medium"
                            value={viewingPaymentSlip.payments?.[0]?.check_number || ''}
                            disabled
                            sx={{ 
                              bgcolor: 'white',
                              '& .MuiInputBase-root': { height: '60px', fontSize: '1.1rem' }
                            }}
                          />
                        </TableCell>
                        <TableCell sx={{ p: 3, minWidth: '250px' }}>
                          <TextField
                            fullWidth
                            size="medium"
                            value={
                              viewingPaymentSlip.payments?.[0]?.date 
                                ? new Date(viewingPaymentSlip.payments[0].date).toLocaleString('fr-FR')
                                : ''
                            }
                            disabled
                            sx={{ 
                              bgcolor: 'white',
                              '& .MuiInputBase-root': { height: '60px', fontSize: '1.1rem' }
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>

                {/* AJOUTER UNE RÉFÉRENCE Button - Disabled in view mode */}
                <Box sx={{ mt: 2, textAlign: 'center' }}>
                  <Button
                    variant="text"
                    disabled
                    sx={{ 
                      color: '#6c757d',
                      textTransform: 'uppercase',
                      fontSize: '0.875rem',
                      fontWeight: 600
                    }}
                  >
                    AJOUTER UNE RÉFÉRENCE
                    <KeyboardArrowDownIcon sx={{ ml: 1 }} />
                  </Button>
                </Box>
              </Box>
            </Box>
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setViewDialogOpen(false)}>Fermer</Button>
        <Button 
          variant="contained" 
          startIcon={<PrintIcon />}
        >
          Imprimer
        </Button>
      </DialogActions>
    </Dialog>

    {/* Delete Confirmation Dialog */}
    <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
      <DialogTitle>Confirmer la Suppression</DialogTitle>
      <DialogContent>
        <Typography>
          Êtes-vous sûr de vouloir supprimer le bon de règlement "{paymentSlipToDelete?.human_id}"?
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
