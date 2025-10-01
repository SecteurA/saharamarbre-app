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
    borderBottom: '2pt solid #D32F2F',
    paddingBottom: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#D32F2F',
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
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#D32F2F',
    borderBottom: '1pt solid #CCCCCC',
    paddingBottom: 5,
  },
  summaryCards: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  summaryCard: {
    backgroundColor: '#FFF3E0',
    padding: 12,
    width: '23%',
    textAlign: 'center',
    border: '1pt solid #FFB74D',
  },
  summaryLabel: {
    fontSize: 8,
    color: '#666666',
    marginBottom: 3,
  },
  summaryValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#D32F2F',
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
    minHeight: 30,
    alignItems: 'center',
  },
  tableHeader: {
    backgroundColor: '#D32F2F',
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  tableCell: {
    padding: 6,
    fontSize: 8,
  },
  tableCellDate: {
    padding: 6,
    fontSize: 8,
    flex: 1,
  },
  tableCellDescription: {
    padding: 6,
    fontSize: 8,
    flex: 3,
  },
  tableCellCategory: {
    padding: 6,
    fontSize: 8,
    flex: 2,
  },
  tableCellAmount: {
    padding: 6,
    fontSize: 8,
    flex: 1,
    textAlign: 'right',
  },
  categorySection: {
    marginBottom: 15,
  },
  categoryTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#D32F2F',
    backgroundColor: '#FFF3E0',
    padding: 5,
  },
  totalSection: {
    marginTop: 20,
    backgroundColor: '#FFEBEE',
    padding: 15,
    border: '2pt solid #D32F2F',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  totalLabel: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  totalValue: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  grandTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#D32F2F',
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
  approvalSection: {
    marginTop: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  approvalBox: {
    width: '45%',
    textAlign: 'center',
  },
  approvalTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  approvalLine: {
    borderBottom: '1pt solid #000000',
    height: '40px',
    marginBottom: 5,
  }
});

interface ExpenseReportPDFProps {
  expenses: Array<{
    id: string;
    date_depense: string;
    description: string;
    montant: number;
    categorie: string;
    fournisseur?: string;
    numero_facture?: string;
    statut: string;
  }>;
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
  summary: {
    totalExpenses: number;
    totalCount: number;
    approvedAmount: number;
    pendingAmount: number;
    categorySummary: { [category: string]: number };
  };
}

export const ExpenseReportPDF: React.FC<ExpenseReportPDFProps> = ({
  expenses,
  period,
  company,
  summary
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





  // Group expenses by category
  const expensesByCategory = expenses.reduce((acc, expense) => {
    if (!acc[expense.categorie]) {
      acc[expense.categorie] = [];
    }
    acc[expense.categorie].push(expense);
    return acc;
  }, {} as { [category: string]: typeof expenses });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>RAPPORT DE DÉPENSES</Text>
          <Text style={styles.subtitle}>
            {company?.nom || 'Votre Entreprise'}
          </Text>
          <Text style={styles.reportPeriod}>
            {period.label} | Du {formatDate(period.startDate)} au {formatDate(period.endDate)}
          </Text>
        </View>

        {/* Summary Cards */}
        <View style={styles.summaryCards}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Total Dépenses</Text>
            <Text style={styles.summaryValue}>{formatCurrency(summary.totalExpenses)}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Nombre</Text>
            <Text style={styles.summaryValue}>{summary.totalCount}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Approuvé</Text>
            <Text style={styles.summaryValue}>{formatCurrency(summary.approvedAmount)}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>En attente</Text>
            <Text style={styles.summaryValue}>{formatCurrency(summary.pendingAmount)}</Text>
          </View>
        </View>

        {/* Expenses by Category */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Détail des Dépenses par Catégorie</Text>
          
          {Object.entries(expensesByCategory).map(([category, categoryExpenses]) => (
            <View key={category} style={styles.categorySection}>
              <Text style={styles.categoryTitle}>
                {category.toUpperCase()} - {formatCurrency(summary.categorySummary[category] || 0)}
              </Text>
              
              <View style={styles.table}>
                <View style={[styles.tableRow, styles.tableHeader]}>
                  <Text style={styles.tableCellDate}>Date</Text>
                  <Text style={styles.tableCellDescription}>Description</Text>
                  <Text style={styles.tableCellCategory}>Fournisseur</Text>
                  <Text style={styles.tableCellAmount}>Montant</Text>
                </View>
                
                {categoryExpenses.map((expense) => (
                  <View key={expense.id} style={styles.tableRow}>
                    <Text style={styles.tableCellDate}>
                      {formatDate(expense.date_depense)}
                    </Text>
                    <Text style={styles.tableCellDescription}>
                      {expense.description}
                      {expense.numero_facture && (
                        <Text style={{ fontSize: 7, color: '#666' }}>
                          {'\n'}Facture: {expense.numero_facture}
                        </Text>
                      )}
                    </Text>
                    <Text style={styles.tableCellCategory}>
                      {expense.fournisseur || '-'}
                    </Text>
                    <Text style={styles.tableCellAmount}>
                      {formatCurrency(expense.montant)}
                    </Text>
                  </View>
                ))}
                
                {/* Category Subtotal */}
                <View style={[styles.tableRow, { backgroundColor: '#FFF3E0' }]}>
                  <Text style={styles.tableCellDate}></Text>
                  <Text style={[styles.tableCellDescription, { fontWeight: 'bold' }]}>
                    Sous-total {category}
                  </Text>
                  <Text style={styles.tableCellCategory}></Text>
                  <Text style={[styles.tableCellAmount, { fontWeight: 'bold' }]}>
                    {formatCurrency(summary.categorySummary[category] || 0)}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Grand Total */}
        <View style={styles.totalSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Général:</Text>
            <Text style={[styles.totalValue, styles.grandTotal]}>
              {formatCurrency(summary.totalExpenses)}
            </Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Montant Approuvé:</Text>
            <Text style={styles.totalValue}>
              {formatCurrency(summary.approvedAmount)}
            </Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>En Attente d'Approbation:</Text>
            <Text style={styles.totalValue}>
              {formatCurrency(summary.pendingAmount)}
            </Text>
          </View>
        </View>

        {/* Approval Section */}
        <View style={styles.approvalSection}>
          <View style={styles.approvalBox}>
            <Text style={styles.approvalTitle}>Préparé par:</Text>
            <View style={styles.approvalLine}></View>
            <Text style={styles.summaryLabel}>Nom et signature</Text>
          </View>
          
          <View style={styles.approvalBox}>
            <Text style={styles.approvalTitle}>Approuvé par:</Text>
            <View style={styles.approvalLine}></View>
            <Text style={styles.summaryLabel}>Nom et signature</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>
            Rapport généré le {formatDate(new Date().toISOString())} | 
            {company?.nom || 'Votre Entreprise'} | 
            Document confidentiel
          </Text>
        </View>
      </Page>
    </Document>
  );
};