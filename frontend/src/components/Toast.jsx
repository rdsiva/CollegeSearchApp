import { useEffect } from 'react';
import { CheckCircle2, AlertTriangle, X, Info } from 'lucide-react';

/**
 * Tiny stack of toasts at the top-right. Auto-dismisses after `duration` ms.
 *
 * toasts: [{ id, kind: 'success'|'error'|'info', message, duration? }]
 * onDismiss(id): remove a toast by id
 */
export default function ToastStack({ toasts, onDismiss }) {
  if (!toasts || toasts.length === 0) return null;
  return (
    <div className="fixed top-4 right-4 z-[60] space-y-2 max-w-sm">
      {toasts.map((t) => (
        <Toast key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function Toast({ toast, onDismiss }) {
  const duration = toast.duration ?? 5000;
  useEffect(() => {
    if (duration <= 0) return;
    const t = setTimeout(() => onDismiss(toast.id), duration);
    return () => clearTimeout(t);
  }, [toast.id, duration, onDismiss]);

  const ICONS = {
    success: <CheckCircle2 size={18} className="text-emerald-600" />,
    error: <AlertTriangle size={18} className="text-red-600" />,
    info: <Info size={18} className="text-blue-600" />,
  };
  const COLORS = {
    success: 'bg-white border-emerald-200',
    error: 'bg-white border-red-200',
    info: 'bg-white border-blue-200',
  };

  const kind = toast.kind || 'info';
  return (
    <div
      className={`flex items-start gap-2 p-3 pr-2 border rounded-xl shadow-md ${COLORS[kind]}`}
      role="status"
    >
      <div className="mt-0.5">{ICONS[kind]}</div>
      <div className="flex-1 text-sm text-gray-800 leading-snug">{toast.message}</div>
      <button
        onClick={() => onDismiss(toast.id)}
        className="text-gray-400 hover:text-gray-700 mt-0.5"
      >
        <X size={14} />
      </button>
    </div>
  );
}
