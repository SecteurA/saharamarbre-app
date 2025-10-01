import React, { useState, useEffect } from 'react';
interface Company {
  id: number;
  name: string;
}

interface Product {
  name: string;
  type: string;
}

import {
  Box,
  Paper,
  Typography,
  Stack,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  FormControlLabel,
  Autocomplete,
  Divider,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Calculate as CalculateIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { fr } from 'date-fns/locale';

// Types
interface Client {
  id: number;
  name: string;
  phone: string;
  company?: string;
  bin?: string;
  patent?: string;
}

interface Company {
  id: number;
  name: string;
}

interface User {
  id: number;
  name: string;
}

interface ProductType {
  name: string;
}

interface Product {
  name: string;
  type: string;
}

interface QuoteItem {
  group: number;
  type: string;
  product: string;
  options: string;
  state: string;
  splicer: number | null;
  length: number | null;
  width: number | null;
  quantity: number;
  unit_price: number;
  total_quantity: number | null;
  total_price: number | null;
}

interface QuoteFormData {
  client_id: number | null;
  salesperson: number | null;
  driver: string;
  plate: string;
  worksite: string;
  is_free: boolean;
  tax_rate: number;
  company: number | null;
  template: number | null;
  order_ref: string;
  created_at: Date;
  notes: string;
  items: QuoteItem[];
  taxable_amount: number;
  total_amount: number;
}

const PRODUCT_TYPES = [
  'DÉBIT',
  'TRANCHE',
  'CARREAUX',
  'ESCALIER',
  'ESCALIER ML',
  'PLINTHE',
  'DOUBLE NEZ',
  'SERVICE'
];

const PRODUCT_OPTIONS = [
  'Finition',
  'Coupe',
  'Polissage',
  'Sciage'
];

const PRODUCT_STATES = [
  'Poli',
  'Brut',
  'Bouchardé',
  'Adouci',
  'Chevron',
  'Flammé',
  'Eclaté',
  'Striée',
  'Sablé',
  'Bouchardé vieilli',
  'Vieilli',
  'Sablé Vieilli'
];

interface QuoteFormProps {
  onSubmit: (data: QuoteFormData) => Promise<void>;
  onCancel: () => void;
  initialData?: Partial<QuoteFormData>;
  loading?: boolean;
}

const QuoteForm: React.FC<QuoteFormProps> = ({
  onSubmit,
  onCancel,
  initialData,
  loading = false,
}) => {
  // Form state
  const [formData, setFormData] = useState<QuoteFormData>({
    client_id: null,
    salesperson: null,
    driver: '',
    plate: '',
    worksite: '',
    is_free: false,
    tax_rate: 20,
    company: null,
    template: null,
    order_ref: '',
    created_at: new Date(),
    notes: '',
    items: [],
    taxable_amount: 0,
    total_amount: 0,
    ...initialData,
  });

  // Data for dropdowns
  const [clients, setClients] = useState<Client[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoadingData(true);
      
      // Load clients, companies, users, and products
      const [clientsRes, companiesRes, usersRes, productsRes] = await Promise.all([
        fetch('http://localhost:3001/api/clients'),
        fetch('http://localhost:3001/api/companies'),
        fetch('http://localhost:3001/api/users'),
        fetch('http://localhost:3001/api/products'),
      ]);

      const [clientsData, companiesData, usersData, productsData] = await Promise.all([
        clientsRes.json(),
        companiesRes.json(),
        usersRes.json(),
        productsRes.json(),
      ]);

      setClients(clientsData.data || clientsData || []);
      setCompanies(companiesData.data || companiesData || []);
      setUsers(usersData.data || usersData || []);
      setProducts(productsData.data || productsData || []);
    } catch (error) {
      console.error('Error loading initial data:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const handleInputChange = (field: keyof QuoteFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when field is updated
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleItemChange = (index: number, field: keyof QuoteItem, value: any) => {
    const updatedItems = [...formData.items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    
    // Auto-calculate totals
    if (field === 'quantity' || field === 'unit_price') {
      const item = updatedItems[index];
      if (item.quantity && item.unit_price) {
        item.total_price = item.quantity * item.unit_price;
      }
    }
    
    setFormData(prev => ({ ...prev, items: updatedItems }));
  };

  const addItem = () => {
    const newItem: QuoteItem = {
      group: formData.items.length + 1,
      type: 'DÉBIT',
      product: '',
      options: '',
      state: 'Poli',
      splicer: null,
      length: null,
      width: null,
      quantity: 1,
      unit_price: 0,
      total_quantity: null,
      total_price: null,
    };
    
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, newItem],
    }));
  };

  const removeItem = (index: number) => {
    const updatedItems = formData.items.filter((_, i) => i !== index);
    // Renumber groups
    updatedItems.forEach((item, i) => {
      item.group = i + 1;
    });
    
    setFormData(prev => ({ ...prev, items: updatedItems }));
  };

  const calculateTotals = () => {
    let taxableAmount = 0;
    
    if (!formData.is_free) {
      taxableAmount = formData.items.reduce((sum, item) => {
        return sum + (item.total_price || 0);
      }, 0);
    }
    
    const totalAmount = formData.tax_rate === 20 ? taxableAmount * 1.2 : taxableAmount;
    
    setFormData(prev => ({
      ...prev,
      taxable_amount: taxableAmount,
      total_amount: totalAmount,
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.client_id) {
      newErrors.client_id = 'Le client est requis';
    }
    
    if (!formData.company) {
      newErrors.company = 'La société est requise';
    }
    
    if (formData.items.length === 0) {
      newErrors.items = 'Au moins un produit est requis';
    }
    
    formData.items.forEach((item, index) => {
      if (!item.product) {
        newErrors[`item_${index}_product`] = 'Le produit est requis';
      }
      if (!item.quantity || item.quantity <= 0) {
        newErrors[`item_${index}_quantity`] = 'La quantité doit être supérieure à 0';
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }
    
    calculateTotals();
    
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  if (loadingData) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
        <Typography variant="body1" sx={{ ml: 2 }}>
          Chargement des données...
        </Typography>
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
      <Paper elevation={2} sx={{ p: 3, maxWidth: '100%', mx: 'auto' }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Créer un Devis
        </Typography>
        
        <Divider sx={{ mb: 3 }} />

        {/* Responsable Section */}
        <Box mb={3}>
          <Typography variant="h6" gutterBottom color="primary">
            Responsable
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Box sx={{ minWidth: 200, flex: 1 }}>
              <FormControl fullWidth>
                <InputLabel>Salesperson</InputLabel>
                <Select
                  value={formData.salesperson || ''}
                  onChange={(e) => handleInputChange('salesperson', e.target.value)}
                  disabled
                >
                  {users.map((user) => (
                    <MenuItem key={user.id} value={user.id}>
                      {user.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            <Box flex="1 1 auto">
              <TextField
                fullWidth
                label="Chauffeur"
                value={formData.driver}
                onChange={(e) => handleInputChange('driver', e.target.value)}
                disabled
              />
            </Box>
            <Box flex="1 1 auto">
              <TextField
                fullWidth
                label="Plaque"
                value={formData.plate}
                onChange={(e) => handleInputChange('plate', e.target.value)}
                disabled
              />
            </Box>
            <Box flex="1 1 auto">
              <TextField
                fullWidth
                label="Chantier"
                value={formData.worksite}
                onChange={(e) => handleInputChange('worksite', e.target.value)}
                disabled
              />
            </Box>
          </Box>
        </Box>

        {/* Details Section */}
        <Box mb={3}>
          <Typography variant="h6" gutterBottom color="primary">
            Détails
          </Typography>
          <Stack direction="row" spacing={2} flexWrap="wrap">
            <Box flex="1 1 auto">
              <FormControl fullWidth error={!!errors.client_id}>
                <Autocomplete
                  options={clients}
                  getOptionLabel={(option) => `${option.name} - ${option.phone}`}
                  value={clients.find(c => c.id === formData.client_id) || null}
                  onChange={(_, newValue) => handleInputChange('client_id', newValue?.id || null)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Client *"
                      error={!!errors.client_id}
                      helperText={errors.client_id}
                    />
                  )}
                />
              </FormControl>
            </Box>
            
            <Box flex="0 0 auto">
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.is_free}
                    onChange={(e) => handleInputChange('is_free', e.target.checked)}
                  />
                }
                label="Gratuit"
              />
            </Box>
            
            <Box flex="0 0 auto">
              <FormControl fullWidth>
                <InputLabel>Taux de taxe</InputLabel>
                <Select
                  value={formData.tax_rate}
                  onChange={(e) => handleInputChange('tax_rate', e.target.value)}
                  disabled={formData.is_free}
                >
                  <MenuItem value={0}>H.T</MenuItem>
                  <MenuItem value={20}>TTC</MenuItem>
                </Select>
              </FormControl>
            </Box>
            
            <Box flex="1 1 auto">
              <FormControl fullWidth error={!!errors.company}>
                <InputLabel>Société *</InputLabel>
                <Select
                  value={formData.company || ''}
                  onChange={(e) => handleInputChange('company', e.target.value)}
                >
                  {companies.map((company) => (
                    <MenuItem key={company.id} value={company.id}>
                      {company.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              {errors.company && (
                <Typography variant="caption" color="error">
                  {errors.company}
                </Typography>
              )}
            </Box>
            
            <Box flex="0 0 auto">
              <TextField
                fullWidth
                label="Référence commande"
                value={formData.order_ref}
                onChange={(e) => handleInputChange('order_ref', e.target.value)}
              />
            </Box>
          </Stack>
        </Box>

        {/* Notes Section */}
        <Box mb={3}>
          <Typography variant="h6" gutterBottom color="primary">
            Notes
          </Typography>
          <Stack direction="column" spacing={2}>
            <Box>
              <DateTimePicker
                label="Date d'émission"
                value={formData.created_at}
                onChange={(date) => handleInputChange('created_at', date)}
                disabled
                format="dd/MM/yyyy"
              />
            </Box>
            <Box>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Notes"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
              />
            </Box>
          </Stack>
        </Box>

        {/* Products Section */}
        <Box mb={3}>
          <Typography variant="h6" gutterBottom color="primary">
            Produits
          </Typography>
          
          {errors.items && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {errors.items}
            </Alert>
          )}

          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>#</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Désignation</TableCell>
                  <TableCell>OP</TableCell>
                  <TableCell>État</TableCell>
                  <TableCell>Épaisseur</TableCell>
                  <TableCell>Longueur</TableCell>
                  <TableCell>Largeur</TableCell>
                  <TableCell>Quantité</TableCell>
                  <TableCell>P.U</TableCell>
                  <TableCell>Qté/U</TableCell>
                  <TableCell>P.T</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {formData.items.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>{item.group}</TableCell>
                    <TableCell>
                      <FormControl size="small" fullWidth>
                        <Select
                          value={item.type}
                          onChange={(e) => handleItemChange(index, 'type', e.target.value)}
                        >
                          {PRODUCT_TYPES.map((type) => (
                            <MenuItem key={type} value={type}>
                              {type}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </TableCell>
                    <TableCell>
                      <Autocomplete
                        size="small"
                        options={products.filter(p => p.type === (item.type === 'SERVICE' ? 'Service' : 'Marbre'))}
                        getOptionLabel={(option) => option.name}
                        value={products.find(p => p.name === item.product) || null}
                        onChange={(_, newValue) => handleItemChange(index, 'product', newValue?.name || '')}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            error={!!errors[`item_${index}_product`]}
                            helperText={errors[`item_${index}_product`]}
                          />
                        )}
                      />
                    </TableCell>
                    <TableCell>
                      <FormControl size="small" fullWidth>
                        <Select
                          value={item.options}
                          onChange={(e) => handleItemChange(index, 'options', e.target.value)}
                        >
                          <MenuItem value="">Aucune</MenuItem>
                          {PRODUCT_OPTIONS.map((option) => (
                            <MenuItem key={option} value={option}>
                              {option}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </TableCell>
                    <TableCell>
                      <FormControl size="small" fullWidth>
                        <Select
                          value={item.state}
                          onChange={(e) => handleItemChange(index, 'state', e.target.value)}
                        >
                          {PRODUCT_STATES.map((state) => (
                            <MenuItem key={state} value={state}>
                              {state}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </TableCell>
                    <TableCell>
                      <TextField
                        size="small"
                        type="number"
                        value={item.splicer || ''}
                        onChange={(e) => handleItemChange(index, 'splicer', e.target.value ? Number(e.target.value) : null)}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        size="small"
                        type="number"
                        value={item.length || ''}
                        onChange={(e) => handleItemChange(index, 'length', e.target.value ? Number(e.target.value) : null)}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        size="small"
                        type="number"
                        value={item.width || ''}
                        onChange={(e) => handleItemChange(index, 'width', e.target.value ? Number(e.target.value) : null)}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        size="small"
                        type="number"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', Number(e.target.value) || 1)}
                        error={!!errors[`item_${index}_quantity`]}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        size="small"
                        type="number"
                        value={item.unit_price}
                        onChange={(e) => handleItemChange(index, 'unit_price', Number(e.target.value) || 0)}
                        disabled={formData.is_free}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        size="small"
                        type="number"
                        value={item.total_quantity || ''}
                        onChange={(e) => handleItemChange(index, 'total_quantity', e.target.value ? Number(e.target.value) : null)}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        size="small"
                        type="number"
                        value={item.total_price || ''}
                        onChange={(e) => handleItemChange(index, 'total_price', e.target.value ? Number(e.target.value) : null)}
                        disabled={formData.is_free}
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => removeItem(index)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Box mt={2}>
            <Button
              startIcon={<AddIcon />}
              onClick={addItem}
              variant="outlined"
            >
              Ajouter un produit
            </Button>
          </Box>
        </Box>

        {/* Totals Section */}
        {!formData.is_free && (
          <Box mb={3}>
            <Stack direction="row" spacing={2} justifyContent="flex-end" flexWrap="wrap">
              <Box flex="0 0 auto">
                <TextField
                  fullWidth
                  label="Montant HT"
                  value={formData.taxable_amount.toFixed(2)}
                  InputProps={{ readOnly: true, endAdornment: 'DHs' }}
                />
              </Box>
              {formData.tax_rate === 20 && (
                <Box flex="0 0 auto">
                  <TextField
                    fullWidth
                    label="Montant Total TTC"
                    value={formData.total_amount.toFixed(2)}
                    InputProps={{ readOnly: true, endAdornment: 'DHs' }}
                  />
                </Box>
              )}
              <Box>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<CalculateIcon />}
                  onClick={calculateTotals}
                >
                  Calculer
                </Button>
              </Box>
            </Stack>
          </Box>
        )}

        {/* Action Buttons */}
        <Box display="flex" gap={2} justifyContent="flex-end">
          <Button
            variant="outlined"
            startIcon={<CancelIcon />}
            onClick={onCancel}
            disabled={loading}
          >
            Annuler
          </Button>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? <CircularProgress size={20} /> : 'Enregistrer'}
          </Button>
        </Box>
      </Paper>
    </LocalizationProvider>
  );
};

export default QuoteForm;