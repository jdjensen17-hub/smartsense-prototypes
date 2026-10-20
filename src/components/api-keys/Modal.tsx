import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { Button } from './ui';
import { C } from './tokens';

export function Modal({
  title,
  subtitle,
  icon,
  width = 480,
  onClose,
  dismissable = true,
  children,
  footer,
  layer = 'base',
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  icon?: ReactNode;
  width?: number;
  /** Omitted on dialogs that must be finished, not dismissed. */
  onClose?: () => void;
  dismissable?: boolean;
  children?: ReactNode;
  footer: ReactNode;
  layer?: 'base' | 'top';
}) {
  useEffect(() => {
    if (!dismissable || !onClose) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose?.();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [dismissable, onClose]);

  return createPortal(
    <div className="fixed inset-0 flex items-center justify-center p-4" style={{ zIndex: layer === 'top' ? 60 : 50 }}>
      {dismissable && onClose ? (
        <button aria-label="Close dialog" onClick={onClose} className="absolute inset-0" style={{ backgroundColor: 'rgba(53,53,59,0.45)' }} />
      ) : (
        <div className="absolute inset-0" style={{ backgroundColor: 'rgba(53,53,59,0.45)' }} />
      )}
      <div
        role="dialog"
        aria-modal="true"
        className="relative flex max-h-full w-full flex-col rounded bg-white"
        style={{ maxWidth: width, border: `1px solid ${C.border}`, boxShadow: '0 12px 40px rgba(0,0,0,0.18)' }}
      >
        <div className="flex items-start gap-3 px-5 pt-5">
          {icon}
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-semibold" style={{ color: C.text }}>{title}</h2>
            {subtitle && <p className="mt-1 text-sm" style={{ color: C.text2 }}>{subtitle}</p>}
          </div>
          {dismissable && onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="flex h-7 w-7 items-center justify-center rounded"
              style={{ color: C.text3, background: 'transparent', border: 'none', cursor: 'pointer' }}
            >
              <X size={16} strokeWidth={1.8} />
            </button>
          )}
        </div>
        {children && <div className="overflow-auto px-5 py-4 text-sm" style={{ color: C.text }}>{children}</div>}
        <div className="flex items-center justify-end gap-2 px-5 py-3" style={{ borderTop: `1px solid ${C.border}` }}>{footer}</div>
      </div>
    </div>,
    document.body,
  );
}

export function IconBadge({ tone, children }: { tone: 'info' | 'warn' | 'danger' | 'ok'; children: ReactNode }) {
  const tones = {
    info: { backgroundColor: C.primaryWeak, color: C.primary },
    warn: { backgroundColor: C.warnBg, color: C.warnText },
    danger: { backgroundColor: C.dangerBg, color: C.danger },
    ok: { backgroundColor: C.successBg, color: C.successText },
  };
  return (
    <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full" style={tones[tone]}>
      {children}
    </span>
  );
}

export function ConfirmDialog({
  tone,
  icon,
  title,
  body,
  confirmLabel,
  confirmVariant = 'primary',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  layer = 'base',
}: {
  tone: 'warn' | 'danger';
  icon: ReactNode;
  title: string;
  body: string;
  confirmLabel: string;
  confirmVariant?: 'primary' | 'danger';
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  layer?: 'base' | 'top';
}) {
  return (
    <Modal
      title={title}
      icon={<IconBadge tone={tone}>{icon}</IconBadge>}
      onClose={onCancel}
      layer={layer}
      footer={
        <>
          <Button onClick={onCancel}>{cancelLabel}</Button>
          <Button variant={confirmVariant} onClick={onConfirm}>{confirmLabel}</Button>
        </>
      }
    >
      {body}
    </Modal>
  );
}
