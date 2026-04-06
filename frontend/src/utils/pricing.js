/**
 * Shared price calculation logic for Cart and Checkout
 */
export const calculatePricing = (cart, products, shippingConfig, appliedCoupon) => {
  const subtotal = cart.items?.reduce((total, item) => {
    const product = products[item.product_id];
    const itemPrice = item.price || product?.price || 0;
    return total + (itemPrice * (item.quantity || 1));
  }, 0) || 0;

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

  let shipping = shippingConfig.shipping_cost;
  if (!shippingConfig.shipping_enabled) {
    shipping = 0;
  } else if (shippingConfig.free_shipping_threshold > 0 && afterDiscount >= shippingConfig.free_shipping_threshold) {
    shipping = 0;
  }

  const total = afterDiscount + shipping;

  const vatAmount = shippingConfig.tax_enabled
    ? Math.round(total * shippingConfig.tax_rate / (100 + shippingConfig.tax_rate) * 100) / 100
    : 0;

  return { subtotal, discountAmount, discountLabel, afterDiscount, shipping, total, vatAmount };
};
