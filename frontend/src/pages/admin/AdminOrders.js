import { useState, useEffect } from 'react';
import { useAdmin } from '../../context/AdminContext';
import api from '../../services/api';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { toast } from 'sonner';
import { Search, Eye, Package, Truck, CheckCircle, Clock, Printer, Download, Image as ImageIcon } from 'lucide-react';

const API_BASE = process.env.REACT_APP_BACKEND_URL;

const AdminOrders = () => {
  const { getAuthHeaders } = useAdmin();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => { fetchOrders(); }, [statusFilter]);

  const fetchOrders = async () => {
    try {
      const params = statusFilter !== 'all' ? `?status=${statusFilter}` : '';
      const response = await api.get(`/admin/orders${params}`, { headers: getAuthHeaders() });
      setOrders(response.data.orders || []);
    } catch {
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
    } catch {
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

  // ─── PRINT FUNCTION ────────────────────────────────
  const handlePrint = (order) => {
    const formatDate = (d) => new Date(d).toLocaleString('sv-SE');
    const formatCustomization = (c) => {
      if (!c) return '';
      const lines = [];
      if (c.type === 'nametag') {
        if (c.child_name) lines.push(`Namn: ${c.child_name}`);
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
        if (c.months) {
          const monthsWithImg = c.months.filter(m => m.image_url || m.hasImage);
          lines.push(`Månader med bilder: ${monthsWithImg.map(m => m.month).join(', ')}`);
        }
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
      const itemName = item.product_name || item.name || 'Produkt';
      let imagesHtml = '';
      if (item.customization?.uploaded_image_url) {
        const imgUrl = item.customization.uploaded_image_url.startsWith('http')
          ? item.customization.uploaded_image_url
          : `${API_BASE}${item.customization.uploaded_image_url}`;
        imagesHtml = `<br/><img src="${imgUrl}" style="width:80px;height:80px;object-fit:cover;border-radius:4px;margin-top:6px;border:1px solid #e2e8f0;"/>`;
      }
      if (item.customization?.pages) {
        const pageImgs = item.customization.pages
          .filter(pg => pg.image_urls?.length > 0)
          .map(pg => pg.image_urls.map(url => {
            const imgUrl = url.startsWith('http') ? url : `${API_BASE}${url}`;
            return `<img src="${imgUrl}" style="width:60px;height:60px;object-fit:cover;border-radius:4px;border:1px solid #e2e8f0;"/>`;
          }).join('')).join('');
        if (pageImgs) {
          imagesHtml = `<br/><div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:6px;">${pageImgs}</div>`;
        }
      }
      if (item.customization?.months) {
        const monthImgs = item.customization.months
          .filter(m => m.image_url)
          .map(m => {
            const imgUrl = m.image_url.startsWith('http') ? m.image_url : `${API_BASE}${m.image_url}`;
            return `<div style="text-align:center;"><img src="${imgUrl}" style="width:60px;height:60px;object-fit:cover;border-radius:4px;border:1px solid #e2e8f0;"/><br/><span style="font-size:10px;">${m.month}</span></div>`;
          }).join('');
        if (monthImgs) {
          imagesHtml += `<br/><div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:6px;">${monthImgs}</div>`;
        }
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
    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="sv">
      <head>
        <meta charset="UTF-8"/>
        <title>Order #${order.order_id?.slice(0, 8)}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1e293b; padding: 40px; font-size: 14px; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #2a9d8f; padding-bottom: 20px; margin-bottom: 30px; }
          .logo { font-size: 28px; font-weight: bold; color: #2a9d8f; }
          .logo span { font-size: 12px; color: #64748b; display: block; font-weight: normal; }
          .order-id { text-align: right; }
          .order-id h2 { font-size: 18px; color: #1e293b; }
          .order-id p { font-size: 12px; color: #64748b; }
          .section { margin-bottom: 24px; }
          .section h3 { font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; margin-bottom: 8px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
          .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
          .info-row { margin-bottom: 6px; }
          .info-label { font-size: 11px; color: #94a3b8; text-transform: uppercase; }
          .info-value { font-size: 14px; color: #1e293b; }
          table { width: 100%; border-collapse: collapse; }
          th { padding: 10px; text-align: left; background: #f1f5f9; font-size: 12px; text-transform: uppercase; color: #64748b; letter-spacing: 0.3px; }
          th:last-child, th:nth-child(4) { text-align: right; }
          th:nth-child(3) { text-align: center; }
          .total-row { border-top: 2px solid #1e293b; }
          .total-row td { padding: 12px 10px; font-weight: bold; font-size: 16px; }
          .status { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
          .status-pending { background: #fef3c7; color: #92400e; }
          .status-processing { background: #dbeafe; color: #1e40af; }
          .status-shipped { background: #ede9fe; color: #5b21b6; }
          .status-completed { background: #dcfce7; color: #166534; }
          .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; color: #94a3b8; font-size: 11px; }
          @media print {
            body { padding: 20px; }
            @page { margin: 15mm; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">
            Printout
            <span>Personliga tryckprodukter</span>
          </div>
          <div class="order-id">
            <h2>Order #${order.order_id?.slice(0, 8)}</h2>
            <p>${formatDate(order.created_at)}</p>
            <span class="status status-${order.status}">${getStatusLabel(order.status)}</span>
          </div>
        </div>

        <div class="grid-2">
          <div class="section">
            <h3>Kunduppgifter</h3>
            ${order.shipping_address ? `
              <div class="info-row"><div class="info-label">Namn</div><div class="info-value">
                ${order.shipping_address.name || [order.shipping_address.first_name, order.shipping_address.last_name].filter(Boolean).join(' ') || '—'}
              </div></div>
            ` : ''}
            ${order.email ? `<div class="info-row"><div class="info-label">E-post</div><div class="info-value">${order.email}</div></div>` : ''}
            ${order.shipping_address?.phone ? `<div class="info-row"><div class="info-label">Telefon</div><div class="info-value">${order.shipping_address.phone}</div></div>` : ''}
            ${order.shipping_address ? `
              <div class="info-row"><div class="info-label">Leveransadress</div><div class="info-value">
                ${order.shipping_address.street || order.shipping_address.address || ''}<br/>
                ${order.shipping_address.zip || order.shipping_address.postal_code || ''} ${order.shipping_address.city || ''}
              </div></div>
            ` : ''}
          </div>
          <div class="section">
            <h3>Orderinformation</h3>
            <div class="info-row"><div class="info-label">Order-ID</div><div class="info-value" style="font-family:monospace;">${order.order_id}</div></div>
            <div class="info-row"><div class="info-label">Beställd</div><div class="info-value">${formatDate(order.created_at)}</div></div>
            <div class="info-row"><div class="info-label">Betalning</div><div class="info-value">${order.payment_status === 'paid' ? 'Betald' : order.payment_status || 'Ej betald'}</div></div>
          </div>
        </div>

        <div class="section">
          <h3>Produkter</h3>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Produkt</th>
                <th>Antal</th>
                <th>Pris/st</th>
                <th>Summa</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml || '<tr><td colspan="5" style="padding:20px;text-align:center;color:#94a3b8;">Inga produkter</td></tr>'}
              <tr class="total-row">
                <td colspan="4" style="text-align:right;">Totalt:</td>
                <td style="text-align:right;">${(order.total_amount || order.total)?.toLocaleString('sv-SE')} kr</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="footer">
          <p>Printout AB &bull; info@printout.se &bull; 08-123 456 78</p>
          <p style="margin-top:4px;">Utskriven ${new Date().toLocaleString('sv-SE')}</p>
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 300);
  };

  const filteredOrders = orders.filter(order =>
    order.order_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const downloadAllImages = (item) => {
    const urls = item.customization?.pages?.flatMap(pg => pg.image_urls || []) || [];
    if (urls.length === 0) { toast.error('Inga bilder att ladda ner'); return; }
    urls.forEach((url, i) => {
      const a = document.createElement('a');
      a.href = `${API_BASE}${url}`;
      a.download = `sida-${i + 1}${url.substring(url.lastIndexOf('.'))}`;
      a.target = '_blank';
      document.body.appendChild(a);
      setTimeout(() => { a.click(); document.body.removeChild(a); }, i * 300);
    });
    toast.success(`Laddar ner ${urls.length} bilder...`);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="spinner" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Beställningar</h1>
        <p className="text-slate-500">Hantera och följ upp kundernas beställningar</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input placeholder="Sök på order-ID eller e-post..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
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
                      <td className="px-6 py-4 text-sm font-mono text-slate-600">#{order.order_id?.slice(0, 8)}</td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-slate-900">{order.shipping_address?.name || order.email}</p>
                        <p className="text-xs text-slate-500">{order.email}</p>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500">{new Date(order.created_at).toLocaleDateString('sv-SE')}</td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-900">{(order.total_amount || order.total)?.toLocaleString('sv-SE')} kr</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}>
                          {getStatusIcon(order.status)} {getStatusLabel(order.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" data-testid={`view-order-${order.order_id}`}>
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => { e.stopPropagation(); handlePrint(order); }}
                            title="Skriv ut order"
                            data-testid={`print-order-${order.order_id}`}
                          >
                            <Printer className="w-4 h-4" />
                          </Button>
                        </div>
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
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Orderdetaljer</h3>
                  <p className="text-sm text-slate-500 font-mono">#{selectedOrder.order_id}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePrint(selectedOrder)}
                  data-testid="print-selected-order"
                >
                  <Printer className="w-4 h-4 mr-1.5" />
                  Skriv ut
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-xs text-slate-500 uppercase">Kund</p>
                  <p className="text-sm font-medium text-slate-900">{selectedOrder.shipping_address?.name || selectedOrder.shipping_address?.first_name ? `${selectedOrder.shipping_address?.first_name || ''} ${selectedOrder.shipping_address?.last_name || ''}`.trim() : '—'}</p>
                  <p className="text-sm text-slate-600">{selectedOrder.email}</p>
                  {selectedOrder.shipping_address?.phone && (
                    <p className="text-sm text-slate-600">Tel: {selectedOrder.shipping_address.phone}</p>
                  )}
                </div>

                <div>
                  <p className="text-xs text-slate-500 uppercase">Leveransadress</p>
                  {selectedOrder.shipping_address ? (
                    <div className="text-sm text-slate-900">
                      {selectedOrder.shipping_address.name && <p className="font-medium">{selectedOrder.shipping_address.name}</p>}
                      {(selectedOrder.shipping_address.street || selectedOrder.shipping_address.address) && (
                        <p>{selectedOrder.shipping_address.street || selectedOrder.shipping_address.address}</p>
                      )}
                      <p>
                        {selectedOrder.shipping_address.zip || selectedOrder.shipping_address.postal_code || ''}{' '}
                        {selectedOrder.shipping_address.city || ''}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-400">Ingen adress angiven</p>
                  )}
                </div>

                <div>
                  <p className="text-xs text-slate-500 uppercase">Datum</p>
                  <p className="text-sm text-slate-900">{new Date(selectedOrder.created_at).toLocaleString('sv-SE')}</p>
                </div>

                <div>
                  <p className="text-xs text-slate-500 uppercase">Produkter</p>
                  <div className="mt-2 space-y-3">
                    {selectedOrder.items?.map((item, index) => (
                      <div key={index} className="border border-slate-100 rounded-lg p-3">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium text-slate-800">{item.product_name || item.name || 'Produkt'}</span>
                          <span className="text-slate-900">{item.price} kr</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">Antal: {item.quantity || 1}</p>
                        {item.customization && (
                          <div className="mt-2 bg-slate-50 rounded p-2 text-xs text-slate-600 space-y-1">
                            {item.customization.type === 'nametag' && (
                              <>
                                {item.customization.child_name && <p>Namn: <strong>{item.customization.child_name}</strong></p>}
                                {item.customization.font && <p>Typsnitt: {item.customization.font}</p>}
                                {item.customization.font_color && <p>Typsnittsfärg: <span style={{color: item.customization.font_color}}>{item.customization.font_color}</span></p>}
                                {item.customization.motif && <p>Motiv: {item.customization.motif}</p>}
                                {item.customization.background && <p>Bakgrund: {item.customization.background}</p>}
                                {item.customization.uploaded_image_url && (
                                  <div className="mt-2">
                                    <p className="mb-1 font-medium">Uppladdad bild:</p>
                                    <img
                                      src={item.customization.uploaded_image_url.startsWith('http') ? item.customization.uploaded_image_url : `${API_BASE}${item.customization.uploaded_image_url}`}
                                      alt="Kunduppladdning"
                                      className="w-20 h-20 object-cover rounded border"
                                    />
                                    <a
                                      href={item.customization.uploaded_image_url.startsWith('http') ? item.customization.uploaded_image_url : `${API_BASE}${item.customization.uploaded_image_url}`}
                                      download
                                      target="_blank"
                                      rel="noreferrer"
                                      className="flex items-center gap-1 mt-1 text-[#2a9d8f] hover:underline"
                                    >
                                      <Download className="w-3 h-3" /> Ladda ner
                                    </a>
                                  </div>
                                )}
                              </>
                            )}
                            {item.customization.type === 'photoalbum' && (
                              <>
                                <p>Sidor: {item.customization.total_pages}</p>
                                <p>Bilder: {item.customization.total_images || item.customization.images_count}</p>
                                {item.customization.size && <p>Storlek: {item.customization.size}</p>}
                                {item.customization.pages?.some(pg => pg.image_urls?.length > 0) && (
                                  <div className="mt-2">
                                    <p className="font-medium mb-1">Bilder per sida:</p>
                                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                                      {item.customization.pages.filter(pg => pg.image_urls?.length > 0).map((pg) => (
                                        <div key={pg.page_number} className="border rounded p-2 bg-white">
                                          <p className="text-xs text-slate-500 mb-1">Sida {pg.page_number} ({pg.layout})</p>
                                          <div className="flex gap-1 flex-wrap">
                                            {pg.image_urls.map((url, imgIdx) => {
                                              const imgUrl = url.startsWith('http') ? url : `${API_BASE}${url}`;
                                              return (
                                                <div key={imgIdx} className="relative group">
                                                  <img
                                                    src={imgUrl}
                                                    alt={`S${pg.page_number}-${imgIdx + 1}`}
                                                    className="w-14 h-14 object-cover rounded border"
                                                  />
                                                  <a
                                                    href={imgUrl}
                                                    download
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded"
                                                  >
                                                    <Download className="w-4 h-4 text-white" />
                                                  </a>
                                                </div>
                                              );
                                            })}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                    <button
                                      onClick={() => downloadAllImages(item)}
                                      className="flex items-center gap-1.5 mt-2 text-xs font-medium text-[#2a9d8f] hover:underline"
                                      data-testid="download-all-images"
                                    >
                                      <Download className="w-3.5 h-3.5" />
                                      Ladda ner alla bilder
                                    </button>
                                  </div>
                                )}
                              </>
                            )}
                            {!['nametag', 'photoalbum'].includes(item.customization.type) && item.customization.type === 'calendar' && (
                              <>
                                {item.customization.year && <p>År: <strong>{item.customization.year}</strong></p>}
                                {item.customization.size && <p>Storlek: {item.customization.size}</p>}
                                <p>Bilder: {item.customization.images_count || 0} / 12</p>
                                {item.customization.months?.some(m => m.image_url) && (
                                  <div className="mt-2">
                                    <p className="font-medium mb-1">Månadsbilder:</p>
                                    <div className="space-y-1 max-h-[300px] overflow-y-auto">
                                      {item.customization.months.filter(m => m.image_url).map((m, idx) => {
                                        const imgUrl = m.image_url.startsWith('http') ? m.image_url : `${API_BASE}${m.image_url}`;
                                        return (
                                          <div key={idx} className="flex items-center gap-2 border rounded p-1.5 bg-white">
                                            <img src={imgUrl} alt={m.month} className="w-10 h-10 object-cover rounded border" />
                                            <span className="text-xs text-slate-600">{m.month}</span>
                                            <a href={imgUrl} download target="_blank" rel="noreferrer" className="ml-auto text-[#2a9d8f] hover:underline">
                                              <Download className="w-3 h-3" />
                                            </a>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}
                              </>
                            )}
                            {item.customization.type === 'design' && (
                              <>
                                {item.customization.text && <p>Text: <strong>{item.customization.text}</strong></p>}
                                {item.customization.text_font && <p>Typsnitt: {item.customization.text_font}</p>}
                                {item.customization.text_color && <p>Textfärg: <span style={{color: item.customization.text_color}}>{item.customization.text_color}</span></p>}
                                {item.customization.color && <p>Produktfärg: {item.customization.color}</p>}
                                {item.customization.size && <p>Storlek: {item.customization.size}</p>}
                                {item.customization.placement_notes && <p>Placeringsönskemål: <em>{item.customization.placement_notes}</em></p>}
                                {item.customization.uploaded_image_url && (
                                  <div className="mt-2">
                                    <p className="mb-1 font-medium">Kundens bild:</p>
                                    <img
                                      src={item.customization.uploaded_image_url.startsWith('http') ? item.customization.uploaded_image_url : `${API_BASE}${item.customization.uploaded_image_url}`}
                                      alt="Kunddesign"
                                      className="w-24 h-24 object-cover rounded border"
                                    />
                                    <a
                                      href={item.customization.uploaded_image_url.startsWith('http') ? item.customization.uploaded_image_url : `${API_BASE}${item.customization.uploaded_image_url}`}
                                      download
                                      target="_blank"
                                      rel="noreferrer"
                                      className="flex items-center gap-1 mt-1 text-[#2a9d8f] hover:underline"
                                    >
                                      <Download className="w-3 h-3" /> Ladda ner
                                    </a>
                                  </div>
                                )}
                              </>
                            )}
                            {!['nametag', 'photoalbum', 'calendar', 'design'].includes(item.customization.type) && (
                              <p>Typ: {item.customization.type}</p>
                            )}
                          </div>
                        )}
                      </div>
                    )) || <p className="text-sm text-slate-500">Inga produkter</p>}
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <div className="flex justify-between text-sm font-medium">
                    <span className="text-slate-600">Totalt</span>
                    <span className="text-lg text-slate-900">{(selectedOrder.total_amount || selectedOrder.total)?.toLocaleString('sv-SE')} kr</span>
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
