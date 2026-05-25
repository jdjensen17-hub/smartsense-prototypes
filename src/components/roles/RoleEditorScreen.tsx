// ── RoleEditorScreen ──────────────────────────────────────────────────────────
// Clone & Scope workflow: adjust which modules a cloned role has access to
// by checking / unchecking permission sets per module.

import { useState } from 'react';
import type { RoleKey } from '@/data/roles';
import { ROLE_DEFS } from '@/data/roles';
import PermissionAccordion from '@/components/shared/PermissionAccordion';

export function RoleEditorScreen({
  role, onBack, embedded = false,
}: {
  role: { moduleAccess: never[]; baseRoleKey: RoleKey; name: string; description: string; };
  onBack: () => void; embedded?: boolean;
}) {
  const baseRoleDef = ROLE_DEFS.find((r) => r.key === role.baseRoleKey);
  const baseRoleLabel = baseRoleDef?.name ?? role.baseRoleKey;

  const [checkedKeys, setCheckedKeys] = useState<Set<string>>(
    () => new Set(baseRoleDef?.permissionSetKeys ?? [])
  );

  return (
    <div className="space-y-4">

      {/* Header — suppressed when embedded in drawer */}
      {!embedded && (
        <div className="flex items-start justify-between gap-4">
          <div>
            <button
              onClick={onBack}
              className="text-sm mb-1 flex items-center gap-1 transition-colors"
              style={{ color: '#9BA0B0' }}
              onMouseEnter={e => e.currentTarget.style.color = '#35353B'}
              onMouseLeave={e => e.currentTarget.style.color = '#9BA0B0'}
            >
              ← Back
            </button>
            <h1 className="text-2xl font-semibold" style={{ color: '#35353B' }}>{role.name}</h1>
            {role.description && (
              <p className="mt-1 max-w-2xl text-sm" style={{ color: '#757677' }}>{role.description}</p>
            )}
            <p className="mt-1 text-sm" style={{ color: '#9BA0B0' }}>
              Based on:{' '}
              <span className="font-medium" style={{ color: '#35353B' }}>{baseRoleLabel}</span>
            </p>
          </div>
          <button
            onClick={() => setCheckedKeys(new Set())}
            className="shrink-0 rounded px-3 py-1.5 text-xs font-bold transition-colors mt-6"
            style={{ border: '1px solid #CCCDD0', color: '#757677' }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#F7F7FA'; e.currentTarget.style.borderColor = '#9BA0B0'; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = ''; e.currentTarget.style.borderColor = '#CCCDD0'; }}
          >
            Clear all
          </button>
        </div>
      )}

      {/* Clear all — shown inline when embedded */}
      {embedded && (
        <div className="flex justify-end">
          <button
            onClick={() => setCheckedKeys(new Set())}
            className="text-xs underline underline-offset-2 transition-colors"
            style={{ color: '#9BA0B0' }}
            onMouseEnter={e => e.currentTarget.style.color = '#35353B'}
            onMouseLeave={e => e.currentTarget.style.color = '#9BA0B0'}
          >
            Clear all
          </button>
        </div>
      )}

      {/* Permission accordion — always in edit mode here */}
      <PermissionAccordion
        checkedKeys={checkedKeys}
        isEditing={true}
        onChange={setCheckedKeys}
        moduleAccess={role?.moduleAccess ?? []}
      />

      {/* Footer */}
      <div className="flex justify-end gap-3 pt-2">
        <button
          onClick={onBack}
          className="rounded px-4 py-2 text-sm font-bold transition-colors"
          style={{ border: '1px solid #CCCDD0', color: '#757677' }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F7F7FA'}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = ''}
        >
          Cancel
        </button>
        <button
          className="rounded px-4 py-2 text-sm font-bold text-white transition-colors"
          style={{ backgroundColor: '#5CA6D9' }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = '#2C82BD'}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = '#5CA6D9'}
        >
          Save role
        </button>
      </div>

    </div>
  );
}
