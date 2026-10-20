// Shared chrome for the Admin › API Keys prototype. Admin hex palette, matching the other admin pages.

import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, LifeBuoy } from 'lucide-react';
import { apiKeys, type ViewAs } from '@/data/apiKeys';
import { C } from './tokens';

type Tone = 'active' | 'revoked' | 'danger' | 'warn' | 'info' | 'support' | 'next';

const TONES: Record<Tone, CSSProperties> = {
  active: { backgroundColor: C.successBg, color: C.successText, border: '1px solid #B8E3C7' },
  revoked: { backgroundColor: C.inset, color: C.text2, border: `1px solid ${C.borderSoft}` },
  danger: { backgroundColor: C.dangerBg, color: C.dangerText, border: '1px solid #F3C1BF' },
  warn: { backgroundColor: C.warnBg, color: C.warnText, border: '1px solid #F5D48F' },
  info: { backgroundColor: C.primaryWeak, color: C.primaryText, border: '1px solid #B9D4F5' },
  support: { backgroundColor: C.supportBg, color: C.supportText, border: `1px solid ${C.supportBorder}` },
  next: { backgroundColor: C.supportBg, color: C.supportText, border: `1px solid ${C.supportBorder}` },
};

export function Pill({ tone, children }: { tone: Tone; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-semibold" style={{ ...TONES[tone], whiteSpace: 'nowrap' }}>
      {children}
    </span>
  );
}

export function Code({ children }: { children: ReactNode }) {
  return (
    <span
      className="inline-block rounded px-1.5 text-xs"
      style={{ backgroundColor: C.app, border: `1px solid ${C.borderSoft}`, color: '#3A3E42', fontFamily: 'var(--ss-font-mono)', lineHeight: '18px', whiteSpace: 'nowrap' }}
    >
      {children}
    </span>
  );
}

/** The dark "Task" chip that shows how a Task is labelled in Operate. */
export function KindChip() {
  return (
    <span className="inline-flex items-center rounded px-2 text-xs font-bold" style={{ backgroundColor: '#24292F', color: '#ffffff', lineHeight: '20px' }}>
      Task
    </span>
  );
}

/** The source pill that names the key on every Task it creates. */
export function SourcePill({ children }: { children: ReactNode }) {
  return (
    <span
      className="inline-flex items-center rounded px-2 text-xs font-semibold"
      style={{ backgroundColor: C.primaryWeak, color: C.primaryText, border: '1px solid #B9D4F5', lineHeight: '20px', whiteSpace: 'nowrap' }}
    >
      {children}
    </span>
  );
}

export function Banner({ tone = 'info', icon, children }: { tone?: 'info' | 'warn' | 'danger' | 'gray' | 'support'; icon: ReactNode; children: ReactNode }) {
  const styles: Record<string, CSSProperties> = {
    info: { backgroundColor: '#F2F7FE', border: '1px solid #B9D4F5', color: C.text },
    warn: { backgroundColor: C.warnBg, border: '1px solid #F5D48F', color: C.warnText },
    danger: { backgroundColor: C.dangerBg, border: '1px solid #F3C1BF', color: C.text },
    gray: { backgroundColor: C.app, border: `1px solid ${C.border}`, color: C.text },
    support: { backgroundColor: '#F6F3FD', border: `1px solid ${C.supportBorder}`, color: C.text },
  };
  return (
    <div className="flex items-start gap-2.5 rounded px-3 py-2.5 text-sm" style={styles[tone]}>
      <span className="mt-0.5 flex-shrink-0">{icon}</span>
      <div className="flex-1">{children}</div>
    </div>
  );
}

