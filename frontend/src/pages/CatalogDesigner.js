import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { useCart } from '../context/CartContext';
import api from '../services/api';
import {
  Upload, ChevronLeft, ChevronRight,
  ShoppingCart, Palette, Layers,
  ArrowLeft, Settings2
} from 'lucide-react';

import {
  TEMPLATES, PAGE_COUNTS, PAGE_TYPES, THEME_COLORS, FONTS,
  getPrice, makeCover, makeProduct, makeGallery, makeTextPage, makeBackCover,
  buildInitialPages, nextItemId
} from './catalog/catalogConstants';
import { PagePreview } from './catalog/PagePreview';
import { PageEditor } from './catalog/PageEditor';

/* ═══════════════════════════════════════════
   SETUP SCREEN
   ═══════════════════════════════════════════ */

const SetupScreen = ({ companyName, setCompanyName, companyLogo, setCompanyLogo, template, setTemplate, pageCount, setPageCount, theme, setTheme, logoInputRef, onStart }) => (
  <div className="min-h-screen bg-[#faf9f6]" data-testid="catalog-designer-setup">
    <div className="max-w-3xl mx-auto px-4 py-12 sm:py-16">
      <SetupBackButton />
      <SetupHeader />
      <div className="space-y-8">
        <CompanyInfoCard companyName={companyName} setCompanyName={setCompanyName} companyLogo={companyLogo} setCompanyLogo={setCompanyLogo} logoInputRef={logoInputRef} />
        <TemplateCard template={template} setTemplate={setTemplate} theme={theme} companyName={companyName} companyLogo={companyLogo} />
        <PageCountCard pageCount={pageCount} setPageCount={setPageCount} />
        <ThemeCard theme={theme} setTheme={setTheme} />
        <Button onClick={onStart} disabled={!companyName.trim()} className="w-full h-14 text-lg font-semibold bg-[#2a9d8f] hover:bg-[#238b7e]" data-testid="start-editor-btn">
          <Palette className="w-5 h-5 mr-2" /> Starta designverktyget
        </Button>
      </div>
    </div>
  </div>
);

const SetupBackButton = () => {
  const navigate = useNavigate();
  return (
    <button onClick={() => navigate('/foretag')} className="flex items-center gap-2 text-slate-500 hover:text-slate-700 mb-8 transition-colors" data-testid="back-to-business">
      <ArrowLeft className="w-4 h-4" /> Tillbaka till företagssidan
    </button>
  );
};

const SetupHeader = () => (
  <div className="text-center mb-10">
    <div className="inline-flex items-center gap-2 bg-[#2a9d8f]/10 text-[#2a9d8f] px-4 py-1.5 rounded-full text-sm font-semibold mb-4">
      <Layers className="w-4 h-4" /> Katalogdesigner
    </div>
    <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-3">Designa din katalog</h1>
    <p className="text-slate-500 max-w-lg mx-auto">Skapa en professionell produktkatalog med vårt enkla verktyg.</p>
  </div>
);

