import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react';
import api from '../services/api';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { useCart } from '../context/CartContext';

const Cart = () => {
  const navigate = useNavigate();
  const { cart, updateQuantity, removeFromCart, loading } = useCart();
  const [products, setProducts] = useState({});
  const [loadingProducts, setLoadingProducts] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      if (!cart.items?.length) {
        setLoadingProducts(false);
        return;
      }

      try {
        const productIds = [...new Set(cart.items.map(item => item.product_id))];
        const productData = {};
        
        await Promise.all(
          productIds.map(async (id) => {
            try {
              const response = await api.get(`/products/${id}`);
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
        setLoadingProducts(false);
      }
    };

    fetchProducts();
  }, [cart.items]);

  const handleQuantityChange = async (cartItemId, newQuantity) => {
    if (newQuantity < 1) return;
    try {
      await updateQuantity(cartItemId, newQuantity);
    } catch (error) {
      toast.error('Kunde inte uppdatera antal');
    }
  };

  const handleRemove = async (cartItemId) => {
    try {
      await removeFromCart(cartItemId);
      toast.success('Produkt borttagen');
    } catch (error) {
      toast.error('Kunde inte ta bort produkten');
    }
  };

  const calculateTotal = () => {
    return cart.items?.reduce((total, item) => {
      const product = products[item.product_id];
      const itemPrice = item.price || product?.price || 0;
      return total + (itemPrice * (item.quantity || 1));
    }, 0) || 0;
  };

  const subtotal = calculateTotal();
  const shipping = subtotal > 500 ? 0 : 49;
  const total = subtotal + shipping;

  if (loadingProducts) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50" data-testid="cart-page">
      <div className="container-main py-12">
        <h1 className="text-3xl font-bold text-slate-900 mb-8">Varukorg</h1>

        {!cart.items?.length ? (
          <div className="bg-white rounded-xl p-12 text-center shadow-soft">
            <ShoppingBag className="w-16 h-16 mx-auto text-slate-300 mb-4" />
            <h2 className="text-xl font-semibold text-slate-700 mb-2">
              Din varukorg är tom
            </h2>
            <p className="text-slate-500 mb-6">
              Börja handla och lägg till produkter i din varukorg
            </p>
            <Link to="/produkter">
              <Button className="btn-primary" data-testid="continue-shopping-empty">
                Börja handla
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {cart.items.map((item) => {
                const product = products[item.product_id];
                if (!product) return null;
                const itemPrice = item.price || product.price;
                const thumbUrl = item.design_preview
                  ? (item.design_preview.startsWith('/api') ? `${process.env.REACT_APP_BACKEND_URL}${item.design_preview}` : item.design_preview)
                  : item.image || product.images?.[0];

                return (
                  <div 
                    key={item.cart_item_id}
                    className="bg-white rounded-xl p-6 shadow-soft flex gap-6"
                    data-testid={`cart-item-${item.cart_item_id}`}
                  >
                    {/* Image */}
                    <div className="w-24 h-24 shrink-0 rounded-lg overflow-hidden bg-slate-100">
                      <img 
                        src={thumbUrl} 
                        alt={item.name || product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Details */}
                    <div className="flex-1">
                      <Link 
                        to={`/produkt/${product.product_id}`}
                        className="font-semibold text-slate-900 hover:text-primary"
                      >
                        {item.name || product.name}
                      </Link>
                      <div className="text-sm text-slate-500 mt-1 space-x-3">
                        {item.color && <span>Färg: {item.color}</span>}
                        {item.size && <span>Storlek: {item.size}</span>}
                      </div>
                      {item.customization && (
                        <div className="mt-1.5 space-y-0.5">
                          {item.customization.type === 'nametag' && item.customization.child_name && (
                            <span className="inline-block text-xs bg-teal-50 text-teal-700 px-2 py-0.5 rounded mr-1">
                              Namn: {item.customization.child_name}
                            </span>
                          )}
                          {item.customization.type === 'calendar' && (
                            <span className="inline-block text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded mr-1">
                              Kalender {item.customization.year} — {item.customization.images_count} bilder
                            </span>
                          )}
                          {item.customization.type === 'photoalbum' && (
                            <span className="inline-block text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded mr-1">
                              Album — {item.customization.total_pages} sidor, {item.customization.total_images} bilder
                            </span>
                          )}
                          {item.customization.type === 'design' && (
                            <span className="inline-block text-xs bg-primary/10 text-primary px-2 py-0.5 rounded mr-1">
                              Med egen design
                            </span>
                          )}
                        </div>
                      )}
                      {!item.customization && item.design_preview && (
                        <span className="inline-block text-xs bg-primary/10 text-primary px-2 py-1 rounded mt-2">
                          Med egen design
                        </span>
                      )}
                      <p className="text-primary font-semibold mt-2">
                        {itemPrice} kr
                      </p>
                    </div>

                    {/* Quantity & Remove */}
                    <div className="flex flex-col items-end justify-between">
                      <button
                        onClick={() => handleRemove(item.cart_item_id)}
                        className="text-slate-400 hover:text-red-500 transition-colors"
                        data-testid={`remove-item-${item.cart_item_id}`}
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                      
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleQuantityChange(item.cart_item_id, (item.quantity || 1) - 1)}
                          className="w-8 h-8 rounded-full border border-slate-200 hover:border-primary flex items-center justify-center transition-colors"
                          disabled={loading || (item.quantity || 1) <= 1}
                          data-testid={`decrease-${item.cart_item_id}`}
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="font-medium w-6 text-center">
                          {item.quantity || 1}
                        </span>
                        <button
                          onClick={() => handleQuantityChange(item.cart_item_id, (item.quantity || 1) + 1)}
                          className="w-8 h-8 rounded-full border border-slate-200 hover:border-primary flex items-center justify-center transition-colors"
                          disabled={loading}
                          data-testid={`increase-${item.cart_item_id}`}
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl p-6 shadow-soft sticky top-24">
                <h2 className="text-lg font-semibold text-slate-900 mb-6">
                  Sammanfattning
                </h2>
                
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Delsumma</span>
                    <span className="font-medium">{subtotal.toFixed(2)} kr</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Frakt</span>
                    <span className="font-medium">
                      {shipping === 0 ? 'Gratis' : `${shipping} kr`}
                    </span>
                  </div>
                  {subtotal < 500 && (
                    <p className="text-xs text-slate-500">
                      Handla för {(500 - subtotal).toFixed(0)} kr till för fri frakt!
                    </p>
                  )}
                  <div className="border-t pt-3 mt-3">
                    <div className="flex justify-between text-lg font-semibold">
                      <span>Totalt</span>
                      <span className="text-primary">{total.toFixed(2)} kr</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">inkl. moms</p>
                  </div>
                </div>

                <Button 
                  className="btn-primary w-full mt-6"
                  onClick={() => navigate('/kassa')}
                  data-testid="checkout-button"
                >
                  Till kassan
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>

                <Link 
                  to="/produkter"
                  className="block text-center text-sm text-slate-500 hover:text-primary mt-4"
                  data-testid="continue-shopping"
                >
                  Fortsätt handla
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;
