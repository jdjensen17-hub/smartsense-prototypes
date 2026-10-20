import { useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { CircleCheck } from 'lucide-react';
import { getToast, subscribeToast } from './toastStore';

export function ToastHost() {
  const current = useSyncExternalStore(subscribeToast, getToast);
  if (!current) return null;
  return createPortal(
    <div
      role="status"
      className="fixed bottom-6 left-1/2 flex items-center gap-2 rounded px-3.5 py-2 text-sm"
      style={{ transform: 'translateX(-50%)', backgroundColor: '#24292F', color: '#ffffff', zIndex: 70, boxShadow: '0 4px 16px rgba(20,24,28,0.2)' }}
    >
      <CircleCheck size={16} strokeWidth={1.8} color="#6FD39A" />
      {current}
    </div>,
    document.body,
  );
}
