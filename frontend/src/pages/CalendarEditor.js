import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Button } from '../components/ui/button';
import SaveDesignButton from '../components/SaveDesignButton';
import { toast } from 'sonner';
import { 
  Upload, ChevronLeft, ChevronRight, ShoppingCart, 
  Trash2, Check, Calendar, Image as ImageIcon, Download, Type
} from 'lucide-react';

const MONTHS = [
  'Januari', 'Februari', 'Mars', 'April', 
  'Maj', 'Juni', 'Juli', 'Augusti',
  'September', 'Oktober', 'November', 'December'
];

const DraggableImageArea = ({ monthData, monthIndex, monthName, onRemoveImage, onUpdateText, onUpdateTextPos, onUpdateImagePos, getRootProps, getInputProps, isDragActive }) => {
  const containerRef = useRef(null);
  const [dragging, setDragging] = useState(null); // null | 'text' | 'image'
  const dragStartRef = useRef({ x: 0, y: 0, posX: 0, posY: 0 });

  const startDrag = (e, type, clientX, clientY) => {
    if (!containerRef.current) return;
    setDragging(type);
    if (type === 'image') {
      dragStartRef.current = {
        x: clientX, y: clientY,
        posX: monthData.imagePos?.x ?? 50,
        posY: monthData.imagePos?.y ?? 50,
      };
    }
  };

  const handleMouseDown = useCallback((e) => {
    if (e.target.closest('button') || e.target.closest('input')) return;
    e.preventDefault();
    // Click on text overlay → drag text. Click anywhere else on image → drag image.
    const onText = e.target.closest('[data-testid="calendar-text-overlay"]');
    if (onText && monthData.text) {
      setDragging('text');
    } else if (monthData.preview) {
      startDrag(e, 'image', e.clientX, e.clientY);
    }
  }, [monthData.text, monthData.preview]);

  const handleMouseMove = useCallback((e) => {
    if (!dragging || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    if (dragging === 'text') {
      const x = Math.max(5, Math.min(95, ((e.clientX - rect.left) / rect.width) * 100));
      const y = Math.max(5, Math.min(95, ((e.clientY - rect.top) / rect.height) * 100));
      onUpdateTextPos({ x, y });
    } else if (dragging === 'image') {
      const dx = ((e.clientX - dragStartRef.current.x) / rect.width) * 100;
      const dy = ((e.clientY - dragStartRef.current.y) / rect.height) * 100;
      // Inverted because object-position moves the focal point opposite of cursor
      const x = Math.max(0, Math.min(100, dragStartRef.current.posX - dx));
      const y = Math.max(0, Math.min(100, dragStartRef.current.posY - dy));
      onUpdateImagePos({ x, y });
    }
  }, [dragging, onUpdateTextPos, onUpdateImagePos]);

  const handleMouseUp = useCallback(() => setDragging(null), []);

  useEffect(() => {
    if (dragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [dragging, handleMouseMove, handleMouseUp]);

  const handleTouchStart = useCallback((e) => {
    if (e.target.closest('button') || e.target.closest('input')) return;
    if (!containerRef.current) return;
    const onText = e.target.closest('[data-testid="calendar-text-overlay"]');
    const t = e.touches[0];
    if (onText && monthData.text) {
      setDragging('text');
    } else if (monthData.preview) {
      startDrag(e, 'image', t.clientX, t.clientY);
    }
  }, [monthData.text, monthData.preview]);

  const handleTouchMove = useCallback((e) => {
    if (!dragging || !containerRef.current) return;
    const touch = e.touches[0];
    const rect = containerRef.current.getBoundingClientRect();
    if (dragging === 'text') {
      const x = Math.max(5, Math.min(95, ((touch.clientX - rect.left) / rect.width) * 100));
      const y = Math.max(5, Math.min(95, ((touch.clientY - rect.top) / rect.height) * 100));
      onUpdateTextPos({ x, y });
    } else if (dragging === 'image') {
      const dx = ((touch.clientX - dragStartRef.current.x) / rect.width) * 100;
      const dy = ((touch.clientY - dragStartRef.current.y) / rect.height) * 100;
      const x = Math.max(0, Math.min(100, dragStartRef.current.posX - dx));
      const y = Math.max(0, Math.min(100, dragStartRef.current.posY - dy));
      onUpdateImagePos({ x, y });
    }
  }, [dragging, onUpdateTextPos, onUpdateImagePos]);

  if (!monthData.preview) {
    return (
      <div className="h-2/3 bg-slate-100 relative">
        <div
          {...getRootProps()}
          className={`w-full h-full flex flex-col items-center justify-center cursor-pointer transition-colors ${isDragActive ? 'bg-primary/10' : 'hover:bg-slate-200'}`}
        >
          <input {...getInputProps()} />
          <Upload className="w-12 h-12 text-slate-400 mb-4" />
          <p className="text-slate-600 font-medium">Ladda upp bild för {monthName}</p>
          <p className="text-slate-400 text-sm mt-1">Dra & släpp eller klicka</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="h-2/3 bg-slate-100 relative select-none"
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={() => setDragging(null)}
      style={{ cursor: dragging === 'image' ? 'grabbing' : 'grab' }}
      title="Dra för att flytta bilden"
    >
      <img
        src={monthData.preview}
        alt={monthName}
        className="w-full h-full object-cover pointer-events-none"
        style={{ objectPosition: `${monthData.imagePos?.x ?? 50}% ${monthData.imagePos?.y ?? 50}%` }}
      />
      {monthData.text && (
        <div
          className="absolute pointer-events-auto"
          style={{
            left: `${monthData.textPos.x}%`,
            top: `${monthData.textPos.y}%`,
            transform: 'translate(-50%, -50%)',
            cursor: dragging === 'text' ? 'grabbing' : 'grab',
          }}
          data-testid="calendar-text-overlay"
        >
          <span
            style={{
              fontSize: `${monthData.fontSize}px`,
              color: monthData.textColor,
              textShadow: '0 2px 8px rgba(0,0,0,0.7), 0 1px 3px rgba(0,0,0,0.5)',
              fontWeight: 700,
              whiteSpace: 'nowrap',
            }}
          >
            {monthData.text}
          </span>
        </div>
      )}
      <button
        onClick={onRemoveImage}
        className="absolute top-3 right-3 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors z-10"
      >
        <Trash2 className="w-4 h-4" />
      </button>
      {monthData.text && (
        <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded pointer-events-none">
          Dra texten för att flytta
        </div>
      )}
    </div>
  );
};

const CalendarEditor = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editCartItemId = searchParams.get('edit');
  const { addToCart, updateCartItem, cart } = useCart();
  const { token } = useAuth();
  const location = useLocation();
  const savedDesignId = searchParams.get('design');

  // Variant pricing from ProductDetail (admin "Storlekar & Priser")
  const variantSize = location.state?.print_size || null;
  const variantQuality = location.state?.print_quality || null;
  const variantPrice = typeof location.state?.resolved_price === 'number' ? location.state.resolved_price : null;
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(0);
  const [monthImages, setMonthImages] = useState(
    Array(12).fill(null).map(() => ({ image: null, preview: null, text: '', textPos: { x: 50, y: 85 }, textColor: '#FFFFFF', fontSize: 24, imagePos: { x: 50, y: 50 } }))
  );
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear() + 1);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await api.get(`/products/${productId}`);
        setProduct(response.data);
        if (response.data.sizes?.length > 0) {
          setSelectedSize(response.data.sizes[0]);
        }
      } catch (error) {
        toast.error('Kunde inte hämta produkt');
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [productId]);

  // Hydrate state from cart item when editing
  useEffect(() => {
    if (!editCartItemId || !cart.items?.length) return;
    const cartItem = cart.items.find(i => i.cart_item_id === editCartItemId);
    if (!cartItem?.customization || cartItem.customization.type !== 'calendar') return;

    const c = cartItem.customization;
    if (c.year) setSelectedYear(c.year);
    if (c.size) setSelectedSize(c.size);
    if (c.months?.length) {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || '';
      setMonthImages(c.months.map(m => {
        const base = { 
          image: null, preview: null, 
          text: m.text || '', 
          textPos: m.textPos || { x: 50, y: 85 }, 
          textColor: m.textColor || '#FFFFFF', 
          fontSize: m.fontSize || 24,
          imagePos: m.imagePos || { x: 50, y: 50 },
        };
        if (m.image_url) {
          const fullUrl = m.image_url.startsWith('/api')
            ? `${backendUrl}${m.image_url}`
            : m.image_url;
          base.preview = fullUrl;
        }
        return base;
      }));
    }
  }, [editCartItemId, cart.items]);

  const onDrop = (acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      const reader = new FileReader();
      reader.onload = () => {
        const newImages = [...monthImages];
        newImages[currentMonth] = {
          ...newImages[currentMonth],
          image: file,
          preview: reader.result
        };
        setMonthImages(newImages);
        toast.success(`Bild tillagd för ${MONTHS[currentMonth]}`);
      };
      reader.readAsDataURL(file);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.webp'] },
    multiple: false
  });

  const removeImage = (monthIndex) => {
    const newImages = [...monthImages];
    newImages[monthIndex] = { ...newImages[monthIndex], image: null, preview: null };
    setMonthImages(newImages);
    toast.success('Bild borttagen');
  };

  const nextMonth = () => {
    setCurrentMonth((prev) => (prev + 1) % 12);
  };

  const prevMonth = () => {
    setCurrentMonth((prev) => (prev - 1 + 12) % 12);
  };

  const getUploadedCount = () => {
    return monthImages.filter(m => m.preview !== null).length;
  };

  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const handleDownloadPdf = async () => {
    if (getUploadedCount() === 0) {
      toast.error('Lägg till minst en bild för att ladda ner PDF');
      return;
    }
    setDownloadingPdf(true);
    try {
      toast.info('Genererar kalender-PDF...');
      // Upload any base64 images first
      const uploadedMonths = [];
      for (let i = 0; i < monthImages.length; i++) {
        const m = monthImages[i];
        let imageUrl = null;
        if (m.preview) {
          if (m.preview.startsWith('data:')) {
            const uploadRes = await api.post('/upload-base64', { image: m.preview });
            imageUrl = uploadRes.data.url;
          } else {
            const backendUrl = process.env.REACT_APP_BACKEND_URL || '';
            imageUrl = m.preview.startsWith(backendUrl)
              ? m.preview.replace(backendUrl, '')
              : m.preview;
          }
        }
        uploadedMonths.push({ month: MONTHS[i], hasImage: m.preview !== null, image_url: imageUrl, text: m.text || '', textPos: m.textPos || { x: 50, y: 85 }, textColor: m.textColor || '#FFFFFF', fontSize: m.fontSize || 24, imagePos: m.imagePos || { x: 50, y: 50 } });
      }
      const layout = product?.name?.toLowerCase().includes('familje') ? 'family' : 'standard';
      const res = await api.post('/calendar/generate-pdf', { year: selectedYear, months: uploadedMonths, layout }, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `kalender_${selectedYear}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Kalender-PDF nedladdad!');
    } catch {
      toast.error('Kunde inte generera PDF');
    } finally {
      setDownloadingPdf(false);
    }
  };

  const buildCartItemData = async () => {
    const uploadedMonths = [];
    for (let i = 0; i < monthImages.length; i++) {
      const m = monthImages[i];
      let imageUrl = null;
      if (m.preview) {
        if (m.preview.startsWith('data:')) {
          const uploadRes = await api.post('/upload-base64', { image: m.preview });
          imageUrl = uploadRes.data.url;
        } else {
          const backendUrl = process.env.REACT_APP_BACKEND_URL || '';
          imageUrl = m.preview.startsWith(backendUrl) ? m.preview.replace(backendUrl, '') : m.preview;
        }
      }
      uploadedMonths.push({
        month: MONTHS[i],
        hasImage: m.preview !== null,
        image_url: imageUrl,
        text: m.text || '',
        textPos: m.textPos || { x: 50, y: 85 },
        textColor: m.textColor || '#FFFFFF',
        fontSize: m.fontSize || 24,
        imagePos: m.imagePos || { x: 50, y: 50 },
      });
    }
    const firstImage = uploadedMonths.find((m) => m.image_url)?.image_url;
    const lname = (product.name || '').toLowerCase();
    let calendarLayout = 'standard';
    if (lname.includes('familje')) calendarLayout = 'family';
    else if (lname.includes('skrivbord')) calendarLayout = 'desk';
    return {
      product_id: product.product_id,
      name: product.name,
      price: variantPrice ?? product.price,
      quantity: 1,
      image: product.images?.[0],
      size: variantSize || selectedSize,
      print_size: variantSize,
      print_quality: variantQuality,
      customization: {
        type: 'calendar',
        year: selectedYear,
        size: variantSize || selectedSize,
        layout: calendarLayout,
        images_count: getUploadedCount(),
        months: uploadedMonths,
        cover_image_url: firstImage,
        print_size: variantSize,
        print_quality: variantQuality,
      },
    };
  };

  const handleAddToCart = async () => {
    if (getUploadedCount() === 0) {
      toast.error('Lägg till minst en bild för din kalender');
      return;
    }
    try {
      toast.info('Laddar upp bilder...');
      const itemData = await buildCartItemData();
      if (editCartItemId) {
        await updateCartItem(editCartItemId, itemData);
        toast.success('Kalender uppdaterad!');
      } else {
        await addToCart(itemData);
        toast.success('Kalender tillagd i varukorgen!');
      }
      navigate('/varukorg');
    } catch (error) {
      toast.error('Kunde inte spara ändringarna');
    }
  };

  const buildSavedDesignPayload = async () => {
    if (getUploadedCount() === 0) {
      toast.error('Lägg till minst en bild innan du sparar');
      return null;
    }
    const itemData = await buildCartItemData();
    return {
      editor_type: 'calendar',
      product_id: itemData.product_id,
      product_name: itemData.name,
      price: itemData.price,
      quantity: itemData.quantity,
      print_size: itemData.size,
      image: itemData.image,
      design_preview: itemData.customization.cover_image_url,
      customization: itemData.customization,
    };
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
          <p className="text-slate-500 mt-2">Skapa din personliga kalender med 12 bilder</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Calendar Preview */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm p-6">
              {/* Month Navigation */}
              <div className="flex items-center justify-between mb-6">
                <button 
                  onClick={prevMonth}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-slate-900">{MONTHS[currentMonth]}</h2>
                  <p className="text-slate-500">{selectedYear}</p>
                </div>
                <button 
                  onClick={nextMonth}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </div>

              {/* Calendar Page Preview */}
              <div className="aspect-[3/4] bg-white border-2 border-slate-200 rounded-lg overflow-hidden shadow-lg">
                {/* Image Area */}
                <DraggableImageArea
                  monthData={monthImages[currentMonth]}
                  monthIndex={currentMonth}
                  monthName={MONTHS[currentMonth]}
                  onRemoveImage={() => removeImage(currentMonth)}
                  onUpdateText={(text) => {
                    const next = [...monthImages];
                    next[currentMonth] = { ...next[currentMonth], text };
                    setMonthImages(next);
                  }}
                  onUpdateTextPos={(textPos) => {
                    const next = [...monthImages];
                    next[currentMonth] = { ...next[currentMonth], textPos };
                    setMonthImages(next);
                  }}
                  onUpdateImagePos={(imagePos) => {
                    const next = [...monthImages];
                    next[currentMonth] = { ...next[currentMonth], imagePos };
                    setMonthImages(next);
                  }}
                  getRootProps={getRootProps}
                  getInputProps={getInputProps}
                  isDragActive={isDragActive}
                />
                
                {/* Calendar Grid Area */}
                <div className="h-1/3 p-4 bg-white">
                  <div className="text-center mb-2">
                    <span className="text-lg font-bold text-slate-900">{MONTHS[currentMonth]} {selectedYear}</span>
                  </div>
                  <div className="grid grid-cols-7 gap-1 text-center text-xs">
                    {['Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör', 'Sön'].map(day => (
                      <div key={day} className="font-medium text-slate-500">{day}</div>
                    ))}
                    {Array.from({ length: 35 }, (_, i) => (
                      <div key={i} className="text-slate-400 py-1">
                        {i < 31 ? i + 1 : ''}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Month Thumbnails */}
              <div className="mt-6">
                <h3 className="text-sm font-medium text-slate-700 mb-3">Alla månader</h3>
                <div className="grid grid-cols-6 gap-2">
                  {MONTHS.map((month, index) => (
                    <button
                      key={month}
                      onClick={() => setCurrentMonth(index)}
                      className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                        currentMonth === index 
                          ? 'border-primary ring-2 ring-primary/20' 
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {monthImages[index].preview ? (
                        <>
                          <img 
                            src={monthImages[index].preview}
                            alt={month}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs py-0.5 text-center">
                            {month.slice(0, 3)}
                          </div>
                          <div className="absolute top-1 right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        </>
                      ) : (
                        <div className="w-full h-full bg-slate-100 flex flex-col items-center justify-center">
                          <ImageIcon className="w-4 h-4 text-slate-300" />
                          <span className="text-xs text-slate-400 mt-1">{month.slice(0, 3)}</span>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Options Panel */}
          <div className="space-y-6">
            {/* Progress */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center gap-3 mb-4">
                <Calendar className="w-6 h-6 text-primary" />
                <h3 className="font-semibold text-slate-900">Din kalender</h3>
              </div>
              
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-600">Bilder uppladdade</span>
                  <span className="font-medium text-slate-900">{getUploadedCount()} / 12</span>
                </div>
                <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${(getUploadedCount() / 12) * 100}%` }}
                  />
                </div>
              </div>

              {getUploadedCount() === 12 && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                  <Check className="w-4 h-4 inline mr-2" />
                  Alla 12 månader har bilder!
                </div>
              )}
            </div>

            {/* Text on Image */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center gap-3 mb-4">
                <Type className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-slate-900">Text på bild</h3>
              </div>
              <p className="text-xs text-slate-500 mb-3">Skriv en text som visas på bilden för {MONTHS[currentMonth]}. Dra texten för att flytta.</p>
              <input
                type="text"
                value={monthImages[currentMonth].text}
                onChange={(e) => {
                  const next = [...monthImages];
                  next[currentMonth] = { ...next[currentMonth], text: e.target.value };
                  setMonthImages(next);
                }}
                placeholder={`T.ex. "${MONTHS[currentMonth]} äventyr"`}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
                data-testid="calendar-text-input"
              />
              <div className="flex gap-3 mt-3">
                <div className="flex-1">
                  <label className="text-xs text-slate-500 block mb-1">Färg</label>
                  <div className="flex gap-1.5 flex-wrap">
                    {['#FFFFFF', '#000000', '#FFD700', '#E53935', '#2196F3', '#4CAF50'].map(color => (
                      <button
                        key={color}
                        onClick={() => {
                          const next = [...monthImages];
                          next[currentMonth] = { ...next[currentMonth], textColor: color };
                          setMonthImages(next);
                        }}
                        className={`w-7 h-7 rounded-full border-2 transition-all ${monthImages[currentMonth].textColor === color ? 'border-primary scale-110' : 'border-slate-300'}`}
                        style={{ backgroundColor: color }}
                        data-testid={`text-color-${color.replace('#','')}`}
                      />
                    ))}
                  </div>
                </div>
                <div className="w-24">
                  <label className="text-xs text-slate-500 block mb-1">Storlek</label>
                  <input
                    type="range"
                    min={12}
                    max={48}
                    value={monthImages[currentMonth].fontSize}
                    onChange={(e) => {
                      const next = [...monthImages];
                      next[currentMonth] = { ...next[currentMonth], fontSize: parseInt(e.target.value) };
                      setMonthImages(next);
                    }}
                    className="w-full"
                    data-testid="text-size-slider"
                  />
                  <span className="text-xs text-slate-400 text-center block">{monthImages[currentMonth].fontSize}px</span>
                </div>
              </div>
            </div>

            {/* Year Selection */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-semibold text-slate-900 mb-4">Välj år</h3>
              <div className="flex gap-2">
                {[new Date().getFullYear(), new Date().getFullYear() + 1].map(year => (
                  <button
                    key={year}
                    onClick={() => setSelectedYear(year)}
                    className={`flex-1 py-3 rounded-lg border-2 font-medium transition-all ${
                      selectedYear === year
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {year}
                  </button>
                ))}
              </div>
            </div>

            {/* Size Selection — hidden for family calendars (size is locked) */}
            {product.sizes?.length > 0 && !product.name?.toLowerCase().includes('familje') && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="font-semibold text-slate-900 mb-4">Välj storlek</h3>
                <div className="space-y-2">
                  {product.sizes.map(size => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`w-full py-3 rounded-lg border-2 font-medium transition-all ${
                        selectedSize === size
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Price & Add to Cart */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex justify-between items-center mb-4">
                <span className="text-slate-600">Pris{variantSize ? ` (${variantSize}${variantQuality ? `, ${variantQuality}` : ''})` : ''}</span>
                <span className="text-2xl font-bold text-slate-900">{variantPrice ?? product.price} kr</span>
              </div>
              
              <Button 
                className="w-full" 
                size="lg"
                onClick={handleAddToCart}
                disabled={getUploadedCount() === 0}
                data-testid="add-calendar-to-cart"
              >
                <ShoppingCart className="w-5 h-5 mr-2" />
                {editCartItemId ? 'Spara ändringar' : 'Lägg i varukorg'}
              </Button>

              <Button
                variant="outline"
                className="w-full mt-3"
                size="lg"
                onClick={handleDownloadPdf}
                disabled={getUploadedCount() === 0 || downloadingPdf}
                data-testid="download-calendar-pdf"
              >
                <Download className="w-5 h-5 mr-2" />
                {downloadingPdf ? 'Genererar...' : 'Ladda ner som PDF'}
              </Button>

              <SaveDesignButton
                buildPayload={buildSavedDesignPayload}
                defaultName={`Kalender ${selectedYear}`}
                designId={savedDesignId}
                className="w-full mt-3"
                size="lg"
                variant="outline"
              />

              {getUploadedCount() === 0 && (
                <p className="text-sm text-slate-500 text-center mt-3">
                  Lägg till minst en bild för att fortsätta
                </p>
              )}

              <p className="text-xs text-slate-400 text-center mt-4">
                Tips: Du behöver inte fylla i alla 12 månader, men det blir finast med bilder för varje månad!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarEditor;
