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
  const { user } = useAuth();
  
  const [products, setProducts] = useState({});
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  
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
              const response = await axios.get(`${API}/products/${id}`);
              productData[id] = response.data;
            } catch (e) {
              console.error(`Failed to fetch product ${id}`);
            }
          })
        );
        
        setProducts(productData);
      } catch (error) {
        console.error('Failed to fetch products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [cart.items, navigate]);

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const calculateTotal = () => {
    return cart.items?.reduce((total, item) => {
      const product = products[item.product_id];
      if (product) {
        return total + (product.price * (item.quantity || 1));
      }
      return total;
    }, 0) || 0;
  };

  const subtotal = calculateTotal();
  const shipping = subtotal > 500 ? 0 : 49;
  const total = subtotal + shipping;

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

      const response = await axios.post(`${API}/payments/checkout`, checkoutData, {
        headers: {
          'Origin': window.location.origin
        }
      });

      if (response.data.checkout_url) {
        // Redirect to Stripe
        window.location.href = response.data.checkout_url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Kunde inte skapa betalning. Försök igen.');
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
                    <img 
                      src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" 
                      alt="Visa" 
                      className="h-6"
                    />
                    <img 
                      src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" 
                      alt="Mastercard" 
                      className="h-6"
                    />
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

                    return (
                      <div key={item.cart_item_id} className="flex gap-3">
                        <div className="w-16 h-16 rounded-lg overflow-hidden bg-slate-100 shrink-0">
                          <img 
                            src={item.design_preview || product.images?.[0]}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{product.name}</p>
                          <p className="text-xs text-slate-500">
                            {item.quantity || 1} st × {product.price} kr
                          </p>
                        </div>
                        <p className="font-medium text-sm">
                          {((item.quantity || 1) * product.price).toFixed(0)} kr
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
                  <div className="flex justify-between">
                    <span className="text-slate-600">Frakt</span>
                    <span>{shipping === 0 ? 'Gratis' : `${shipping} kr`}</span>
                  </div>
                  <div className="flex justify-between text-lg font-semibold border-t pt-3">
                    <span>Totalt</span>
                    <span className="text-primary">{total.toFixed(2)} kr</span>
                  </div>
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
                      Bearbetar...
                    </>
                  ) : (
                    `Betala ${total.toFixed(2)} kr`
                  )}
                </Button>

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
