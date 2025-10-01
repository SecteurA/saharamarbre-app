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
    borderBottom: '2pt solid #4CAF50',
    paddingBottom: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#4CAF50',
  },
  subtitle: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 5,
  },
  reportDate: {
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
    color: '#4CAF50',
    borderBottom: '1pt solid #CCCCCC',
    paddingBottom: 5,
  },
  summaryCards: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  summaryCard: {
    backgroundColor: '#E8F5E8',
    padding: 12,
    width: '24%',
    textAlign: 'center',
    border: '1pt solid #4CAF50',
  },
  summaryLabel: {
    fontSize: 8,
    color: '#666666',
    marginBottom: 3,
  },
  summaryValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  alertCard: {
    backgroundColor: '#FFF3E0',
    padding: 12,
    width: '24%',
    textAlign: 'center',
    border: '1pt solid #FF9800',
  },
  alertValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FF9800',
  },
  table: {
    width: '100%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#CCCCCC',
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
    backgroundColor: '#4CAF50',
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  tableCell: {
    padding: 6,
    fontSize: 8,
  },
  tableCellCode: {
    padding: 6,
    fontSize: 8,
    flex: 1,
  },
  tableCellName: {
    padding: 6,
    fontSize: 8,
    flex: 3,
  },
  tableCellQty: {
    padding: 6,
    fontSize: 8,
    flex: 1,
    textAlign: 'right',
  },
  tableCellPrice: {
    padding: 6,
    fontSize: 8,
    flex: 1,
    textAlign: 'right',
  },
  tableCellValue: {
    padding: 6,
    fontSize: 8,
    flex: 1,
    textAlign: 'right',
  },
  tableCellStatus: {
    padding: 6,
    fontSize: 7,
    flex: 1,
    textAlign: 'center',
  },
  lowStockRow: {
    backgroundColor: '#FFEBEE',
  },
  outOfStockRow: {
    backgroundColor: '#FFCDD2',
  },
  categorySection: {
    marginBottom: 15,
  },
  categoryTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#4CAF50',
    backgroundColor: '#E8F5E8',
    padding: 5,
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
  alertSection: {
    backgroundColor: '#FFF3E0',
    padding: 15,
    marginBottom: 20,
    border: '2pt solid #FF9800',
  },
  alertTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#FF9800',
  },
  alertText: {
    fontSize: 9,
    color: '#E65100',
    marginBottom: 5,
  },
  movementSection: {
    backgroundColor: '#F3E5F5',
    padding: 10,
    marginBottom: 15,
    border: '1pt solid #9C27B0',
  },
  movementTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#9C27B0',
  },
  movementText: {
    fontSize: 8,
    color: '#4A148C',
  }
});

interface Product {
  id: string;
  code?: string;
  nom: string;
  categorie?: string;
  quantite: number;
  stock_min: number;
  prix_unitaire: number;
  derniere_entree?: string;
  derniere_sortie?: string;
  fournisseur?: string;
  emplacement?: string;
}

interface InventoryMovement {
  date: string;
  type: 'entree' | 'sortie';
  quantity: number;
  reference?: string;
}

interface InventoryReportPDFProps {
  products: Product[];
  reportType: 'complete' | 'low-stock' | 'out-of-stock' | 'movement';
  company?: {
    nom: string;
    adresse?: string;
    telephone?: string;
    email?: string;
    siret?: string;
  };
  summary: {
    totalProducts: number;
    totalValue: number;
    lowStockItems: number;
    outOfStockItems: number;
    categories: { [category: string]: number };
  };
  movements?: { [productId: string]: InventoryMovement[] };
}

