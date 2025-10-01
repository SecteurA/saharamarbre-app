import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Orders from './pages/Orders'
import Quotes from './pages/Quotes'
import IssueSlips from './pages/IssueSlips'
import ReturnSlips from './pages/ReturnSlips'
import PaymentSlips from './pages/PaymentSlips'
import ReceptionSlips from './pages/ReceptionSlips'
import Products from './pages/Products'
import Clients from './pages/Clients'
import Companies from './pages/Companies'
import Drivers from './pages/Drivers'
import Expenses from './pages/Expenses'
import Managers from './pages/Managers'
import Stocks from './pages/Stocks_new'
import BankAccounts from './pages/BankAccounts'
import CashDesk from './pages/CashDesk'
import Cheques from './pages/Cheques'
import FinancialManagement from './pages/FinancialManagement'
// import PermissionsRoles from './pages/PermissionsRoles'
import Login from './pages/Login'
import CreateQuote from './pages/CreateQuote'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
})

// Create theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#3b82f6',
    },
    secondary: {
      main: '#6b7280',
    },
    background: {
      default: '#f9fafb',
    },
  },
  typography: {
    fontFamily: 'Inter, system-ui, sans-serif',
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: '8px',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
          boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        },
      },
    },
  },
})

function AppRoutes() {
  // const { } = useAuth() // Removed isConfigured as it's not available

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      {/* <Route path="/demo" element={<DemoMode />} /> */}
      <Route path="/" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route index element={<Dashboard />} />
        {/* Sales & Orders */}
        <Route path="orders" element={<Orders />} />
        <Route path="quotes" element={<Quotes />} />
        <Route path="quotes/create" element={<CreateQuote />} />
        <Route path="issue-slips" element={<IssueSlips />} />
        <Route path="return-slips" element={<ReturnSlips />} />
        <Route path="payment-slips" element={<PaymentSlips />} />
        <Route path="receipt-slips" element={<ReceptionSlips />} />
        {/* Inventory */}
        <Route path="products" element={<Products />} />
        <Route path="stock" element={<Stocks />} />
        <Route path="stocks" element={<Stocks />} />
        {/* <Route path="types" element={<Types />} /> */}
        {/* Contacts */}
        <Route path="clients" element={<Clients />} />
        <Route path="companies" element={<Companies />} />
        <Route path="drivers" element={<Drivers />} />
        <Route path="managers" element={<Managers />} />
        <Route path="expenses" element={<Expenses />} />
        {/* Financial */}
        <Route path="financial-management" element={<FinancialManagement />} />
        <Route path="bank-accounts" element={<BankAccounts />} />
        <Route path="cash-desk" element={<CashDesk />} />
        <Route path="cheques" element={<Cheques />} />
        {/* <Route path="payments" element={<Payments />} /> */}
        {/* Administration */}
        <Route path="users" element={<Managers />} />
        {/* <Route path="permissions-roles" element={<PermissionsRoles />} /> */}
        {/* <Route path="reports" element={<Reports />} /> */}
        {/* <Route path="inventory-reports" element={<InventoryReports />} /> */}
      </Route>
    </Routes>
  )
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>
          <Router>
            <AppRoutes />
          </Router>
        </AuthProvider>
      </ThemeProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}

export default App
