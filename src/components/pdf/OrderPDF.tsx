import React from 'react';
import { Document, Page, Text, View } from '@react-pdf/renderer';
import { commonStyles, formatCurrency, formatDate, getCompanyInfo } from '../../utils/pdfStyles';

interface OrderItem {
  id?: number;
  product_id: number;
  quantity: number;
  unit_price: number;
  total_price: number;
  product?: {
    id: number;
    name: string;
    unit?: string;
  };
}

interface OrderData {
  id: number;
  order_number?: string | null;
  client_id: number;
  company_id?: number | null;
  order_date: string;
  delivery_date?: string | null;
  status: string;
  subtotal?: number;
  tax_amount?: number;
  total_amount?: number;
  notes?: string | null;
  client?: {
    id: number;
    name: string;
    address?: string | null;
    city?: string;
    phone?: string;
    email?: string;
  };
  company?: {
    id: number;
    name: string;
  };
  order_items?: OrderItem[];
}

interface OrderPDFProps {
  order: OrderData;
  isQuote?: boolean;
}

const OrderPDF: React.FC<OrderPDFProps> = ({ order, isQuote = false }) => {
  const company = getCompanyInfo();
  const documentTitle = isQuote ? 'QUOTE' : 'ORDER';

  return (
    <Document>
      <Page size="A4" style={commonStyles.page}>
        {/* Header */}
        <View style={commonStyles.header}>
          <View style={commonStyles.row}>
            <View style={[commonStyles.column, { flex: 2 }]}>
              <Text style={commonStyles.title}>{company.name}</Text>
              <Text style={commonStyles.subtitle}>{company.address}</Text>
              <Text style={commonStyles.subtitle}>{company.city}</Text>
              <Text style={commonStyles.subtitle}>{company.phone} • {company.email}</Text>
            </View>
            <View style={[commonStyles.column, { flex: 1, alignItems: 'flex-end' }]}>
              <Text style={commonStyles.title}>{documentTitle}</Text>
              <Text style={commonStyles.subtitle}>#{order.order_number}</Text>
              <Text style={commonStyles.subtitle}>{formatDate(order.order_date)}</Text>
              <Text style={commonStyles.subtitle}>Status: {order.status.toUpperCase()}</Text>
            </View>
          </View>
        </View>

        {/* Bill To Section */}
        <View style={commonStyles.section}>
          <Text style={commonStyles.label}>Bill To:</Text>
          <Text style={commonStyles.value}>{order.client?.name || 'Unknown Client'}</Text>
          {order.client?.address && <Text style={commonStyles.subtitle}>{order.client.address}</Text>}
          {order.client?.city && <Text style={commonStyles.subtitle}>{order.client.city}</Text>}
          {order.client?.phone && <Text style={commonStyles.subtitle}>Phone: {order.client.phone}</Text>}
          {order.client?.email && <Text style={commonStyles.subtitle}>Email: {order.client.email}</Text>}
        </View>

        {/* Order Details */}
        <View style={commonStyles.section}>
          <View style={commonStyles.row}>
            <View style={[commonStyles.column, { flex: 1 }]}>
              <Text style={commonStyles.label}>{isQuote ? 'Quote' : 'Order'} Date:</Text>
              <Text style={commonStyles.value}>{formatDate(order.order_date)}</Text>
            </View>
            {order.delivery_date && (
              <View style={[commonStyles.column, { flex: 1 }]}>
                <Text style={commonStyles.label}>{isQuote ? 'Valid Until:' : 'Delivery Date:'}</Text>
                <Text style={commonStyles.value}>{formatDate(order.delivery_date)}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Items Table */}
        <View style={commonStyles.table}>
          {/* Table Header */}
          <View style={commonStyles.tableHeader}>
            <View style={[commonStyles.tableCell, { flex: 2 }]}>
              <Text>Product</Text>
            </View>
            <View style={commonStyles.tableCell}>
              <Text>Qty</Text>
            </View>
            <View style={commonStyles.tableCell}>
              <Text>Unit Price</Text>
            </View>
            <View style={commonStyles.tableCell}>
              <Text>Total</Text>
            </View>
          </View>
          
          {/* Table Rows */}
          {(order.order_items || []).map((item, index) => (
            <View key={item.id || index} style={commonStyles.tableRow}>
              <View style={[commonStyles.tableCell, { flex: 2 }]}>
                <Text>{item.product?.name || 'Unknown Product'}</Text>
              </View>
              <View style={commonStyles.tableCell}>
                <Text>{item.quantity}</Text>
              </View>
              <View style={commonStyles.tableCell}>
                <Text>{formatCurrency(item.unit_price)}</Text>
              </View>
              <View style={[commonStyles.tableCell, commonStyles.tableCellLast]}>
                <Text>{formatCurrency(item.total_price)}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={[commonStyles.section, { alignItems: 'flex-end' }]}>
          <View style={[commonStyles.row, { width: '50%' }]}>
            <Text style={[commonStyles.label, { flex: 1 }]}>Subtotal:</Text>
            <Text style={commonStyles.value}>{formatCurrency(order.subtotal || order.total_amount || 0)}</Text>
          </View>
          {order.tax_amount && (
            <View style={[commonStyles.row, { width: '50%' }]}>
              <Text style={[commonStyles.label, { flex: 1 }]}>Tax:</Text>
              <Text style={commonStyles.value}>{formatCurrency(order.tax_amount)}</Text>
            </View>
          )}
          <View style={[commonStyles.row, { width: '50%', borderTopWidth: 1, paddingTop: 5 }]}>
            <Text style={[commonStyles.title, { flex: 1 }]}>Total:</Text>
            <Text style={commonStyles.title}>{formatCurrency(order.total_amount || 0)}</Text>
          </View>
        </View>

        {/* Notes */}
        {order.notes && (
          <View style={commonStyles.section}>
            <Text style={commonStyles.label}>Notes:</Text>
            <Text style={commonStyles.value}>{order.notes}</Text>
          </View>
        )}

        {/* Footer */}
        <View style={commonStyles.footer}>
          <Text style={commonStyles.subtitle}>
            Thank you for your business! For questions, contact us at {company.email} or {company.phone}
          </Text>
        </View>
      </Page>
    </Document>
  );
};

export default OrderPDF;