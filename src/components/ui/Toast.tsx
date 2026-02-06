import { useEffect } from 'react';
import { createPortal } from 'react-dom';

import { AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
import { create } from 'zustand';

import { cn } from '@/lib/utils';

type ToastVariant = 'success' | 'error' | 'warning';

interface ToastItem {
  id: string;
  message: string;
  variant: ToastVariant;
}

const useToastStore = create<{
  toasts: ToastItem[];
  add: (item: Omit<ToastItem, 'id'>) => void;
  remove: (id: string) => void;
}>((set) => ({
  toasts: [],
  add: (item) =>
    set((s) => ({ toasts: [...s.toasts, { ...item, id: String(Date.now()) }] })),
  remove: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

export const toast = {
  success: (message: string) => useToastStore.getState().add({ message, variant: 'success' }),
  error: (message: string) => useToastStore.getState().add({ message, variant: 'error' }),
  warning: (message: string) => useToastStore.getState().add({ message, variant: 'warning' }),
};

const ICONS: Record<ToastVariant, React.ReactNode> = {
  success: <CheckCircle2 className="h-4 w-4 text-emerald-600" />,
  error: <XCircle className="h-4 w-4 text-red-600" />,
  warning: <AlertCircle className="h-4 w-4 text-amber-600" />,
};

const STYLES: Record<ToastVariant, string> = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  error: 'border-red-200 bg-red-50 text-red-900',
  warning: 'border-amber-200 bg-amber-50 text-amber-900',
};

function ToastRow({ item }: { item: ToastItem }) {
  const remove = useToastStore((s) => s.remove);

  useEffect(() => {
    const timer = setTimeout(() => remove(item.id), 3000);
    return () => clearTimeout(timer);
  }, [item.id, remove]);

  return (
    <div
      className={cn(
        'animate-in slide-in-from-bottom-2 fade-in flex min-w-[280px] max-w-[420px] items-center gap-2.5 rounded-lg border px-4 py-3 text-sm shadow-lg',
        STYLES[item.variant],
      )}
    >
      {ICONS[item.variant]}
      <p className="font-medium">{item.message}</p>
    </div>
  );
}

export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  if (toasts.length === 0) return null;

  return createPortal(
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col-reverse gap-2">
      {toasts.map((t) => (
        <ToastRow key={t.id} item={t} />
      ))}
    </div>,
    document.body,
  );
}
