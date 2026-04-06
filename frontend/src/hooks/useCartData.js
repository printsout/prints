import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { toast } from 'sonner';

const DEFAULT_SHIPPING = {
  shipping_enabled: true, shipping_cost: 49, free_shipping_threshold: 500,
  discount_enabled: false, discount_percent: 0, tax_enabled: true, tax_rate: 25,
};

export function useCartData(cartItems) {
  const [products, setProducts] = useState({});
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [shippingConfig, setShippingConfig] = useState(DEFAULT_SHIPPING);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);

  useEffect(() => {
    if (!cartItems?.length) { setLoadingProducts(false); return; }
    const ids = [...new Set(cartItems.map(i => i.product_id))];
    const data = {};
    Promise.all(ids.map(id =>
      api.get(`/products/${id}`).then(r => { data[id] = r.data; }).catch(() => {})
    )).then(() => setProducts(data)).finally(() => setLoadingProducts(false));
  }, [cartItems]);

  useEffect(() => {
    api.get('/shipping-settings').then(r => setShippingConfig(r.data)).catch(() => {});
  }, []);

  const applyCoupon = useCallback(async () => {
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
  }, [couponCode]);

  const removeCoupon = useCallback(() => {
    setAppliedCoupon(null);
    setCouponCode('');
  }, []);

  return {
    products, loadingProducts, shippingConfig,
    couponCode, setCouponCode, appliedCoupon, couponLoading,
    applyCoupon, removeCoupon,
  };
}
