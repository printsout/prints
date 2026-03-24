import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import api from '../services/api';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';
import {
  Upload, ChevronLeft, ChevronRight, ShoppingCart,
  Trash2, Plus, BookOpen, Image as ImageIcon,
  Minus, LayoutGrid, Square, Columns, Rows, Grid2x2
} from 'lucide-react';

const MIN_PAGES = 10;
const MAX_PAGES = 80;
const DEFAULT_PAGES = 20;

// ─── LAYOUTS ───────────────────────────────────────
const LAYOUTS = [
  { id: 'single', label: '1 bild', icon: Square, slots: 1 },
  { id: 'two-h', label: '2 bredvid', icon: Columns, slots: 2 },
  { id: 'two-v', label: '2 staplade', icon: Rows, slots: 2 },
  { id: 'three', label: '1 + 2', icon: LayoutGrid, slots: 3 },
  { id: 'four', label: '2 x 2', icon: Grid2x2, slots: 4 },
];

function createPage(id) {
  return { id, layout: 'single', images: [null], captions: [''] };
}

function resizeImages(images, newSlots) {
  const result = [...images];
  while (result.length < newSlots) result.push(null);
  return result.slice(0, newSlots);
}

function resizeCaptions(captions, newSlots) {
  const result = [...(captions || [])];
  while (result.length < newSlots) result.push('');
  return result.slice(0, newSlots);
}

// ─── SLOT COMPONENT ────────────────────────────────
function ImageSlot({ image, slotIndex, pageIndex, onUpload, onRemove, caption, onCaptionChange }) {
  const inputRef = useRef(null);

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => onUpload(pageIndex, slotIndex, ev.target.result);
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  if (image) {
    return (
      <div className="relative w-full h-full group flex flex-col">
        <div className="relative flex-1 min-h-0">
          <img src={image} alt="" className="w-full h-full object-cover" />
          {/* Caption overlay on image */}
          {caption && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-2 py-2">
              <p className="text-white text-xs font-medium text-center drop-shadow-md leading-tight">{caption}</p>
            </div>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); onRemove(pageIndex, slotIndex); }}
            className="absolute top-1.5 right-1.5 p-1.5 bg-red-500/90 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
          data-testid={`remove-img-${pageIndex}-${slotIndex}`}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
        </div>
        <input
          type="text"
          value={caption || ''}
          onChange={(e) => onCaptionChange(pageIndex, slotIndex, e.target.value)}
          placeholder="Skriv bildtext..."
          maxLength={80}
          className="w-full px-2 py-1.5 text-xs border-t border-slate-200 bg-slate-50 focus:outline-none focus:bg-white placeholder:text-slate-300"
          onClick={(e) => e.stopPropagation()}
          data-testid={`caption-${pageIndex}-${slotIndex}`}
        />
      </div>
    );
  }

  return (
    <div
      onClick={() => inputRef.current?.click()}
      className="w-full h-full flex flex-col items-center justify-center cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors border border-dashed border-slate-300 rounded"
      data-testid={`slot-${pageIndex}-${slotIndex}`}
    >
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      <Upload className="w-5 h-5 text-slate-400 mb-1" />
      <span className="text-xs text-slate-400">Lägg till bild</span>
    </div>
  );
}

// ─── LAYOUT RENDERER ───────────────────────────────
function PagePreview({ page, pageIndex, onUpload, onRemove, onCaptionChange }) {
  const { layout, images, captions } = page;
  const slot = (idx) => (
    <ImageSlot
      key={idx}
      image={images[idx] || null}
      slotIndex={idx}
      pageIndex={pageIndex}
      onUpload={onUpload}
      onRemove={onRemove}
      caption={captions?.[idx] || ''}
      onCaptionChange={onCaptionChange}
    />
  );

  const containerClass = "w-full h-full";

  switch (layout) {
    case 'two-h':
      return (
        <div className={`${containerClass} grid grid-cols-2 gap-1 p-1`}>
          {slot(0)}{slot(1)}
        </div>
      );
    case 'two-v':
      return (
        <div className={`${containerClass} grid grid-rows-2 gap-1 p-1`}>
          {slot(0)}{slot(1)}
        </div>
      );
    case 'three':
      return (
        <div className={`${containerClass} grid grid-rows-2 gap-1 p-1`}>
          <div className="row-span-1">{slot(0)}</div>
          <div className="grid grid-cols-2 gap-1">
            {slot(1)}{slot(2)}
          </div>
        </div>
      );
    case 'four':
      return (
        <div className={`${containerClass} grid grid-cols-2 grid-rows-2 gap-1 p-1`}>
          {slot(0)}{slot(1)}{slot(2)}{slot(3)}
        </div>
      );
    default: // single
      return <div className={`${containerClass} p-1`}>{slot(0)}</div>;
  }
}

