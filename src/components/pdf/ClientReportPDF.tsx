import React from 'react';
import { Document, Page, Text, View, pdf } from '@react-pdf/renderer';
import { commonStyles, formatDate, getCompanyInfo } from '../../utils/pdfStyles';

interface ClientData {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  status: string;
  created_at: string;
}

interface ClientReportPDFProps {
  clients: ClientData[];
  title?: string;
}

const ClientReportPDF: React.FC<ClientReportPDFProps> = ({ clients, title = 'Clients Report' }) => {
  const company = getCompanyInfo();

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
              <Text style={commonStyles.label}>Total Clients:</Text>
              <Text style={commonStyles.value}>{clients.length}</Text>
            </View>
            <View style={commonStyles.columnHalf}>
              <Text style={commonStyles.label}>Active Clients:</Text>
              <Text style={commonStyles.value}>
                {clients.filter(c => c.status === 'active').length}
              </Text>
            </View>
          </View>
        </View>

        {/* Clients Table */}
        <View style={commonStyles.section}>
          <Text style={commonStyles.sectionTitle}>Client List</Text>
          
          {/* Table Header */}
          <View style={[commonStyles.table]}>
            <View style={[commonStyles.tableRow, commonStyles.tableHeader]}>
              <View style={[commonStyles.tableCell, { flex: 2 }]}>
                <Text>Name</Text>
              </View>
              <View style={[commonStyles.tableCell, { flex: 2 }]}>
                <Text>Email</Text>
              </View>
              <View style={commonStyles.tableCell}>
                <Text>Phone</Text>
              </View>
              <View style={commonStyles.tableCell}>
                <Text>City</Text>
              </View>
              <View style={[commonStyles.tableCell, commonStyles.tableCellLast]}>
                <Text>Status</Text>
              </View>
            </View>

            {/* Table Rows */}
            {clients.map((client) => (
              <View key={client.id} style={commonStyles.tableRow}>
                <View style={[commonStyles.tableCell, { flex: 2 }]}>
                  <Text>{client.name}</Text>
                </View>
                <View style={[commonStyles.tableCell, { flex: 2 }]}>
                  <Text>{client.email || '-'}</Text>
                </View>
                <View style={commonStyles.tableCell}>
                  <Text>{client.phone || '-'}</Text>
                </View>
                <View style={commonStyles.tableCell}>
                  <Text>{client.city || '-'}</Text>
                </View>
                <View style={[commonStyles.tableCell, commonStyles.tableCellLast]}>
                  <Text>{client.status}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Footer */}
        <View style={commonStyles.footer}>
          <Text>Generated on {formatDate(new Date())}</Text>
          <Text>{company.website}</Text>
        </View>
      </Page>
    </Document>
  );
};

// Function to generate and download clients PDF report
export const downloadClientsReport = async (clients: ClientData[], title = 'Clients Report') => {
  const blob = await pdf(<ClientReportPDF clients={clients} title={title} />).toBlob();
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `clients-report-${new Date().toISOString().split('T')[0]}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
};

export default ClientReportPDF;