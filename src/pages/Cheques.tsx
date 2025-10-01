import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Card,
  CardContent,
  Pagination,
  InputAdornment,
  Alert,
  Snackbar,
  Chip,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';
import {
  Search as SearchIcon,
  TrendingUp as TrendingUpIcon,
  AttachMoney as AttachMoneyIcon,
  GetApp as GetAppIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import DataTable from '../components/ui/DataTable';
import { 
  chequeServiceApi, 
  CHEQUE_TYPES, 
  CHEQUE_STATUSES, 
  BANK_ACCOUNTS,
  type Cheque
} from '../services/chequeServiceApi';

interface Stats {
  total: number;
  totalAmount: number;
  avgAmount: number;
  today: number;
  thisWeek: number;
  thisMonth: number;
  thisYear: number;
  byStatus: {
    enCours: number;
    valide: number;
    paye: number;
    impaye: number;
  };
  byType: {
    cheques: number;
    traites: number;
  };
}

export default function Cheques() {
  const [cheques, setCheques] = useState<Cheque[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<Stats>({
    total: 0,
    totalAmount: 0,
    avgAmount: 0,
    today: 0,
    thisWeek: 0,
    thisMonth: 0,
    thisYear: 0,
    byStatus: {
      enCours: 0,
      valide: 0,
      paye: 0,
      impaye: 0
    },
    byType: {
      cheques: 0,
      traites: 0
    }
  });

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 20;

  // Search and filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  
  // Date filters
  const [echeanceFrom, setEcheanceFrom] = useState('');
  const [echeanceTo, setEcheanceTo] = useState('');
  const [operationFrom, setOperationFrom] = useState('');
  const [operationTo, setOperationTo] = useState('');
  const [creationFrom, setCreationFrom] = useState('');
  const [creationTo, setCreationTo] = useState('');

  // Dialog
  const [open, setOpen] = useState(false);
  const [viewMode, setViewMode] = useState(false);
  const [formData, setFormData] = useState<{
    check_number: string;
    type: string;
    amount: string;
    date: string;
    client: string;
    excution_date: string;
    bank_account: string;
    status: string;
    observations: string;
    user_id: string;
    order_id: string;
  }>({
    check_number: '',
    type: 'CHÈQUE',
    amount: '',
    date: '',
    client: '',
    excution_date: '',
    bank_account: '',
    status: 'En attente de validation',
    observations: '',
    user_id: '',
    order_id: '',
  });

  // Snackbar
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error'
  });

  // Load data on component mount and page changes
  useEffect(() => {
    loadCheques();
    loadStats();
  }, [page]);

  // Reset to first page when filters change
  useEffect(() => {
    if (page !== 1) {
      setPage(1);
    } else {
      loadCheques();
    }
  }, [statusFilter, typeFilter, echeanceFrom, echeanceTo, operationFrom, operationTo, creationFrom, creationTo]);

  // Search effect with debounce
  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (page !== 1) {
        setPage(1); // Reset to first page when searching
      } else {
        loadCheques();
      }
    }, 500);

    return () => clearTimeout(delayedSearch);
  }, [searchTerm]);

  const loadCheques = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const filters: any = { 
        page, 
        limit: itemsPerPage,
        search: searchTerm || undefined,
        status: statusFilter || undefined,
        type: typeFilter || undefined
      };

      // Add date filters
      if (echeanceFrom) filters.echeance_from = echeanceFrom;
      if (echeanceTo) filters.echeance_to = echeanceTo;
      if (operationFrom) filters.operation_from = operationFrom;
      if (operationTo) filters.operation_to = operationTo;
      if (creationFrom) filters.creation_from = creationFrom;
      if (creationTo) filters.creation_to = creationTo;

      const result = await chequeServiceApi.getAll(filters);
      setCheques(result.data);
      setTotalPages(result.pagination.totalPages);
      setTotalItems(result.pagination.totalItems);
    } catch (err) {
      console.error('Error loading cheques:', err);
      setError('Erreur lors du chargement des chèques');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const statsData = await chequeServiceApi.getStats();
      setStats(statsData);
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  };







  const handleView = (cheque: Cheque) => {
    setViewMode(true);
    setFormData({
      check_number: cheque.check_number,
      type: cheque.type,
      amount: cheque.amount.toString(),
      date: cheque.date ? new Date(cheque.date).toISOString().split('T')[0] : '',
      client: cheque.client,
      excution_date: cheque.excution_date ? new Date(cheque.excution_date).toISOString().split('T')[0] : '',
      bank_account: cheque.bank_account || '',
      status: cheque.status,
      observations: cheque.observations || '',
      user_id: cheque.user_id?.toString() || '',
      order_id: cheque.order_id?.toString() || '',
    });
    setOpen(true);
  };



  const handleExport = () => {
    chequeServiceApi.downloadCSV(cheques, 'cheques.csv');
    setSnackbar({
      open: true,
      message: 'Export terminé',
      severity: 'success'
    });
  };



  const columns = [
    {
      id: 'check_number',
      label: 'N° REF',
      format: (value: any) => (
        <Typography variant="body2" fontWeight="medium">
          {value}
        </Typography>
      )
    },
    {
      id: 'type',
      label: 'TYPE',
      format: (value: any) => (
        <Chip 
          label={value} 
          color={chequeServiceApi.getTypeColor(value)}
          size="small"
          variant="outlined"
        />
      )
    },
    {
      id: 'client',
      label: 'TITULAIRE',
      format: (value: any) => (
        <Typography variant="body2">
          {value}
        </Typography>
      )
    },
    {
      id: 'amount',
      label: 'MONTANT',
      format: (value: any) => (
        <Typography variant="body2" fontWeight="medium" color="primary">
          {chequeServiceApi.formatCurrency(value)}
        </Typography>
      )
    },
    {
      id: 'bank_account',
      label: 'BÉNÉFICIAIRE',
      format: (value: any) => (
        <Typography variant="body2">
          {value || 'N/A'}
        </Typography>
      )
    },
    {
      id: 'date',
      label: 'DATE D\'ÉCHÉANCE',
      format: (value: any) => (
        <Typography variant="body2">
          {chequeServiceApi.formatDate(value)}
        </Typography>
      )
    },
    {
      id: 'created_at',
      label: 'DATE DE CRÉATION',
      format: (value: any) => (
        <Typography variant="body2">
          {value ? 
            new Date(value).toLocaleDateString('fr-FR', {
              day: '2-digit',
              month: '2-digit', 
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            }) : 'N/A'
          }
        </Typography>
      )
    },
  ];

  if (loading && cheques.length === 0) {
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
          Chèques
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<GetAppIcon />}
            onClick={handleExport}
            disabled={cheques.length === 0}
          >
            Exporter
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
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <Card sx={{ minWidth: 200 }}>
          <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
            <AttachMoneyIcon sx={{ mr: 2, color: 'primary.main' }} />
            <Box>
              <Typography color="text.secondary" gutterBottom>
                Total Chèques
              </Typography>
              <Typography variant="h6">
                {stats.total}
              </Typography>
            </Box>
          </CardContent>
        </Card>
        <Card sx={{ minWidth: 200 }}>
          <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
            <TrendingUpIcon sx={{ mr: 2, color: 'success.main' }} />
            <Box>
              <Typography color="text.secondary" gutterBottom>
                Montant Total
              </Typography>
              <Typography variant="h6">
                {chequeServiceApi.formatCurrency(stats.totalAmount)}
              </Typography>
            </Box>
          </CardContent>
        </Card>
        <Card sx={{ minWidth: 200 }}>
          <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
            <CheckCircleIcon sx={{ mr: 2, color: 'success.main' }} />
            <Box>
              <Typography color="text.secondary" gutterBottom>
                Payés
              </Typography>
              <Typography variant="h6">
                {stats.byStatus.paye}
              </Typography>
            </Box>
          </CardContent>
        </Card>
        <Card sx={{ minWidth: 200 }}>
          <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
            <ErrorIcon sx={{ mr: 2, color: 'error.main' }} />
            <Box>
              <Typography color="text.secondary" gutterBottom>
                Impayés
              </Typography>
              <Typography variant="h6">
                {stats.byStatus.impaye}
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Comprehensive Filter Section */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" component="h2">
              Filtres
            </Typography>
            <Button
              variant="text"
              color="error"
              onClick={() => {
                setTypeFilter('');
                setStatusFilter('');
                setEcheanceFrom('');
                setEcheanceTo('');
                setOperationFrom('');
                setOperationTo('');
                setCreationFrom('');
                setCreationTo('');
                setSearchTerm('');
                setPage(1);
              }}
            >
              Réinitialiser les filtres
            </Button>
          </Box>
          
          {/* First row of filters */}
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2, mb: 2 }}>
            <FormControl fullWidth>
              <InputLabel>TYPE</InputLabel>
              <Select
                value={typeFilter}
                label="TYPE"
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <MenuItem value="">TOUT</MenuItem>
                {CHEQUE_TYPES.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <FormControl fullWidth>
              <InputLabel>STATUT</InputLabel>
              <Select
                value={statusFilter}
                label="STATUT"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="">TOUT</MenuItem>
                {CHEQUE_STATUSES.map((status) => (
                  <MenuItem key={status.value} value={status.value}>
                    {status.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <TextField
              label="ÉCHÉANCE DU"
              type="date"
              value={echeanceFrom}
              onChange={(e) => setEcheanceFrom(e.target.value)}
              InputLabelProps={{ shrink: true }}
              placeholder="JJ/MM/AAAA"
              fullWidth
            />
            
            <TextField
              label="AU"
              type="date"
              value={echeanceTo}
              onChange={(e) => setEcheanceTo(e.target.value)}
              InputLabelProps={{ shrink: true }}
              placeholder="JJ/MM/AAAA"
              fullWidth
            />
          </Box>
          
          {/* Second row of filters */}
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2, mb: 2 }}>
            <TextField
              label="OPÉRATION DU"
              type="date"
              value={operationFrom}
              onChange={(e) => setOperationFrom(e.target.value)}
              InputLabelProps={{ shrink: true }}
              placeholder="JJ/MM/AAAA"
              fullWidth
            />
            
            <TextField
              label="AU"
              type="date"
              value={operationTo}
              onChange={(e) => setOperationTo(e.target.value)}
              InputLabelProps={{ shrink: true }}
              placeholder="JJ/MM/AAAA"
              fullWidth
            />
            
            <TextField
              label="CRÉATION DU"
              type="date"
              value={creationFrom}
              onChange={(e) => setCreationFrom(e.target.value)}
              InputLabelProps={{ shrink: true }}
              placeholder="JJ/MM/AAAA"
              fullWidth
            />
            
            <TextField
              label="AU"
              type="date"
              value={creationTo}
              onChange={(e) => setCreationTo(e.target.value)}
              InputLabelProps={{ shrink: true }}
              placeholder="JJ/MM/AAAA"
              fullWidth
            />
          </Box>
        </CardContent>
      </Card>

      {/* Search Box */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'flex-end' }}>
        <TextField
          placeholder="RECHERCHER"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ minWidth: 300 }}
        />
      </Box>

      {/* Data Table */}
      <DataTable
        title={`Chèques (${totalItems})`}
        rows={cheques}
        columns={columns}
        loading={loading}
        onView={(id) => {
          const cheque = cheques.find(c => c.id === parseInt(id as string));
          if (cheque) handleView(cheque);
        }}
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_event, newPage) => setPage(newPage)}
            color="primary"
            variant="outlined"
            shape="rounded"
          />
        </Box>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={open} onClose={() => { setOpen(false); setViewMode(false); }} maxWidth="md" fullWidth>
        <DialogTitle>
          Voir le Chèque
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="N° Chèque"
                value={formData.check_number}
                onChange={(e) => setFormData(prev => ({ ...prev, check_number: e.target.value }))}
                fullWidth
                required
                disabled={viewMode}
              />
              <FormControl fullWidth required>
                <InputLabel>Type</InputLabel>
                <Select
                  value={formData.type}
                  label="Type"
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                  disabled={viewMode}
                >
                  {CHEQUE_TYPES.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Client/Titulaire"
                value={formData.client}
                onChange={(e) => setFormData(prev => ({ ...prev, client: e.target.value }))}
                fullWidth
                required
                disabled={viewMode}
              />
              <TextField
                label="Montant"
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                fullWidth
                required
                disabled={viewMode}
                InputProps={{ 
                  endAdornment: <InputAdornment position="end">MAD</InputAdornment>
                }}
              />
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Date d'échéance"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                fullWidth
                required
                disabled={viewMode}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label="Date d'exécution"
                type="date"
                value={formData.excution_date}
                onChange={(e) => setFormData(prev => ({ ...prev, excution_date: e.target.value }))}
                fullWidth
                disabled={viewMode}
                InputLabelProps={{ shrink: true }}
              />
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormControl fullWidth>
                <InputLabel>Bénéficiaire</InputLabel>
                <Select
                  value={formData.bank_account}
                  label="Bénéficiaire"
                  onChange={(e) => setFormData(prev => ({ ...prev, bank_account: e.target.value }))}
                  disabled={viewMode}
                >
                  {BANK_ACCOUNTS.map((category) => (
                    <React.Fragment key={category.category}>
                      <MenuItem disabled>
                        <Typography variant="subtitle2" color="primary">
                          {category.category}
                        </Typography>
                      </MenuItem>
                      {category.accounts.map((account) => (
                        <MenuItem key={account.value} value={account.value} sx={{ pl: 4 }}>
                          {account.label}
                        </MenuItem>
                      ))}
                    </React.Fragment>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth required>
                <InputLabel>Statut</InputLabel>
                <Select
                  value={formData.status}
                  label="Statut"
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                  disabled={viewMode}
                >
                  {CHEQUE_STATUSES.map((status) => (
                    <MenuItem key={status.value} value={status.value}>
                      {status.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            <TextField
              label="Observations"
              multiline
              rows={3}
              value={formData.observations}
              onChange={(e) => setFormData(prev => ({ ...prev, observations: e.target.value }))}
              fullWidth
              disabled={viewMode}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setOpen(false); setViewMode(false); }}>
            Fermer
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
  );
}