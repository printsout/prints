import { useState, useEffect } from 'react';
import { useAdmin } from '../../context/AdminContext';
import api from '../../services/api';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { toast } from 'sonner';
import { Plus, Search, Edit, Trash2, Package, X } from 'lucide-react';

const AdminProducts = () => {
  const { getAuthHeaders } = useAdmin();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
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
    model_type: 'mug'
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await api.get('/admin/products', { headers: getAuthHeaders() });
      setProducts(response.data.products || []);
    } catch (error) {
      console.error('Failed to fetch products:', error);
      toast.error('Kunde inte hämta produkter');
    } finally {
      setLoading(false);
    }
  };

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
      console.error('Failed to save product:', error);
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
      console.error('Failed to delete product:', error);
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
      model_type: product.model_type
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
      model_type: 'mug'
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

  const filteredProducts = products.filter(product =>
    product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category?.toLowerCase().includes(searchTerm.toLowerCase())
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

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <Input
          placeholder="Sök produkter..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
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
                  src={product.images[0]} 
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
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
              <h3 className="font-medium text-slate-900 truncate">{product.name}</h3>
              <p className="text-sm text-slate-500">{product.category}</p>
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
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Bilder (URL)</label>
                {formData.images.map((img, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <Input
                      value={img}
                      onChange={(e) => updateImage(index, e.target.value)}
                      placeholder="https://..."
                    />
                    {formData.images.length > 1 && (
                      <Button type="button" variant="ghost" size="sm" onClick={() => removeImage(index)}>
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={addImageField}>
                  <Plus className="w-4 h-4 mr-1" /> Lägg till bild
                </Button>
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
