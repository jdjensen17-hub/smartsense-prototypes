import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

export function Modal({
  title,
  subtitle,
  icon,
  onClose,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  onClose: () => void;
  children: ReactNode;
  footer: ReactNode;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button aria-label="Close dialog" onClick={onClose} className="absolute inset-0" style={{ backgroundColor: 'rgba(53,53,59,0.45)' }} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="status-modal-title"
        className="relative flex w-full flex-col rounded bg-white"
        style={{ maxWidth: 480, border: '1px solid #CCCDD0', boxShadow: '0 12px 40px rgba(0,0,0,0.18)' }}
      >
        <div className="flex items-start gap-3 px-5 pt-5">
          {icon}
          <div className="min-w-0 flex-1">
            <h2 id="status-modal-title" className="text-base font-semibold" style={{ color: '#35353B' }}>{title}</h2>
            {subtitle && <p className="mt-0.5 text-sm" style={{ color: '#757677' }}>{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-7 w-7 items-center justify-center rounded"
            style={{ color: '#9BA0B0' }}
          >
            ✕
          </button>
        </div>
        <div className="px-5 py-4 text-sm" style={{ color: '#35353B' }}>{children}</div>
        <div className="flex justify-end gap-2 px-5 py-3" style={{ borderTop: '1px solid #CCCDD0' }}>{footer}</div>
      </div>
    </div>,
    document.body,
  );
}

export function IconBadge({ tone, children }: { tone: 'danger' | 'warn'; children: ReactNode }) {
  const warn = tone === 'warn';
  return (
    <span
      className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full"
      style={{ backgroundColor: warn ? '#FFF4D6' : '#FDECEC', color: warn ? '#A15C07' : '#D64545' }}
    >
      {children}
    </span>
  );
}
