import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 30,
    fontSize: 10,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 30,
    textAlign: 'center',
    borderBottom: '2pt solid #1976d2',
    paddingBottom: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#1976d2',
  },
  subtitle: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 5,
  },
  reportPeriod: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#000000',
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#1976d2',
    borderBottom: '2pt solid #1976d2',
    paddingBottom: 5,
  },
  subSectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333333',
    backgroundColor: '#F5F5F5',
    padding: 5,
  },
  table: {
    width: '100%',
    marginBottom: 15,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomColor: '#CCCCCC',
    borderBottomWidth: 1,
    minHeight: 25,
    alignItems: 'center',
  },
  tableHeader: {
    backgroundColor: '#1976d2',
    color: '#FFFFFF',
    fontWeight: 'bold',
    borderBottomWidth: 2,
  },
  tableCellLabel: {
    padding: 8,
    fontSize: 10,
    flex: 3,
  },
  tableCellValue: {
    padding: 8,
    fontSize: 10,
    flex: 2,
    textAlign: 'right',
    fontWeight: 'bold',
  },
  tableCellPercent: {
    padding: 8,
    fontSize: 9,
    flex: 1,
    textAlign: 'right',
    color: '#666666',
  },
  totalRow: {
    backgroundColor: '#E3F2FD',
    borderTopWidth: 2,
    borderTopColor: '#1976d2',
  },
  grandTotalRow: {
    backgroundColor: '#1976d2',
    color: '#FFFFFF',
  },
  profitLossSection: {
    backgroundColor: '#F8F9FA',
    padding: 15,
    marginBottom: 20,
    border: '1pt solid #DEE2E6',
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    padding: 12,
    width: '24%',
    textAlign: 'center',
    border: '1pt solid #1976d2',
  },
  summaryLabel: {
    fontSize: 8,
    color: '#666666',
    marginBottom: 3,
  },
  summaryValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1976d2',
  },
  positiveValue: {
    color: '#4CAF50',
  },
  negativeValue: {
    color: '#F44336',
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
  noteSection: {
    marginTop: 15,
    padding: 10,
    backgroundColor: '#FFF9C4',
    border: '1pt solid #FBC02D',
  },
  noteTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#F57C00',
  },
  noteText: {
    fontSize: 8,
    color: '#5D4037',
    lineHeight: 1.3,
  }
});

interface FinancialStatementPDFProps {
  period: {
    startDate: string;
    endDate: string;
    label: string;
  };
  company?: {
    nom: string;
    adresse?: string;
    telephone?: string;
    email?: string;
    siret?: string;
  };
  data: {
    revenues: {
      sales: number;
      services: number;
      other: number;
      total: number;
    };
    expenses: {
      supplies: number;
      salaries: number;
      rent: number;
      utilities: number;
      marketing: number;
      transport: number;
      other: number;
      total: number;
    };
    assets: {
      cash: number;
      accounts_receivable: number;
      inventory: number;
      equipment: number;
      total: number;
    };
    liabilities: {
      accounts_payable: number;
      loans: number;
      taxes_payable: number;
      total: number;
    };
    equity: {
      capital: number;
      retained_earnings: number;
      total: number;
    };
  };
  previousPeriod?: {
    revenues: number;
    expenses: number;
    netIncome: number;
  };
}

