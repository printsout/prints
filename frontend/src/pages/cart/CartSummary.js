import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '../../components/ui/button';

export function CartSummary({
  subtotal, discountAmount, discountLabel, afterDiscount,
  shipping, total, vatAmount, shippingConfig,
  couponCode, setCouponCode, appliedCoupon, couponLoading,
  applyCoupon, removeCoupon,
}) {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-xl p-6 shadow-soft sticky top-24">
      <h2 className="text-lg font-semibold text-slate-900 mb-6">Sammanfattning</h2>

      <div className="space-y-3 text-sm">
        <div className="flex justify-between">
          <span className="text-slate-600">Delsumma</span>
          <span className="font-medium">{subtotal.toFixed(2)} kr</span>
        </div>

        {discountAmount > 0 && (
          <div className="flex justify-between text-[#2a9d8f]">
            <span>{discountLabel}</span>
            <span className="font-medium">-{discountAmount} kr</span>
          </div>
        )}

        {/* Coupon input */}
        <div className="pt-2">
          <label className="block text-xs text-slate-500 mb-1">Rabattkod</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              placeholder="Ange kod"
              className="flex-1 px-3 py-1.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2a9d8f]/50 font-mono"
              data-testid="coupon-code-input"
              onKeyDown={(e) => e.key === 'Enter' && applyCoupon()}
            />
            <button
              onClick={applyCoupon}
              disabled={couponLoading || !couponCode.trim()}
              className="px-3 py-1.5 text-sm bg-slate-800 text-white rounded-lg hover:bg-slate-700 disabled:opacity-50 transition-colors"
              data-testid="apply-coupon-btn"
            >
              {couponLoading ? '...' : 'Använd'}
            </button>
          </div>
          {appliedCoupon && (
            <div className="flex items-center justify-between mt-1.5">
              <span className="text-xs text-[#2a9d8f] font-medium">{appliedCoupon.code} — {appliedCoupon.discount_percent}% rabatt</span>
              <button onClick={removeCoupon} className="text-xs text-red-500 hover:underline" data-testid="remove-coupon-btn">Ta bort</button>
            </div>
          )}
        </div>

        <div className="flex justify-between">
          <span className="text-slate-600">Frakt</span>
          <span className="font-medium">{shipping === 0 ? 'Gratis' : `${shipping} kr`}</span>
        </div>

        {shipping > 0 && shippingConfig.free_shipping_threshold > 0 && afterDiscount < shippingConfig.free_shipping_threshold && (
          <p className="text-xs text-slate-500">
            Handla för {(shippingConfig.free_shipping_threshold - afterDiscount).toFixed(0)} kr till för fri frakt!
          </p>
        )}

        <div className="border-t pt-3 mt-3">
          <div className="flex justify-between text-lg font-semibold">
            <span>Totalt</span>
            <span className="text-primary">{total.toFixed(2)} kr</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {vatAmount > 0 ? `varav moms (${shippingConfig.tax_rate}%): ${vatAmount.toFixed(2)} kr` : 'exkl. moms'}
          </p>
        </div>
      </div>

      <Button className="btn-primary w-full mt-6" onClick={() => navigate('/kassa')} data-testid="checkout-button">
        Till kassan
        <ArrowRight className="w-5 h-5 ml-2" />
      </Button>

      <Link to="/produkter" className="block text-center text-sm text-slate-500 hover:text-primary mt-4" data-testid="continue-shopping">
        Fortsätt handla
      </Link>
    </div>
  );
}
