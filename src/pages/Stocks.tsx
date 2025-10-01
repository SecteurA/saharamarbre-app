import React, { useState, useEffect } from 'react'
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
  Pagination
} from '@mui/material'
import {
  Search as SearchIcon,
  Add as AddIcon,
  Print as PrintIcon,
  Upload as UploadIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ArrowUpward as ArrowUpIcon,
  ArrowDownward as ArrowDownIcon
} from '@mui/icons-material'
import {
  getStocks,
  getFilterOptions,
  createStock,
  updateStock,
  deleteStock,
  type Stock,
  type CreateStockData,

  type StockFilters,
  type FilterOptions,

  type PaginationInfo
} from '../services/stockServiceApi'

export const Stocks: React.FC = () => {
  const [stocks, setStocks] = useState<Stock[]>([])
  const [pagination, setPagination] = useState<PaginationInfo>({
    current_page: 1,
    per_page: 100,
    total: 0,
    last_page: 1,
    from: 0,
    to: 0,
    has_more_pages: false
  })
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    companies: [],
    types: [],
    products: [],
    states: []
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  // Filters
  const [filters, setFilters] = useState<StockFilters>({
    company: 'TOUT',
    type: 'TOUT',
    product: 'TOUT',
    state: 'TOUT',
    search: '',
    page: 1,
    limit: 100
  })
  
  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingStock, setEditingStock] = useState<Stock | null>(null)
  const [dialogLoading, setDialogLoading] = useState(false)
  
  // Sorting
  const [sortBy, setSortBy] = useState<'product' | 'quantity' | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  
  // Form data
  const [formData, setFormData] = useState<CreateStockData>({
    quantity: 0
  })

  // Load data on component mount
  useEffect(() => {
    loadInitialData()
  }, [])

  // Load and filter stocks when filters change
  useEffect(() => {
    loadStocks()
  }, [filters])

  const loadInitialData = async () => {
    try {
      setLoading(true)
      const [stocksResponse, filterOptionsData] = await Promise.all([
        getStocks({ page: 1, limit: 100 }),
        getFilterOptions()
      ])
      setStocks(stocksResponse.data)
      setPagination(stocksResponse.pagination)
      setFilterOptions(filterOptionsData)
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
      const apiFilters: StockFilters = {
        page: filters.page,
        limit: filters.limit
      }
      if (filters.company !== 'TOUT') apiFilters.company = filters.company
      if (filters.type !== 'TOUT') apiFilters.type = filters.type
      if (filters.product !== 'TOUT') apiFilters.product = filters.product
      if (filters.state !== 'TOUT') apiFilters.state = filters.state
      if (filters.search) apiFilters.search = filters.search

      const stocksResponse = await getStocks(apiFilters)
      
      // Ensure we have valid data
      if (stocksResponse && stocksResponse.data && Array.isArray(stocksResponse.data)) {
        setStocks(stocksResponse.data)
      } else {
        console.warn('Invalid stocks response:', stocksResponse)
        setStocks([])
      }
      
      if (stocksResponse && stocksResponse.pagination) {
        setPagination(stocksResponse.pagination)
      }
      
      setError(null)
    } catch (err) {
      console.error('Error loading stocks:', err)
      setError('Erreur lors du chargement des stocks')
    }
  }

  const resetFilters = () => {
    setFilters({
      company: 'TOUT',
      type: 'TOUT',
      product: 'TOUT',
      state: 'TOUT',
      search: '',
      page: 1,
      limit: 100
    })
  }

  const handleSort = (column: 'product' | 'quantity') => {
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
    if (formData.quantity < 0) {
      setError('La quantité ne peut pas être négative')
      return
    }

    try {
      setDialogLoading(true)
      
      if (editingStock) {
        await updateStock(editingStock.id, formData)
        setSuccess('Stock modifié avec succès')
      } else {
        await createStock(formData)
        setSuccess('Stock créé avec succès')
      }
      
      await loadInitialData()
      handleCloseDialog()
    } catch (err) {
      console.error('Error saving stock:', err)
      setError(editingStock ? 'Erreur lors de la modification' : 'Erreur lors de la création')
    } finally {
      setDialogLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce stock ?')) {
      return
    }

    try {
      await deleteStock(id)
      setSuccess('Stock supprimé avec succès')
      await loadInitialData()
    } catch (err) {
      console.error('Error deleting stock:', err)
      setError('Erreur lors de la suppression')
    }
  }

  const handleOpenDialog = (stock?: Stock) => {
    if (stock) {
      setEditingStock(stock)
      setFormData({
        company: stock.company || undefined,
        type: stock.type || undefined,
        product: stock.product || undefined,
        full_product_description: stock.full_product_description || undefined,
        state: stock.state || undefined,
        splicer: stock.splicer || undefined,
        width: stock.width || undefined,
        length: stock.length || undefined,
        quantity: stock.quantity,
        total_quantity: stock.total_quantity || undefined,
        unit: stock.unit || undefined
      })
    } else {
      setEditingStock(null)
      setFormData({
        quantity: 0
      })
    }
    setDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setDialogOpen(false)
    setEditingStock(null)
    setFormData({
      quantity: 0
    })
  }

  const handleInputChange = (field: keyof CreateStockData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Typography variant="h4" component="h1" sx={{ mb: 3, textAlign: 'center' }}>
        STOCK
      </Typography>

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
              value={filters.company}
              onChange={(e) => setFilters(prev => ({ ...prev, company: e.target.value }))}
              label="SOCIÉTÉ"
            >
              <MenuItem value="TOUT">TOUT</MenuItem>
              {filterOptions.companies.map(company => (
                <MenuItem key={company} value={company}>{company}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>TYPE</InputLabel>
            <Select
              value={filters.type}
              onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
              label="TYPE"
            >
              <MenuItem value="TOUT">TOUT</MenuItem>
              {filterOptions.types.map(type => (
                <MenuItem key={type} value={type}>{type}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>PRODUIT</InputLabel>
            <Select
              value={filters.product}
              onChange={(e) => setFilters(prev => ({ ...prev, product: e.target.value }))}
              label="PRODUIT"
            >
              <MenuItem value="TOUT">TOUT</MenuItem>
              {filterOptions.products.map(product => (
                <MenuItem key={product} value={product}>{product}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>ETAT</InputLabel>
            <Select
              value={filters.state}
              onChange={(e) => setFilters(prev => ({ ...prev, state: e.target.value }))}
              label="ETAT"
            >
              <MenuItem value="TOUT">TOUT</MenuItem>
              {filterOptions.states.map(state => (
                <MenuItem key={state} value={state}>{state}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

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
      </Paper>

      {/* Data Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>
                <Box
                  sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
                  onClick={() => handleSort('product')}
                >
                  PRODUIT
                  {sortBy === 'product' && (
                    sortDirection === 'asc' ? <ArrowUpIcon /> : <ArrowDownIcon />
                  )}
                </Box>
              </TableCell>
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
              <TableCell>MÉTRAGE</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : getSortedStocks().length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  Aucun stock trouvé
                </TableCell>
              </TableRow>
            ) : (
              getSortedStocks().map((stock: Stock) => (
                <TableRow key={stock.id}>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" fontWeight="medium">
                        {stock.product || 'N/A'}
                      </Typography>
                      {stock.full_product_description && (
                        <Typography variant="caption" color="text.secondary">
                          {stock.full_product_description}
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {stock.quantity} {stock.unit ? stock.unit : 'PIÈCES'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {stock.width && stock.length
                        ? `${(Number(stock.width) * Number(stock.length)).toFixed(2)}M2`
                        : stock.width || stock.length
                        ? `${stock.width || stock.length}M`
                        : 'N/A'}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      onClick={() => handleOpenDialog(stock)}
                      size="small"
                      color="primary"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      onClick={() => handleDelete(stock.id)}
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
      <Paper sx={{ p: 2, mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Affichage de {pagination.from} à {pagination.to} sur {pagination.total} résultats
        </Typography>
        
        <Pagination
          count={pagination.last_page}
          page={pagination.current_page}
          onChange={(_, newPage) => setFilters(prev => ({ ...prev, page: newPage }))}
          color="primary"
          showFirstButton
          showLastButton
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
              <InputLabel>Société</InputLabel>
              <Select
                value={formData.company || ''}
                onChange={(e) => handleInputChange('company', e.target.value || undefined)}
                label="Société"
              >
                {filterOptions.companies.map((company) => (
                  <MenuItem key={company} value={company}>
                    {company}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <FormControl fullWidth>
              <InputLabel>Type</InputLabel>
              <Select
                value={formData.type || ''}
                onChange={(e) => handleInputChange('type', e.target.value || undefined)}
                label="Type"
              >
                {filterOptions.types.map((type) => (
                  <MenuItem key={type} value={type}>
                    {type}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Produit</InputLabel>
              <Select
                value={formData.product || ''}
                onChange={(e) => handleInputChange('product', e.target.value || undefined)}
                label="Produit"
              >
                {filterOptions.products.map((product) => (
                  <MenuItem key={product} value={product}>
                    {product}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>État</InputLabel>
              <Select
                value={formData.state || ''}
                onChange={(e) => handleInputChange('state', e.target.value || undefined)}
                label="État"
              >
                {filterOptions.states.map((state) => (
                  <MenuItem key={state} value={state}>
                    {state}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Épaisseur (ép) (cm)"
              type="number"
              value={formData.splicer || ''}
              onChange={(e) => handleInputChange('splicer', e.target.value || undefined)}
              fullWidth
              placeholder="2"
              inputProps={{ step: "0.1" }}
            />

            <TextField
              label="Largeur (m)"
              type="number"
              value={formData.width || ''}
              onChange={(e) => handleInputChange('width', e.target.value ? Number(e.target.value) : undefined)}
              fullWidth
              inputProps={{ step: "0.01" }}
            />

            <TextField
              label="Longueur (m)"
              type="number"
              value={formData.length || ''}
              onChange={(e) => handleInputChange('length', e.target.value ? Number(e.target.value) : undefined)}
              fullWidth
              inputProps={{ step: "0.01" }}
            />

            <TextField
              label="Quantité"
              type="number"
              value={formData.quantity}
              onChange={(e) => handleInputChange('quantity', Number(e.target.value))}
              fullWidth
              required
              inputProps={{ step: "1", min: "1" }}
            />

            <TextField
              label="Unité"
              value={formData.unit || ''}
              onChange={(e) => handleInputChange('unit', e.target.value || undefined)}
              fullWidth
              placeholder="PIÈCES, M2, ML"
            />
          </Box>
          
          <TextField
            label="Description complète"
            value={formData.full_product_description || ''}
            onChange={(e) => handleInputChange('full_product_description', e.target.value || undefined)}
            fullWidth
            multiline
            rows={3}
            sx={{ mt: 2 }}
          />
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