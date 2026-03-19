import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import api from '../services/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { toast } from 'sonner';
import { 
  ShoppingCart, ChevronLeft, Type, Palette, Sparkles,
  Cat, Dog, Car, Flower2, Star, Heart, Plane, Fish,
  Bird, Rabbit, TreePine, Sun, Moon, Rocket, Crown, Anchor
} from 'lucide-react';

// Icon options for name tags
const ICONS = [
  { id: 'none', label: 'Ingen', icon: null },
  { id: 'star', label: 'Stjärna', icon: Star },
  { id: 'heart', label: 'Hjärta', icon: Heart },
  { id: 'cat', label: 'Katt', icon: Cat },
  { id: 'dog', label: 'Hund', icon: Dog },
  { id: 'rabbit', label: 'Kanin', icon: Rabbit },
  { id: 'fish', label: 'Fisk', icon: Fish },
  { id: 'bird', label: 'Fågel', icon: Bird },
  { id: 'car', label: 'Bil', icon: Car },
  { id: 'plane', label: 'Flygplan', icon: Plane },
  { id: 'rocket', label: 'Raket', icon: Rocket },
  { id: 'flower', label: 'Blomma', icon: Flower2 },
  { id: 'tree', label: 'Träd', icon: TreePine },
  { id: 'sun', label: 'Sol', icon: Sun },
  { id: 'moon', label: 'Måne', icon: Moon },
  { id: 'crown', label: 'Krona', icon: Crown },
  { id: 'anchor', label: 'Ankare', icon: Anchor },
];

// Color options
const COLORS = [
  { id: 'white', label: 'Vit', bg: '#FFFFFF', text: '#000000' },
  { id: 'pink', label: 'Rosa', bg: '#FFC0CB', text: '#000000' },
  { id: 'lightblue', label: 'Ljusblå', bg: '#ADD8E6', text: '#000000' },
  { id: 'mint', label: 'Mint', bg: '#98FF98', text: '#000000' },
  { id: 'yellow', label: 'Gul', bg: '#FFFF99', text: '#000000' },
  { id: 'lavender', label: 'Lavendel', bg: '#E6E6FA', text: '#000000' },
  { id: 'peach', label: 'Persika', bg: '#FFDAB9', text: '#000000' },
  { id: 'navy', label: 'Marinblå', bg: '#000080', text: '#FFFFFF' },
];

// Font options
const FONTS = [
  { id: 'rounded', label: 'Rund', style: 'font-sans font-bold' },
  { id: 'playful', label: 'Lekfull', style: 'font-serif italic' },
  { id: 'classic', label: 'Klassisk', style: 'font-mono' },
];

