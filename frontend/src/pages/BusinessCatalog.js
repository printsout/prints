import { useState, useRef } from 'react';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import api from '../services/api';
import {
  Building2, Send, Check, FileUp, Printer,
  Truck, Phone, MapPin, X, FileText, Upload,
  Package, Clock, ShieldCheck, Minus, Plus
} from 'lucide-react';

const BusinessCatalog = () => {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [pdfFile, setPdfFile] = useState(null);
  const fileInputRef = useRef(null);
  const [form, setForm] = useState({
    company_name: '', contact_person: '', email: '',
    phone: '', address: '', postal_code: '', city: '',
    quantity: 1, message: '',
  });

  const updateField = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      toast.error('Bara PDF-filer tillåtna');
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      toast.error('Max filstorlek: 50MB');
      return;
    }
    setPdfFile(file);
    toast.success(`"${file.name}" vald`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!pdfFile) { toast.error('Ladda upp din PDF-katalog'); return; }
    if (!form.company_name.trim() || !form.contact_person.trim() || !form.email.trim() || !form.phone.trim()) {
      toast.error('Fyll i alla obligatoriska fält');
      return;
    }
    if (!form.address.trim() || !form.postal_code.trim() || !form.city.trim()) {
      toast.error('Fyll i leveransadress');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('pdf_file', pdfFile);
      formData.append('company_name', form.company_name);
      formData.append('contact_person', form.contact_person);
      formData.append('email', form.email);
      formData.append('phone', form.phone);
      formData.append('address', form.address);
      formData.append('postal_code', form.postal_code);
      formData.append('city', form.city);
      formData.append('quantity', form.quantity.toString());
      formData.append('message', form.message);

      await api.post('/catalog/order', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setSubmitted(true);
      toast.success('Katalogbeställning skickad!');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Kunde inte skicka beställningen');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#faf9f6] flex items-center justify-center px-4" data-testid="catalog-success">
        <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-10 max-w-lg w-full text-center">
          <div className="w-16 h-16 rounded-full bg-[#2a9d8f]/10 flex items-center justify-center mx-auto mb-5">
            <Check className="w-8 h-8 text-[#2a9d8f]" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-3">Tack för din beställning!</h2>
          <p className="text-slate-500 leading-relaxed mb-2">
            Vi har mottagit din katalog och börjar trycka den så snart som möjligt. Du får en bekräftelse till din e-post.
          </p>
          <p className="text-sm text-slate-400 mb-6">Leverans inom 5-7 arbetsdagar till angiven adress.</p>
          <Button
            className="bg-[#2a9d8f] hover:bg-[#238b7e]"
            onClick={() => {
              setSubmitted(false);
              setPdfFile(null);
              setForm({ company_name: '', contact_person: '', email: '', phone: '', address: '', postal_code: '', city: '', quantity: 1, message: '' });
            }}
            data-testid="order-another-btn"
          >
            Beställ en till
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf9f6]" data-testid="business-catalog-page">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, #2a9d8f 0%, transparent 50%), radial-gradient(circle at 80% 20%, #e76f51 0%, transparent 50%)' }} />
        <div className="relative max-w-6xl mx-auto px-4 py-20 sm:py-28">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white/80 px-4 py-1.5 rounded-full text-sm font-medium mb-6">
              <Printer className="w-4 h-4" />
              Utskriftstjänst för företag
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-5 leading-tight">
              Skriv ut er <span className="text-[#2a9d8f]">katalog</span> hos oss
            </h1>
            <p className="text-lg text-slate-300 leading-relaxed mb-8 max-w-xl">
              Ladda upp er PDF-katalog och vi trycker och levererar den direkt till er. Högkvalitativt tryck med snabb leverans.
            </p>
            <div className="flex flex-wrap gap-6 text-sm text-slate-400">
              <span className="flex items-center gap-2"><FileText className="w-4 h-4 text-[#2a9d8f]" />Ladda upp PDF</span>
              <span className="flex items-center gap-2"><Printer className="w-4 h-4 text-[#2a9d8f]" />Vi trycker</span>
              <span className="flex items-center gap-2"><Truck className="w-4 h-4 text-[#2a9d8f]" />Vi levererar</span>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 py-12 sm:py-16">
        <form onSubmit={handleSubmit} className="space-y-8" data-testid="catalog-order-form">

          {/* Step 1: Upload PDF */}
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
                  <div className="text-center">
                    <p className="text-base font-semibold text-slate-700">Klicka för att välja PDF-fil</p>
                    <p className="text-sm text-slate-400 mt-1">Max 50MB, enbart PDF-format</p>
                  </div>
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
                <button
                  type="button"
                  onClick={() => { setPdfFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                  className="p-2 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                  data-testid="remove-pdf"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}
            <input ref={fileInputRef} type="file" accept=".pdf,application/pdf" className="hidden" onChange={handleFileSelect} data-testid="pdf-file-input" />
          </div>

          {/* Step 2: Company & delivery info */}
          <div>
            <div className="flex items-center gap-3 mb-5">
              <span className="w-8 h-8 rounded-full bg-[#2a9d8f] text-white text-sm font-bold flex items-center justify-center">2</span>
              <h2 className="text-xl font-bold text-slate-900">Företags- och leveransuppgifter</h2>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-6">
              {/* Company info */}
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

              {/* Contact info */}
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

              {/* Delivery address */}
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

              {/* Quantity */}
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">Antal exemplar att trycka</label>
                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => updateField('quantity', Math.max(1, form.quantity - 1))} className="w-10 h-10 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors" data-testid="qty-decrease">
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-12 text-center font-semibold text-lg" data-testid="qty-display">{form.quantity}</span>
                  <button type="button" onClick={() => updateField('quantity', form.quantity + 1)} className="w-10 h-10 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors" data-testid="qty-increase">
                    <Plus className="w-4 h-4" />
                  </button>
                  <span className="text-sm text-slate-400 ml-2">exemplar</span>
                </div>
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1.5">Meddelande (valfritt)</label>
                <textarea
                  value={form.message}
                  onChange={e => updateField('message', e.target.value)}
                  placeholder="Speciella önskemål om papperstyp, format, bindning..."
                  rows={3}
                  className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2a9d8f]/30 focus:border-[#2a9d8f] resize-none"
                  data-testid="input-message"
                />
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="bg-white rounded-2xl border border-slate-200 px-6 sm:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-slate-500">
              {pdfFile ? (
                <span>Fil: <strong className="text-slate-700">{pdfFile.name}</strong> — {form.quantity} exemplar</span>
              ) : (
                <span className="text-amber-600">Ladda upp en PDF-katalog</span>
              )}
            </div>
            <Button
              type="submit"
              className="bg-[#2a9d8f] hover:bg-[#238b7e] h-12 px-8 text-base font-semibold"
              disabled={!pdfFile || submitting}
              data-testid="submit-catalog-order"
            >
              {submitting ? 'Skickar...' : (
                <><Send className="w-4 h-4 mr-2" />Skicka beställning</>
              )}
            </Button>
          </div>
        </form>

        {/* Info section */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { Icon: ShieldCheck, title: 'Högkvalitativt tryck', desc: 'Vi använder professionell tryckutrustning för skarpa färger och hållbart resultat.' },
            { Icon: Clock, title: 'Snabb leverans', desc: 'Din beställning trycks och skickas inom 5-7 arbetsdagar.' },
            { Icon: Package, title: 'Fri frakt', desc: 'Vi levererar kostnadsfritt till hela Sverige.' },
          ].map(item => (
            <div key={item.title} className="bg-white rounded-xl border border-slate-200 p-6 text-center" data-testid={`info-${item.title.toLowerCase().replace(/\s/g, '-')}`}>
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
