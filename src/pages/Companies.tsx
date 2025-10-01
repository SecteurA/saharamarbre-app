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
} from '@mui/material';
import {
  Add as AddIcon,
  Business as BusinessIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { CompanyService, type Company, type CreateCompanyData } from '../services/companyServiceApi';

export default function Companies() {
  // State management
  const [companies, setCompanies] = useState<Company[]>([]);
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
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  
  // Form state matching Laravel exactly
  const [formData, setFormData] = useState<CreateCompanyData>({
    name: '',
    code: '',
    main_color: '#3b82f6',
    phone: '',
    fax: '',
    bin: '',
    patent: '',
    tax_id: '',
    crn: '',
    cnss: '',
    email: '',
    logo: '',
    address: '',
    website: '',
  });

  // Load companies
  const loadCompanies = async () => {
    try {
      setLoading(true);
      const result = await CompanyService.getAll(page + 1, limit, search);
      if (result.success) {
        setCompanies(result.data);
        setTotal(result.pagination.total);
        setError(null);
      } else {
        setError(result.error || 'Failed to load companies');
        setCompanies([]);
      }
    } catch (err) {
      setError('Failed to load companies');
      setCompanies([]);
    } finally {
      setLoading(false);
    }
  };

  // Effects
  useEffect(() => {
    loadCompanies();
  }, [page, limit, search]);

  // Handlers
  const handleCreate = () => {
    setDialogMode('create');
    setSelectedCompany(null);
    setFormData({
      name: '',
      code: '',
      main_color: '#3b82f6',
      phone: '',
      fax: '',
      bin: '',
      patent: '',
      tax_id: '',
      crn: '',
      cnss: '',
      email: '',
      logo: '',
      address: '',
      website: '',
    });
    setError(null);
    setDialogOpen(true);
  };

  const handleEdit = (company: Company) => {
    setDialogMode('edit');
    setSelectedCompany(company);
    setFormData({
      name: company.name,
      code: company.code,
      main_color: company.main_color,
      phone: company.phone,
      fax: company.fax || '',
      bin: company.bin || '',
      patent: company.patent || '',
      tax_id: company.tax_id || '',
      crn: company.crn || '',
      cnss: company.cnss || '',
      email: company.email,
      logo: company.logo || '',
      address: company.address || '',
      website: company.website || '',
    });
    setError(null);
    setDialogOpen(true);
  };

  const handleView = (company: Company) => {
    setDialogMode('view');
    setSelectedCompany(company);
    setFormData({
      name: company.name,
      code: company.code,
      main_color: company.main_color,
      phone: company.phone,
      fax: company.fax || '',
      bin: company.bin || '',
      patent: company.patent || '',
      tax_id: company.tax_id || '',
      crn: company.crn || '',
      cnss: company.cnss || '',
      email: company.email,
      logo: company.logo || '',
      address: company.address || '',
      website: company.website || '',
    });
    setError(null);
    setDialogOpen(true);
  };

  const handleDelete = async (company: Company) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer la société "${company.name}" ?`)) {
      try {
        const result = await CompanyService.delete(company.id);
        if (result.success) {
          setSuccess('Société supprimée avec succès');
          loadCompanies();
        } else {
          setError(result.error || 'Échec de la suppression de la société');
        }
      } catch (err) {
        setError('Erreur lors de la suppression de la société');
      }
    }
  };

  const handleSubmit = async () => {
    try {
      setError(null);
      
      if (dialogMode === 'create') {
        const result = await CompanyService.create(formData);
        if (result.success) {
          setSuccess('Société créée avec succès');
          loadCompanies();
          setDialogOpen(false);
        } else {
          setError(result.error || 'Échec de la création de la société');
        }
      } else if (dialogMode === 'edit' && selectedCompany) {
        const result = await CompanyService.update(selectedCompany.id, formData);
        if (result.success) {
          setSuccess('Société mise à jour avec succès');
          loadCompanies();
          setDialogOpen(false);
        } else {
          setError(result.error || 'Échec de la mise à jour de la société');
        }
      }
    } catch (err) {
      setError('Une erreur inattendue s\'est produite');
    }
  };

  const handleInputChange = (field: keyof CreateCompanyData) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({ ...prev, [field]: event.target.value }));
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <BusinessIcon sx={{ mr: 1, fontSize: 28 }} />
            <Typography variant="h4" component="h1">
              Gestion des Sociétés
            </Typography>
          </Box>
          <Typography variant="subtitle1" color="text.secondary">
            Gérez vos sociétés et partenaires commerciaux
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreate}
          size="large"
        >
          Ajouter Société
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
          placeholder="Rechercher par nom, téléphone ou email..."
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
                <TableCell>Nom de la Société</TableCell>
                <TableCell>Téléphone</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Code</TableCell>
                <TableCell>Créé le</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : companies.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    Aucune société trouvée
                  </TableCell>
                </TableRow>
              ) : (
                companies.map((company) => (
                  <TableRow key={company.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {company.name}
                      </Typography>
                    </TableCell>
                    <TableCell>{company.phone}</TableCell>
                    <TableCell>{company.email}</TableCell>
                    <TableCell>{company.code}</TableCell>
                    <TableCell>{formatDate(company.created_at)}</TableCell>
                    <TableCell align="center">
                      <Tooltip title="Voir">
                        <IconButton size="small" onClick={() => handleView(company)}>
                          <ViewIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Modifier">
                        <IconButton size="small" onClick={() => handleEdit(company)}>
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Supprimer">
                        <IconButton size="small" onClick={() => handleDelete(company)} color="error">
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
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {dialogMode === 'create' ? 'Ajouter une Société' : 
           dialogMode === 'edit' ? 'Modifier la Société' : 'Détails de la Société'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            {/* Name and Code */}
            <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', md: 'row' } }}>
              <TextField
                fullWidth
                label="Nom de la Société *"
                value={formData.name}
                onChange={handleInputChange('name')}
                disabled={dialogMode === 'view'}
                required
                inputProps={{ minLength: 4, maxLength: 200 }}
              />
              <TextField
                fullWidth
                label="Code *"
                value={formData.code}
                onChange={handleInputChange('code')}
                disabled={dialogMode === 'view'}
                required
              />
            </Box>

            {/* Phone and Fax */}
            <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', md: 'row' } }}>
              <TextField
                fullWidth
                label="Téléphone *"
                value={formData.phone}
                onChange={handleInputChange('phone')}
                disabled={dialogMode === 'view'}
                required
              />
              <TextField
                fullWidth
                label="Fax"
                value={formData.fax}
                onChange={handleInputChange('fax')}
                disabled={dialogMode === 'view'}
              />
            </Box>

            {/* Email and Website */}
            <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', md: 'row' } }}>
              <TextField
                fullWidth
                label="Email *"
                type="email"
                value={formData.email}
                onChange={handleInputChange('email')}
                disabled={dialogMode === 'view'}
                required
              />
              <TextField
                fullWidth
                label="Site Web"
                type="url"
                value={formData.website}
                onChange={handleInputChange('website')}
                disabled={dialogMode === 'view'}
                placeholder="https://example.com"
              />
            </Box>

            {/* BIN and Patent */}
            <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', md: 'row' } }}>
              <TextField
                fullWidth
                label="BIN (15 chiffres)"
                value={formData.bin}
                onChange={handleInputChange('bin')}
                disabled={dialogMode === 'view'}
                inputProps={{ pattern: '[0-9]{15}', maxLength: 15 }}
              />
              <TextField
                fullWidth
                label="Brevet (4-12 chiffres)"
                value={formData.patent}
                onChange={handleInputChange('patent')}
                disabled={dialogMode === 'view'}
                inputProps={{ pattern: '[0-9]{4,12}', minLength: 4, maxLength: 12 }}
              />
            </Box>

            {/* Tax ID and CRN */}
            <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', md: 'row' } }}>
              <TextField
                fullWidth
                label="ID Fiscale (4-12 chiffres)"
                value={formData.tax_id}
                onChange={handleInputChange('tax_id')}
                disabled={dialogMode === 'view'}
                inputProps={{ pattern: '[0-9]{4,12}', minLength: 4, maxLength: 12 }}
              />
              <TextField
                fullWidth
                label="CRN (4-12 chiffres)"
                value={formData.crn}
                onChange={handleInputChange('crn')}
                disabled={dialogMode === 'view'}
                inputProps={{ pattern: '[0-9]{4,12}', minLength: 4, maxLength: 12 }}
              />
            </Box>

            {/* CNSS and Main Color */}
            <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', md: 'row' } }}>
              <TextField
                fullWidth
                label="CNSS (3-12 chiffres)"
                value={formData.cnss}
                onChange={handleInputChange('cnss')}
                disabled={dialogMode === 'view'}
                inputProps={{ pattern: '[0-9]{3,12}', minLength: 3, maxLength: 12 }}
              />
              <TextField
                fullWidth
                label="Couleur Principale"
                type="color"
                value={formData.main_color}
                onChange={handleInputChange('main_color')}
                disabled={dialogMode === 'view'}
              />
            </Box>

            {/* Address */}
            <TextField
              fullWidth
              label="Adresse (10-255 caractères)"
              value={formData.address}
              onChange={handleInputChange('address')}
              disabled={dialogMode === 'view'}
              multiline
              rows={3}
              inputProps={{ minLength: 10, maxLength: 255 }}
            />
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