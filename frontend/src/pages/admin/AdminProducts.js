import { useState, useEffect, useCallback } from 'react';
import { useAdmin } from '../../context/AdminContext';
import api from '../../services/api';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { toast } from 'sonner';
import { Plus, Search, Edit, Trash2, Package, X, Palette, Ruler, Briefcase, Upload, Image } from 'lucide-react';

// ─── Tag Input Component ──────────────────────────
function TagInput({ tags, onChange, placeholder, testId }) {
  const [inputValue, setInputValue] = useState('');

  const addTag = () => {
    const val = inputValue.trim();
    if (val && !tags.includes(val)) {
      onChange([...tags, val]);
    }
    setInputValue('');
  };

  const removeTag = (index) => {
    onChange(tags.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  return (
    <div>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {tags.map((tag, i) => (
          <span
            key={`${tag}-${i}`}
            className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 text-sm px-2.5 py-1 rounded-full"
            data-testid={`${testId}-tag-${i}`}
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(i)}
              className="hover:text-red-500 transition-colors"
              data-testid={`${testId}-remove-${i}`}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1"
          data-testid={`${testId}-input`}
        />
        <Button type="button" variant="outline" size="sm" onClick={addTag} data-testid={`${testId}-add-btn`}>
          <Plus className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

const AdminProducts = () => {
  const { getAuthHeaders } = useAdmin();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    description: '',
    price: '',
    images: [''],
    colors: [],
    sizes: [],
    model_type: 'mug',
    quantity_prices: [],
    color_images: {},
  });

  const fetchProducts = useCallback(async () => {
    try {
      const response = await api.get('/admin/products', { headers: getAuthHeaders() });
      setProducts(response.data.products || []);
    } catch (error) {
      toast.error('Kunde inte hämta produkter');
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const productData = {
      ...formData,
      price: parseFloat(formData.price),
      images: formData.images.filter(img => img.trim() !== '')
    };

    try {
      if (editingProduct) {
        await api.put(`/admin/products/${editingProduct.product_id}`, productData, { headers: getAuthHeaders() });
        toast.success('Produkt uppdaterad');
      } else {
        await api.post('/admin/products', productData, { headers: getAuthHeaders() });
        toast.success('Produkt skapad');
      }
      setShowModal(false);
      resetForm();
      fetchProducts();
    } catch (error) {
      toast.error('Kunde inte spara produkt');
    }
  };

  const handleDelete = async (productId) => {
    if (!confirm('Är du säker på att du vill ta bort denna produkt?')) return;

    try {
      await api.delete(`/admin/products/${productId}`, { headers: getAuthHeaders() });
      toast.success('Produkt raderad');
      fetchProducts();
    } catch (error) {
      toast.error('Kunde inte radera produkt');
    }
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      category: product.category,
      description: product.description,
      price: product.price.toString(),
      images: product.images.length > 0 ? product.images : [''],
      colors: product.colors || [],
      sizes: product.sizes || [],
      model_type: product.model_type,
      quantity_prices: product.quantity_prices || [],
      color_images: product.color_images || {},
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      category: '',
      description: '',
      price: '',
      images: [''],
      colors: [],
      sizes: [],
      model_type: 'mug',
      quantity_prices: [],
      color_images: {},
    });
  };

  const addImageField = () => {
    setFormData(prev => ({ ...prev, images: [...prev.images, ''] }));
  };

  const updateImage = (index, value) => {
    const newImages = [...formData.images];
    newImages[index] = value;
    setFormData(prev => ({ ...prev, images: newImages }));
  };

  const removeImage = (index) => {
    const newImages = formData.images.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, images: newImages.length > 0 ? newImages : [''] }));
  };

  const handleImageUpload = async (index, file) => {
    if (!file) return;
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      toast.error('Bara JPG, PNG eller WebP');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Max 10MB');
      return;
    }
    try {
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);
      const res = await api.post('/upload', formDataUpload, { headers: { ...getAuthHeaders(), 'Content-Type': 'multipart/form-data' } });
      const url = `${process.env.REACT_APP_BACKEND_URL}${res.data.url}`;
      updateImage(index, url);
      toast.success('Bild uppladdad!');
    } catch {
      toast.error('Kunde inte ladda upp bilden');
    }
  };

  const handleNewImageUpload = async (file) => {
    if (!file) return;
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      toast.error('Bara JPG, PNG eller WebP');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Max 10MB');
      return;
    }
    try {
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);
      const res = await api.post('/upload', formDataUpload, { headers: { ...getAuthHeaders(), 'Content-Type': 'multipart/form-data' } });
      const url = `${process.env.REACT_APP_BACKEND_URL}${res.data.url}`;
      // Replace first empty slot or add new
      const emptyIdx = formData.images.findIndex(img => !img.trim());
      if (emptyIdx >= 0) {
        updateImage(emptyIdx, url);
      } else {
        setFormData(prev => ({ ...prev, images: [...prev.images, url] }));
      }
      toast.success('Bild uppladdad!');
    } catch {
      toast.error('Kunde inte ladda upp bilden');
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' ||
      (categoryFilter === 'b2b' && product.category === 'foretag') ||
      (categoryFilter === 'shop' && product.category !== 'foretag');
    return matchesSearch && matchesCategory;
  });

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Produkter</h1>
          <p className="text-slate-500">Hantera dina produkter och lager</p>
        </div>
        <Button onClick={() => { resetForm(); setShowModal(true); }} data-testid="add-product-btn">
          <Plus className="w-4 h-4 mr-2" />
          Lägg till produkt
        </Button>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input
            placeholder="Sök produkter..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
          {[
            { value: 'all', label: 'Alla' },
            { value: 'shop', label: 'Webbshop' },
            { value: 'b2b', label: 'Företag' },
          ].map(f => (
            <button
              key={f.value}
              onClick={() => setCategoryFilter(f.value)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${categoryFilter === f.value ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
              data-testid={`filter-${f.value}`}
            >
              {f.value === 'b2b' && <Briefcase className="w-3.5 h-3.5 inline mr-1" />}
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredProducts.map((product) => (
          <div 
            key={product.product_id}
            className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden group"
          >
            <div className="aspect-square bg-slate-100 relative">
              {product.images?.[0] ? (
                <img 
                  src={product.images[0].startsWith('/api') ? `${process.env.REACT_APP_BACKEND_URL}${product.images[0]}` : product.images[0]} 
                  alt={product.name}
                  className="w-full h-full object-cover"
                  onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling && (e.target.nextSibling.style.display = 'flex'); }}
                />
              ) : null}
              {!product.images?.[0] && (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="w-12 h-12 text-slate-300" />
                </div>
              )}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <Button 
                  variant="secondary" 
                  size="sm"
                  onClick={() => openEditModal(product)}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={() => handleDelete(product.product_id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-medium text-slate-900 truncate flex-1">{product.name}</h3>
                {product.category === 'foretag' && (
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-semibold rounded bg-indigo-100 text-indigo-700 shrink-0">
                    <Briefcase className="w-2.5 h-2.5" />B2B
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-500">{product.category}</p>
              {product.colors?.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {product.colors.map((c, i) => (
                    <span key={`color-${c}-${i}`} className="text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">{c}</span>
                  ))}
                </div>
              )}
              {product.sizes?.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {product.sizes.map((s, i) => (
                    <span key={`size-${s}-${i}`} className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">{s}</span>
                  ))}
                </div>
              )}
              <p className="text-lg font-bold text-primary mt-2">{product.price} kr</p>
            </div>
          </div>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-12 text-slate-500">
          <Package className="w-12 h-12 mx-auto text-slate-300 mb-4" />
          <p>Inga produkter hittades</p>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-xl font-semibold">
                {editingProduct ? 'Redigera produkt' : 'Lägg till produkt'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Produktnamn</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Kategori</label>
                  <Input
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    placeholder="t.ex. mugg, tshirt"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Beskrivning</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full p-3 border border-slate-300 rounded-lg resize-none"
                  rows={3}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Pris (kr)</label>
                  <Input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Produkttyp</label>
                  <Select 
                    value={formData.model_type} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, model_type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mug">Mugg</SelectItem>
                      <SelectItem value="tshirt">T-shirt</SelectItem>
                      <SelectItem value="hoodie">Hoodie</SelectItem>
                      <SelectItem value="poster">Poster</SelectItem>
                      <SelectItem value="phonecase">Mobilskal</SelectItem>
                      <SelectItem value="totebag">Tygkasse</SelectItem>
                      <SelectItem value="calendar">Kalender</SelectItem>
                      <SelectItem value="nametag">Namnskylt</SelectItem>
                      <SelectItem value="businesscard">Visitkort</SelectItem>
                      <SelectItem value="catalog_print">Katalogutskrift</SelectItem>
                      <SelectItem value="catalog_design">Katalogdesign</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Quantity-based pricing for business cards */}
              {formData.model_type === 'businesscard' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    <span className="flex items-center gap-1.5">Stafflade priser (antal → pris)</span>
                  </label>
                  <p className="text-xs text-slate-400 mb-2">Priset baseras på antal beställda visitkort</p>
                  {formData.quantity_prices.map((qp, idx) => (
                    <div key={`qp-${idx}`} className="flex gap-2 mb-2 items-center">
                      <Input
                        type="number"
                        value={qp.quantity || ''}
                        onChange={(e) => {
                          const next = [...formData.quantity_prices];
                          next[idx] = { ...next[idx], quantity: parseInt(e.target.value) || 0 };
                          setFormData(prev => ({ ...prev, quantity_prices: next }));
                        }}
                        placeholder="Antal"
                        className="w-24"
                        min="1"
                        data-testid={`qp-quantity-${idx}`}
                      />
                      <span className="text-sm text-slate-400">st →</span>
                      <Input
                        type="number"
                        value={qp.price || ''}
                        onChange={(e) => {
                          const next = [...formData.quantity_prices];
                          next[idx] = { ...next[idx], price: parseFloat(e.target.value) || 0 };
                          setFormData(prev => ({ ...prev, quantity_prices: next }));
                        }}
                        placeholder="Pris (kr)"
                        className="w-28"
                        min="0"
                        step="0.01"
                        data-testid={`qp-price-${idx}`}
                      />
                      <span className="text-sm text-slate-400">kr</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const next = formData.quantity_prices.filter((_, i) => i !== idx);
                          setFormData(prev => ({ ...prev, quantity_prices: next }));
                        }}
                        data-testid={`qp-remove-${idx}`}
                      >
                        <X className="w-4 h-4 text-red-400" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setFormData(prev => ({
                      ...prev,
                      quantity_prices: [...prev.quantity_prices, { quantity: 0, price: 0 }]
                    }))}
                    data-testid="add-quantity-price"
                  >
                    <Plus className="w-4 h-4 mr-1" /> Lägg till prissteg
                  </Button>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  <span className="flex items-center gap-1.5"><Palette className="w-4 h-4" /> Färger</span>
                </label>
                <TagInput
                  tags={formData.colors}
                  onChange={(colors) => setFormData(prev => ({ ...prev, colors }))}
                  placeholder="Skriv färg + Enter"
                  testId="color"
                />
              </div>

              {/* Color-specific images */}
              {formData.colors.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    <span className="flex items-center gap-1.5"><Image className="w-4 h-4" /> Bild per färg</span>
                  </label>
                  <p className="text-xs text-slate-400 mb-3">Ladda upp en bild för varje färg — visas när kunden väljer färgen</p>
                  <div className="space-y-2">
                    {formData.colors.map(color => (
                      <div key={color} className="flex items-center gap-3 bg-slate-50 rounded-lg p-2" data-testid={`color-image-${color}`}>
                        <span className="text-sm font-medium text-slate-700 w-24 shrink-0">{color}</span>
                        {formData.color_images[color] ? (
                          <div className="flex items-center gap-2 flex-1">
                            <img src={formData.color_images[color]} alt={color} className="w-10 h-10 rounded object-cover border" />
                            <span className="text-xs text-slate-400 truncate flex-1">{formData.color_images[color].split('/').pop()}</span>
                            <button type="button" onClick={() => setFormData(prev => {
                              const ci = { ...prev.color_images };
                              delete ci[color];
                              return { ...prev, color_images: ci };
                            })} className="p-1 rounded hover:bg-red-50 text-slate-400 hover:text-red-500">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <label className="flex-1 flex items-center justify-center gap-1.5 border border-dashed border-slate-300 hover:border-[#2a9d8f] rounded-lg py-2 cursor-pointer text-xs text-slate-400 hover:text-[#2a9d8f]">
                            <Upload className="w-3.5 h-3.5" /> Ladda upp
                            <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              try {
                                const fd = new FormData();
                                fd.append('file', file);
                                const res = await api.post('/upload', fd, { headers: { ...getAuthHeaders(), 'Content-Type': 'multipart/form-data' } });
                                const url = `${process.env.REACT_APP_BACKEND_URL}${res.data.url}`;
                                setFormData(prev => ({ ...prev, color_images: { ...prev.color_images, [color]: url } }));
                              } catch { toast.error('Uppladdning misslyckades'); }
                            }} />
                          </label>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  <span className="flex items-center gap-1.5"><Ruler className="w-4 h-4" /> Storlekar</span>
                </label>
                <TagInput
                  tags={formData.sizes}
                  onChange={(sizes) => setFormData(prev => ({ ...prev, sizes }))}
                  placeholder="Skriv storlek + Enter"
                  testId="size"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Produktbilder</label>

                {/* Uploaded images grid */}
                {formData.images.some(img => img.trim()) && (
                  <div className="grid grid-cols-3 gap-3 mb-3">
                    {formData.images.map((img, index) => (
                      img.trim() ? (
                        <div key={`img-${index}`} className="relative group aspect-square rounded-lg overflow-hidden border border-slate-200 bg-slate-50">
                          <img
                            src={img}
                            alt={`Bild ${index + 1}`}
                            className="w-full h-full object-cover"
                            onError={(e) => { e.target.src = ''; e.target.alt = 'Kunde inte ladda'; }}
                            data-testid={`image-preview-${index}`}
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            data-testid={`image-remove-${index}`}
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                          {index === 0 && (
                            <span className="absolute bottom-1 left-1 text-[10px] bg-black/60 text-white px-1.5 py-0.5 rounded">Huvudbild</span>
                          )}
                        </div>
                      ) : null
                    ))}
                  </div>
                )}

                {/* Upload button */}
                <label
                  className="flex items-center justify-center gap-2 w-full border-2 border-dashed border-slate-300 hover:border-[#2a9d8f] rounded-xl p-5 cursor-pointer transition-colors bg-white group"
                  data-testid="image-upload-area"
                >
                  <div className="flex flex-col items-center gap-1.5">
                    <div className="w-10 h-10 rounded-lg bg-[#2a9d8f]/10 group-hover:bg-[#2a9d8f]/20 flex items-center justify-center transition-colors">
                      <Upload className="w-5 h-5 text-[#2a9d8f]" />
                    </div>
                    <span className="text-sm font-medium text-slate-700">Klicka för att ladda upp bilder</span>
                    <span className="text-xs text-slate-400">JPG, PNG eller WebP — max 10MB</span>
                  </div>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    multiple
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      files.forEach(f => handleNewImageUpload(f));
                      e.target.value = '';
                    }}
                    data-testid="image-file-input"
                  />
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                  Avbryt
                </Button>
                <Button type="submit">
                  {editingProduct ? 'Spara ändringar' : 'Skapa produkt'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProducts;
