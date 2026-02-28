import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

const ICONS = {
    success: { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-50', border: 'border-green-200' },
    error: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-200' },
    warning: { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-200' },
    info: { icon: Info, color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-200' },
};

// ─── Toast Notification (replaces alert()) ───
function Toast({ id, message, type = 'info', onClose }) {
    const config = ICONS[type] || ICONS.info;
    const Icon = config.icon;

    useEffect(() => {
        const timer = setTimeout(() => onClose(id), 3500);
        return () => clearTimeout(timer);
    }, [id, onClose]);

    return (
        <div className={`flex items-start gap-3 px-4 py-3 rounded-xl border shadow-lg ${config.bg} ${config.border} animate-slide-in min-w-[320px] max-w-md`}>
            <Icon size={20} className={`${config.color} flex-shrink-0 mt-0.5`} />
            <p className="text-sm text-gray-800 flex-1 font-medium">{message}</p>
            <button onClick={() => onClose(id)} className="text-gray-400 hover:text-gray-600 flex-shrink-0">
                <X size={16} />
            </button>
        </div>
    );
}

// ─── Confirm Dialog (replaces confirm()) ───
function ConfirmDialog({ message, onConfirm, onCancel, confirmText = 'Confirm', cancelText = 'Cancel', type = 'warning' }) {
    const config = ICONS[type] || ICONS.warning;
    const Icon = config.icon;

    return (
        <div className="fixed inset-0 bg-black/40 z-[100] flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-scale-in">
                <div className="p-6 text-center">
                    <div className={`w-14 h-14 rounded-full ${config.bg} flex items-center justify-center mx-auto mb-4`}>
                        <Icon size={28} className={config.color} />
                    </div>
                    <p className="text-gray-800 font-medium text-sm leading-relaxed">{message}</p>
                </div>
                <div className="flex border-t border-gray-100">
                    <button
                        onClick={onCancel}
                        className="flex-1 py-3.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition border-r border-gray-100"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        className="flex-1 py-3.5 text-sm font-bold text-white bg-copper hover:bg-heritage transition"
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Provider ───
export function AdminToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);
    const [confirmState, setConfirmState] = useState(null);

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const toast = useCallback((message, type = 'info') => {
        const id = Date.now() + Math.random();
        setToasts(prev => [...prev, { id, message, type }]);
    }, []);

    const success = useCallback((msg) => toast(msg, 'success'), [toast]);
    const error = useCallback((msg) => toast(msg, 'error'), [toast]);
    const warning = useCallback((msg) => toast(msg, 'warning'), [toast]);
    const info = useCallback((msg) => toast(msg, 'info'), [toast]);

    const showConfirm = useCallback((message, { confirmText, cancelText, type } = {}) => {
        return new Promise((resolve) => {
            setConfirmState({
                message,
                confirmText: confirmText || 'Confirm',
                cancelText: cancelText || 'Cancel',
                type: type || 'warning',
                resolve,
            });
        });
    }, []);

    const handleConfirm = () => {
        confirmState?.resolve(true);
        setConfirmState(null);
    };

    const handleCancel = () => {
        confirmState?.resolve(false);
        setConfirmState(null);
    };

    return (
        <ToastContext.Provider value={{ toast, success, error, warning, info, confirm: showConfirm }}>
            {children}

            {/* Toast Stack */}
            {toasts.length > 0 && (
                <div className="fixed top-4 right-4 z-[200] flex flex-col gap-2">
                    {toasts.map(t => (
                        <Toast key={t.id} {...t} onClose={removeToast} />
                    ))}
                </div>
            )}

            {/* Confirm Dialog */}
            {confirmState && (
                <ConfirmDialog
                    message={confirmState.message}
                    confirmText={confirmState.confirmText}
                    cancelText={confirmState.cancelText}
                    type={confirmState.type}
                    onConfirm={handleConfirm}
                    onCancel={handleCancel}
                />
            )}

            <style jsx global>{`
                @keyframes slideIn {
                    from { opacity: 0; transform: translateX(100%); }
                    to { opacity: 1; transform: translateX(0); }
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes scaleIn {
                    from { opacity: 0; transform: scale(0.9); }
                    to { opacity: 1; transform: scale(1); }
                }
                .animate-slide-in { animation: slideIn 0.3s ease-out; }
                .animate-fade-in { animation: fadeIn 0.2s ease-out; }
                .animate-scale-in { animation: scaleIn 0.2s ease-out; }
            `}</style>
        </ToastContext.Provider>
    );
}

const noop = () => {};
const noopConfirm = () => Promise.resolve(false);
const fallback = { toast: noop, success: noop, error: noop, warning: noop, info: noop, confirm: noopConfirm };

export function useAdminToast() {
    const ctx = useContext(ToastContext);
    return ctx || fallback;
}
