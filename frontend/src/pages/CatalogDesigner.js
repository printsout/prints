import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { useCart } from '../context/CartContext';
import api from '../services/api';
import {
  Plus, Trash2, ChevronLeft, ChevronRight, Upload, X, Image as ImageIcon,
  Type, ShoppingCart, BookOpen, Palette, Layers, GripVertical,
  FileText, Package, Star, ArrowLeft, Eye, Settings2, LayoutGrid
} from 'lucide-react';

/* ═══════════════════════════════════════════
   CONSTANTS
   ═══════════════════════════════════════════ */

const TEMPLATES = [
  { id: 'classic', name: 'Klassisk', desc: 'Ren layout med sidofält' },
  { id: 'modern', name: 'Modern', desc: 'Djärv med stora bilder' },
  { id: 'minimal', name: 'Minimal', desc: 'Enkel och luftig' },
];

const PAGE_COUNTS = [4, 8, 12];

const PAGE_TYPES = [
  { id: 'cover', name: 'Omslag', icon: BookOpen },
  { id: 'product', name: 'Produktsida', icon: Package },
  { id: 'gallery', name: 'Galleri', icon: LayoutGrid },
  { id: 'text', name: 'Textsida', icon: Type },
  { id: 'backcover', name: 'Baksida', icon: FileText },
];

const THEME_COLORS = [
  '#2a9d8f', '#264653', '#e76f51', '#e63946',
  '#457b9d', '#6d6875', '#1d3557', '#000000',
  '#f4a261', '#606c38', '#bc6c25', '#8338ec',
];

const FONTS = [
  { id: 'Inter', name: 'Inter' },
  { id: 'Georgia', name: 'Georgia' },
  { id: 'Playfair Display', name: 'Playfair Display' },
  { id: 'Montserrat', name: 'Montserrat' },
];

const PRICE_TIERS = [
  { min: 1, max: 9, pricePerUnit: 89 },
  { min: 10, max: 24, pricePerUnit: 69 },
  { min: 25, max: 49, pricePerUnit: 49 },
  { min: 50, max: Infinity, pricePerUnit: 39 },
];

function getPrice(qty) {
  const t = PRICE_TIERS.find(t => qty >= t.min && qty <= t.max);
  return t ? t.pricePerUnit : 89;
}

function makeCover(companyName) {
  return { type: 'cover', title: companyName || 'Företagsnamn', subtitle: 'Produktkatalog 2026', bgImage: null };
}
function makeProduct() {
  return { type: 'product', items: [{ image: null, name: '', desc: '', price: '' }] };
}
function makeGallery() {
  return { type: 'gallery', title: 'Galleri', images: [null, null, null, null], captions: ['', '', '', ''] };
}
function makeTextPage() {
  return { type: 'text', title: 'Om oss', body: '' };
}
function makeBackCover(companyName) {
  return { type: 'backcover', companyName: companyName || '', phone: '', email: '', website: '', address: '' };
}

function buildInitialPages(count, companyName) {
  const pages = [makeCover(companyName)];
  for (let i = 1; i < count - 1; i++) {
    pages.push(i % 3 === 0 ? makeGallery() : makeProduct());
  }
  pages.push(makeBackCover(companyName));
  return pages;
}

/* ═══════════════════════════════════════════
   PAGE PREVIEW (Live A4 preview per page)
   ═══════════════════════════════════════════ */

