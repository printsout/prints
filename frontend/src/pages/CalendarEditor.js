import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { useCart } from '../context/CartContext';
import api from '../services/api';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';
import { 
  Upload, ChevronLeft, ChevronRight, ShoppingCart, 
  Trash2, Check, Calendar, Image as ImageIcon
} from 'lucide-react';

const MONTHS = [
  'Januari', 'Februari', 'Mars', 'April', 
  'Maj', 'Juni', 'Juli', 'Augusti',
  'September', 'Oktober', 'November', 'December'
];

const CalendarEditor = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(0);
  const [monthImages, setMonthImages] = useState(
    Array(12).fill(null).map(() => ({ image: null, preview: null }))
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
        console.error('Failed to fetch product:', error);
        toast.error('Kunde inte hämta produkt');
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [productId]);

  const onDrop = (acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      const reader = new FileReader();
      reader.onload = () => {
        const newImages = [...monthImages];
        newImages[currentMonth] = {
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
    newImages[monthIndex] = { image: null, preview: null };
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

  const handleAddToCart = () => {
    if (getUploadedCount() === 0) {
      toast.error('Lägg till minst en bild för din kalender');
      return;
    }

    const calendarData = {
      year: selectedYear,
      size: selectedSize,
      months: monthImages.map((m, index) => ({
        month: MONTHS[index],
        hasImage: m.preview !== null,
        imagePreview: m.preview
      }))
    };

    addItem({
      product_id: product.product_id,
      name: product.name,
      price: product.price,
      quantity: 1,
      image: monthImages.find(m => m.preview)?.preview || product.images?.[0],
      size: selectedSize,
      customization: {
        type: 'calendar',
        year: selectedYear,
        images_count: getUploadedCount(),
        calendar_data: calendarData
      }
    });

    toast.success('Kalender tillagd i varukorgen!');
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
                <div className="h-2/3 bg-slate-100 relative">
                  {monthImages[currentMonth].preview ? (
                    <>
                      <img 
                        src={monthImages[currentMonth].preview}
                        alt={MONTHS[currentMonth]}
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={() => removeImage(currentMonth)}
                        className="absolute top-4 right-4 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <div 
                      {...getRootProps()}
                      className={`w-full h-full flex flex-col items-center justify-center cursor-pointer transition-colors ${
                        isDragActive ? 'bg-primary/10' : 'hover:bg-slate-200'
                      }`}
                    >
                      <input {...getInputProps()} />
                      <Upload className="w-12 h-12 text-slate-400 mb-4" />
                      <p className="text-slate-600 font-medium">Ladda upp bild för {MONTHS[currentMonth]}</p>
                      <p className="text-slate-400 text-sm mt-1">Dra & släpp eller klicka</p>
                    </div>
                  )}
                </div>
                
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

            {/* Size Selection */}
            {product.sizes?.length > 0 && (
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
                <span className="text-slate-600">Pris</span>
                <span className="text-2xl font-bold text-slate-900">{product.price} kr</span>
              </div>
              
              <Button 
                className="w-full" 
                size="lg"
                onClick={handleAddToCart}
                disabled={getUploadedCount() === 0}
                data-testid="add-calendar-to-cart"
              >
                <ShoppingCart className="w-5 h-5 mr-2" />
                Lägg i varukorg
              </Button>

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
