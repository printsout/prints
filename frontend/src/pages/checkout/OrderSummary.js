import { CreditCard, ShieldCheck } from 'lucide-react';
import { Button } from '../../components/ui/button';

const OrderSummary = ({
  cart, products, pricing, couponCode, setCouponCode, appliedCoupon,
  setAppliedCoupon, couponLoading, onApplyCoupon, processing, checkoutUrl, shippingConfig
}) => {
  const { subtotal, discountAmount, discountLabel, shipping, total, vatAmount } = pricing;

  return (
    <div className="bg-white rounded-xl p-6 shadow-soft sticky top-24">
      <h2 className="text-lg font-semibold text-slate-900 mb-6">Din beställning</h2>

      {/* Items */}
      <div className="space-y-4 mb-6">
        {cart.items?.map((item) => {
          const product = products[item.product_id];
          if (!product) return null;
          const itemPrice = item.price || product.price;
          return (
            <div key={item.cart_item_id} className="flex gap-3">
              <div className="w-16 h-16 rounded-lg overflow-hidden bg-slate-100 shrink-0">
                <img src={item.design_preview || item.image || product.images?.[0]} alt={item.name || product.name} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{item.name || product.name}</p>
                <p className="text-xs text-slate-500">{item.quantity || 1} st x {itemPrice} kr</p>
              </div>
              <p className="font-medium text-sm">{((item.quantity || 1) * itemPrice).toFixed(0)} kr</p>
            </div>
          );
        })}
      </div>

      {/* Totals */}
      <div className="space-y-3 text-sm border-t pt-4">
        <div className="flex justify-between">
          <span className="text-slate-600">Delsumma</span>
          <span>{subtotal.toFixed(2)} kr</span>
        </div>
        {discountAmount > 0 && (
          <div className="flex justify-between text-[#2a9d8f]">
            <span>{discountLabel}</span>
            <span>-{discountAmount} kr</span>
          </div>
        )}

        {/* Coupon */}
        <div className="pt-1">
          <label className="block text-xs text-slate-500 mb-1">Rabattkod</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              placeholder="Ange kod"
              className="flex-1 px-3 py-1.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2a9d8f]/50 font-mono"
              data-testid="checkout-coupon-code-input"
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); onApplyCoupon(); }}}
            />
            <button type="button" onClick={onApplyCoupon} disabled={couponLoading || !couponCode.trim()} className="px-3 py-1.5 text-sm bg-slate-800 text-white rounded-lg hover:bg-slate-700 disabled:opacity-50 transition-colors" data-testid="checkout-apply-coupon-btn">
              {couponLoading ? '...' : 'Använd'}
            </button>
          </div>
          {appliedCoupon && (
            <div className="flex items-center justify-between mt-1.5">
              <span className="text-xs text-[#2a9d8f] font-medium">{appliedCoupon.code} — {appliedCoupon.discount_percent}% rabatt</span>
              <button type="button" onClick={() => { setAppliedCoupon(null); setCouponCode(''); }} className="text-xs text-red-500 hover:underline" data-testid="checkout-remove-coupon-btn">Ta bort</button>
            </div>
          )}
        </div>

        <div className="flex justify-between">
          <span className="text-slate-600">Frakt</span>
          <span>{shipping === 0 ? 'Gratis' : `${shipping} kr`}</span>
        </div>
        <div className="flex justify-between text-lg font-semibold border-t pt-3">
          <span>Totalt</span>
          <span className="text-primary">{total.toFixed(2)} kr</span>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          {vatAmount > 0 ? `varav moms (${shippingConfig.tax_rate}%): ${vatAmount.toFixed(2)} kr` : 'exkl. moms'}
        </p>
      </div>

      <Button type="submit" className="btn-primary w-full mt-6" disabled={processing} data-testid="submit-order">
        {processing ? (
          <><div className="spinner w-5 h-5 mr-2" />Omdirigerar till Stripe...</>
        ) : (
          `Betala ${total.toFixed(2)} kr`
        )}
      </Button>

      {processing && checkoutUrl && (
        <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-center">
          <p className="text-sm text-amber-800 mb-2">Omdirigeras inte? Klicka här:</p>
          <a href={checkoutUrl} className="text-sm font-semibold text-[#2a9d8f] hover:underline" data-testid="stripe-fallback-link">Gå till betalningssidan</a>
        </div>
      )}

      <div className="flex items-center justify-center gap-2 mt-4 text-xs text-slate-500">
        <ShieldCheck className="w-4 h-4" />
        <span>Säker betalning via Stripe</span>
      </div>
    </div>
  );
};

export default OrderSummary;
