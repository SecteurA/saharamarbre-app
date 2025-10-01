import React, { useState, useEffect } from 'react'
import { getProductStates } from '../services/productServiceApi';
import { CompanyService } from '../services/companyServiceApi'
import {
  Box,
  Button,
  Typography,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Link,
  Pagination,
  Chip,
  Card,
  CardContent,
  Grid
} from '@mui/material'
import {
  Search as SearchIcon,
  Add as AddIcon,
  Print as PrintIcon,
  Upload as UploadIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ArrowUpward as ArrowUpIcon,
  ArrowDownward as ArrowDownIcon,
  Visibility as ViewIcon,
  Inventory as InventoryIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon
} from '@mui/icons-material'
import { companyStockService, type CompanyStock, type CompanyStockCreateData, type CompanyStockUpdateData } from '../services/companyStockServiceApi'
import { productService, type Product } from '../services/productServiceApi'
import { companiesService } from '../services/companiesServiceApi'

export const Stocks: React.FC = () => {
  // Current user's company (this should come from auth context)
  const [currentCompanyId] = useState<number>(1) // TODO: Get from auth context
  const [currentCompanyName, setCurrentCompanyName] = useState<string>('Planet Marbre')
  
  const [stocks, setStocks] = useState<CompanyStock[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [companies, setCompanies] = useState<Array<{ id: number; name: string }>>([])
  const [productTypes, setProductTypes] = useState<Array<{ value: string; label: string }>>([])
  const [productStates, setProductStates] = useState<string[]>(['Poli', 'Brut', 'Adouci']) // Dynamic états
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  // Pagination
  const [pagination, setPagination] = useState({
    current_page: 1,
    per_page: 100,
    total: 0,
    last_page: 1,
    from: 0,
    to: 0,
    has_more_pages: false
  })
  
  // Filters
  const [filters, setFilters] = useState({
    search: '',
    product_type: 'TOUT',
    company_id: undefined as number | undefined,
    page: 1,
    limit: 50
  })
  
  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [editingStock, setEditingStock] = useState<CompanyStock | null>(null)
  const [viewingStock, setViewingStock] = useState<CompanyStock | null>(null)
  const [dialogLoading, setDialogLoading] = useState(false)
  
  // Sorting
  const [sortBy, setSortBy] = useState<'product_name' | 'quantity' | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  
  // Form data
  const [formData, setFormData] = useState<CompanyStockCreateData>({
    company_id: currentCompanyId,
    product_id: 0,
    quantity: 0,
    unit_cost: undefined,
    selling_price: undefined,
    state: null,
    splicer: null,
    width: null,
    length: null,
    location: null,
    supplier: null
  })

  // Summary stats
  const [summary, setSummary] = useState({
    total_products: 0,
    total_quantity: 0,
    low_stock_products: 0,
    total_value: 0
  })

  // Load data on component mount
  useEffect(() => {
    loadInitialData()
  }, [])

  // Load stocks when filters change
  useEffect(() => {
    loadStocks()
    loadSummary()
  }, [filters])

  const loadInitialData = async () => {
    try {
      setLoading(true)

      
      // Load ALL data from database with higher limits
      const [productsData, companiesData, typesResponse] = await Promise.all([
        productService.getProducts({ limit: 10000 }).then(response => response.data), // Get ALL products
        CompanyService.getAll(), // This should get all companies
        companyStockService.getProductTypes()
      ])
      

      
      // Handle product types response
      const typesData = typesResponse.data || [
        { value: 'TOUT', label: 'TOUT' },
        { value: 'Marbre', label: 'Marbre' },
        { value: 'Service', label: 'Service' }
      ]
      
      // Load product states with fallback
      let statesData = []
      try {
        statesData = await getProductStates()

      } catch (err) {
        console.error('Product states error:', err)
        statesData = ['Poli', 'Brut', 'Adouci']
      }
      
      // Handle response EXACTLY like Orders page
      const finalProducts = Array.isArray(productsData) ? productsData : []
      setProducts(finalProducts)

      
      // Handle companies response properly (same as Orders)
      let finalCompanies = []
      if (Array.isArray(companiesData)) {
        finalCompanies = companiesData

      } else if (companiesData && companiesData.data) {
        finalCompanies = companiesData.data

      } else {
        finalCompanies = []
        console.warn('⚠️ No companies found in response')
      }
      
      setCompanies(finalCompanies)

      
      setProductTypes(Array.isArray(typesData) ? typesData : typesData.data || [])
      setProductStates(['Poli', 'Brut', 'Adouci', 'Flammé', 'Sablé'])
      
      // Get current company name from the processed array
      const currentCompany = finalCompanies.find(c => c.id === currentCompanyId)
      if (currentCompany) {
        setCurrentCompanyName(currentCompany.name)
      }
      
      // Debug logs

      
      await loadStocks()
      await loadSummary()
      setError(null)
    } catch (err) {
      console.error('Error loading data:', err)
      setError('Impossible de charger les données')
    } finally {
      setLoading(false)
    }
  }

  const loadStocks = async () => {
    try {
      const stocksResponse = await companyStockService.getCompanyStocks({
        company_id: filters.company_id || currentCompanyId,
        search: filters.search || undefined,
        product_type: filters.product_type !== 'TOUT' ? filters.product_type : undefined,
        page: filters.page,
        limit: filters.limit
      })
      
      if (stocksResponse.success) {
        setStocks(stocksResponse.data || [])
        setPagination(stocksResponse.pagination)
      } else {
        setStocks([])
      }
      
      setError(null)
    } catch (err) {
      console.error('Error loading stocks:', err)
      setError('Erreur lors du chargement des stocks')
      setStocks([])
    }
  }

  const loadSummary = async () => {
    try {
      const summaryResponse = await companyStockService.getCompanyStockSummary(filters.company_id)
      if (summaryResponse.success) {
        setSummary(summaryResponse.data)
      }
    } catch (err) {
      console.error('Error loading summary:', err)
    }
  }

  const resetFilters = () => {
    setFilters({
      search: '',
      product_type: 'TOUT',
      company_id: undefined,
      page: 1,
      limit: 50
    })
  }

  const handleSort = (column: 'product_name' | 'quantity') => {
    if (sortBy === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortDirection('asc')
    }
  }

  const getSortedStocks = () => {
    if (!stocks || !Array.isArray(stocks)) return []
    if (!sortBy) return stocks

    return [...stocks].sort((a, b) => {
      let aValue: any = a[sortBy]
      let bValue: any = b[sortBy]
      
      if (sortBy === 'quantity') {
        aValue = Number(aValue) || 0
        bValue = Number(bValue) || 0
      } else {
        aValue = aValue?.toString().toLowerCase() || ''
        bValue = bValue?.toString().toLowerCase() || ''
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
      return 0
    })
  }

  const handleSubmit = async () => {
    if (!formData.company_id) {
      setError('Veuillez sélectionner une société')
      return
    }

    if (!formData.product_id) {
      setError('Veuillez sélectionner un produit')
      return
    }

    if ((formData.quantity || 0) < 0) {
      setError('La quantité ne peut pas être négative')
      return
    }

    try {
      setDialogLoading(true)
      
      if (editingStock) {
        // Clean formData for update too
        const cleanFormData = {
          quantity: formData.quantity || 0,
          unit_cost: formData.unit_cost || null,
          selling_price: formData.selling_price || null,
          state: formData.state || null,
          splicer: formData.splicer || null,
          width: formData.width || null,
          length: formData.length || null,
          location: formData.location || null,
          supplier: formData.supplier || null
        }
        await companyStockService.updateCompanyStock(
          editingStock.stock_id,
          formData.company_id,
          cleanFormData as CompanyStockUpdateData
        )
        setSuccess('Stock modifié avec succès')
      } else {
        // Clean formData - convert undefined to null for nullable database fields
        const cleanFormData = {
          company_id: formData.company_id,
          product_id: formData.product_id,
          quantity: formData.quantity || 0,
          unit_cost: formData.unit_cost || null,
          selling_price: formData.selling_price || null,
          state: formData.state || null,
          splicer: formData.splicer || null,
          width: formData.width || null,
          length: formData.length || null,
          location: formData.location || null,
          supplier: formData.supplier || null
        }

        await companyStockService.createCompanyStock(cleanFormData)
        setSuccess('Stock créé avec succès')
      }
      
      await Promise.all([loadStocks(), loadSummary()])
      handleCloseDialog()
    } catch (err) {
      console.error('Error saving stock:', err)
      setError(editingStock ? 'Erreur lors de la modification' : 'Erreur lors de la création')
    } finally {
      setDialogLoading(false)
    }
  }

  const handleDelete = async (stock: CompanyStock) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce stock ?')) {
      return
    }

    try {
      await companyStockService.deleteCompanyStock(stock.stock_id, stock.company_id)
      setSuccess('Stock supprimé avec succès')
      await Promise.all([loadStocks(), loadSummary()])
    } catch (err) {
      console.error('Error deleting stock:', err)
      setError('Erreur lors de la suppression')
    }
  }

  const handleOpenDialog = (stock?: CompanyStock) => {
    if (stock) {
      setEditingStock(stock)
      setFormData({
        company_id: stock.company_id,
        product_id: stock.product_id,
        quantity: stock.quantity,
        state: stock.state,
        splicer: stock.splicer,
        width: stock.width,
        length: stock.length
      })
    } else {
      setEditingStock(null)
      setFormData({
        company_id: filters.company_id || currentCompanyId,
        product_id: 0,
        quantity: 0
      })
    }
    setDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setDialogOpen(false)
    setEditingStock(null)
    setFormData({
      company_id: filters.company_id || currentCompanyId,
      product_id: 0,
      quantity: 0,
      unit_cost: undefined,
      selling_price: undefined,
      state: null,
      splicer: null,
      width: null,
      length: null,
      location: null,
      supplier: null
    })
  }

  const handleViewStock = (stock: CompanyStock) => {
    setViewingStock(stock)
    setViewDialogOpen(true)
  }

  const handleInputChange = (field: keyof CompanyStockCreateData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Typography variant="h4" component="h1" sx={{ mb: 1, textAlign: 'center' }}>
        STOCK
      </Typography>
      <Typography variant="subtitle1" sx={{ mb: 3, textAlign: 'center', color: 'text.secondary' }}>
        Gestion d'inventaire multi-entreprises
      </Typography>

      {/* Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
              <InventoryIcon sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
              <Box>
                <Typography variant="h6">{summary.total_products}</Typography>
                <Typography variant="body2" color="text.secondary">Produits en stock</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
              <TrendingUpIcon sx={{ fontSize: 40, color: 'success.main', mr: 2 }} />
              <Box>
                <Typography variant="h6">
                  {summary.total_quantity.toLocaleString('fr-FR', { 
                    minimumFractionDigits: 0, 
                    maximumFractionDigits: 2 
                  })}
                </Typography>
                <Typography variant="body2" color="text.secondary">Quantité totale</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
              <WarningIcon sx={{ fontSize: 40, color: 'warning.main', mr: 2 }} />
              <Box>
                <Typography variant="h6">{summary.low_stock_products}</Typography>
                <Typography variant="body2" color="text.secondary">Stock faible</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography variant="h4" sx={{ color: 'success.main', mr: 1 }}>€</Typography>
              <Box>
                <Typography variant="h6">
                  {summary.total_value.toLocaleString('fr-FR', { 
                    minimumFractionDigits: 2, 
                    maximumFractionDigits: 2 
                  })}
                </Typography>
                <Typography variant="body2" color="text.secondary">Valeur totale</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Action Buttons */}
      <Box sx={{ mb: 3, display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          onClick={() => handleOpenDialog()}
          sx={{
            backgroundColor: '#d32f2f',
            '&:hover': { backgroundColor: '#b71c1c' },
            fontWeight: 'bold'
          }}
          startIcon={<AddIcon />}
        >
          CRÉER
        </Button>
        <Button
          variant="contained"
          sx={{
            backgroundColor: '#d32f2f',
            '&:hover': { backgroundColor: '#b71c1c' },
            fontWeight: 'bold'
          }}
          startIcon={<PrintIcon />}
        >
          IMPRIMER
        </Button>
        <Button
          variant="contained"
          sx={{
            backgroundColor: '#d32f2f',
            '&:hover': { backgroundColor: '#b71c1c' },
            fontWeight: 'bold'
          }}
          startIcon={<UploadIcon />}
        >
          IMPORTER
        </Button>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Filtres
          <Link
            component="button"
            variant="body2"
            onClick={resetFilters}
            sx={{ ml: 'auto', float: 'right' }}
          >
            Réinitialiser les filtres
          </Link>
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>SOCIÉTÉ</InputLabel>
            <Select
              value={filters.company_id || 'TOUT'}
              onChange={(e) => {
                const value = e.target.value === 'TOUT' ? undefined : Number(e.target.value);
                setFilters(prev => ({ ...prev, company_id: value, page: 1 }));
              }}
              label="SOCIÉTÉ"
            >
              <MenuItem value="TOUT">TOUTES LES SOCIÉTÉS</MenuItem>
              {companies.map(company => (
                <MenuItem key={company.id} value={company.id}>{company.name}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>TYPE DE PRODUIT</InputLabel>
            <Select
              value={filters.product_type}
              onChange={(e) => setFilters(prev => ({ ...prev, product_type: e.target.value }))}
              label="TYPE DE PRODUIT"
            >
              {productTypes.map(type => (
                <MenuItem key={type.value} value={type.value}>{type.label}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            placeholder="RECHERCHER"
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ width: 300 }}
          />
        </Box>
      </Paper>

      {/* Data Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>SOCIÉTÉ</TableCell>
              <TableCell>
                <Box
                  sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
                  onClick={() => handleSort('product_name')}
                >
                  PRODUIT
                  {sortBy === 'product_name' && (
                    sortDirection === 'asc' ? <ArrowUpIcon /> : <ArrowDownIcon />
                  )}
                </Box>
              </TableCell>
              <TableCell>TYPE</TableCell>
              <TableCell>
                <Box
                  sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
                  onClick={() => handleSort('quantity')}
                >
                  QUANTITÉ
                  {sortBy === 'quantity' && (
                    sortDirection === 'asc' ? <ArrowUpIcon /> : <ArrowDownIcon />
                  )}
                </Box>
              </TableCell>
              <TableCell>ÉTAT</TableCell>
              <TableCell>DIMENSIONS</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : getSortedStocks().length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Box sx={{ py: 4 }}>
                    <InventoryIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary">
                      Aucun stock trouvé
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Commencez par ajouter des produits à votre inventaire
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              getSortedStocks().map((stock: CompanyStock) => (
                <TableRow key={stock.stock_id}>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium" color="primary.main">
                      {stock.company_name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" fontWeight="medium">
                        {stock.product_name}
                      </Typography>
                      {stock.product_description && (
                        <Typography variant="caption" color="text.secondary">
                          {stock.product_description}
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={stock.product_type}
                      size="small"
                      color={stock.product_type === 'Marbre' ? 'primary' : 'secondary'}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography 
                      variant="body2"
                      color={stock.quantity < 10 ? 'error' : 'text.primary'}
                      fontWeight={stock.quantity < 10 ? 'bold' : 'normal'}
                    >
                      {stock.quantity} {stock.product_unit || 'PIÈCES'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {stock.state && (
                      <Chip label={stock.state} size="small" variant="outlined" />
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {stock.width && stock.length
                        ? `${(Number(stock.width) * Number(stock.length)).toFixed(2)}M²`
                        : stock.width || stock.length
                        ? `${stock.width || stock.length}M`
                        : 'N/A'}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      onClick={() => handleViewStock(stock)}
                      size="small"
                      color="info"
                    >
                      <ViewIcon />
                    </IconButton>
                    <IconButton
                      onClick={() => handleOpenDialog(stock)}
                      size="small"
                      color="primary"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      onClick={() => handleDelete(stock)}
                      size="small"
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination Controls */}
      <Paper sx={{ p: 2, mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Affichage de {pagination.from} à {pagination.to} sur {pagination.total} résultats
          </Typography>
          
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Lignes par page</InputLabel>
            <Select
              value={filters.limit}
              onChange={(e) => setFilters(prev => ({ ...prev, limit: Number(e.target.value), page: 1 }))}
              label="Lignes par page"
            >
              <MenuItem value={25}>25</MenuItem>
              <MenuItem value={50}>50</MenuItem>
              <MenuItem value={100}>100</MenuItem>
              <MenuItem value={200}>200</MenuItem>
            </Select>
          </FormControl>
        </Box>
        
        <Pagination
          count={pagination.last_page}
          page={pagination.current_page}
          onChange={(_, newPage) => setFilters(prev => ({ ...prev, page: newPage }))}
          color="primary"
          showFirstButton
          showLastButton
          size="medium"
        />
      </Paper>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingStock ? 'Modifier le Stock' : 'Nouveau Stock'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Société *</InputLabel>
              <Select
                value={formData.company_id || ''}
                onChange={(e) => handleInputChange('company_id', Number(e.target.value))}
                label="Société *"
                required
              >
                {companies.map((company) => (
                  <MenuItem key={company.id} value={company.id}>
                    {company.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Produit *</InputLabel>
              <Select
                value={formData.product_id || ''}
                onChange={(e) => handleInputChange('product_id', Number(e.target.value))}
                label="Produit *"
                required
              >
                {products.map((product) => (
                  <MenuItem key={product.id} value={product.id}>
                    {product.name} ({product.type})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <TextField
              label="Quantité *"
              type="number"
              value={formData.quantity}
              onChange={(e) => handleInputChange('quantity', Number(e.target.value))}
              fullWidth
              required
              inputProps={{ step: "0.01", min: "0" }}
            />

            <FormControl fullWidth>
              <InputLabel>État</InputLabel>
              <Select
                value={formData.state || ''}
                onChange={(e) => handleInputChange('state', e.target.value || undefined)}
                label="État"
              >
                <MenuItem value="">
                  <em>Sélectionner un état</em>
                </MenuItem>
                {productStates.map((state) => (
                  <MenuItem key={state} value={state}>
                    {state}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Épaisseur (cm)"
              value={formData.splicer || ''}
              onChange={(e) => handleInputChange('splicer', e.target.value || undefined)}
              fullWidth
              placeholder="2, 3, etc."
            />

            <TextField
              label="Largeur (m)"
              type="number"
              value={formData.width || ''}
              onChange={(e) => handleInputChange('width', e.target.value ? Number(e.target.value) : undefined)}
              fullWidth
              inputProps={{ step: "0.01", min: "0" }}
            />

            <TextField
              label="Longueur (m)"
              type="number"
              value={formData.length || ''}
              onChange={(e) => handleInputChange('length', e.target.value ? Number(e.target.value) : undefined)}
              fullWidth
              inputProps={{ step: "0.01", min: "0" }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Annuler</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained"
            disabled={dialogLoading}
            sx={{
              backgroundColor: '#d32f2f',
              '&:hover': { backgroundColor: '#b71c1c' }
            }}
          >
            {dialogLoading ? 'Enregistrement...' : editingStock ? 'Modifier' : 'Créer'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Détails du Stock</DialogTitle>
        <DialogContent>
          {viewingStock && (
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">Produit:</Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>{viewingStock.product_name}</Typography>
                  
                  <Typography variant="subtitle2" color="text.secondary">Type:</Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>{viewingStock.product_type}</Typography>
                  
                  <Typography variant="subtitle2" color="text.secondary">Quantité:</Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {viewingStock.quantity} {viewingStock.product_unit || 'PIÈCES'}
                  </Typography>
                  
                  <Typography variant="subtitle2" color="text.secondary">État:</Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>{viewingStock.state || 'Non spécifié'}</Typography>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">Dimensions:</Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {viewingStock.width && viewingStock.length
                      ? `${viewingStock.width}m × ${viewingStock.length}m (${(Number(viewingStock.width) * Number(viewingStock.length)).toFixed(2)}M²)`
                      : 'Non spécifiées'}
                  </Typography>
                  
                  <Typography variant="subtitle2" color="text.secondary">Épaisseur:</Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>{viewingStock.splicer || 'Non spécifiée'}</Typography>
                </Grid>
                

              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>Fermer</Button>
        </DialogActions>
      </Dialog>

      {/* Success Snackbar */}
      <Snackbar
        open={!!success}
        autoHideDuration={6000}
        onClose={() => setSuccess(null)}
      >
        <Alert onClose={() => setSuccess(null)} severity="success">
          {success}
        </Alert>
      </Snackbar>

      {/* Error Snackbar */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
      >
        <Alert onClose={() => setError(null)} severity="error">
          {error}
        </Alert>
      </Snackbar>
    </Box>
  )
}

export default Stocks