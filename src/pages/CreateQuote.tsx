import React, { useState } from 'react';
import { Container, Alert, Snackbar } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import QuoteForm from '../components/forms/QuoteForm';

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
  items: any[];
  taxable_amount: number;
  total_amount: number;
}

const CreateQuote: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'warning' | 'info',
  });

  const handleSubmit = async (formData: QuoteFormData) => {
    setLoading(true);
    
    try {
      // Transform the data to match the API expected format
      const quoteData = {
        type: 'quote', // Important: mark as quote type
        client_id: formData.client_id,
        user_id: formData.salesperson, // Laravel uses user_id for salesperson
        driver: formData.driver,
        plate: formData.plate,
        worksite: formData.worksite,
        is_free: formData.is_free,
        tax_rate: formData.tax_rate,
        company_id: formData.company, // Laravel uses company_id
        template_id: formData.template, // Laravel uses template_id
        order_ref: formData.order_ref,
        created_at: formData.created_at.toISOString(),
        notes: formData.notes,
        taxable_amount: formData.taxable_amount,
        total_amount: formData.total_amount,
        items: formData.items.map(item => ({
          group: item.group,
          type: item.type,
          product: item.product,
          options: item.options,
          state: item.state,
          splicer: item.splicer,
          length: item.length,
          width: item.width,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_quantity: item.total_quantity,
          total_price: item.total_price,
        })),
      };

      const response = await fetch('http://localhost:3001/api/quotes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(quoteData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de la création du devis');
      }

      await response.json();
      
      setSnackbar({
        open: true,
        message: 'Devis créé avec succès!',
        severity: 'success',
      });

      // Navigate back to quotes list after a short delay
      setTimeout(() => {
        navigate('/quotes');
      }, 1500);
      
    } catch (error) {
      console.error('Error creating quote:', error);
      setSnackbar({
        open: true,
        message: error instanceof Error ? error.message : 'Erreur lors de la création du devis',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/quotes');
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <QuoteForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        loading={loading}
      />
      
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default CreateQuote;