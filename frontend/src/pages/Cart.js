import { Link } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { useCart } from '../context/CartContext';
import { useCartData } from '../hooks/useCartData';
import { calculatePricing } from '../utils/pricing';
import { CartItemCard } from './cart/CartItemCard';
import { CartSummary } from './cart/CartSummary';

const Cart = () => {
  const { cart, updateQuantity, removeFromCart, loading } = useCart();
  const {
    products, loadingProducts, shippingConfig,
    couponCode, setCouponCode, appliedCoupon, couponLoading,
    applyCoupon, removeCoupon,
  } = useCartData(cart.items);

  const pricing = calculatePricing(cart, products, shippingConfig, appliedCoupon);

  const handleQuantityChange = async (cartItemId, qty) => {
    if (qty < 1) return;
    try { await updateQuantity(cartItemId, qty); }
    catch { toast.error('Kunde inte uppdatera antal'); }
  };

  const handleRemove = async (cartItemId) => {
    try { await removeFromCart(cartItemId); toast.success('Produkt borttagen'); }
    catch { toast.error('Kunde inte ta bort produkten'); }
  };

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
            <h2 className="text-xl font-semibold text-slate-700 mb-2">Din varukorg är tom</h2>
            <p className="text-slate-500 mb-6">Börja handla och lägg till produkter i din varukorg</p>
            <Link to="/produkter">
              <Button className="btn-primary" data-testid="continue-shopping-empty">Börja handla</Button>
            </Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              {cart.items.map((item) => {
                const product = products[item.product_id] || {
                  product_id: item.product_id,
                  name: item.name,
                  price: item.price,
                  imageUrl: item.image,
                };
                return (
                  <CartItemCard
                    key={item.cart_item_id}
                    item={item}
                    product={product}
                    loading={loading}
                    onQuantityChange={handleQuantityChange}
                    onRemove={handleRemove}
                  />
                );
              })}
            </div>

            <div className="lg:col-span-1">
              <CartSummary
                {...pricing}
                shippingConfig={shippingConfig}
                couponCode={couponCode}
                setCouponCode={setCouponCode}
                appliedCoupon={appliedCoupon}
                couponLoading={couponLoading}
                applyCoupon={applyCoupon}
                removeCoupon={removeCoupon}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;
