// PDF generation utilities and styles for the management system
import { StyleSheet } from '@react-pdf/renderer';

// Common styles for all PDF documents
export const commonStyles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 30,
    fontSize: 10,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 20,
    borderBottom: 2,
    borderBottomColor: '#2563eb',
    paddingBottom: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 10,
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  column: {
    flex: 1,
  },
  columnHalf: {
    flex: 0.5,
  },
  label: {
    fontSize: 9,
    color: '#6b7280',
    marginBottom: 2,
  },
  value: {
    fontSize: 10,
    color: '#1f2937',
    fontWeight: 'bold',
  },
  table: {
    width: '100%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  tableRow: {
    margin: 0,
    flexDirection: 'row',
  },
  tableHeader: {
    backgroundColor: '#f3f4f6',
    fontWeight: 'bold',
  },
  tableCell: {
    margin: 'auto',
    marginTop: 5,
    marginBottom: 5,
    fontSize: 9,
    padding: 5,
    borderStyle: 'solid',
    borderWidth: 0,
    borderRightWidth: 1,
    borderColor: '#e5e7eb',
    flex: 1,
  },
  tableCellLast: {
    borderRightWidth: 0,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    borderTop: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 10,
    fontSize: 8,
    color: '#6b7280',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  total: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 2,
    borderTopColor: '#2563eb',
    textAlign: 'right',
  },
  totalLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  totalAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2563eb',
  },
});

// Utility functions for PDF generation
export const formatCurrency = (amount: number, currency = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
};

export const formatDate = (date: string | Date): string => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export const formatDateTime = (date: string | Date): string => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Company information for headers
export const getCompanyInfo = () => ({
  name: 'Management System',
  address: '123 Business Street',
  city: 'Business City, BC 12345',
  phone: '+1 (555) 123-4567',
  email: 'info@managementsystem.com',
  website: 'www.managementsystem.com',
});