const NameTagEditor = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Design state
  const [childName, setChildName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('none');
  const [selectedColor, setSelectedColor] = useState('white');
  const [selectedFont, setSelectedFont] = useState('rounded');
  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await api.get(`/products/${productId}`);
        setProduct(response.data);
        if (response.data.sizes?.length > 0) {
          setSelectedSize(response.data.sizes[0]);
        }
      } catch (error) {
        console.error('Failed to fetch product:', error);
        toast.error('Kunde inte hämta produkt');
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [productId]);

  const getColorConfig = () => COLORS.find(c => c.id === selectedColor) || COLORS[0];
  const getIconComponent = () => ICONS.find(i => i.id === selectedIcon)?.icon;
  const getFontStyle = () => FONTS.find(f => f.id === selectedFont)?.style || '';

  const handleAddToCart = () => {
    if (!childName.trim()) {
      toast.error('Skriv in barnets namn');
      return;
    }

    const nameTagData = {
      name: childName,
      icon: selectedIcon,
      color: selectedColor,
      font: selectedFont,
      size: selectedSize
    };

    addItem({
      product_id: product.product_id,
      name: product.name,
      price: product.price,
      quantity: quantity,
      image: product.images?.[0],
      size: selectedSize,
      customization: {
        type: 'nametag',
        child_name: childName,
        ...nameTagData
      }
    });

    toast.success('Namnlappar tillagda i varukorgen!');
    navigate('/varukorg');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-500">Produkt hittades inte</p>
      </div>
    );
  }

  const IconComponent = getIconComponent();
  const colorConfig = getColorConfig();

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-slate-600 hover:text-primary mb-4"
          >
            <ChevronLeft className="w-5 h-5" />
            Tillbaka
          </button>
          <h1 className="text-3xl font-bold text-slate-900">{product.name}</h1>
          <p className="text-slate-500 mt-2">Skapa personliga namnlappar för förskolan</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Preview */}
          <div className="bg-white rounded-xl shadow-sm p-8">
            <h2 className="text-lg font-semibold text-slate-900 mb-6">Förhandsvisning</h2>
            
            {/* Large Preview */}
            <div className="flex justify-center mb-8">
              <div 
                className="w-64 h-24 rounded-lg shadow-lg flex items-center justify-center gap-3 border-2 border-slate-200"
                style={{ backgroundColor: colorConfig.bg }}
              >
                {IconComponent && (
                  <IconComponent 
                    className="w-10 h-10" 
                    style={{ color: colorConfig.text }}
                  />
                )}
                <span 
                  className={`text-2xl ${getFontStyle()}`}
                  style={{ color: colorConfig.text }}
                >
                  {childName || 'Namn'}
                </span>
              </div>
            </div>

            {/* Preview Grid */}
            <div className="border-t pt-6">
              <p className="text-sm text-slate-500 mb-4">Så här kommer dina namnlappar se ut:</p>
              <div className="grid grid-cols-3 gap-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div 
                    key={i}
                    className="aspect-[3/1] rounded-md shadow flex items-center justify-center gap-1 text-xs border"
                    style={{ backgroundColor: colorConfig.bg }}
                  >
                    {IconComponent && (
                      <IconComponent 
                        className="w-4 h-4" 
                        style={{ color: colorConfig.text }}
                      />
                    )}
                    <span 
                      className={getFontStyle()}
                      style={{ color: colorConfig.text, fontSize: '10px' }}
                    >
                      {childName || 'Namn'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Options */}
          <div className="space-y-6">
            {/* Name Input */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center gap-3 mb-4">
                <Type className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-slate-900">Barnets namn</h3>
              </div>
              <Input
                value={childName}
                onChange={(e) => setChildName(e.target.value)}
                placeholder="Skriv namn här..."
                maxLength={20}
                className="text-lg"
                data-testid="child-name-input"
              />
              <p className="text-xs text-slate-400 mt-2">Max 20 tecken</p>
            </div>

            {/* Icon Selection */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center gap-3 mb-4">
                <Sparkles className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-slate-900">Välj figur</h3>
              </div>
              <div className="grid grid-cols-6 gap-2">
                {ICONS.map((icon) => {
                  const Icon = icon.icon;
                  return (
                    <button
                      key={icon.id}
                      onClick={() => setSelectedIcon(icon.id)}
                      className={`aspect-square rounded-lg border-2 flex items-center justify-center transition-all ${
                        selectedIcon === icon.id
                          ? 'border-primary bg-primary/10'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                      title={icon.label}
                    >
                      {Icon ? (
                        <Icon className="w-5 h-5 text-slate-600" />
                      ) : (
                        <span className="text-xs text-slate-400">Ingen</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Color Selection */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center gap-3 mb-4">
                <Palette className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-slate-900">Välj färg</h3>
              </div>
              <div className="grid grid-cols-4 gap-3">
                {COLORS.map((color) => (
                  <button
                    key={color.id}
                    onClick={() => setSelectedColor(color.id)}
                    className={`py-3 px-4 rounded-lg border-2 text-sm font-medium transition-all ${
                      selectedColor === color.id
                        ? 'border-primary ring-2 ring-primary/20'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                    style={{ 
                      backgroundColor: color.bg,
                      color: color.text
                    }}
                  >
                    {color.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Font Selection */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-semibold text-slate-900 mb-4">Välj typsnitt</h3>
              <div className="grid grid-cols-3 gap-3">
                {FONTS.map((font) => (
                  <button
                    key={font.id}
                    onClick={() => setSelectedFont(font.id)}
                    className={`py-3 px-4 rounded-lg border-2 transition-all ${
                      selectedFont === font.id
                        ? 'border-primary bg-primary/5'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <span className={font.style}>{font.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Size Selection */}
            {product.sizes?.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="font-semibold text-slate-900 mb-4">Välj storlek</h3>
                <div className="space-y-2">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`w-full py-3 px-4 rounded-lg border-2 text-left transition-all ${
                        selectedSize === size
                          ? 'border-primary bg-primary/5'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity & Add to Cart */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-slate-600">Antal paket</span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-8 h-8 rounded-full border border-slate-300 flex items-center justify-center hover:bg-slate-100"
                  >
                    -
                  </button>
                  <span className="font-semibold w-8 text-center">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-8 h-8 rounded-full border border-slate-300 flex items-center justify-center hover:bg-slate-100"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="flex justify-between items-center mb-4 pb-4 border-b">
                <span className="text-slate-600">Pris per paket</span>
                <span className="text-xl font-bold text-slate-900">{product.price} kr</span>
              </div>

              <div className="flex justify-between items-center mb-6">
                <span className="text-lg font-medium text-slate-700">Totalt</span>
                <span className="text-2xl font-bold text-primary">{product.price * quantity} kr</span>
              </div>
              
              <Button 
                className="w-full" 
                size="lg"
                onClick={handleAddToCart}
                disabled={!childName.trim()}
                data-testid="add-nametag-to-cart"
              >
                <ShoppingCart className="w-5 h-5 mr-2" />
                Lägg i varukorg
              </Button>

              {!childName.trim() && (
                <p className="text-sm text-slate-500 text-center mt-3">
                  Skriv in barnets namn för att fortsätta
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NameTagEditor;
