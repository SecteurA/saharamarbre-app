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
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Chip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';

import * as responsableService from '../services/responsableServiceApi';
import * as companyService from '../services/companyServiceApi';
import type { Responsable, CreateResponsableData } from '../services/responsableServiceApi';
import type { Company } from '../services/companyServiceApi';

const ROLE_COLORS = {
  'Super administrator': 'error',
  'Administrator': 'warning', 
  'Manager': 'info'
} as const;

const ROLE_LABELS = {
  'Super administrator': 'Super Admin',
  'Administrator': 'Administrateur',
  'Manager': 'Manager'
} as const;

const Responsables: React.FC = () => {
  const [responsables, setResponsables] = useState<Responsable[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [open, setOpen] = useState(false);
  const [editingResponsable, setEditingResponsable] = useState<Responsable | null>(null);
  const [formData, setFormData] = useState<CreateResponsableData>({
    name: '',
    email: '',
    phone: '',
    role_name: 'Manager',
    company_id: undefined,
    password: '',
  });

  const loadResponsables = async () => {
    try {
      setLoading(true);
      const data = await responsableService.getResponsables();
      setResponsables(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadCompanies = async () => {
    try {
      const data = await companyService.getCompanies();
      setCompanies(data.data || []);
    } catch (err: any) {
      console.error('Failed to load companies:', err);
      // Don't set error for companies as it's not critical
    }
  };

  useEffect(() => {
    loadResponsables();
    loadCompanies();
  }, []);

  const handleClose = () => {
    setOpen(false);
    setEditingResponsable(null);
    setValidationErrors({});
    setFormData({
      name: '',
      email: '',
      phone: '',
      role_name: 'Manager',
      company_id: undefined,
      password: '',
    });
  };

  const handleEdit = (responsable: Responsable) => {
    setEditingResponsable(responsable);
    setFormData({
      name: responsable.name,
      email: responsable.email,
      phone: responsable.phone || '',
      role_name: responsable.role_name,
      company_id: responsable.company_id,
      password: '', // Don't populate password for editing
    });
    setOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce responsable?')) {
      try {
        await responsableService.deleteResponsable(id);
        await loadResponsables();
      } catch (err: any) {
        setError(err.message);
      }
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Le nom est requis';
    }
    
    if (!formData.email.trim()) {
      errors.email = 'L\'email est requis';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Format d\'email invalide';
    }
    
    if (!editingResponsable && !formData.password) {
      errors.password = 'Le mot de passe est requis pour un nouveau responsable';
    }
    
    if (formData.password && formData.password.length < 6) {
      errors.password = 'Le mot de passe doit contenir au moins 6 caractères';
    }
    
    return errors;
  };

  const handleSubmit = async () => {
    try {
      const errors = validateForm();
      if (Object.keys(errors).length > 0) {
        setValidationErrors(errors);
        return;
      }
      
      setValidationErrors({});
      
      if (editingResponsable) {
        // For update, exclude password if it's empty
        const { password, ...updateData } = formData;
        const finalUpdateData = password ? { ...updateData, password } : updateData;
        await responsableService.updateResponsable(editingResponsable.id, finalUpdateData);
      } else {
        await responsableService.createResponsable(formData);
      }
      
      await loadResponsables();
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
              Gestion des Responsables
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setOpen(true)}
            >
              Ajouter un Responsable
            </Button>
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
                  <TableCell>Email</TableCell>
                  <TableCell>Téléphone</TableCell>
                  <TableCell>Rôle</TableCell>
                  <TableCell>Entreprise</TableCell>
                  <TableCell>Date création</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {responsables.map((responsable) => (
                  <TableRow key={responsable.id}>
                    <TableCell>{responsable.name}</TableCell>
                    <TableCell>{responsable.email}</TableCell>
                    <TableCell>{responsable.phone || '-'}</TableCell>
                    <TableCell>
                      <Chip 
                        label={ROLE_LABELS[responsable.role_name]} 
                        color={ROLE_COLORS[responsable.role_name]}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{responsable.company_name || '-'}</TableCell>
                    <TableCell>{new Date(responsable.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => handleEdit(responsable)}
                        color="primary"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(responsable.id)}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {responsables.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      Aucun responsable trouvé
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingResponsable ? 'Modifier le Responsable' : 'Ajouter un Nouveau Responsable'}
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
              label="Email *"
              type="email"
              value={formData.email}
              onChange={(e) => {
                setFormData({ ...formData, email: e.target.value });
                if (validationErrors.email) {
                  setValidationErrors({ ...validationErrors, email: '' });
                }
              }}
              margin="normal"
              required
              error={!!validationErrors.email}
              helperText={validationErrors.email}
            />
            
            <TextField
              fullWidth
              label="Téléphone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              margin="normal"
            />
            
            <FormControl fullWidth margin="normal">
              <InputLabel>Rôle *</InputLabel>
              <Select
                value={formData.role_name}
                onChange={(e) => setFormData({ ...formData, role_name: e.target.value as any })}
                label="Rôle *"
                required
              >
                <MenuItem value="Manager">Manager</MenuItem>
                <MenuItem value="Administrator">Administrateur</MenuItem>
                <MenuItem value="Super administrator">Super Administrateur</MenuItem>
              </Select>
            </FormControl>
            
            <FormControl fullWidth margin="normal">
              <InputLabel>Entreprise</InputLabel>
              <Select
                value={formData.company_id || ''}
                onChange={(e) => setFormData({ ...formData, company_id: e.target.value ? Number(e.target.value) : undefined })}
                label="Entreprise"
              >
                <MenuItem value="">Aucune entreprise</MenuItem>
                {companies.map((company) => (
                  <MenuItem key={company.id} value={company.id}>
                    {company.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <TextField
              fullWidth
              label={editingResponsable ? "Nouveau mot de passe (laisser vide pour ne pas changer)" : "Mot de passe *"}
              type="password"
              value={formData.password}
              onChange={(e) => {
                setFormData({ ...formData, password: e.target.value });
                if (validationErrors.password) {
                  setValidationErrors({ ...validationErrors, password: '' });
                }
              }}
              margin="normal"
              required={!editingResponsable}
              error={!!validationErrors.password}
              helperText={validationErrors.password}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Annuler</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            disabled={!formData.name || !formData.email || (!editingResponsable && !formData.password)}
          >
            {editingResponsable ? 'Modifier' : 'Créer'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Responsables;