const CompanyInfoCard = ({ companyName, setCompanyName, companyLogo, setCompanyLogo, logoInputRef }) => (
  <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8">
    <div className="flex items-center gap-3 mb-5">
      <span className="w-8 h-8 rounded-full bg-[#2a9d8f] text-white text-sm font-bold flex items-center justify-center">1</span>
      <h2 className="text-lg font-bold text-slate-900">Företagsuppgifter</h2>
    </div>
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-600 mb-1">Företagsnamn *</label>
        <Input value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Ditt företagsnamn" className="h-11" data-testid="company-name-input" />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-600 mb-1">Logotyp (valfritt)</label>
        {companyLogo ? (
          <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl">
            <img src={companyLogo} alt="Logo" className="h-12 object-contain" />
            <button type="button" onClick={() => setCompanyLogo(null)} className="text-sm text-red-500 hover:underline">Ta bort</button>
          </div>
        ) : (
          <button type="button" onClick={() => logoInputRef.current?.click()}
            className="w-full h-20 rounded-xl border-2 border-dashed border-slate-300 hover:border-[#2a9d8f] flex items-center justify-center gap-2 text-sm text-slate-500 transition-colors" data-testid="logo-upload-btn">
            <Upload className="w-4 h-4" /> Ladda upp logotyp
          </button>
        )}
        <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={e => {
          const file = e.target.files?.[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = () => setCompanyLogo(reader.result);
          reader.readAsDataURL(file);
          if (logoInputRef.current) logoInputRef.current.value = '';
        }} />
      </div>
    </div>
  </div>
);

const TemplateCard = ({ template, setTemplate, theme, companyName, companyLogo }) => (
  <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8">
    <div className="flex items-center gap-3 mb-5">
      <span className="w-8 h-8 rounded-full bg-[#2a9d8f] text-white text-sm font-bold flex items-center justify-center">2</span>
      <h2 className="text-lg font-bold text-slate-900">Välj mall</h2>
    </div>
    <div className="grid grid-cols-3 gap-4" data-testid="template-grid">
      {TEMPLATES.map(t => (
        <button key={t.id} type="button" onClick={() => setTemplate(t.id)}
          className={`p-4 rounded-xl border-2 text-center transition-all ${template === t.id ? 'border-[#2a9d8f] bg-[#2a9d8f]/5' : 'border-slate-200 hover:border-slate-300'}`}
          data-testid={`template-${t.id}`}>
          <div className={`w-12 h-16 mx-auto mb-3 rounded border ${template === t.id ? 'border-[#2a9d8f]' : 'border-slate-200'} overflow-hidden`}>
            <PagePreview page={{ id: 'preview', type: 'cover', title: companyName || 'Företag', subtitle: 'Katalog' }} template={t.id} theme={theme} companyLogo={companyLogo} scale={0.2} />
          </div>
          <p className="text-sm font-semibold text-slate-900">{t.name}</p>
          <p className="text-xs text-slate-500">{t.desc}</p>
        </button>
      ))}
    </div>
  </div>
);

const PageCountCard = ({ pageCount, setPageCount }) => (
  <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8">
    <div className="flex items-center gap-3 mb-5">
      <span className="w-8 h-8 rounded-full bg-[#2a9d8f] text-white text-sm font-bold flex items-center justify-center">3</span>
      <h2 className="text-lg font-bold text-slate-900">Antal sidor</h2>
    </div>
    <div className="flex gap-3" data-testid="page-count-selector">
      {PAGE_COUNTS.map(c => (
        <button key={c} type="button" onClick={() => setPageCount(c)}
          className={`flex-1 py-3 rounded-xl border-2 text-center font-semibold transition-all ${pageCount === c ? 'border-[#2a9d8f] bg-[#2a9d8f]/5 text-[#2a9d8f]' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}
          data-testid={`page-count-${c}`}>
          {c} sidor
        </button>
      ))}
    </div>
    <p className="text-xs text-slate-400 mt-2">Du kan lägga till fler sidor i editorn</p>
  </div>
);

const ThemeCard = ({ theme, setTheme }) => (
  <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8">
    <div className="flex items-center gap-3 mb-5">
      <span className="w-8 h-8 rounded-full bg-[#2a9d8f] text-white text-sm font-bold flex items-center justify-center">4</span>
      <h2 className="text-lg font-bold text-slate-900">Färg & typsnitt</h2>
    </div>
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-600 mb-2">Primärfärg</label>
        <div className="flex flex-wrap gap-2" data-testid="color-picker">
          {THEME_COLORS.map(c => (
            <button key={c} type="button" onClick={() => setTheme(t => ({ ...t, primaryColor: c }))}
              className={`w-9 h-9 rounded-full border-2 transition-all ${theme.primaryColor === c ? 'border-slate-900 scale-110' : 'border-transparent hover:scale-105'}`}
              style={{ backgroundColor: c }} data-testid={`color-${c}`} />
          ))}
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-600 mb-2">Typsnitt</label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2" data-testid="font-picker">
          {FONTS.map(f => (
            <button key={f.id} type="button" onClick={() => setTheme(t => ({ ...t, font: f.id }))}
              className={`py-2 px-3 rounded-lg border-2 text-sm transition-all ${theme.font === f.id ? 'border-[#2a9d8f] bg-[#2a9d8f]/5 font-semibold' : 'border-slate-200 hover:border-slate-300'}`}
              style={{ fontFamily: f.id }} data-testid={`font-${f.id}`}>
              {f.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  </div>
);

/* ═══════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════ */

const CatalogDesigner = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editCartItemId = searchParams.get('edit');
  const adminEditOrderId = searchParams.get('admin_edit');
  const { addToCart, updateCartItem, cart } = useCart();
  const fileInputRef = useRef(null);
  const logoInputRef = useRef(null);

  const [step, setStep] = useState('setup');
  const [template, setTemplate] = useState('classic');
  const [pageCount, setPageCount] = useState(8);
  const [companyName, setCompanyName] = useState('');
  const [companyLogo, setCompanyLogo] = useState(null);
  const [theme, setTheme] = useState({ primaryColor: '#2a9d8f', font: 'Inter' });

  const [pages, setPages] = useState([]);
  const [activePage, setActivePage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [uploadTarget, setUploadTarget] = useState(null);

  const isAdminMode = !!adminEditOrderId;

  // Hydrate from admin order
  useEffect(() => {
    if (!adminEditOrderId) return;
    const token = localStorage.getItem('admin_token');
    if (!token) { toast.error('Admin-inloggning krävs'); return; }
    api.get(`/admin/orders/${adminEditOrderId}/catalog-design`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => {
      const c = res.data;
      setCompanyName(c.company_name || '');
      setCompanyLogo(c.logo_url || null);
      setTemplate(c.template || 'classic');
      setTheme(c.theme || { primaryColor: '#2a9d8f', font: 'Inter' });
      if (c.pages?.length) {
        setPages(c.pages);
        setPageCount(c.pages.length);
        setActivePage(0);
        setStep('editor');
      }
    }).catch(() => toast.error('Kunde inte hämta katalogdesign'));
  }, [adminEditOrderId]);

  // Hydrate state from cart item when editing
  useEffect(() => {
    if (!editCartItemId || !cart.items?.length) return;
    const cartItem = cart.items.find(i => i.cart_item_id === editCartItemId);
    if (!cartItem?.customization || cartItem.customization.type !== 'catalog_design') return;

    const c = cartItem.customization;
    setCompanyName(c.company_name || '');
    setCompanyLogo(c.logo_url || null);
    setTemplate(c.template || 'classic');
    setTheme(c.theme || { primaryColor: '#2a9d8f', font: 'Inter' });
    setQuantity(cartItem.quantity || 1);

    if (c.pages?.length) {
      setPages(c.pages);
      setPageCount(c.pages.length);
      setActivePage(0);
      setStep('editor');
    }
  }, [editCartItemId, cart.items]);

  const contentPageTypes = useMemo(() => PAGE_TYPES.filter(t => t.id !== 'cover' && t.id !== 'backcover'), []);

  const startEditor = () => {
    setPages(buildInitialPages(pageCount, companyName));
    setActivePage(0);
    setStep('editor');
  };

  const updatePage = useCallback((index, newData) => {
    setPages(prev => prev.map((p, i) => i === index ? { ...p, ...newData } : p));
  }, []);

  const addPage = (type = 'product') => {
    const makers = { product: makeProduct, gallery: makeGallery, text: makeTextPage, cover: () => makeCover(companyName), backcover: () => makeBackCover(companyName) };
    const newPage = (makers[type] || makeProduct)();
    const insertAt = pages.length - 1;
    setPages(prev => [...prev.slice(0, insertAt), newPage, ...prev.slice(insertAt)]);
    setActivePage(insertAt);
  };

  const removePage = (index) => {
    if (pages.length <= 2) { toast.error('Minst 2 sidor krävs'); return; }
    if (index === 0 || index === pages.length - 1) { toast.error('Kan inte ta bort omslag/baksida'); return; }
    setPages(prev => prev.filter((_, i) => i !== index));
    setActivePage(Math.min(index, pages.length - 2));
  };

  const handleImageFile = (e) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      if (!uploadTarget) return;
      const { pageIndex, type, itemIndex } = uploadTarget;
      if (type === 'product') {
        setPages(prev => prev.map((p, i) => {
          if (i !== pageIndex) return p;
          const items = [...(p.items || [])];
          items[itemIndex] = { ...items[itemIndex], image: dataUrl };
          return { ...p, items };
        }));
      } else if (type === 'gallery') {
        setPages(prev => prev.map((p, i) => {
          if (i !== pageIndex) return p;
          const images = [...(p.images || [])];
          images[itemIndex] = dataUrl;
          return { ...p, images };
        }));
      } else if (type === 'cover') {
        updatePage(pageIndex, { bgImage: dataUrl });
      }
      setUploadTarget(null);
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const triggerImageUpload = (pageIndex, type, itemIndex = 0) => {
    setUploadTarget({ pageIndex, type, itemIndex });
    fileInputRef.current?.click();
  };

  const handleAddToCart = async () => {
    if (!companyName.trim()) { toast.error('Ange företagsnamn'); return; }
    setSubmitting(true);
    try {
      const uploadBase64 = async (dataUrl) => {
        const res = await api.post('/upload-base64', { image: dataUrl });
        return res.data.url;
      };
      let logoUrl = companyLogo?.startsWith('data:') ? await uploadBase64(companyLogo) : companyLogo;
      const uploadedPages = await Promise.all(pages.map(async (page) => {
        const p = { ...page };
        if (p.bgImage?.startsWith('data:')) p.bgImage = await uploadBase64(p.bgImage);
        if (p.items) p.items = await Promise.all(p.items.map(async (item) => item.image?.startsWith('data:') ? { ...item, image: await uploadBase64(item.image) } : item));
        if (p.images) p.images = await Promise.all(p.images.map(async (img) => img?.startsWith('data:') ? await uploadBase64(img) : img));
        return p;
      }));

      if (isAdminMode) {
        const token = localStorage.getItem('admin_token');
        await api.put(`/admin/orders/${adminEditOrderId}/catalog-design`, {
          company_name: companyName, logo_url: logoUrl, template, theme,
          pages: uploadedPages, page_count: uploadedPages.length,
        }, { headers: { Authorization: `Bearer ${token}` } });
        toast.success('Katalogdesignen sparad!');
        window.close();
        return;
      }

      const unitPrice = getPrice(quantity);
      const itemData = {
        product_id: 'print-catalog-custom',
        name: `Katalogdesign: ${companyName}`,
        price: unitPrice,
        quantity,
        image: null,
        customization: { type: 'catalog_design', company_name: companyName, logo_url: logoUrl, template, theme, pages: uploadedPages, page_count: uploadedPages.length },
      };

      if (editCartItemId) {
        await updateCartItem(editCartItemId, itemData);
        toast.success('Katalogdesignen uppdaterad!');
      } else {
        await addToCart(itemData);
        toast.success('Katalog tillagd i varukorgen!');
      }
      navigate('/varukorg');
    } catch {
      toast.error('Kunde inte spara katalogdesignen');
    } finally {
      setSubmitting(false);
    }
  };

  const currentPage = pages[activePage];
  const totalPrice = quantity * getPrice(quantity);

  if (step === 'setup') {
    return <SetupScreen companyName={companyName} setCompanyName={setCompanyName} companyLogo={companyLogo} setCompanyLogo={setCompanyLogo}
      template={template} setTemplate={setTemplate} pageCount={pageCount} setPageCount={setPageCount} theme={theme} setTheme={setTheme}
      logoInputRef={logoInputRef} onStart={startEditor} />;
  }

  return (
    <div className="h-screen flex flex-col bg-slate-100" data-testid="catalog-designer-editor">
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageFile} />

      {/* Top bar */}
      <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={() => setStep('setup')} className="flex items-center gap-1.5 text-slate-500 hover:text-slate-700 text-sm transition-colors" data-testid="back-to-setup">
            <ArrowLeft className="w-4 h-4" /> Inställningar
          </button>
          <div className="h-5 w-px bg-slate-200" />
          <h1 className="font-semibold text-slate-900">{companyName}</h1>
          <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{pages.length} sidor</span>
        </div>
        <div className="flex items-center gap-3">
          {!isAdminMode && <span className="text-sm text-slate-500">{quantity} ex &times; {getPrice(quantity)} kr</span>}
          {!isAdminMode && <span className="text-lg font-bold text-[#2a9d8f]">{totalPrice} kr</span>}
          {isAdminMode && <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full font-semibold">Admin-redigering</span>}
          <Button onClick={handleAddToCart} disabled={submitting} className={`h-10 px-5 ${isAdminMode ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-[#2a9d8f] hover:bg-[#238b7e]'}`} data-testid="add-to-cart-btn">
            {submitting ? 'Sparar...' : <><ShoppingCart className="w-4 h-4 mr-1.5" />{isAdminMode ? 'Spara design' : editCartItemId ? 'Spara ändringar' : 'Lägg i varukorgen'}</>}
          </Button>
        </div>
      </div>

      {/* Main editor area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Page thumbnails */}
        <div className="w-44 bg-white border-r border-slate-200 flex flex-col shrink-0">
          <div className="p-3 border-b border-slate-100 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Sidor</span>
            <span className="text-xs text-slate-400">{activePage + 1}/{pages.length}</span>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-2" data-testid="page-thumbnails">
            {pages.map((page, i) => (
              <button key={page.id} type="button" onClick={() => setActivePage(i)}
                className={`w-full rounded-lg overflow-hidden border-2 transition-all group relative ${activePage === i ? 'border-[#2a9d8f] shadow-md' : 'border-transparent hover:border-slate-300'}`}
                data-testid={`page-thumb-${i}`}>
                <div className="pointer-events-none">
                  <PagePreview page={page} template={template} theme={theme} companyLogo={companyLogo} scale={0.55} />
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent py-1 px-2">
                  <span className="text-[10px] text-white font-medium">{i + 1}. {PAGE_TYPES.find(t => t.id === page.type)?.name}</span>
                </div>
              </button>
            ))}
          </div>
          <div className="p-2 border-t border-slate-100 space-y-1">
            <p className="text-[10px] text-slate-400 font-medium px-1">Lägg till sida:</p>
            <div className="grid grid-cols-2 gap-1">
              {contentPageTypes.map(t => (
                <button key={t.id} type="button" onClick={() => addPage(t.id)}
                  className="flex items-center gap-1 px-2 py-1.5 rounded-md text-[10px] font-medium text-slate-600 hover:bg-[#2a9d8f]/10 hover:text-[#2a9d8f] transition-colors"
                  data-testid={`add-page-${t.id}`}>
                  <t.icon className="w-3 h-3" /> {t.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Center: Preview */}
        <div className="flex-1 flex items-center justify-center p-8 overflow-auto bg-slate-100">
          <div className="shadow-2xl rounded-lg overflow-hidden" data-testid="page-preview-main">
            <PagePreview page={currentPage} template={template} theme={theme} companyLogo={companyLogo} scale={1.8} />
          </div>
        </div>

        {/* Right: Editor panel */}
        <PageEditor currentPage={currentPage} activePage={activePage} pages={pages}
          updatePage={updatePage} removePage={removePage} triggerImageUpload={triggerImageUpload}
          contentPageTypes={contentPageTypes} />
      </div>

      {/* Bottom quantity bar (fixed) */}
      <div className="bg-white border-t border-slate-200 px-4 py-3 flex items-center justify-end gap-4 shrink-0">
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Antal:</label>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setQuantity(q => Math.max(1, q - 1))} className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50" data-testid="qty-minus"><ChevronLeft className="w-4 h-4" /></button>
          <Input type="number" min={1} value={quantity} onChange={e => setQuantity(Math.max(1, parseInt(e.target.value) || 1))} className="w-16 text-center font-semibold h-8 text-sm" data-testid="qty-input" />
          <button type="button" onClick={() => setQuantity(q => q + 1)} className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50" data-testid="qty-plus"><ChevronRight className="w-4 h-4" /></button>
        </div>
        <div className="bg-slate-50 rounded-xl px-4 py-2">
          <span className="text-sm text-slate-600">{quantity} ex &times; {getPrice(quantity)} kr/ex = </span>
          <span className="font-bold text-slate-900" data-testid="total-price">{totalPrice} kr</span>
        </div>
      </div>
    </div>
  );
};

export default CatalogDesigner;