// ─── MAIN COMPONENT ────────────────────────────────
const PhotoAlbumEditor = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [pages, setPages] = useState(
    Array.from({ length: DEFAULT_PAGES }, (_, i) => createPage(i))
  );
  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [coverImage, setCoverImage] = useState(null);
  const [coverText, setCoverText] = useState('');
  const [coverMaterial, setCoverMaterial] = useState('hardpaper');
  const [showCover, setShowCover] = useState(true);
  const coverInputRef = useRef(null);

  const COVER_MATERIALS = [
    { id: 'hardpaper', label: 'Hårt papper', desc: 'Klassiskt hårt kartongomslag', price: 0 },
    { id: 'fabric', label: 'Tygbeklätt', desc: 'Hårt papper beklätt med tyg', price: 49 },
    { id: 'leather', label: 'Konstläder', desc: 'Hårt papper beklätt med konstläder', price: 79 },
  ];

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await api.get(`/products/${productId}`);
        setProduct(response.data);
        if (response.data.sizes?.length > 0) setSelectedSize(response.data.sizes[0]);
      } catch (error) {
        console.error('Failed to fetch product:', error);
        toast.error('Kunde inte hämta produkt');
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [productId]);

  // ── Image handlers ──
  const handleCoverUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setCoverImage(ev.target.result);
      toast.success('Omslagsbild tillagd');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleUpload = (pageIdx, slotIdx, dataUrl) => {
    setPages(prev => {
      const updated = [...prev];
      const newImages = [...updated[pageIdx].images];
      newImages[slotIdx] = dataUrl;
      updated[pageIdx] = { ...updated[pageIdx], images: newImages };
      return updated;
    });
    toast.success(`Bild tillagd`);
  };

  const handleRemoveImage = (pageIdx, slotIdx) => {
    setPages(prev => {
      const updated = [...prev];
      const newImages = [...updated[pageIdx].images];
      newImages[slotIdx] = null;
      updated[pageIdx] = { ...updated[pageIdx], images: newImages };
      return updated;
    });
  };

  const handleCaptionChange = (pageIdx, slotIdx, text) => {
    setPages(prev => {
      const updated = [...prev];
      const newCaptions = [...(updated[pageIdx].captions || [])];
      while (newCaptions.length <= slotIdx) newCaptions.push('');
      newCaptions[slotIdx] = text;
      updated[pageIdx] = { ...updated[pageIdx], captions: newCaptions };
      return updated;
    });
  };

  // ── Layout change ──
  const changeLayout = (layoutId) => {
    const layoutDef = LAYOUTS.find(l => l.id === layoutId);
    if (!layoutDef) return;
    setPages(prev => {
      const updated = [...prev];
      const oldImages = updated[currentPage].images;
      updated[currentPage] = {
        ...updated[currentPage],
        layout: layoutId,
        images: resizeImages(oldImages, layoutDef.slots),
        captions: resizeCaptions(updated[currentPage].captions, layoutDef.slots),
      };
      return updated;
    });
  };

  // ── Page management ──
  const addPages = (count) => {
    if (pages.length + count > MAX_PAGES) {
      toast.error(`Max ${MAX_PAGES} sidor tillåtet`);
      return;
    }
    const newPages = Array.from({ length: count }, (_, i) => createPage(Date.now() + i));
    setPages(prev => [...prev, ...newPages]);
    toast.success(`${count} sidor tillagda`);
  };

  const removePage = (pageIndex) => {
    if (pages.length <= MIN_PAGES) {
      toast.error(`Minimum ${MIN_PAGES} sidor`);
      return;
    }
    setPages(prev => prev.filter((_, i) => i !== pageIndex));
    if (currentPage >= pages.length - 1) setCurrentPage(Math.max(0, pages.length - 2));
  };

  // ── Counts ──
  const getTotalImages = () => pages.reduce((sum, p) => sum + p.images.filter(Boolean).length, 0);
  const getPageImageCount = (p) => p.images.filter(Boolean).length;

  const extraPageCost = Math.max(0, pages.length - DEFAULT_PAGES) * 5;
  const basePrice = product?.price || 0;
  const materialCost = COVER_MATERIALS.find(m => m.id === coverMaterial)?.price || 0;
  const totalPerItem = basePrice + extraPageCost + materialCost;

  const handleAddToCart = async () => {
    if (getTotalImages() === 0) {
      toast.error('Lägg till minst en bild i ditt album');
      return;
    }
    try {
      toast.info('Laddar upp bilder...');

      // Upload all images to server
      const uploadedPages = [];
      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        const uploadedImages = [];
        for (const img of page.images) {
          if (img) {
            const uploadRes = await api.post('/upload-base64', { image: img });
            uploadedImages.push(uploadRes.data.url);
          } else {
            uploadedImages.push(null);
          }
        }
        uploadedPages.push({
          page_number: i + 1,
          layout: page.layout,
          image_count: getPageImageCount(page),
          image_urls: uploadedImages.filter(Boolean),
          captions: (page.captions || []).filter((c, idx) => page.images[idx] && c),
        });
      }

      // Upload cover image if exists
      let coverImageUrl = null;
      if (coverImage) {
        const coverRes = await api.post('/upload-base64', { image: coverImage });
        coverImageUrl = coverRes.data.url;
      }

      await addToCart({
        product_id: product.product_id,
        name: product.name,
        price: totalPerItem,
        quantity,
        image: coverImage || pages.flatMap(p => p.images).find(Boolean) || product.images?.[0],
        customization: {
          type: 'photoalbum',
          total_pages: pages.length,
          total_images: getTotalImages(),
          size: selectedSize,
          cover_image_url: coverImageUrl,
          cover_text: coverText || null,
          cover_material: coverMaterial,
          pages: uploadedPages,
        },
      });
      toast.success('Fotoalbum tillagt i varukorgen!');
      navigate('/varukorg');
    } catch {
      toast.error('Kunde inte lägga till i varukorgen');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f7f4]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#2a9d8f]" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f7f4]">
        <p className="text-slate-500">Produkt hittades inte</p>
      </div>
    );
  }

  const currentPageData = pages[currentPage];

  return (
    <div className="min-h-screen bg-[#f8f7f4]" data-testid="album-editor">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1 text-slate-500 hover:text-[#2a9d8f] transition-colors text-sm"
            data-testid="back-button"
          >
            <ChevronLeft className="w-4 h-4" />
            Tillbaka
          </button>
          <span className="text-slate-300">|</span>
          <h1 className="text-base font-semibold text-slate-800">{product.name}</h1>
          <span className="ml-auto text-sm text-slate-400">
            {getTotalImages()} bilder totalt
          </span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
          {/* LEFT: Editor */}
          <div className="space-y-4">
            {/* Cover / Pages toggle */}
            <div className="flex gap-2 bg-white rounded-xl border p-2">
              <button
                onClick={() => setShowCover(true)}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  showCover
                    ? 'bg-[#2a9d8f] text-white shadow-sm'
                    : 'text-slate-500 hover:bg-slate-50'
                }`}
                data-testid="tab-cover"
              >
                Omslag
              </button>
              <button
                onClick={() => setShowCover(false)}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  !showCover
                    ? 'bg-[#2a9d8f] text-white shadow-sm'
                    : 'text-slate-500 hover:bg-slate-50'
                }`}
                data-testid="tab-pages"
              >
                Sidor ({pages.length})
              </button>
            </div>

            {showCover ? (
              <>
                {/* Cover editor */}
                <div className="bg-white rounded-xl border overflow-hidden" data-testid="cover-editor">
                  <div className="px-4 py-3 border-b bg-slate-50">
                    <h3 className="text-sm font-semibold text-slate-700">Designa albumets omslag</h3>
                    <p className="text-xs text-slate-400">Ladda upp en bild och lägg till text på framsidan</p>
                  </div>

                  {/* Cover preview */}
                  <div className="aspect-[3/4] bg-gradient-to-b from-slate-100 to-slate-50 flex items-center justify-center relative">
                    <input
                      ref={coverInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleCoverUpload}
                    />
                    {coverImage ? (
                      <div className="relative w-full h-full group">
                        <img
                          src={coverImage}
                          alt="Omslag"
                          className="w-full h-full object-cover"
                        />
                        {/* Cover text overlay */}
                        {coverText && (
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-6 py-8">
                            <p className="text-white text-2xl font-bold text-center drop-shadow-lg">{coverText}</p>
                          </div>
                        )}
                        {/* Change/remove buttons */}
                        <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => coverInputRef.current?.click()}
                            className="p-2 bg-white/90 text-slate-700 rounded-lg shadow-md hover:bg-white transition-colors"
                            data-testid="change-cover-image"
                          >
                            <Upload className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setCoverImage(null)}
                            className="p-2 bg-red-500/90 text-white rounded-lg shadow-md hover:bg-red-600 transition-colors"
                            data-testid="remove-cover-image"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div
                        onClick={() => coverInputRef.current?.click()}
                        className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 transition-colors"
                        data-testid="cover-upload-area"
                      >
                        <div className="w-20 h-20 rounded-full bg-[#2a9d8f]/10 flex items-center justify-center mb-4">
                          <Upload className="w-8 h-8 text-[#2a9d8f]" />
                        </div>
                        <p className="text-base font-semibold text-slate-700">Ladda upp omslagsbild</p>
                        <p className="text-sm text-slate-400 mt-1">Klicka för att välja en bild</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Cover text input */}
                <div className="bg-white rounded-xl border p-4" data-testid="cover-text-section">
                  <h3 className="text-sm font-semibold text-slate-700 mb-2">Text på omslaget (valfritt)</h3>
                  <input
                    type="text"
                    value={coverText}
                    onChange={(e) => setCoverText(e.target.value)}
                    placeholder="T.ex. Familjen Andersson 2026"
                    maxLength={50}
                    className="w-full h-10 rounded-md border border-slate-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2a9d8f]"
                    data-testid="cover-text-input"
                  />
                  <p className="text-xs text-slate-400 mt-1">Visas längst ner på omslaget</p>
                </div>

                {/* Cover material selection */}
                <div className="bg-white rounded-xl border p-4" data-testid="cover-material-section">
                  <h3 className="text-sm font-semibold text-slate-700 mb-3">Välj omslagsmaterial</h3>
                  <div className="space-y-2">
                    {COVER_MATERIALS.map(mat => (
                      <button
                        key={mat.id}
                        onClick={() => setCoverMaterial(mat.id)}
                        className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 text-left transition-all ${
                          coverMaterial === mat.id
                            ? 'border-[#2a9d8f] bg-[#2a9d8f]/5'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                        data-testid={`cover-material-${mat.id}`}
                      >
                        <div className={`w-10 h-10 rounded-lg flex-shrink-0 ${
                          mat.id === 'hardpaper' ? 'bg-amber-100 border border-amber-200' :
                          mat.id === 'fabric' ? 'bg-slate-200 border border-slate-300' :
                          'bg-stone-800 border border-stone-700'
                        }`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-800">{mat.label}</p>
                          <p className="text-xs text-slate-400">{mat.desc}</p>
                        </div>
                        <span className="text-sm font-semibold text-slate-600 flex-shrink-0">
                          {mat.price === 0 ? 'Ingår' : `+${mat.price} kr`}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <>
            {/* Page navigation */}
            <div className="flex items-center justify-between bg-white rounded-xl border p-3">
              <button
                onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                disabled={currentPage === 0}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-30"
                data-testid="prev-page"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="text-center">
                <span className="text-lg font-bold text-slate-800" data-testid="page-indicator">
                  Sida {currentPage + 1}
                </span>
                <span className="text-slate-400 text-sm ml-1">av {pages.length}</span>
              </div>
              <button
                onClick={() => setCurrentPage(Math.min(pages.length - 1, currentPage + 1))}
                disabled={currentPage === pages.length - 1}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-30"
                data-testid="next-page"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Layout selector */}
            <div className="bg-white rounded-xl border p-3" data-testid="layout-selector">
              <div className="flex items-center gap-2 mb-2">
                <LayoutGrid className="w-4 h-4 text-slate-500" />
                <span className="text-sm font-semibold text-slate-700">Sidlayout</span>
              </div>
              <div className="flex gap-2">
                {LAYOUTS.map(lo => {
                  const Icon = lo.icon;
                  return (
                    <button
                      key={lo.id}
                      onClick={() => changeLayout(lo.id)}
                      className={`flex-1 flex flex-col items-center gap-1 py-2.5 rounded-lg border-2 transition-all text-xs font-medium ${
                        currentPageData?.layout === lo.id
                          ? 'border-[#2a9d8f] bg-[#2a9d8f]/5 text-[#2a9d8f]'
                          : 'border-slate-200 text-slate-500 hover:border-slate-300'
                      }`}
                      data-testid={`layout-${lo.id}`}
                    >
                      <Icon className="w-5 h-5" />
                      {lo.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Main page preview */}
            <div className="bg-white rounded-xl border overflow-hidden" data-testid="page-preview">
              <div className="aspect-[4/3] bg-white">
                <PagePreview
                  page={currentPageData}
                  pageIndex={currentPage}
                  onUpload={handleUpload}
                  onRemove={handleRemoveImage}
                  onCaptionChange={handleCaptionChange}
                />
              </div>
              <div className="px-4 py-2 border-t bg-slate-50 flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  Sida {currentPage + 1} — {getPageImageCount(currentPageData)} / {currentPageData.images.length} bilder
                </span>
                <span className="text-xs text-slate-400">
                  Layout: {LAYOUTS.find(l => l.id === currentPageData.layout)?.label}
                </span>
              </div>
            </div>

            {/* Page thumbnails */}
            <div className="bg-white rounded-xl border p-4" data-testid="page-thumbnails">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-slate-700">Alla sidor ({pages.length})</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => addPages(2)}
                    className="flex items-center gap-1 text-xs font-medium text-[#2a9d8f] hover:text-[#238b7e] transition-colors bg-[#2a9d8f]/5 px-2.5 py-1.5 rounded-lg"
                    data-testid="add-2-pages"
                  >
                    <Plus className="w-3 h-3" />
                    +2 sidor
                  </button>
                  <button
                    onClick={() => addPages(10)}
                    className="flex items-center gap-1 text-xs font-medium text-[#2a9d8f] hover:text-[#238b7e] transition-colors bg-[#2a9d8f]/5 px-2.5 py-1.5 rounded-lg"
                    data-testid="add-10-pages"
                  >
                    <Plus className="w-3 h-3" />
                    +10 sidor
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-8 sm:grid-cols-10 gap-1.5 max-h-[220px] overflow-y-auto pr-1">
                {pages.map((page, index) => {
                  const imgCount = getPageImageCount(page);
                  const slotCount = page.images.length;
                  return (
                    <div
                      key={page.id}
                      onClick={() => setCurrentPage(index)}
                      className={`group relative aspect-[3/4] rounded-md border-2 overflow-hidden transition-all cursor-pointer ${
                        currentPage === index
                          ? 'border-[#2a9d8f] ring-2 ring-[#2a9d8f]/20'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                      data-testid={`page-thumb-${index}`}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setCurrentPage(index); }}
                    >
                      {imgCount > 0 ? (
                        <div className="w-full h-full">
                          <img src={page.images.find(Boolean)} alt="" className="w-full h-full object-cover" />
                          {imgCount > 1 && (
                            <div className="absolute top-0.5 left-0.5 bg-[#2a9d8f] text-white rounded px-1" style={{ fontSize: '7px' }}>
                              {imgCount}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="w-full h-full bg-slate-50 flex items-center justify-center">
                          <ImageIcon className="w-3 h-3 text-slate-300" />
                        </div>
                      )}
                      <span className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-center leading-tight" style={{ fontSize: '8px' }}>
                        {index + 1}
                      </span>
                      {pages.length > MIN_PAGES && (
                        <button
                          onClick={(e) => { e.stopPropagation(); removePage(index); }}
                          className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white rounded-bl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          style={{ fontSize: '8px' }}
                          data-testid={`remove-page-${index}`}
                        >
                          <Trash2 className="w-2.5 h-2.5" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
              </>
            )}
          </div>

          {/* RIGHT: Options */}
          <div className="space-y-4 lg:sticky lg:top-4 self-start">
            {/* Product info */}
            <div className="bg-white rounded-xl border p-5" data-testid="product-info">
              <div className="flex items-center gap-3 mb-3">
                <BookOpen className="w-6 h-6 text-[#2a9d8f]" />
                <h2 className="text-lg font-bold text-slate-900">{product.name}</h2>
              </div>
              <p className="text-sm text-slate-500 mb-4">{product.description}</p>

              {/* Progress */}
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-600">Omslag</span>
                  <span className={`font-semibold ${coverImage ? 'text-[#2a9d8f]' : 'text-slate-400'}`}>
                    {coverImage ? 'Klar' : 'Ej tillagd'}
                  </span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-600">Sidor med bilder</span>
                  <span className="font-semibold text-slate-900" data-testid="upload-count">
                    {pages.filter(p => getPageImageCount(p) > 0).length} / {pages.length}
                  </span>
                </div>
                <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#2a9d8f] transition-all duration-300 rounded-full"
                    style={{ width: `${(pages.filter(p => getPageImageCount(p) > 0).length / pages.length) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-slate-400 mt-1">{getTotalImages()} bilder totalt</p>
              </div>
            </div>

            {/* Pages & Size */}
            <div className="bg-white rounded-xl border p-5 space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-700 mb-2">Antal sidor</h3>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => { if (pages.length > MIN_PAGES) { setPages(prev => prev.slice(0, -2)); } }}
                    disabled={pages.length <= MIN_PAGES}
                    className="w-9 h-9 rounded-full border border-slate-300 flex items-center justify-center hover:bg-slate-100 disabled:opacity-30 transition-colors"
                    data-testid="decrease-pages"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="font-bold text-lg w-12 text-center" data-testid="page-count">{pages.length}</span>
                  <button
                    onClick={() => addPages(2)}
                    disabled={pages.length >= MAX_PAGES}
                    className="w-9 h-9 rounded-full border border-slate-300 flex items-center justify-center hover:bg-slate-100 disabled:opacity-30 transition-colors"
                    data-testid="increase-pages"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-slate-400 mt-1">Min {MIN_PAGES}, Max {MAX_PAGES} sidor</p>
                {extraPageCost > 0 && (
                  <p className="text-xs text-[#2a9d8f] mt-1">+{extraPageCost} kr för extra sidor</p>
                )}
              </div>

              {product.sizes?.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-700 mb-2">Storlek</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {product.sizes.map(size => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`py-2.5 px-3 rounded-lg border-2 text-sm font-medium transition-all ${
                          selectedSize === size
                            ? 'border-[#2a9d8f] bg-[#2a9d8f]/5 text-[#2a9d8f]'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                        data-testid={`size-${size}`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Quantity + Price */}
            <div className="bg-white rounded-xl border p-5">
              <div className="flex items-center justify-between py-2 border-b mb-3">
                <span className="text-sm text-slate-600">Antal</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-8 h-8 rounded-full border border-slate-300 flex items-center justify-center hover:bg-slate-100 transition-colors"
                    data-testid="qty-minus"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="font-semibold w-8 text-center" data-testid="qty-value">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-8 h-8 rounded-full border border-slate-300 flex items-center justify-center hover:bg-slate-100 transition-colors"
                    data-testid="qty-plus"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="space-y-1 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Grundpris ({DEFAULT_PAGES} sidor)</span>
                  <span className="text-slate-700">{basePrice} kr</span>
                </div>
                {extraPageCost > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Extra sidor ({pages.length - DEFAULT_PAGES} st)</span>
                    <span className="text-slate-700">+{extraPageCost} kr</span>
                  </div>
                )}
                {materialCost > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">{COVER_MATERIALS.find(m => m.id === coverMaterial)?.label}</span>
                    <span className="text-slate-700">+{materialCost} kr</span>
                  </div>
                )}
                {quantity > 1 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">x {quantity} st</span>
                    <span className="text-slate-700">{totalPerItem * quantity} kr</span>
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center mb-4 pt-2 border-t">
                <span className="text-sm font-medium text-slate-700">Totalt</span>
                <span className="text-xl font-bold text-slate-900" data-testid="total-price">{totalPerItem * quantity} kr</span>
              </div>

              <Button
                className="w-full bg-[#2a9d8f] hover:bg-[#238b7e] h-12 text-base"
                onClick={handleAddToCart}
                disabled={getTotalImages() === 0}
                data-testid="add-album-to-cart"
              >
                <ShoppingCart className="w-5 h-5 mr-2" />
                Lägg i kundvagn
              </Button>

              {getTotalImages() === 0 && (
                <p className="text-xs text-slate-400 text-center mt-2">
                  Lägg till minst en bild för att fortsätta
                </p>
              )}
            </div>

            {/* Tips */}
            <div className="bg-[#2a9d8f]/5 rounded-xl border border-[#2a9d8f]/20 p-4">
              <h4 className="text-sm font-semibold text-[#2a9d8f] mb-2">Tips</h4>
              <ul className="text-xs text-slate-600 space-y-1.5">
                <li>Välj sidlayout för att lägga till 1–4 bilder per sida</li>
                <li>Klicka på ett tomt fält för att ladda upp en bild</li>
                <li>Hovra över en bild för att ta bort den</li>
                <li>Extra sidor kostar 5 kr / sida utöver {DEFAULT_PAGES} grundsidor</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PhotoAlbumEditor;