export const InventoryReportPDF: React.FC<InventoryReportPDFProps> = ({
  products,
  reportType,
  company,
  summary,
  movements
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const getStockStatus = (product: Product) => {
    if (product.quantite === 0) return { status: 'Rupture', color: '#F44336' };
    if (product.quantite <= product.stock_min) return { status: 'Stock bas', color: '#FF9800' };
    return { status: 'Normal', color: '#4CAF50' };
  };

  const getReportTitle = () => {
    const titles = {
      'complete': 'RAPPORT D\'INVENTAIRE COMPLET',
      'low-stock': 'RAPPORT - STOCK BAS',
      'out-of-stock': 'RAPPORT - RUPTURE DE STOCK',
      'movement': 'RAPPORT - MOUVEMENTS DE STOCK'
    };
    return titles[reportType] || 'RAPPORT D\'INVENTAIRE';
  };

  const filteredProducts = () => {
    switch (reportType) {
      case 'low-stock':
        return products.filter(p => p.quantite > 0 && p.quantite <= p.stock_min);
      case 'out-of-stock':
        return products.filter(p => p.quantite === 0);
      default:
        return products;
    }
  };

  // Group products by category
  const productsByCategory = filteredProducts().reduce((acc, product) => {
    const category = product.categorie || 'Sans catégorie';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(product);
    return acc;
  }, {} as { [category: string]: Product[] });

  const getRowStyle = (product: Product) => {
    if (product.quantite === 0) return styles.outOfStockRow;
    if (product.quantite <= product.stock_min) return styles.lowStockRow;
    return {};
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{getReportTitle()}</Text>
          <Text style={styles.subtitle}>
            {company?.nom || 'Votre Entreprise'}
          </Text>
          <Text style={styles.reportDate}>
            Généré le {formatDate(new Date().toISOString())}
          </Text>
        </View>

        {/* Summary Cards */}
        <View style={styles.summaryCards}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Produits Total</Text>
            <Text style={styles.summaryValue}>{summary.totalProducts}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Valeur Stock</Text>
            <Text style={styles.summaryValue}>{formatCurrency(summary.totalValue)}</Text>
          </View>
          <View style={styles.alertCard}>
            <Text style={styles.summaryLabel}>Stock Bas</Text>
            <Text style={styles.alertValue}>{summary.lowStockItems}</Text>
          </View>
          <View style={styles.alertCard}>
            <Text style={styles.summaryLabel}>Rupture</Text>
            <Text style={styles.alertValue}>{summary.outOfStockItems}</Text>
          </View>
        </View>

        {/* Alerts Section */}
        {(summary.lowStockItems > 0 || summary.outOfStockItems > 0) && (
          <View style={styles.alertSection}>
            <Text style={styles.alertTitle}>ALERTES STOCK</Text>
            {summary.outOfStockItems > 0 && (
              <Text style={styles.alertText}>
                🔴 {summary.outOfStockItems} produit(s) en rupture de stock - Réapprovisionnement urgent requis
              </Text>
            )}
            {summary.lowStockItems > 0 && (
              <Text style={styles.alertText}>
                🟡 {summary.lowStockItems} produit(s) avec stock bas - Prévoir réapprovisionnement
              </Text>
            )}
          </View>
        )}

        {/* Products by Category */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>DÉTAIL DE L'INVENTAIRE</Text>
          
          {Object.entries(productsByCategory).map(([category, categoryProducts]) => (
            <View key={category} style={styles.categorySection}>
              <Text style={styles.categoryTitle}>
                {category.toUpperCase()} - {categoryProducts.length} produit(s)
              </Text>
              
              <View style={styles.table}>
                <View style={[styles.tableRow, styles.tableHeader]}>
                  <Text style={styles.tableCellCode}>Code</Text>
                  <Text style={styles.tableCellName}>Produit</Text>
                  <Text style={styles.tableCellQty}>Stock</Text>
                  <Text style={styles.tableCellQty}>Min</Text>
                  <Text style={styles.tableCellPrice}>Prix Unit.</Text>
                  <Text style={styles.tableCellValue}>Valeur</Text>
                  <Text style={styles.tableCellStatus}>Statut</Text>
                </View>
                
                {categoryProducts.map((product) => {
                  const stockStatus = getStockStatus(product);
                  const productValue = product.quantite * product.prix_unitaire;
                  
                  return (
                    <View key={product.id} style={[styles.tableRow, getRowStyle(product)]}>
                      <Text style={styles.tableCellCode}>
                        {product.code || product.id.slice(0, 8)}
                      </Text>
                      <Text style={styles.tableCellName}>
                        {product.nom}
                        {product.emplacement && (
                          <Text style={{ fontSize: 7, color: '#666' }}>
                            {'\n'}📍 {product.emplacement}
                          </Text>
                        )}
                      </Text>
                      <Text style={styles.tableCellQty}>{product.quantite}</Text>
                      <Text style={styles.tableCellQty}>{product.stock_min}</Text>
                      <Text style={styles.tableCellPrice}>{formatCurrency(product.prix_unitaire)}</Text>
                      <Text style={styles.tableCellValue}>{formatCurrency(productValue)}</Text>
                      <Text style={[styles.tableCellStatus, { color: stockStatus.color }]}>
                        {stockStatus.status}
                      </Text>
                    </View>
                  );
                })}
                
                {/* Category Summary */}
                <View style={[styles.tableRow, { backgroundColor: '#E8F5E8' }]}>
                  <Text style={styles.tableCellCode}></Text>
                  <Text style={[styles.tableCellName, { fontWeight: 'bold' }]}>
                    Total {category}
                  </Text>
                  <Text style={[styles.tableCellQty, { fontWeight: 'bold' }]}>
                    {categoryProducts.reduce((sum, p) => sum + p.quantite, 0)}
                  </Text>
                  <Text style={styles.tableCellQty}></Text>
                  <Text style={styles.tableCellPrice}></Text>
                  <Text style={[styles.tableCellValue, { fontWeight: 'bold' }]}>
                    {formatCurrency(categoryProducts.reduce((sum, p) => sum + (p.quantite * p.prix_unitaire), 0))}
                  </Text>
                  <Text style={styles.tableCellStatus}></Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Stock Movements (if applicable) */}
        {reportType === 'movement' && movements && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>MOUVEMENTS RÉCENTS</Text>
            {Object.entries(movements).slice(0, 5).map(([productId, productMovements]) => {
              const product = products.find(p => p.id === productId);
              if (!product) return null;
              
              return (
                <View key={productId} style={styles.movementSection}>
                  <Text style={styles.movementTitle}>
                    {product.nom} - {productMovements.length} mouvement(s)
                  </Text>
                  {productMovements.slice(0, 3).map((movement, index) => (
                    <Text key={index} style={styles.movementText}>
                      {formatDate(movement.date)} - {movement.type === 'entree' ? '↗️ Entrée' : '↙️ Sortie'}: {movement.quantity} unité(s)
                      {movement.reference && ` (${movement.reference})`}
                    </Text>
                  ))}
                </View>
              );
            })}
          </View>
        )}

        {/* Recommendations */}
        <View style={styles.alertSection}>
          <Text style={styles.alertTitle}>RECOMMANDATIONS</Text>
          <Text style={styles.alertText}>
            • Vérifier régulièrement les niveaux de stock minimum
          </Text>
          <Text style={styles.alertText}>
            • Planifier les réapprovisionnements pour les produits en stock bas
          </Text>
          <Text style={styles.alertText}>
            • Analyser les mouvements de stock pour optimiser les commandes
          </Text>
          <Text style={styles.alertText}>
            • Contrôler physiquement l'inventaire trimestriellement
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>
            Rapport d'inventaire généré le {formatDate(new Date().toISOString())} | 
            {company?.nom || 'Votre Entreprise'} | 
            Document confidentiel
          </Text>
        </View>
      </Page>
    </Document>
  );
};