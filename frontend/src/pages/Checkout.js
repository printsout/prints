import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, Truck, ShieldCheck } from 'lucide-react';
import api from '../services/api';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

const Checkout = () => {
  const navigate = useNavigate();
  const { cart, sessionId, clearCart } = useCart();
  const { user, token } = useAuth();
  
  const [products, setProducts] = useState({});
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [checkoutUrl, setCheckoutUrl] = useState(null);
  const [shippingConfig, setShippingConfig] = useState({ shipping_enabled: true, shipping_cost: 49, free_shipping_threshold: 500, discount_enabled: false, discount_percent: 0, tax_enabled: true, tax_rate: 25 });
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    email: user?.email || '',
    firstName: '',
    lastName: '',
    address: '',
    postalCode: '',
    city: '',
    phone: ''
  });

  const [paymentMethod, setPaymentMethod] = useState('card');

  useEffect(() => {
    if (!cart.items?.length) {
      navigate('/varukorg');
      return;
    }

    const fetchProducts = async () => {
      try {
        const productIds = [...new Set(cart.items.map(item => item.product_id))];
        const productData = {};
        
        await Promise.all(
          productIds.map(async (id) => {
            try {
              const response = await api.get(`/products/${id}`);
              productData[id] = response.data;
            } catch (e) {
            }
          })
        );
        
        setProducts(productData);
      } catch (error) {
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [cart.items, navigate]);

  useEffect(() => {
    api.get('/shipping-settings').then(res => setShippingConfig(res.data)).catch(() => {});
  }, []);

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const calculateTotal = () => {
    return cart.items?.reduce((total, item) => {
      const product = products[item.product_id];
      const itemPrice = item.price || product?.price || 0;
      return total + (itemPrice * (item.quantity || 1));
    }, 0) || 0;
  };

  const subtotal = calculateTotal();
  const globalDiscountAmount = shippingConfig.discount_enabled && shippingConfig.discount_percent > 0
    ? Math.round(subtotal * shippingConfig.discount_percent / 100)
    : 0;
  const couponDiscountAmount = appliedCoupon
    ? Math.round(subtotal * appliedCoupon.discount_percent / 100)
    : 0;
  const bestDiscount = Math.max(globalDiscountAmount, couponDiscountAmount);
  const discountLabel = couponDiscountAmount >= globalDiscountAmount && appliedCoupon
    ? `Rabattkod ${appliedCoupon.code} (${appliedCoupon.discount_percent}%)`
    : `Rabatt (${shippingConfig.discount_percent}%)`;
  const discountAmount = bestDiscount;
  const afterDiscount = subtotal - discountAmount;
  const shipping = !shippingConfig.shipping_enabled ? 0
    : (shippingConfig.free_shipping_threshold > 0 && afterDiscount >= shippingConfig.free_shipping_threshold) ? 0
    : shippingConfig.shipping_cost;
  const total = afterDiscount + shipping;
  const vatAmount = shippingConfig.tax_enabled
    ? Math.round(total * shippingConfig.tax_rate / (100 + shippingConfig.tax_rate) * 100) / 100
    : 0;

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    try {
      const res = await api.post('/validate-discount-code', { code: couponCode.trim() });
      setAppliedCoupon(res.data);
      toast.success(`Rabattkod "${res.data.code}" aktiverad! ${res.data.discount_percent}% rabatt`);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Ogiltig rabattkod');
      setAppliedCoupon(null);
    } finally {
      setCouponLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.email || !formData.firstName || !formData.lastName || 
        !formData.address || !formData.postalCode || !formData.city) {
      toast.error('Vänligen fyll i alla obligatoriska fält');
      return;
    }

    setProcessing(true);

    try {
      const checkoutData = {
        cart_session_id: sessionId,
        email: formData.email,
        shipping_address: {
          first_name: formData.firstName,
          last_name: formData.lastName,
          address: formData.address,
          postal_code: formData.postalCode,
          city: formData.city,
          phone: formData.phone
        }
      };

      const headers = { 'Origin': window.location.origin };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await api.post('/payments/checkout', checkoutData, { headers });

      if (response.data.checkout_url) {
        setCheckoutUrl(response.data.checkout_url);
        // Try redirect to Stripe
        try {
          window.location.assign(response.data.checkout_url);
        } catch (redirectErr) {
          // Fallback: open in same tab
          window.open(response.data.checkout_url, '_self');
        }
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error) {
      const errMsg = error.response?.data?.detail || 'Kunde inte skapa betalning. Försök igen.';
      toast.error(errMsg);
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50" data-testid="checkout-page">
      <div className="container-main py-12">
        <h1 className="text-3xl font-bold text-slate-900 mb-8">Kassa</h1>

        <form onSubmit={handleSubmit}>
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Form */}
            <div className="lg:col-span-2 space-y-8">
              {/* Contact */}
              <div className="bg-white rounded-xl p-6 shadow-soft">
                <h2 className="text-lg font-semibold text-slate-900 mb-6">
                  Kontaktuppgifter
                </h2>
                <div className="grid gap-4">
                  <div>
                    <Label htmlFor="email">E-post *</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      data-testid="input-email"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Telefon</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleChange}
                      data-testid="input-phone"
                    />
                  </div>
                </div>
              </div>

              {/* Shipping */}
              <div className="bg-white rounded-xl p-6 shadow-soft">
                <h2 className="text-lg font-semibold text-slate-900 mb-6 flex items-center gap-2">
                  <Truck className="w-5 h-5" />
                  Leveransadress
                </h2>
                <div className="grid gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">Förnamn *</Label>
                      <Input
                        id="firstName"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        required
                        data-testid="input-firstname"
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Efternamn *</Label>
                      <Input
                        id="lastName"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        required
                        data-testid="input-lastname"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="address">Adress *</Label>
                    <Input
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      required
                      data-testid="input-address"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="postalCode">Postnummer *</Label>
                      <Input
                        id="postalCode"
                        name="postalCode"
                        value={formData.postalCode}
                        onChange={handleChange}
                        required
                        data-testid="input-postalcode"
                      />
                    </div>
                    <div>
                      <Label htmlFor="city">Stad *</Label>
                      <Input
                        id="city"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        required
                        data-testid="input-city"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment */}
              <div className="bg-white rounded-xl p-6 shadow-soft">
                <h2 className="text-lg font-semibold text-slate-900 mb-6 flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Betalningsmetod
                </h2>
                <div className="space-y-3">
                  <label 
                    className={`flex items-center gap-4 p-4 border rounded-lg cursor-pointer transition-all ${
                      paymentMethod === 'card' ? 'border-primary bg-primary/5' : 'border-slate-200 hover:border-slate-300'
                    }`}
                    data-testid="payment-card"
                  >
                    <input
                      type="radio"
                      name="payment"
                      value="card"
                      checked={paymentMethod === 'card'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="text-primary"
                    />
                    <div className="flex-1">
                      <p className="font-medium">Kort (Visa/Mastercard)</p>
                      <p className="text-sm text-slate-500">Säker betalning via Stripe</p>
                    </div>
                    <span className="text-xs font-bold text-[#1A1F71] border border-[#1A1F71] rounded px-1.5 py-0.5">VISA</span>
                    <span className="text-xs font-bold text-white bg-[#EB001B] rounded px-1.5 py-0.5">MC</span>
                  </label>

                  <label 
                    className={`flex items-center gap-4 p-4 border rounded-lg cursor-pointer transition-all opacity-60 ${
                      paymentMethod === 'swish' ? 'border-primary bg-primary/5' : 'border-slate-200'
                    }`}
                    data-testid="payment-swish"
                  >
                    <input
                      type="radio"
                      name="payment"
                      value="swish"
                      checked={paymentMethod === 'swish'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="text-primary"
                      disabled
                    />
                    <div className="flex-1">
                      <p className="font-medium">Swish</p>
                      <p className="text-sm text-slate-500">Kommer snart</p>
                    </div>
                    <span className="text-xs bg-slate-100 px-2 py-1 rounded">Snart</span>
                  </label>

                  <label 
                    className={`flex items-center gap-4 p-4 border rounded-lg cursor-pointer transition-all opacity-60 ${
                      paymentMethod === 'klarna' ? 'border-primary bg-primary/5' : 'border-slate-200'
                    }`}
                    data-testid="payment-klarna"
                  >
                    <input
                      type="radio"
                      name="payment"
                      value="klarna"
                      checked={paymentMethod === 'klarna'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="text-primary"
                      disabled
                    />
                    <div className="flex-1">
                      <p className="font-medium">Klarna</p>
                      <p className="text-sm text-slate-500">Kommer snart</p>
                    </div>
                    <span className="text-xs bg-slate-100 px-2 py-1 rounded">Snart</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl p-6 shadow-soft sticky top-24">
                <h2 className="text-lg font-semibold text-slate-900 mb-6">
                  Din beställning
                </h2>

                {/* Items */}
                <div className="space-y-4 mb-6">
                  {cart.items?.map((item) => {
                    const product = products[item.product_id];
                    if (!product) return null;
                    const itemPrice = item.price || product.price;

                    return (
                      <div key={item.cart_item_id} className="flex gap-3">
                        <div className="w-16 h-16 rounded-lg overflow-hidden bg-slate-100 shrink-0">
                          <img 
                            src={item.design_preview || item.image || product.images?.[0]}
                            alt={item.name || product.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{item.name || product.name}</p>
                          <p className="text-xs text-slate-500">
                            {item.quantity || 1} st × {itemPrice} kr
                          </p>
                        </div>
                        <p className="font-medium text-sm">
                          {((item.quantity || 1) * itemPrice).toFixed(0)} kr
                        </p>
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

                  {/* Coupon code input */}
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
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleApplyCoupon())}
                      />
                      <button
                        type="button"
                        onClick={handleApplyCoupon}
                        disabled={couponLoading || !couponCode.trim()}
                        className="px-3 py-1.5 text-sm bg-slate-800 text-white rounded-lg hover:bg-slate-700 disabled:opacity-50 transition-colors"
                        data-testid="checkout-apply-coupon-btn"
                      >
                        {couponLoading ? '...' : 'Använd'}
                      </button>
                    </div>
                    {appliedCoupon && (
                      <div className="flex items-center justify-between mt-1.5">
                        <span className="text-xs text-[#2a9d8f] font-medium">{appliedCoupon.code} — {appliedCoupon.discount_percent}% rabatt</span>
                        <button
                          type="button"
                          onClick={() => { setAppliedCoupon(null); setCouponCode(''); }}
                          className="text-xs text-red-500 hover:underline"
                          data-testid="checkout-remove-coupon-btn"
                        >
                          Ta bort
                        </button>
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

                <Button 
                  type="submit"
                  className="btn-primary w-full mt-6"
                  disabled={processing}
                  data-testid="submit-order"
                >
                  {processing ? (
                    <>
                      <div className="spinner w-5 h-5 mr-2" />
                      Omdirigerar till Stripe...
                    </>
                  ) : (
                    `Betala ${total.toFixed(2)} kr`
                  )}
                </Button>

                {/* Fallback link if redirect doesn't work */}
                {processing && checkoutUrl && (
                  <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-center">
                    <p className="text-sm text-amber-800 mb-2">Omdirigeras inte? Klicka här:</p>
                    <a 
                      href={checkoutUrl}
                      className="text-sm font-semibold text-[#2a9d8f] hover:underline"
                      data-testid="stripe-fallback-link"
                    >
                      Gå till betalningssidan
                    </a>
                  </div>
                )}

                {/* Security badge */}
                <div className="flex items-center justify-center gap-2 mt-4 text-xs text-slate-500">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Säker betalning via Stripe</span>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Checkout;
