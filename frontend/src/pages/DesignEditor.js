import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { ShoppingCart, ChevronLeft } from 'lucide-react';
import api from '../services/api';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import SaveDesignButton from '../components/SaveDesignButton';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import ProductPreview3D from '../components/ProductPreview3D';
import DesignTools, { COLOR_HEX_MAP } from './design/DesignTools';
import DesignCanvas from './design/DesignCanvas';

const DesignEditor = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const savedDesignId = searchParams.get('design');
  const { addToCart } = useCart();
  const { user, token } = useAuth();
  const canvasRef = useRef(null);

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
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

  // Hydrate from saved design
  useEffect(() => {
    if (!savedDesignId || !token) return;
    (async () => {
      try {
        const res = await api.get(`/saved-designs/${savedDesignId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const c = res.data?.customization;
        if (!c || c.type !== 'design') return;
        if (c.uploaded_image_url) {
          const url = c.uploaded_image_url.startsWith('/api')
            ? `${process.env.REACT_APP_BACKEND_URL}${c.uploaded_image_url}`
            : c.uploaded_image_url;
          setImagePreview(url);
          setActiveTab('adjust');
        }
        if (c.color) setSelectedColor(c.color);
        if (c.size) setSelectedSize(c.size);
        setDesignConfig((prev) => ({
          ...prev,
          text: c.text || '',
          text_font: c.text_font || prev.text_font,
          text_color: c.text_color || prev.text_color,
          background_color: c.background_color || prev.background_color,
          position_x: c.position_x ?? prev.position_x,
          position_y: c.position_y ?? prev.position_y,
          scale: c.scale ?? prev.scale,
          rotation: c.rotation ?? prev.rotation,
          placement_notes: c.placement_notes || '',
        }));
      } catch { toast.error('Kunde inte ladda sparad design'); }
    })();
  }, [savedDesignId, token]);

  const buildSavedDesignPayload = async () => {
    if (!imagePreview) { toast.error('Ladda upp en bild först'); return null; }
    let uploadedImageUrl;
    if (imagePreview.startsWith('data:')) {
      const uploadRes = await api.post('/upload-base64', { image: imagePreview });
      uploadedImageUrl = uploadRes.data.url;
    } else {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || '';
      uploadedImageUrl = imagePreview.startsWith(backendUrl)
        ? imagePreview.replace(backendUrl, '')
        : imagePreview;
    }
    let resolvedPrice = product?.price;
    let printSize = null;
    let printQuality = null;
    const hasAdminSizePricing = product?.available_sizes?.length > 0 && product?.size_quality_prices?.length > 0;
    if (hasAdminSizePricing && selectedSize) {
      const quality = product?.available_qualities?.[0] || 'Standard';
      const entry = product.size_quality_prices.find((p) => p.size === selectedSize && (p.quality || 'Standard') === quality);
      if (entry) { resolvedPrice = entry.price; printSize = selectedSize; printQuality = quality; }
    }
    return {
      editor_type: 'design',
      product_id: productId,
      product_name: product?.name,
      price: resolvedPrice,
      quantity: 1,
      print_size: printSize,
      print_quality: printQuality,
      color: selectedColor || null,
      size: selectedSize || null,
      image: product?.images?.[0],
      design_preview: uploadedImageUrl,
      customization: {
        type: 'design', uploaded_image_url: uploadedImageUrl,
        text: designConfig.text || null, text_font: designConfig.text_font || null,
        text_color: designConfig.text_color || null, background_color: designConfig.background_color || null,
        position_x: designConfig.position_x, position_y: designConfig.position_y,
        scale: designConfig.scale, rotation: designConfig.rotation,
        placement_notes: designConfig.placement_notes || null,
        color: selectedColor || null, size: selectedSize || null,
      },
    };
  };

  const handleAddToCart = async () => {
    try {
      let uploadedImageUrl = null;
      if (imagePreview) {
        toast.info('Laddar upp bild...');
        const uploadRes = await api.post('/upload-base64', { image: imagePreview });
        uploadedImageUrl = uploadRes.data.url;
      }
      // Resolve price from admin size/quality matrix if applicable
      let resolvedPrice = product?.price;
      let printSize = null;
      let printQuality = null;
      const hasAdminSizePricing = product?.available_sizes?.length > 0 && product?.size_quality_prices?.length > 0;
      if (hasAdminSizePricing && selectedSize) {
        const quality = product?.available_qualities?.[0] || 'Standard';
        const entry = product.size_quality_prices.find(p => p.size === selectedSize && (p.quality || 'Standard') === quality);
        if (entry) {
          resolvedPrice = entry.price;
          printSize = selectedSize;
          printQuality = quality;
        }
      }
      await addToCart({
        product_id: productId, name: product?.name, price: resolvedPrice, quantity: 1,
        color: selectedColor || null, size: selectedSize || null,
        print_size: printSize, print_quality: printQuality,
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
                <SaveDesignButton
                  buildPayload={buildSavedDesignPayload}
                  defaultName={`${product?.name || 'Design'}`}
                  designId={savedDesignId}
                  variant="outline"
                  size="sm"
                />
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