function PagePreview({ page, template, theme, companyLogo, scale = 1 }) {
  const font = theme.font || 'Inter';
  const color = theme.primaryColor || '#2a9d8f';
  const base = {
    width: 210 * scale, height: 297 * scale,
    fontFamily: font, fontSize: 10 * scale, color: '#1e293b',
    backgroundColor: '#fff', overflow: 'hidden', position: 'relative',
    border: '1px solid #e2e8f0', borderRadius: 4 * scale,
  };

  if (page.type === 'cover') {
    return (
      <div style={base} className="flex flex-col items-center justify-center text-center">
        {page.bgImage && <img src={page.bgImage} alt="" className="absolute inset-0 w-full h-full object-cover opacity-30" />}
        <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${color}15, ${color}05)` }} />
        <div className="relative z-10 flex flex-col items-center gap-2 px-4">
          {template === 'modern' && <div className="w-12 h-1 rounded-full mb-2" style={{ backgroundColor: color, width: 50 * scale }} />}
          {companyLogo && <img src={companyLogo} alt="Logo" style={{ height: 32 * scale }} className="object-contain mb-1" />}
          <h1 style={{ fontSize: 18 * scale, fontWeight: 700, color, lineHeight: 1.2 }}>{page.title || 'Företagsnamn'}</h1>
          <p style={{ fontSize: 10 * scale, color: '#64748b' }}>{page.subtitle || 'Produktkatalog'}</p>
          {template === 'classic' && <div className="w-8 h-0.5 rounded-full mt-2" style={{ backgroundColor: color, width: 32 * scale }} />}
        </div>
      </div>
    );
  }

  if (page.type === 'product') {
    const items = page.items || [];
    const cols = items.length <= 2 ? 1 : 2;
    return (
      <div style={base} className="flex flex-col">
        <div style={{ height: 6 * scale, backgroundColor: color }} />
        <div className="flex-1 p-2" style={{ padding: 8 * scale }}>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 6 * scale }}>
            {items.map((item, i) => (
              <div key={i} style={{ border: '1px solid #f1f5f9', borderRadius: 4 * scale, overflow: 'hidden' }}>
                <div style={{ height: 50 * scale, backgroundColor: '#f8fafc' }} className="flex items-center justify-center">
                  {item.image ? (
                    <img src={item.image} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon style={{ width: 16 * scale, height: 16 * scale }} className="text-slate-300" />
                  )}
                </div>
                <div style={{ padding: 4 * scale }}>
                  <p style={{ fontSize: 8 * scale, fontWeight: 600, color: '#1e293b' }}>{item.name || 'Produktnamn'}</p>
                  {item.desc && <p style={{ fontSize: 6 * scale, color: '#94a3b8', marginTop: 2 * scale }}>{item.desc}</p>}
                  {item.price && <p style={{ fontSize: 8 * scale, fontWeight: 700, color, marginTop: 2 * scale }}>{item.price} kr</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (page.type === 'gallery') {
    const imgs = page.images || [];
    return (
      <div style={base} className="flex flex-col">
        <div style={{ height: 6 * scale, backgroundColor: color }} />
        <div style={{ padding: 8 * scale }} className="flex-1">
          {page.title && <p style={{ fontSize: 12 * scale, fontWeight: 700, color, marginBottom: 6 * scale }}>{page.title}</p>}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 4 * scale, flex: 1 }}>
            {imgs.map((img, i) => (
              <div key={i} style={{ backgroundColor: '#f8fafc', borderRadius: 3 * scale, overflow: 'hidden', aspectRatio: '4/3' }} className="flex items-center justify-center">
                {img ? <img src={img} alt="" className="w-full h-full object-cover" /> : <ImageIcon style={{ width: 14 * scale, height: 14 * scale }} className="text-slate-300" />}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (page.type === 'text') {
    return (
      <div style={base} className="flex flex-col">
        <div style={{ height: 6 * scale, backgroundColor: color }} />
        <div style={{ padding: 10 * scale }} className="flex-1">
          <h2 style={{ fontSize: 14 * scale, fontWeight: 700, color, marginBottom: 6 * scale }}>{page.title || 'Rubrik'}</h2>
          <p style={{ fontSize: 7 * scale, lineHeight: 1.6, color: '#475569' }}>
            {page.body || 'Skriv din text här. Berätta om ert företag, era produkter eller era tjänster.'}
          </p>
        </div>
      </div>
    );
  }

  if (page.type === 'backcover') {
    return (
      <div style={base} className="flex flex-col items-center justify-center text-center">
        <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${color}10, ${color}05)` }} />
        <div className="relative z-10 flex flex-col items-center gap-1 px-4">
          {companyLogo && <img src={companyLogo} alt="Logo" style={{ height: 28 * scale }} className="object-contain mb-2" />}
          <p style={{ fontSize: 12 * scale, fontWeight: 700, color: '#1e293b' }}>{page.companyName || 'Företagsnamn'}</p>
          {page.phone && <p style={{ fontSize: 7 * scale, color: '#64748b' }}>{page.phone}</p>}
          {page.email && <p style={{ fontSize: 7 * scale, color }}>{page.email}</p>}
          {page.website && <p style={{ fontSize: 7 * scale, color: '#64748b' }}>{page.website}</p>}
          {page.address && <p style={{ fontSize: 7 * scale, color: '#94a3b8', marginTop: 4 * scale }}>{page.address}</p>}
        </div>
      </div>
    );
  }

  return <div style={base} className="flex items-center justify-center text-slate-300">Tom sida</div>;
}

