import { useState, useEffect } from 'react';
import { useAdmin } from '../../context/AdminContext';
import api from '../../services/api';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { toast } from 'sonner';
import { Save, Globe, Mail, Phone, MapPin, Facebook, Instagram, Twitter, Truck } from 'lucide-react';

const AdminSettings = () => {
  const { getAuthHeaders } = useAdmin();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    site_name: 'Printout',
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
  });
  const [savingShipping, setSavingShipping] = useState(false);

  useEffect(() => {
    fetchSettings();
    fetchShippingSettings();
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
                placeholder="Printout"
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
