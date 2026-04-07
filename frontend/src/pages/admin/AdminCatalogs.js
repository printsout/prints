import { useState, useEffect } from 'react';
import { BookOpen, FileDown, Building2, Mail, Phone, MapPin, Clock, Package } from 'lucide-react';
import api from '../../services/api';
import { useAdmin } from '../../context/AdminContext';

const AdminCatalogs = () => {
  const { token } = useAdmin();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await api.get('/catalog/orders', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setOrders(res.data);
      } catch {
        console.error('Failed to fetch catalog orders');
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [token]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2a9d8f]" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="admin-catalogs">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Katalogbeställningar</h1>
          <p className="text-sm text-slate-500 mt-1">{orders.length} beställningar totalt</p>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center border">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">Inga katalogbeställningar ännu</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => (
            <div key={order.order_id} className="bg-white rounded-xl border p-5" data-testid={`catalog-order-${order.order_id}`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    order.catalog_type === 'physical' ? 'bg-[#2a9d8f]/10' : 'bg-[#e76f51]/10'
                  }`}>
                    {order.catalog_type === 'physical'
                      ? <Package className="w-5 h-5 text-[#2a9d8f]" />
                      : <FileDown className="w-5 h-5 text-[#e76f51]" />
                    }
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">
                      {order.catalog_type === 'physical' ? 'Fysisk katalog' : 'Digital katalog (PDF)'}
                      {order.catalog_type === 'physical' && order.quantity > 1 && (
                        <span className="text-sm font-normal text-slate-500 ml-2">x{order.quantity}</span>
                      )}
                    </h3>
                    <p className="text-sm text-slate-500">{order.company_name}</p>
                  </div>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                  order.status === 'pending' ? 'bg-amber-50 text-amber-700' : 'bg-green-50 text-green-700'
                }`}>
                  {order.status === 'pending' ? 'Väntar' : 'Skickad'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                <div className="flex items-center gap-2 text-slate-600">
                  <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>{order.contact_person}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="truncate">{order.email}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>{order.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>{new Date(order.created_at).toLocaleDateString('sv-SE')}</span>
                </div>
              </div>

              {order.catalog_type === 'physical' && order.address && (
                <div className="mt-3 pt-3 border-t flex items-start gap-2 text-sm text-slate-600">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <span>{order.address}, {order.postal_code} {order.city}</span>
                </div>
              )}

              {order.message && (
                <div className="mt-3 pt-3 border-t">
                  <p className="text-sm text-slate-500 italic">"{order.message}"</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminCatalogs;
