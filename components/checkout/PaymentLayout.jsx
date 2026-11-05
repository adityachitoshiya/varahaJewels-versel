import React, { useState, useEffect } from 'react';
import PriceDetails from './PriceDetails';
import { ShieldCheck, Truck, CreditCard, MapPin, Check } from 'lucide-react';
import { getApiUrl } from '../../lib/config';
import { calcCouponDiscount, toPriceItems } from '../../lib/couponCalc';
import { codChargeFor, FREE_DELIVERY_MIN } from '../../lib/deliveryFees';

// Payment step: delivery recap, two payment choices (online / COD) and the
// price breakdown with coupon. Amounts use the same formulas as the server.
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
    setDiscount,
    isFlashDelivery,
    edd,
    paymentMethod,
    setPaymentMethod,
    onEditAddress,
}) => {
    const [mode, setMode] = useState(paymentMethod === 'cod' ? 'cod' : 'online');

    // Keep the parent's payment method in sync (coupon restrictions depend on it)
    useEffect(() => {
        if (setPaymentMethod) setPaymentMethod(mode === 'cod' ? 'cod' : 'online');
    }, [mode, setPaymentMethod]);

    const [prepaidSettings, setPrepaidSettings] = useState({ enabled: false, percent: 5 });
    useEffect(() => {
        fetch(`${getApiUrl()}/api/settings`)
            .then((r) => (r.ok ? r.json() : null))
            .then((data) => data && setPrepaidSettings({ enabled: data.prepaid_discount_enabled || false, percent: data.prepaid_discount_percent || 5 }))
            .catch(() => {});
    }, []);

    const totalAmount = cartItems.length > 0
        ? cartItems.reduce((sum, item) => sum + (item.variant.price * item.quantity), 0)
        : (orderDetails ? orderDetails.amount : 0);

    // Same formula as the server (incl. BOGO + max cap)
    const discountAmount = appliedCoupon
        ? calcCouponDiscount(appliedCoupon, toPriceItems(cartItems, orderDetails), totalAmount)
        : 0;
    const finalAmount = Math.max(0, totalAmount - discountAmount);

    // Prepaid discount is applied by the server on online payments (same formula)
    const prepaidDiscount = prepaidSettings.enabled
        ? Math.round(((finalAmount * prepaidSettings.percent) / 100) * 100) / 100
        : 0;
    const onlineAmount = Math.max(1, Math.round((finalAmount - prepaidDiscount) * 100) / 100);

    // COD fee: free from ₹499, ₹99 below that (online payment is always free)
    const codCharge = codChargeFor(finalAmount);
    const codAmount = Math.max(1, finalAmount) + codCharge;

    const payAmount = mode === 'cod' ? codAmount : onlineAmount;
    const pay = mode === 'cod' ? handleCODPayment : handleRazorpayPayment;
    const payLabel = isLoading ? 'Processing…' : mode === 'cod' ? `Place order · ₹${codAmount.toLocaleString('en-IN')}` : `Pay ₹${onlineAmount.toLocaleString('en-IN')}`;

    const address = [formData?.address, formData?.city, formData?.state, formData?.pincode].filter(Boolean).join(', ');

    const Option = ({ value, icon: Icon, title, note, badge }) => {
        const active = mode === value;
        return (
            <button
                type="button"
                onClick={() => setMode(value)}
                aria-pressed={active}
                className={`w-full text-left rounded-2xl border-2 p-4 sm:p-5 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-copper ${active ? 'border-heritage bg-[#FBF3EA]' : 'border-heritage/10 bg-white hover:border-heritage/30'}`}
            >
                <span className="flex items-start gap-3.5">
                    <span className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${active ? 'border-heritage bg-heritage' : 'border-heritage/30'}`}>
                        {active && <Check size={12} className="text-white" strokeWidth={3} />}
                    </span>
                    <span className="flex-1 min-w-0">
                        <span className="flex flex-wrap items-center gap-2">
                            <Icon size={18} className="text-copper" />
                            <span className="font-semibold text-heritage">{title}</span>
                            {badge && <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">{badge}</span>}
                        </span>
                        <span className="block mt-1 text-sm text-heritage/65">{note}</span>
                    </span>
                    <span className="font-semibold text-heritage tabular-nums">₹{(value === 'cod' ? codAmount : onlineAmount).toLocaleString('en-IN')}</span>
                </span>
            </button>
        );
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-8 items-start pb-24 lg:pb-0">
            <div className="lg:col-span-7 space-y-5">
                {/* Delivery recap */}
                <section className="rounded-2xl bg-white border border-heritage/10 p-5">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex gap-3 min-w-0">
                            <MapPin size={18} className="text-copper flex-shrink-0 mt-0.5" />
                            <div className="min-w-0">
                                <p className="text-sm font-semibold text-heritage">Delivering to {formData?.name || 'you'}</p>
                                <p className="text-sm text-heritage/65 mt-0.5 break-words">{address}</p>
                                {formData?.contact && <p className="text-xs text-heritage/50 mt-1">{formData.contact}</p>}
                            </div>
                        </div>
                        {onEditAddress && (
                            <button type="button" onClick={onEditAddress} className="text-sm font-semibold text-copper hover:text-heritage underline underline-offset-4 flex-shrink-0">Change</button>
                        )}
                    </div>
                    {(isFlashDelivery || edd) && (
                        <p className="mt-3 rounded-xl bg-emerald-50 border border-emerald-100 px-3 py-2 text-xs font-semibold text-emerald-800">
                            {isFlashDelivery ? 'Flash delivery: arrives within a few hours' : `Expected delivery: ${edd}`}
                        </p>
                    )}
                </section>

                {/* Payment choice */}
                <section className="rounded-2xl bg-white border border-heritage/10 p-5">
                    <h2 className="font-royal font-bold text-2xl text-heritage mb-4">How would you like to pay?</h2>
                    <div className="space-y-3">
                        <Option
                            value="online"
                            icon={CreditCard}
                            title="Pay online"
                            note={`UPI, Google Pay, PhonePe, cards or net banking.${codCharge > 0 ? ' Free delivery.' : ''}`}
                            badge={prepaidSettings.enabled && prepaidDiscount > 0 ? `Save ₹${Math.round(prepaidDiscount).toLocaleString('en-IN')}` : null}
                        />
                        <Option
                            value="cod"
                            icon={Truck}
                            title="Cash on delivery"
                            note={codCharge > 0
                                ? `Pay cash or UPI to the delivery agent. ₹${codCharge} COD fee on orders under ₹${FREE_DELIVERY_MIN}.`
                                : 'Pay cash or UPI to the delivery agent. No COD fee on this order.'}
                        />
                    </div>

                    {/* Desktop pay button (phones use the sticky bar) */}
                    <button
                        onClick={pay}
                        disabled={isLoading}
                        className="hidden lg:flex mt-5 w-full h-14 items-center justify-center rounded-full bg-heritage text-white font-bold text-base hover:bg-copper disabled:opacity-70 transition-colors"
                    >
                        {payLabel}
                    </button>
                    <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-heritage/50">
                        <ShieldCheck size={14} className="text-emerald-600" /> Payments are processed securely by Razorpay
                    </p>
                </section>
            </div>

            {/* Price breakdown + coupon */}
            <div className="lg:col-span-5 lg:sticky lg:top-24">
                <PriceDetails
                    cartItems={cartItems}
                    orderDetails={orderDetails}
                    totalAmount={totalAmount}
                    discountAmount={discountAmount}
                    finalAmount={finalAmount}
                    // Match the amount on the pay button for the selected mode
                    codCharge={mode === 'cod' ? codCharge : 0}
                    prepaidDiscount={mode !== 'cod' ? prepaidDiscount : 0}
                    couponCode={couponCode}
                    setCouponCode={setCouponCode}
                    handleApplyCoupon={handleApplyCoupon}
                    couponError={couponError}
                    appliedCoupon={appliedCoupon}
                    setAppliedCoupon={setAppliedCoupon}
                    setDiscount={setDiscount}
                />
            </div>

            {/* Sticky pay bar on phones */}
            <div className="lg:hidden fixed inset-x-0 bottom-0 z-40 bg-white border-t border-heritage/10 px-4 py-3 shadow-[0_-8px_24px_-12px_rgba(42,21,12,0.25)]">
                <div className="flex items-center gap-3">
                    <div className="min-w-0">
                        <p className="text-xs text-heritage/55">{mode === 'cod' ? 'Cash on delivery' : 'Pay online'}</p>
                        <p className="font-bold text-lg text-heritage tabular-nums leading-tight">₹{payAmount.toLocaleString('en-IN')}</p>
                    </div>
                    <button onClick={pay} disabled={isLoading} className="flex-1 h-12 rounded-full bg-heritage text-white font-bold hover:bg-copper disabled:opacity-70">
                        {isLoading ? 'Processing…' : mode === 'cod' ? 'Place order' : 'Pay now'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PaymentLayout;