export function SupportBanner({ viewAs, orgName }: { viewAs: ViewAs; orgName: string }) {
  if (viewAs !== 'support') return null;
  return (
    <Banner tone="support" icon={<LifeBuoy size={16} strokeWidth={1.8} color={C.supportText} />}>
      <span className="font-semibold">Viewing as SmartSense support · read-only</span>{' '}
      <span>Only {orgName} admins can add, rotate, or revoke keys.</span>
      <button
        type="button"
        onClick={() => apiKeys.setViewAs('admin')}
        className="ml-2 text-sm font-bold"
        style={{ color: C.primary, background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}
      >
        Switch to org admin
      </button>
    </Banner>
  );
}

export function Panel({ children, flush, className = '' }: { children: ReactNode; flush?: boolean; className?: string }) {
  return (
    <div className={`rounded bg-white ${flush ? '' : 'p-4'} ${className}`} style={{ border: `1px solid ${C.border}` }}>
      {children}
    </div>
  );
}

export function PanelHead({ title, subtitle, action, className = '' }: { title: string; subtitle?: string; action?: ReactNode; className?: string }) {
  return (
    <div className={`flex items-start gap-3 ${className}`}>
      <div className="min-w-0 flex-1">
        <h2 className="text-sm font-semibold" style={{ color: C.text }}>{title}</h2>
        {subtitle && <p className="mt-0.5 text-xs" style={{ color: C.text2 }}>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Crumbs({ items }: { items: { label: string; to?: string }[] }) {
  return (
    <div className="mb-2 flex flex-wrap items-center gap-1.5 text-xs" style={{ color: C.text2 }}>
      {items.map((item, index) => (
        <span key={`${item.label}-${index}`} className="flex items-center gap-1.5">
          {index > 0 && <ChevronRight size={12} strokeWidth={1.8} />}
          {item.to ? (
            <Link to={item.to} style={{ color: C.text2, fontWeight: 400 }} className="hover:underline">{item.label}</Link>
          ) : (
            <span>{item.label}</span>
          )}
        </span>
      ))}
    </div>
  );
}

export function PageHead({ title, badge, subtitle, actions }: { title: ReactNode; badge?: ReactNode; subtitle: string; actions?: ReactNode }) {
  return (
    <div className="mb-3.5 flex items-start gap-3">
      <div className="min-w-0 flex-1">
        <h1 className="flex flex-wrap items-center gap-2.5 text-2xl font-semibold" style={{ color: C.text }}>
          {title}
          {badge}
        </h1>
        <p className="mt-1 text-sm" style={{ color: C.text2, maxWidth: 820 }}>{subtitle}</p>
      </div>
      {actions && <div className="flex flex-shrink-0 items-center gap-2 pt-1">{actions}</div>}
    </div>
  );
}

type ButtonVariant = 'default' | 'primary' | 'danger' | 'danger-outline';

export function Button({
  variant = 'default',
  small,
  icon,
  children,
  disabled,
  style,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; small?: boolean; icon?: ReactNode }) {
  const palette: Record<ButtonVariant, { base: CSSProperties; hover: string }> = {
    default: { base: { backgroundColor: C.surface, color: C.text, border: `1px solid ${C.border}` }, hover: C.app },
    primary: { base: { backgroundColor: C.primary, color: '#ffffff', border: `1px solid ${C.primary}` }, hover: C.primaryHover },
    danger: { base: { backgroundColor: C.danger, color: '#ffffff', border: `1px solid ${C.danger}` }, hover: C.dangerHover },
    'danger-outline': { base: { backgroundColor: C.surface, color: C.danger, border: '1px solid #F3C1BF' }, hover: C.dangerBg },
  };
  const tone = palette[variant];
  const base: CSSProperties = disabled
    ? { backgroundColor: '#E4E6EA', color: C.text3, border: '1px solid #E4E6EA' }
    : tone.base;
  return (
    <button
      type="button"
      disabled={disabled}
      {...rest}
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded font-bold transition-colors ${small ? 'px-2.5 py-1 text-xs' : 'px-3.5 py-2 text-sm'} ${disabled ? 'cursor-not-allowed' : ''}`}
      style={{ ...base, ...style }}
      onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.backgroundColor = tone.hover; }}
      onMouseLeave={(e) => { if (!disabled) e.currentTarget.style.backgroundColor = String(tone.base.backgroundColor); }}
    >
      {icon}
      {children}
    </button>
  );
}

export function LinkButton({ danger, icon, children, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { danger?: boolean; icon?: ReactNode }) {
  return (
    <button
      type="button"
      {...rest}
      className="inline-flex items-center gap-1 text-sm font-bold hover:underline"
      style={{ color: danger ? C.danger : C.primary, background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}
    >
      {icon}
      {children}
    </button>
  );
}

export function FieldLabel({ htmlFor, children, counter }: { htmlFor?: string; children: ReactNode; counter?: string }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 flex items-center justify-between text-xs font-semibold uppercase tracking-wide" style={{ color: C.text3 }}>
      <span>{children}</span>
      {counter && <span style={{ textTransform: 'none', letterSpacing: 0, fontWeight: 400 }}>{counter}</span>}
    </label>
  );
}

export function Help({ children }: { children: ReactNode }) {
  return <p className="mt-1.5 text-xs" style={{ color: C.text2 }}>{children}</p>;
}

export function FieldError({ children }: { children: ReactNode }) {
  return <p className="mt-1.5 text-xs font-semibold" style={{ color: C.danger }}>{children}</p>;
}

export function Spinner({ label = 'Resolving…' }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold" style={{ color: C.text2 }}>
      <span
        aria-hidden
        style={{
          width: 12,
          height: 12,
          borderRadius: '50%',
          border: `2px solid ${C.border}`,
          borderTopColor: C.primary,
          display: 'inline-block',
          animation: 'api-key-spin 0.8s linear infinite',
        }}
      />
      <style>{'@keyframes api-key-spin { to { transform: rotate(360deg); } }'}</style>
      {label}
    </span>
  );
}

export function EmptyCard({ icon, title, body, action, tone = 'info' }: { icon: ReactNode; title: string; body: string; action?: ReactNode; tone?: 'info' | 'gray' }) {
  return (
    <div className="rounded bg-white px-6 py-11 text-center" style={{ border: `1px solid ${C.border}` }}>
      <div
        className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full"
        style={tone === 'gray' ? { backgroundColor: C.inset, color: C.text2 } : { backgroundColor: C.primaryWeak, color: C.primary }}
      >
        {icon}
      </div>
      <h2 className="text-base font-semibold" style={{ color: C.text }}>{title}</h2>
      <p className="mx-auto mt-1.5 max-w-md text-sm" style={{ color: C.text2 }}>{body}</p>
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}

export function TableCard({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded bg-white" style={{ border: `1px solid ${C.border}` }}>
      {children}
    </div>
  );
}

export function Th({ children, align = 'left', width }: { children?: ReactNode; align?: 'left' | 'right'; width?: string }) {
  return (
    <th className="px-3.5 text-xs font-medium" style={{ color: C.text3, height: 34, textAlign: align, whiteSpace: 'nowrap', width }}>
      {children}
    </th>
  );
}
