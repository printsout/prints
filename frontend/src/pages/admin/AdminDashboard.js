import { useState, useEffect } from 'react';
import { useAdmin } from '../../context/AdminContext';
import api from '../../services/api';
import { 
  Users, Package, ShoppingCart, DollarSign, 
  TrendingUp, Clock, ArrowUpRight, ArrowDownRight 
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

const getStatusBadge = (status) => {
  const map = {
    completed: { className: 'bg-green-100 text-green-700', label: 'Slutförd' },
    processing: { className: 'bg-blue-100 text-blue-700', label: 'Behandlas' },
    shipped: { className: 'bg-purple-100 text-purple-700', label: 'Skickad' },
  };
  const found = map[status] || { className: 'bg-amber-100 text-amber-700', label: 'Väntande' };
  return found;
};

const AdminDashboard = () => {
  const { getAuthHeaders } = useAdmin();
  const [stats, setStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, ordersRes] = await Promise.all([
          api.get('/admin/stats', { headers: getAuthHeaders() }),
          api.get('/admin/orders?limit=5', { headers: getAuthHeaders() })
        ]);
        setStats(statsRes.data);
        setRecentOrders(ordersRes.data.orders || []);
      } catch (error) {
        toast.error('Kunde inte hämta dashboard-data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [getAuthHeaders]);

  const statCards = [
    {
      label: 'Totala användare',
      value: stats?.total_users || 0,
      icon: Users,
      color: 'bg-blue-500',
      change: '+12%',
      positive: true
    },
    {
      label: 'Totala beställningar',
      value: stats?.total_orders || 0,
      icon: ShoppingCart,
      color: 'bg-green-500',
      change: '+8%',
      positive: true
    },
    {
      label: 'Produkter',
      value: stats?.total_products || 0,
      icon: Package,
      color: 'bg-purple-500',
      change: '0',
      positive: true
    },
    {
      label: 'Total omsättning',
      value: `${(stats?.total_revenue || 0).toLocaleString('sv-SE')} kr`,
      icon: DollarSign,
      color: 'bg-amber-500',
      change: '+15%',
      positive: true
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500">Välkommen tillbaka! Här är en översikt av din butik.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div 
              key={stat.label}
              className="bg-white rounded-xl p-6 shadow-sm border border-slate-200"
              data-testid={`stat-card-${index}`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-slate-500">{stat.label}</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="flex items-center gap-1 mt-4">
                {stat.positive ? (
                  <ArrowUpRight className="w-4 h-4 text-green-500" />
                ) : (
                  <ArrowDownRight className="w-4 h-4 text-red-500" />
                )}
                <span className={`text-sm ${stat.positive ? 'text-green-500' : 'text-red-500'}`}>
                  {stat.change}
                </span>
                <span className="text-sm text-slate-400">från förra månaden</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Orders Alert */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
          <div className="flex items-center gap-4">
            <div className="bg-amber-100 p-3 rounded-lg">
              <Clock className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-amber-600 font-medium">Väntande beställningar</p>
              <p className="text-2xl font-bold text-amber-900">{stats?.pending_orders || 0}</p>
            </div>
          </div>
          <Link 
            to="/admin/orders?status=pending"
            className="inline-flex items-center gap-2 mt-4 text-amber-700 hover:text-amber-800 font-medium"
          >
            Visa väntande beställningar
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Recent Activity */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-center gap-4">
            <div className="bg-blue-100 p-3 rounded-lg">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-blue-600 font-medium">Beställningar senaste 7 dagarna</p>
              <p className="text-2xl font-bold text-blue-900">{stats?.recent_orders || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Senaste beställningar</h2>
            <Link 
              to="/admin/orders"
              className="text-primary hover:text-primary/80 font-medium text-sm"
            >
              Visa alla
            </Link>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Order ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Kund</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Datum</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Summa</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {recentOrders.length > 0 ? (
                recentOrders.map((order) => (
                  <tr key={order.order_id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 text-sm font-mono text-slate-600">
                      #{order.order_id?.slice(0, 8)}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-900">
                      {order.email || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {new Date(order.created_at).toLocaleDateString('sv-SE')}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">
                      {order.total?.toLocaleString('sv-SE')} kr
                    </td>
                    <td className="px-6 py-4">
                      {(() => {
                        const badge = getStatusBadge(order.status);
                        return (
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${badge.className}`}>
                            {badge.label}
                          </span>
                        );
                      })()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    Inga beställningar ännu
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
