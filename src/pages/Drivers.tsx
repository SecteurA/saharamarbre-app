import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Alert,
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import * as driverService from '../services/driverServiceApi';
import type { Driver, CreateDriverData } from '../services/driverServiceApi';

const Drivers: React.FC = () => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [open, setOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [formData, setFormData] = useState<CreateDriverData>({
    name: '',
    phone: '',
    cin: '',
  });

  const loadDrivers = async () => {
    try {
      setLoading(true);
      const data = await driverService.getDrivers();
      setDrivers(data);
      setError('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDrivers();
  }, []);

  const handleClose = () => {
    setOpen(false);
    setEditingDriver(null);
    setValidationErrors({});
    setFormData({
      name: '',
      phone: '',
      cin: '',
    });
  };

  const handleEdit = (driver: Driver) => {
    setEditingDriver(driver);
    setFormData({
      name: driver.name,
      phone: driver.phone,
      cin: driver.cin || '',
    });
    setOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce chauffeur?')) {
      try {
        await driverService.deleteDriver(id);
        await loadDrivers();
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
    
    if (!formData.phone.trim()) {
      errors.phone = 'Le téléphone est requis';
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
      
      if (editingDriver) {
        await driverService.updateDriver(editingDriver.id, formData);
      } else {
        await driverService.createDriver(formData);
      }
      
      await loadDrivers();
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
    <Box sx={{ p: 3 }}>
      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Chauffeurs
        </Typography>
        <Button
          variant="contained"
          onClick={() => setOpen(true)}
        >
          Nouveau Chauffeur
        </Button>
      </Box>

      {/* Drivers Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nom</TableCell>
              <TableCell>Téléphone</TableCell>
              <TableCell>CIN</TableCell>
              <TableCell>Date de création</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {drivers.map((driver) => (
              <TableRow key={driver.id}>
                <TableCell>
                  <Typography variant="body2" fontWeight="medium">
                    {driver.name}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {driver.phone}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color={driver.cin ? 'text.primary' : 'text.secondary'}>
                    {driver.cin || 'N/A'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {new Date(driver.created_at).toLocaleDateString('fr-FR')}
                  </Typography>
                </TableCell>
                <TableCell>
                  <IconButton
                    size="small"
                    onClick={() => handleEdit(driver)}
                    sx={{ mr: 1 }}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleDelete(driver.id)}
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {drivers.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  <Typography variant="body2" color="text.secondary">
                    Aucun chauffeur trouvé
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add/Edit Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingDriver ? 'Modifier le Chauffeur' : 'Nouveau Chauffeur'}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Nom"
            fullWidth
            variant="outlined"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            error={!!validationErrors.name}
            helperText={validationErrors.name}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Téléphone"
            fullWidth
            variant="outlined"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            error={!!validationErrors.phone}
            helperText={validationErrors.phone}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="CIN"
            fullWidth
            variant="outlined"
            value={formData.cin}
            onChange={(e) => setFormData({ ...formData, cin: e.target.value })}
            error={!!validationErrors.cin}
            helperText={validationErrors.cin}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingDriver ? 'Modifier' : 'Créer'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Drivers