import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { toast } from 'sonner';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { calculatePricing } from '../utils/pricing';
import { CheckoutShippingForm, PaymentMethodSelector } from './checkout/CheckoutForms';
import OrderSummary from './checkout/OrderSummary';

const Checkout = () => {
  const navigate = useNavigate();
  const { cart, sessionId } = useCart();
  const { user, token } = useAuth();

  const [products, setProducts] = useState({});
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [checkoutUrl, setCheckoutUrl] = useState(null);
  const [shippingConfig, setShippingConfig] = useState({ shipping_enabled: true, shipping_cost: 49, free_shipping_threshold: 500, discount_enabled: false, discount_percent: 0, tax_enabled: true, tax_rate: 25 });
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('card');

  const [formData, setFormData] = useState({
    email: user?.email || '',
    firstName: '',
    lastName: '',
    address: '',
    postalCode: '',
    city: '',
    phone: ''
  });

  useEffect(() => {
    if (!cart.items?.length) { navigate('/varukorg'); return; }
    const fetchProducts = async () => {
      try {
        const productIds = [...new Set(cart.items.map(item => item.product_id))];
        const productData = {};
        const isVirtual = (id) => id?.startsWith('print-') || id?.startsWith('our-catalog');
        await Promise.all(productIds.map(async (id) => {
          if (isVirtual(id)) {
            const ci = cart.items.find(i => i.product_id === id);
            productData[id] = { product_id: id, name: ci?.name || id, price: ci?.price || 0, imageUrl: null };
            return;
          }
          try {
            const response = await api.get(`/products/${id}`);
            productData[id] = response.data;
          } catch (err) {
            console.error('Failed to fetch product:', id, err);
          }
        }));
        setProducts(productData);
      } catch {
        toast.error('Kunde inte hämta produktinformation');
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [cart.items, navigate]);

  useEffect(() => {
    api.get('/shipping-settings').then(res => setShippingConfig(res.data)).catch(() => {
      toast.error('Kunde inte hämta fraktinställningar');
    });
  }, []);

  const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const pricing = calculatePricing(cart, products, shippingConfig, appliedCoupon);

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
    if (!formData.email || !formData.firstName || !formData.lastName || !formData.address || !formData.postalCode || !formData.city) {
      toast.error('Vänligen fyll i alla obligatoriska fält');
      return;
    }
    setProcessing(true);
    try {
      const headers = { 'Origin': window.location.origin };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const response = await api.post('/payments/checkout', {
        cart_session_id: sessionId,
        email: formData.email,
        payment_method: paymentMethod,
        shipping_address: {
          first_name: formData.firstName,
          last_name: formData.lastName,
          address: formData.address,
          postal_code: formData.postalCode,
          city: formData.city,
          phone: formData.phone
        }
      }, { headers });
      if (response.data.free_order) {
        toast.success('Beställning genomförd! (Gratis)');
        navigate(`/order-confirmation?order_id=${response.data.order_id}`);
      } else if (response.data.checkout_url) {
        setCheckoutUrl(response.data.checkout_url);
        try { window.location.assign(response.data.checkout_url); }
        catch { window.open(response.data.checkout_url, '_self'); }
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Kunde inte skapa betalning. Försök igen.');
      setProcessing(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="spinner"></div></div>;
  }

  return (
    <div className="min-h-screen bg-slate-50" data-testid="checkout-page">
      <div className="container-main py-12">
        <h1 className="text-3xl font-bold text-slate-900 mb-8">Kassa</h1>
        <form onSubmit={handleSubmit}>
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <CheckoutShippingForm formData={formData} handleChange={handleChange} />
              <PaymentMethodSelector paymentMethod={paymentMethod} setPaymentMethod={setPaymentMethod} />
            </div>
            <div className="lg:col-span-1">
              <OrderSummary
                cart={cart} products={products} pricing={pricing}
                couponCode={couponCode} setCouponCode={setCouponCode}
                appliedCoupon={appliedCoupon} setAppliedCoupon={setAppliedCoupon}
                couponLoading={couponLoading} onApplyCoupon={handleApplyCoupon}
                processing={processing} checkoutUrl={checkoutUrl}
                shippingConfig={shippingConfig}
              />
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Checkout;
