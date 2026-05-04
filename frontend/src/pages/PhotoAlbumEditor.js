import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { toast } from 'sonner';
import { ChevronLeft } from 'lucide-react';
import SaveDesignButton from '../components/SaveDesignButton';

import {
  MIN_PAGES, MAX_PAGES, DEFAULT_PAGES, LAYOUTS, COVER_MATERIALS,
  createPage, resizeImages, resizeCaptions, getPageImageCount, burnCaptionOnImage,
} from './photoalbum/constants';
import { CoverEditor } from './photoalbum/CoverEditor';
import { PagesEditor } from './photoalbum/PagesEditor';
import { AlbumSidebar } from './photoalbum/AlbumSidebar';

const PhotoAlbumEditor = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editCartItemId = searchParams.get('edit');
  const { addToCart, updateCartItem, cart } = useCart();
  const { token } = useAuth();
  const savedDesignId = searchParams.get('design');

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [pages, setPages] = useState(Array.from({ length: DEFAULT_PAGES }, (_, i) => createPage(i)));
  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [coverImage, setCoverImage] = useState(null);
  const [coverText, setCoverText] = useState('');
  const [coverMaterial, setCoverMaterial] = useState('hardpaper');
  const [showCover, setShowCover] = useState(true);
  const coverInputRef = useRef(null);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await api.get(`/products/${productId}`);
        setProduct(response.data);
        if (response.data.sizes?.length > 0) setSelectedSize(response.data.sizes[0]);
      } catch {
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
    if (!cartItem?.customization || cartItem.customization.type !== 'photoalbum') return;

    const c = cartItem.customization;
    const backendUrl = process.env.REACT_APP_BACKEND_URL || '';
    const resolveUrl = (url) => {
      if (!url) return null;
      return url.startsWith('/api') ? `${backendUrl}${url}` : url;
    };

    if (c.size) setSelectedSize(c.size);
    if (c.cover_material) setCoverMaterial(c.cover_material);
    if (c.cover_text) setCoverText(c.cover_text);
    if (c.cover_image_url) setCoverImage(resolveUrl(c.cover_image_url));
    if (cartItem.quantity) setQuantity(cartItem.quantity);

    // Hydrate pages from uploaded data
    if (c.pages?.length) {
      const hydratedPages = c.pages.map((p, idx) => {
        const layout = LAYOUTS.find(l => l.id === p.layout) || LAYOUTS[0];
        const images = Array(layout.slots).fill(null);
        const captions = Array(layout.slots).fill('');
        if (p.image_urls) {
          p.image_urls.forEach((url, i) => {
            if (url && i < images.length) images[i] = resolveUrl(url);
          });
        }
        if (p.captions) {
          p.captions.forEach((cap, i) => {
            if (cap && i < captions.length) captions[i] = cap;
          });
        }
        return { id: idx, layout: p.layout || 'single', images, captions };
      });
      setPages(hydratedPages);
    }
  }, [editCartItemId, cart.items]);

  // Hydrate from saved design
  useEffect(() => {
    if (!savedDesignId || !token) return;
    (async () => {
      try {
        const res = await api.get(`/saved-designs/${savedDesignId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const c = res.data?.customization;
        if (!c || c.type !== 'photoalbum') return;
        const backendUrl = process.env.REACT_APP_BACKEND_URL || '';
        const resolveUrl = (url) => {
          if (!url) return null;
          return url.startsWith('/api') ? `${backendUrl}${url}` : url;
        };
        if (c.size) setSelectedSize(c.size);
        if (c.cover_material) setCoverMaterial(c.cover_material);
        if (c.cover_text) setCoverText(c.cover_text);
        if (c.cover_image_url) setCoverImage(resolveUrl(c.cover_image_url));
        if (c.pages?.length) {
          const hydrated = c.pages.map((p, idx) => {
            const layout = LAYOUTS.find((l) => l.id === p.layout) || LAYOUTS[0];
            const images = Array(layout.slots).fill(null);
            const captions = Array(layout.slots).fill('');
            (p.image_urls || []).forEach((url, i) => { if (url && i < images.length) images[i] = resolveUrl(url); });
            (p.captions || []).forEach((cap, i) => { if (cap && i < captions.length) captions[i] = cap; });
            return { id: idx, layout: p.layout || 'single', images, captions };
          });
          setPages(hydrated);
        }
      } catch { toast.error('Kunde inte ladda sparad design'); }
    })();
  }, [savedDesignId, token]);

  const handleCoverUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => { setCoverImage(ev.target.result); toast.success('Omslagsbild tillagd'); };
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
    toast.success('Bild tillagd');
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

  const changeLayout = (layoutId) => {
    const layoutDef = LAYOUTS.find(l => l.id === layoutId);
    if (!layoutDef) return;
    setPages(prev => {
      const updated = [...prev];
      updated[currentPage] = {
        ...updated[currentPage],
        layout: layoutId,
        images: resizeImages(updated[currentPage].images, layoutDef.slots),
        captions: resizeCaptions(updated[currentPage].captions, layoutDef.slots),
      };
      return updated;
    });
  };

  const addPages = (count) => {
    if (pages.length + count > MAX_PAGES) { toast.error(`Max ${MAX_PAGES} sidor tillåtet`); return; }
    setPages(prev => [...prev, ...Array.from({ length: count }, (_, i) => createPage(Date.now() + i))]);
    toast.success(`${count} sidor tillagda`);
  };

  const removePage = (pageIndex) => {
    if (pages.length <= MIN_PAGES) { toast.error(`Minimum ${MIN_PAGES} sidor`); return; }
    setPages(prev => prev.filter((_, i) => i !== pageIndex));
    if (currentPage >= pages.length - 1) setCurrentPage(Math.max(0, pages.length - 2));
  };

  const removeLastPages = () => {
    if (pages.length > MIN_PAGES) setPages(prev => prev.slice(0, -2));
  };

  const getTotalImages = () => pages.reduce((sum, p) => sum + p.images.filter(Boolean).length, 0);

  const extraPageCost = Math.max(0, pages.length - DEFAULT_PAGES) * 5;
  const basePrice = product?.price || 0;
  const materialCost = COVER_MATERIALS.find(m => m.id === coverMaterial)?.price || 0;
  const totalPerItem = basePrice + extraPageCost + materialCost;

  const handleAddToCart = async () => {
    if (getTotalImages() === 0) { toast.error('Lägg till minst en bild i ditt album'); return; }
    try {
      toast.info('Laddar upp bilder...');
      const itemData = await buildCartItemData();
      if (editCartItemId) {
        await updateCartItem(editCartItemId, itemData);
        toast.success('Fotoalbum uppdaterat!');
      } else {
        await addToCart(itemData);
        toast.success('Fotoalbum tillagt i varukorgen!');
      }
      navigate('/varukorg');
    } catch {
      toast.error('Kunde inte spara ändringarna');
    }
  };

  const buildCartItemData = async () => {
    const uploadedPages = [];
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      const uploadedImages = [];
      for (let s = 0; s < page.images.length; s++) {
        if (page.images[s]) {
          const img = page.images[s];
          if (img.startsWith('data:')) {
            const finalImg = await burnCaptionOnImage(img, page.captions?.[s] || '');
            const uploadRes = await api.post('/upload-base64', { image: finalImg });
            uploadedImages.push(uploadRes.data.url);
          } else {
            const backendUrl = process.env.REACT_APP_BACKEND_URL || '';
            const path = img.startsWith(backendUrl) ? img.replace(backendUrl, '') : img;
            uploadedImages.push(path);
          }
        } else {
          uploadedImages.push(null);
        }
      }
      uploadedPages.push({
        page_number: i + 1, layout: page.layout,
        image_count: getPageImageCount(page),
        image_urls: uploadedImages.filter(Boolean),
        captions: (page.captions || []).filter((c, idx) => page.images[idx] && c),
      });
    }
    let coverImageUrl = null;
    if (coverImage) {
      if (coverImage.startsWith('data:')) {
        const finalCover = await burnCaptionOnImage(coverImage, coverText);
        const coverRes = await api.post('/upload-base64', { image: finalCover });
        coverImageUrl = coverRes.data.url;
      } else {
        const backendUrl = process.env.REACT_APP_BACKEND_URL || '';
        coverImageUrl = coverImage.startsWith(backendUrl)
          ? coverImage.replace(backendUrl, '')
          : coverImage;
      }
    }
    return {
      product_id: product.product_id, name: product.name,
      price: totalPerItem, quantity,
      image: coverImage || pages.flatMap((p) => p.images).find(Boolean) || product.images?.[0],
      customization: {
        type: 'photoalbum', total_pages: pages.length,
        total_images: getTotalImages(), size: selectedSize,
        cover_image_url: coverImageUrl, cover_text: coverText || null,
        cover_material: coverMaterial, pages: uploadedPages,
      },
    };
  };

  const buildSavedDesignPayload = async () => {
    if (getTotalImages() === 0) { toast.error('Lägg till minst en bild först'); return null; }
    const itemData = await buildCartItemData();
    return {
      editor_type: 'photoalbum',
      product_id: itemData.product_id,
      product_name: itemData.name,
      price: itemData.price,
      quantity: itemData.quantity,
      print_size: itemData.customization.size,
      image: itemData.image,
      design_preview: itemData.customization.cover_image_url || itemData.image,
      customization: itemData.customization,
    };
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8f7f4]">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#2a9d8f]" />
    </div>
  );

  if (!product) return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8f7f4]">
      <p className="text-slate-500">Produkt hittades inte</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8f7f4]" data-testid="album-editor">
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-slate-500 hover:text-[#2a9d8f] transition-colors text-sm" data-testid="back-button">
            <ChevronLeft className="w-4 h-4" />Tillbaka
          </button>
          <span className="text-slate-300">|</span>
          <h1 className="text-base font-semibold text-slate-800">{product.name}</h1>
          <span className="ml-auto text-sm text-slate-400">{getTotalImages()} bilder totalt</span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
          <div className="space-y-4">
            <div className="flex gap-2 bg-white rounded-xl border p-2">
              <button onClick={() => setShowCover(true)} className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${showCover ? 'bg-[#2a9d8f] text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`} data-testid="tab-cover">
                Omslag
              </button>
              <button onClick={() => setShowCover(false)} className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${!showCover ? 'bg-[#2a9d8f] text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`} data-testid="tab-pages">
                Sidor ({pages.length})
              </button>
            </div>

            {showCover ? (
              <CoverEditor
                coverImage={coverImage} setCoverImage={setCoverImage}
                coverText={coverText} setCoverText={setCoverText}
                coverMaterial={coverMaterial} setCoverMaterial={setCoverMaterial}
                coverInputRef={coverInputRef} handleCoverUpload={handleCoverUpload}
              />
            ) : (
              <PagesEditor
                pages={pages} currentPage={currentPage} setCurrentPage={setCurrentPage}
                changeLayout={changeLayout} addPages={addPages} removePage={removePage}
                handleUpload={handleUpload} handleRemoveImage={handleRemoveImage}
                handleCaptionChange={handleCaptionChange}
              />
            )}
          </div>

          <AlbumSidebar
            product={product} coverImage={coverImage} pages={pages}
            selectedSize={selectedSize} setSelectedSize={setSelectedSize}
            quantity={quantity} setQuantity={setQuantity}
            coverMaterial={coverMaterial} basePrice={basePrice}
            extraPageCost={extraPageCost} materialCost={materialCost}
            totalPerItem={totalPerItem} getTotalImages={getTotalImages}
            handleAddToCart={handleAddToCart} addPages={addPages}
            removeLastPages={removeLastPages}
            editMode={!!editCartItemId}
            saveDesignSlot={
              <SaveDesignButton
                buildPayload={buildSavedDesignPayload}
                defaultName={coverText ? `Album - ${coverText}` : 'Mitt fotoalbum'}
                designId={savedDesignId}
                className="w-full"
                variant="outline"
              />
            }
          />
        </div>
      </div>
    </div>
  );
};

export default PhotoAlbumEditor;
