import React from 'react';
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
    setDiscount
}) => {

    // Calculate total MRP (before discount)
    const totalMRP = cartItems.length > 0
        ? cartItems.reduce((sum, item) => sum + (item.variant.price * item.quantity), 0)
        : (orderDetails ? orderDetails.amount : 0);

    const itemCount = cartItems.length > 0 ? cartItems.length : (orderDetails ? 1 : 0);

    return (
        <div className="bg-white rounded-lg border border-gray-100 p-6 sticky top-24">
            <h3 className="text-gray-500 font-bold text-xs uppercase tracking-wider mb-4">
                Price Details ({itemCount} Item{itemCount !== 1 && 's'})
            </h3>

            <div className="space-y-3 text-sm mb-6 pb-6 border-b border-gray-100">
                <div className="flex justify-between items-center text-gray-700">
                    <span>Total MRP</span>
                    <span>₹{totalMRP.toLocaleString()}</span>
                </div>

                {discountAmount > 0 && (
                    <div className="flex justify-between items-center">
                        <span>Discount on MRP</span>
                        <span className="text-green-500">-₹{discountAmount.toLocaleString()}</span>
                    </div>
                )}

                <div className="flex justify-between items-center text-gray-700">
                    <span>Platform Fee</span>
                    <span className="text-green-500">FREE</span>
                </div>

                <div className="flex justify-between items-center text-gray-700">
                    <span>Shipping Fee</span>
                    <span className="text-green-500">FREE</span>
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
