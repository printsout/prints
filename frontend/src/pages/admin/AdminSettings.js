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

  const fetchSettings = useCallback(async () => {
    try {
      const response = await api.get('/admin/settings', { headers: getAuthHeaders() });
      setSettings(prev => ({ ...prev, ...response.data }));
    } catch (error) {
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
    } catch (error) {
      toast.error('Kunde inte hämta leveransinställningar');
    }
  }, [getAuthHeaders]);

  const fetchDiscountCodes = useCallback(async () => {
    try {
      const response = await api.get('/admin/discount-codes', { headers: getAuthHeaders() });
      setDiscountCodes(response.data);
    } catch (error) {
      toast.error('Kunde inte hämta rabattkoder');
    }
  }, [getAuthHeaders]);

  const fetch2FAStatus = useCallback(async () => {
    try {
      const res = await api.get('/admin/2fa-status', { headers: getAuthHeaders() });
      setTwoFAEnabled(res.data.enabled);
    } catch (error) {
      console.error('2FA status fetch failed:', error);
    }
  }, [getAuthHeaders]);

  useEffect(() => {
    fetchSettings();
    fetchShippingSettings();
    fetchDiscountCodes();
    fetch2FAStatus();
  }, [fetchSettings, fetchShippingSettings, fetchDiscountCodes, fetch2FAStatus]);

  const handleSaveShipping = async () => {
    setSavingShipping(true);
    try {
      const currentSettings = await api.get('/admin/payment-settings', { headers: getAuthHeaders() });
      const merged = { ...currentSettings.data, ...shippingSettings };
      delete merged.type;
      await api.put('/admin/payment-settings', merged, { headers: getAuthHeaders() });
      toast.success('Inställningar sparade');
    } catch (error) {
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

  const handleSendEmail = async (code, emailMessage) => {
    if (!window.confirm(`Skicka rabattkod "${code}" till ALLA kunder via e-post?`)) return;
    setSendingEmail(code);
    try {
      const res = await api.post('/admin/send-discount-email', {
        code,
        message: emailMessage,
      }, { headers: getAuthHeaders() });
      toast.success(`${res.data.message}${res.data.failed_count > 0 ? ` (${res.data.failed_count} misslyckades)` : ''}`);
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
      toast.error('Kunde inte spara inställningar');
    } finally {
      setSaving(false);
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
    </div>
  );
};

export default AdminSettings;