export const FinancialStatementPDF: React.FC<FinancialStatementPDFProps> = ({
  period,
  company,
  data,
  previousPeriod
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const calculatePercentage = (amount: number, total: number) => {
    if (total === 0) return '0.0%';
    return ((amount / total) * 100).toFixed(1) + '%';
  };

  const netIncome = data.revenues.total - data.expenses.total;
  const profitMargin = data.revenues.total > 0 ? (netIncome / data.revenues.total) * 100 : 0;

  // Calculate growth rates if previous period data is available
  const revenueGrowth = previousPeriod ? 
    ((data.revenues.total - previousPeriod.revenues) / previousPeriod.revenues) * 100 : 0;
  const expenseGrowth = previousPeriod ? 
    ((data.expenses.total - previousPeriod.expenses) / previousPeriod.expenses) * 100 : 0;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>ÉTATS FINANCIERS</Text>
          <Text style={styles.subtitle}>
            {company?.nom || 'Votre Entreprise'}
          </Text>
          <Text style={styles.reportPeriod}>
            Période: Du {formatDate(period.startDate)} au {formatDate(period.endDate)}
          </Text>
        </View>

        {/* Financial Summary Cards */}
        <View style={styles.summaryGrid}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Chiffre d'Affaires</Text>
            <Text style={styles.summaryValue}>{formatCurrency(data.revenues.total)}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Charges Totales</Text>
            <Text style={styles.summaryValue}>{formatCurrency(data.expenses.total)}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Résultat Net</Text>
            <Text style={[styles.summaryValue, netIncome >= 0 ? styles.positiveValue : styles.negativeValue]}>
              {formatCurrency(netIncome)}
            </Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Marge Nette</Text>
            <Text style={[styles.summaryValue, profitMargin >= 0 ? styles.positiveValue : styles.negativeValue]}>
              {profitMargin.toFixed(1)}%
            </Text>
          </View>
        </View>

        {/* Profit & Loss Statement */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>COMPTE DE RÉSULTAT</Text>
          
          {/* Revenues */}
          <Text style={styles.subSectionTitle}>PRODUITS</Text>
          <View style={styles.table}>
            <View style={styles.tableRow}>
              <Text style={styles.tableCellLabel}>Ventes de marchandises</Text>
              <Text style={styles.tableCellValue}>{formatCurrency(data.revenues.sales)}</Text>
              <Text style={styles.tableCellPercent}>
                {calculatePercentage(data.revenues.sales, data.revenues.total)}
              </Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.tableCellLabel}>Prestations de services</Text>
              <Text style={styles.tableCellValue}>{formatCurrency(data.revenues.services)}</Text>
              <Text style={styles.tableCellPercent}>
                {calculatePercentage(data.revenues.services, data.revenues.total)}
              </Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.tableCellLabel}>Autres produits</Text>
              <Text style={styles.tableCellValue}>{formatCurrency(data.revenues.other)}</Text>
              <Text style={styles.tableCellPercent}>
                {calculatePercentage(data.revenues.other, data.revenues.total)}
              </Text>
            </View>
            <View style={[styles.tableRow, styles.totalRow]}>
              <Text style={[styles.tableCellLabel, { fontWeight: 'bold' }]}>TOTAL PRODUITS</Text>
              <Text style={[styles.tableCellValue, { fontWeight: 'bold' }]}>
                {formatCurrency(data.revenues.total)}
              </Text>
              <Text style={styles.tableCellPercent}>100.0%</Text>
            </View>
          </View>

          {/* Expenses */}
          <Text style={styles.subSectionTitle}>CHARGES</Text>
          <View style={styles.table}>
            <View style={styles.tableRow}>
              <Text style={styles.tableCellLabel}>Achats et approvisionnements</Text>
              <Text style={styles.tableCellValue}>{formatCurrency(data.expenses.supplies)}</Text>
              <Text style={styles.tableCellPercent}>
                {calculatePercentage(data.expenses.supplies, data.revenues.total)}
              </Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.tableCellLabel}>Charges de personnel</Text>
              <Text style={styles.tableCellValue}>{formatCurrency(data.expenses.salaries)}</Text>
              <Text style={styles.tableCellPercent}>
                {calculatePercentage(data.expenses.salaries, data.revenues.total)}
              </Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.tableCellLabel}>Loyers</Text>
              <Text style={styles.tableCellValue}>{formatCurrency(data.expenses.rent)}</Text>
              <Text style={styles.tableCellPercent}>
                {calculatePercentage(data.expenses.rent, data.revenues.total)}
              </Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.tableCellLabel}>Services publics</Text>
              <Text style={styles.tableCellValue}>{formatCurrency(data.expenses.utilities)}</Text>
              <Text style={styles.tableCellPercent}>
                {calculatePercentage(data.expenses.utilities, data.revenues.total)}
              </Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.tableCellLabel}>Marketing et publicité</Text>
              <Text style={styles.tableCellValue}>{formatCurrency(data.expenses.marketing)}</Text>
              <Text style={styles.tableCellPercent}>
                {calculatePercentage(data.expenses.marketing, data.revenues.total)}
              </Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.tableCellLabel}>Transport</Text>
              <Text style={styles.tableCellValue}>{formatCurrency(data.expenses.transport)}</Text>
              <Text style={styles.tableCellPercent}>
                {calculatePercentage(data.expenses.transport, data.revenues.total)}
              </Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.tableCellLabel}>Autres charges</Text>
              <Text style={styles.tableCellValue}>{formatCurrency(data.expenses.other)}</Text>
              <Text style={styles.tableCellPercent}>
                {calculatePercentage(data.expenses.other, data.revenues.total)}
              </Text>
            </View>
            <View style={[styles.tableRow, styles.totalRow]}>
              <Text style={[styles.tableCellLabel, { fontWeight: 'bold' }]}>TOTAL CHARGES</Text>
              <Text style={[styles.tableCellValue, { fontWeight: 'bold' }]}>
                {formatCurrency(data.expenses.total)}
              </Text>
              <Text style={styles.tableCellPercent}>
                {calculatePercentage(data.expenses.total, data.revenues.total)}
              </Text>
            </View>
            
            {/* Net Result */}
            <View style={[styles.tableRow, styles.grandTotalRow]}>
              <Text style={[styles.tableCellLabel, { fontWeight: 'bold', color: '#FFFFFF' }]}>
                RÉSULTAT NET
              </Text>
              <Text style={[styles.tableCellValue, { fontWeight: 'bold', color: '#FFFFFF' }]}>
                {formatCurrency(netIncome)}
              </Text>
              <Text style={[styles.tableCellPercent, { color: '#FFFFFF' }]}>
                {profitMargin.toFixed(1)}%
              </Text>
            </View>
          </View>
        </View>

        {/* Notes and Analysis */}
        <View style={styles.noteSection}>
          <Text style={styles.noteTitle}>ANALYSE FINANCIÈRE</Text>
          <Text style={styles.noteText}>
            • Marge brute: {((data.revenues.total - data.expenses.supplies) / data.revenues.total * 100).toFixed(1)}%
            {'\n'}• Taux de charges: {(data.expenses.total / data.revenues.total * 100).toFixed(1)}%
            {previousPeriod && (
              `\n• Croissance du CA: ${revenueGrowth >= 0 ? '+' : ''}${revenueGrowth.toFixed(1)}%
              \n• Évolution des charges: ${expenseGrowth >= 0 ? '+' : ''}${expenseGrowth.toFixed(1)}%`
            )}
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>
            États financiers générés le {formatDate(new Date().toISOString())} | 
            {company?.nom || 'Votre Entreprise'} | 
            Document confidentiel
          </Text>
        </View>
      </Page>
    </Document>
  );
};