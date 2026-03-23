import { useState, useEffect } from 'react';
import { useAdmin } from '../../context/AdminContext';
import api from '../../services/api';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { toast } from 'sonner';
import { Save, Globe, Mail, Phone, MapPin, Facebook, Instagram, Twitter, Truck, Percent, Plus, Trash2, ToggleLeft, ToggleRight, Send } from 'lucide-react';

const AdminSettings = () => {
  const { getAuthHeaders } = useAdmin();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    site_name: 'Printsout',
    site_logo: '',
    contact_email: 'info@printout.se',
    phone: '',
    address: '',
    social_links: {
      facebook: '',
      instagram: '',
      twitter: ''
    }
  });

  const [shippingSettings, setShippingSettings] = useState({
    shipping_enabled: true,
    shipping_cost: 49,
    free_shipping_threshold: 500,
    discount_enabled: false,
    discount_percent: 0,
  });
  const [savingShipping, setSavingShipping] = useState(false);

  // Discount codes
  const [discountCodes, setDiscountCodes] = useState([]);
  const [newCode, setNewCode] = useState({ code: '', discount_percent: 10, max_uses: 0, expires_at: '' });
  const [sendingEmail, setSendingEmail] = useState(null);
  const [emailMessage, setEmailMessage] = useState('');

  useEffect(() => {
    fetchSettings();
    fetchShippingSettings();
    fetchDiscountCodes();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await api.get('/admin/settings', { headers: getAuthHeaders() });
      setSettings(prev => ({ ...prev, ...response.data }));
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchShippingSettings = async () => {
    try {
      const response = await api.get('/admin/payment-settings', { headers: getAuthHeaders() });
      setShippingSettings({
        shipping_enabled: response.data.shipping_enabled ?? true,
        shipping_cost: response.data.shipping_cost ?? 49,
        free_shipping_threshold: response.data.free_shipping_threshold ?? 500,
        discount_enabled: response.data.discount_enabled ?? false,
        discount_percent: response.data.discount_percent ?? 0,
      });
    } catch (error) {
      console.error('Failed to fetch shipping settings:', error);
    }
  };

  const handleSaveShipping = async () => {
    setSavingShipping(true);
    try {
      const currentSettings = await api.get('/admin/payment-settings', { headers: getAuthHeaders() });
      const merged = { ...currentSettings.data, ...shippingSettings };
      delete merged.type;
      await api.put('/admin/payment-settings', merged, { headers: getAuthHeaders() });
      toast.success('Fraktinställningar sparade');
    } catch (error) {
      console.error('Failed to save shipping settings:', error);
      toast.error('Kunde inte spara fraktinställningar');
    } finally {
      setSavingShipping(false);
    }
  };

  const fetchDiscountCodes = async () => {
    try {
      const response = await api.get('/admin/discount-codes', { headers: getAuthHeaders() });
      setDiscountCodes(response.data);
    } catch (error) {
      console.error('Failed to fetch discount codes:', error);
    }
  };

  const handleCreateCode = async () => {
    if (!newCode.code.trim()) {
      toast.error('Ange en rabattkod');
      return;
    }
    if (newCode.discount_percent <= 0 || newCode.discount_percent > 100) {
      toast.error('Rabatt måste vara mellan 1-100%');
      return;
    }
    try {
      await api.post('/admin/discount-codes', {
        ...newCode,
        code: newCode.code.trim().toUpperCase(),
        expires_at: newCode.expires_at || null,
      }, { headers: getAuthHeaders() });
      toast.success(`Rabattkod "${newCode.code.toUpperCase()}" skapad!`);
      setNewCode({ code: '', discount_percent: 10, max_uses: 0, expires_at: '' });
      fetchDiscountCodes();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Kunde inte skapa rabattkod');
    }
  };

  const handleToggleCode = async (code, currentActive) => {
    try {
      await api.put(`/admin/discount-codes/${code}`, { active: !currentActive }, { headers: getAuthHeaders() });
      fetchDiscountCodes();
      toast.success(`Kod "${code}" ${!currentActive ? 'aktiverad' : 'inaktiverad'}`);
    } catch (error) {
      toast.error('Kunde inte uppdatera koden');
    }
  };

  const handleDeleteCode = async (code) => {
    try {
      await api.delete(`/admin/discount-codes/${code}`, { headers: getAuthHeaders() });
      fetchDiscountCodes();
      toast.success(`Kod "${code}" raderad`);
    } catch (error) {
      toast.error('Kunde inte radera koden');
    }
  };

  const handleSendEmail = async (code) => {
    if (!window.confirm(`Skicka rabattkod "${code}" till ALLA kunder via e-post?`)) return;
    setSendingEmail(code);
    try {
      const res = await api.post('/admin/send-discount-email', {
        code,
        message: emailMessage,
      }, { headers: getAuthHeaders() });
      toast.success(`${res.data.message}${res.data.failed_count > 0 ? ` (${res.data.failed_count} misslyckades)` : ''}`);
      setEmailMessage('');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Kunde inte skicka e-post');
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
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast.error('Kunde inte spara inställningar');
    } finally {
      setSaving(false);
    }
  };

  const updateSocialLink = (platform, value) => {
    setSettings(prev => ({
      ...prev,
      social_links: {
        ...prev.social_links,
        [platform]: value
      }
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
      {/* Header */}
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
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Butiksnamn
              </label>
              <Input
                value={settings.site_name}
                onChange={(e) => setSettings(prev => ({ ...prev, site_name: e.target.value }))}
                placeholder="Printsout"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Logotyp URL
              </label>
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
              <label className="block text-sm font-medium text-slate-700 mb-1">
                E-post
              </label>
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
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Telefon
              </label>
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
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Adress
              </label>
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
          <h2 className="text-lg font-semibold text-slate-900 mb-6">
            Sociala medier
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Facebook
              </label>
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
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Instagram
              </label>
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
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Twitter/X
              </label>
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

        {/* Shipping Settings */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-6 flex items-center gap-2">
            <Truck className="w-5 h-5" />
            Frakt
          </h2>

          <div className="space-y-5">
            {/* Toggle shipping on/off */}
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-700">Aktivera frakt</p>
                <p className="text-sm text-slate-500">Stäng av för att erbjuda gratis frakt på alla ordrar</p>
              </div>
              <button
                type="button"
                onClick={() => setShippingSettings(prev => ({ ...prev, shipping_enabled: !prev.shipping_enabled }))}
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                  shippingSettings.shipping_enabled ? 'bg-[#2a9d8f]' : 'bg-slate-300'
                }`}
                data-testid="shipping-toggle"
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                    shippingSettings.shipping_enabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {shippingSettings.shipping_enabled && (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Fraktkostnad (kr)
                  </label>
                  <Input
                    type="number"
                    min="0"
                    value={shippingSettings.shipping_cost}
                    onChange={(e) => setShippingSettings(prev => ({ ...prev, shipping_cost: parseFloat(e.target.value) || 0 }))}
                    data-testid="shipping-cost-input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Fri frakt-gräns (kr)
                  </label>
                  <p className="text-xs text-slate-500 mb-1">
                    Ordrar över detta belopp får gratis frakt. Sätt till 0 för att alltid ta fraktkostnad.
                  </p>
                  <Input
                    type="number"
                    min="0"
                    value={shippingSettings.free_shipping_threshold}
                    onChange={(e) => setShippingSettings(prev => ({ ...prev, free_shipping_threshold: parseFloat(e.target.value) || 0 }))}
                    data-testid="free-shipping-threshold-input"
                  />
                </div>
              </>
            )}

            <div className="flex justify-end pt-2">
              <Button
                type="button"
                onClick={handleSaveShipping}
                disabled={savingShipping}
                className="min-w-[180px]"
                data-testid="save-shipping-btn"
              >
                {savingShipping ? 'Sparar...' : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Spara fraktinställningar
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Discount Settings */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-6 flex items-center gap-2">
            <Percent className="w-5 h-5" />
            Rabatt
          </h2>

          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-700">Aktivera rabatt</p>
                <p className="text-sm text-slate-500">Slå på för att ge alla kunder en procentuell rabatt</p>
              </div>
              <button
                type="button"
                onClick={() => setShippingSettings(prev => ({ ...prev, discount_enabled: !prev.discount_enabled }))}
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                  shippingSettings.discount_enabled ? 'bg-[#2a9d8f]' : 'bg-slate-300'
                }`}
                data-testid="discount-toggle"
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                    shippingSettings.discount_enabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {shippingSettings.discount_enabled && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Rabatt (%)
                </label>
                <p className="text-xs text-slate-500 mb-1">
                  Rabatten appliceras på hela orderns delsumma.
                </p>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={shippingSettings.discount_percent}
                  onChange={(e) => setShippingSettings(prev => ({ ...prev, discount_percent: Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)) }))}
                  data-testid="discount-percent-input"
                />
                {shippingSettings.discount_percent > 0 && (
                  <p className="text-sm text-[#2a9d8f] mt-2 font-medium">
                    Kunder får {shippingSettings.discount_percent}% rabatt på alla ordrar
                  </p>
                )}
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Button
                type="button"
                onClick={handleSaveShipping}
                disabled={savingShipping}
                className="min-w-[180px]"
                data-testid="save-discount-btn"
              >
                {savingShipping ? 'Sparar...' : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Spara rabattinställningar
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Discount Codes */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-6 flex items-center gap-2">
            <Percent className="w-5 h-5" />
            Rabattkoder
          </h2>

          {/* Create new code */}
          <div className="bg-slate-50 rounded-lg p-4 mb-6">
            <p className="font-medium text-slate-700 mb-3">Skapa ny rabattkod</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Kod</label>
                <Input
                  value={newCode.code}
                  onChange={(e) => setNewCode(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                  placeholder="T.ex. SOMMAR20"
                  data-testid="new-discount-code-input"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Rabatt (%)</label>
                <Input
                  type="number"
                  min="1"
                  max="100"
                  value={newCode.discount_percent}
                  onChange={(e) => setNewCode(prev => ({ ...prev, discount_percent: parseFloat(e.target.value) || 0 }))}
                  data-testid="new-discount-percent-input"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Max användningar (0 = obegränsat)</label>
                <Input
                  type="number"
                  min="0"
                  value={newCode.max_uses}
                  onChange={(e) => setNewCode(prev => ({ ...prev, max_uses: parseInt(e.target.value) || 0 }))}
                  data-testid="new-discount-max-uses-input"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Utgångsdatum (valfritt)</label>
                <Input
                  type="date"
                  value={newCode.expires_at ? newCode.expires_at.split('T')[0] : ''}
                  onChange={(e) => setNewCode(prev => ({ ...prev, expires_at: e.target.value ? new Date(e.target.value + 'T23:59:59Z').toISOString() : '' }))}
                  data-testid="new-discount-expires-input"
                />
              </div>
            </div>
            <div className="flex justify-end mt-3">
              <Button onClick={handleCreateCode} data-testid="create-discount-code-btn">
                <Plus className="w-4 h-4 mr-2" />
                Skapa kod
              </Button>
            </div>
          </div>

          {/* Optional email message */}
          {discountCodes.length > 0 && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Meddelande i e-post (valfritt)
              </label>
              <Input
                value={emailMessage}
                onChange={(e) => setEmailMessage(e.target.value)}
                placeholder="T.ex. Tack för att du är kund hos oss! Här är en rabatt..."
                data-testid="email-message-input"
              />
            </div>
          )}

          {/* Existing codes */}
          {discountCodes.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-4">Inga rabattkoder skapade ännu.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-2 font-medium text-slate-600">Kod</th>
                    <th className="pb-2 font-medium text-slate-600">Rabatt</th>
                    <th className="pb-2 font-medium text-slate-600">Användningar</th>
                    <th className="pb-2 font-medium text-slate-600">Utgår</th>
                    <th className="pb-2 font-medium text-slate-600">Status</th>
                    <th className="pb-2 font-medium text-slate-600 text-right">Åtgärd</th>
                  </tr>
                </thead>
                <tbody>
                  {discountCodes.map((dc) => (
                    <tr key={dc.code} className="border-b last:border-0" data-testid={`discount-code-row-${dc.code}`}>
                      <td className="py-3 font-mono font-bold text-slate-900">{dc.code}</td>
                      <td className="py-3">{dc.discount_percent}%</td>
                      <td className="py-3">{dc.current_uses} / {dc.max_uses === 0 ? '∞' : dc.max_uses}</td>
                      <td className="py-3">{dc.expires_at ? new Date(dc.expires_at).toLocaleDateString('sv-SE') : '—'}</td>
                      <td className="py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${dc.active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                          {dc.active ? 'Aktiv' : 'Inaktiv'}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleSendEmail(dc.code)}
                            disabled={sendingEmail === dc.code || !dc.active}
                            className="text-slate-500 hover:text-blue-600 transition-colors disabled:opacity-30"
                            title="Skicka till alla kunder via e-post"
                            data-testid={`email-code-${dc.code}`}
                          >
                            {sendingEmail === dc.code ? (
                              <span className="text-xs">Skickar...</span>
                            ) : (
                              <Send className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() => handleToggleCode(dc.code, dc.active)}
                            className="text-slate-500 hover:text-[#2a9d8f] transition-colors"
                            title={dc.active ? 'Inaktivera' : 'Aktivera'}
                            data-testid={`toggle-code-${dc.code}`}
                          >
                            {dc.active ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                          </button>
                          <button
                            onClick={() => handleDeleteCode(dc.code)}
                            className="text-slate-500 hover:text-red-500 transition-colors"
                            title="Radera"
                            data-testid={`delete-code-${dc.code}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button type="submit" disabled={saving} className="min-w-[150px]">
            {saving ? (
              'Sparar...'
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Spara inställningar
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AdminSettings;
