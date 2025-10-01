// config/config.ts - Configuration file (replaces Supabase config)
import { config as mainConfig } from './index';

// MySQL/API configuration for services that previously used Supabase
export const config = {
  ...mainConfig,
  database: {
    type: 'mysql',
    host: import.meta.env.VITE_DB_HOST || 'localhost',
    port: import.meta.env.VITE_DB_PORT || 3306,
    database: import.meta.env.VITE_DB_NAME || 'gestion_db',
    username: import.meta.env.VITE_DB_USER || 'root',
    // Note: Password should be handled server-side only
  },
  storage: {
    // File upload configuration
    endpoint: import.meta.env.VITE_STORAGE_URL || 'http://localhost:3001/uploads',
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['image/jpeg', 'image/png', 'application/pdf']
  }
};

// Demo mode configuration
export const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true';
export const isConfigured = !!config.api.baseUrl;

// Helper functions for backward compatibility
export const getConfig = () => config;
export const getApiConfig = () => config.api;