import { Package, Truck, MapPin, CheckCircle2, Clock, Gift, Star } from 'lucide-react';

const STEP_ICONS = {
    1: Package,
    2: Gift,
    3: Truck,
    4: MapPin,
    5: Truck,
    6: CheckCircle2
};

/* ─── Mobile: vertical stepper ─── Desktop: horizontal stepper ─── */
export default function OrderStepper({ steps = [], currentStep = 1, trackingHistory = [] }) {
    const activeStep = steps.find(s => s.active);

    return (
        <div className="w-full">

            {/* ══════════════════════════════════════
                MOBILE  — vertical timeline (< md)
            ══════════════════════════════════════ */}
            <div className="block md:hidden">
                <div className="relative">
                    {steps.map((step, index) => {
                        const Icon = STEP_ICONS[step.step] || Package;
                        const isCompleted = step.completed;
                        const isActive = step.active;
                        const isLast = index === steps.length - 1;

                        return (
                            <div key={step.step} className="flex gap-4 relative">
                                {/* Icon column */}
                                <div className="flex flex-col items-center flex-shrink-0">
                                    {/* Circle */}
                                    <div className={`
                                        w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300
                                        ${isCompleted
                                            ? 'bg-gradient-to-br from-heritage to-copper text-white shadow-md shadow-heritage/30'
                                            : isActive
                                                ? 'bg-copper/15 text-copper border-2 border-copper'
                                                : 'bg-gray-100 text-gray-300 border-2 border-gray-200'
                                        }
                                    `}>
                                        {isCompleted && !isActive
                                            ? <CheckCircle2 size={16} />
                                            : <Icon size={16} />
                                        }
                                    </div>
                                    {/* Connector line */}
                                    {!isLast && (
                                        <div className={`w-0.5 flex-1 min-h-[28px] mt-1 rounded-full ${isCompleted ? 'bg-gradient-to-b from-heritage to-copper' : 'bg-gray-200'}`} />
                                    )}
                                </div>

                                {/* Text column */}
                                <div className={`pb-5 ${isLast ? 'pb-0' : ''}`}>
                                    <p className={`text-sm font-semibold leading-tight ${isCompleted || isActive ? 'text-heritage' : 'text-gray-400'}`}>
                                        {step.title}
                                        {isActive && (
                                            <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-copper text-white uppercase tracking-wide">
                                                Now
                                            </span>
                                        )}
                                    </p>
                                    {(step.description && (isCompleted || isActive)) && (
                                        <p className="text-xs text-gray-500 mt-0.5 leading-snug">{step.description}</p>
                                    )}
                                    {step.date && (
                                        <p className="text-[10px] text-copper/80 mt-0.5 font-medium">{step.date}</p>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* ══════════════════════════════════════
                DESKTOP — horizontal stepper (≥ md)
            ══════════════════════════════════════ */}
            <div className="hidden md:block">
                <div className="relative">
                    {/* Progress track */}
                    <div className="absolute top-5 left-5 right-5 h-0.5 bg-gray-200 z-0">
                        <div
                            className="h-full bg-gradient-to-r from-heritage to-copper transition-all duration-500"
                            style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
                        />
                    </div>

                    <div className="relative flex justify-between">
                        {steps.map((step) => {
                            const Icon = STEP_ICONS[step.step] || Package;
                            const isCompleted = step.completed;
                            const isActive = step.active;

                            return (
                                <div key={step.step} className="flex flex-col items-center z-10 w-16">
                                    <div className={`
                                        w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300
                                        ${isCompleted
                                            ? 'bg-gradient-to-br from-heritage to-copper text-white shadow-lg shadow-heritage/30'
                                            : isActive
                                                ? 'bg-copper/20 text-copper border-2 border-copper animate-pulse'
                                                : 'bg-gray-100 text-gray-400 border-2 border-gray-200'
                                        }
                                    `}>
                                        {isCompleted && !isActive ? <CheckCircle2 size={18} /> : <Icon size={18} />}
                                    </div>
                                    <div className="mt-2 text-center w-full">
                                        <p className={`text-[11px] font-bold leading-tight ${isCompleted || isActive ? 'text-heritage' : 'text-gray-400'}`}>
                                            {step.title}
                                        </p>
                                        {step.date && <p className="text-[9px] text-gray-400 mt-0.5">{step.date}</p>}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* ══════════════════════════════════════
                Current Status Banner (both)
            ══════════════════════════════════════ */}
            {activeStep && currentStep < 6 && (
                <div className="mt-6 bg-gradient-to-r from-heritage/8 to-copper/8 border border-copper/25 rounded-xl p-3.5 flex items-center gap-3">
                    <div className="w-9 h-9 bg-heritage text-white rounded-full flex items-center justify-center flex-shrink-0">
                        {(() => { const Icon = STEP_ICONS[activeStep.step] || Package; return <Icon size={16} />; })()}
                    </div>
                    <div className="min-w-0">
                        <p className="font-bold text-heritage text-sm">{activeStep.title}</p>
                        <p className="text-xs text-gray-500 leading-snug truncate">{activeStep.description}</p>
                    </div>
                </div>
            )}

            {/* ══════════════════════════════════════
                Tracking History Timeline (both)
            ══════════════════════════════════════ */}
            {trackingHistory.length > 0 && (
                <div className="mt-6">
                    <h4 className="text-sm font-bold text-heritage mb-3 flex items-center gap-2">
                        <Clock size={14} className="text-copper" />
                        Shipment Activity
                    </h4>
                    <div className="relative pl-5 space-y-3">
                        <div className="absolute left-[7px] top-1 bottom-1 w-0.5 bg-copper/25 rounded-full" />

                        {trackingHistory.slice().reverse().map((scan, idx) => (
                            <div key={idx} className="relative">
                                <div className={`absolute -left-5 top-1.5 w-2.5 h-2.5 rounded-full border-2 border-white ${idx === 0 ? 'bg-copper' : 'bg-copper/35'}`} />
                                <div className="bg-warm-sand/40 rounded-lg p-3 border border-copper/15 ml-1">
                                    <p className="text-sm font-medium text-heritage leading-snug">{scan.status || scan.description}</p>
                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1 text-[11px] text-gray-500">
                                        {scan.location && (
                                            <span className="flex items-center gap-1">
                                                <MapPin size={9} /> {scan.location}
                                            </span>
                                        )}
                                        {scan.timestamp && (
                                            <span>{new Date(scan.timestamp).toLocaleString('en-IN', {
                                                day: 'numeric', month: 'short',
                                                hour: '2-digit', minute: '2-digit'
                                            })}</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ══════════════════════════════════════
                Delivered Success (both)
            ══════════════════════════════════════ */}
            {currentStep === 6 && (
                <div className="mt-6 bg-gradient-to-r from-heritage/10 to-copper/10 border border-copper/30 rounded-xl p-5 text-center">
                    <CheckCircle2 size={40} className="text-copper mx-auto mb-2" />
                    <h3 className="text-base font-bold text-heritage">Delivered Successfully!</h3>
                    <p className="text-xs text-heritage/60 mt-1">Hope you love your Varaha piece ✨</p>
                    <button className="mt-4 px-5 py-2 bg-heritage text-white rounded-full text-sm font-bold hover:bg-copper transition-colors inline-flex items-center gap-2">
                        <Star size={14} /> Rate Your Purchase
                    </button>
                </div>
            )}
        </div>
    );
}
