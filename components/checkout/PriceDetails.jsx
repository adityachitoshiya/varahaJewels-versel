import React, { useState, useEffect } from 'react';
import { Tag } from 'lucide-react';

const PriceDetails = ({
    cartItems,
    orderDetails,
    totalAmount,
    discountAmount,
    finalAmount,
    couponCode,
    setCouponCode,
    handleApplyCoupon,
    couponError,
    appliedCoupon,
    setAppliedCoupon,
    setDiscount,
    shippingCharge: passedShippingCharge = null,
    shippingSettings: passedShippingSettings = null
}) => {
    const [shippingSettings, setShippingSettings] = useState({
        minimumPrice: 99.0,
        shippingCharge: 50.0
    });
    const [shippingCharge, setShippingCharge] = useState(passedShippingCharge !== null ? passedShippingCharge : 0);

    // Fetch shipping override settings if not passed from parent
    useEffect(() => {
        if (passedShippingSettings && Object.keys(passedShippingSettings).length > 0) {
            setShippingSettings(passedShippingSettings);
            return; // Use passed settings, don't fetch
        }

        const fetchSettings = async () => {
            try {
                const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
                const response = await fetch(`${API_URL}/api/settings`);
                if (response.ok) {
                    const data = await response.json();
                    setShippingSettings({
                        minimumPrice: data.minimum_product_price_for_free_shipping || 99.0,
                        shippingCharge: data.mandatory_shipping_charge || 50.0
                    });
                }
            } catch (error) {
                console.error('Failed to fetch shipping settings:', error);
            }
        };
        fetchSettings();
    }, [passedShippingSettings]);

    // Use passed shipping charge if available, otherwise calculate
    useEffect(() => {
        if (passedShippingCharge !== null) {
            setShippingCharge(passedShippingCharge);
            return; // Use passed value, don't recalculate
        }

        let needsShipping = false;
        
        if (cartItems.length > 0) {
            // Check if any item's price is below threshold
            needsShipping = cartItems.some(item => {
                const price = item.variant?.price || 0;
                return price < shippingSettings.minimumPrice;
            });
        } else if (orderDetails) {
            // For single product checkout, check the price
            const price = orderDetails.amount;
            needsShipping = price < shippingSettings.minimumPrice;
        }

        setShippingCharge(needsShipping ? shippingSettings.shippingCharge : 0);
    }, [cartItems, orderDetails, shippingSettings, passedShippingCharge]);

    // Calculate total MRP (before discount)
    const sellingPriceTotal = cartItems.length > 0
        ? cartItems.reduce((sum, item) => sum + (item.variant.price * item.quantity), 0)
        : (orderDetails ? orderDetails.amount : 0);

    const totalMRP = cartItems.length > 0
        ? cartItems.reduce((sum, item) => {
            const mrp = item.product?.mrp || item.variant?.compareAt || item.variant?.price || 0;
            return sum + (mrp * item.quantity);
        }, 0)
        : sellingPriceTotal;

    const productDiscount = totalMRP - sellingPriceTotal;

    const itemCount = cartItems.length > 0 ? cartItems.length : (orderDetails ? 1 : 0);

    return (
        <div className="bg-white rounded-lg border border-gray-100 p-6 sticky top-24">
            <h3 className="text-gray-500 font-bold text-xs uppercase tracking-wider mb-4">
                Price Details ({itemCount} Item{itemCount !== 1 && 's'})
            </h3>

            <div className="space-y-3 text-sm mb-6 pb-6 border-b border-gray-100">
                <div className="flex justify-between items-center text-gray-700">
                    <span>Total MRP</span>
                    <span>₹{Math.round(totalMRP).toLocaleString()}</span>
                </div>

                {productDiscount > 0 && (
                    <div className="flex justify-between items-center text-gray-700">
                        <span>Discount on MRP</span>
                        <span className="text-green-500">-₹{Math.round(productDiscount).toLocaleString()}</span>
                    </div>
                )}

                {discountAmount > 0 && (
                    <div className="flex justify-between items-center text-gray-700">
                        <span>Coupon Discount</span>
                        <span className="text-green-500">-₹{Math.round(discountAmount).toLocaleString()}</span>
                    </div>
                )}

                <div className="flex justify-between items-center text-gray-700">
                    <span>Platform Fee</span>
                    <span className="text-green-500">FREE</span>
                </div>

                <div className="flex justify-between items-center text-gray-700">
                    <span>Shipping Fee</span>
                    <span className={shippingCharge > 0 ? "text-red-500 font-semibold" : "text-green-500"}>
                        {shippingCharge > 0 ? `₹${Math.round(shippingCharge).toLocaleString()}` : 'FREE'}
                    </span>
                </div>
            </div>

            <div className="flex justify-between items-center font-bold text-gray-900 text-base mb-6">
                <span>Total Amount</span>
                <span>₹{Math.round(finalAmount).toLocaleString()}</span>
            </div>

            {/* Coupon Section directly embedded or separate? Keeping it simple here or re-using validation logic passed as props */}
            {!appliedCoupon ? (
                <div className="mb-6">
                    <p className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1">
                        <Tag size={12} /> Apply Coupon
                    </p>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={couponCode}
                            onChange={(e) => setCouponCode(e.target.value)}
                            placeholder="Enter Code"
                            className="flex-1 px-3 py-2 border border-gray-200 rounded text-sm outline-none focus:border-copper uppercase"
                        />
                        <button
                            onClick={handleApplyCoupon}
                            className="bg-heritage text-white px-4 py-2 rounded text-xs font-bold uppercase tracking-wider hover:bg-heritage/90"
                        >
                            Apply
                        </button>
                    </div>
                    {couponError && <p className="text-xs text-red-500 mt-1">{couponError}</p>}
                </div>
            ) : (
                <div className="mb-6 bg-green-50 border border-green-100 p-3 rounded flex justify-between items-center">
                    <div>
                        <p className="text-xs font-bold text-green-700 flex items-center gap-1">
                            <Tag size={12} /> {appliedCoupon.code} Applied
                        </p>
                        <p className="text-[10px] text-green-600">You saved ₹{discountAmount.toLocaleString()}</p>
                    </div>
                    <button
                        onClick={() => {
                            setAppliedCoupon(null);
                            setDiscount(0);
                            setCouponCode('');
                        }}
                        className="text-xs text-red-500 font-bold uppercase hover:underline"
                    >
                        Remove
                    </button>
                </div>
            )}

            <div className="bg-gray-50 p-3 rounded text-[10px] text-gray-500 leading-relaxed">
                Safe and secure payments. Easy returns. 100% Authentic products.
            </div>
        </div>
    );
};

export default PriceDetails;
