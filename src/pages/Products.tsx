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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  CircularProgress,
  Alert,
  Snackbar,
  Pagination,
  InputAdornment,
  Card,
  CardContent,
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon, Search as SearchIcon } from '@mui/icons-material';
import * as productService from '../services/productServiceApi';
import type { Product, CreateProductData } from '../services/productServiceApi';

const Products: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [open, setOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<CreateProductData>({
    name: '',
    type: 'Marbre',
  });

  // Pagination and search states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [itemsPerPage] = useState(50);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const loadProducts = async (page = 1, search = '', type = '') => {
    try {
      setLoading(true);
      
      const params = {
        page,
        limit: itemsPerPage,
        search: search.trim(),
        type: type || undefined
      };
      
      const response = await productService.getProducts(params);
      setProducts(response.data);
      
      // Use pagination metadata from API
      if (response.pagination) {
        setTotalPages(response.pagination.pages);
        setTotalProducts(response.pagination.total);
      }
      
      setError('');
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des produits');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts(currentPage, searchQuery, typeFilter);
  }, [currentPage, searchQuery, typeFilter]);

  const handleSearch = () => {
    setSearchQuery(searchTerm);
    setCurrentPage(1); // Reset to first page when searching
  };

  const handleSearchKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleSearch();
    }
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, page: number) => {
    setCurrentPage(page);
  };

  const handleTypeFilterChange = (event: any) => {
    setTypeFilter(event.target.value);
    setCurrentPage(1); // Reset to first page when filtering
  };

  const handleClose = () => {
    setOpen(false);
    setEditingProduct(null);
    setValidationErrors({});
    setFormData({
      name: '',
      type: 'Marbre',
    });
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      type: product.type,
    });
    setOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce produit?')) {
      try {
        await productService.deleteProduct(id);
        await loadProducts(currentPage, searchQuery, typeFilter);
        setSuccess('Produit supprimé avec succès');
      } catch (err: any) {
        setError(err.message);
      }
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Le nom est requis';
    } else if (formData.name.trim().length < 4) {
      errors.name = 'Le nom doit contenir au moins 4 caractères';
    } else if (formData.name.trim().length > 200) {
      errors.name = 'Le nom ne peut pas dépasser 200 caractères';
    }
    
    if (!formData.type) {
      errors.type = 'Le type est requis';
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
      
      if (editingProduct) {
        await productService.updateProduct(editingProduct.id, formData);
        setSuccess('Produit mis à jour avec succès');
      } else {
        await productService.createProduct(formData);
        setSuccess('Produit créé avec succès');
      }
      
      await loadProducts(currentPage, searchQuery, typeFilter);
      handleClose();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const getTypeChipColor = (type: string): 'primary' | 'secondary' => {
    return type === 'Marbre' ? 'primary' : 'secondary';
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
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Produits
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpen(true)}
        >
          Nouveau Produit
        </Button>
      </Box>

      {/* Search and Filter Controls */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" gap={2} alignItems="center">
            <TextField
              placeholder="Rechercher des produits..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              sx={{ flexGrow: 1 }}
            />
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>Type de produit</InputLabel>
              <Select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                label="Type de produit"
              >
                <MenuItem value="">Tous les types</MenuItem>
                <MenuItem value="MATERIAL">Matériau</MenuItem>
                <MenuItem value="SERVICE">Service</MenuItem>
                <MenuItem value="PRODUCT">Produit</MenuItem>
              </Select>
            </FormControl>
            <Button 
              variant="contained" 
              onClick={handleSearch}
              disabled={loading}
            >
              Rechercher
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Products Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nom</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Date de création</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {products.map((product) => (
              <TableRow key={product.id}>
                <TableCell>
                  <Typography variant="body2" fontWeight="medium">
                    {product.name}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={product.type}
                    color={getTypeChipColor(product.type || 'Marbre')}
                    variant="outlined"
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {new Date(product.created_at).toLocaleDateString('fr-FR')}
                  </Typography>
                </TableCell>
                <TableCell>
                  <IconButton
                    size="small"
                    onClick={() => handleEdit(product)}
                    sx={{ mr: 1 }}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleDelete(product.id)}
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {products.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  <Typography variant="body2" color="text.secondary">
                    Aucun produit trouvé
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      {totalPages > 1 && (
        <Box display="flex" justifyContent="center" mt={3}>
          <Pagination
            count={totalPages}
            page={currentPage}
            onChange={handlePageChange}
            color="primary"
            showFirstButton
            showLastButton
          />
        </Box>
      )}

      {/* Products Summary */}
      <Box mt={2} display="flex" justifyContent="space-between" alignItems="center">
        <Typography variant="body2" color="text.secondary">
          Affichage de {products.length} produit(s) sur {totalProducts} au total
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Page {currentPage} sur {totalPages}
        </Typography>
      </Box>

      {/* Add/Edit Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingProduct ? 'Modifier le Produit' : 'Nouveau Produit'}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Nom *"
            fullWidth
            variant="outlined"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            error={!!validationErrors.name}
            helperText={validationErrors.name || 'Entre 4 et 200 caractères'}
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth margin="dense" error={!!validationErrors.type}>
            <InputLabel id="type-select-label">Type *</InputLabel>
            <Select
              labelId="type-select-label"
              value={formData.type}
              label="Type *"
              onChange={(e) => setFormData({ ...formData, type: e.target.value as 'Marbre' | 'Service' })}
            >
              <MenuItem value="Marbre">Marbre</MenuItem>
              <MenuItem value="Service">Service</MenuItem>
            </Select>
            {validationErrors.type && (
              <Typography variant="caption" color="error" sx={{ ml: 2 }}>
                {validationErrors.type}
              </Typography>
            )}
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingProduct ? 'Modifier' : 'Créer'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success Snackbar */}
      <Snackbar
        open={!!success}
        autoHideDuration={6000}
        onClose={() => setSuccess('')}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={() => setSuccess('')} severity="success">
          {success}
        </Alert>
      </Snackbar>

      {/* Error Snackbar */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError('')}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={() => setError('')} severity="error">
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Products;