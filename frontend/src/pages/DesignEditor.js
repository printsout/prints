import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { Save, ShoppingCart, ChevronLeft } from 'lucide-react';
import api from '../services/api';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import ProductPreview3D from '../components/ProductPreview3D';
import DesignTools, { COLOR_HEX_MAP } from './design/DesignTools';
import DesignCanvas from './design/DesignCanvas';

const DesignEditor = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { addToCart } = useCart();
  const { user, token } = useAuth();
  const canvasRef = useRef(null);

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [designConfig, setDesignConfig] = useState({
    position_x: 50, position_y: 50, scale: 1, rotation: 0,
    text: '', text_font: 'Arial', text_color: '#000000',
    background_color: '#FFFFFF', placement_notes: ''
  });
  const [selectedColor, setSelectedColor] = useState(location.state?.color || '');
  const [selectedSize, setSelectedSize] = useState(location.state?.size || '');
  const [activeTab, setActiveTab] = useState('upload');

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await api.get(`/products/${productId}`);
        setProduct(response.data);
        if (response.data.colors?.length > 0 && !selectedColor) setSelectedColor(response.data.colors[0]);
        if (response.data.sizes?.length > 0 && !selectedSize) setSelectedSize(response.data.sizes[0]);
      } catch {
        toast.error('Kunde inte ladda produkten');
        navigate('/produkter');
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  const onDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    if (file) {
      setUploadedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target.result);
      reader.readAsDataURL(file);
      setActiveTab('adjust');
      toast.success('Bild uppladdad!');
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'] },
    maxFiles: 1, maxSize: 10 * 1024 * 1024
  });

  const handleConfigChange = (key, value) => setDesignConfig(prev => ({ ...prev, [key]: value }));
  const handleReset = () => setDesignConfig({ position_x: 50, position_y: 50, scale: 1, rotation: 0, text: '', text_font: 'Arial', text_color: '#000000', background_color: '#FFFFFF' });
  const handleClearImage = () => { setUploadedImage(null); setImagePreview(null); setActiveTab('upload'); };

  const handleSaveDesign = async () => {
    if (!user) { toast.error('Du måste vara inloggad för att spara designer'); navigate('/logga-in'); return; }
    setSaving(true);
    try {
      await api.post('/designs', {
        product_id: productId, name: `${product?.name} - Min design`,
        config: { ...designConfig, image_data: imagePreview }, preview_image: imagePreview
      }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Design sparad!');
    } catch { toast.error('Kunde inte spara designen'); }
    finally { setSaving(false); }
  };

  const handleAddToCart = async () => {
    try {
      let uploadedImageUrl = null;
      if (imagePreview) {
        toast.info('Laddar upp bild...');
        const uploadRes = await api.post('/upload-base64', { image: imagePreview });
        uploadedImageUrl = uploadRes.data.url;
      }
      await addToCart({
        product_id: productId, name: product?.name, price: product?.price, quantity: 1,
        color: selectedColor || null, size: selectedSize || null,
        image: product?.images?.[0], design_preview: uploadedImageUrl,
        customization: {
          type: 'design', uploaded_image_url: uploadedImageUrl,
          text: designConfig.text || null, text_font: designConfig.text_font || null,
          text_color: designConfig.text_color || null, background_color: designConfig.background_color || null,
          position_x: designConfig.position_x, position_y: designConfig.position_y,
          scale: designConfig.scale, rotation: designConfig.rotation,
          placement_notes: designConfig.placement_notes || null,
          color: selectedColor || null, size: selectedSize || null,
        }
      });
      toast.success('Tillagd i varukorgen!', { action: { label: 'Till kassan', onClick: () => navigate('/varukorg') } });
    } catch { toast.error('Kunde inte lägga till i varukorgen'); }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="spinner"></div></div>;

  const bgColor = COLOR_HEX_MAP[selectedColor] || designConfig.background_color;

  return (
    <div className="min-h-screen bg-slate-50" data-testid="design-editor-page">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-40">
        <div className="container-main py-4">
          <div className="flex items-center justify-between">
            <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-600 hover:text-primary" data-testid="back-button">
              <ChevronLeft className="w-5 h-5" /><span className="hidden sm:inline">Tillbaka</span>
            </button>
            <h1 className="font-semibold text-slate-900">Designa: {product?.name}</h1>
            <div className="flex items-center gap-2">
              {user && (
                <Button variant="outline" size="sm" onClick={handleSaveDesign} disabled={saving} data-testid="save-design-button">
                  {saving ? <div className="spinner w-4 h-4" /> : <Save className="w-4 h-4 mr-1" />}
                  <span className="hidden sm:inline">Spara</span>
                </Button>
              )}
              <Button size="sm" className="btn-primary text-sm py-2" onClick={handleAddToCart} data-testid="add-to-cart-design">
                <ShoppingCart className="w-4 h-4 mr-1" /><span className="hidden sm:inline">Lägg i varukorg</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container-main py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left - Previews */}
          <div className="order-2 lg:order-1">
            <div className="bg-white rounded-xl p-6 shadow-soft">
              <h3 className="font-semibold text-slate-900 mb-4">Förhandsvisning</h3>
              <div className="aspect-square rounded-lg overflow-hidden">
                <ProductPreview3D modelType={product?.model_type} texture={imagePreview} color={bgColor} designConfig={designConfig} />
              </div>
              <p className="text-center text-sm text-slate-400 mt-4">Dra för att rotera &bull; Scrolla för att zooma</p>
            </div>
            <DesignCanvas canvasRef={canvasRef} designConfig={designConfig} imagePreview={imagePreview} backgroundColor={bgColor} />
          </div>

          {/* Right - Tools */}
          <div className="order-1 lg:order-2 space-y-6">
            <DesignTools
              activeTab={activeTab} setActiveTab={setActiveTab}
              designConfig={designConfig} onConfigChange={handleConfigChange}
              imagePreview={imagePreview} uploadedImage={uploadedImage}
              onClearImage={handleClearImage} onReset={handleReset}
              getRootProps={getRootProps} getInputProps={getInputProps} isDragActive={isDragActive}
              product={product} selectedColor={selectedColor} setSelectedColor={setSelectedColor}
              selectedSize={selectedSize} setSelectedSize={setSelectedSize}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DesignEditor;
