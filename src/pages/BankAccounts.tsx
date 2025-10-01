import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  TextField,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  IconButton,
  Tooltip,
  CircularProgress,
  InputAdornment,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
} from '@mui/material';
import {
  Add as AddIcon,
  AccountBalance as BankIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { BankAccountService, type BankAccount, type CreateBankAccountData, type AccountType } from '../services/bankAccountServiceApi';

export default function BankAccounts() {
  // State management
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [accountTypes, setAccountTypes] = useState<AccountType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Pagination
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  
  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit' | 'view'>('create');
  const [selectedAccount, setSelectedAccount] = useState<BankAccount | null>(null);
  
  // Form state matching Laravel exactly
  const [formData, setFormData] = useState<CreateBankAccountData>({
    name: '',
    rib: '',
    type: '',
  });

  // Load bank accounts
  const loadAccounts = async () => {
    try {
      setLoading(true);
      const result = await BankAccountService.getAll(page + 1, limit, search);
      if (result.success) {
        setAccounts(result.data);
        setTotal(result.pagination.total);
        setError(null);
      } else {
        setError(result.error || 'Failed to load bank accounts');
        setAccounts([]);
      }
    } catch (err) {
      setError('Failed to load bank accounts');
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  };

  // Load account types
  const loadAccountTypes = async () => {
    try {
      const result = await BankAccountService.getTypes();
      if (result.success) {
        setAccountTypes(result.data);
      }
    } catch (err) {
      console.error('Failed to load account types:', err);
    }
  };

  // Effects
  useEffect(() => {
    loadAccounts();
  }, [page, limit, search]);

  useEffect(() => {
    loadAccountTypes();
  }, []);

  // Handlers
  const handleCreate = () => {
    setDialogMode('create');
    setSelectedAccount(null);
    setFormData({
      name: '',
      rib: '',
      type: '',
    });
    setError(null);
    setDialogOpen(true);
  };

  const handleEdit = (account: BankAccount) => {
    setDialogMode('edit');
    setSelectedAccount(account);
    setFormData({
      name: account.name,
      rib: account.rib,
      type: account.type,
    });
    setError(null);
    setDialogOpen(true);
  };

  const handleView = (account: BankAccount) => {
    setDialogMode('view');
    setSelectedAccount(account);
    setFormData({
      name: account.name,
      rib: account.rib,
      type: account.type,
    });
    setError(null);
    setDialogOpen(true);
  };

  const handleDelete = async (account: BankAccount) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer le compte "${account.name}" ?`)) {
      try {
        const result = await BankAccountService.delete(account.id);
        if (result.success) {
          setSuccess('Compte bancaire supprimé avec succès');
          loadAccounts();
        } else {
          setError(result.error || 'Échec de la suppression du compte bancaire');
        }
      } catch (err) {
        setError('Erreur lors de la suppression du compte bancaire');
      }
    }
  };

  const handleSubmit = async () => {
    try {
      setError(null);
      
      if (dialogMode === 'create') {
        const result = await BankAccountService.create(formData);
        if (result.success) {
          setSuccess('Compte bancaire créé avec succès');
          loadAccounts();
          setDialogOpen(false);
        } else {
          setError(result.error || 'Échec de la création du compte bancaire');
        }
      } else if (dialogMode === 'edit' && selectedAccount) {
        const result = await BankAccountService.update(selectedAccount.id, formData);
        if (result.success) {
          setSuccess('Compte bancaire mis à jour avec succès');
          loadAccounts();
          setDialogOpen(false);
        } else {
          setError(result.error || 'Échec de la mise à jour du compte bancaire');
        }
      }
    } catch (err) {
      setError('Une erreur inattendue s\'est produite');
    }
  };

  const handleInputChange = (field: keyof CreateBankAccountData) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | { value: unknown }>
  ) => {
    const value = typeof event.target.value === 'string' ? event.target.value : event.target.value as string;
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(event.target.value);
    setPage(0); // Reset to first page on search
  };

  const handlePageChange = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleLimitChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setLimit(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Format RIB for display (with spaces)
  const formatRib = (rib: string) => {
    // Remove any existing spaces and format
    const cleanRib = rib.replace(/\s/g, '');
    return cleanRib.replace(/(\d{3})(\d{3})(\d{2})(\d{14})(\d{2})/, '$1 $2 $3 $4 $5');
  };

  // Handle RIB input formatting
  const handleRibChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    let value = event.target.value;
    // Remove any non-digit characters except spaces
    value = value.replace(/[^\d\s]/g, '');
    // Apply mask format: XXX XXX XX XXXXXXXXXXXXXX XX
    if (value.length <= 30) {
      setFormData(prev => ({ ...prev, rib: value }));
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <BankIcon sx={{ mr: 1, fontSize: 28 }} />
            <Typography variant="h4" component="h1">
              Gestion des Comptes Bancaires
            </Typography>
          </Box>
          <Typography variant="subtitle1" color="text.secondary">
            Gérez vos comptes bancaires professionnels et personnels
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreate}
          size="large"
        >
          Ajouter Compte
        </Button>
      </Box>

      {/* Alerts */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* Search */}
      <Box sx={{ mb: 2 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Rechercher par nom, RIB ou type..."
          value={search}
          onChange={handleSearchChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {/* Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Nom du Compte</TableCell>
                <TableCell>RIB</TableCell>
                <TableCell>Type de Compte</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : accounts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                    Aucun compte bancaire trouvé
                  </TableCell>
                </TableRow>
              ) : (
                accounts.map((account) => (
                  <TableRow key={account.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {account.name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontFamily="monospace">
                        {formatRib(account.rib)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {account.type}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Voir">
                        <IconButton size="small" onClick={() => handleView(account)}>
                          <ViewIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Modifier">
                        <IconButton size="small" onClick={() => handleEdit(account)}>
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Supprimer">
                        <IconButton size="small" onClick={() => handleDelete(account)} color="error">
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={total}
          page={page}
          onPageChange={handlePageChange}
          rowsPerPage={limit}
          onRowsPerPageChange={handleLimitChange}
          rowsPerPageOptions={[10, 20, 50]}
          labelDisplayedRows={({ from, to, count }) =>
            `${from}-${to} sur ${count !== -1 ? count : `plus de ${to}`}`
          }
          labelRowsPerPage="Lignes par page:"
        />
      </Paper>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {dialogMode === 'create' ? 'Ajouter un Compte Bancaire' : 
           dialogMode === 'edit' ? 'Modifier le Compte Bancaire' : 'Détails du Compte Bancaire'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            {/* Name */}
            <TextField
              fullWidth
              label="Nom du Compte *"
              value={formData.name}
              onChange={handleInputChange('name')}
              disabled={dialogMode === 'view'}
              required
              inputProps={{ minLength: 4, maxLength: 200 }}
              helperText="Entre 4 et 200 caractères"
            />

            {/* RIB */}
            <TextField
              fullWidth
              label="RIB *"
              value={formData.rib}
              onChange={handleRibChange}
              disabled={dialogMode === 'view'}
              required
              inputProps={{ minLength: 25, maxLength: 30 }}
              helperText="Format: XXX XXX XX XXXXXXXXXXXXXX XX (25-30 caractères, chiffres et espaces uniquement)"
              placeholder="123 456 78 12345678901234 56"
            />

            {/* Type */}
            <FormControl fullWidth required>
              <InputLabel>Type de Compte *</InputLabel>
              <Select
                value={formData.type}
                onChange={(e) => handleInputChange('type')(e as any)}
                disabled={dialogMode === 'view'}
                label="Type de Compte *"
              >
                {accountTypes.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.label}
                  </MenuItem>
                ))}
              </Select>
              <FormHelperText>
                Sélectionnez le type de compte bancaire
              </FormHelperText>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>
            {dialogMode === 'view' ? 'Fermer' : 'Annuler'}
          </Button>
          {dialogMode !== 'view' && (
            <Button onClick={handleSubmit} variant="contained">
              {dialogMode === 'create' ? 'Créer' : 'Mettre à jour'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
}