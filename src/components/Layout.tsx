import { useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  AppBar,
  Box,
  CssBaseline,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Avatar,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Alert,
  InputAdornment,
} from '@mui/material'
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,

  Inventory2 as ProductsIcon,
  People as ClientsIcon,
  Business as CompaniesIcon,
  Payment as PaymentsIcon,
  AccountCircle,
  LocalShipping as DriversIcon,
  AccountBalance as BankIcon,
  Receipt as ReceiptIcon,

  AttachMoney as CashIcon,
  Warehouse as StockIcon,
  RequestQuote as QuoteIcon,
  Assignment as OrderIcon,
  LocalShipping as DeliveryIcon,
  Undo as ReturnIcon,
  ReceiptLong as ReceiptLongIcon,
  AccountBalanceWallet as PaymentSlipIcon,
  MoneyOff as ExpenseIcon,
  Check as CheckIcon,
  SupervisorAccount as ManagerIcon,
  Lock as LockIcon,
  Visibility,
  VisibilityOff,
} from '@mui/icons-material'
import { useAuth } from '../contexts/AuthContext'

const drawerWidth = 240

const menuItems = [
  { 
    text: 'Tableau de bord', 
    icon: DashboardIcon, 
    path: '/', 
    group: 'Principal'
  },
  { 
    text: 'Caisse', 
    icon: CashIcon, 
    path: '/cash-desk', 
    group: 'Principal'
  },
  { 
    text: 'Stock', 
    icon: StockIcon, 
    path: '/stock', 
    group: 'Principal'
  },
  // VENTES & DÉPENSES Group
  { 
    text: 'Devis', 
    icon: QuoteIcon, 
    path: '/quotes', 
    group: 'Ventes & Dépenses'
  },
  { 
    text: 'Bons de Commande', 
    icon: OrderIcon, 
    path: '/orders', 
    group: 'Ventes & Dépenses'
  },
  { 
    text: 'Bons de Livraison', 
    icon: DeliveryIcon, 
    path: '/receipt-slips', 
    group: 'Ventes & Dépenses'
  },
  { 
    text: 'Bons de Retour', 
    icon: ReturnIcon, 
    path: '/return-slips', 
    group: 'Ventes & Dépenses'
  },
  { 
    text: 'Bons de Réception', 
    icon: ReceiptLongIcon, 
    path: '/issue-slips', 
    group: 'Ventes & Dépenses'
  },
  { 
    text: 'Bons de Règlement', 
    icon: PaymentSlipIcon, 
    path: '/payment-slips', 
    group: 'Ventes & Dépenses'
  },
  { 
    text: 'Dépense', 
    icon: ExpenseIcon, 
    path: '/expenses', 
    group: 'Ventes & Dépenses'
  },
  // CHÈQUES Group
  { 
    text: 'Chèques', 
    icon: CheckIcon, 
    path: '/cheques', 
    group: 'Chèques'
  },
  // PERSONNELS Group
  { 
    text: 'Clients', 
    icon: ClientsIcon, 
    path: '/clients', 
    group: 'Personnels'
  },
  { 
    text: 'Responsables', 
    icon: ManagerIcon, 
    path: '/managers', 
    group: 'Personnels'
  },
  { 
    text: 'Chauffeurs', 
    icon: DriversIcon, 
    path: '/drivers', 
    group: 'Personnels'
  },
  // PRODUITS Group
  { 
    text: 'Produits', 
    icon: ProductsIcon, 
    path: '/products', 
    group: 'Produits'
  },
  // COMPAGNIE Group
  { 
    text: 'Sociétés', 
    icon: CompaniesIcon, 
    path: '/companies', 
    group: 'Compagnie'
  },
  { 
    text: 'Comptes Bancaires', 
    icon: BankIcon, 
    path: '/bank-accounts', 
    group: 'Compagnie'
  },


]

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [changePasswordOpen, setChangePasswordOpen] = useState(false)
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  })
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')
  const [passwordLoading, setPasswordLoading] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen)
  }

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
  }

  const handleSignOut = async () => {
    await logout()
    handleMenuClose()
    navigate('/login')
  }

  const handleChangePasswordClick = () => {
    setChangePasswordOpen(true)
    handleMenuClose()
  }

  const handlePasswordDialogClose = () => {
    setChangePasswordOpen(false)
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
    setPasswordError('')
    setPasswordSuccess('')
    setShowPasswords({ current: false, new: false, confirm: false })
  }

  const validatePassword = (password: string): string[] => {
    const errors: string[] = []
    if (password.length < 8) errors.push('Au moins 8 caractères')
    if (!/[A-Z]/.test(password)) errors.push('Une majuscule')
    if (!/[a-z]/.test(password)) errors.push('Une minuscule')
    if (!/[0-9]/.test(password)) errors.push('Un chiffre')
    return errors
  }

  const handlePasswordChange = async () => {
    try {
      setPasswordError('')
      setPasswordLoading(true)

      // Validation
      if (!passwordData.currentPassword) {
        setPasswordError('Mot de passe actuel requis')
        return
      }

      if (!passwordData.newPassword) {
        setPasswordError('Nouveau mot de passe requis')
        return
      }

      if (passwordData.newPassword !== passwordData.confirmPassword) {
        setPasswordError('Les mots de passe ne correspondent pas')
        return
      }

      const passwordErrors = validatePassword(passwordData.newPassword)
      if (passwordErrors.length > 0) {
        setPasswordError(`Le mot de passe doit contenir: ${passwordErrors.join(', ')}`)
        return
      }

      // Call API to change password
      const response = await fetch('http://localhost:3001/api/auth/change-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          current_password: passwordData.currentPassword,
          new_password: passwordData.newPassword,
          new_password_confirmation: passwordData.confirmPassword
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Erreur lors du changement de mot de passe')
      }

      setPasswordSuccess('Mot de passe changé avec succès!')
      setTimeout(() => {
        handlePasswordDialogClose()
      }, 2000)

    } catch (error) {
      console.error('Erreur changement mot de passe:', error)
      setPasswordError(error instanceof Error ? error.message : 'Erreur lors du changement de mot de passe')
    } finally {
      setPasswordLoading(false)
    }
  }

  const drawer = (
    <div>
      <Toolbar>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', py: 1 }}>
          <img src="/brand.svg" alt="planet marbre logo" style={{ width: 190, height: 'auto', maxWidth: '100%' }} />
        </Box>
      </Toolbar>
      <List>
        {/* Group menu items by their groups */}
        {Object.entries(
          menuItems.reduce((groups, item) => {
            const group = item.group || 'Other'
            if (!groups[group]) groups[group] = []
            groups[group].push(item)
            return groups
          }, {} as Record<string, typeof menuItems>)
        ).map(([groupName, items]) => (
          <div key={groupName}>
            {groupName !== 'Principal' && (
              <ListItem>
                <Typography 
                  variant="caption" 
                  sx={{ 
                    fontWeight: 600, 
                    color: 'text.secondary',
                    textTransform: 'uppercase',
                    letterSpacing: 1,
                    px: 1,
                    py: 0.5
                  }}
                >
                  {groupName}
                </Typography>
              </ListItem>
            )}
            {items.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path
              
              return (
                <ListItem key={item.text} disablePadding>
                  <ListItemButton
                    selected={isActive}
                    onClick={() => navigate(item.path)}
                    sx={{
                      pl: groupName === 'Principal' ? 2 : 3,
                      '&.Mui-selected': {
                        backgroundColor: 'primary.main',
                        color: 'white',
                        '&:hover': {
                          backgroundColor: 'primary.dark',
                        },
                        '& .MuiListItemIcon-root': {
                          color: 'white',
                        },
                      },
                    }}
                  >
                    <ListItemIcon>
                      <Icon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary={item.text} />
                  </ListItemButton>
                </ListItem>
              )
            })}
          </div>
        ))}
      </List>
    </div>
  )

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {menuItems.find(item => item.path === location.pathname)?.text || 'Système de Gestion'}
          </Typography>
          <IconButton color="inherit" onClick={handleMenuClick}>
            <Avatar sx={{ width: 32, height: 32 }}>
              <AccountCircle />
            </Avatar>
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
          >
            <MenuItem disabled>
              <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                  {user?.name || 'Utilisateur'}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  {user?.role_name || 'Utilisateur'}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  {user?.email || 'Aucun email'}
                </Typography>
              </Box>
            </MenuItem>
            <MenuItem onClick={handleChangePasswordClick}>
              <LockIcon sx={{ mr: 1, fontSize: 20 }} />
              Changer le mot de passe
            </MenuItem>
            <MenuItem onClick={handleSignOut}>Déconnexion</MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
        }}
      >
        <Toolbar />
        <Outlet />
      </Box>

      {/* Change Password Dialog */}
      <Dialog 
        open={changePasswordOpen} 
        onClose={handlePasswordDialogClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <LockIcon sx={{ mr: 1 }} />
            Changer le mot de passe
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            {passwordError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {passwordError}
              </Alert>
            )}
            {passwordSuccess && (
              <Alert severity="success" sx={{ mb: 2 }}>
                {passwordSuccess}
              </Alert>
            )}
            
            <TextField
              fullWidth
              label="Mot de passe actuel"
              type={showPasswords.current ? 'text' : 'password'}
              value={passwordData.currentPassword}
              onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
              sx={{ mb: 2 }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                      edge="end"
                    >
                      {showPasswords.current ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
            
            <TextField
              fullWidth
              label="Nouveau mot de passe"
              type={showPasswords.new ? 'text' : 'password'}
              value={passwordData.newPassword}
              onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
              sx={{ mb: 2 }}
              helperText="Au moins 8 caractères avec majuscule, minuscule et chiffre"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                      edge="end"
                    >
                      {showPasswords.new ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
            
            <TextField
              fullWidth
              label="Confirmer le nouveau mot de passe"
              type={showPasswords.confirm ? 'text' : 'password'}
              value={passwordData.confirmPassword}
              onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                      edge="end"
                    >
                      {showPasswords.confirm ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handlePasswordDialogClose}>
            Annuler
          </Button>
          <Button 
            onClick={handlePasswordChange}
            variant="contained"
            disabled={passwordLoading || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
          >
            {passwordLoading ? 'Changement...' : 'Changer le mot de passe'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}