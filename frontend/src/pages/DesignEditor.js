import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { 
  Upload, ZoomIn, ZoomOut, RotateCcw, Type, Move, 
  Trash2, Save, ShoppingCart, ChevronLeft, Palette
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Slider } from '../components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import ProductPreview3D from '../components/ProductPreview3D';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

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
  
  // Design state
  const [uploadedImage, setUploadedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [designConfig, setDesignConfig] = useState({
    position_x: 50,
    position_y: 50,
    scale: 1,
    rotation: 0,
    text: '',
    text_font: 'Arial',
    text_color: '#000000',
    background_color: '#FFFFFF'
  });
  
  const [selectedColor, setSelectedColor] = useState(location.state?.color || '');
  const [selectedSize, setSelectedSize] = useState(location.state?.size || '');
  const [activeTab, setActiveTab] = useState('upload');

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await axios.get(`${API}/products/${productId}`);
        setProduct(response.data);
        if (!selectedColor && response.data.colors?.length > 0) {
          setSelectedColor(response.data.colors[0]);
        }
        if (!selectedSize && response.data.sizes?.length > 0) {
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

  const onDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    if (file) {
      setUploadedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
      setActiveTab('adjust');
      toast.success('Bild uppladdad!');
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024 // 10MB
  });

  const handleConfigChange = (key, value) => {
    setDesignConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleReset = () => {
    setDesignConfig({
      position_x: 50,
      position_y: 50,
      scale: 1,
      rotation: 0,
      text: '',
      text_font: 'Arial',
      text_color: '#000000',
      background_color: '#FFFFFF'
    });
  };

  const handleClearImage = () => {
    setUploadedImage(null);
    setImagePreview(null);
    setActiveTab('upload');
  };

  const handleSaveDesign = async () => {
    if (!user) {
      toast.error('Du måste vara inloggad för att spara designer');
      navigate('/logga-in');
      return;
    }

    setSaving(true);
    try {
      const designData = {
        product_id: productId,
        name: `${product?.name} - Min design`,
        config: {
          ...designConfig,
          image_data: imagePreview
        },
        preview_image: imagePreview
      };

      await axios.post(`${API}/designs`, designData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success('Design sparad!');
    } catch (error) {
      console.error('Failed to save design:', error);
      toast.error('Kunde inte spara designen');
    } finally {
      setSaving(false);
    }
  };

  const handleAddToCart = async () => {
    try {
      await addToCart({
        product_id: productId,
        quantity: 1,
        color: selectedColor || null,
        size: selectedSize || null,
        design_preview: imagePreview
      });
      toast.success('Tillagd i varukorgen!', {
        action: {
          label: 'Till kassan',
          onClick: () => navigate('/varukorg')
        }
      });
    } catch (error) {
      toast.error('Kunde inte lägga till i varukorgen');
    }
  };

  const colorHexMap = {
    'Vit': '#FFFFFF',
    'Svart': '#1a1a1a',
    'Grå': '#6b7280',
    'Beige': '#d4c4a8',
    'Marinblå': '#1e3a5f',
    'Naturvit': '#f5f5dc',
    'Transparent': '#e5e5e5'
  };

  const fonts = [
    { value: 'Arial', label: 'Arial' },
    { value: 'Times New Roman', label: 'Times New Roman' },
    { value: 'Georgia', label: 'Georgia' },
    { value: 'Verdana', label: 'Verdana' },
    { value: 'Comic Sans MS', label: 'Comic Sans' },
    { value: 'Impact', label: 'Impact' }
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50" data-testid="design-editor-page">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-40">
        <div className="container-main py-4">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-slate-600 hover:text-primary"
              data-testid="back-button"
            >
              <ChevronLeft className="w-5 h-5" />
              <span className="hidden sm:inline">Tillbaka</span>
            </button>
            <h1 className="font-semibold text-slate-900">
              Designa: {product?.name}
            </h1>
            <div className="flex items-center gap-2">
              {user && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleSaveDesign}
                  disabled={saving}
                  data-testid="save-design-button"
                >
                  {saving ? <div className="spinner w-4 h-4" /> : <Save className="w-4 h-4 mr-1" />}
                  <span className="hidden sm:inline">Spara</span>
                </Button>
              )}
              <Button 
                size="sm"
                className="btn-primary text-sm py-2"
                onClick={handleAddToCart}
                data-testid="add-to-cart-design"
              >
                <ShoppingCart className="w-4 h-4 mr-1" />
                <span className="hidden sm:inline">Lägg i varukorg</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container-main py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left - 3D Preview */}
          <div className="order-2 lg:order-1">
            <div className="bg-white rounded-xl p-6 shadow-soft">
              <h3 className="font-semibold text-slate-900 mb-4">Förhandsvisning</h3>
              <div className="aspect-square rounded-lg overflow-hidden">
                <ProductPreview3D 
                  modelType={product?.model_type}
                  texture={imagePreview}
                  color={colorHexMap[selectedColor] || designConfig.background_color}
                />
              </div>
              <p className="text-center text-sm text-slate-400 mt-4">
                Dra för att rotera • Scrolla för att zooma
              </p>
            </div>

            {/* 2D Canvas Preview */}
            <div className="bg-white rounded-xl p-6 shadow-soft mt-6">
              <h3 className="font-semibold text-slate-900 mb-4">Design-yta</h3>
              <div 
                ref={canvasRef}
                className="relative aspect-square rounded-lg overflow-hidden border-2 border-dashed border-slate-200"
                style={{ backgroundColor: colorHexMap[selectedColor] || designConfig.background_color }}
                data-testid="design-canvas"
              >
                {imagePreview && (
                  <img 
                    src={imagePreview}
                    alt="Design"
                    className="absolute"
                    style={{
                      left: `${designConfig.position_x}%`,
                      top: `${designConfig.position_y}%`,
                      transform: `translate(-50%, -50%) scale(${designConfig.scale}) rotate(${designConfig.rotation}deg)`,
                      maxWidth: '80%',
                      maxHeight: '80%',
                      objectFit: 'contain'
                    }}
                  />
                )}
                {designConfig.text && (
                  <div 
                    className="absolute left-1/2 bottom-8 transform -translate-x-1/2"
                    style={{
                      fontFamily: designConfig.text_font,
                      color: designConfig.text_color,
                      fontSize: '1.5rem',
                      fontWeight: 'bold',
                      textShadow: '0 1px 2px rgba(0,0,0,0.1)'
                    }}
                  >
                    {designConfig.text}
                  </div>
                )}
                {!imagePreview && !designConfig.text && (
                  <div className="absolute inset-0 flex items-center justify-center text-slate-400">
                    Ladda upp en bild för att börja
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right - Tools */}
          <div className="order-1 lg:order-2 space-y-6">
            {/* Tabs */}
            <div className="bg-white rounded-xl p-6 shadow-soft">
              <div className="flex border-b mb-6">
                {[
                  { id: 'upload', label: 'Ladda upp', icon: Upload },
                  { id: 'adjust', label: 'Justera', icon: Move },
                  { id: 'text', label: 'Text', icon: Type },
                  { id: 'color', label: 'Färg', icon: Palette }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
                      activeTab === tab.id 
                        ? 'text-primary border-primary' 
                        : 'text-slate-500 border-transparent hover:text-slate-700'
                    }`}
                    data-testid={`tab-${tab.id}`}
                  >
                    <tab.icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                ))}
              </div>

              {/* Upload Tab */}
              {activeTab === 'upload' && (
                <div className="space-y-4">
                  <div
                    {...getRootProps()}
                    className={`dropzone ${isDragActive ? 'active' : ''}`}
                    data-testid="dropzone"
                  >
                    <input {...getInputProps()} data-testid="file-input" />
                    <Upload className="w-12 h-12 mx-auto text-slate-400 mb-4" />
                    <p className="text-slate-600 font-medium">
                      {isDragActive ? 'Släpp bilden här' : 'Dra och släpp din bild här'}
                    </p>
                    <p className="text-sm text-slate-400 mt-2">
                      eller klicka för att välja fil
                    </p>
                    <p className="text-xs text-slate-400 mt-4">
                      JPG, PNG, GIF • Max 10MB
                    </p>
                  </div>
                  
                  {imagePreview && (
                    <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg">
                      <img 
                        src={imagePreview} 
                        alt="Preview" 
                        className="w-16 h-16 object-cover rounded"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-700">Bild uppladdad</p>
                        <p className="text-xs text-slate-500">{uploadedImage?.name}</p>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={handleClearImage}
                        data-testid="clear-image"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Adjust Tab */}
              {activeTab === 'adjust' && (
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-slate-700">Position X</label>
                      <span className="text-sm text-slate-500">{designConfig.position_x}%</span>
                    </div>
                    <Slider
                      value={[designConfig.position_x]}
                      onValueChange={([value]) => handleConfigChange('position_x', value)}
                      min={0}
                      max={100}
                      step={1}
                      data-testid="slider-position-x"
                    />
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-slate-700">Position Y</label>
                      <span className="text-sm text-slate-500">{designConfig.position_y}%</span>
                    </div>
                    <Slider
                      value={[designConfig.position_y]}
                      onValueChange={([value]) => handleConfigChange('position_y', value)}
                      min={0}
                      max={100}
                      step={1}
                      data-testid="slider-position-y"
                    />
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                        <ZoomIn className="w-4 h-4" />
                        Storlek
                      </label>
                      <span className="text-sm text-slate-500">{Math.round(designConfig.scale * 100)}%</span>
                    </div>
                    <Slider
                      value={[designConfig.scale * 100]}
                      onValueChange={([value]) => handleConfigChange('scale', value / 100)}
                      min={10}
                      max={200}
                      step={5}
                      data-testid="slider-scale"
                    />
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                        <RotateCcw className="w-4 h-4" />
                        Rotation
                      </label>
                      <span className="text-sm text-slate-500">{designConfig.rotation}°</span>
                    </div>
                    <Slider
                      value={[designConfig.rotation]}
                      onValueChange={([value]) => handleConfigChange('rotation', value)}
                      min={-180}
                      max={180}
                      step={5}
                      data-testid="slider-rotation"
                    />
                  </div>
                  
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={handleReset}
                    data-testid="reset-adjustments"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Återställ
                  </Button>
                </div>
              )}

              {/* Text Tab */}
              {activeTab === 'text' && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Text
                    </label>
                    <Input
                      value={designConfig.text}
                      onChange={(e) => handleConfigChange('text', e.target.value)}
                      placeholder="Skriv din text här..."
                      data-testid="text-input"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Typsnitt
                    </label>
                    <Select 
                      value={designConfig.text_font} 
                      onValueChange={(value) => handleConfigChange('text_font', value)}
                    >
                      <SelectTrigger data-testid="font-select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {fonts.map((font) => (
                          <SelectItem key={font.value} value={font.value}>
                            <span style={{ fontFamily: font.value }}>{font.label}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Textfärg
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={designConfig.text_color}
                        onChange={(e) => handleConfigChange('text_color', e.target.value)}
                        className="w-10 h-10 rounded cursor-pointer border-0"
                        data-testid="text-color-picker"
                      />
                      <Input
                        value={designConfig.text_color}
                        onChange={(e) => handleConfigChange('text_color', e.target.value)}
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Color Tab */}
              {activeTab === 'color' && (
                <div className="space-y-6">
                  {product?.colors?.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-3">
                        Produktfärg
                      </label>
                      <div className="flex flex-wrap gap-3">
                        {product.colors.map((color) => (
                          <button
                            key={color}
                            onClick={() => setSelectedColor(color)}
                            className={`w-10 h-10 rounded-full border-2 transition-all ${
                              selectedColor === color 
                                ? 'border-primary scale-110' 
                                : 'border-slate-200 hover:border-slate-400'
                            }`}
                            style={{ backgroundColor: colorHexMap[color] || '#ddd' }}
                            title={color}
                            data-testid={`product-color-${color}`}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Bakgrundsfärg (design-yta)
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={designConfig.background_color}
                        onChange={(e) => handleConfigChange('background_color', e.target.value)}
                        className="w-10 h-10 rounded cursor-pointer border-0"
                        data-testid="bg-color-picker"
                      />
                      <Input
                        value={designConfig.background_color}
                        onChange={(e) => handleConfigChange('background_color', e.target.value)}
                        className="flex-1"
                      />
                    </div>
                  </div>
                  
                  {product?.sizes?.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Storlek
                      </label>
                      <Select value={selectedSize} onValueChange={setSelectedSize}>
                        <SelectTrigger data-testid="editor-size-select">
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
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DesignEditor;
