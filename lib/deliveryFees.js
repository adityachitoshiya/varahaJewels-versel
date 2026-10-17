// Delivery fee rule (keep in sync with backend/routes/orders.py: FREE_DELIVERY_MIN, COD_CHARGE)
//   order value (after coupon) >= ₹499 -> free delivery, no COD fee
//   below ₹499: online payment -> free, Cash on Delivery -> ₹99
export const FREE_DELIVERY_MIN = 499;
export const COD_CHARGE = 99;

export const codChargeFor = (orderValue) => (orderValue >= FREE_DELIVERY_MIN ? 0 : COD_CHARGE);

export const DELIVERY_POLICY_SHORT = `Free delivery on orders above ₹${FREE_DELIVERY_MIN}`;
