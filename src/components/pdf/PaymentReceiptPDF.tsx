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
    borderBottom: '2pt solid #000000',
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
  receiptNumber: {
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
    color: '#1976d2',
    borderBottom: '1pt solid #CCCCCC',
    paddingBottom: 5,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 5,
  },
  infoGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  infoBox: {
    backgroundColor: '#F8F9FA',
    padding: 15,
    width: '48%',
    border: '1pt solid #E0E0E0',
  },
  infoLabel: {
    fontSize: 9,
    color: '#666666',
    marginBottom: 3,
  },
  infoValue: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#000000',
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
    backgroundColor: '#1976d2',
    color: '#FFFFFF',
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
  totalSection: {
    marginTop: 20,
    backgroundColor: '#F0F8FF',
    padding: 15,
    border: '2pt solid #1976d2',
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
    color: '#1976d2',
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
  signature: {
    marginTop: 30,
    textAlign: 'center',
  },
  signatureLine: {
    borderBottom: '1pt solid #000000',
    width: '200px',
    height: '40px',
    margin: '0 auto',
    marginBottom: 5,
  },
  stampBox: {
    position: 'absolute',
    right: 30,
    bottom: 100,
    width: '100px',
    height: '60px',
    border: '2pt solid #1976d2',
    textAlign: 'center',
    paddingTop: 20,
    fontSize: 8,
    color: '#1976d2',
  }
});

interface PaymentReceiptPDFProps {
  payment: {
    id: string;
    numero_recu?: string;
    montant: number;
    date_paiement: string;
    mode_paiement: string;
    statut: string;
    reference?: string;
    notes?: string;
  };
  client?: {
    nom: string;
    email?: string;
    telephone?: string;
    adresse?: string;
  };
  order?: {
    numero_commande: string;
    total: number;
    date_commande: string;
  };
  company?: {
    nom: string;
    adresse?: string;
    telephone?: string;
    email?: string;
    siret?: string;
  };
}

export const PaymentReceiptPDF: React.FC<PaymentReceiptPDFProps> = ({
  payment,
  client,
  order,
  company
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getPaymentMethodText = (method: string) => {
    const methods: { [key: string]: string } = {
      'especes': 'Espèces',
      'cheque': 'Chèque',
      'carte': 'Carte bancaire',
      'virement': 'Virement bancaire',
      'prelevement': 'Prélèvement'
    };
    return methods[method] || method;
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>REÇU DE PAIEMENT</Text>
          <Text style={styles.subtitle}>
            {company?.nom || 'Votre Entreprise'}
          </Text>
          <Text style={styles.receiptNumber}>
            N° {payment.numero_recu || payment.id}
          </Text>
        </View>

        {/* Company and Client Info */}
        <View style={styles.infoGrid}>
          <View style={styles.infoBox}>
            <Text style={styles.sectionTitle}>Émetteur</Text>
            <Text style={styles.infoValue}>{company?.nom || 'Votre Entreprise'}</Text>
            {company?.adresse && <Text style={styles.infoValue}>{company.adresse}</Text>}
            {company?.telephone && (
              <View style={styles.row}>
                <Text style={styles.infoLabel}>Tél:</Text>
                <Text style={styles.infoValue}>{company.telephone}</Text>
              </View>
            )}
            {company?.email && (
              <View style={styles.row}>
                <Text style={styles.infoLabel}>Email:</Text>
                <Text style={styles.infoValue}>{company.email}</Text>
              </View>
            )}
            {company?.siret && (
              <View style={styles.row}>
                <Text style={styles.infoLabel}>SIRET:</Text>
                <Text style={styles.infoValue}>{company.siret}</Text>
              </View>
            )}
          </View>

          <View style={styles.infoBox}>
            <Text style={styles.sectionTitle}>Payé par</Text>
            <Text style={styles.infoValue}>{client?.nom || 'Client'}</Text>
            {client?.adresse && <Text style={styles.infoValue}>{client.adresse}</Text>}
            {client?.telephone && (
              <View style={styles.row}>
                <Text style={styles.infoLabel}>Tél:</Text>
                <Text style={styles.infoValue}>{client.telephone}</Text>
              </View>
            )}
            {client?.email && (
              <View style={styles.row}>
                <Text style={styles.infoLabel}>Email:</Text>
                <Text style={styles.infoValue}>{client.email}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Payment Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Détails du Paiement</Text>
          <View style={styles.table}>
            <View style={styles.tableRow}>
              <View style={styles.tableCell}>
                <Text style={styles.infoLabel}>Date de paiement:</Text>
                <Text style={styles.infoValue}>{formatDate(payment.date_paiement)}</Text>
              </View>
              <View style={styles.tableCell}>
                <Text style={styles.infoLabel}>Mode de paiement:</Text>
                <Text style={styles.infoValue}>{getPaymentMethodText(payment.mode_paiement)}</Text>
              </View>
            </View>
            {payment.reference && (
              <View style={styles.tableRow}>
                <View style={styles.tableCell}>
                  <Text style={styles.infoLabel}>Référence:</Text>
                  <Text style={styles.infoValue}>{payment.reference}</Text>
                </View>
                <View style={styles.tableCell}>
                  <Text style={styles.infoLabel}>Statut:</Text>
                  <Text style={styles.infoValue}>
                    {payment.statut === 'valide' ? 'Validé' : payment.statut}
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Order Reference */}
        {order && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Commande Associée</Text>
            <View style={styles.row}>
              <Text style={styles.infoLabel}>N° Commande:</Text>
              <Text style={styles.infoValue}>{order.numero_commande}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.infoLabel}>Date commande:</Text>
              <Text style={styles.infoValue}>{formatDate(order.date_commande)}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.infoLabel}>Montant total:</Text>
              <Text style={styles.infoValue}>{formatCurrency(order.total)}</Text>
            </View>
          </View>
        )}

        {/* Payment Amount */}
        <View style={styles.totalSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Montant Reçu:</Text>
            <Text style={[styles.totalValue, styles.grandTotal]}>
              {formatCurrency(payment.montant)}
            </Text>
          </View>
        </View>

        {/* Notes */}
        {payment.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <Text style={styles.infoValue}>{payment.notes}</Text>
          </View>
        )}

        {/* Signature */}
        <View style={styles.signature}>
          <Text style={styles.infoLabel}>Signature et cachet:</Text>
          <View style={styles.signatureLine}></View>
        </View>

        {/* Stamp Box */}
        <View style={styles.stampBox}>
          <Text>CACHET</Text>
          <Text>ENTREPRISE</Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>
            Reçu généré le {formatDate(new Date().toISOString())} | 
            Document officiel - Conservez ce reçu pour vos archives
          </Text>
        </View>
      </Page>
    </Document>
  );
};