import { useState, useEffect, useCallback } from 'react';
import DOMPurify from 'dompurify';
import { useAdmin } from '../../context/AdminContext';
import api from '../../services/api';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { toast } from 'sonner';
import { Search, Eye, Package, Truck, CheckCircle, Clock, Printer, Trash2, Briefcase, Download, Square, CheckSquare } from 'lucide-react';
import OrderDetailPanel from './orders/OrderDetailPanel';

const API_BASE = process.env.REACT_APP_BACKEND_URL;

const escapeHtml = (str) => {
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
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

const getB2bProductName = (o) => {
  if (o.order_type === 'businesscard') return `Visitkort${o.card_details?.name ? ` — ${o.card_details.name}` : ''}`;
  if (o.order_type === 'print') return `Katalogutskrift — ${o.company_name || ''}`;
  return `Katalog — ${o.company_name || ''}`;
};

const getOrderTypeLabel = (order) => {
  if (order._source === 'b2b') {
    const labels = { businesscard: 'Visitkort', print: 'Katalogutskrift', our_catalog: 'Vår katalog', catalog_design: 'Katalogdesign' };
    return labels[order.order_type] || 'B2B';
  }
  // Check regular order items for B2B types
  const types = (order.items || []).map(i => i.customization?.type).filter(Boolean);
  if (types.some(t => ['catalog_design', 'businesscard', 'print_catalog'].includes(t))) return 'B2B';
  return 'Webbshop';
};

const AdminOrders = () => {
  const { getAuthHeaders } = useAdmin();
  const [orders, setOrders] = useState([]);
  const [b2bOrders, setB2bOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);

  const fetchOrders = useCallback(async () => {
    try {
      const params = statusFilter !== 'all' ? `?status=${statusFilter}` : '';
      const [shopRes, b2bRes] = await Promise.all([
        api.get(`/admin/orders${params}`, { headers: getAuthHeaders() }),
        api.get('/catalog/orders').catch(() => ({ data: [] })),
      ]);
      setOrders(shopRes.data.orders || []);

      // Normalize B2B orders to same format
      const normalized = (b2bRes.data || []).map(o => ({
        ...o,
        _source: 'b2b',
        email: o.email || '',
        total_amount: o.total_price || o.price || (o.quantity * (o.unit_price || 0)) || 0,
        items: [{
          product_name: getB2bProductName(o),
          quantity: o.quantity || 1,
          price: o.total_price || o.price || 0,
          customization: {
            type: o.order_type === 'businesscard' ? 'businesscard' : o.order_type === 'print' ? 'print_catalog' : 'our_catalog',
            company_name: o.company_name,
            contact_person: o.contact_person,
            original_filename: o.original_filename,
            pdf_url: o.pdf_url,
            card_details: o.card_details,
            logo_url: o.logo_url,
          }
        }],
        shipping_address: { name: o.contact_person || o.company_name, street: o.address, zip: o.postal_code, city: o.city },
      }));
      if (statusFilter === 'all' || !statusFilter) {
        setB2bOrders(normalized);
      } else {
        setB2bOrders(normalized.filter(o => o.status === statusFilter));
      }
    } catch {
      toast.error('Kunde inte hämta beställningar');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, getAuthHeaders]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const updateOrderStatus = async (orderId, newStatus, trackingNumber, trackingCarrier) => {
    try {
      const payload = { status: newStatus };
      if (trackingNumber) payload.tracking_number = trackingNumber;
      if (trackingCarrier) payload.tracking_carrier = trackingCarrier;
      await api.put(`/admin/orders/${orderId}`, payload, { headers: getAuthHeaders() });
      if (newStatus === 'shipped') {
        toast.success('Orderstatus uppdaterad — leveransbekräftelse skickad till kund');
      } else {
        toast.success('Orderstatus uppdaterad');
      }
      fetchOrders();
      if (selectedOrder?.order_id === orderId) {
        setSelectedOrder(prev => ({ ...prev, status: newStatus, tracking_number: trackingNumber, tracking_carrier: trackingCarrier }));
      }
    } catch {
      toast.error('Kunde inte uppdatera order');
    }
  };

  const handleDeleteOrder = async (orderId) => {
    if (!window.confirm('Är du säker på att du vill ta bort denna beställning? Detta går inte att ångra.')) return;
    try {
      await api.delete(`/admin/orders/${orderId}`, { headers: getAuthHeaders() });
      if (selectedOrder?.order_id === orderId) setSelectedOrder(null);
      fetchOrders();
      toast.success('Beställning borttagen');
    } catch (error) {
      toast.error('Kunde inte ta bort beställningen');
    }
  };

  const allOrders = [...orders, ...b2bOrders].sort((a, b) =>
    new Date(b.created_at || 0) - new Date(a.created_at || 0)
  );

  const handleToggleMark = async (e, orderId) => {
    e.stopPropagation();
    try {
      const res = await api.patch(`/admin/orders/${orderId}/mark`, {}, { headers: getAuthHeaders() });
      const newMarked = res.data.marked;
      setOrders(prev => prev.map(o => o.order_id === orderId ? { ...o, marked: newMarked } : o));
      setB2bOrders(prev => prev.map(o => o.order_id === orderId ? { ...o, marked: newMarked } : o));
    } catch {
      toast.error('Kunde inte markera beställningen');
    }
  };

  const handleMarkAll = async () => {
    try {
      await api.patch('/admin/orders/mark-all', {}, { headers: getAuthHeaders() });
      fetchOrders();
    } catch {
      toast.error('Kunde inte markera alla beställningar');
    }
  };

  const markedIds = allOrders.filter(o => o.marked).map(o => o.order_id);
  const markedCount = markedIds.length;
  const allMarked = allOrders.length > 0 && markedCount === allOrders.length;

  const handleBulkAction = async (action, status) => {
    if (markedCount === 0) return;
    if (action === 'delete' && !window.confirm(`Vill du ta bort ${markedCount} beställning(ar)? Detta går inte att ångra.`)) return;
    try {
      const res = await api.post('/admin/orders/bulk-action', { action, status, order_ids: markedIds }, { headers: getAuthHeaders() });
      toast.success(res.data.message);
      fetchOrders();
      setSelectedOrder(null);
    } catch {
      toast.error('Åtgärden misslyckades');
    }
  };

  const handlePrint = (order) => {
    const formatDate = (d) => new Date(d).toLocaleString('sv-SE');
    const formatCustomization = (c) => {
      if (!c) return '';
      const lines = [];
      if (c.type === 'nametag') {
        if (c.child_name) lines.push(`Förnamn: ${c.child_name}`);
        if (c.last_name) lines.push(`Efternamn: ${c.last_name}`);
        if (c.phone_number) lines.push(`Telefon: ${c.phone_number}`);
        if (c.font) lines.push(`Typsnitt: ${c.font}`);
        if (c.font_color) lines.push(`Typsnittsfärg: ${c.font_color}`);
        if (c.motif) lines.push(`Motiv: ${c.motif}`);
        if (c.background) lines.push(`Bakgrund: ${c.background}`);
      } else if (c.type === 'photoalbum') {
        lines.push(`Antal sidor: ${c.total_pages || '-'}`);
        lines.push(`Antal bilder: ${c.total_images || c.images_count || '-'}`);
        if (c.size) lines.push(`Storlek: ${c.size}`);
      } else if (c.type === 'calendar') {
        if (c.year) lines.push(`År: ${c.year}`);
        if (c.size) lines.push(`Storlek: ${c.size}`);
        lines.push(`Bilder: ${c.images_count || 0} / 12`);
      } else if (c.type === 'design') {
        if (c.text) lines.push(`Text: ${c.text}`);
        if (c.text_font) lines.push(`Typsnitt: ${c.text_font}`);
        if (c.text_color) lines.push(`Textfärg: ${c.text_color}`);
        if (c.color) lines.push(`Produktfärg: ${c.color}`);
        if (c.size) lines.push(`Storlek: ${c.size}`);
        if (c.placement_notes) lines.push(`Placering: ${c.placement_notes}`);
      } else {
        Object.entries(c).forEach(([k, v]) => {
          if (k !== 'type' && v && typeof v !== 'object') lines.push(`${k}: ${v}`);
        });
      }
      return lines.join('<br/>');
    };

    const itemsHtml = (order.items || []).map((item, i) => {
      const itemName = escapeHtml(item.product_name || item.name || 'Produkt');
      let imagesHtml = '';
      if (item.customization?.uploaded_image_url) {
        const imgUrl = item.customization.uploaded_image_url.startsWith('http')
          ? item.customization.uploaded_image_url
          : `${API_BASE}${item.customization.uploaded_image_url}`;
        imagesHtml = `<br/><img src="${imgUrl}" style="width:80px;height:80px;object-fit:cover;border-radius:4px;margin-top:6px;border:1px solid #e2e8f0;"/>`;
      }
      return `
        <tr>
          <td style="padding:10px;border-bottom:1px solid #e2e8f0;">${i + 1}</td>
          <td style="padding:10px;border-bottom:1px solid #e2e8f0;">
            <strong>${itemName}</strong>
            ${item.customization ? `<br/><span style="font-size:12px;color:#64748b;">${formatCustomization(item.customization)}</span>` : ''}
            ${imagesHtml}
          </td>
          <td style="padding:10px;border-bottom:1px solid #e2e8f0;text-align:center;">${item.quantity || 1}</td>
          <td style="padding:10px;border-bottom:1px solid #e2e8f0;text-align:right;">${item.price || 0} kr</td>
          <td style="padding:10px;border-bottom:1px solid #e2e8f0;text-align:right;">${(item.price || 0) * (item.quantity || 1)} kr</td>
        </tr>
      `;
    }).join('');

    const printWindow = window.open('', '_blank', 'width=800,height=900');
    const doc = printWindow.document;
    doc.open();
    const sanitizedHtml = DOMPurify.sanitize(`
      <!DOCTYPE html><html lang="sv"><head><meta charset="UTF-8"/><title>Order #${escapeHtml(order.order_id?.slice(0, 8))}</title>
      <style>* { margin: 0; padding: 0; box-sizing: border-box; } body { font-family: 'Segoe UI', sans-serif; color: #1e293b; padding: 40px; font-size: 14px; }
      .header { display: flex; justify-content: space-between; border-bottom: 3px solid #2a9d8f; padding-bottom: 20px; margin-bottom: 30px; }
      .logo { font-size: 28px; font-weight: bold; color: #2a9d8f; } .logo span { font-size: 12px; color: #64748b; display: block; font-weight: normal; }
      table { width: 100%; border-collapse: collapse; } th { padding: 10px; text-align: left; background: #f1f5f9; font-size: 12px; text-transform: uppercase; color: #64748b; }
      .total-row { border-top: 2px solid #1e293b; } .total-row td { padding: 12px 10px; font-weight: bold; font-size: 16px; }
      .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; color: #94a3b8; font-size: 11px; }
      @media print { body { padding: 20px; } @page { margin: 15mm; } }</style></head>
      <body>
        <div class="header"><div class="logo">Printsout<span>Personliga tryckprodukter</span></div>
        <div style="text-align:right;"><h2>Order #${order.order_id?.slice(0, 8)}</h2><p style="font-size:12px;color:#64748b;">${formatDate(order.created_at)}</p></div></div>
        ${order.email ? `<p><strong>Kund:</strong> ${escapeHtml(order.email)}</p>` : ''}
        ${order.shipping_address ? `<p><strong>Adress:</strong> ${escapeHtml(order.shipping_address.street || order.shipping_address.address || '')} ${escapeHtml(order.shipping_address.zip || '')} ${escapeHtml(order.shipping_address.city || '')}</p>` : ''}
        <br/><table><thead><tr><th>#</th><th>Produkt</th><th>Antal</th><th style="text-align:right;">Pris/st</th><th style="text-align:right;">Summa</th></tr></thead>
        <tbody>${itemsHtml || '<tr><td colspan="5" style="padding:20px;text-align:center;">Inga produkter</td></tr>'}
        <tr class="total-row"><td colspan="4" style="text-align:right;">Totalt:</td><td style="text-align:right;">${(order.total_amount || order.total)?.toLocaleString('sv-SE')} kr</td></tr></tbody></table>
        <div class="footer"><p>Printsout AB &bull; info@printout.se</p><p style="margin-top:4px;">Utskriven ${new Date().toLocaleString('sv-SE')}</p></div>
      </body></html>
    `, { WHOLE_DOCUMENT: true, ADD_TAGS: ['style', 'meta', 'title'], ADD_ATTR: ['charset', 'lang'] });
    doc.write(sanitizedHtml);
    doc.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 300);
  };

  const filteredOrders = allOrders.filter(order => {
    const matchesSearch = order.order_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.shipping_address?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSource = sourceFilter === 'all' ||
      (sourceFilter === 'b2b' && (order._source === 'b2b' || getOrderTypeLabel(order) === 'B2B')) ||
      (sourceFilter === 'shop' && order._source !== 'b2b' && getOrderTypeLabel(order) !== 'B2B');
    return matchesSearch && matchesSource;
  });

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="spinner" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Beställningar</h1>
        <p className="text-slate-500">Hantera och följ upp kundernas beställningar</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input placeholder="Sök på order-ID, e-post eller namn..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
        </div>
        <Select value={sourceFilter} onValueChange={setSourceFilter}>
          <SelectTrigger className="w-[160px]" data-testid="source-filter">
            <SelectValue placeholder="Alla typer" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alla typer</SelectItem>
            <SelectItem value="shop">Webbshop</SelectItem>
            <SelectItem value="b2b">B2B</SelectItem>
          </SelectContent>
        </Select>
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

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Button
            variant={allMarked ? "default" : "outline"}
            size="sm"
            onClick={handleMarkAll}
            data-testid="mark-all-orders-btn"
            className={allMarked ? "bg-emerald-600 hover:bg-emerald-700" : ""}
          >
            {allMarked
              ? <><CheckSquare className="w-4 h-4 mr-2" />Avmarkera alla</>
              : <><Square className="w-4 h-4 mr-2" />Markera alla</>
            }
          </Button>
          <span className="text-sm text-slate-500">{markedCount} av {allOrders.length} valda</span>
        </div>

        {markedCount > 0 && (
          <div className="flex items-center gap-2 bg-slate-100 rounded-lg px-3 py-1.5" data-testid="bulk-actions-bar">
            <span className="text-xs font-medium text-slate-600 mr-1">Åtgärder:</span>
            <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => handleBulkAction('status', 'processing')} data-testid="bulk-processing-btn">
              <Clock className="w-3.5 h-3.5 mr-1" />Under behandling
            </Button>
            <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => handleBulkAction('status', 'shipped')} data-testid="bulk-shipped-btn">
              <Truck className="w-3.5 h-3.5 mr-1" />Skickad
            </Button>
            <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => handleBulkAction('status', 'completed')} data-testid="bulk-completed-btn">
              <CheckCircle className="w-3.5 h-3.5 mr-1" />Slutförd
            </Button>
            <Button size="sm" variant="destructive" className="h-8 text-xs" onClick={() => handleBulkAction('delete')} data-testid="bulk-delete-btn">
              <Trash2 className="w-3.5 h-3.5 mr-1" />Ta bort
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-3 py-3 w-10"></th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Order</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Kund</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Typ</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Datum</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Summa</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase sticky right-0 bg-slate-50">Åtgärd</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredOrders.length > 0 ? (
                  filteredOrders.map((order) => (
                    <tr
                      key={order.order_id}
                      className={`hover:bg-slate-50 cursor-pointer ${selectedOrder?.order_id === order.order_id ? 'bg-primary/5' : ''} ${order.marked ? 'bg-emerald-50/50' : ''}`}
                      onClick={() => setSelectedOrder(order)}
                    >
                      <td className="px-3 py-4 text-center">
                        <button
                          onClick={(e) => handleToggleMark(e, order.order_id)}
                          className="transition-colors"
                          title={order.marked ? 'Avmarkera' : 'Markera som hanterad'}
                          data-testid={`mark-order-${order.order_id}`}
                        >
                          {order.marked
                            ? <CheckSquare className="w-5 h-5 text-emerald-600" />
                            : <Square className="w-5 h-5 text-slate-300 hover:text-slate-500" />
                          }
                        </button>
                      </td>
                      <td className="px-4 py-4 text-sm font-mono text-slate-600">#{order.order_id?.slice(0, 8)}</td>
                      <td className="px-4 py-4">
                        <p className="text-sm font-medium text-slate-900 truncate max-w-[140px]">{order.shipping_address?.name || order.email}</p>
                        <p className="text-xs text-slate-500 truncate max-w-[140px]">{order.email}</p>
                      </td>
                      <td className="px-4 py-4">
                        {(() => {
                          const label = getOrderTypeLabel(order);
                          return label === 'B2B'
                            ? <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-indigo-100 text-indigo-700"><Briefcase className="w-3 h-3" />{order._source === 'b2b' ? (order.order_type === 'businesscard' ? 'Visitkort' : order.order_type === 'print' ? 'Utskrift' : 'Katalog') : 'B2B'}</span>
                            : <span className="text-xs text-slate-500">Webbshop</span>;
                        })()}
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-500">{new Date(order.created_at).toLocaleDateString('sv-SE')}</td>
                      <td className="px-4 py-4 text-sm font-medium text-slate-900">{(order.total_amount || order.total)?.toLocaleString('sv-SE')} kr</td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}>
                          {getStatusIcon(order.status)} {getStatusLabel(order.status)}
                        </span>
                      </td>
                      <td className="px-4 py-4 sticky right-0 bg-white">
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" data-testid={`view-order-${order.order_id}`}>
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handlePrint(order); }} title="Skriv ut order" data-testid={`print-order-${order.order_id}`}>
                            <Printer className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleDeleteOrder(order.order_id); }} title="Ta bort order" className="hover:text-red-500" data-testid={`delete-order-${order.order_id}`}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-slate-500">Inga beställningar hittades</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <OrderDetailPanel
            selectedOrder={selectedOrder}
            onUpdateStatus={updateOrderStatus}
            onPrint={handlePrint}
            onDelete={handleDeleteOrder}
            toast={toast}
          />
        </div>
      </div>
    </div>
  );
};

export default AdminOrders;
