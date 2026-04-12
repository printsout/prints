import { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { useCart } from '../context/CartContext';
import api from '../services/api';
import BusinessCardEditor from './BusinessCardEditor';
import {
  Building2, Check, Printer, X,
  FileText, Upload, Package, Clock, ShieldCheck, Minus, Plus,
  BookOpen, FileDown, CreditCard, ShoppingCart, Palette
} from 'lucide-react';

/* ───── Tab 1: "Vår produktkatalog" constants ───── */
const CATALOG_TYPES = [
  {
    id: 'physical', title: 'Fysisk katalog', subtitle: 'Tryckt broschyr',
    description: 'En professionellt tryckt produktkatalog i A4-format med alla våra produkter, priser och anpassningsmöjligheter.',
    features: ['Högkvalitativt tryck', 'A4-format, 24 sidor', 'Produktbilder & priser', 'Levereras inom 5-7 arbetsdagar'],
    price: 'Gratis', priceNote: '(max 5 st per företag)', Icon: BookOpen, color: '#2a9d8f',
  },
  {
    id: 'digital', title: 'Digital katalog', subtitle: 'PDF via e-post',
    description: 'En digital PDF-katalog som skickas direkt till din e-post. Enkel att dela vidare till kollegor och kunder.',
    features: ['Skickas inom 24h', 'Interaktiv PDF med länkar', 'Enkel att vidarebefordra', 'Alltid senaste versionen'],
    price: 'Gratis', priceNote: '', Icon: FileDown, color: '#e76f51',
  },
];

/* ───── Tab 2: Print service types ───── */
const PRINT_SERVICES = [
  { id: 'catalog', title: 'Katalog', desc: 'Designa eller ladda upp PDF-katalog', Icon: BookOpen },
  { id: 'businesscard', title: 'Visitkort', desc: 'Designa eller ladda upp visitkort', Icon: CreditCard },
];

/* ───── Business card pricing tiers ───── */
const CARD_PRICE_TIERS = [
  { min: 1, max: 49, pricePerCard: 5.90 },
  { min: 50, max: 99, pricePerCard: 3.90 },
  { min: 100, max: 249, pricePerCard: 2.50 },
  { min: 250, max: 499, pricePerCard: 1.90 },
  { min: 500, max: Infinity, pricePerCard: 1.20 },
];

function getCardPrice(quantity) {
  const tier = CARD_PRICE_TIERS.find(t => quantity >= t.min && quantity <= t.max);
  return tier ? tier.pricePerCard : CARD_PRICE_TIERS[0].pricePerCard;
}

/* ───── Catalog printing pricing ───── */
const CATALOG_PRICE_TIERS = [
  { min: 1, max: 9, pricePerUnit: 89 },
  { min: 10, max: 24, pricePerUnit: 69 },
  { min: 25, max: 49, pricePerUnit: 49 },
  { min: 50, max: Infinity, pricePerUnit: 39 },
]

function getCatalogPrice(quantity) {
  const tier = CATALOG_PRICE_TIERS.find(t => quantity >= t.min && quantity <= t.max);
  return tier ? tier.pricePerUnit : CATALOG_PRICE_TIERS[0].pricePerUnit;
}

/* ───── Shared form fields ───── */
/* ───── Main page ───── */
const BusinessCatalog = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editCartItemId = searchParams.get('edit');
  const { addToCart, updateCartItem, cart } = useCart();
  const [activeTab, setActiveTab] = useState('our');
  const [submitting, setSubmitting] = useState(false);

  // Tab 1
  const [selectedCatalogType, setSelectedCatalogType] = useState(null);

  // Tab 2 - print service type
  const [printService, setPrintService] = useState('catalog');
  // Tab 2 - catalog
  const [catalogSource, setCatalogSource] = useState('upload'); // 'upload' | 'design'
  const [pdfFile, setPdfFile] = useState(null);
  const fileInputRef = useRef(null);
  // Tab 2 - businesscard
  const [cardSource, setCardSource] = useState('editor');
  const [cardPdfFile, setCardPdfFile] = useState(null);
  const cardPdfInputRef = useRef(null);
  const [card, setCard] = useState({ name: '', title: '', company: '', phone: '', email: '', website: '', address: '' });
  const [logo, setLogo] = useState(null);
  const [cardTemplate, setCardTemplate] = useState('classic');
  const [cardColor, setCardColor] = useState('#2a9d8f');

  // Shared
  const [quantity, setQuantity] = useState(1);

  // Hydrate from cart item in edit mode
  useEffect(() => {
    if (!editCartItemId || !cart.items?.length) return;
    const cartItem = cart.items.find(i => i.cart_item_id === editCartItemId);
    if (!cartItem?.customization || cartItem.customization.type !== 'businesscard') return;

    const c = cartItem.customization;
    setActiveTab('print');
    setPrintService('businesscard');
    setCardSource(c.source || 'editor');
    if (c.card_details) setCard(c.card_details);
    if (c.template) setCardTemplate(c.template);
    if (c.color) setCardColor(c.color);
    if (c.logo_url) setLogo(c.logo_url);
    setQuantity(cartItem.quantity || 1);
  }, [editCartItemId, cart.items]);

  /* Helper: upload a file (PDF/image) and get server URL */
  const uploadFile = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post('/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
    return res.data.url;
  };

  const uploadBase64 = async (dataUrl) => {
    const res = await api.post('/upload-base64', { image: dataUrl });
    return res.data.url;
  };

  /* Tab 1: Add our catalog to cart */
  const handleOurCatalog = async (e) => {
    e.preventDefault();
    if (!selectedCatalogType) { toast.error('Välj en katalogtyp'); return; }
    setSubmitting(true);
    try {
      await addToCart({
        product_id: `our-catalog-${selectedCatalogType}`,
        name: selectedCatalogType === 'physical' ? 'Produktkatalog (Fysisk)' : 'Produktkatalog (Digital PDF)',
        price: 0,
        quantity: selectedCatalogType === 'physical' ? quantity : 1,
        image: null,
        customization: {
          type: 'our_catalog',
          catalog_type: selectedCatalogType,
        },
      });
      toast.success('Katalog tillagd i varukorgen!');
      navigate('/varukorg');
    } catch { toast.error('Kunde inte lägga till i varukorgen'); }
    finally { setSubmitting(false); }
  };

  /* Tab 2: Add print catalog to cart */
  const handlePrintCatalog = async (e) => {
    e.preventDefault();
    if (!pdfFile) { toast.error('Ladda upp din PDF-katalog'); return; }
    setSubmitting(true);
    try {
      toast.info('Laddar upp PDF...');
      const pdfUrl = await uploadFile(pdfFile);
      const unitPrice = getCatalogPrice(quantity);
      await addToCart({
        product_id: 'print-catalog',
        name: `Katalogutskrift: ${pdfFile.name}`,
        price: unitPrice,
        quantity,
        image: null,
        customization: {
          type: 'print_catalog',
          pdf_url: pdfUrl,
          original_filename: pdfFile.name,
        },
      });
      toast.success('Katalog tillagd i varukorgen!');
      navigate('/varukorg');
    } catch { toast.error('Kunde inte lägga till i varukorgen'); }
    finally { setSubmitting(false); }
  };

  /* Tab 2: Add business cards to cart */
  const handleBusinessCard = async (e) => {
    e.preventDefault();
    if (cardSource === 'pdf' && !cardPdfFile) { toast.error('Ladda upp en PDF med din visitkortsdesign'); return; }
    if (cardSource === 'editor' && !card.name.trim()) { toast.error('Fyll i namn på visitkortet'); return; }
    setSubmitting(true);
    try {
      let pdfUrl = null;
      let logoUrl = null;

      if (cardSource === 'pdf' && cardPdfFile) {
        toast.info('Laddar upp PDF...');
        pdfUrl = await uploadFile(cardPdfFile);
      }
      if (logo) {
        // If logo is already a server URL (from edit mode), reuse it directly
        if (logo.startsWith('/api/') || logo.startsWith('http')) {
          logoUrl = logo;
        } else {
          logoUrl = await uploadBase64(logo);
        }
      }

      const unitPrice = getCardPrice(quantity);
      const itemData = {
        product_id: 'print-businesscard',
        name: cardSource === 'editor' ? `Visitkort: ${card.name}` : `Visitkort (PDF): ${cardPdfFile?.name || 'design'}`,
        price: unitPrice,
        quantity,
        image: null,
        customization: {
          type: 'businesscard',
          source: cardSource,
          card_details: { ...card },
          template: cardTemplate,
          color: cardColor,
          logo_url: logoUrl,
          pdf_url: pdfUrl,
          original_filename: cardPdfFile?.name || null,
        },
      };

      if (editCartItemId) {
        await updateCartItem(editCartItemId, itemData);
        toast.success('Visitkort uppdaterade!');
      } else {
        await addToCart(itemData);
        toast.success('Visitkort tillagda i varukorgen!');
      }
      navigate('/varukorg');
    } catch { toast.error('Kunde inte lägga till i varukorgen'); }
    finally { setSubmitting(false); }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') { toast.error('Bara PDF-filer tillåtna'); return; }
    if (file.size > 50 * 1024 * 1024) { toast.error('Max filstorlek: 50MB'); return; }
    setPdfFile(file);
  };

  const handleCardPdfSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') { toast.error('Bara PDF-filer tillåtna'); return; }
    if (file.size > 50 * 1024 * 1024) { toast.error('Max filstorlek: 50MB'); return; }
    setCardPdfFile(file);
  };

  const handleSubmit = activeTab === 'our'
    ? handleOurCatalog
    : printService === 'catalog' ? handlePrintCatalog : handleBusinessCard;

  const isSubmitDisabled = () => {
    if (submitting) return true;
    if (activeTab === 'our') return !selectedCatalogType;
    if (printService === 'catalog') return catalogSource === 'design' || !pdfFile;
    if (printService === 'businesscard') {
      if (cardSource === 'pdf') return !cardPdfFile;
      return !card.name.trim();
    }
    return true;
  };

  const getSubmitLabel = () => {
    if (activeTab === 'our') {
      return selectedCatalogType
        ? <>Typ: <strong className="text-slate-700">{selectedCatalogType === 'physical' ? 'Fysisk broschyr' : 'Digital PDF'}</strong>{selectedCatalogType === 'physical' && ` — ${quantity} st`}</>
        : <span className="text-amber-600">Välj en katalogtyp ovan</span>;
    }
    if (printService === 'catalog') {
      const total = quantity * getCatalogPrice(quantity);
      return pdfFile
        ? <>Katalog: <strong className="text-slate-700">{pdfFile.name}</strong> — {quantity} ex — <strong className="text-[#2a9d8f]">{total} kr</strong></>
        : <span className="text-amber-600">Ladda upp en PDF-katalog</span>;
    }
    if (printService === 'businesscard') {
      const total = (quantity * getCardPrice(quantity)).toFixed(0);
      if (cardSource === 'pdf') return cardPdfFile
        ? <>Visitkort (PDF): <strong className="text-slate-700">{cardPdfFile.name}</strong> — {quantity} st — <strong className="text-[#2a9d8f]">{total} kr</strong></>
        : <span className="text-amber-600">Ladda upp en PDF</span>;
      return card.name
        ? <>Visitkort: <strong className="text-slate-700">{card.name}</strong> — {quantity} st — <strong className="text-[#2a9d8f]">{total} kr</strong></>
        : <span className="text-amber-600">Fyll i namn på visitkortet</span>;
    }
  };

  return (
    <div className="min-h-screen bg-[#faf9f6]" data-testid="business-catalog-page">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, #2a9d8f 0%, transparent 50%), radial-gradient(circle at 80% 20%, #e76f51 0%, transparent 50%)' }} />
        <div className="relative max-w-6xl mx-auto px-4 py-20 sm:py-28">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white/80 px-4 py-1.5 rounded-full text-sm font-medium mb-6">
              <Building2 className="w-4 h-4" />
              För företag
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-5 leading-tight">
              Tryck & design för <span className="text-[#2a9d8f]">företag</span>
            </h1>
            <p className="text-lg text-slate-300 leading-relaxed max-w-xl">
              Beställ vår produktkatalog, skriv ut era egna kataloger eller designa professionella visitkort. Vi hjälper ert företag!
            </p>
          </div>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 py-12 sm:py-16">
        {/* Tabs */}
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1 mb-10" data-testid="catalog-tabs">
          <button onClick={() => setActiveTab('our')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-semibold transition-all ${activeTab === 'our' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            data-testid="tab-our-catalog">
            <BookOpen className="w-4 h-4" />Vår produktkatalog
          </button>
          <button onClick={() => setActiveTab('print')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-semibold transition-all ${activeTab === 'print' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            data-testid="tab-print-catalog">
            <Printer className="w-4 h-4" />Utskriftstjänster
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8" data-testid="catalog-order-form">

          {/* ─── Tab 1: Choose our catalog type ─── */}
          {activeTab === 'our' && (
            <div>
              <div className="flex items-center gap-3 mb-5">
                <span className="w-8 h-8 rounded-full bg-[#2a9d8f] text-white text-sm font-bold flex items-center justify-center">1</span>
                <h2 className="text-xl font-bold text-slate-900">Välj katalogtyp</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5" data-testid="catalog-type-grid">
                {CATALOG_TYPES.map(cat => {
                  const isSelected = selectedCatalogType === cat.id;
                  return (
                    <button key={cat.id} type="button" onClick={() => setSelectedCatalogType(cat.id)}
                      className={`relative text-left p-6 rounded-2xl border-2 transition-all duration-200 ${isSelected ? 'border-[#2a9d8f] bg-[#2a9d8f]/5 shadow-md' : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'}`}
                      data-testid={`catalog-type-${cat.id}`}>
                      {isSelected && (
                        <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-[#2a9d8f] flex items-center justify-center"><Check className="w-4 h-4 text-white" /></div>
                      )}
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${cat.color}15` }}>
                          <cat.Icon className="w-6 h-6" style={{ color: cat.color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-bold text-slate-900">{cat.title}</h3>
                          <p className="text-sm text-slate-500 mb-3">{cat.subtitle}</p>
                          <p className="text-sm text-slate-600 leading-relaxed mb-4">{cat.description}</p>
                          <ul className="space-y-1.5 mb-4">
                            {cat.features.map(f => (<li key={f} className="flex items-center gap-2 text-sm text-slate-600"><Check className="w-3.5 h-3.5 text-[#2a9d8f] shrink-0" />{f}</li>))}
                          </ul>
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-2xl font-bold" style={{ color: cat.color }}>{cat.price}</span>
                            {cat.priceNote && <span className="text-xs text-slate-400">{cat.priceNote}</span>}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ─── Tab 2: Print services ─── */}
          {activeTab === 'print' && (
            <>
              {/* Service type selector */}
              <div>
                <div className="flex items-center gap-3 mb-5">
                  <span className="w-8 h-8 rounded-full bg-[#2a9d8f] text-white text-sm font-bold flex items-center justify-center">1</span>
                  <h2 className="text-xl font-bold text-slate-900">Välj tjänst</h2>
                </div>
                <div className="grid grid-cols-2 gap-4" data-testid="print-service-grid">
                  {PRINT_SERVICES.map(s => (
                    <button key={s.id} type="button" onClick={() => setPrintService(s.id)}
                      className={`p-4 rounded-xl border-2 text-left flex items-center gap-3 transition-all ${
                        printService === s.id ? 'border-[#2a9d8f] bg-[#2a9d8f]/5' : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                      data-testid={`service-${s.id}`}>
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${printService === s.id ? 'bg-[#2a9d8f]/20' : 'bg-slate-100'}`}>
                        <s.Icon className={`w-5 h-5 ${printService === s.id ? 'text-[#2a9d8f]' : 'text-slate-400'}`} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{s.title}</p>
                        <p className="text-xs text-slate-500">{s.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Catalog: Design or PDF upload */}
              {printService === 'catalog' && (
                <div>
                  <div className="flex items-center gap-3 mb-5">
                    <span className="w-8 h-8 rounded-full bg-[#2a9d8f] text-white text-sm font-bold flex items-center justify-center">2</span>
                    <h2 className="text-xl font-bold text-slate-900">Skapa din katalog</h2>
                  </div>

                  {/* Source toggle */}
                  <div className="flex gap-1 bg-slate-100 rounded-lg p-1 mb-6" data-testid="catalog-source-toggle">
                    <button type="button" onClick={() => setCatalogSource('design')}
                      className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${catalogSource === 'design' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
                      data-testid="catalog-source-design">
                      Designa själv
                    </button>
                    <button type="button" onClick={() => setCatalogSource('upload')}
                      className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${catalogSource === 'upload' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
                      data-testid="catalog-source-upload">
                      Ladda upp PDF
                    </button>
                  </div>

                  {catalogSource === 'design' ? (
                    <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center" data-testid="catalog-design-cta">
                      <div className="w-16 h-16 rounded-2xl bg-[#2a9d8f]/10 flex items-center justify-center mx-auto mb-4">
                        <Palette className="w-8 h-8 text-[#2a9d8f]" />
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 mb-2">Katalogdesigner</h3>
                      <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">
                        Skapa en professionell produktkatalog med vårt enkla designverktyg. Välj mall, lägg till produkter, bilder och text — sida för sida.
                      </p>
                      <Button type="button" onClick={() => navigate('/katalog-designer')} className="bg-[#2a9d8f] hover:bg-[#238b7e] h-12 px-8 text-base font-semibold" data-testid="open-catalog-designer">
                        <Palette className="w-4 h-4 mr-2" /> Öppna designverktyget
                      </Button>
                    </div>
                  ) : (
                    <>
                      {!pdfFile ? (
                        <button type="button" onClick={() => fileInputRef.current?.click()}
                          className="w-full border-2 border-dashed border-slate-300 hover:border-[#2a9d8f] rounded-2xl p-10 transition-colors bg-white group" data-testid="pdf-upload-area">
                          <div className="flex flex-col items-center gap-3">
                            <div className="w-16 h-16 rounded-2xl bg-[#2a9d8f]/10 group-hover:bg-[#2a9d8f]/20 flex items-center justify-center transition-colors"><Upload className="w-8 h-8 text-[#2a9d8f]" /></div>
                            <p className="text-base font-semibold text-slate-700">Klicka för att välja PDF-fil</p>
                            <p className="text-sm text-slate-400">Max 50MB, enbart PDF-format</p>
                          </div>
                        </button>
                      ) : (
                        <div className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center gap-4" data-testid="pdf-file-preview">
                          <div className="w-14 h-14 rounded-xl bg-red-50 flex items-center justify-center shrink-0"><FileText className="w-7 h-7 text-red-500" /></div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-slate-900 truncate">{pdfFile.name}</p>
                            <p className="text-sm text-slate-400">{(pdfFile.size / (1024 * 1024)).toFixed(1)} MB</p>
                          </div>
                          <button type="button" onClick={() => { setPdfFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                            className="p-2 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors" data-testid="remove-pdf"><X className="w-5 h-5" /></button>
                        </div>
                      )}
                      <input ref={fileInputRef} type="file" accept=".pdf,application/pdf" className="hidden" onChange={handleFileSelect} data-testid="pdf-file-input" />
                    </>
                  )}
                </div>
              )}

              {/* Business cards */}
              {printService === 'businesscard' && (
                <div>
                  <div className="flex items-center gap-3 mb-5">
                    <span className="w-8 h-8 rounded-full bg-[#2a9d8f] text-white text-sm font-bold flex items-center justify-center">2</span>
                    <h2 className="text-xl font-bold text-slate-900">Skapa dina visitkort</h2>
                  </div>

                  {/* Source toggle */}
                  <div className="flex gap-1 bg-slate-100 rounded-lg p-1 mb-6" data-testid="card-source-toggle">
                    <button type="button" onClick={() => setCardSource('editor')}
                      className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${cardSource === 'editor' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
                      data-testid="card-source-editor">
                      Designa själv
                    </button>
                    <button type="button" onClick={() => setCardSource('pdf')}
                      className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${cardSource === 'pdf' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
                      data-testid="card-source-pdf">
                      Ladda upp PDF
                    </button>
                  </div>

                  {cardSource === 'editor' ? (
                    <BusinessCardEditor
                      card={card} setCard={setCard}
                      logo={logo} setLogo={setLogo}
                      template={cardTemplate} setTemplate={setCardTemplate}
                      color={cardColor} setColor={setCardColor}
                    />
                  ) : (
                    <>
                      {!cardPdfFile ? (
                        <button type="button" onClick={() => cardPdfInputRef.current?.click()}
                          className="w-full border-2 border-dashed border-slate-300 hover:border-[#2a9d8f] rounded-2xl p-10 transition-colors bg-white group" data-testid="card-pdf-upload-area">
                          <div className="flex flex-col items-center gap-3">
                            <div className="w-16 h-16 rounded-2xl bg-[#2a9d8f]/10 group-hover:bg-[#2a9d8f]/20 flex items-center justify-center transition-colors"><Upload className="w-8 h-8 text-[#2a9d8f]" /></div>
                            <p className="text-base font-semibold text-slate-700">Ladda upp visitkortsdesign (PDF)</p>
                            <p className="text-sm text-slate-400">Max 50MB, enbart PDF-format</p>
                          </div>
                        </button>
                      ) : (
                        <div className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center gap-4" data-testid="card-pdf-file-preview">
                          <div className="w-14 h-14 rounded-xl bg-red-50 flex items-center justify-center shrink-0"><FileText className="w-7 h-7 text-red-500" /></div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-slate-900 truncate">{cardPdfFile.name}</p>
                            <p className="text-sm text-slate-400">{(cardPdfFile.size / (1024 * 1024)).toFixed(1)} MB</p>
                          </div>
                          <button type="button" onClick={() => { setCardPdfFile(null); if (cardPdfInputRef.current) cardPdfInputRef.current.value = ''; }}
                            className="p-2 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors" data-testid="remove-card-pdf"><X className="w-5 h-5" /></button>
                        </div>
                      )}
                      <input ref={cardPdfInputRef} type="file" accept=".pdf,application/pdf" className="hidden" onChange={handleCardPdfSelect} data-testid="card-pdf-file-input" />
                    </>
                  )}
                </div>
              )}
            </>
          )}

          {/* ─── Antal & Pris ─── */}
          {((activeTab === 'print' && !(printService === 'catalog' && catalogSource === 'design')) || (activeTab === 'our' && selectedCatalogType === 'physical')) && (
            <div>
              <div className="flex items-center gap-3 mb-5">
                <span className="w-8 h-8 rounded-full bg-[#2a9d8f] text-white text-sm font-bold flex items-center justify-center">{activeTab === 'our' ? '2' : '3'}</span>
                <h2 className="text-xl font-bold text-slate-900">Antal</h2>
              </div>
              <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-2">
                    {activeTab === 'print' && printService === 'businesscard' ? 'Antal visitkort' : activeTab === 'print' ? 'Antal exemplar att trycka' : 'Antal kataloger (max 5)'}
                  </label>
                  <div className="flex items-center gap-3">
                    <button type="button" onClick={() => setQuantity(q => Math.max(1, q - 1))}
                      className="w-10 h-10 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors" data-testid="qty-decrease"><Minus className="w-4 h-4" /></button>
                    <Input type="number" min="1" max={activeTab === 'our' ? 5 : 9999}
                      value={quantity} onChange={e => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-20 text-center font-semibold text-lg h-10" data-testid="qty-display" />
                    <button type="button" onClick={() => { const max = activeTab === 'our' ? 5 : 9999; setQuantity(q => Math.min(max, q + 1)); }}
                      className="w-10 h-10 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors" data-testid="qty-increase"><Plus className="w-4 h-4" /></button>
                    <span className="text-sm text-slate-400 ml-1">{activeTab === 'print' && printService === 'businesscard' ? 'st' : 'exemplar'}</span>
                  </div>

                  {/* Quick quantity buttons for business cards */}
                  {activeTab === 'print' && printService === 'businesscard' && (
                    <div className="flex flex-wrap gap-2 mt-3" data-testid="quick-qty-buttons">
                      {[50, 100, 250, 500].map(q => (
                        <button key={q} type="button" onClick={() => setQuantity(q)}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                            quantity === q ? 'border-[#2a9d8f] bg-[#2a9d8f]/10 text-[#2a9d8f]' : 'border-slate-200 text-slate-600 hover:border-slate-300'
                          }`}
                          data-testid={`quick-qty-${q}`}>
                          {q} st
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Price calculation for print services */}
                  {activeTab === 'print' && (
                    <div className="mt-4 bg-slate-50 rounded-xl p-4" data-testid="price-calculation">
                      {printService === 'businesscard' ? (
                        <>
                          <div className="flex justify-between items-baseline mb-1">
                            <span className="text-sm text-slate-600">{quantity} st x {getCardPrice(quantity).toFixed(2)} kr/st</span>
                            <span className="text-lg font-bold text-slate-900" data-testid="total-price">{(quantity * getCardPrice(quantity)).toFixed(0)} kr</span>
                          </div>
                          <p className="text-xs text-slate-400">
                            {quantity < 50 && 'Beställ 50+ för bättre pris!'}
                            {quantity >= 50 && quantity < 100 && 'Beställ 100+ för 2,50 kr/st'}
                            {quantity >= 100 && quantity < 250 && 'Beställ 250+ för 1,90 kr/st'}
                            {quantity >= 250 && quantity < 500 && 'Beställ 500+ för 1,20 kr/st'}
                            {quantity >= 500 && 'Bästa priset!'}
                          </p>
                          <div className="mt-3 pt-3 border-t border-slate-200">
                            <p className="text-xs font-medium text-slate-500 mb-2">Prisstege:</p>
                            <div className="grid grid-cols-5 gap-1 text-center text-xs">
                              {CARD_PRICE_TIERS.map(t => (
                                <div key={t.min} className={`rounded-md py-1.5 ${quantity >= t.min && quantity <= t.max ? 'bg-[#2a9d8f]/15 text-[#2a9d8f] font-semibold' : 'text-slate-400'}`}>
                                  <p className="font-medium">{t.min}{t.max === Infinity ? '+' : `-${t.max}`}</p>
                                  <p>{t.pricePerCard.toFixed(2)} kr</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex justify-between items-baseline mb-1">
                            <span className="text-sm text-slate-600">{quantity} ex x {getCatalogPrice(quantity)} kr/ex</span>
                            <span className="text-lg font-bold text-slate-900" data-testid="total-price">{quantity * getCatalogPrice(quantity)} kr</span>
                          </div>
                          <p className="text-xs text-slate-400">
                            {quantity < 10 && 'Beställ 10+ för 69 kr/ex'}
                            {quantity >= 10 && quantity < 25 && 'Beställ 25+ för 49 kr/ex'}
                            {quantity >= 25 && quantity < 50 && 'Beställ 50+ för 39 kr/ex'}
                            {quantity >= 50 && 'Bästa priset!'}
                          </p>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Submit - Lägg i varukorgen (hide for catalog design mode) */}
          {!(activeTab === 'print' && printService === 'catalog' && catalogSource === 'design') && (
            <div className="bg-white rounded-2xl border border-slate-200 px-6 sm:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-slate-500">{getSubmitLabel()}</div>
              <Button type="submit" className="bg-[#2a9d8f] hover:bg-[#238b7e] h-12 px-8 text-base font-semibold"
                disabled={isSubmitDisabled()} data-testid="submit-catalog-order">
                {submitting ? 'Sparar...' : <><ShoppingCart className="w-4 h-4 mr-2" />{editCartItemId ? 'Spara ändringar' : 'Lägg i varukorgen'}</>}
              </Button>
            </div>
          )}
        </form>

        {/* Info cards */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { Icon: ShieldCheck, title: 'Högkvalitativt tryck', desc: 'Professionell tryckutrustning för skarpa färger och hållbart resultat.' },
            { Icon: Clock, title: 'Snabb leverans', desc: 'Din beställning trycks och skickas inom 2-5 arbetsdagar.' },
            { Icon: Package, title: 'Fri frakt', desc: 'Kostnadsfri leverans på beställningar över 499 kr.' },
          ].map(item => (
            <div key={item.title} className="bg-white rounded-xl border border-slate-200 p-6 text-center">
              <div className="w-12 h-12 rounded-xl bg-[#2a9d8f]/10 flex items-center justify-center mx-auto mb-4"><item.Icon className="w-6 h-6 text-[#2a9d8f]" /></div>
              <h3 className="font-semibold text-slate-900 mb-2">{item.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BusinessCatalog;
