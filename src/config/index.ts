// Environment variables for the application
export const config = {
  api: {
    // MySQL API configuration
    baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
    timeout: 10000,
  },
  app: {
    name: 'Système de Gestion',
    version: '2.0.0',
    isDevelopment: import.meta.env.DEV,
    description: 'Modern management system built with React and MySQL'
  },
  auth: {
    tokenKey: 'auth_token',
    userKey: 'auth_user',
    tokenExpiry: '8h'
  }
} as const;

// Check if API is properly configured
export const isApiConfigured = () => {
  return !!config.api.baseUrl;
};