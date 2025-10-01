import { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Paper,
  Button,

  Card,
  CardContent,
  Chip,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
} from '@mui/material'
import {
  Add as AddIcon,
  Receipt as ReceiptIcon,
  AccountBalance as BankIcon,
  TrendingUp as TrendingUpIcon,
  AttachMoney as MoneyIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Upload as UploadIcon,
} from '@mui/icons-material'
import { expenseService, EXPENSE_CATEGORIES, type CreateExpenseData } from '../services/expenseService'
import { chequeService } from '../services/chequeService'
import { UserService } from '../services/userService'
import { CompanyService } from '../services/companyServiceApi'
import type { Expense as BaseExpense, Cheque, User, Company } from '../types/database.types'

interface Expense extends BaseExpense {
  company?: { id: number; name: string }
  user?: User
}

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`financial-tabpanel-${index}`}
      aria-labelledby={`financial-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  )
}

export default function FinancialManagement() {
  const [tabValue, setTabValue] = useState(0)
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [cheques, setCheques] = useState<Cheque[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Dialog states
  const [expenseDialog, setExpenseDialog] = useState(false)
  const [expenseFormData, setExpenseFormData] = useState<CreateExpenseData>({
    name: '',
    amount: 0,
    category: 'other',
    company_id: 0,
    user_id: 0,
  })

  // Statistics
  const [expenseStats, setExpenseStats] = useState<{
    totalExpenses: number
    totalAmount: number
    averageAmount: number
    categoryBreakdown: { category: string; count: number; total: number }[]
  } | null>(null)

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Load data with individual error handling to identify which service is failing
      const results = await Promise.allSettled([
        expenseService.getAll(),
        chequeService.getAll(),
        UserService.getAllUsers(),
        CompanyService.getAll(),
        expenseService.getStats(),
      ])
      
      // Handle expenses
      if (results[0].status === 'fulfilled') {
        setExpenses(results[0].value.data || [])
      } else {
        console.error('Error loading expenses:', results[0].reason)
        setExpenses([])
      }
      
      // Handle cheques
      if (results[1].status === 'fulfilled') {
        setCheques(results[1].value.data || [])
      } else {
        console.error('Error loading cheques:', results[1].reason)
        setCheques([])
      }
      
      // Handle users
      if (results[2].status === 'fulfilled') {
        const usersResponse = results[2].value
        setUsers(usersResponse.data || [])
      } else {
        console.error('Error loading users:', results[2].reason)
        setUsers([])
      }
      
      // Handle companies
      if (results[3].status === 'fulfilled') {
        const companiesResponse = results[3].value
        setCompanies((companiesResponse.data as unknown as Company[]) || [])
      } else {
        console.error('Error loading companies:', results[3].reason)
        setCompanies([])
      }
      
      // Handle stats
      if (results[4].status === 'fulfilled') {
        const stats = results[4].value
        // Map the API response to our expected structure
        setExpenseStats({
          totalExpenses: stats.total || 0,
          totalAmount: stats.totalAmount || 0,
          averageAmount: stats.avgAmount || 0,
          categoryBreakdown: Object.entries(stats.byCategory || {}).map(([category, count]) => ({
            category,
            count: count as number,
            total: count as number // Using count as total for now
          }))
        })
      } else {
        console.error('Error loading expense stats:', results[4].reason)
        setExpenseStats(null)
      }
      
      // Check if any critical services failed
      const failedServices = results.filter(r => r.status === 'rejected')
      if (failedServices.length > 0) {
        setError(`Some financial data could not be loaded (${failedServices.length} services failed)`)
      }
      
    } catch (err) {
      setError('Failed to load financial data')
      console.error('Error loading financial data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleCreateExpense = async () => {
    try {
      setError(null)
      await expenseService.create(expenseFormData)
      setExpenseDialog(false)
      setExpenseFormData({
        name: '',
        amount: 0,
        category: 'other',
        company_id: 0,
        user_id: 0,
      })
      await loadData()
    } catch (err) {
      setError('Failed to create expense')
      console.error('Error creating expense:', err)
    }
  }

  const handleDeleteExpense = async (id: number) => {
    if (confirm('Are you sure you want to delete this expense?')) {
      try {
        await expenseService.delete(id)
        await loadData()
      } catch (err) {
        setError('Failed to delete expense')
        console.error('Error deleting expense:', err)
      }
    }
  }

  const formatCurrency = (amount: number | null) => {
    return expenseService.formatCurrency(amount || 0)
  }

  const formatDate = (date: string) => {
    return expenseService.formatDate(date)
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Financial Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setExpenseDialog(true)}
        >
          Add Expense
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Financial Overview Cards */}
      <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', mb: 3 }}>
        <Box sx={{ flex: '1 1 200px', minWidth: 200 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total Expenses
                  </Typography>
                  <Typography variant="h4">
                    {expenseStats?.totalExpenses || 0}
                  </Typography>
                </Box>
                <ReceiptIcon color="primary" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Box>
        
        <Box sx={{ flex: '1 1 200px', minWidth: 200 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total Amount
                  </Typography>
                  <Typography variant="h4">
                    {formatCurrency(expenseStats?.totalAmount || 0)}
                  </Typography>
                </Box>
                <MoneyIcon color="primary" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ flex: '1 1 200px', minWidth: 200 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Active Cheques
                  </Typography>
                  <Typography variant="h4">
                    {cheques.filter(c => c.status !== 'cleared' && c.status !== 'cancelled').length}
                  </Typography>
                </Box>
                <BankIcon color="primary" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ flex: '1 1 200px', minWidth: 200 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Average Expense
                  </Typography>
                  <Typography variant="h4">
                    {formatCurrency(expenseStats?.averageAmount || 0)}
                  </Typography>
                </Box>
                <TrendingUpIcon color="primary" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Tabs for different financial sections */}
      <Paper sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
            <Tab label="Expenses" />
            <Tab label="Cheque Status" />
            <Tab label="Reports" />
            <Tab label="Categories" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          {/* Expenses Table */}
          <Typography variant="h6" gutterBottom>
            Expense Management
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Company</TableCell>
                  <TableCell>User</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {expenses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      No expenses found
                    </TableCell>
                  </TableRow>
                ) : (
                  expenses.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell>{expense.name}</TableCell>
                      <TableCell>
                        <Chip 
                          label={expenseService.getCategoryLabel(expense.category)} 
                          size="small" 
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>{formatCurrency(expense.amount)}</TableCell>
                      <TableCell>{expense.company?.name || 'N/A'}</TableCell>
                      <TableCell>{expense.user?.name || 'N/A'}</TableCell>
                      <TableCell>{formatDate(expense.created_at)}</TableCell>
                      <TableCell>
                        <IconButton size="small">
                          <EditIcon />
                        </IconButton>
                        <IconButton 
                          size="small" 
                          onClick={() => handleDeleteExpense(expense.id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          {/* Cheque Status */}
          <Typography variant="h6" gutterBottom>
            Cheque Status Overview
          </Typography>
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              {['pending', 'deposited', 'cleared', 'bounced'].map(status => {
                const count = cheques.filter(c => c.status === status).length
                const color = status === 'cleared' ? 'success' : 
                             status === 'bounced' ? 'error' : 
                             status === 'pending' ? 'warning' : 'info'
                return (
                  <Chip 
                    key={status}
                    label={`${status.toUpperCase()}: ${count}`}
                    color={color as any}
                    variant="outlined"
                  />
                )
              })}
            </Box>
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          {/* Reports */}
          <Typography variant="h6" gutterBottom>
            Financial Reports
          </Typography>
          <Typography variant="body2" color="textSecondary" paragraph>
            Generate comprehensive financial reports including expense summaries, payment tracking, and cash flow analysis.
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Button variant="outlined" startIcon={<ReceiptIcon />}>
              Expense Report
            </Button>
            <Button variant="outlined" startIcon={<BankIcon />}>
              Payment Report  
            </Button>
            <Button variant="outlined" startIcon={<TrendingUpIcon />}>
              Cash Flow Report
            </Button>
            <Button variant="outlined" startIcon={<MoneyIcon />}>
              Financial Summary
            </Button>
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          {/* Category Breakdown */}
          <Typography variant="h6" gutterBottom>
            Expense Categories
          </Typography>
          {expenseStats?.categoryBreakdown && (
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              {expenseStats.categoryBreakdown.map(category => (
                <Box key={category.category} sx={{ flex: '1 1 300px', minWidth: 250 }}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle1">
                        {expenseService.getCategoryLabel(category.category)}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {category.count} expenses
                      </Typography>
                      <Typography variant="h6" color="primary">
                        {formatCurrency(category.total)}
                      </Typography>
                    </CardContent>
                  </Card>
                </Box>
              ))}
            </Box>
          )}
        </TabPanel>
      </Paper>

      {/* Create Expense Dialog */}
      <Dialog open={expenseDialog} onClose={() => setExpenseDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Expense</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <TextField
              label="Expense Name"
              fullWidth
              value={expenseFormData.name}
              onChange={(e) => setExpenseFormData({ ...expenseFormData, name: e.target.value })}
            />
            <TextField
              label="Amount"
              type="number"
              fullWidth
              value={expenseFormData.amount || ''}
              onChange={(e) => setExpenseFormData({ ...expenseFormData, amount: e.target.value ? Number(e.target.value) : 0 })}
            />
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={expenseFormData.category}
                label="Category"
                onChange={(e) => setExpenseFormData({ ...expenseFormData, category: e.target.value })}
              >
                {EXPENSE_CATEGORIES.map(category => (
                  <MenuItem key={category.value} value={category.value}>
                    {category.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Company</InputLabel>
              <Select
                value={expenseFormData.company_id || ''}
                label="Company"
                onChange={(e) => setExpenseFormData({ ...expenseFormData, company_id: Number(e.target.value) })}
              >
                {companies.map(company => (
                  <MenuItem key={company.id} value={company.id}>
                    {company.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>User</InputLabel>
              <Select
                value={expenseFormData.user_id || ''}
                label="User"
                onChange={(e) => setExpenseFormData({ ...expenseFormData, user_id: Number(e.target.value) })}
              >
                {users.map(user => (
                  <MenuItem key={user.id} value={user.id}>
                    {user.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button
              variant="outlined"
              startIcon={<UploadIcon />}
              component="label"
            >
              Upload Receipt
              <input
                type="file"
                hidden
                accept="image/*,.pdf"
                onChange={(e) => {
                  // Handle file upload here
                  console.log('File selected:', e.target.files?.[0])
                }}
              />
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExpenseDialog(false)}>Cancel</Button>
          <Button onClick={handleCreateExpense} variant="contained">
            Create Expense
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}