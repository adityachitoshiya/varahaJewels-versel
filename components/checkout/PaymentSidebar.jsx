import React from 'react';
import { Star, Truck, Smartphone, CreditCard, Wallet, Landmark } from 'lucide-react';

const PaymentSidebar = ({ selectedMode, onSelectMode }) => {

    const modes = [
        { id: 'recommended', label: 'Recommended', icon: Star, color: 'text-amber-500' },
        { id: 'cod', label: 'Cash On Delivery', icon: Truck, color: 'text-gray-700' },
        { id: 'upi', label: 'UPI (Pay via any App)', icon: Smartphone, color: 'text-gray-700' },
        { id: 'card', label: 'Credit/Debit Card', icon: CreditCard, color: 'text-gray-700' },
        // { id: 'wallet', label: 'Wallets', icon: Wallet, color: 'text-gray-700' },
        // { id: 'netbanking', label: 'Net Banking', icon: Landmark, color: 'text-gray-700' },
    ];

    return (
        <div className="bg-gray-50 h-full min-h-[400px]">
            {modes.map((mode) => (
                <button
                    key={mode.id}
                    onClick={() => onSelectMode(mode.id)}
                    className={`w-full flex items-center gap-3 px-6 py-5 text-left transition-colors border-l-4 ${selectedMode === mode.id
                            ? 'bg-white border-heritage text-heritage font-semibold shadow-sm'
                            : 'border-transparent text-gray-600 hover:bg-gray-100'
                        }`}
                >
                    <mode.icon
                        size={20}
                        className={selectedMode === mode.id ? 'text-heritage' : 'text-gray-400'}
                    />
                    <span className="text-sm">{mode.label}</span>
                    {mode.id === 'card' && <span className="ml-auto text-[10px] text-green-600 font-bold">3 Offers</span>}
                    {mode.id === 'recommended' && <span className="ml-auto text-[10px] text-red-500 px-2 py-0.5 bg-red-50 rounded-full font-bold">NEW</span>}
                </button>
            ))}
        </div>
    );
};

export default PaymentSidebar;
