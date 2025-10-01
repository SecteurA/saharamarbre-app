import React, { useState, useEffect } from 'react';
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
  Stack
} from '@mui/material';
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
  TrendingUp as TrendingUpIcon,
  AttachMoney as AttachMoneyIcon
} from '@mui/icons-material';
import { expenseServiceApi, type Expense, type CreateExpenseData, type UpdateExpenseData } from '../services/expenseServiceApi';

interface Stats {
  total: number;
  totalAmount: number;
  avgAmount: number;
  today: number;
  thisWeek: number;
  thisMonth: number;
  thisYear: number;
}

export default function Expenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<Stats>({
    total: 0,
    totalAmount: 0,
    avgAmount: 0,
    today: 0,
    thisWeek: 0,
    thisMonth: 0,
    thisYear: 0
  });

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [limit, setLimit] = useState(20);

  // Search
  const [searchTerm, setSearchTerm] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // Dialog
  const [open, setOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [viewingExpense, setViewingExpense] = useState<Expense | null>(null);
  const [formData, setFormData] = useState<{
    name: string;
    amount: string;
    company_id: string;
    user_id: string;
  }>({
    name: '',
    amount: '',
    company_id: '',
    user_id: '',
  });

  // Companies and Users
  const [companies, setCompanies] = useState<Array<{id: number, name: string}>>([]);
  const [users, setUsers] = useState<Array<{id: number, name: string}>>([]);
  const [currentUser, setCurrentUser] = useState<{id: number, name: string} | null>(null);

  // Snackbar
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error'
  });

  // Load data on component mount and page changes
  useEffect(() => {
    loadExpenses();
    loadStats();
    fetchRelatedData();
  }, [page, limit]);

  // Search effect with debounce
  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (searchTerm !== '') {
        handleSearch();
      } else {
        loadExpenses();
      }
    }, 500);

    return () => clearTimeout(delayedSearch);
  }, [searchTerm]);

  const loadExpenses = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await expenseServiceApi.getAll({ 
        page, 
        limit 
      });
      setExpenses(result.data);
      setTotalPages(result.pagination.totalPages);
      setTotalItems(result.pagination.totalItems);
    } catch (err) {
      console.error('Error loading expenses:', err);
      setError('Erreur lors du chargement des dépenses');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const statsData = await expenseServiceApi.getStats();
      setStats(statsData);
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  };

  const fetchRelatedData = async () => {
    try {
      // Fetch companies from API
      const companyRes = await import('../services/companyServiceApi').then(m => m.CompanyService.getAll(1, 100, ''));
      if (companyRes && companyRes.data) {
        setCompanies(companyRes.data.map((c: any) => ({ id: c.id, name: c.name })));
      }
      // Set current user (in a real app, this would come from auth context)
      const mockCurrentUser = { id: 1, name: 'Utilisateur Actuel' };
      setCurrentUser(mockCurrentUser);
      setUsers([mockCurrentUser]); // In real app, fetch all users
    } catch (error) {
      console.error('Error fetching related data:', error);
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      loadExpenses();
      return;
    }

    try {
      setLoading(true);
      const result = await expenseServiceApi.search(searchTerm, { 
        page: 1, 
        limit 
      });
      setExpenses(result.data);
      setTotalPages(result.pagination.totalPages);
      setTotalItems(result.pagination.totalItems);
      setPage(1);
    } catch (err) {
      console.error('Error searching expenses:', err);
      setError('Erreur lors de la recherche');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingExpense(null);
    setFormData({
      name: '',
      amount: '',
      company_id: '',
      user_id: currentUser?.id.toString() || '', // Auto-assign current user
    });
    setOpen(true);
  };

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setFormData({
      name: expense.name,
      amount: expense.amount.toString(),
      company_id: expense.company_id?.toString() || '',
      user_id: expense.user_id?.toString() || currentUser?.id.toString() || '',
    });
    setOpen(true);
  };

  const handleView = (expense: Expense) => {
    setViewingExpense(expense);
    setViewDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      const data = {
        name: formData.name,
        amount: parseFloat(formData.amount),
        company_id: parseInt(formData.company_id),
        user_id: formData.user_id ? parseInt(formData.user_id) : currentUser?.id,
      };

      if (editingExpense) {
        await expenseServiceApi.update(editingExpense.id, data as UpdateExpenseData);
        setSnackbar({
          open: true,
          message: 'Dépense modifiée avec succès',
          severity: 'success'
        });
      } else {
        await expenseServiceApi.create(data as CreateExpenseData);
        setSnackbar({
          open: true,
          message: 'Dépense créée avec succès',
          severity: 'success'
        });
      }

      setOpen(false);
      loadExpenses();
      loadStats();
    } catch (err) {
      console.error('Error saving expense:', err);
      setSnackbar({
        open: true,
        message: 'Erreur lors de l\'enregistrement',
        severity: 'error'
      });
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette dépense ?')) {
      return;
    }

    try {
      await expenseServiceApi.delete(id);
      setSnackbar({
        open: true,
        message: 'Dépense supprimée avec succès',
        severity: 'success'
      });
      loadExpenses();
      loadStats();
    } catch (err) {
      console.error('Error deleting expense:', err);
      setSnackbar({
        open: true,
        message: 'Erreur lors de la suppression',
        severity: 'error'
      });
    }
  };

  const handleExport = () => {
    expenseServiceApi.downloadCSV(expenses, 'expenses.csv');
    setSnackbar({
      open: true,
      message: 'Export terminé',
      severity: 'success'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-MA', {
      style: 'currency',
      currency: 'MAD'
    }).format(amount)
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadExpenses()
    await loadStats()
    setRefreshing(false)
  }

  if (loading && expenses.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Dépenses
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<ExportIcon />}
            onClick={handleExport}
            disabled={expenses.length === 0}
          >
            Exporter
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAdd}
          >
            Ajouter Dépense
          </Button>
        </Box>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Statistics Cards */}
      <Box sx={{ display: 'flex', gap: 3, mb: 3, flexWrap: 'wrap' }}>
        <Box sx={{ minWidth: 200, flex: 1 }}>
          <Card>
            <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
              <AttachMoneyIcon sx={{ mr: 2, color: 'primary.main' }} />
              <Box>
                <Typography color="text.secondary" gutterBottom>
                  Total Dépenses
                </Typography>
                <Typography variant="h6">
                  {stats.total}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Box>
        <Box sx={{ minWidth: 200, flex: 1 }}>
          <Card>
            <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
              <TrendingUpIcon sx={{ mr: 2, color: 'success.main' }} />
              <Box>
                <Typography color="text.secondary" gutterBottom>
                  Montant Total
                </Typography>
                <Typography variant="h6">
                  {expenseServiceApi.formatCurrency(stats.totalAmount)}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Box>
        <Box sx={{ minWidth: 200, flex: 1 }}>
          <Card>
            <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
              <CalendarIcon sx={{ mr: 2, color: 'warning.main' }} />
              <Box>
                <Typography color="text.secondary" gutterBottom>
                  Aujourd'hui
                </Typography>
                <Typography variant="h6">
                  {stats.today}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Box>
        <Box sx={{ minWidth: 200, flex: 1 }}>
          <Card>
            <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
              <CalendarIcon sx={{ mr: 2, color: 'info.main' }} />
              <Box>
                <Typography color="text.secondary" gutterBottom>
                  Ce Mois
                </Typography>
                <Typography variant="h6">
                  {stats.thisMonth}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Search Bar */}
      <Box sx={{ mb: 3 }}>
        <TextField
          placeholder="Rechercher des dépenses..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ maxWidth: 400 }}
        />
      </Box>

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
                <TableCell>DESCRIPTION</TableCell>
                <TableCell align="right">MONTANT</TableCell>
                <TableCell>RESPONSABLE</TableCell>
                <TableCell>DATE DE CRÉATION</TableCell>
                <TableCell align="center">ACTIONS</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : expenses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                    <AttachMoneyIcon sx={{ fontSize: 64, color: 'text.disabled' }} />
                    <Typography variant="h6" color="text.secondary">
                      Aucune dépense trouvée
                    </Typography>
                    <Typography variant="body2" color="text.disabled">
                      {searchTerm ? 'Essayez de modifier vos critères de recherche' : 'Commencez par créer votre première dépense'}
                    </Typography>
                    {!searchTerm && (
                      <Button variant="contained" startIcon={<AddIcon />} onClick={handleAdd} sx={{ mt: 2 }}>
                        Créer une Dépense
                      </Button>
                    )}
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              expenses.map((expense, index) => (
                <TableRow 
                  key={expense.id} 
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
                        <Typography variant="body2" fontWeight="600" color="text.primary">
                          {expense.name}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 2 }}>
                    <Typography variant="body2" fontWeight="600" color="success.main">
                      {formatCurrency(expense.amount)}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ py: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PersonIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                      <Typography variant="body2">
                        {expense.user?.name || 'Non Assigné'}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ py: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CalendarIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                      <Typography variant="body2">
                        {new Date(expense.created_at).toLocaleDateString('fr-FR')}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="center" sx={{ py: 2 }}>
                    <Stack direction="row" spacing={1} justifyContent="center">
                      <Tooltip title="Voir la dépense">
                        <IconButton 
                          size="small" 
                          onClick={() => handleView(expense)}
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
                          onClick={() => handleEdit(expense)}
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
                      <Tooltip title="Supprimer">
                        <IconButton 
                          size="small" 
                          onClick={() => handleDelete(expense.id)}
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
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingExpense ? 'Modifier la Dépense' : 'Ajouter une Dépense'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="Nom"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              fullWidth
              required
            />
            <TextField
              label="Montant"
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
              fullWidth
              required
              InputProps={{ 
                endAdornment: <InputAdornment position="end">MAD</InputAdornment>
              }}
            />
            <FormControl fullWidth required>
              <InputLabel>Entreprise</InputLabel>
              <Select
                value={formData.company_id}
                label="Entreprise"
                onChange={(e) => setFormData(prev => ({ ...prev, company_id: e.target.value }))}
              >
                {companies.map((company) => (
                  <MenuItem key={company.id} value={company.id.toString()}>
                    {company.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Responsable"
              value={currentUser?.name || 'Non Assigné'}
              fullWidth
              disabled
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Annuler</Button>
          <Button 
            onClick={handleSave} 
            variant="contained"
            disabled={!formData.name || !formData.amount || !formData.company_id}
          >
            {editingExpense ? 'Modifier' : 'Ajouter'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Détails de la Dépense
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="Nom"
              value={viewingExpense?.name || ''}
              fullWidth
              disabled
            />
            <TextField
              label="Montant"
              type="number"
              value={viewingExpense?.amount || ''}
              fullWidth
              disabled
              InputProps={{ 
                endAdornment: <InputAdornment position="end">MAD</InputAdornment>
              }}
            />
            <FormControl fullWidth disabled>
              <InputLabel>Entreprise</InputLabel>
              <Select
                value={viewingExpense?.company_id?.toString() || ''}
                label="Entreprise"
              >
                {companies.map((company) => (
                  <MenuItem key={company.id} value={company.id.toString()}>
                    {company.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Responsable"
              value={viewingExpense?.user?.name || 'Non Assigné'}
              fullWidth
              disabled
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonIcon />
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              label="Date de création"
              value={viewingExpense?.created_at ? new Date(viewingExpense.created_at).toLocaleDateString('fr-FR') : ''}
              fullWidth
              disabled
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <CalendarIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>Fermer</Button>
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
  );
}