import { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Snackbar,
  CircularProgress,
} from '@mui/material'
import { Receipt as ReceiptIcon } from '@mui/icons-material'
import { getCompanyOptions } from '../services/companyServiceApi'
import { cashDeskService, type CashDeskData } from '../services/cashDeskService'

interface Company {
  id: number
  name: string
  code: string
}

export default function CashDesk() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [selectedCompany, setSelectedCompany] = useState<number | ''>('')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(false)
  const [loadingCompanies, setLoadingCompanies] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [cashData, setCashData] = useState<CashDeskData | null>(null)

  // Load companies on component mount
  useEffect(() => {
    const loadCompanies = async () => {
      try {
        setLoadingCompanies(true)
        const companiesData = await getCompanyOptions()
        console.log('Company options loaded:', companiesData)
        setCompanies(companiesData || [])
      } catch (err) {
        console.error('Failed to load companies:', err)
        setError('Impossible de charger les sociétés')
      } finally {
        setLoadingCompanies(false)
      }
    }
    loadCompanies()
  }, [])

  // Generate cash report
  const handleGenerateReport = async () => {
    if (!selectedDate) {
      setError('Veuillez sélectionner une date')
      return
    }

    try {
      setLoading(true)
      setError(null)
      setCashData(null)
      
      // Generate cash desk report using the service
      const result = await cashDeskService.generate(
        selectedDate, 
        selectedCompany ? Number(selectedCompany) : undefined
      )
      
      if (result.success && result.data) {
        setCashData(result.data)
        setSuccess(result.message || 'Rapport de caisse généré avec succès')
        console.log('Cash desk data:', result.data)
      } else {
        setError(result.message || 'Erreur lors de la génération du rapport')
      }
    } catch (err) {
      console.error('Failed to generate report:', err)
      setError('Erreur lors de la génération du rapport')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h4" component="h1" sx={{ mb: 4, textAlign: 'center' }}>
        CAISSE
      </Typography>

      <Paper sx={{ p: 4, mb: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <FormControl fullWidth required>
            <InputLabel>SOCIÉTÉ</InputLabel>
            <Select
              value={selectedCompany}
              onChange={(e) => setSelectedCompany(e.target.value as number)}
              label="SOCIÉTÉ"
              disabled={loadingCompanies}
            >
              <MenuItem value="">
                <em>SÉLECTIONNEZ UNE OPTION</em>
              </MenuItem>
              {companies.map((company) => (
                <MenuItem key={company.id} value={company.id}>
                  {company.name} ({company.code})
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            label="DATE"
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            fullWidth
            required
            InputLabelProps={{ shrink: true }}
          />

          <Button
            variant="contained"
            onClick={handleGenerateReport}
            disabled={!selectedDate || loading}
            sx={{
              backgroundColor: '#d32f2f',
              '&:hover': { backgroundColor: '#b71c1c' },
              py: 1.5,
              fontSize: '1.1rem',
              fontWeight: 'bold',
            }}
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <ReceiptIcon />}
          >
            {loading ? 'GÉNÉRATION EN COURS...' : 'GÉNERER LA CAISSE'}
          </Button>
        </Box>
      </Paper>

      {/* Cash Desk Results */}
      {cashData && (
        <Paper sx={{ p: 4, mb: 3 }}>
          <Typography variant="h5" component="h2" sx={{ mb: 3, textAlign: 'center' }}>
            Rapport de Caisse - {cashData.company.name} ({cashData.company.code})
          </Typography>
          <Typography variant="h6" sx={{ mb: 2, textAlign: 'center' }}>
            Date: {new Date(cashData.date).toLocaleDateString('fr-FR')}
          </Typography>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3, mb: 3 }}>
            {/* Expenses Section */}
            <Box>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Dépenses ({cashData.expenses.length})
              </Typography>
              <Box sx={{ maxHeight: 300, overflowY: 'auto' }}>
                {cashData.expenses.map((expense) => (
                  <Box key={expense.id} sx={{ p: 1, borderBottom: '1px solid #eee' }}>
                    <Typography variant="body2">
                      {expense.description || 'Dépense sans description'}
                    </Typography>
                    <Typography variant="body2" color="error">
                      -{expense.amount.toFixed(2)} DH
                    </Typography>
                  </Box>
                ))}
              </Box>
              <Typography variant="h6" color="error" sx={{ mt: 2 }}>
                Total Dépenses: {cashData.totals.expenses.toFixed(2)} DH
              </Typography>
            </Box>

            {/* Orders Section */}
            <Box>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Commandes par Type
              </Typography>
              <Box sx={{ maxHeight: 300, overflowY: 'auto' }}>
                {cashData.orderTypes.map((type) => (
                  <Box key={type} sx={{ mb: 2 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                      {type.toUpperCase()} ({cashData.orders[type].length})
                    </Typography>
                    {cashData.orders[type].map((order) => (
                      <Box key={order.id} sx={{ p: 1, borderBottom: '1px solid #eee', ml: 2 }}>
                        <Typography variant="body2">
                          {order.human_id} - {order.client_name || 'Client non spécifié'}
                        </Typography>
                        <Typography variant="body2" color="success.main">
                          +{parseFloat(order.total_amount?.toString() || '0').toFixed(2)} DH
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                ))}
              </Box>
              <Typography variant="h6" color="success.main" sx={{ mt: 2 }}>
                Total Commandes: {cashData.totals.orders.toFixed(2)} DH
              </Typography>
            </Box>
          </Box>

          {/* Summary */}
          <Box sx={{ textAlign: 'center', p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
              Résultat Net: {cashData.totals.net.toFixed(2)} DH
            </Typography>
            <Typography variant="body2" color="textSecondary">
              (Commandes - Dépenses)
            </Typography>
          </Box>
        </Paper>
      )}

      <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError(null)}>
        <Alert onClose={() => setError(null)} severity="error">{error}</Alert>
      </Snackbar>

      <Snackbar open={!!success} autoHideDuration={6000} onClose={() => setSuccess(null)}>
        <Alert onClose={() => setSuccess(null)} severity="success">{success}</Alert>
      </Snackbar>
    </Box>
  )
}
