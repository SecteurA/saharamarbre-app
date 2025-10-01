import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

// Define styles for the PDF
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 30,
    fontSize: 10,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 20,
    textAlign: 'center',
    borderBottom: '1pt solid #000000',
    paddingBottom: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 12,
    color: '#666666',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
    borderBottom: '1pt solid #CCCCCC',
    paddingBottom: 5,
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  summaryCard: {
    backgroundColor: '#F5F5F5',
    padding: 10,
    width: '22%',
    textAlign: 'center',
    border: '1pt solid #DDDDDD',
  },
  summaryLabel: {
    fontSize: 9,
    color: '#666666',
    marginBottom: 3,
  },
  summaryValue: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  summaryChange: {
    fontSize: 8,
    color: '#27AE60',
  },
  table: {
    width: '100%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#CCCCCC',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomColor: '#CCCCCC',
    borderBottomWidth: 1,
  },
  tableHeader: {
    backgroundColor: '#F8F9FA',
    fontWeight: 'bold',
  },
  tableCell: {
    padding: 8,
    flex: 1,
    fontSize: 9,
  },
  tableCellRight: {
    padding: 8,
    flex: 1,
    fontSize: 9,
    textAlign: 'right',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    fontSize: 8,
    color: '#666666',
    borderTop: '1pt solid #CCCCCC',
    paddingTop: 10,
  },
  alertBox: {
    backgroundColor: '#FFF3CD',
    border: '1pt solid #FFEAA7',
    padding: 10,
    marginBottom: 10,
  },
  alertText: {
    fontSize: 9,
    color: '#856404',
  },
});

interface ReportPDFProps {
  reportData: {
    period: string;
    totalRevenue: number;
    totalOrders: number;
    totalClients: number;
    totalProducts: number;
    averageOrderValue: number;
    topProducts: Array<{
      name: string;
      sales: number;
      revenue: number;
    }>;
    topClients: Array<{
      name: string;
      orders: number;
      revenue: number;
    }>;
    pendingPayments: number;
    overduePayments: number;
    lowStockItems: number;
  };
  reportType: string;
}

export const ReportPDF: React.FC<ReportPDFProps> = ({ reportData, reportType }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = () => {
    return new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Management System Report</Text>
          <Text style={styles.subtitle}>
            {reportType} - Generated on {formatDate()}
          </Text>
          <Text style={styles.subtitle}>
            Period: {reportData.period}
          </Text>
        </View>

        {/* Summary Cards */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Executive Summary</Text>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Total Revenue</Text>
              <Text style={styles.summaryValue}>{formatCurrency(reportData.totalRevenue)}</Text>
              <Text style={styles.summaryChange}>+12.5% vs last period</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Total Orders</Text>
              <Text style={styles.summaryValue}>{reportData.totalOrders}</Text>
              <Text style={styles.summaryChange}>+8.2% vs last period</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Avg Order Value</Text>
              <Text style={styles.summaryValue}>{formatCurrency(reportData.averageOrderValue)}</Text>
              <Text style={styles.summaryChange}>+5.1% vs last period</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Active Clients</Text>
              <Text style={styles.summaryValue}>{reportData.totalClients}</Text>
              <Text style={styles.summaryChange}>+3.4% vs last period</Text>
            </View>
          </View>
        </View>

        {/* Alerts */}
        {(reportData.overduePayments > 0 || reportData.lowStockItems > 0 || reportData.pendingPayments > 0) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Alerts & Notifications</Text>
            {reportData.overduePayments > 0 && (
              <View style={styles.alertBox}>
                <Text style={styles.alertText}>
                  ⚠️ {reportData.overduePayments} overdue payments requiring immediate attention
                </Text>
              </View>
            )}
            {reportData.lowStockItems > 0 && (
              <View style={styles.alertBox}>
                <Text style={styles.alertText}>
                  ⚠️ {reportData.lowStockItems} items with low stock levels
                </Text>
              </View>
            )}
            {reportData.pendingPayments > 0 && (
              <View style={styles.alertBox}>
                <Text style={styles.alertText}>
                  ℹ️ {reportData.pendingPayments} pending payments to process
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Top Products */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Top Performing Products</Text>
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text style={styles.tableCell}>Product Name</Text>
              <Text style={styles.tableCellRight}>Units Sold</Text>
              <Text style={styles.tableCellRight}>Revenue</Text>
              <Text style={styles.tableCellRight}>Profit Margin</Text>
            </View>
            {reportData.topProducts.map((product, index) => (
              <View key={index} style={styles.tableRow}>
                <Text style={styles.tableCell}>{product.name}</Text>
                <Text style={styles.tableCellRight}>{product.sales}</Text>
                <Text style={styles.tableCellRight}>{formatCurrency(product.revenue)}</Text>
                <Text style={styles.tableCellRight}>32%</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Top Clients */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Top Clients by Revenue</Text>
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text style={styles.tableCell}>Client Name</Text>
              <Text style={styles.tableCellRight}>Orders</Text>
              <Text style={styles.tableCellRight}>Revenue</Text>
              <Text style={styles.tableCellRight}>Avg Order Value</Text>
            </View>
            {reportData.topClients.map((client, index) => (
              <View key={index} style={styles.tableRow}>
                <Text style={styles.tableCell}>{client.name}</Text>
                <Text style={styles.tableCellRight}>{client.orders}</Text>
                <Text style={styles.tableCellRight}>{formatCurrency(client.revenue)}</Text>
                <Text style={styles.tableCellRight}>{formatCurrency(client.revenue / client.orders)}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Key Insights */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Key Insights & Recommendations</Text>
          <Text style={{ marginBottom: 5, fontSize: 9 }}>
            • Revenue growth of 12.5% indicates strong business performance
          </Text>
          <Text style={{ marginBottom: 5, fontSize: 9 }}>
            • Order volume increase of 8.2% shows consistent customer demand
          </Text>
          <Text style={{ marginBottom: 5, fontSize: 9 }}>
            • Average order value growth of 5.1% suggests effective upselling
          </Text>
          <Text style={{ marginBottom: 5, fontSize: 9 }}>
            • Client base growth of 3.4% indicates successful customer acquisition
          </Text>
          {reportData.overduePayments > 0 && (
            <Text style={{ marginBottom: 5, fontSize: 9, color: '#D32F2F' }}>
              • Immediate action required for {reportData.overduePayments} overdue payments
            </Text>
          )}
          {reportData.lowStockItems > 0 && (
            <Text style={{ marginBottom: 5, fontSize: 9, color: '#F57C00' }}>
              • Inventory replenishment needed for {reportData.lowStockItems} items
            </Text>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>
            Generated by Management System | {formatDate()} | Confidential Business Report
          </Text>
        </View>
      </Page>
    </Document>
  );
};