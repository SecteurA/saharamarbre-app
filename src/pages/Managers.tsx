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
  TablePagination,
  InputAdornment,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
} from '@mui/icons-material';

import * as responsableService from '../services/responsableServiceApi';
import * as companyService from '../services/companyServiceApi';
import type { Responsable, CreateResponsableData, UpdateResponsableData } from '../services/responsableServiceApi';
import type { Company } from '../services/companyServiceApi';

const ROLE_COLORS = {
  'Super administrator': 'error',
  'Administrator': 'warning', 
  'Manager': 'info',
  'stock manager': 'success',
  'Siège social': 'secondary',
  'Employee': 'default'
} as const;

const ROLE_LABELS = {
  'Super administrator': 'Super Admin',
  'Administrator': 'Administrateur',
  'Manager': 'Manager',
  'stock manager': 'Gestionnaire Stock',
  'Siège social': 'Siège Social',
  'Employee': 'Employé'
} as const;

const Managers: React.FC = () => {
  const [users, setUsers] = useState<Responsable[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [open, setOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Responsable | null>(null);
  
  // Pagination states
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalUsers, setTotalUsers] = useState(0);
  
  // Search state
  const [searchTerm, setSearchTerm] = useState('');
  
  // Available roles from database
  const [availableRoles, setAvailableRoles] = useState<string[]>([]);
  
  const [formData, setFormData] = useState<CreateResponsableData>({
    name: '',
    email: '',
    phone: '',
    role_name: 'Manager',
    company_id: undefined,
    password: '',
  });

  const loadUsers = async () => {
    try {
      setLoading(true);
      const users = await responsableService.getResponsables();
      // Sort users by creation date in ascending order (oldest first)
      const sortedUsers = users.sort((a, b) => {
        const dateA = new Date(a.created_at).getTime();
        const dateB = new Date(b.created_at).getTime();
        return dateA - dateB; // Ascending order
      });
      
      // Extract all unique roles from database
      const uniqueRoles = [...new Set(users.map(u => u.role_name).filter(Boolean))].sort();
      console.log('=== UNIQUE ROLES IN DATABASE ===');
      console.log('All roles found:', uniqueRoles);
      console.log('Total users loaded:', users.length);
      
      // Set available roles for dropdown
      setAvailableRoles(uniqueRoles);
      setUsers(sortedUsers);
      setTotalUsers(sortedUsers.length);
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
    }
  };

  // Pagination handlers
  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Filter users based on search term
  const filteredUsers = users.filter(user => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      user.name.toLowerCase().includes(search) ||
      user.email.toLowerCase().includes(search) ||
      (user.phone && user.phone.toLowerCase().includes(search)) ||
      (user.role_name && user.role_name.toLowerCase().includes(search)) ||
      (user.company_name && user.company_name.toLowerCase().includes(search))
    );
  });

  // Get paginated users for display
  const paginatedUsers = filteredUsers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  // Reset page when search changes
  useEffect(() => {
    setPage(0);
  }, [searchTerm]);

  useEffect(() => {
    loadUsers();
    loadCompanies();
  }, []);

  const handleClose = () => {
    setOpen(false);
    setEditingUser(null);
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

  const handleEdit = (user: Responsable) => {
    console.log('=== EDITING USER ===');
    console.log('User role_name from DB:', user.role_name);
    console.log('Available roles in dropdown:', availableRoles);
    
    setEditingUser(user);
    
    // Use the exact role from database (no mapping needed)
    const userRole = user.role_name || (availableRoles.length > 0 ? availableRoles[0] : 'Manager');
    
    console.log('Setting role_name to:', userRole);
    
    setFormData({
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      role_name: userRole as any,
      company_id: user.company_id,
      password: '',
    });
    setOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur?')) {
      try {
        await responsableService.deleteResponsable(id);
        await loadUsers();
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
    
    if (!editingUser && !formData.password) {
      errors.password = 'Le mot de passe est requis pour un nouvel utilisateur';
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
      
      if (editingUser) {
        const { password, ...updateData } = formData;
        const finalUpdateData: UpdateResponsableData = password ? { ...updateData, password } : updateData;
        await responsableService.updateResponsable(editingUser.id, finalUpdateData);
      } else {
        await responsableService.createResponsable(formData);
      }
      
      await loadUsers();
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
            <Box>
              <Typography variant="h4" component="h1">
                Gestion des Utilisateurs
              </Typography>
              <Box display="flex" gap={2} mt={1}>
                <Chip 
                  label={searchTerm ? `Trouvés: ${filteredUsers.length}` : `Total: ${totalUsers}`} 
                  color="primary" 
                  size="small"
                />
                <Chip 
                  label={`Actifs: ${filteredUsers.filter(u => !(u as any).deleted_at).length}`} 
                  color="success" 
                  size="small"
                />
                <Chip 
                  label={`Supprimés: ${filteredUsers.filter(u => (u as any).deleted_at).length}`} 
                  color="error" 
                  size="small"
                />
              </Box>
            </Box>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setOpen(true)}
            >
              Ajouter un Utilisateur
            </Button>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {/* Search Box */}
          <Box sx={{ mb: 3 }}>
            <TextField
              fullWidth
              placeholder="Rechercher par nom, email, téléphone, rôle ou entreprise..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              sx={{ maxWidth: 600 }}
            />
            {searchTerm && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {filteredUsers.length} résultat(s) trouvé(s) sur {totalUsers} utilisateurs
              </Typography>
            )}
          </Box>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Nom</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Téléphone</TableCell>
                  <TableCell>Rôle</TableCell>
                  <TableCell>Statut</TableCell>
                  <TableCell>Date création</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedUsers.map((user) => {
                  const isDeleted = !!(user as any).deleted_at;
                  return (
                    <TableRow 
                      key={user.id}
                      sx={{
                        backgroundColor: isDeleted ? 'rgba(255, 0, 0, 0.1)' : 'inherit',
                        opacity: isDeleted ? 0.7 : 1,
                        '&:hover': {
                          backgroundColor: isDeleted ? 'rgba(255, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.04)',
                        }
                      }}
                    >
                      <TableCell 
                        sx={{ 
                          textDecoration: isDeleted ? 'line-through' : 'none',
                          color: isDeleted ? 'text.secondary' : 'inherit'
                        }}
                      >
                        {user.name}
                      </TableCell>
                      <TableCell 
                        sx={{ 
                          textDecoration: isDeleted ? 'line-through' : 'none',
                          color: isDeleted ? 'text.secondary' : 'inherit'
                        }}
                      >
                        {user.email}
                      </TableCell>
                      <TableCell 
                        sx={{ 
                          color: isDeleted ? 'text.secondary' : 'inherit'
                        }}
                      >
                        {(user as any).phone || '-'}
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={ROLE_LABELS[user.role_name as keyof typeof ROLE_LABELS] || user.role_name || 'Utilisateur'} 
                          color={isDeleted ? 'default' : (ROLE_COLORS[user.role_name as keyof typeof ROLE_COLORS] || 'default')}
                          size="small"
                          variant={isDeleted ? 'outlined' : 'filled'}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={isDeleted ? 'SUPPRIMÉ' : 'ACTIF'} 
                          color={isDeleted ? 'error' : 'success'}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell 
                        sx={{ 
                          color: isDeleted ? 'text.secondary' : 'inherit'
                        }}
                      >
                        {user.created_at ? new Date(user.created_at).toLocaleDateString() : '-'}
                      </TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={() => handleEdit(user)}
                          color="primary"
                          disabled={isDeleted}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDelete(user.id)}
                          color="error"
                          disabled={isDeleted}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {users.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      Aucun utilisateur trouvé
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          
          {/* Pagination */}
          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50]}
            component="div"
            count={filteredUsers.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="Lignes par page:"
            labelDisplayedRows={({ from, to, count }) => 
              `${from}-${to} sur ${count !== -1 ? count : `plus de ${to}`}`
            }
          />
        </CardContent>
      </Card>

      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingUser ? 'Modifier l\'Utilisateur' : 'Ajouter un Nouvel Utilisateur'}
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
                {availableRoles.map((role) => (
                  <MenuItem key={role} value={role}>
                    {ROLE_LABELS[role as keyof typeof ROLE_LABELS] || role}
                  </MenuItem>
                ))}
                {availableRoles.length === 0 && (
                  <MenuItem value="Manager">Manager (par défaut)</MenuItem>
                )}
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
              label={editingUser ? "Nouveau mot de passe (laisser vide pour ne pas changer)" : "Mot de passe *"}
              type="password"
              value={formData.password}
              onChange={(e) => {
                setFormData({ ...formData, password: e.target.value });
                if (validationErrors.password) {
                  setValidationErrors({ ...validationErrors, password: '' });
                }
              }}
              margin="normal"
              required={!editingUser}
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
            disabled={!formData.name || !formData.email || (!editingUser && !formData.password)}
          >
            {editingUser ? 'Modifier' : 'Créer'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Managers;