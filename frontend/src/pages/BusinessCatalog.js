import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import api from '../services/api';
import {
  BookOpen, FileDown, Building2, Send, Check,
  Truck, Phone, Mail, MapPin, ArrowRight, Package
} from 'lucide-react';

const CATALOG_TYPES = [
  {
    id: 'physical',
    title: 'Fysisk katalog',
    subtitle: 'Tryckt broschyr',
    description: 'En professionellt tryckt produktkatalog i A4-format med alla våra produkter, priser och anpassningsmöjligheter. Perfekt att dela ut till anställda eller kunder.',
    features: ['Högkvalitativt tryck', 'A4-format, 24 sidor', 'Produktbilder & priser', 'Levereras inom 5-7 arbetsdagar'],
    price: 'Gratis',
    priceNote: '(max 5 st per företag)',
    Icon: BookOpen,
    color: '#2a9d8f',
  },
  {
    id: 'digital',
    title: 'Digital katalog',
    subtitle: 'PDF via e-post',
    description: 'En digital PDF-katalog som skickas direkt till din e-post. Enkel att dela vidare till kollegor och kunder via e-post eller intranät.',
    features: ['Skickas inom 24h', 'Interaktiv PDF med länkar', 'Enkel att vidarebefordra', 'Alltid senaste versionen'],
    price: 'Gratis',
    priceNote: '',
    Icon: FileDown,
    color: '#e76f51',
  },
];

const BusinessCatalog = () => {
  const [selectedType, setSelectedType] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    company_name: '', contact_person: '', email: '',
    phone: '', address: '', postal_code: '', city: '',
    quantity: 1, message: '',
  });

  const updateField = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedType) { toast.error('Välj en katalogtyp'); return; }
    if (!form.company_name.trim() || !form.contact_person.trim() || !form.email.trim() || !form.phone.trim()) {
      toast.error('Fyll i alla obligatoriska fält');
      return;
    }
    if (selectedType === 'physical' && (!form.address.trim() || !form.postal_code.trim() || !form.city.trim())) {
      toast.error('Fyll i leveransadress för fysisk katalog');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/catalog/order', { ...form, catalog_type: selectedType });
      setSubmitted(true);
      toast.success('Katalogbeställning skickad!');
    } catch {
      toast.error('Kunde inte skicka beställningen. Försök igen.');
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
            {selectedType === 'physical'
              ? 'Din fysiska katalog skickas inom 5-7 arbetsdagar till angiven adress.'
              : 'Din digitala katalog skickas till din e-post inom 24 timmar.'}
          </p>
          <p className="text-sm text-slate-400 mb-6">Vi kontaktar dig om vi behöver mer information.</p>
          <Button className="bg-[#2a9d8f] hover:bg-[#238b7e]" onClick={() => { setSubmitted(false); setSelectedType(null); setForm({ company_name: '', contact_person: '', email: '', phone: '', address: '', postal_code: '', city: '', quantity: 1, message: '' }); }} data-testid="order-another-btn">
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
              <Building2 className="w-4 h-4" />
              För företag
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-5 leading-tight">
              Beställ vår <span className="text-[#2a9d8f]">produktkatalog</span>
            </h1>
            <p className="text-lg text-slate-300 leading-relaxed mb-8 max-w-xl">
              Visa upp hela vårt sortiment för dina anställda eller kunder. Välj mellan en fysisk broschyr eller en digital PDF – helt gratis.
            </p>
            <div className="flex flex-wrap gap-6 text-sm text-slate-400">
              <span className="flex items-center gap-2"><Package className="w-4 h-4 text-[#2a9d8f]" />Muggar, t-shirts, hoodies</span>
              <span className="flex items-center gap-2"><Package className="w-4 h-4 text-[#2a9d8f]" />Kalendrar & fotoalbum</span>
              <span className="flex items-center gap-2"><Package className="w-4 h-4 text-[#2a9d8f]" />Namnlappar & posters</span>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 py-12 sm:py-16">
        {/* Step 1: Choose catalog type */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <span className="w-8 h-8 rounded-full bg-[#2a9d8f] text-white text-sm font-bold flex items-center justify-center">1</span>
            <h2 className="text-xl font-bold text-slate-900">Välj katalogtyp</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5" data-testid="catalog-type-grid">
            {CATALOG_TYPES.map(cat => {
              const isSelected = selectedType === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedType(cat.id)}
                  className={`relative text-left p-6 rounded-2xl border-2 transition-all duration-200 ${
                    isSelected
                      ? 'border-[#2a9d8f] bg-[#2a9d8f]/5 shadow-md'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
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

        {/* Step 2: Order form */}
        <div>
          <div className="flex items-center gap-3 mb-6">
            <span className="w-8 h-8 rounded-full bg-[#2a9d8f] text-white text-sm font-bold flex items-center justify-center">2</span>
            <h2 className="text-xl font-bold text-slate-900">Fyll i företagsuppgifter</h2>
          </div>

          <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 shadow-sm" data-testid="catalog-order-form">
            <div className="p-6 sm:p-8 space-y-6">
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

              {/* Delivery address - only for physical */}
              {selectedType === 'physical' && (
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

              {/* Quantity (physical only) */}
              {selectedType === 'physical' && (
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1.5">Antal kataloger (max 5)</label>
                  <div className="flex items-center gap-3">
                    <button type="button" onClick={() => updateField('quantity', Math.max(1, form.quantity - 1))} className="w-10 h-10 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors text-lg font-medium" data-testid="qty-decrease">-</button>
                    <span className="w-10 text-center font-semibold text-lg" data-testid="qty-display">{form.quantity}</span>
                    <button type="button" onClick={() => updateField('quantity', Math.min(5, form.quantity + 1))} className="w-10 h-10 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors text-lg font-medium" data-testid="qty-increase">+</button>
                  </div>
                </div>
              )}

              {/* Message */}
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1.5">Meddelande (valfritt)</label>
                <textarea
                  value={form.message}
                  onChange={e => updateField('message', e.target.value)}
                  placeholder="Berätta gärna om ni har speciella önskemål..."
                  rows={3}
                  className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2a9d8f]/30 focus:border-[#2a9d8f] resize-none"
                  data-testid="input-message"
                />
              </div>
            </div>

            {/* Submit */}
            <div className="px-6 sm:px-8 py-5 bg-slate-50 border-t rounded-b-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-sm text-slate-500">
                {selectedType ? (
                  <>Katalogtyp: <strong className="text-slate-700">{selectedType === 'physical' ? 'Fysisk broschyr' : 'Digital PDF'}</strong></>
                ) : (
                  <span className="text-amber-600">Välj en katalogtyp ovan</span>
                )}
              </p>
              <Button
                type="submit"
                className="bg-[#2a9d8f] hover:bg-[#238b7e] h-12 px-8 text-base font-semibold"
                disabled={!selectedType || submitting}
                data-testid="submit-catalog-order"
              >
                {submitting ? 'Skickar...' : (
                  <><Send className="w-4 h-4 mr-2" />Skicka beställning</>
                )}
              </Button>
            </div>
          </form>
        </div>

        {/* Info section */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { Icon: Truck, title: 'Fri frakt', desc: 'Fysiska kataloger levereras kostnadsfritt till hela Sverige.' },
            { Icon: Mail, title: 'Snabb digital leverans', desc: 'PDF-katalogen skickas till din e-post inom 24 timmar.' },
            { Icon: Building2, title: 'Företagsanpassat', desc: 'Kontakta oss för skräddarsydda kataloger med ert varumärke.' },
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
