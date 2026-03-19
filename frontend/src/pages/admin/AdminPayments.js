import { useState, useEffect } from 'react';
import { useAdmin } from '../../context/AdminContext';
import api from '../../services/api';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { toast } from 'sonner';
import { 
  CreditCard, Save, Check, X, AlertCircle,
  Banknote, Smartphone, Building2, Percent
} from 'lucide-react';

const AdminPayments = () => {
  const { getAuthHeaders } = useAdmin();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    // Stripe
    stripe_enabled: true,
    stripe_test_mode: true,
    stripe_public_key: '',
    stripe_secret_key: '',
    
    // Klarna
    klarna_enabled: false,
    klarna_merchant_id: '',
    klarna_api_key: '',
    
    // Swish
    swish_enabled: false,
    swish_number: '',
    swish_certificate: '',
    
    // Bank transfer
    bank_transfer_enabled: false,
    bank_name: '',
    bank_account: '',
    bank_iban: '',
    bank_bic: '',
    
    // General
    currency: 'SEK',
    tax_rate: 25,
    free_shipping_threshold: 500,
    shipping_cost: 49
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await api.get('/admin/payment-settings', { headers: getAuthHeaders() });
      if (response.data && Object.keys(response.data).length > 0) {
        setSettings(prev => ({ ...prev, ...response.data }));
      }
    } catch (error) {
      console.error('Failed to fetch payment settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      await api.put('/admin/payment-settings', settings, { headers: getAuthHeaders() });
      toast.success('Betalningsinställningar sparade');
    } catch (error) {
      console.error('Failed to save payment settings:', error);
      toast.error('Kunde inte spara inställningar');
    } finally {
      setSaving(false);
    }
  };

  const togglePaymentMethod = (method) => {
    setSettings(prev => ({
      ...prev,
      [`${method}_enabled`]: !prev[`${method}_enabled`]
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
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Betalningar</h1>
        <p className="text-slate-500">Konfigurera betalningsmetoder och inställningar</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* General Settings */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-6 flex items-center gap-2">
            <Banknote className="w-5 h-5" />
            Allmänna inställningar
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Valuta
              </label>
              <select
                value={settings.currency}
                onChange={(e) => setSettings(prev => ({ ...prev, currency: e.target.value }))}
                className="w-full p-2 border border-slate-300 rounded-lg"
              >
                <option value="SEK">SEK - Svenska kronor</option>
                <option value="EUR">EUR - Euro</option>
                <option value="USD">USD - US Dollar</option>
                <option value="NOK">NOK - Norska kronor</option>
                <option value="DKK">DKK - Danska kronor</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                <Percent className="w-4 h-4 inline mr-1" />
                Momssats (%)
              </label>
              <Input
                type="number"
                value={settings.tax_rate}
                onChange={(e) => setSettings(prev => ({ ...prev, tax_rate: parseFloat(e.target.value) }))}
                min="0"
                max="100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Fri frakt över (kr)
              </label>
              <Input
                type="number"
                value={settings.free_shipping_threshold}
                onChange={(e) => setSettings(prev => ({ ...prev, free_shipping_threshold: parseFloat(e.target.value) }))}
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Fraktkostnad (kr)
              </label>
              <Input
                type="number"
                value={settings.shipping_cost}
                onChange={(e) => setSettings(prev => ({ ...prev, shipping_cost: parseFloat(e.target.value) }))}
                min="0"
              />
            </div>
          </div>
        </div>

        {/* Stripe */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div 
            className="p-6 flex items-center justify-between cursor-pointer hover:bg-slate-50"
            onClick={() => togglePaymentMethod('stripe')}
          >
            <div className="flex items-center gap-4">
              <div className="bg-purple-100 p-3 rounded-lg">
                <CreditCard className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">Stripe</h3>
                <p className="text-sm text-slate-500">Kort- och onlinebetalningar</p>
              </div>
            </div>
            <div className={`w-12 h-6 rounded-full transition-colors ${settings.stripe_enabled ? 'bg-green-500' : 'bg-slate-300'}`}>
              <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform mt-0.5 ${settings.stripe_enabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </div>
          </div>
          
          {settings.stripe_enabled && (
            <div className="p-6 pt-0 space-y-4 border-t border-slate-100">
              <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-lg">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                <p className="text-sm text-amber-700">
                  {settings.stripe_test_mode 
                    ? 'Testläge aktivt - inga riktiga betalningar processas'
                    : 'Live-läge aktivt - riktiga betalningar processas!'
                  }
                </p>
              </div>
              
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.stripe_test_mode}
                    onChange={(e) => setSettings(prev => ({ ...prev, stripe_test_mode: e.target.checked }))}
                    className="w-4 h-4 rounded border-slate-300"
                  />
                  <span className="text-sm text-slate-700">Testläge</span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Publishable Key
                </label>
                <Input
                  value={settings.stripe_public_key}
                  onChange={(e) => setSettings(prev => ({ ...prev, stripe_public_key: e.target.value }))}
                  placeholder="pk_test_..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Secret Key
                </label>
                <Input
                  type="password"
                  value={settings.stripe_secret_key}
                  onChange={(e) => setSettings(prev => ({ ...prev, stripe_secret_key: e.target.value }))}
                  placeholder="sk_test_..."
                />
              </div>
            </div>
          )}
        </div>

        {/* Klarna */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div 
            className="p-6 flex items-center justify-between cursor-pointer hover:bg-slate-50"
            onClick={() => togglePaymentMethod('klarna')}
          >
            <div className="flex items-center gap-4">
              <div className="bg-pink-100 p-3 rounded-lg">
                <span className="text-pink-600 font-bold text-lg">K</span>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">Klarna</h3>
                <p className="text-sm text-slate-500">Betala senare, delbetalning</p>
              </div>
            </div>
            <div className={`w-12 h-6 rounded-full transition-colors ${settings.klarna_enabled ? 'bg-green-500' : 'bg-slate-300'}`}>
              <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform mt-0.5 ${settings.klarna_enabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </div>
          </div>
          
          {settings.klarna_enabled && (
            <div className="p-6 pt-0 space-y-4 border-t border-slate-100">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Merchant ID
                </label>
                <Input
                  value={settings.klarna_merchant_id}
                  onChange={(e) => setSettings(prev => ({ ...prev, klarna_merchant_id: e.target.value }))}
                  placeholder="K12345..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  API Key
                </label>
                <Input
                  type="password"
                  value={settings.klarna_api_key}
                  onChange={(e) => setSettings(prev => ({ ...prev, klarna_api_key: e.target.value }))}
                  placeholder="Din Klarna API-nyckel"
                />
              </div>
            </div>
          )}
        </div>

        {/* Swish */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div 
            className="p-6 flex items-center justify-between cursor-pointer hover:bg-slate-50"
            onClick={() => togglePaymentMethod('swish')}
          >
            <div className="flex items-center gap-4">
              <div className="bg-green-100 p-3 rounded-lg">
                <Smartphone className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">Swish</h3>
                <p className="text-sm text-slate-500">Mobilbetalning för svenska kunder</p>
              </div>
            </div>
            <div className={`w-12 h-6 rounded-full transition-colors ${settings.swish_enabled ? 'bg-green-500' : 'bg-slate-300'}`}>
              <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform mt-0.5 ${settings.swish_enabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </div>
          </div>
          
          {settings.swish_enabled && (
            <div className="p-6 pt-0 space-y-4 border-t border-slate-100">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Swish-nummer
                </label>
                <Input
                  value={settings.swish_number}
                  onChange={(e) => setSettings(prev => ({ ...prev, swish_number: e.target.value }))}
                  placeholder="123 456 78 90"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Certifikat (Base64)
                </label>
                <textarea
                  value={settings.swish_certificate}
                  onChange={(e) => setSettings(prev => ({ ...prev, swish_certificate: e.target.value }))}
                  placeholder="Klistra in ditt Swish-certifikat här..."
                  className="w-full p-3 border border-slate-300 rounded-lg resize-none font-mono text-xs"
                  rows={3}
                />
              </div>
            </div>
          )}
        </div>

        {/* Bank Transfer */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div 
            className="p-6 flex items-center justify-between cursor-pointer hover:bg-slate-50"
            onClick={() => togglePaymentMethod('bank_transfer')}
          >
            <div className="flex items-center gap-4">
              <div className="bg-blue-100 p-3 rounded-lg">
                <Building2 className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">Banköverföring</h3>
                <p className="text-sm text-slate-500">Manuell betalning till bankkonto</p>
              </div>
            </div>
            <div className={`w-12 h-6 rounded-full transition-colors ${settings.bank_transfer_enabled ? 'bg-green-500' : 'bg-slate-300'}`}>
              <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform mt-0.5 ${settings.bank_transfer_enabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </div>
          </div>
          
          {settings.bank_transfer_enabled && (
            <div className="p-6 pt-0 space-y-4 border-t border-slate-100">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Bank
                  </label>
                  <Input
                    value={settings.bank_name}
                    onChange={(e) => setSettings(prev => ({ ...prev, bank_name: e.target.value }))}
                    placeholder="t.ex. Nordea"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Kontonummer
                  </label>
                  <Input
                    value={settings.bank_account}
                    onChange={(e) => setSettings(prev => ({ ...prev, bank_account: e.target.value }))}
                    placeholder="1234-5678901234"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    IBAN
                  </label>
                  <Input
                    value={settings.bank_iban}
                    onChange={(e) => setSettings(prev => ({ ...prev, bank_iban: e.target.value }))}
                    placeholder="SE00 0000 0000 0000 0000 0000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    BIC/SWIFT
                  </label>
                  <Input
                    value={settings.bank_bic}
                    onChange={(e) => setSettings(prev => ({ ...prev, bank_bic: e.target.value }))}
                    placeholder="NDEASESS"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Active Methods Summary */}
        <div className="bg-slate-50 rounded-xl p-6">
          <h3 className="font-medium text-slate-900 mb-4">Aktiva betalningsmetoder</h3>
          <div className="flex flex-wrap gap-2">
            {settings.stripe_enabled && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                <Check className="w-4 h-4" /> Stripe
              </span>
            )}
            {settings.klarna_enabled && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-pink-100 text-pink-700 rounded-full text-sm">
                <Check className="w-4 h-4" /> Klarna
              </span>
            )}
            {settings.swish_enabled && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                <Check className="w-4 h-4" /> Swish
              </span>
            )}
            {settings.bank_transfer_enabled && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                <Check className="w-4 h-4" /> Banköverföring
              </span>
            )}
            {!settings.stripe_enabled && !settings.klarna_enabled && !settings.swish_enabled && !settings.bank_transfer_enabled && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm">
                <X className="w-4 h-4" /> Ingen betalningsmetod aktiv
              </span>
            )}
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button type="submit" disabled={saving} className="min-w-[200px]">
            {saving ? (
              'Sparar...'
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Spara betalningsinställningar
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AdminPayments;
