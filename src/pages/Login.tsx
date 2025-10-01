import React, { useState, useEffect } from 'react';
import {
  Box,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Container,
  Paper,
  InputAdornment,
  IconButton,
  Divider,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Email,
  Lock,
  Business,
  Login as LoginIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { authService, type LoginCredentials } from '../services/authService';
import { useAuth } from '../contexts/AuthContext';

const Login: React.FC = () => {
  const [credentials, setCredentials] = useState<LoginCredentials>({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const navigate = useNavigate();
  const { login } = useAuth();

  // Check if user is already authenticated
  useEffect(() => {
    if (authService.isAuthenticated()) {
      navigate('/dashboard');
    }
  }, [navigate]);

  const handleInputChange = (field: keyof LoginCredentials) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setCredentials({
      ...credentials,
      [field]: event.target.value,
    });
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Use the AuthContext login method instead of authService directly
      const result = await login(credentials.email, credentials.password);

      if (result.success) {
        // Successful login - redirect to dashboard
        navigate('/');
      } else {
        setError(result.message || 'Échec de la connexion');
      }
    } catch (err) {
      setError('Une erreur inattendue s\'est produite. Veuillez réessayer.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleDemoLogin = (demoType: 'admin' | 'commercial') => {
    const demoCredentials = {
      admin: { email: 'blal.brahim@gmail.com', password: 'admin123' }, // Super administrator
      commercial: { email: 'sahararevetement@gmail.com', password: '' }, // Commercial user
    };
    
    const creds = demoCredentials[demoType];
    setCredentials(creds);
  };

  const isFormValid = credentials.email.trim() !== '' && credentials.password.trim() !== '';

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: 2,
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={24}
          sx={{
            borderRadius: 3,
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <Box
            sx={{
              background: 'linear-gradient(45deg, #2196f3 30%, #21cbf3 90%)',
              color: 'white',
              padding: 4,
              textAlign: 'center',
            }}
          >
            <Box sx={{ margin: '0 auto 20px', textAlign: 'center' }}>
              <img src="/brand.svg" alt="planet marbre logo" style={{ width: 180, height: 'auto', maxWidth: '100%' }} />
            </Box>
            <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
              Connectez-vous à votre compte
            </Typography>
          </Box>

          {/* Login Form */}
          <CardContent sx={{ padding: 4 }}>
            <Box component="form" onSubmit={handleSubmit} noValidate>
              {/* Error Alert */}
              {error && (
                <Alert
                  severity="error"
                  sx={{ 
                    marginBottom: 3,
                    borderRadius: 2,
                  }}
                  onClose={() => setError('')}
                >
                  {error}
                </Alert>
              )}

              {/* Email Field */}
              <TextField
                fullWidth
                label="Adresse email"
                type="email"
                value={credentials.email}
                onChange={handleInputChange('email')}
                disabled={loading}
                required
                autoComplete="email"
                autoFocus
                sx={{ marginBottom: 3 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Email color="action" />
                    </InputAdornment>
                  ),
                }}
                error={error.toLowerCase().includes('email')}
                helperText={
                  error.toLowerCase().includes('email') 
                    ? 'Veuillez vérifier votre adresse email'
                    : 'Entrez votre adresse email professionnelle'
                }
              />

              {/* Password Field */}
              <TextField
                fullWidth
                label="Mot de passe"
                type={showPassword ? 'text' : 'password'}
                value={credentials.password}
                onChange={handleInputChange('password')}
                disabled={loading}
                required
                autoComplete="current-password"
                sx={{ marginBottom: 4 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={handleTogglePasswordVisibility}
                        edge="end"
                        disabled={loading}
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                error={error.toLowerCase().includes('mot de passe') || error.toLowerCase().includes('password')}
                helperText={
                  error.toLowerCase().includes('mot de passe') || error.toLowerCase().includes('password')
                    ? 'Mot de passe incorrect'
                    : 'Entrez votre mot de passe'
                }
              />

              {/* Login Button */}
              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={!isFormValid || loading}
                sx={{
                  height: 56,
                  borderRadius: 2,
                  fontSize: '1.1rem',
                  fontWeight: 'bold',
                  background: 'linear-gradient(45deg, #2196f3 30%, #21cbf3 90%)',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #1976d2 30%, #0d7bb8 90%)',
                  },
                  '&:disabled': {
                    background: 'rgba(0,0,0,0.12)',
                  },
                }}
                startIcon={
                  loading ? (
                    <CircularProgress size={20} color="inherit" />
                  ) : (
                    <LoginIcon />
                  )
                }
              >
                {loading ? 'Connexion en cours...' : 'Se connecter'}
              </Button>

              <Divider sx={{ my: 3 }}>
                <Typography variant="body2" color="text.secondary">
                  Comptes de démonstration
                </Typography>
              </Divider>

              {/* Demo Credentials Buttons */}
              <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => handleDemoLogin('admin')}
                  disabled={loading}
                  sx={{ flex: 1 }}
                >
                  Démo Admin
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => handleDemoLogin('commercial')}
                  disabled={loading}
                  sx={{ flex: 1 }}
                >
                  Démo Commercial
                </Button>
              </Box>

              {/* Demo Credentials Info */}
              <Box
                sx={{
                  backgroundColor: 'rgba(33, 150, 243, 0.04)',
                  borderRadius: 2,
                  padding: 2,
                  border: '1px solid rgba(33, 150, 243, 0.12)',
                }}
              >
                <Typography variant="subtitle2" color="primary" gutterBottom>
                  Utilisateurs réels de la base de données :
                </Typography>
                <Typography variant="body2" component="div" sx={{ fontFamily: 'monospace' }}>
                  <strong>Super Admin (Admin User) :</strong><br />
                  Email: blal.brahim@gmail.com<br />
                  Mot de passe: admin123<br />
                  Rôle: Super administrator
                </Typography>
                <Typography variant="body2" component="div" sx={{ fontFamily: 'monospace', mt: 1 }}>
                  <strong>Commercial (Fatima MO) :</strong><br />
                  Email: sahararevetement@gmail.com<br />
                  Rôle: Commercial
                </Typography>
                <Typography variant="body2" component="div" sx={{ fontFamily: 'monospace', mt: 1, color: 'text.secondary' }}>
                  <em>Note: Le mot de passe admin123 a été configuré pour les tests</em>
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Paper>

        {/* Footer */}
        <Typography
          variant="body2"
          color="white"
          textAlign="center"
          sx={{
            mt: 3,
            opacity: 0.8,
          }}
        >
          © 2024 planet marbre. Tous droits réservés.
        </Typography>
      </Container>
    </Box>
  );
};

export default Login;