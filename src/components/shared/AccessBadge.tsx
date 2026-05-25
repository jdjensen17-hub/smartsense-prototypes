// ── AccessBadge ───────────────────────────────────────────────────────────────
// Shared badge for module access levels. Used by RolePickerScreen and
// RoleEditorScreen.

import type { AccessLevel } from '@/data/roles';

export type { AccessLevel };

export function AccessBadge({ access }: { access: AccessLevel }) {
  const styles: Record<AccessLevel, string> = {
    full:          'bg-emerald-50 text-emerald-700 border border-emerald-200',
    partial:       'bg-amber-50 text-amber-700 border border-amber-200',
    view_only:     'bg-blue-50 text-blue-700 border border-blue-200',
    no_access:     'bg-white text-slate-400 border border-slate-200',
    not_purchased: 'bg-white text-slate-400 border border-dashed border-slate-300 italic',
  };
  const labels: Record<AccessLevel, string> = {
    full:          'Full access',
    partial:       'Partial',
    view_only:     'View only',
    no_access:     'No access',
    not_purchased: 'Not purchased',
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${styles[access]}`}>
      {labels[access]}
    </span>
  );
}
