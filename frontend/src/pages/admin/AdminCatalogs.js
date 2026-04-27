import { useState, useEffect } from 'react';
import { BookOpen, Building2, Mail, Phone, MapPin, Clock, Download, FileDown, Printer, CreditCard, Plus, Edit, Trash2, X, Upload, Eye, EyeOff, GripVertical } from 'lucide-react';
import api from '../../services/api';
import { useAdmin } from '../../context/AdminContext';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { toast } from 'sonner';

const AdminCatalogs = () => {
  const { token } = useAdmin();
  const [activeView, setActiveView] = useState('items');
  const [orders, setOrders] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [catalogFilter, setCatalogFilter] = useState('all');
  const [editingItem, setEditingItem] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const getAuthHeaders = () => ({ Authorization: `Bearer ${token}` });

  const [formData, setFormData] = useState({
    name: '', description: '', features: '', category: '', price: 0,
    images: [''], sort_order: 0, visible: true, catalog_type: 'physical'
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [ordersRes, itemsRes] = await Promise.all([
          api.get('/catalog/orders', { headers: getAuthHeaders() }).catch(() => ({ data: [] })),
          api.get('/admin/catalog-items', { headers: getAuthHeaders() }),
        ]);
        setOrders(ordersRes.data);
        setItems(itemsRes.data);
      } catch {
        toast.error('Kunde inte hämta data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token]);

  const backendUrl = process.env.REACT_APP_BACKEND_URL || '';

  const resetForm = () => {
    setFormData({ name: '', description: '', features: '', category: '', price: 0, images: [''], sort_order: 0, visible: true, catalog_type: 'physical' });
    setEditingItem(null);
    setShowForm(false);
  };

  const openEdit = (item) => {
    setFormData({
      name: item.name || '',
      description: item.description || '',
      features: (item.features || []).join('\n'),
      category: item.category || '',
      price: item.price || 0,
      images: item.images?.length ? [...item.images] : (item.image_url ? [item.image_url] : ['']),
      sort_order: item.sort_order || 0,
      visible: item.visible !== false,
      catalog_type: item.catalog_type || 'physical',
    });
    setEditingItem(item);
    setShowForm(true);
  };

  const handleImageUpload = async (file, index) => {
    if (!file) return;
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await api.post('/upload', fd, { headers: { ...getAuthHeaders(), 'Content-Type': 'multipart/form-data' } });
      const url = `${backendUrl}${res.data.url}`;
      setFormData(prev => {
        const newImages = [...prev.images];
        newImages[index] = url;
        return { ...prev, images: newImages };
      });
      toast.success('Bild uppladdad');
    } catch {
      toast.error('Kunde inte ladda upp bilden');
    }
  };

  const addImageSlot = () => setFormData(prev => ({ ...prev, images: [...prev.images, ''] }));
  const removeImage = (index) => setFormData(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));

  const handleSave = async () => {
    if (!formData.name.trim()) { toast.error('Namn krävs'); return; }
    const payload = {
      ...formData,
      images: formData.images.filter(img => img.trim()),
      image_url: formData.images.find(img => img.trim()) || '',
      features: formData.features.split('\n').filter(f => f.trim()),
    };
    try {
      if (editingItem) {
        const res = await api.put(`/admin/catalog-items/${editingItem.item_id}`, payload, { headers: getAuthHeaders() });
        setItems(prev => prev.map(i => i.item_id === editingItem.item_id ? res.data : i));
        toast.success('Artikel uppdaterad');
      } else {
        const res = await api.post('/admin/catalog-items', payload, { headers: getAuthHeaders() });
        setItems(prev => [...prev, res.data]);
        toast.success('Artikel tillagd');
      }
      resetForm();
    } catch {
      toast.error('Kunde inte spara');
    }
  };

  const handleDelete = async (itemId) => {
    if (!window.confirm('Ta bort artikeln?')) return;
    try {
      await api.delete(`/admin/catalog-items/${itemId}`, { headers: getAuthHeaders() });
      setItems(prev => prev.filter(i => i.item_id !== itemId));
      toast.success('Borttagen');
    } catch {
      toast.error('Kunde inte ta bort');
    }
  };

  const toggleVisibility = async (item) => {
    try {
      const res = await api.put(`/admin/catalog-items/${item.item_id}`, { visible: !item.visible }, { headers: getAuthHeaders() });
      setItems(prev => prev.map(i => i.item_id === item.item_id ? res.data : i));
    } catch {
      toast.error('Kunde inte uppdatera');
    }
  };

  // ─── Filtered items ───
  const filteredItems = catalogFilter === 'all' ? items : items.filter(i => i.catalog_type === catalogFilter);

  // ─── Filtered orders ───
  const filteredOrders = filter === 'all' ? orders : orders.filter(o => {
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

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2a9d8f]" /></div>;

  return (
    <div className="space-y-6" data-testid="admin-catalogs">
      {/* Top tabs: Items vs Orders */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
        <button onClick={() => setActiveView('items')}
          className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all ${activeView === 'items' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
          data-testid="view-items">
          Kataloginnehåll
        </button>
        <button onClick={() => setActiveView('orders')}
          className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all ${activeView === 'orders' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
          data-testid="view-orders">
          Beställningar ({orders.length})
        </button>
      </div>

      {/* ─── ITEMS VIEW ─── */}
      {activeView === 'items' && (
        <>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Kataloginnehåll</h1>
              <p className="text-sm text-slate-500 mt-1">Hantera produkterna i din fysiska och digitala katalog</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
                {[{id:'all',label:'Alla'},{id:'physical',label:'Fysisk'},{id:'digital',label:'Digital'}].map(f => (
                  <button key={f.id} onClick={() => setCatalogFilter(f.id)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${catalogFilter === f.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
                    data-testid={`catalog-filter-${f.id}`}>
                    {f.label}
                  </button>
                ))}
              </div>
              <Button onClick={() => { resetForm(); setShowForm(true); }} size="sm" className="bg-[#2a9d8f] hover:bg-[#238b7e]" data-testid="add-catalog-item">
                <Plus className="w-4 h-4 mr-1" /> Lägg till produkt
              </Button>
            </div>
          </div>

          {/* Items grid */}
          {filteredItems.length === 0 ? (
            <div className="bg-white rounded-xl p-12 text-center border">
              <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 mb-4">Inga produkter i katalogen ännu</p>
              <Button onClick={() => { resetForm(); setShowForm(true); }} className="bg-[#2a9d8f] hover:bg-[#238b7e]">
                <Plus className="w-4 h-4 mr-1" /> Lägg till din första produkt
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredItems.map(item => (
                <div key={item.item_id} className={`bg-white rounded-xl border overflow-hidden group ${!item.visible ? 'opacity-50 grayscale' : ''}`} data-testid={`catalog-item-${item.item_id}`}>
                  <div className="aspect-[4/3] bg-slate-100 relative">
                    {(item.images?.[0] || item.image_url) ? (
                      <img src={item.images?.[0] || item.image_url} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><BookOpen className="w-10 h-10 text-slate-300" /></div>
                    )}
                    <div className="absolute top-2 left-2 flex gap-1">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${item.catalog_type === 'digital' ? 'bg-orange-100 text-orange-700' : 'bg-teal-100 text-teal-700'}`}>
                        {item.catalog_type === 'digital' ? 'Digital' : 'Fysisk'}
                      </span>
                      {!item.visible && <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-100 text-red-700">Dold</span>}
                    </div>
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => toggleVisibility(item)} className="w-7 h-7 rounded-lg bg-white/90 flex items-center justify-center shadow-sm hover:bg-white" data-testid={`toggle-vis-${item.item_id}`}>
                        {item.visible ? <Eye className="w-3.5 h-3.5 text-slate-600" /> : <EyeOff className="w-3.5 h-3.5 text-slate-400" />}
                      </button>
                      <button onClick={() => openEdit(item)} className="w-7 h-7 rounded-lg bg-white/90 flex items-center justify-center shadow-sm hover:bg-white" data-testid={`edit-${item.item_id}`}>
                        <Edit className="w-3.5 h-3.5 text-slate-600" />
                      </button>
                      <button onClick={() => handleDelete(item.item_id)} className="w-7 h-7 rounded-lg bg-white/90 flex items-center justify-center shadow-sm hover:bg-red-50" data-testid={`delete-${item.item_id}`}>
                        <Trash2 className="w-3.5 h-3.5 text-red-500" />
                      </button>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-1">
                      <h3 className="font-semibold text-slate-900 text-sm leading-tight">{item.name}</h3>
                      <span className="text-sm font-bold text-[#2a9d8f] shrink-0 ml-2">{item.price > 0 ? `${item.price} kr` : 'Gratis'}</span>
                    </div>
                    {item.category && <p className="text-xs text-slate-400 mb-1">{item.category}</p>}
                    {item.description && <p className="text-xs text-slate-500 line-clamp-2">{item.description}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add/Edit Modal */}
          {showForm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={(e) => { if (e.target === e.currentTarget) resetForm(); }}>
              <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 space-y-5" data-testid="catalog-item-form">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-slate-900">{editingItem ? 'Redigera produkt' : 'Lägg till produkt'}</h2>
                  <button onClick={resetForm} className="p-1.5 rounded-lg hover:bg-slate-100"><X className="w-5 h-5" /></button>
                </div>

                <div className="space-y-4">
                  {/* Catalog type */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Katalogtyp</label>
                    <div className="flex gap-2">
                      {['physical', 'digital'].map(t => (
                        <button key={t} type="button" onClick={() => setFormData(prev => ({ ...prev, catalog_type: t }))}
                          className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border-2 transition-all ${formData.catalog_type === t ? 'border-[#2a9d8f] bg-[#2a9d8f]/5 text-[#2a9d8f]' : 'border-slate-200 text-slate-500'}`}
                          data-testid={`type-${t}`}>
                          {t === 'physical' ? 'Fysisk katalog' : 'Digital katalog'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Images — multiple */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Produktbilder</label>
                    {formData.images.map((img, idx) => (
                      <div key={idx} className="flex gap-2 mb-2 items-center">
                        {img ? (
                          <div className="w-16 h-16 rounded-lg overflow-hidden bg-slate-100 shrink-0 border">
                            <img src={img} alt="" className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; }} />
                          </div>
                        ) : null}
                        <label className="flex-1 flex items-center justify-center gap-2 border-2 border-dashed border-slate-300 hover:border-[#2a9d8f] rounded-lg py-3 cursor-pointer bg-white group text-sm text-slate-500">
                          <Upload className="w-4 h-4 group-hover:text-[#2a9d8f]" />
                          {img ? 'Byt bild' : 'Ladda upp bild'}
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e.target.files?.[0], idx)} />
                        </label>
                        {formData.images.length > 1 && (
                          <button type="button" onClick={() => removeImage(idx)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 shrink-0">
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                    <button type="button" onClick={addImageSlot} className="text-sm text-[#2a9d8f] hover:underline flex items-center gap-1 mt-1">
                      <Plus className="w-3.5 h-3.5" /> Lägg till fler bilder
                    </button>
                  </div>

                  {/* Name + Category */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Produktnamn *</label>
                      <Input value={formData.name} onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))} placeholder="T.ex. Fotomugg" data-testid="item-name" />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Kategori</label>
                      <Input value={formData.category} onChange={e => setFormData(prev => ({ ...prev, category: e.target.value }))} placeholder="T.ex. Muggar" data-testid="item-category" />
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Beskrivning</label>
                    <textarea
                      value={formData.description}
                      onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Beskriv produkten i detalj — material, mått, användning..."
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2a9d8f] min-h-[100px] resize-y"
                      data-testid="item-description"
                    />
                  </div>

                  {/* Features / bullet points */}
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Egenskaper (en per rad)</label>
                    <textarea
                      value={formData.features}
                      onChange={e => setFormData(prev => ({ ...prev, features: e.target.value }))}
                      placeholder={"Högkvalitativt tryck\nDiskmaskinssäker\nFler storlekar"}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2a9d8f] min-h-[80px] resize-y"
                      data-testid="item-features"
                    />
                  </div>

                  {/* Price + Sort */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Pris (kr)</label>
                      <Input type="number" min="0" step="0.01" value={formData.price} onChange={e => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))} data-testid="item-price" />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Sorteringsordning</label>
                      <Input type="number" min="0" value={formData.sort_order} onChange={e => setFormData(prev => ({ ...prev, sort_order: parseInt(e.target.value) || 0 }))} data-testid="item-sort" />
                    </div>
                  </div>

                  {/* Visible toggle — prominent */}
                  <div className={`flex items-center justify-between p-3 rounded-lg border-2 cursor-pointer transition-all ${formData.visible ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}
                    onClick={() => setFormData(prev => ({ ...prev, visible: !prev.visible }))}>
                    <div className="flex items-center gap-2">
                      {formData.visible ? <Eye className="w-4 h-4 text-green-600" /> : <EyeOff className="w-4 h-4 text-red-500" />}
                      <span className="text-sm font-medium">{formData.visible ? 'Synlig i katalogen' : 'Dold — visas inte for kunder'}</span>
                    </div>
                    <div className={`w-10 h-6 rounded-full flex items-center px-0.5 transition-colors ${formData.visible ? 'bg-green-500 justify-end' : 'bg-red-400 justify-start'}`}>
                      <div className="w-5 h-5 rounded-full bg-white shadow" />
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button variant="outline" onClick={resetForm} className="flex-1">Avbryt</Button>
                  <Button onClick={handleSave} className="flex-1 bg-[#2a9d8f] hover:bg-[#238b7e]" data-testid="save-catalog-item">
                    {editingItem ? 'Spara ändringar' : 'Lägg till'}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ─── ORDERS VIEW ─── */}
      {activeView === 'orders' && (
        <>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Katalogbeställningar</h1>
              <p className="text-sm text-slate-500 mt-1">{orders.length} beställningar totalt</p>
            </div>
            <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
              {[{id:'all',label:'Alla'},{id:'our',label:'Vår katalog'},{id:'print',label:'Utskrift'},{id:'businesscard',label:'Visitkort'}].map(f => (
                <button key={f.id} onClick={() => setFilter(f.id)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${filter === f.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
                  data-testid={`filter-${f.id}`}>
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {filteredOrders.length === 0 ? (
            <div className="bg-white rounded-xl p-12 text-center border">
              <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">Inga katalogbeställningar</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map(order => (
                <div key={order.order_id} className="bg-white rounded-xl border p-5" data-testid={`catalog-order-${order.order_id}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-[#2a9d8f]/10">
                        <BookOpen className="w-5 h-5 text-[#2a9d8f]" />
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
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 text-sm font-medium transition-colors">
                          <Download className="w-4 h-4" />{order.original_filename || 'PDF'}
                        </a>
                      )}
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${order.status === 'pending' ? 'bg-amber-50 text-amber-700' : 'bg-green-50 text-green-700'}`}>
                        {order.status === 'pending' ? 'Väntar' : 'Skickad'}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                    {order.email && <div className="flex items-center gap-2 text-slate-600"><Mail className="w-4 h-4 text-slate-400 shrink-0" /><span className="truncate">{order.email}</span></div>}
                    {order.phone && <div className="flex items-center gap-2 text-slate-600"><Phone className="w-4 h-4 text-slate-400 shrink-0" /><span>{order.phone}</span></div>}
                    {order.address && <div className="flex items-center gap-2 text-slate-600"><MapPin className="w-4 h-4 text-slate-400 shrink-0" /><span className="truncate">{order.address}, {order.postal_code} {order.city}</span></div>}
                    <div className="flex items-center gap-2 text-slate-600"><Clock className="w-4 h-4 text-slate-400 shrink-0" /><span>{new Date(order.created_at).toLocaleDateString('sv-SE')}</span></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminCatalogs;