/* ═══════════════════════════════════════════
   PRODUCT ITEM EDITOR (for product pages)
   ═══════════════════════════════════════════ */

function ProductItemEditor({ item, index, onChange, onRemove, onImageUpload }) {
  return (
    <div className="bg-slate-50 rounded-xl p-4 space-y-3" data-testid={`product-item-${index}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Produkt {index + 1}</span>
        <button type="button" onClick={onRemove} className="text-slate-400 hover:text-red-500 transition-colors">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
      {/* Image */}
      <div className="relative">
        {item.image ? (
          <div className="relative w-full h-28 rounded-lg overflow-hidden bg-slate-100">
            <img src={item.image} alt="" className="w-full h-full object-cover" />
            <button type="button" onClick={() => onChange({ ...item, image: null })}
              className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-red-500 transition-colors">
              <X className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <button type="button" onClick={onImageUpload}
            className="w-full h-28 rounded-lg border-2 border-dashed border-slate-300 hover:border-[#2a9d8f] flex flex-col items-center justify-center gap-1 transition-colors">
            <Upload className="w-5 h-5 text-slate-400" />
            <span className="text-xs text-slate-400">Ladda upp bild</span>
          </button>
        )}
      </div>
      <Input placeholder="Produktnamn" value={item.name} onChange={e => onChange({ ...item, name: e.target.value })} className="text-sm h-9" data-testid={`product-name-${index}`} />
      <Input placeholder="Kort beskrivning" value={item.desc} onChange={e => onChange({ ...item, desc: e.target.value })} className="text-sm h-9" />
      <Input placeholder="Pris (kr)" value={item.price} onChange={e => onChange({ ...item, price: e.target.value })} className="text-sm h-9" />
    </div>
  );
}

/* ═══════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════ */

const CatalogDesigner = () => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const fileInputRef = useRef(null);
  const logoInputRef = useRef(null);

  // Setup state
  const [step, setStep] = useState('setup'); // 'setup' | 'editor'
  const [template, setTemplate] = useState('classic');
  const [pageCount, setPageCount] = useState(8);
  const [companyName, setCompanyName] = useState('');
  const [companyLogo, setCompanyLogo] = useState(null);
  const [theme, setTheme] = useState({ primaryColor: '#2a9d8f', font: 'Inter' });

  // Editor state
  const [pages, setPages] = useState([]);
  const [activePage, setActivePage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  // Track which image upload is active (for product items / gallery)
  const [uploadTarget, setUploadTarget] = useState(null);

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
    const insertAt = pages.length - 1; // before back cover
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
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Bara bildfiler tillåtna'); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      if (uploadTarget) {
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
      }
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleLogoFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setCompanyLogo(reader.result);
    reader.readAsDataURL(file);
    if (logoInputRef.current) logoInputRef.current.value = '';
  };

  const triggerImageUpload = (pageIndex, type, itemIndex = 0) => {
    setUploadTarget({ pageIndex, type, itemIndex });
    fileInputRef.current?.click();
  };

  const uploadBase64 = async (dataUrl) => {
    const res = await api.post('/upload-base64', { image: dataUrl });
    return res.data.url;
  };

  const handleAddToCart = async () => {
    if (!companyName.trim()) { toast.error('Ange företagsnamn'); return; }
    setSubmitting(true);
    try {
      let logoUrl = null;
      if (companyLogo) {
        toast.info('Laddar upp logotyp...');
        logoUrl = await uploadBase64(companyLogo);
      }
      // Upload all images
      toast.info('Laddar upp bilder...');
      const uploadedPages = await Promise.all(pages.map(async (page) => {
        const p = { ...page };
        if (p.type === 'cover' && p.bgImage?.startsWith('data:')) {
          p.bgImage = await uploadBase64(p.bgImage);
        }
        if (p.type === 'product' && p.items) {
          p.items = await Promise.all(p.items.map(async (item) => {
            if (item.image?.startsWith('data:')) {
              return { ...item, image: await uploadBase64(item.image) };
            }
            return item;
          }));
        }
        if (p.type === 'gallery' && p.images) {
          p.images = await Promise.all(p.images.map(async (img) => {
            if (img?.startsWith('data:')) return await uploadBase64(img);
            return img;
          }));
        }
        return p;
      }));

      const unitPrice = getPrice(quantity);
      await addToCart({
        product_id: 'print-catalog-custom',
        name: `Katalogdesign: ${companyName}`,
        price: unitPrice,
        quantity,
        image: null,
        customization: {
          type: 'catalog_design',
          company_name: companyName,
          logo_url: logoUrl,
          template,
          theme,
          pages: uploadedPages,
          page_count: uploadedPages.length,
        },
      });
      toast.success('Katalog tillagd i varukorgen!');
      navigate('/varukorg');
    } catch {
      toast.error('Kunde inte lägga till i varukorgen');
    } finally {
      setSubmitting(false);
    }
  };

  const currentPage = pages[activePage];
  const totalPrice = quantity * getPrice(quantity);

  /* ───── SETUP SCREEN ───── */
  if (step === 'setup') {
    return (
      <div className="min-h-screen bg-[#faf9f6]" data-testid="catalog-designer-setup">
        <div className="max-w-3xl mx-auto px-4 py-12 sm:py-16">
          <button onClick={() => navigate('/foretag')} className="flex items-center gap-2 text-slate-500 hover:text-slate-700 mb-8 transition-colors" data-testid="back-to-business">
            <ArrowLeft className="w-4 h-4" /> Tillbaka till företagssidan
          </button>

          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 bg-[#2a9d8f]/10 text-[#2a9d8f] px-4 py-1.5 rounded-full text-sm font-semibold mb-4">
              <Layers className="w-4 h-4" /> Katalogdesigner
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-3">Designa din katalog</h1>
            <p className="text-slate-500 max-w-lg mx-auto">Skapa en professionell produktkatalog med vårt enkla verktyg. Välj mall, lägg till produkter och beställ tryck.</p>
          </div>

          <div className="space-y-8">
            {/* Company info */}
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
                  <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoFile} />
                </div>
              </div>
            </div>

            {/* Template */}
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
                      <PagePreview page={makeCover(companyName || 'Företag')} template={t.id} theme={theme} companyLogo={companyLogo} scale={0.2} />
                    </div>
                    <p className="text-sm font-semibold text-slate-900">{t.name}</p>
                    <p className="text-xs text-slate-500">{t.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Page count */}
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

            {/* Color & Font */}
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

            {/* Start button */}
            <Button onClick={startEditor} disabled={!companyName.trim()} className="w-full h-14 text-lg font-semibold bg-[#2a9d8f] hover:bg-[#238b7e]" data-testid="start-editor-btn">
              <Palette className="w-5 h-5 mr-2" /> Starta designverktyget
            </Button>
          </div>
        </div>
      </div>
    );
  }

  /* ───── EDITOR SCREEN ───── */
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
          <span className="text-sm text-slate-500">{quantity} ex &times; {getPrice(quantity)} kr</span>
          <span className="text-lg font-bold text-[#2a9d8f]">{totalPrice} kr</span>
          <Button onClick={handleAddToCart} disabled={submitting} className="bg-[#2a9d8f] hover:bg-[#238b7e] h-10 px-5" data-testid="add-to-cart-btn">
            {submitting ? 'Sparar...' : <><ShoppingCart className="w-4 h-4 mr-1.5" />Lägg i varukorgen</>}
          </Button>
        </div>
      </div>

      {/* Main editor area */}
      <div className="flex-1 flex overflow-hidden">

        {/* Left sidebar: Page thumbnails */}
        <div className="w-44 bg-white border-r border-slate-200 flex flex-col shrink-0">
          <div className="p-3 border-b border-slate-100 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Sidor</span>
            <span className="text-xs text-slate-400">{activePage + 1}/{pages.length}</span>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-2" data-testid="page-thumbnails">
            {pages.map((page, i) => (
              <button key={i} type="button" onClick={() => setActivePage(i)}
                className={`w-full rounded-lg overflow-hidden border-2 transition-all group relative ${activePage === i ? 'border-[#2a9d8f] shadow-md' : 'border-transparent hover:border-slate-300'}`}
                data-testid={`page-thumb-${i}`}>
                <div className="pointer-events-none">
                  <PagePreview page={page} template={template} theme={theme} companyLogo={companyLogo} scale={0.55} />
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent py-1 px-2">
                  <span className="text-[10px] text-white font-medium">{i + 1}. {PAGE_TYPES.find(t => t.id === page.type)?.name || page.type}</span>
                </div>
              </button>
            ))}
          </div>
          {/* Add page */}
          <div className="p-2 border-t border-slate-100 space-y-1">
            <p className="text-[10px] text-slate-400 font-medium px-1">Lägg till sida:</p>
            <div className="grid grid-cols-2 gap-1">
              {PAGE_TYPES.filter(t => t.id !== 'cover' && t.id !== 'backcover').map(t => (
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

        {/* Right sidebar: Editor controls */}
        <div className="w-80 bg-white border-l border-slate-200 flex flex-col shrink-0 overflow-y-auto">
          <div className="p-4 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings2 className="w-4 h-4 text-slate-400" />
                <h3 className="font-semibold text-slate-900 text-sm">
                  {PAGE_TYPES.find(t => t.id === currentPage?.type)?.name || 'Sida'} — Sida {activePage + 1}
                </h3>
              </div>
              {activePage > 0 && activePage < pages.length - 1 && (
                <button type="button" onClick={() => removePage(activePage)}
                  className="text-xs text-red-500 hover:text-red-600 font-medium" data-testid="remove-page-btn">
                  Ta bort
                </button>
              )}
            </div>
            {/* Page type changer (not for cover/backcover) */}
            {activePage > 0 && activePage < pages.length - 1 && (
              <div className="flex gap-1 mt-3">
                {PAGE_TYPES.filter(t => t.id !== 'cover' && t.id !== 'backcover').map(t => (
                  <button key={t.id} type="button"
                    onClick={() => {
                      const makers = { product: makeProduct, gallery: makeGallery, text: makeTextPage };
                      if (currentPage?.type !== t.id) updatePage(activePage, makers[t.id]());
                    }}
                    className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-all ${currentPage?.type === t.id ? 'bg-[#2a9d8f]/10 text-[#2a9d8f]' : 'text-slate-500 hover:bg-slate-50'}`}
                    data-testid={`change-type-${t.id}`}>
                    {t.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex-1 p-4 space-y-4" data-testid="page-editor-controls">
            {/* Cover editor */}
            {currentPage?.type === 'cover' && (
              <>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Titel</label>
                  <Input value={currentPage.title} onChange={e => updatePage(activePage, { title: e.target.value })} className="h-9 text-sm" data-testid="cover-title" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Undertitel</label>
                  <Input value={currentPage.subtitle} onChange={e => updatePage(activePage, { subtitle: e.target.value })} className="h-9 text-sm" data-testid="cover-subtitle" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Bakgrundsbild (valfritt)</label>
                  {currentPage.bgImage ? (
                    <div className="relative h-24 rounded-lg overflow-hidden">
                      <img src={currentPage.bgImage} alt="" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => updatePage(activePage, { bgImage: null })}
                        className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/50 text-white flex items-center justify-center"><X className="w-3 h-3" /></button>
                    </div>
                  ) : (
                    <button type="button" onClick={() => triggerImageUpload(activePage, 'cover')}
                      className="w-full h-24 rounded-lg border-2 border-dashed border-slate-300 hover:border-[#2a9d8f] flex items-center justify-center gap-2 text-sm text-slate-500 transition-colors" data-testid="cover-bg-upload">
                      <Upload className="w-4 h-4" /> Ladda upp
                    </button>
                  )}
                </div>
              </>
            )}

            {/* Product page editor */}
            {currentPage?.type === 'product' && (
              <>
                {(currentPage.items || []).map((item, i) => (
                  <ProductItemEditor
                    key={i} item={item} index={i}
                    onChange={(updated) => {
                      const items = [...(currentPage.items || [])];
                      items[i] = updated;
                      updatePage(activePage, { items });
                    }}
                    onRemove={() => {
                      if ((currentPage.items || []).length <= 1) { toast.error('Minst en produkt per sida'); return; }
                      updatePage(activePage, { items: currentPage.items.filter((_, j) => j !== i) });
                    }}
                    onImageUpload={() => triggerImageUpload(activePage, 'product', i)}
                  />
                ))}
                {(currentPage.items || []).length < 6 && (
                  <button type="button"
                    onClick={() => updatePage(activePage, { items: [...(currentPage.items || []), { image: null, name: '', desc: '', price: '' }] })}
                    className="w-full py-2.5 rounded-xl border-2 border-dashed border-slate-300 hover:border-[#2a9d8f] text-sm font-medium text-slate-500 hover:text-[#2a9d8f] flex items-center justify-center gap-1.5 transition-colors"
                    data-testid="add-product-btn">
                    <Plus className="w-4 h-4" /> Lägg till produkt
                  </button>
                )}
              </>
            )}

            {/* Gallery editor */}
            {currentPage?.type === 'gallery' && (
              <>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Rubrik</label>
                  <Input value={currentPage.title || ''} onChange={e => updatePage(activePage, { title: e.target.value })} className="h-9 text-sm" data-testid="gallery-title" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {(currentPage.images || []).map((img, i) => (
                    <div key={i}>
                      {img ? (
                        <div className="relative h-24 rounded-lg overflow-hidden">
                          <img src={img} alt="" className="w-full h-full object-cover" />
                          <button type="button" onClick={() => {
                            const images = [...(currentPage.images || [])];
                            images[i] = null;
                            updatePage(activePage, { images });
                          }} className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/50 text-white flex items-center justify-center">
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <button type="button" onClick={() => triggerImageUpload(activePage, 'gallery', i)}
                          className="w-full h-24 rounded-lg border-2 border-dashed border-slate-300 hover:border-[#2a9d8f] flex flex-col items-center justify-center gap-1 transition-colors"
                          data-testid={`gallery-img-${i}`}>
                          <ImageIcon className="w-4 h-4 text-slate-400" />
                          <span className="text-[10px] text-slate-400">Bild {i + 1}</span>
                        </button>
                      )}
                      <Input placeholder={`Text ${i + 1}`} value={(currentPage.captions || [])[i] || ''}
                        onChange={e => {
                          const captions = [...(currentPage.captions || [])];
                          captions[i] = e.target.value;
                          updatePage(activePage, { captions });
                        }}
                        className="h-7 text-xs mt-1" />
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Text page editor */}
            {currentPage?.type === 'text' && (
              <>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Rubrik</label>
                  <Input value={currentPage.title || ''} onChange={e => updatePage(activePage, { title: e.target.value })} className="h-9 text-sm" data-testid="text-title" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Brödtext</label>
                  <textarea value={currentPage.body || ''} onChange={e => updatePage(activePage, { body: e.target.value })}
                    rows={8} className="w-full rounded-lg border border-slate-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2a9d8f]/50 resize-none" data-testid="text-body"
                    placeholder="Skriv din text här..." />
                </div>
              </>
            )}

            {/* Back cover editor */}
            {currentPage?.type === 'backcover' && (
              <div className="space-y-3">
                {[
                  { key: 'companyName', label: 'Företagsnamn', placeholder: 'Företagsnamn AB' },
                  { key: 'phone', label: 'Telefon', placeholder: '08-123 45 67' },
                  { key: 'email', label: 'E-post', placeholder: 'info@foretag.se' },
                  { key: 'website', label: 'Webbplats', placeholder: 'www.foretag.se' },
                  { key: 'address', label: 'Adress', placeholder: 'Storgatan 1, 111 22 Stockholm' },
                ].map(f => (
                  <div key={f.key}>
                    <label className="block text-xs font-medium text-slate-500 mb-1">{f.label}</label>
                    <Input value={currentPage[f.key] || ''} onChange={e => updatePage(activePage, { [f.key]: e.target.value })} placeholder={f.placeholder} className="h-9 text-sm" data-testid={`back-${f.key}`} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quantity & Price at bottom of sidebar */}
          <div className="p-4 border-t border-slate-100 space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Antal exemplar</label>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50" data-testid="qty-minus">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <Input type="number" min={1} value={quantity} onChange={e => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-16 text-center font-semibold h-8 text-sm" data-testid="qty-input" />
                <button type="button" onClick={() => setQuantity(q => q + 1)}
                  className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50" data-testid="qty-plus">
                  <ChevronRight className="w-4 h-4" />
                </button>
                <span className="text-xs text-slate-400 ml-1">ex</span>
              </div>
            </div>
            <div className="bg-slate-50 rounded-xl p-3">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-600">{quantity} ex &times; {getPrice(quantity)} kr/ex</span>
                <span className="font-bold text-slate-900" data-testid="total-price">{totalPrice} kr</span>
              </div>
              <p className="text-xs text-slate-400">
                {quantity < 10 && 'Beställ 10+ för 69 kr/ex'}
                {quantity >= 10 && quantity < 25 && 'Beställ 25+ för 49 kr/ex'}
                {quantity >= 25 && quantity < 50 && 'Beställ 50+ för 39 kr/ex'}
                {quantity >= 50 && 'Bästa priset!'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CatalogDesigner;
