import { Save, Truck, Receipt } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';

const ShippingTaxSection = ({ shippingSettings, setShippingSettings, savingShipping, onSave }) => {
  return (
    <>
      {/* Shipping Settings */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-6 flex items-center gap-2">
          <Truck className="w-5 h-5" />
          Frakt
        </h2>

        <div className="space-y-5">
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
              onClick={onSave}
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

      {/* Tax Settings */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-6 flex items-center gap-2">
          <Receipt className="w-5 h-5" />
          Moms
        </h2>

        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-slate-700">Visa moms</p>
              <p className="text-sm text-slate-500">Stäng av för att dölja moms i kassan</p>
            </div>
            <button
              type="button"
              onClick={() => setShippingSettings(prev => ({ ...prev, tax_enabled: !prev.tax_enabled }))}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                shippingSettings.tax_enabled ? 'bg-[#2a9d8f]' : 'bg-slate-300'
              }`}
              data-testid="tax-toggle"
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                  shippingSettings.tax_enabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {shippingSettings.tax_enabled && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Momssats (%)
              </label>
              <Input
                type="number"
                min="0"
                max="100"
                value={shippingSettings.tax_rate}
                onChange={(e) => setShippingSettings(prev => ({ ...prev, tax_rate: parseFloat(e.target.value) || 0 }))}
                data-testid="tax-rate-input"
              />
            </div>
          )}

          <div className="flex justify-end pt-2">
            <Button
              type="button"
              onClick={onSave}
              disabled={savingShipping}
              className="min-w-[180px]"
              data-testid="save-tax-btn"
            >
              {savingShipping ? 'Sparar...' : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Spara momsinställningar
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ShippingTaxSection;
