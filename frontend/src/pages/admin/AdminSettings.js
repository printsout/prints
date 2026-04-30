import { useState, useEffect, useCallback } from 'react';
import { useAdmin } from '../../context/AdminContext';
import api from '../../services/api';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { toast } from 'sonner';
import { Save, Globe, Mail, Phone, MapPin, Facebook, Instagram, Twitter } from 'lucide-react';
import ShippingTaxSection from './settings/ShippingTaxSection';
import DiscountCodesSection from './settings/DiscountCodesSection';
import TwoFASection from './settings/TwoFASection';

const AdminSettings = () => {
  const { getAuthHeaders } = useAdmin();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    site_name: 'Printsout',
    site_logo: '',
    contact_email: 'info@printout.se',
    notification_email: 'info@printsout.se',
    phone: '',
    address: '',
    social_links: { facebook: '', instagram: '', twitter: '' }
  });

  const [shippingSettings, setShippingSettings] = useState({
    shipping_enabled: true,
    shipping_cost: 49,
    free_shipping_threshold: 500,
    discount_enabled: false,
    discount_percent: 0,
    tax_enabled: true,
    tax_rate: 25,
  });
  const [savingShipping, setSavingShipping] = useState(false);

  const [discountCodes, setDiscountCodes] = useState([]);
  const [sendingEmail, setSendingEmail] = useState(null);

  const [twoFAEnabled, setTwoFAEnabled] = useState(false);

  const [cardFonts, setCardFonts] = useState({
    name_size: 10, title_size: 7, company_size: 6, contact_size: 6, icon_size: 5.5
  });
  const [savingFonts, setSavingFonts] = useState(false);

  // Photo print pricing
  const [printSizes, setPrintSizes] = useState([]);
  const [printQualities, setPrintQualities] = useState([]);
  const [printPrices, setPrintPrices] = useState([]);
  const [savingPrint, setSavingPrint] = useState(false);
  const [newSize, setNewSize] = useState('');
  const [newQuality, setNewQuality] = useState('');

  const fetchSettings = useCallback(async () => {
    try {
      const response = await api.get('/admin/settings', { headers: getAuthHeaders() });
      setSettings(prev => ({ ...prev, ...response.data }));
    } catch {
      toast.error('Kunde inte hämta inställningar');
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders]);

  const fetchShippingSettings = useCallback(async () => {
    try {
      const response = await api.get('/admin/payment-settings', { headers: getAuthHeaders() });
      setShippingSettings({
        shipping_enabled: response.data.shipping_enabled ?? true,
        shipping_cost: response.data.shipping_cost ?? 49,
        free_shipping_threshold: response.data.free_shipping_threshold ?? 500,
        discount_enabled: response.data.discount_enabled ?? false,
        discount_percent: response.data.discount_percent ?? 0,
        tax_enabled: response.data.tax_enabled ?? true,
        tax_rate: response.data.tax_rate ?? 25,
      });
    } catch {
      toast.error('Kunde inte hämta leveransinställningar');
    }
  }, [getAuthHeaders]);

  const fetchDiscountCodes = useCallback(async () => {
    try {
      const response = await api.get('/admin/discount-codes', { headers: getAuthHeaders() });
      setDiscountCodes(response.data);
    } catch {
      toast.error('Kunde inte hämta rabattkoder');
    }
  }, [getAuthHeaders]);

  const fetch2FAStatus = useCallback(async () => {
    try {
      const res = await api.get('/admin/2fa-status', { headers: getAuthHeaders() });
      setTwoFAEnabled(res.data.enabled);
    } catch (e) {
      console.error('2FA status fetch failed:', e);
    }
  }, [getAuthHeaders]);

  useEffect(() => {
    fetchSettings();
    fetchShippingSettings();
    fetchDiscountCodes();
    fetch2FAStatus();
    // Fetch businesscard font settings
    api.get('/admin/businesscard-settings', { headers: getAuthHeaders() })
      .then(res => setCardFonts(prev => ({ ...prev, ...res.data })))
      .catch(() => {});
    // Fetch photo print pricing
    api.get('/admin/photo-print-settings', { headers: getAuthHeaders() })
      .then(res => {
        setPrintSizes(res.data.sizes || []);
        setPrintQualities(res.data.qualities || []);
        setPrintPrices(res.data.prices || []);
      })
      .catch(() => {});
  }, [fetchSettings, fetchShippingSettings, fetchDiscountCodes, fetch2FAStatus, getAuthHeaders]);

  const handleSaveShipping = async () => {
    setSavingShipping(true);
    try {
      const currentSettings = await api.get('/admin/payment-settings', { headers: getAuthHeaders() });
      const merged = { ...currentSettings.data, ...shippingSettings };
      delete merged.type;
      await api.put('/admin/payment-settings', merged, { headers: getAuthHeaders() });
      toast.success('Inställningar sparade');
    } catch {
      toast.error('Kunde inte spara inställningar');
    } finally {
      setSavingShipping(false);
    }
  };

  const handleCreateCode = async (codeData) => {
    try {
      await api.post('/admin/discount-codes', codeData, { headers: getAuthHeaders() });
      toast.success(`Rabattkod "${codeData.code}" skapad!`);
      fetchDiscountCodes();
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Kunde inte skapa rabattkod');
    }
  };

  const handleToggleCode = async (code, currentActive) => {
    try {
      await api.put(`/admin/discount-codes/${code}`, { active: !currentActive }, { headers: getAuthHeaders() });
      fetchDiscountCodes();
      toast.success(`Kod "${code}" ${!currentActive ? 'aktiverad' : 'inaktiverad'}`);
    } catch {
      toast.error('Kunde inte uppdatera koden');
    }
  };

  const handleDeleteCode = async (code) => {
    try {
      await api.delete(`/admin/discount-codes/${code}`, { headers: getAuthHeaders() });
      fetchDiscountCodes();
      toast.success(`Kod "${code}" raderad`);
    } catch {
      toast.error('Kunde inte radera koden');
    }
  };

  const handleSendEmail = async (code, emailMessage) => {
    if (!window.confirm(`Skicka rabattkod "${code}" till ALLA kunder via e-post?`)) return;
    setSendingEmail(code);
    try {
      const res = await api.post('/admin/send-discount-email', {
        code,
        message: emailMessage,
      }, { headers: getAuthHeaders() });
      toast.success(`${res.data.message}${res.data.failed_count > 0 ? ` (${res.data.failed_count} misslyckades)` : ''}`);
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Kunde inte skicka e-post');
    } finally {
      setSendingEmail(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/admin/settings', settings, { headers: getAuthHeaders() });
      toast.success('Inställningar sparade');
    } catch {
      toast.error('Kunde inte spara inställningar');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveCardFonts = async () => {
    setSavingFonts(true);
    try {
      await api.put('/admin/businesscard-settings', cardFonts, { headers: getAuthHeaders() });
      toast.success('Visitkortsinställningar sparade');
    } catch {
      toast.error('Kunde inte spara');
    } finally {
      setSavingFonts(false);
    }
  };

  const updateSocialLink = (platform, value) => {
    setSettings(prev => ({
      ...prev,
      social_links: { ...prev.social_links, [platform]: value }
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Inställningar</h1>
        <p className="text-slate-500">Hantera din butiks inställningar</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* General Settings */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-6 flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Allmänt
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Butiksnamn</label>
              <Input
                value={settings.site_name}
                onChange={(e) => setSettings(prev => ({ ...prev, site_name: e.target.value }))}
                placeholder="Printsout"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Logotyp URL</label>
              <Input
                value={settings.site_logo || ''}
                onChange={(e) => setSettings(prev => ({ ...prev, site_logo: e.target.value }))}
                placeholder="https://..."
              />
            </div>
          </div>
        </div>

        {/* Contact Settings */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-6 flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Kontaktuppgifter
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">E-post</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  type="email"
                  value={settings.contact_email}
                  onChange={(e) => setSettings(prev => ({ ...prev, contact_email: e.target.value }))}
                  placeholder="info@printout.se"
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Notifikationsmail (orderbekräftelser)</label>
              <p className="text-xs text-slate-400 mb-1.5">Hit skickas ett mail varje gång en kund beställer</p>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  type="email"
                  value={settings.notification_email}
                  onChange={(e) => setSettings(prev => ({ ...prev, notification_email: e.target.value }))}
                  placeholder="info@printsout.se"
                  className="pl-10"
                  data-testid="notification-email-input"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Telefon</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  value={settings.phone || ''}
                  onChange={(e) => setSettings(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="+46 70 123 45 67"
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Adress</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  value={settings.address || ''}
                  onChange={(e) => setSettings(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Storgatan 1, 123 45 Stockholm"
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Social Links */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-6">Sociala medier</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Facebook</label>
              <div className="relative">
                <Facebook className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  value={settings.social_links?.facebook || ''}
                  onChange={(e) => updateSocialLink('facebook', e.target.value)}
                  placeholder="https://facebook.com/printout"
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Instagram</label>
              <div className="relative">
                <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  value={settings.social_links?.instagram || ''}
                  onChange={(e) => updateSocialLink('instagram', e.target.value)}
                  placeholder="https://instagram.com/printout"
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Twitter/X</label>
              <div className="relative">
                <Twitter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  value={settings.social_links?.twitter || ''}
                  onChange={(e) => updateSocialLink('twitter', e.target.value)}
                  placeholder="https://twitter.com/printout"
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Shipping & Tax */}
        <ShippingTaxSection
          shippingSettings={shippingSettings}
          setShippingSettings={setShippingSettings}
          savingShipping={savingShipping}
          onSave={handleSaveShipping}
        />

        {/* Discount Codes */}
        <DiscountCodesSection
          shippingSettings={shippingSettings}
          setShippingSettings={setShippingSettings}
          savingShipping={savingShipping}
          onSaveShipping={handleSaveShipping}
          discountCodes={discountCodes}
          onCreateCode={handleCreateCode}
          onToggleCode={handleToggleCode}
          onDeleteCode={handleDeleteCode}
          onSendEmail={handleSendEmail}
          sendingEmail={sendingEmail}
        />

        {/* 2FA */}
        <TwoFASection
          getAuthHeaders={getAuthHeaders}
          twoFAEnabled={twoFAEnabled}
          setTwoFAEnabled={setTwoFAEnabled}
        />

        {/* Save Button */}
        <div className="flex justify-end">
          <Button type="submit" disabled={saving} className="min-w-[150px]">
            {saving ? 'Sparar...' : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Spara inställningar
              </>
            )}
          </Button>
        </div>
      </form>

      {/* Visitkort textstorlekar */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6" data-testid="card-font-settings">
        <h2 className="text-lg font-semibold text-slate-900 mb-2">Visitkort — Textstorlekar (PDF)</h2>
        <p className="text-sm text-slate-500 mb-6">Justera textstorlekarna som används i genererade visitkorts-PDF:er. Standard är 6–10pt.</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[
            { key: 'name_size', label: 'Namn', defaultVal: 10 },
            { key: 'title_size', label: 'Titel', defaultVal: 7 },
            { key: 'company_size', label: 'Företag', defaultVal: 6 },
            { key: 'contact_size', label: 'Kontaktinfo', defaultVal: 6 },
            { key: 'icon_size', label: 'Ikoner/prefix', defaultVal: 5.5 },
          ].map(({ key, label, defaultVal }) => (
            <div key={key}>
              <label className="block text-xs text-slate-500 mb-1">{label} <span className="text-slate-300">(std: {defaultVal}pt)</span></label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="4"
                  max="30"
                  step="0.5"
                  value={cardFonts[key] || defaultVal}
                  onChange={e => setCardFonts(prev => ({ ...prev, [key]: parseFloat(e.target.value) }))}
                  className="flex-1 accent-[#2a9d8f]"
                  data-testid={`font-${key}`}
                />
                <span className="text-sm font-mono font-bold text-slate-700 w-10 text-right">{cardFonts[key] || defaultVal}pt</span>
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-end mt-6">
          <Button onClick={handleSaveCardFonts} disabled={savingFonts} className="bg-[#2a9d8f] hover:bg-[#238b7e]" data-testid="save-card-fonts">
            {savingFonts ? 'Sparar...' : 'Spara textstorlekar'}
          </Button>
        </div>
      </div>

      {/* Fotoutskrift prissättning */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6" data-testid="photo-print-settings">
        <h2 className="text-lg font-semibold text-slate-900 mb-2">Fotoutskrift — Storlekar, Kvalitet & Priser</h2>
        <p className="text-sm text-slate-500 mb-6">Lägg till storlekar och kvalitetsnivåer. Ange pris för varje kombination.</p>

        {/* Sizes */}
        <div className="mb-5">
          <label className="block text-sm font-medium text-slate-700 mb-2">Storlekar</label>
          <div className="flex flex-wrap gap-2 mb-2">
            {printSizes.map((s, i) => (
              <span key={i} className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-slate-100 text-sm text-slate-700">
                {s}
                <button onClick={() => {
                  const newSizes = printSizes.filter((_, idx) => idx !== i);
                  setPrintSizes(newSizes);
                  setPrintPrices(printPrices.filter(p => p.size !== s));
                }} className="ml-1 text-red-400 hover:text-red-600">&times;</button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <Input value={newSize} onChange={e => setNewSize(e.target.value)} placeholder="T.ex. 10x15cm" className="max-w-[200px]" data-testid="new-size-input" />
            <Button type="button" variant="outline" size="sm" onClick={() => {
              if (newSize.trim() && !printSizes.includes(newSize.trim())) {
                setPrintSizes([...printSizes, newSize.trim()]);
                setNewSize('');
              }
            }} data-testid="add-size-btn">Lägg till</Button>
          </div>
        </div>

        {/* Qualities */}
        <div className="mb-5">
          <label className="block text-sm font-medium text-slate-700 mb-2">Kvalitetsnivåer</label>
          <div className="flex flex-wrap gap-2 mb-2">
            {printQualities.map((q, i) => (
              <span key={i} className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-slate-100 text-sm text-slate-700">
                {q}
                <button onClick={() => {
                  const newQuals = printQualities.filter((_, idx) => idx !== i);
                  setPrintQualities(newQuals);
                  setPrintPrices(printPrices.filter(p => p.quality !== q));
                }} className="ml-1 text-red-400 hover:text-red-600">&times;</button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <Input value={newQuality} onChange={e => setNewQuality(e.target.value)} placeholder="T.ex. Standard" className="max-w-[200px]" data-testid="new-quality-input" />
            <Button type="button" variant="outline" size="sm" onClick={() => {
              if (newQuality.trim() && !printQualities.includes(newQuality.trim())) {
                setPrintQualities([...printQualities, newQuality.trim()]);
                setNewQuality('');
              }
            }} data-testid="add-quality-btn">Lägg till</Button>
          </div>
        </div>

        {/* Price matrix */}
        {printSizes.length > 0 && printQualities.length > 0 && (
          <div className="mb-5">
            <label className="block text-sm font-medium text-slate-700 mb-2">Priser (kr)</label>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr>
                    <th className="border border-slate-200 px-3 py-2 bg-slate-50 text-left font-medium">Storlek</th>
                    {printQualities.map(q => (
                      <th key={q} className="border border-slate-200 px-3 py-2 bg-slate-50 text-center font-medium">{q}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {printSizes.map(size => (
                    <tr key={size}>
                      <td className="border border-slate-200 px-3 py-2 font-medium text-slate-700">{size}</td>
                      {printQualities.map(quality => {
                        const existing = printPrices.find(p => p.size === size && p.quality === quality);
                        return (
                          <td key={quality} className="border border-slate-200 px-1 py-1">
                            <input
                              type="number"
                              min="0"
                              step="1"
                              value={existing?.price || ''}
                              onChange={e => {
                                const price = parseFloat(e.target.value) || 0;
                                setPrintPrices(prev => {
                                  const filtered = prev.filter(p => !(p.size === size && p.quality === quality));
                                  return [...filtered, { size, quality, price }];
                                });
                              }}
                              placeholder="0"
                              className="w-full px-2 py-1 text-center rounded border-0 focus:ring-1 focus:ring-[#2a9d8f] text-sm"
                              data-testid={`price-${size}-${quality}`}
                            />
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <Button onClick={async () => {
            setSavingPrint(true);
            try {
              await api.put('/admin/photo-print-settings', { sizes: printSizes, qualities: printQualities, prices: printPrices }, { headers: getAuthHeaders() });
              toast.success('Fotoutskriftsinställningar sparade');
            } catch { toast.error('Kunde inte spara'); }
            finally { setSavingPrint(false); }
          }} disabled={savingPrint} className="bg-[#2a9d8f] hover:bg-[#238b7e]" data-testid="save-print-settings">
            {savingPrint ? 'Sparar...' : 'Spara priser'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
