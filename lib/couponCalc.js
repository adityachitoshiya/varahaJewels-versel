/**
 * Coupon discount calculation - mirrors the backend (routes/orders.py
 * validate_coupon_server_side) so the price shown = the price charged.
 *
 * @param {object} coupon  { discount_type, discount_value, max_discount, min_order_amount }
 * @param {Array}  items   [{ price, quantity }]
 * @param {number} total   cart subtotal
 */
export function bogoDiscount(items = []) {
    const units = [];
    items.forEach((it) => {
        const price = Number(it.price) || 0;
        const qty = Math.max(0, parseInt(it.quantity, 10) || 0);
        for (let i = 0; i < qty; i++) units.push(price);
    });
    units.sort((a, b) => b - a);
    let free = 0;
    for (let i = 1; i < units.length; i += 2) free += units[i]; // cheaper unit of each pair
    return Math.round(free * 100) / 100;
}

export function calcCouponDiscount(coupon, items = [], total = 0) {
    if (!coupon) return 0;
    const value = Number(coupon.discount_value) || 0;
    if (coupon.min_order_amount && total < coupon.min_order_amount) return 0;

    let discount = 0;
    switch (coupon.discount_type) {
        case 'percentage':
            discount = (total * value) / 100;
            break;
        case 'fixed':
            discount = Math.min(value, total);
            break;
        case 'flat_price':
            discount = Math.max(0, total - value);
            break;
        case 'bogo':
            discount = bogoDiscount(items);
            break;
        default:
            discount = 0;
    }
    // Final amount never below ₹1
    discount = Math.min(discount, Math.max(0, total - 1));
    if (coupon.max_discount && discount > coupon.max_discount) discount = coupon.max_discount;
    if (discount < 0) discount = 0;
    return Math.round(discount * 100) / 100;
}

/** Turn cart items / direct-buy details into [{price, quantity}] */
export function toPriceItems(cartItems = [], orderDetails = null) {
    if (cartItems && cartItems.length > 0) {
        return cartItems.map((it) => ({
            price: Number(it.variant?.price ?? it.element?.price ?? it.price ?? 0),
            quantity: it.quantity || 1,
        }));
    }
    if (orderDetails) {
        const qty = orderDetails.quantity || 1;
        return [{ price: (Number(orderDetails.amount) || 0) / qty, quantity: qty }];
    }
    return [];
}
