import React, { useState } from 'react';
import { PERMISSION_SETS, type PermissionSet } from '@/data/permissionSets';
import { AccessBadge } from '@/components/shared/AccessBadge';

type AccessLevel = 'full' | 'partial' | 'view_only' | 'no_access' | 'not_purchased';

interface ModuleAccess {
  module: string;
  access: AccessLevel;
}

interface Props {
  checkedKeys: Set<string>;
  isEditing: boolean;
  onChange?: (next: Set<string>) => void;
  moduleAccess: ModuleAccess[];
}

const MODULE_ORDER = ['admin', 'assure', 'guard', 'label', 'monitor', 'operate', 'schedule', 'service'];

const MODULE_LABELS: Record<string, string> = {
  admin: 'Admin', assure: 'Assure', guard: 'Guard', label: 'Label',
  monitor: 'Monitor', operate: 'Operate', schedule: 'Schedule', service: 'Service',
};

function deriveAccessLevel(
  moduleKey: string, checkedKeys: Set<string>, setsInModule: PermissionSet[], overrideAccess?: AccessLevel
): AccessLevel {
  if (overrideAccess === 'not_purchased') return 'not_purchased';
  if (overrideAccess === 'no_access') return 'no_access';
  const moduleSetKeys = setsInModule.map(s => s.key);
  const checkedCount = moduleSetKeys.filter(k => checkedKeys.has(k)).length;
  if (checkedCount === 0) return 'no_access';
  if (checkedCount === moduleSetKeys.length) return 'full';
  return 'partial';
}

function formatVerbs(verbs: string[]): string {
  return verbs.join(', ');
}

// ── Custom checkbox ───────────────────────────────────────────────────────────

