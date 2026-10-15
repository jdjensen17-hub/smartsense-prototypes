import { STATUS_COLORS, type StatusColor } from '@/data/statusSets';

export function StatusChip({ status, size = 'md', checked = false }: { status: { name: string; color: StatusColor }; size?: 'sm' | 'md'; checked?: boolean }) {
  const color = STATUS_COLORS[status.color];
  const sm = size === 'sm';
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        background: color.bg,
        color: color.fg,
        borderRadius: 999,
        padding: sm ? '1px 8px' : '2px 10px',
        fontSize: sm ? 12 : 13,
        fontWeight: 600,
        lineHeight: '18px',
        whiteSpace: 'nowrap',
        boxShadow: checked ? `inset 0 0 0 1.5px ${color.dot}` : undefined,
      }}
    >
      <span style={{ width: 8, height: 8, borderRadius: 99, background: color.dot, flexShrink: 0 }} />
      {checked && <i className="ti ti-check" style={{ fontSize: sm ? 11 : 12 }} />}
      {status.name}
    </span>
  );
}
