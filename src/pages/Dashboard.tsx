import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Button,
  Chip,
  Alert,
  CircularProgress,
  Avatar
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  People,
  AttachMoney,
  Assessment,
  Add,
  Receipt,
  Inventory,
  AccountBalance
} from '@mui/icons-material';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { dashboardService, type DashboardStats, type RecentOrder, type OrderStatusData, type RecentActivity } from '../services/dashboardService';

interface QuickStat {
  title: string;
  value: string;
  change: number;
  icon: React.ElementType;
  color: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [orderStatusData, setOrderStatusData] = useState<OrderStatusData[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch dashboard statistics
      const statsResult = await dashboardService.getStats();
      if (statsResult.success && statsResult.data) {
        setStats(statsResult.data);
      } else {
        throw new Error(statsResult.message || 'Erreur lors de la récupération des statistiques');
      }

      // Fetch recent orders
      const ordersResult = await dashboardService.getRecentOrders(5);
      if (ordersResult.success && ordersResult.data) {
        setRecentOrders(ordersResult.data);
      }

      // Fetch order status distribution
      const statusResult = await dashboardService.getOrderStatusData();
      if (statusResult.success && statusResult.data) {
        setOrderStatusData(statusResult.data);
      }

      // Fetch recent activities
      const activitiesResult = await dashboardService.getRecentActivities(10);
      if (activitiesResult.success && activitiesResult.data) {
        setRecentActivities(activitiesResult.data);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des données');
      console.error('Dashboard data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  const quickStats: QuickStat[] = [
    {
      title: 'Chiffre d\'Affaires Total',
      value: `${parseFloat(stats?.totalRevenue?.toString() || '0').toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DH`,
      change: stats?.monthlyGrowth || 0,
      icon: AttachMoney,
      color: '#4CAF50'
    },
    {
      title: 'Total Commandes',
      value: String(stats?.totalOrders || 0),
      change: 0,
      icon: ShoppingCart,
      color: '#2196F3'
    },
    {
      title: 'Clients Actifs',
      value: String(stats?.totalClients || 0),
      change: 0,
      icon: People,
      color: '#FF9800'
    },
    {
      title: 'Total Produits',
      value: String(stats?.totalProducts || 0),
      change: 0,
      icon: Inventory,
      color: '#9C27B0'
    }
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'order':
        return <ShoppingCart />;
      case 'payment':
        return <AttachMoney />;
      case 'client':
        return <People />;
      case 'product':
        return <Inventory />;
      default:
        return <Assessment />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'active':
        return 'success';
      case 'pending':
      case 'processing':
        return 'warning';
      case 'cancelled':
      case 'failed':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Tableau de bord
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Quick Stats Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 3, mb: 4 }}>
        {quickStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Box
                    sx={{
                      p: 1,
                      borderRadius: 2,
                      backgroundColor: `${stat.color}20`,
                      color: stat.color,
                      mr: 2
                    }}
                  >
                    <Icon />
                  </Box>
                  <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                    {stat.title}
                  </Typography>
                </Box>
                <Typography variant="h4" component="div" sx={{ mb: 1, fontWeight: 'bold' }}>
                  {stat.value}
                </Typography>
                {stat.change !== 0 && (
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {stat.change >= 0 ? (
                      <TrendingUp sx={{ color: 'success.main', mr: 1, fontSize: 16 }} />
                    ) : (
                      <TrendingDown sx={{ color: 'error.main', mr: 1, fontSize: 16 }} />
                    )}
                    <Typography 
                      variant="body2" 
                      color={stat.change >= 0 ? 'success.main' : 'error.main'}
                    >
                      {Math.abs(stat.change).toFixed(1)}% par rapport au mois dernier
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          );
        })}
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 2fr' }, gap: 3, mb: 3 }}>
        {/* Order Status Chart */}
        <Card sx={{ height: 350 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Répartition du Statut des Commandes
            </Typography>
            {orderStatusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={orderStatusData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {orderStatusData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 250 }}>
                <Typography color="textSecondary">Aucune donnée disponible</Typography>
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Recent Orders */}
        <Card sx={{ height: 350 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Commandes Récentes
              </Typography>
              <Button 
                variant="outlined" 
                size="small" 
                startIcon={<Add />}
                href="/orders"
              >
                Nouvelle Commande
              </Button>
            </Box>
            {recentOrders.length > 0 ? (
              <List>
                {recentOrders.map((order, index) => (
                  <ListItem key={order.id || index} divider>
                    <ListItemIcon>
                      <Avatar sx={{ bgcolor: 'primary.light' }}>
                        <Receipt />
                      </Avatar>
                    </ListItemIcon>
                    <ListItemText
                      primary={`Order #${order.human_id || order.id}`}
                      secondary={
                        <Box>
                          <Typography variant="body2" color="textSecondary" component="div">
                            ID Client: {order.client_id}
                          </Typography>
                          <Typography variant="body2" color="textSecondary" component="div">
                            Montant: {parseFloat(order.total_amount?.toString() || '0').toFixed(2)} DH
                          </Typography>
                        </Box>
                      }
                    />
                    <Chip
                      label={order.status || 'Unknown'}
                      color={getStatusColor(order.status || 'unknown') as any}
                      size="small"
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
                <Typography color="textSecondary">Aucune commande récente</Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 2fr' }, gap: 3 }}>
        {/* Quick Actions */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Actions Rapides
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={<Add />}
                fullWidth
                href="/orders"
              >
                Créer une Nouvelle Commande
              </Button>
              <Button
                variant="outlined"
                startIcon={<People />}
                fullWidth
                href="/clients"
              >
                Ajouter un Client
              </Button>
              <Button
                variant="outlined"
                startIcon={<Inventory />}
                fullWidth
                href="/products"
              >
                Gérer les Produits
              </Button>
              <Button
                variant="outlined"
                startIcon={<Assessment />}
                fullWidth
                href="/reports"
              >
                Voir les Rapports
              </Button>
              <Button
                variant="outlined"
                startIcon={<AccountBalance />}
                fullWidth
                href="/financial-management"
              >
                Gestion Financière
              </Button>
            </Box>
          </CardContent>
        </Card>

        {/* Recent Activities */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Activités Récentes
            </Typography>
            {recentActivities.length > 0 ? (
              <List>
                {recentActivities.map((activity) => (
                  <ListItem key={activity.id} divider>
                    <ListItemIcon>
                      <Avatar sx={{ bgcolor: 'secondary.light' }}>
                        {getActivityIcon(activity.type)}
                      </Avatar>
                    </ListItemIcon>
                    <ListItemText
                      primary={activity.title}
                      secondary={
                        <Box>
                          <Typography variant="body2" color="textSecondary">
                            {activity.subtitle}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {activity.time}
                          </Typography>
                        </Box>
                      }
                    />
                    {activity.status && (
                      <Chip
                        label={activity.status}
                        color={getStatusColor(activity.status) as any}
                        size="small"
                      />
                    )}
                  </ListItem>
                ))}
              </List>
            ) : (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
                <Typography color="textSecondary">Aucune activité récente</Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}