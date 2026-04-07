import { useState, useRef } from 'react';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import api from '../services/api';
import {
  Building2, Send, Check, Printer, Truck, Phone, MapPin, X,
  FileText, Upload, Package, Clock, ShieldCheck, Minus, Plus,
  BookOpen, FileDown, Mail
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

/* ───── Shared form fields component ───── */
function CompanyForm({ form, updateField, showAddress }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-4 flex items-center gap-2">
          <Building2 className="w-4 h-4 text-[#2a9d8f]" />Företagsinformation
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1.5">Företagsnamn *</label>
            <Input value={form.company_name} onChange={e => updateField('company_name', e.target.value)} placeholder="AB Företaget" className="h-11" data-testid="input-company" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1.5">Kontaktperson *</label>
            <Input value={form.contact_person} onChange={e => updateField('contact_person', e.target.value)} placeholder="Anna Andersson" className="h-11" data-testid="input-contact" />
          </div>
        </div>
      </div>
      <div>
        <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-4 flex items-center gap-2">
          <Phone className="w-4 h-4 text-[#2a9d8f]" />Kontaktuppgifter
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1.5">E-post *</label>
            <Input type="email" value={form.email} onChange={e => updateField('email', e.target.value)} placeholder="info@foretaget.se" className="h-11" data-testid="input-email" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1.5">Telefon *</label>
            <Input value={form.phone} onChange={e => updateField('phone', e.target.value)} placeholder="070-123 45 67" className="h-11" data-testid="input-phone" />
          </div>
        </div>
      </div>
      {showAddress && (
        <div>
          <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-4 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[#2a9d8f]" />Leveransadress
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1.5">Gatuadress *</label>
              <Input value={form.address} onChange={e => updateField('address', e.target.value)} placeholder="Storgatan 1" className="h-11" data-testid="input-address" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1.5">Postnummer *</label>
                <Input value={form.postal_code} onChange={e => updateField('postal_code', e.target.value)} placeholder="123 45" className="h-11" data-testid="input-postal" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1.5">Ort *</label>
                <Input value={form.city} onChange={e => updateField('city', e.target.value)} placeholder="Stockholm" className="h-11" data-testid="input-city" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ───── Success screen ───── */
function SuccessScreen({ message, onReset }) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4" data-testid="catalog-success">
      <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-10 max-w-lg w-full text-center">
        <div className="w-16 h-16 rounded-full bg-[#2a9d8f]/10 flex items-center justify-center mx-auto mb-5">
          <Check className="w-8 h-8 text-[#2a9d8f]" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-3">Tack för din beställning!</h2>
        <p className="text-slate-500 leading-relaxed mb-6">{message}</p>
        <Button className="bg-[#2a9d8f] hover:bg-[#238b7e]" onClick={onReset} data-testid="order-another-btn">
          Beställ en till
        </Button>
      </div>
    </div>
  );
}

/* ───── Main page ───── */
const BusinessCatalog = () => {
  const [activeTab, setActiveTab] = useState('our');
  const [submitted, setSubmitted] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Tab 1 state
  const [selectedCatalogType, setSelectedCatalogType] = useState(null);

  // Tab 2 state
  const [pdfFile, setPdfFile] = useState(null);
  const fileInputRef = useRef(null);

  // Shared form
  const emptyForm = { company_name: '', contact_person: '', email: '', phone: '', address: '', postal_code: '', city: '', quantity: 1, message: '' };
  const [form, setForm] = useState(emptyForm);
  const updateField = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const resetAll = () => {
    setSubmitted(false);
    setSuccessMsg('');
    setSelectedCatalogType(null);
    setPdfFile(null);
    setForm(emptyForm);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const validateBase = () => {
    if (!form.company_name.trim() || !form.contact_person.trim() || !form.email.trim() || !form.phone.trim()) {
      toast.error('Fyll i alla obligatoriska fält');
      return false;
    }
    return true;
  };

  const validateAddress = () => {
    if (!form.address.trim() || !form.postal_code.trim() || !form.city.trim()) {
      toast.error('Fyll i leveransadress');
      return false;
    }
    return true;
  };

  /* Tab 1: Order our catalog */
  const handleOurCatalog = async (e) => {
    e.preventDefault();
    if (!selectedCatalogType) { toast.error('Välj en katalogtyp'); return; }
    if (!validateBase()) return;
    if (selectedCatalogType === 'physical' && !validateAddress()) return;

    setSubmitting(true);
    try {
      await api.post('/catalog/order/our-catalog', {
        ...form, catalog_type: selectedCatalogType,
      });
      setSuccessMsg(
        selectedCatalogType === 'physical'
          ? 'Din fysiska katalog skickas inom 5-7 arbetsdagar till angiven adress.'
          : 'Din digitala katalog skickas till din e-post inom 24 timmar.'
      );
      setSubmitted(true);
    } catch {
      toast.error('Kunde inte skicka beställningen');
    } finally {
      setSubmitting(false);
    }
  };

  /* Tab 2: Print their catalog */
  const handlePrintCatalog = async (e) => {
    e.preventDefault();
    if (!pdfFile) { toast.error('Ladda upp din PDF-katalog'); return; }
    if (!validateBase()) return;
    if (!validateAddress()) return;

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('pdf_file', pdfFile);
      Object.entries(form).forEach(([k, v]) => formData.append(k, v.toString()));
      await api.post('/catalog/order/print', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setSuccessMsg('Vi har mottagit din katalog och börjar trycka den så snart som möjligt. Leverans inom 5-7 arbetsdagar.');
      setSubmitted(true);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Kunde inte skicka beställningen');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') { toast.error('Bara PDF-filer tillåtna'); return; }
    if (file.size > 50 * 1024 * 1024) { toast.error('Max filstorlek: 50MB'); return; }
    setPdfFile(file);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#faf9f6]">
        <SuccessScreen message={successMsg} onReset={resetAll} />
      </div>
    );
  }

  const needsAddress = activeTab === 'print' || selectedCatalogType === 'physical';

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
              Katalogtjänster för <span className="text-[#2a9d8f]">företag</span>
            </h1>
            <p className="text-lg text-slate-300 leading-relaxed max-w-xl">
              Beställ vår produktkatalog eller ladda upp er egen PDF för utskrift och leverans. Vi hjälper ert företag!
            </p>
          </div>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 py-12 sm:py-16">
        {/* Tabs */}
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1 mb-10" data-testid="catalog-tabs">
          <button
            onClick={() => setActiveTab('our')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'our' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
            data-testid="tab-our-catalog"
          >
            <BookOpen className="w-4 h-4" />Vår produktkatalog
          </button>
          <button
            onClick={() => setActiveTab('print')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'print' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
            data-testid="tab-print-catalog"
          >
            <Printer className="w-4 h-4" />Skriv ut er katalog
          </button>
        </div>

        <form onSubmit={activeTab === 'our' ? handleOurCatalog : handlePrintCatalog} className="space-y-8" data-testid="catalog-order-form">

          {/* ─── Tab 1 content: Choose our catalog type ─── */}
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
                    <button
                      key={cat.id} type="button"
                      onClick={() => setSelectedCatalogType(cat.id)}
                      className={`relative text-left p-6 rounded-2xl border-2 transition-all duration-200 ${
                        isSelected ? 'border-[#2a9d8f] bg-[#2a9d8f]/5 shadow-md' : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
                      }`}
                      data-testid={`catalog-type-${cat.id}`}
                    >
                      {isSelected && (
                        <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-[#2a9d8f] flex items-center justify-center">
                          <Check className="w-4 h-4 text-white" />
                        </div>
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
                            {cat.features.map(f => (
                              <li key={f} className="flex items-center gap-2 text-sm text-slate-600">
                                <Check className="w-3.5 h-3.5 text-[#2a9d8f] shrink-0" />{f}
                              </li>
                            ))}
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

          {/* ─── Tab 2 content: Upload PDF ─── */}
          {activeTab === 'print' && (
            <div>
              <div className="flex items-center gap-3 mb-5">
                <span className="w-8 h-8 rounded-full bg-[#2a9d8f] text-white text-sm font-bold flex items-center justify-center">1</span>
                <h2 className="text-xl font-bold text-slate-900">Ladda upp din katalog</h2>
              </div>
              {!pdfFile ? (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-slate-300 hover:border-[#2a9d8f] rounded-2xl p-10 transition-colors bg-white group"
                  data-testid="pdf-upload-area"
                >
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-16 h-16 rounded-2xl bg-[#2a9d8f]/10 group-hover:bg-[#2a9d8f]/20 flex items-center justify-center transition-colors">
                      <Upload className="w-8 h-8 text-[#2a9d8f]" />
                    </div>
                    <p className="text-base font-semibold text-slate-700">Klicka för att välja PDF-fil</p>
                    <p className="text-sm text-slate-400">Max 50MB, enbart PDF-format</p>
                  </div>
                </button>
              ) : (
                <div className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center gap-4" data-testid="pdf-file-preview">
                  <div className="w-14 h-14 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
                    <FileText className="w-7 h-7 text-red-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 truncate">{pdfFile.name}</p>
                    <p className="text-sm text-slate-400">{(pdfFile.size / (1024 * 1024)).toFixed(1)} MB</p>
                  </div>
                  <button type="button" onClick={() => { setPdfFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                    className="p-2 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors" data-testid="remove-pdf">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              )}
              <input ref={fileInputRef} type="file" accept=".pdf,application/pdf" className="hidden" onChange={handleFileSelect} data-testid="pdf-file-input" />
            </div>
          )}

          {/* ─── Shared: Company & delivery info ─── */}
          <div>
            <div className="flex items-center gap-3 mb-5">
              <span className="w-8 h-8 rounded-full bg-[#2a9d8f] text-white text-sm font-bold flex items-center justify-center">2</span>
              <h2 className="text-xl font-bold text-slate-900">Företags- och leveransuppgifter</h2>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-6">
              <CompanyForm form={form} updateField={updateField} showAddress={needsAddress} />

              {/* Quantity for physical / print */}
              {needsAddress && (
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-2">
                    {activeTab === 'print' ? 'Antal exemplar att trycka' : 'Antal kataloger (max 5)'}
                  </label>
                  <div className="flex items-center gap-3">
                    <button type="button" onClick={() => updateField('quantity', Math.max(1, form.quantity - 1))}
                      className="w-10 h-10 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors" data-testid="qty-decrease">
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-12 text-center font-semibold text-lg" data-testid="qty-display">{form.quantity}</span>
                    <button type="button" onClick={() => {
                      const max = activeTab === 'our' ? 5 : 999;
                      updateField('quantity', Math.min(max, form.quantity + 1));
                    }}
                      className="w-10 h-10 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors" data-testid="qty-increase">
                      <Plus className="w-4 h-4" />
                    </button>
                    <span className="text-sm text-slate-400 ml-2">exemplar</span>
                  </div>
                </div>
              )}

              {/* Message */}
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1.5">Meddelande (valfritt)</label>
                <textarea
                  value={form.message}
                  onChange={e => updateField('message', e.target.value)}
                  placeholder={activeTab === 'print' ? 'Speciella önskemål om papperstyp, format, bindning...' : 'Berätta gärna om ni har speciella önskemål...'}
                  rows={3}
                  className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2a9d8f]/30 focus:border-[#2a9d8f] resize-none"
                  data-testid="input-message"
                />
              </div>
            </div>
          </div>

          {/* Submit bar */}
          <div className="bg-white rounded-2xl border border-slate-200 px-6 sm:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-slate-500">
              {activeTab === 'our' ? (
                selectedCatalogType
                  ? <>Typ: <strong className="text-slate-700">{selectedCatalogType === 'physical' ? 'Fysisk broschyr' : 'Digital PDF'}</strong>{selectedCatalogType === 'physical' && ` — ${form.quantity} st`}</>
                  : <span className="text-amber-600">Välj en katalogtyp ovan</span>
              ) : (
                pdfFile
                  ? <>Fil: <strong className="text-slate-700">{pdfFile.name}</strong> — {form.quantity} exemplar</>
                  : <span className="text-amber-600">Ladda upp en PDF-katalog</span>
              )}
            </div>
            <Button
              type="submit"
              className="bg-[#2a9d8f] hover:bg-[#238b7e] h-12 px-8 text-base font-semibold"
              disabled={(activeTab === 'our' ? !selectedCatalogType : !pdfFile) || submitting}
              data-testid="submit-catalog-order"
            >
              {submitting ? 'Skickar...' : <><Send className="w-4 h-4 mr-2" />Skicka beställning</>}
            </Button>
          </div>
        </form>

        {/* Info cards */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { Icon: ShieldCheck, title: 'Högkvalitativt tryck', desc: 'Professionell tryckutrustning för skarpa färger och hållbart resultat.' },
            { Icon: Clock, title: 'Snabb leverans', desc: 'Din beställning trycks och skickas inom 5-7 arbetsdagar.' },
            { Icon: Package, title: 'Fri frakt', desc: 'Kostnadsfri leverans till hela Sverige.' },
          ].map(item => (
            <div key={item.title} className="bg-white rounded-xl border border-slate-200 p-6 text-center">
              <div className="w-12 h-12 rounded-xl bg-[#2a9d8f]/10 flex items-center justify-center mx-auto mb-4">
                <item.Icon className="w-6 h-6 text-[#2a9d8f]" />
              </div>
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
