import React from 'react';
import { Document, Page, Text, View, pdf } from '@react-pdf/renderer';
import { commonStyles, formatCurrency, formatDate, getCompanyInfo } from '../../utils/pdfStyles';

interface ProductData {
  id: number;
  name: string;
  description?: string;
  price: number;
  cost_price?: number;
  sku?: string;
  category?: string;
  unit?: string;
  stock_quantity?: number;
  min_stock_level?: number;
  status: string;
  created_at: string;
}

interface ProductReportPDFProps {
  products: ProductData[];
  title?: string;
}

const ProductReportPDF: React.FC<ProductReportPDFProps> = ({ products, title = 'Products Report' }) => {
  const company = getCompanyInfo();
  const totalValue = products.reduce((sum, product) => sum + (product.price * (product.stock_quantity || 0)), 0);
  const lowStockProducts = products.filter(p => 
    p.min_stock_level && p.stock_quantity && p.stock_quantity <= p.min_stock_level
  );

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
            </View>
            <View style={[commonStyles.column, { alignItems: 'flex-end' }]}>
              <Text style={[commonStyles.title, { fontSize: 18, color: '#2563eb' }]}>
                {title}
              </Text>
              <Text style={commonStyles.subtitle}>{formatDate(new Date())}</Text>
            </View>
          </View>
        </View>

        {/* Summary */}
        <View style={commonStyles.section}>
          <Text style={commonStyles.sectionTitle}>Summary</Text>
          <View style={commonStyles.row}>
            <View style={commonStyles.columnHalf}>
              <Text style={commonStyles.label}>Total Products:</Text>
              <Text style={commonStyles.value}>{products.length}</Text>
            </View>
            <View style={commonStyles.columnHalf}>
              <Text style={commonStyles.label}>Active Products:</Text>
              <Text style={commonStyles.value}>
                {products.filter(p => p.status === 'active').length}
              </Text>
            </View>
          </View>
          <View style={commonStyles.row}>
            <View style={commonStyles.columnHalf}>
              <Text style={commonStyles.label}>Low Stock Items:</Text>
              <Text style={commonStyles.value}>{lowStockProducts.length}</Text>
            </View>
            <View style={commonStyles.columnHalf}>
              <Text style={commonStyles.label}>Total Inventory Value:</Text>
              <Text style={commonStyles.value}>{formatCurrency(totalValue)}</Text>
            </View>
          </View>
        </View>

        {/* Products Table */}
        <View style={commonStyles.section}>
          <Text style={commonStyles.sectionTitle}>Product List</Text>
          
          {/* Table Header */}
          <View style={[commonStyles.table]}>
            <View style={[commonStyles.tableRow, commonStyles.tableHeader]}>
              <View style={[commonStyles.tableCell, { flex: 2 }]}>
                <Text>Product Name</Text>
              </View>
              <View style={commonStyles.tableCell}>
                <Text>SKU</Text>
              </View>
              <View style={commonStyles.tableCell}>
                <Text>Category</Text>
              </View>
              <View style={commonStyles.tableCell}>
                <Text>Price</Text>
              </View>
              <View style={commonStyles.tableCell}>
                <Text>Stock</Text>
              </View>
              <View style={[commonStyles.tableCell, commonStyles.tableCellLast]}>
                <Text>Status</Text>
              </View>
            </View>

            {/* Table Rows */}
            {products.map((product) => (
              <View key={product.id} style={commonStyles.tableRow}>
                <View style={[commonStyles.tableCell, { flex: 2 }]}>
                  <Text>{product.name}</Text>
                </View>
                <View style={commonStyles.tableCell}>
                  <Text>{product.sku || '-'}</Text>
                </View>
                <View style={commonStyles.tableCell}>
                  <Text>{product.category || '-'}</Text>
                </View>
                <View style={commonStyles.tableCell}>
                  <Text>{formatCurrency(product.price)}</Text>
                </View>
                <View style={commonStyles.tableCell}>
                  <Text>{product.stock_quantity || 0} {product.unit || ''}</Text>
                </View>
                <View style={[commonStyles.tableCell, commonStyles.tableCellLast]}>
                  <Text>{product.status}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Low Stock Alert */}
        {lowStockProducts.length > 0 && (
          <View style={commonStyles.section}>
            <Text style={[commonStyles.sectionTitle, { color: '#dc2626' }]}>Low Stock Alert</Text>
            {lowStockProducts.map((product) => (
              <View key={product.id} style={commonStyles.row}>
                <Text style={[commonStyles.value, { color: '#dc2626' }]}>
                  {product.name} - Current: {product.stock_quantity}, Min: {product.min_stock_level}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Footer */}
        <View style={commonStyles.footer}>
          <Text>Generated on {formatDate(new Date())}</Text>
          <Text>{company.website}</Text>
        </View>
      </Page>
    </Document>
  );
};

// Function to generate and download products PDF report
export const downloadProductsReport = async (products: ProductData[], title = 'Products Report') => {
  const blob = await pdf(<ProductReportPDF products={products} title={title} />).toBlob();
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `products-report-${new Date().toISOString().split('T')[0]}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
};

export default ProductReportPDF;