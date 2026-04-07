import { useState, useEffect } from 'react';
import { BookOpen, Building2, Mail, Phone, MapPin, Clock, Package, Download, FileDown, Printer, CreditCard } from 'lucide-react';
import api from '../../services/api';
import { useAdmin } from '../../context/AdminContext';

const AdminCatalogs = () => {
  const { token } = useAdmin();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await api.get('/catalog/orders', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setOrders(res.data);
      } catch {
        toast.error('Kunde inte hämta katalogbeställningar');
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [token]);

  const backendUrl = process.env.REACT_APP_BACKEND_URL || '';

  const filtered = filter === 'all' ? orders : orders.filter(o => {
    if (filter === 'our') return o.order_type === 'our_catalog' || (!o.order_type && o.catalog_type);
    if (filter === 'print') return o.order_type === 'print' || (!o.order_type && o.pdf_url);
    if (filter === 'businesscard') return o.order_type === 'businesscard';
    return true;
  });

  const getTypeLabel = (order) => {
    if (order.order_type === 'businesscard') return 'Visitkort';
    if (order.order_type === 'print' || (!order.order_type && order.pdf_url)) return 'Utskrift';
    if (order.catalog_type === 'digital') return 'Digital';
    return 'Fysisk';
  };

  const getTypeIcon = (order) => {
    if (order.order_type === 'businesscard') return CreditCard;
    if (order.order_type === 'print' || (!order.order_type && order.pdf_url)) return Printer;
    if (order.catalog_type === 'digital') return FileDown;
    return BookOpen;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2a9d8f]" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="admin-catalogs">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Katalogbeställningar</h1>
          <p className="text-sm text-slate-500 mt-1">{orders.length} beställningar totalt</p>
        </div>
        <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
          {[
            { id: 'all', label: 'Alla' },
            { id: 'our', label: 'Vår katalog' },
            { id: 'print', label: 'Utskrift' },
            { id: 'businesscard', label: 'Visitkort' },
          ].map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${filter === f.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              data-testid={`filter-${f.id}`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center border">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">Inga katalogbeställningar</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(order => {
            const TypeIcon = getTypeIcon(order);
            return (
              <div key={order.order_id} className="bg-white rounded-xl border p-5" data-testid={`catalog-order-${order.order_id}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-[#2a9d8f]/10">
                      <TypeIcon className="w-5 h-5 text-[#2a9d8f]" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">
                        {order.company_name}
                        {order.quantity > 1 && <span className="text-sm font-normal text-slate-500 ml-2">x{order.quantity}</span>}
                      </h3>
                      <p className="text-sm text-slate-500">{order.contact_person} — {getTypeLabel(order)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {order.pdf_url && (
                      <a href={`${backendUrl}${order.pdf_url}`} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 text-sm font-medium transition-colors"
                        data-testid={`download-pdf-${order.order_id}`}>
                        <Download className="w-4 h-4" />{order.original_filename || 'PDF'}
                      </a>
                    )}
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      order.status === 'pending' ? 'bg-amber-50 text-amber-700' : 'bg-green-50 text-green-700'
                    }`}>
                      {order.status === 'pending' ? 'Väntar' : 'Skickad'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                  <div className="flex items-center gap-2 text-slate-600">
                    <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="truncate">{order.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600">
                    <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>{order.phone}</span>
                  </div>
                  {order.address && (
                    <div className="flex items-center gap-2 text-slate-600">
                      <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                      <span className="truncate">{order.address}, {order.postal_code} {order.city}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-slate-600">
                    <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>{new Date(order.created_at).toLocaleDateString('sv-SE')}</span>
                  </div>
                </div>

                {order.message && (
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-sm text-slate-500 italic">"{order.message}"</p>
                  </div>
                )}

                {order.order_type === 'businesscard' && order.card_details && (
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-xs font-semibold text-slate-400 uppercase mb-2">Visitkortsinfo</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm text-slate-600">
                      {order.card_details.name && <span><strong>Namn:</strong> {order.card_details.name}</span>}
                      {order.card_details.title && <span><strong>Titel:</strong> {order.card_details.title}</span>}
                      {order.card_details.company && <span><strong>Företag:</strong> {order.card_details.company}</span>}
                      {order.card_details.template && <span><strong>Mall:</strong> {order.card_details.template}</span>}
                    </div>
                    {order.logo_url && (
                      <a href={`${backendUrl}${order.logo_url}`} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 mt-2 text-sm text-[#2a9d8f] hover:underline">
                        <Download className="w-3.5 h-3.5" />Ladda ner logotyp
                      </a>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminCatalogs;
