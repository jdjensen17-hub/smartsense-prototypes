import type { ButtonHTMLAttributes, ReactNode } from 'react';

const primary = '#5CA6D9';
const primaryHover = '#2C82BD';

export function PrimaryButton({ children, disabled, ...rest }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      disabled={disabled}
      {...rest}
      className="rounded px-4 py-2 text-sm font-bold text-white transition-colors disabled:cursor-not-allowed"
      style={{ backgroundColor: disabled ? '#E4E6EA' : primary, color: disabled ? '#9BA0B0' : '#ffffff' }}
      onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.backgroundColor = primaryHover; }}
      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = disabled ? '#E4E6EA' : primary; }}
    >
      {children}
    </button>
  );
}

export function SecondaryButton({ children, ...rest }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...rest}
      className="rounded px-4 py-2 text-sm font-bold transition-colors"
      style={{ border: '1px solid #CCCDD0', backgroundColor: '#ffffff', color: '#35353B' }}
      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#F7F7FA'; }}
      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#ffffff'; }}
    >
      {children}
    </button>
  );
}

export function DangerButton({ children, ...rest }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...rest}
      className="rounded px-4 py-2 text-sm font-bold text-white transition-colors"
      style={{ backgroundColor: '#D64545' }}
      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#B42323'; }}
      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#D64545'; }}
    >
      {children}
    </button>
  );
}

export function MenuButton({ danger, children, onClick }: { danger?: boolean; children: ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="block w-full px-4 py-2 text-left text-sm transition-colors"
      style={{ color: danger ? '#D64545' : '#35353B' }}
      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#F7F7FA'; }}
      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = ''; }}
    >
      {children}
    </button>
  );
}
