import React, { useState, useEffect } from 'react';
import PaymentSidebar from './PaymentSidebar';
import PriceDetails from './PriceDetails';
import { ShieldCheck, Truck, Lock, CreditCard } from 'lucide-react';

const PaymentLayout = ({
    cartItems,
    orderDetails,
    handleRazorpayPayment,
    handleCODPayment,
    isLoading,
    formData,
    couponCode,
    setCouponCode,
    handleApplyCoupon,
    couponError,
    appliedCoupon,
    setAppliedCoupon,
    setDiscount
}) => {
    const [activeTab, setActiveTab] = useState('recommended');

    const totalAmount = cartItems.length > 0
        ? cartItems.reduce((sum, item) => sum + (item.variant.price * item.quantity), 0)
        : (orderDetails ? orderDetails.amount : 0);

    // Recalculate discount
    let discountAmount = 0;
    if (appliedCoupon) {
        if (appliedCoupon.discount_type === 'percentage') {
            discountAmount = (totalAmount * appliedCoupon.discount_value) / 100;
        } else if (appliedCoupon.discount_type === 'fixed') {
            discountAmount = appliedCoupon.discount_value;
        } else if (appliedCoupon.discount_type === 'flat_price') {
            discountAmount = totalAmount - appliedCoupon.discount_value;
        }
    }
    let finalAmount = totalAmount - discountAmount;
    if (finalAmount < 0) finalAmount = 0;

    // Add COD charges visually to final amount if COD selected?
    // Usually platforms show COD charge in PriceDetails or as a line item.
    // We'll keep PriceDetails consistent and maybe add it if COD is selected.

    const renderContent = () => {
        switch (activeTab) {
            case 'cod':
                return (
                    <div className="p-6 animate-fadeIn">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">Cash On Delivery</h3>
                        <div className="bg-yellow-50 border border-yellow-100 p-4 rounded-lg mb-6">
                            <div className="flex gap-3">
                                <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0 text-yellow-700">
                                    <Truck size={20} />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-gray-800">Pay at your doorstep</p>
                                    <p className="text-xs text-gray-600 mt-1">
                                        You can pay via Cash or UPI when the delivery agent arrives.
                                        <br />
                                        <span className="font-bold text-gray-800 mt-1 inline-block">Additional ₹59 handling fee applies.</span>
                                    </p>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={handleCODPayment}
                            disabled={isLoading}
                            className="w-full bg-heritage text-white py-4 rounded-lg font-bold uppercase tracking-wider hover:bg-heritage/90 shadow transition-all flex items-center justify-center gap-2"
                        >
                            {isLoading ? 'Processing...' : `Place COD Order • ₹${(finalAmount + 59).toLocaleString()}`}
                        </button>
                    </div>
                );

            case 'card':
            case 'upi':
            case 'netbanking':
            case 'recommended':
            default:
                // Default View (Online Payment Trigger)
                // We can show "Recommended" content or just the Online Payment UI
                return (
                    <div className="p-6 animate-fadeIn">
                        <h3 className="text-lg font-bold text-gray-800 mb-6">
                            {activeTab === 'recommended' ? 'Recommended Options' :
                                activeTab === 'card' ? 'Credit / Debit Card' :
                                    activeTab === 'upi' ? 'Pay via UPI' : 'Online Payment'}
                        </h3>

                        {/* Static Card Visual for "Card" or "Recommended" */}
                        <div className="mb-6">
                            <div className="border border-gray-200 rounded-lg p-4 hover:border-copper transition-colors cursor-pointer" onClick={handleRazorpayPayment}>
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-600">
                                        <CreditCard size={20} />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-semibold text-gray-800">Pay Online (Razorpay)</p>
                                        <p className="text-xs text-gray-500">GooglePay, PhonePe, Cards, Netbanking & More</p>
                                    </div>
                                    <div className="w-4 h-4 rounded-full border border-gray-300"></div>
                                </div>
                                <div className="mt-3 pl-14">
                                    <p className="text-[10px] text-green-600 font-bold bg-green-50 inline-block px-2 py-1 rounded">5% Cashback on Prepaid Orders</p>
                                </div>
                            </div>
                        </div>

                        {/* More static offers to look like Myntra */}
                        {(activeTab === 'recommended' || activeTab === 'card') && (
                            <div className="mb-6 space-y-3">
                                <div className="flex items-start gap-3 p-3 bg-blue-50/50 rounded border border-blue-100 border-dashed">
                                    <span className="text-blue-600 text-xs font-bold whitespace-nowrap">HDFC Bank</span>
                                    <p className="text-xs text-gray-600">10% Instant Discount on HDFC Credit Cards on min spend ₹3000. TCA</p>
                                </div>
                            </div>
                        )}

                        <button
                            onClick={handleRazorpayPayment}
                            disabled={isLoading}
                            className="w-full bg-heritage text-white py-4 rounded-lg font-bold uppercase tracking-wider hover:bg-heritage/90 shadow transition-all flex items-center justify-center gap-2"
                        >
                            {isLoading ? 'Processing...' : `Pay Now • ₹${finalAmount.toLocaleString()}`}
                        </button>

                        <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-400">
                            <ShieldCheck size={14} /> 100% Safe & Secure Payments
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">

            {/* LEFT BLOCK: Payments */}
            <div className="lg:col-span-8 bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
                {/* Header */}
                <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                    <h2 className="text-base font-bold text-heritage flex items-center gap-2">
                        <Lock size={16} /> Choose Payment Mode
                    </h2>
                </div>

                <div className="flex flex-col lg:flex-row min-h-[400px]">
                    {/* Sidebar */}
                    <div className="lg:w-1/3 border-r border-gray-100">
                        <PaymentSidebar selectedMode={activeTab} onSelectMode={setActiveTab} />
                    </div>

                    {/* Content Area */}
                    <div className="lg:w-2/3">
                        {renderContent()}
                    </div>
                </div>
            </div>

            {/* RIGHT BLOCK: Price Details */}
            <div className="lg:col-span-4">
                <PriceDetails
                    cartItems={cartItems}
                    orderDetails={orderDetails}
                    totalAmount={totalAmount}
                    discountAmount={discountAmount}
                    finalAmount={finalAmount} // Note: This doesn't include COD charge logic yet, passed as raw
                    couponCode={couponCode}
                    setCouponCode={setCouponCode}
                    handleApplyCoupon={handleApplyCoupon}
                    couponError={couponError}
                    appliedCoupon={appliedCoupon}
                    setAppliedCoupon={setAppliedCoupon}
                    setDiscount={setDiscount}
                />
            </div>

        </div>
    );
};

export default PaymentLayout;
