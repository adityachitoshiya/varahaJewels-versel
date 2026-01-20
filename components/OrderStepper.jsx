import { Package, Truck, MapPin, CheckCircle2, Clock, Gift, Star } from 'lucide-react';

const STEP_ICONS = {
    1: Package,
    2: Gift,
    3: Truck,
    4: MapPin,
    5: Truck,
    6: CheckCircle2
};

export default function OrderStepper({ steps = [], currentStep = 1, trackingHistory = [] }) {
    return (
        <div className="w-full">
            {/* Stepper */}
            <div className="relative">
                {/* Progress Line */}
                <div className="absolute top-6 left-6 right-6 h-0.5 bg-gray-200 z-0">
                    <div
                        className="h-full bg-gradient-to-r from-heritage to-copper transition-all duration-500"
                        style={{ width: `${((currentStep - 1) / 5) * 100}%` }}
                    />
                </div>

                {/* Steps */}
                <div className="relative flex justify-between">
                    {steps.map((step, index) => {
                        const Icon = STEP_ICONS[step.step] || Package;
                        const isCompleted = step.completed;
                        const isActive = step.active;

                        return (
                            <div key={step.step} className="flex flex-col items-center z-10">
                                {/* Circle */}
                                <div className={`
                                    w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300
                                    ${isCompleted
                                        ? 'bg-gradient-to-br from-heritage to-copper text-white shadow-lg shadow-heritage/30'
                                        : isActive
                                            ? 'bg-copper/20 text-copper border-2 border-copper animate-pulse'
                                            : 'bg-gray-100 text-gray-400 border-2 border-gray-200'
                                    }
                                `}>
                                    {isCompleted && !isActive ? (
                                        <CheckCircle2 size={20} />
                                    ) : (
                                        <Icon size={20} />
                                    )}
                                </div>

                                {/* Title */}
                                <div className="mt-3 text-center">
                                    <p className={`text-xs font-bold ${isCompleted || isActive ? 'text-heritage' : 'text-gray-400'}`}>
                                        {step.title}
                                    </p>
                                    {step.date && (
                                        <p className="text-[10px] text-gray-500 mt-0.5">{step.date}</p>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Current Status Banner */}
            {steps.find(s => s.active) && (
                <div className="mt-8 bg-gradient-to-r from-heritage/10 to-copper/10 border border-copper/30 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-heritage text-white rounded-full flex items-center justify-center">
                            {(() => {
                                const activeStep = steps.find(s => s.active);
                                const Icon = STEP_ICONS[activeStep?.step] || Package;
                                return <Icon size={18} />;
                            })()}
                        </div>
                        <div>
                            <p className="font-bold text-heritage">{steps.find(s => s.active)?.title}</p>
                            <p className="text-sm text-gray-600">{steps.find(s => s.active)?.description}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Tracking History Timeline */}
            {trackingHistory.length > 0 && (
                <div className="mt-8">
                    <h4 className="text-sm font-bold text-heritage mb-4 flex items-center gap-2">
                        <Clock size={16} className="text-copper" />
                        Shipment Activity
                    </h4>
                    <div className="relative pl-6 space-y-4">
                        {/* Vertical Line */}
                        <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-copper/30" />

                        {trackingHistory.slice().reverse().map((scan, idx) => (
                            <div key={idx} className="relative">
                                {/* Dot */}
                                <div className={`absolute -left-6 top-1 w-3 h-3 rounded-full ${idx === 0 ? 'bg-copper' : 'bg-copper/40'}`} />

                                <div className="bg-warm-sand/50 rounded-lg p-3 border border-copper/20">
                                    <p className="text-sm font-medium text-heritage">{scan.status || scan.description}</p>
                                    <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                                        {scan.location && (
                                            <span className="flex items-center gap-1">
                                                <MapPin size={10} /> {scan.location}
                                            </span>
                                        )}
                                        {scan.timestamp && (
                                            <span>{new Date(scan.timestamp).toLocaleString('en-IN', {
                                                day: 'numeric',
                                                month: 'short',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Delivered Success */}
            {currentStep === 6 && (
                <div className="mt-8 bg-gradient-to-r from-heritage/10 to-copper/10 border border-copper/30 rounded-xl p-6 text-center">
                    <CheckCircle2 size={48} className="text-copper mx-auto mb-3" />
                    <h3 className="text-lg font-bold text-heritage">Delivered Successfully!</h3>
                    <p className="text-sm text-heritage/70 mt-1">Hope you love your Varaha piece ✨</p>
                    <button className="mt-4 px-6 py-2 bg-heritage text-white rounded-full text-sm font-bold hover:bg-copper transition-colors flex items-center gap-2 mx-auto">
                        <Star size={16} /> Rate Your Purchase
                    </button>
                </div>
            )}
        </div>
    );
}
