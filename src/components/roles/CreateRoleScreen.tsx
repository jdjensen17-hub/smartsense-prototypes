// ── CreateRoleScreen ──────────────────────────────────────────────────────────
// Name and description step of the Clone & customize workflow.
// Always operates as a clone — no blank/scratch path.
// embedded=true suppresses the internal header since the drawer provides its own.

import type { RoleDef, RoleKey } from '@/data/roles';

export function CreateRoleScreen({
  baseRoleKey, roleDefs, onCancel, onContinue,
  newRoleName, setNewRoleName, newRoleDesc, setNewRoleDesc,
  embedded = false,
}: {
  baseRoleKey: RoleKey; roleDefs: RoleDef[];
  onCancel: () => void; onContinue: () => void;
  newRoleName: string; setNewRoleName: (v: string) => void;
  newRoleDesc: string; setNewRoleDesc: (v: string) => void;
  embedded?: boolean;
}) {
  const baseRole = roleDefs.find((r) => r.key === baseRoleKey);
  const baseRoleLabel = baseRole?.name ?? baseRoleKey;

  const inputClass = "mt-1 w-full rounded px-3 py-2 text-sm focus:outline-none transition-colors";
  const inputStyle = { border: '1px solid #CCCDD0', color: '#35353B', backgroundColor: '#ffffff' };

  return (
    <div className="space-y-4">

      {/* Header — suppressed when embedded in drawer */}
      {!embedded && (
        <div>
          <button
            onClick={onCancel}
            className="text-sm mb-1 flex items-center gap-1 transition-colors"
            style={{ color: '#9BA0B0' }}
            onMouseEnter={e => e.currentTarget.style.color = '#35353B'}
            onMouseLeave={e => e.currentTarget.style.color = '#9BA0B0'}
          >
            ← Back
          </button>
          <h1 className="text-2xl font-semibold" style={{ color: '#35353B' }}>Clone &amp; Customize Role</h1>
          <p className="mt-1 text-sm" style={{ color: '#757677' }}>Starting point: {baseRoleLabel}</p>
        </div>
      )}

      {/* Name + description fields */}
      <div className="overflow-hidden rounded bg-white p-5 space-y-4" style={{ border: '1px solid #CCCDD0' }}>
        <div>
          <label className="text-sm font-medium" style={{ color: '#35353B' }}>Role name</label>
          <input
            value={newRoleName}
            onChange={(e) => setNewRoleName(e.target.value)}
            placeholder="e.g. District Overseer"
            className={inputClass}
            style={inputStyle}
            onFocus={e => e.currentTarget.style.borderColor = '#9BA0B0'}
            onBlur={e => e.currentTarget.style.borderColor = '#CCCDD0'}
          />
        </div>
        <div>
          <label className="text-sm font-medium" style={{ color: '#35353B' }}>Description <span className="font-normal" style={{ color: '#9BA0B0' }}>(optional)</span></label>
          <textarea
            value={newRoleDesc}
            onChange={(e) => setNewRoleDesc(e.target.value)}
            rows={3}
            className={inputClass}
            style={inputStyle}
            onFocus={e => e.currentTarget.style.borderColor = '#9BA0B0'}
            onBlur={e => e.currentTarget.style.borderColor = '#CCCDD0'}
          />
        </div>
      </div>

      {/* Provenance note */}
      <div className="rounded bg-white p-4 text-sm" style={{ border: '1px solid #CCCDD0', color: '#757677' }}>
        This role starts with all permissions from{' '}
        <span className="font-medium" style={{ color: '#35353B' }}>{baseRoleLabel}</span>.
        You can customize access in the next step.
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <button
          onClick={onCancel}
          className="rounded px-4 py-2 text-sm font-bold transition-colors"
          style={{ border: '1px solid #CCCDD0', color: '#757677' }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F7F7FA'}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = ''}
        >
          Cancel
        </button>
        <button
          onClick={onContinue}
          className="rounded px-4 py-2 text-sm font-bold text-white transition-colors"
          style={{ backgroundColor: '#5CA6D9' }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = '#2C82BD'}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = '#5CA6D9'}
        >
          Continue
        </button>
      </div>

    </div>
  );
}
