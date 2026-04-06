import { useState, useEffect, useCallback } from 'react';
import { useAdmin } from '../../context/AdminContext';
import api from '../../services/api';
import { Button } from '../../components/ui/button';
import { toast } from 'sonner';
import { Banknote, Save, Check, X, Percent } from 'lucide-react';
import { StripeCard, KlarnaCard, SwishCard, BankTransferCard } from './payments/PaymentMethodCards';

const AdminPayments = () => {
  const { getAuthHeaders } = useAdmin();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    currency: 'SEK', tax_rate: 25,
    stripe_enabled: true, stripe_publishable_key: '', stripe_secret_key: '',
    klarna_enabled: false, klarna_merchant_id: '', klarna_api_key: '',
    swish_enabled: false, swish_number: '', swish_certificate: '',
    bank_transfer_enabled: false, bank_name: '', bank_account: '', bank_iban: '', bank_bic: ''
  });

  const fetchSettings = useCallback(async () => {
    try {
      const response = await api.get('/admin/payment-settings', { headers: getAuthHeaders() });
      if (response.data && Object.keys(response.data).length > 0) {
        setSettings(prev => ({ ...prev, ...response.data }));
      }
    } catch {
      toast.error('Kunde inte hämta betalningsinställningar');
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders]);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/admin/payment-settings', settings, { headers: getAuthHeaders() });
      toast.success('Betalningsinställningar sparade');
    } catch {
      toast.error('Kunde inte spara inställningar');
    } finally {
      setSaving(false);
    }
  };

  const togglePaymentMethod = (method) => {
    setSettings(prev => ({ ...prev, [`${method}_enabled`]: !prev[`${method}_enabled`] }));
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="spinner" /></div>;

  const activeCount = [settings.stripe_enabled, settings.klarna_enabled, settings.swish_enabled, settings.bank_transfer_enabled].filter(Boolean);

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Betalningar</h1>
        <p className="text-slate-500">Konfigurera betalningsmetoder och inställningar</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* General Settings */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-6 flex items-center gap-2">
            <Banknote className="w-5 h-5" /> Allmänna inställningar
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Valuta</label>
              <select value={settings.currency} onChange={(e) => setSettings(prev => ({ ...prev, currency: e.target.value }))} className="w-full p-2 border border-slate-300 rounded-lg">
                <option value="SEK">SEK - Svenska kronor</option>
                <option value="EUR">EUR - Euro</option>
                <option value="USD">USD - US Dollar</option>
                <option value="NOK">NOK - Norska kronor</option>
                <option value="DKK">DKK - Danska kronor</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                <Percent className="w-4 h-4 inline mr-1" /> Momssats (%)
              </label>
              <input type="number" min="0" max="100" value={settings.tax_rate} onChange={(e) => setSettings(prev => ({ ...prev, tax_rate: parseFloat(e.target.value) || 0 }))} className="w-full p-2 border border-slate-300 rounded-lg" />
            </div>
          </div>
        </div>

        {/* Payment Methods */}
        <StripeCard settings={settings} setSettings={setSettings} onToggle={() => togglePaymentMethod('stripe')} />
        <KlarnaCard settings={settings} setSettings={setSettings} onToggle={() => togglePaymentMethod('klarna')} />
        <SwishCard settings={settings} setSettings={setSettings} onToggle={() => togglePaymentMethod('swish')} />
        <BankTransferCard settings={settings} setSettings={setSettings} onToggle={() => togglePaymentMethod('bank_transfer')} />

        {/* Active Methods Summary */}
        <div className="bg-slate-50 rounded-xl p-6">
          <h3 className="font-medium text-slate-900 mb-4">Aktiva betalningsmetoder</h3>
          <div className="flex flex-wrap gap-2">
            {settings.stripe_enabled && <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm"><Check className="w-4 h-4" /> Stripe</span>}
            {settings.klarna_enabled && <span className="inline-flex items-center gap-1 px-3 py-1 bg-pink-100 text-pink-700 rounded-full text-sm"><Check className="w-4 h-4" /> Klarna</span>}
            {settings.swish_enabled && <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm"><Check className="w-4 h-4" /> Swish</span>}
            {settings.bank_transfer_enabled && <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"><Check className="w-4 h-4" /> Banköverföring</span>}
            {activeCount.length === 0 && <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm"><X className="w-4 h-4" /> Ingen betalningsmetod aktiv</span>}
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={saving} className="min-w-[200px]">
            {saving ? 'Sparar...' : <><Save className="w-4 h-4 mr-2" /> Spara betalningsinställningar</>}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AdminPayments;
