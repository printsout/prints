import { useState, useEffect } from 'react';
import { useAdmin } from '../../context/AdminContext';
import api from '../../services/api';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { toast } from 'sonner';
import { Search, Eye, Package, Truck, CheckCircle, Clock } from 'lucide-react';

const AdminOrders = () => {
  const { getAuthHeaders } = useAdmin();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const fetchOrders = async () => {
    try {
      const params = statusFilter !== 'all' ? `?status=${statusFilter}` : '';
      const response = await api.get(`/admin/orders${params}`, { headers: getAuthHeaders() });
      setOrders(response.data.orders || []);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      toast.error('Kunde inte hämta beställningar');
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await api.put(`/admin/orders/${orderId}`, { status: newStatus }, { headers: getAuthHeaders() });
      toast.success('Orderstatus uppdaterad');
      fetchOrders();
      if (selectedOrder?.order_id === orderId) {
        setSelectedOrder(prev => ({ ...prev, status: newStatus }));
      }
    } catch (error) {
      console.error('Failed to update order:', error);
      toast.error('Kunde inte uppdatera order');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'processing': return <Package className="w-4 h-4" />;
      case 'shipped': return <Truck className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-amber-100 text-amber-700';
      case 'processing': return 'bg-blue-100 text-blue-700';
      case 'shipped': return 'bg-purple-100 text-purple-700';
      case 'completed': return 'bg-green-100 text-green-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'pending': return 'Väntande';
      case 'processing': return 'Behandlas';
      case 'shipped': return 'Skickad';
      case 'completed': return 'Slutförd';
      default: return status;
    }
  };

  const filteredOrders = orders.filter(order => 
    order.order_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Beställningar</h1>
        <p className="text-slate-500">Hantera och följ upp kundernas beställningar</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input
            placeholder="Sök på order-ID eller e-post..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrera status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alla statusar</SelectItem>
            <SelectItem value="pending">Väntande</SelectItem>
            <SelectItem value="processing">Behandlas</SelectItem>
            <SelectItem value="shipped">Skickad</SelectItem>
            <SelectItem value="completed">Slutförd</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Orders List */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Order</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Kund</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Datum</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Summa</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredOrders.length > 0 ? (
                  filteredOrders.map((order) => (
                    <tr 
                      key={order.order_id} 
                      className={`hover:bg-slate-50 cursor-pointer ${selectedOrder?.order_id === order.order_id ? 'bg-primary/5' : ''}`}
                      onClick={() => setSelectedOrder(order)}
                    >
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
                        <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}>
                          {getStatusIcon(order.status)}
                          {getStatusLabel(order.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                      Inga beställningar hittades
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Order Details */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          {selectedOrder ? (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Orderdetaljer</h3>
                <p className="text-sm text-slate-500 font-mono">#{selectedOrder.order_id}</p>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-xs text-slate-500 uppercase">Kund</p>
                  <p className="text-sm text-slate-900">{selectedOrder.email}</p>
                </div>

                <div>
                  <p className="text-xs text-slate-500 uppercase">Datum</p>
                  <p className="text-sm text-slate-900">
                    {new Date(selectedOrder.created_at).toLocaleString('sv-SE')}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-500 uppercase">Produkter</p>
                  <div className="mt-2 space-y-2">
                    {selectedOrder.items?.map((item, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span className="text-slate-600">{item.name || 'Produkt'} x{item.quantity}</span>
                        <span className="text-slate-900">{item.price} kr</span>
                      </div>
                    )) || <p className="text-sm text-slate-500">Inga produkter</p>}
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <div className="flex justify-between text-sm font-medium">
                    <span className="text-slate-600">Totalt</span>
                    <span className="text-slate-900">{selectedOrder.total?.toLocaleString('sv-SE')} kr</span>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-slate-500 uppercase mb-2">Uppdatera status</p>
                  <Select 
                    value={selectedOrder.status} 
                    onValueChange={(value) => updateOrderStatus(selectedOrder.order_id, value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Väntande</SelectItem>
                      <SelectItem value="processing">Behandlas</SelectItem>
                      <SelectItem value="shipped">Skickad</SelectItem>
                      <SelectItem value="completed">Slutförd</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center text-slate-500 py-8">
              <Package className="w-12 h-12 mx-auto text-slate-300 mb-4" />
              <p>Välj en order för att se detaljer</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminOrders;