function Checkbox({ checked, onChange }: { checked: boolean; onChange?: () => void }) {
  return (
    <div
      onClick={onChange}
      className="h-4 w-4 rounded flex items-center justify-center flex-shrink-0 transition-colors"
      style={{
        backgroundColor: checked ? '#5CA6D9' : '#ffffff',
        border: `1px solid ${checked ? '#5CA6D9' : '#CCCDD0'}`,
        cursor: onChange ? 'pointer' : 'default',
      }}
    >
      {checked && (
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <path d="M2 5l2.5 2.5L8 3" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </div>
  );
}

// ── Resource/verb table ───────────────────────────────────────────────────────

function ResourceVerbTable({ permissionSet }: { permissionSet: PermissionSet }) {
  return (
    <div className="mt-2 mb-1 mx-1 rounded-md overflow-hidden" style={{ border: '1px solid #CCCDD0' }}>
      <table className="w-full text-xs">
        <thead>
          <tr style={{ backgroundColor: '#F7F7FA', borderBottom: '1px solid #CCCDD0' }}>
            <th className="text-left px-3 py-2 font-medium w-2/5" style={{ color: '#757677' }}>Resource</th>
            <th className="text-left px-3 py-2 font-medium" style={{ color: '#757677' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {permissionSet.resources.map((row, idx) => (
            <tr key={row.resource} style={{ borderBottom: idx < permissionSet.resources.length - 1 ? '1px solid #F7F7FA' : 'none' }}>
              <td className="px-3 py-2 align-top" style={{ color: '#9BA0B0' }}>{row.resource}</td>
              <td className="px-3 py-2 align-top" style={{ color: '#9BA0B0' }}>{formatVerbs(row.verbs)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Permission set row ────────────────────────────────────────────────────────

function PermissionSetRow({ permSet, isChecked, isEditing, onToggle }: {
  permSet: PermissionSet; isChecked: boolean; isEditing: boolean; onToggle?: () => void;
}) {
  const [matrixOpen, setMatrixOpen] = useState(false);

  return (
    <div style={{ borderBottom: '1px solid #CCCDD0' }} className="last:border-b-0">
      <div className="flex items-start gap-2 px-3 py-2.5">

        {/* Edit mode: custom checkbox */}
        {isEditing && (
          <div className="mt-0.5">
            <Checkbox checked={isChecked} onChange={onToggle} />
          </div>
        )}

        {/* Read-only mode: check / dash indicator */}
        {!isEditing && (
          <span className="mt-0.5 flex-shrink-0 w-4 text-center text-sm font-medium" style={{ color: isChecked ? '#5CA6D9' : '#CCCDD0' }}>
            {isChecked ? '✓' : '—'}
          </span>
        )}

        {/* Name + description */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium leading-snug" style={{ color: isChecked ? '#35353B' : '#9BA0B0' }}>{permSet.name}</p>
          <p className="text-xs leading-snug mt-0.5" style={{ color: isChecked ? '#9BA0B0' : '#CCCDD0' }}>{permSet.description}</p>

          {/* Resource/verb matrix (read-only only) */}
          {!isEditing && matrixOpen && <ResourceVerbTable permissionSet={permSet} />}
        </div>

        {/* Info icon — read-only only */}
        {!isEditing && (
          <button
            onClick={() => setMatrixOpen(o => !o)}
            className="flex-shrink-0 flex items-center justify-center w-8 h-8 -mr-1 rounded-full transition-colors"
            style={{ color: matrixOpen ? '#5CA6D9' : isChecked ? '#9BA0B0' : '#CCCDD0', backgroundColor: matrixOpen ? '#EBF5FB' : '' }}
            onMouseEnter={e => { if (!matrixOpen) e.currentTarget.style.backgroundColor = '#F7F7FA'; }}
            onMouseLeave={e => { if (!matrixOpen) e.currentTarget.style.backgroundColor = ''; }}
            aria-label={matrixOpen ? 'Hide permissions detail' : 'Show permissions detail'}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-7-4a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM9 9a.75.75 0 0 0 0 1.5h.253a.25.25 0 0 1 .244.304l-.459 2.066A1.75 1.75 0 0 0 10.747 15H11a.75.75 0 0 0 0-1.5h-.253a.25.25 0 0 1-.244-.304l.459-2.066A1.75 1.75 0 0 0 9.253 9H9Z" clipRule="evenodd" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export default function PermissionAccordion({ checkedKeys, isEditing, onChange, moduleAccess }: Props) {
  const [openModules, setOpenModules] = useState<Set<string>>(new Set());

  const accessOverrides: Record<string, AccessLevel> = {};
  moduleAccess.forEach(ma => { accessOverrides[ma.module.toLowerCase()] = ma.access; });

  const setsByModule: Record<string, PermissionSet[]> = {};
  Object.values(PERMISSION_SETS).forEach(ps => {
    const mod = ps.module.toLowerCase();
    if (!setsByModule[mod]) setsByModule[mod] = [];
    setsByModule[mod].push(ps);
  });

  function toggleModule(moduleKey: string) {
    setOpenModules(prev => {
      const next = new Set(prev);
      if (next.has(moduleKey)) next.delete(moduleKey); else next.add(moduleKey);
      return next;
    });
  }

  function toggleSet(key: string) {
    if (!onChange) return;
    const next = new Set(checkedKeys);
    if (next.has(key)) next.delete(key); else next.add(key);
    onChange(next);
  }

  function removeAllInModule(moduleKey: string) {
    if (!onChange) return;
    const keys = (setsByModule[moduleKey] || []).map(s => s.key);
    const next = new Set(checkedKeys);
    keys.forEach(k => next.delete(k));
    onChange(next);
  }

  return (
    <div style={{ borderTop: '1px solid #CCCDD0', borderBottom: '1px solid #CCCDD0' }}>
      {MODULE_ORDER.map(moduleKey => {
        const label = MODULE_LABELS[moduleKey] ?? moduleKey;
        const sets = setsByModule[moduleKey] ?? [];
        const overrideAccess = accessOverrides[moduleKey];
        const isNotPurchased = overrideAccess === 'not_purchased';
        const accessLevel = deriveAccessLevel(moduleKey, checkedKeys, sets, overrideAccess);
        const isNoAccess = !isNotPurchased && accessLevel === 'no_access' && !isEditing;
        const isOpen = openModules.has(moduleKey);
        const checkedInModule = sets.filter(s => checkedKeys.has(s.key));
        const hasCheckedSets = checkedInModule.length > 0;

        // not_purchased: fully inert
        if (isNotPurchased) {
          return (
            <div key={moduleKey} className="flex items-center justify-between px-4 py-3 select-none" style={{ borderBottom: '1px solid #CCCDD0', opacity: 0.4 }}>
              <span className="text-sm font-medium" style={{ color: '#9BA0B0' }}>{label}</span>
              <AccessBadge access="not_purchased" />
            </div>
          );
        }

        // no_access in read-only: inert module row
        if (isNoAccess) {
          return (
            <div key={moduleKey} className="flex items-center justify-between px-4 py-3 select-none" style={{ borderBottom: '1px solid #CCCDD0' }}>
              <span className="text-sm font-medium" style={{ color: '#9BA0B0' }}>{label}</span>
              <AccessBadge access="no_access" />
            </div>
          );
        }

        return (
          <div key={moduleKey} style={{ borderBottom: '1px solid #CCCDD0' }}>
            {/* Module header row */}
            <button
              onClick={() => toggleModule(moduleKey)}
              className="w-full flex items-center justify-between px-4 py-3 text-left transition-colors"
              onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F7F7FA'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = ''}
            >
              <div className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"
                  className="w-4 h-4 transition-transform"
                  style={{ color: '#9BA0B0', transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}
                >
                  <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 0 1 .02-1.06L11.168 10 7.23 6.29a.75.75 0 1 1 1.04-1.08l4.5 4.25a.75.75 0 0 1 0 1.08l-4.5 4.25a.75.75 0 0 1-1.06-.02Z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-semibold" style={{ color: '#35353B' }}>{label}</span>
              </div>
              <div className="flex items-center gap-2">
                {isEditing && hasCheckedSets && (
                  <button
                    onClick={e => { e.stopPropagation(); removeAllInModule(moduleKey); }}
                    className="text-xs px-1 transition-colors"
                    style={{ color: '#9BA0B0' }}
                    onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                    onMouseLeave={e => e.currentTarget.style.color = '#9BA0B0'}
                    title="Remove all"
                  >
                    ✕
                  </button>
                )}
                <AccessBadge access={accessLevel} />
              </div>
            </button>

            {/* Permission set rows */}
            {isOpen && (
              <div className="mx-3 mb-2 rounded-md overflow-hidden" style={{ backgroundColor: '#F7F7FA', border: '1px solid #CCCDD0' }}>
                {sets.map(ps => (
                  <PermissionSetRow
                    key={ps.key}
                    permSet={ps}
                    isChecked={checkedKeys.has(ps.key)}
                    isEditing={isEditing}
                    onToggle={isEditing ? () => toggleSet(ps.key) : undefined}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
