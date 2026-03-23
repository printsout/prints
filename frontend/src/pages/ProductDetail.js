import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ShoppingCart, Palette, ChevronLeft, Check } from 'lucide-react';
import api from '../services/api';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { useCart } from '../context/CartContext';
import ProductPreview3D from '../components/ProductPreview3D';

const ProductDetail = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await api.get(`/products/${productId}`);
        setProduct(response.data);
        if (response.data.colors?.length > 0) {
          setSelectedColor(response.data.colors[0]);
        }
        if (response.data.sizes?.length > 0) {
          setSelectedSize(response.data.sizes[0]);
        }
      } catch (error) {
        console.error('Failed to fetch product:', error);
        toast.error('Kunde inte ladda produkten');
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [productId]);

  const handleAddToCart = async () => {
    setAdding(true);
    try {
      await addToCart({
        product_id: product.product_id,
        quantity,
        color: selectedColor || null,
        size: selectedSize || null
      });
      toast.success('Tillagd i varukorgen!', {
        action: {
          label: 'Visa varukorg',
          onClick: () => navigate('/varukorg')
        }
      });
    } catch (error) {
      toast.error('Kunde inte lägga till i varukorgen');
    } finally {
      setAdding(false);
    }
  };

  const handleDesign = () => {
    if (product?.model_type === 'calendar' || product?.category === 'kalender') {
      navigate(`/kalender/${productId}`, { state: { size: selectedSize } });
    } else if (product?.model_type === 'nametag' || product?.category === 'namnskylt') {
      navigate(`/namnskylt/${productId}`, { state: { size: selectedSize } });
    } else if (product?.category === 'fotoalbum') {
      navigate(`/fotoalbum/${productId}`, { state: { size: selectedSize } });
    } else {
      navigate(`/design/${productId}`, { state: { color: selectedColor, size: selectedSize } });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-500 mb-4">Produkten hittades inte</p>
          <Link to="/produkter">
            <Button variant="outline">Tillbaka till produkter</Button>
          </Link>
        </div>
      </div>
    );
  }

  const colorHexMap = {
    'Vit': '#FFFFFF',
    'Svart': '#1a1a1a',
    'Grå': '#6b7280',
    'Beige': '#d4c4a8',
    'Marinblå': '#1e3a5f',
    'Naturvit': '#f5f5dc',
    'Transparent': '#e5e5e5'
  };

  return (
    <div className="min-h-screen" data-testid="product-detail-page">
      {/* Breadcrumb */}
      <div className="bg-slate-50 py-4">
        <div className="container-main">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Link to="/" className="hover:text-primary">Hem</Link>
            <span>/</span>
            <Link to="/produkter" className="hover:text-primary">Produkter</Link>
            <span>/</span>
            <span className="text-slate-700">{product.name}</span>
          </div>
        </div>
      </div>

      <div className="container-main py-12">
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Left - Preview */}
          <div className="lg:sticky lg:top-24 lg:h-fit">
            {product.model_type === 'nametag' || product.model_type === 'calendar' || product.category === 'namnskylt' || product.category === 'kalender' || product.category === 'fotoalbum' ? (
              <div className="aspect-square rounded-xl overflow-hidden bg-slate-50 flex items-center justify-center">
                <img
                  src={product.images?.[0]}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <>
                <div className="aspect-square rounded-xl overflow-hidden bg-slate-50">
                  <ProductPreview3D 
                    modelType={product.model_type}
                    color={colorHexMap[selectedColor] || '#FFFFFF'}
                    productImage={product.images?.[0]}
                  />
                </div>
                <p className="text-center text-sm text-slate-400 mt-4">
                  Dra för att rotera • Scrolla för att zooma
                </p>
              </>
            )}
          </div>

          {/* Right - Details */}
          <div className="space-y-8">
            <div>
              <Link 
                to="/produkter"
                className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-primary mb-4"
              >
                <ChevronLeft className="w-4 h-4" />
                Tillbaka
              </Link>
              <h1 className="text-3xl md:text-4xl font-bold text-slate-900" data-testid="product-name">
                {product.name}
              </h1>
              <p className="text-2xl font-semibold text-primary mt-4" data-testid="product-price">
                {product.price} kr
              </p>
            </div>

            <p className="text-slate-600 leading-relaxed" data-testid="product-description">
              {product.description}
            </p>

            {/* Color Selection */}
            {product.colors?.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">
                  Färg: <span className="text-slate-500">{selectedColor}</span>
                </label>
                <div className="flex flex-wrap gap-3">
                  {product.colors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`w-10 h-10 rounded-full border-2 transition-all flex items-center justify-center ${
                        selectedColor === color 
                          ? 'border-primary scale-110' 
                          : 'border-slate-200 hover:border-slate-400'
                      }`}
                      style={{ backgroundColor: colorHexMap[color] || '#ddd' }}
                      data-testid={`color-${color}`}
                      title={color}
                    >
                      {selectedColor === color && (
                        <Check className={`w-4 h-4 ${color === 'Svart' || color === 'Marinblå' ? 'text-white' : 'text-slate-700'}`} />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Size Selection */}
            {product.sizes?.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">
                  Storlek
                </label>
                <Select value={selectedSize} onValueChange={setSelectedSize}>
                  <SelectTrigger className="w-full" data-testid="size-select">
                    <SelectValue placeholder="Välj storlek" />
                  </SelectTrigger>
                  <SelectContent>
                    {product.sizes.map((size) => (
                      <SelectItem key={size} value={size}>{size}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Quantity */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3">
                Antal
              </label>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 rounded-full border border-slate-200 hover:border-primary transition-colors flex items-center justify-center"
                  data-testid="quantity-decrease"
                >
                  -
                </button>
                <span className="text-lg font-medium w-8 text-center" data-testid="quantity-value">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-10 h-10 rounded-full border border-slate-200 hover:border-primary transition-colors flex items-center justify-center"
                  data-testid="quantity-increase"
                >
                  +
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button 
                onClick={handleDesign}
                className="btn-primary flex-1"
                data-testid="design-button"
              >
                <Palette className="w-5 h-5 mr-2" />
                {product?.model_type === 'calendar' || product?.category === 'kalender' 
                  ? 'Skapa din kalender' 
                  : product?.model_type === 'nametag' || product?.category === 'namnskylt'
                  ? 'Skapa namnlappar'
                  : product?.category === 'fotoalbum'
                  ? 'Skapa ditt fotoalbum'
                  : 'Designa med egen bild'
                }
              </Button>
              <Button 
                onClick={handleAddToCart}
                variant="outline"
                className="btn-outline flex-1"
                disabled={adding}
                data-testid="add-to-cart-button"
              >
                {adding ? (
                  <div className="spinner w-5 h-5 mr-2" />
                ) : (
                  <ShoppingCart className="w-5 h-5 mr-2" />
                )}
                Lägg i varukorg
              </Button>
            </div>

            {/* Features */}
            <div className="border-t pt-8 space-y-4">
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-accent mt-0.5" />
                <div>
                  <p className="font-medium text-slate-800">Hög kvalité</p>
                  <p className="text-sm text-slate-500">Professionellt tryck som håller</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-accent mt-0.5" />
                <div>
                  <p className="font-medium text-slate-800">Snabb leverans</p>
                  <p className="text-sm text-slate-500">2-5 arbetsdagar</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-accent mt-0.5" />
                <div>
                  <p className="font-medium text-slate-800">Nöjd kund-garanti</p>
                  <p className="text-sm text-slate-500">14 dagars öppet köp</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
