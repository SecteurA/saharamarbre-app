import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  CircularProgress,
  Alert,
  Pagination,
  InputAdornment,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';

import * as clientService from '../services/clientServiceApi';
import { testApiConnection } from '../services/clientServiceApi';
import type { Client, CreateClientData, ClientsResponse } from '../services/clientServiceApi';
import { clientValidationSchema, validateForm } from '../utils/validation';
import { downloadClientsReport } from '../components/pdf/ClientReportPDF';

const Clients: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [open, setOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  
    // Pagination state
  const [page, setPage] = useState(1);
  const [limit] = useState(50); // Standard pagination limit
  const [search, setSearch] = useState('');
  const [totalClients, setTotalClients] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [formData, setFormData] = useState<CreateClientData>({
    name: '',
    nom: '', // Laravel uses 'nom' field
    phone: '',
    email: '',
    address: '',
    city: '',
    company: '',
    bin: '',
    patent: '',
  });

  const loadClients = async (currentPage = page, searchTerm = search) => {
    try {
      setLoading(true);
      console.log('🔄 Loading clients:', { currentPage, limit, searchTerm });
      
      // Test API connection first
      console.log('Testing API connection before loading clients...');
      const apiConnected = await testApiConnection();
      console.log('API connection test result:', apiConnected);
      
      if (!apiConnected) {
        throw new Error('Cannot connect to API server. Please check if the server is running on http://localhost:3001');
      }
      
      const response = await clientService.getClients(currentPage, limit, searchTerm);
      console.log('Full API response:', response);
      
      setClients(response.clients);
      setTotalClients(response.pagination.total);
      setTotalPages(response.pagination.pages);
      
      console.log(`📊 Pagination Info:`, {
        loadedClients: response.clients.length,
        currentPage,
        limit,
        totalClients: response.pagination.total,
        totalPages: response.pagination.pages,
        searchTerm
      });
      
      setError(null);
    } catch (err: any) {
      console.error('Load clients error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Load clients immediately when page changes, with debounce for search
  useEffect(() => {
    const timer = setTimeout(() => {
      loadClients(page, search);
    }, search ? 300 : 0); // Debounce only when there's a search term

    return () => clearTimeout(timer);
  }, [page, search]);

  // Reset to page 1 when search changes (except on initial load)
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  useEffect(() => {
    if (isInitialLoad) {
      setIsInitialLoad(false);
      return;
    }
    if (page !== 1) {
      setPage(1);
    }
  }, [search]);

  const handleClose = () => {
    setOpen(false);
    setEditingClient(null);
    setValidationErrors({});
    setFormData({
      name: '',
      nom: '', // Laravel uses 'nom' field
      phone: '',
      email: '',
      address: '',
      city: '',
      company: '',
      bin: '',
      patent: '',
    });
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setFormData({
      name: client.name,
      nom: client.nom || client.name, // Use nom or fallback to name
      phone: client.phone || '',
      email: client.email || '',
      address: client.address || '',
      city: client.city || '',
      company: client.company || '',
      bin: client.bin || '',
      patent: client.patent || '',
    });
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this client?')) {
      try {
        await clientService.deleteClient(Number(id));
        await loadClients();
      } catch (err: any) {
        setError(err.message);
      }
    }
  };

  const handleSubmit = async () => {
    try {
      // Validate form data
      const errors = await validateForm(clientValidationSchema, formData);
      if (Object.keys(errors).length > 0) {
        setValidationErrors(errors);
        return;
      }
      
      setValidationErrors({});
      
      if (editingClient) {
        await clientService.updateClient(editingClient.id, formData);
      } else {
        await clientService.createClient(formData);
      }
      await loadClients();
      handleClose();
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h4" component="h1">
              Gestion des Clients
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="outlined"
                onClick={() => downloadClientsReport(
                  clients.map(c => ({
                    id: c.id.toString(),
                    name: c.name,
                    phone: c.phone || undefined,
                    company: c.company || '',
                    bin: c.bin || '',
                    patent: c.patent || '',
                    status: 'Active', // Default status since it's not in database
                    created_at: c.created_at || ''
                  })), 
                  'Rapport des Clients'
                )}
                disabled={clients.length === 0}
              >
                Exporter PDF
              </Button>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setOpen(true)}
              >
                Ajouter un Client
              </Button>
            </Box>
          </Box>

          {/* Search Field */}
          <Box sx={{ mb: 3 }}>
            <TextField
              fullWidth
              placeholder="Rechercher un client (nom, téléphone, société...)..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
                endAdornment: search ? (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={() => setSearch('')}
                      title="Effacer la recherche"
                    >
                      <ClearIcon />
                    </IconButton>
                  </InputAdornment>
                ) : null,
              }}
              sx={{ maxWidth: 600 }}
            />
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Nom</TableCell>
                  <TableCell>Téléphone</TableCell>
                  <TableCell>Entreprise</TableCell>
                  <TableCell>BIN</TableCell>
                  <TableCell>Date création</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {clients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell>{client.name}</TableCell>
                    <TableCell>{client.phone || '-'}</TableCell>
                    <TableCell>{client.company || '-'}</TableCell>
                    <TableCell>{client.bin || '-'}</TableCell>
                    <TableCell>{new Date(client.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => handleEdit(client)}
                        color="primary"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(client.id.toString())}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {clients.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      No clients found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination */}
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={(_, newPage) => setPage(newPage)}
                color="primary"
                showFirstButton
                showLastButton
              />
            </Box>
          )}

          {/* Statistics */}
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Affichage de {clients.length} clients sur {totalClients} au total
              {search && ` (filtré par "${search}")`}
            </Typography>
          </Box>
        </CardContent>
      </Card>

      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingClient ? 'Modifier le Client' : 'Ajouter un Nouveau Client'}
        </DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Nom *"
              value={formData.name}
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value });
                if (validationErrors.name) {
                  setValidationErrors({ ...validationErrors, name: '' });
                }
              }}
              margin="normal"
              required
              error={!!validationErrors.name}
              helperText={validationErrors.name}
            />
            <TextField
              fullWidth
              label="Entreprise"
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              margin="normal"
            />
            <TextField
              fullWidth
              label="Téléphone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              margin="normal"
            />
            <TextField
              fullWidth
              label="BIN"
              value={formData.bin}
              onChange={(e) => setFormData({ ...formData, bin: e.target.value })}
              margin="normal"
            />
            <TextField
              fullWidth
              label="Patent"
              value={formData.patent}
              onChange={(e) => setFormData({ ...formData, patent: e.target.value })}
              margin="normal"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Annuler</Button>
          <Button onClick={handleSubmit} variant="contained" disabled={!formData.name}>
            {editingClient ? 'Modifier' : 'Créer'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Clients;
