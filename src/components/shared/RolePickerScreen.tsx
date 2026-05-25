// ── RolePickerScreen ──────────────────────────────────────────────────────────
// Two-depth navigation: role list → role preview.
// Used by AddPersonDrawer and PersonDetailPage.

import { useState } from 'react';
import { ROLE_DEFS } from '@/data/roles';
import type { RoleDef, RoleTier } from '@/data/roles';
import { PERMISSION_SETS } from '@/data/permissionSets';
import { AccessBadge } from '@/components/shared/AccessBadge';

// ── Tier config ───────────────────────────────────────────────────────────────

type TierConfig = { key: RoleTier; label: string; descriptor: string; };

const TIERS: TierConfig[] = [
  { key: 'viewer',       label: 'Viewer',       descriptor: 'Read only' },
  { key: 'operator',     label: 'Operator',     descriptor: 'Does the work' },
  { key: 'supervisor',   label: 'Supervisor',   descriptor: 'Directs the work' },
  { key: 'manager',      label: 'Manager',      descriptor: 'Configures the work' },
  { key: 'specialist',   label: 'Specialist',   descriptor: 'Targeted access' },
  { key: 'system_admin', label: 'System Admin', descriptor: 'Full platform access' },
];

// ── Type badge ────────────────────────────────────────────────────────────────

function TypeBadge({ type }: { type: 'System' | 'Custom' }) {
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
      style={
        type === 'System'
          ? { backgroundColor: '#ffffff', color: '#9BA0B0', border: '1px solid #CCCDD0' }
          : { backgroundColor: '#f5f3ff', color: '#7c3aed', border: '1px solid #ddd6fe' }
      }
    >
      {type}
    </span>
  );
}

// ── Icons ─────────────────────────────────────────────────────────────────────

function ChevronLeftIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 15 15" fill="none">
      <path d="M8.842 3.135a.5.5 0 0 1 .023.707L5.435 7.5l3.43 3.658a.5.5 0 0 1-.73.684l-3.75-4a.5.5 0 0 1 0-.684l3.75-4a.5.5 0 0 1 .707-.023Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd" />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 15 15" fill="none">
      <path d="M3.135 6.158a.5.5 0 0 1 .707-.023L7.5 9.565l3.658-3.43a.5.5 0 0 1 .684.73l-4 3.75a.5.5 0 0 1-.684 0l-4-3.75a.5.5 0 0 1-.023-.707Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 15 15" fill="none">
      <path d="M6.158 3.135a.5.5 0 0 1 .707.023l3.75 4a.5.5 0 0 1 0 .684l-3.75 4a.5.5 0 0 1-.73-.684L9.565 7.5 6.135 3.842a.5.5 0 0 1 .023-.707Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 15 15" fill="none" style={{ color: '#9BA0B0' }}>
      <path d="M10 6.5a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Zm-.691 3.516a4.5 4.5 0 1 1 .707-.707l2.838 2.837a.5.5 0 0 1-.708.708L9.31 10.016Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
      <path d="M7.5 1a6.5 6.5 0 1 0 0 13A6.5 6.5 0 0 0 7.5 1ZM7 5a.5.5 0 0 1 1 0v.5a.5.5 0 0 1-1 0V5Zm.5 2a.5.5 0 0 1 .5.5v3a.5.5 0 0 1-1 0v-3a.5.5 0 0 1 .5-.5Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd" />
    </svg>
  );
}

// ── Role row ──────────────────────────────────────────────────────────────────

function RoleRow({ role, isSelected, onSelect, onPreview }: {
  role: RoleDef; isSelected: boolean;
  onSelect: (roleId: string) => void; onPreview: (role: RoleDef) => void;
}) {
  return (
    <div
      className="w-full flex items-center gap-2 px-4 py-2.5 transition-colors"
      style={{ backgroundColor: isSelected ? '#F7F7FA' : '' }}
      onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F7F7FA'}
      onMouseLeave={e => e.currentTarget.style.backgroundColor = isSelected ? '#F7F7FA' : ''}
    >
      <button onClick={() => onSelect(role.key)} className="flex flex-1 items-center gap-2 min-w-0 text-left">
        <span className="text-sm font-medium truncate" style={{ color: '#35353B' }}>{role.name}</span>
        <TypeBadge type={role.type} />
      </button>
      <button
        onClick={() => onPreview(role)}
        className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md transition-colors"
        style={{ color: '#9BA0B0' }}
        onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#F7F7FA'; e.currentTarget.style.color = '#757677'; }}
        onMouseLeave={e => { e.currentTarget.style.backgroundColor = ''; e.currentTarget.style.color = '#9BA0B0'; }}
        aria-label={`Preview ${role.name}`}
      >
        <InfoIcon />
      </button>
    </div>
  );
}

// ── Role list view ────────────────────────────────────────────────────────────

function RoleListView({ scopeName, selectedRoleId, onSelect, onPreview, onBack }: {
  scopeName: string; selectedRoleId: string | null;
  onSelect: (roleId: string) => void; onPreview: (role: RoleDef) => void; onBack: () => void;
}) {
  const [query, setQuery] = useState('');

  const activeRoles = ROLE_DEFS.filter((r) => r.active);

  const filtered = query.trim()
    ? activeRoles.filter((r) =>
        r.name.toLowerCase().includes(query.toLowerCase()) ||
        r.description.toLowerCase().includes(query.toLowerCase())
      )
    : null;

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-start justify-between px-4 py-4" style={{ borderBottom: '1px solid #CCCDD0' }}>
        <div className="flex-1 min-w-0">
          <button
            onClick={onBack}
            className="flex items-center gap-1 text-xs mb-1 transition-colors"
            style={{ color: '#9BA0B0' }}
            onMouseEnter={e => e.currentTarget.style.color = '#35353B'}
            onMouseLeave={e => e.currentTarget.style.color = '#9BA0B0'}
          >
            <ChevronLeftIcon /> Back
          </button>
          <h2 className="text-base font-semibold" style={{ color: '#35353B' }}>Assign Role</h2>
          <p className="text-xs mt-0.5" style={{ color: '#9BA0B0' }}>
            at <span className="font-semibold" style={{ color: '#757677' }}>{scopeName}</span>
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="px-4 py-3" style={{ borderBottom: '1px solid #CCCDD0' }}>
        <div className="flex items-center gap-2 rounded-lg px-3 py-2" style={{ border: '1px solid #CCCDD0', backgroundColor: '#F7F7FA' }}>
          <SearchIcon />
          <input
            type="text"
            placeholder="Search roles…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm focus:outline-none"
            style={{ color: '#35353B' }}
          />
        </div>
      </div>

      {/* Role list */}
      <div className="flex-1 overflow-y-auto">
        {filtered ? (
          filtered.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm" style={{ color: '#9BA0B0' }}>No roles match "{query}"</p>
          ) : (
            <div className="py-2">
              {filtered.map((role) => (
                <RoleRow key={role.key} role={role} isSelected={selectedRoleId === role.key} onSelect={onSelect} onPreview={onPreview} />
              ))}
            </div>
          )
        ) : (
          TIERS.map((tier) => {
            const tierRoles = activeRoles.filter((r) => r.tier === tier.key);
            if (tierRoles.length === 0) return null;
            const sorted = [
              ...tierRoles.filter((r) => r.type === 'System'),
              ...tierRoles.filter((r) => r.type === 'Custom'),
            ];
            return (
              <div key={tier.key}>
                <div className="px-4 pt-3 pb-1">
                  <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: '#9BA0B0' }}>{tier.label}</span>
                  <span className="ml-2 text-[10px]" style={{ color: '#9BA0B0' }}>{tier.descriptor}</span>
                </div>
                {sorted.map((role) => (
                  <RoleRow key={role.key} role={role} isSelected={selectedRoleId === role.key} onSelect={onSelect} onPreview={onPreview} />
                ))}
              </div>
            );
          })
        )}
        <div className="h-4" />
      </div>
    </div>
  );
}

// ── Role preview view ─────────────────────────────────────────────────────────

function RolePreviewView({ role, scopeName, onSelect, onBack }: {
  role: RoleDef; scopeName: string;
  onSelect: (roleKey: string) => void; onBack: () => void;
}) {
  const [expandedModule, setExpandedModule] = useState<string | null>(null);

  const tierLabel = TIERS.find((t) => t.key === role.tier)?.label ?? '';
  const metaLine = role.type === 'System'
    ? `System role · ${tierLabel} tier`
    : `Custom role · Based on ${role.clonedFrom ?? 'unknown'}`;

  function toggleModule(moduleName: string) {
    setExpandedModule((prev) => (prev === moduleName ? null : moduleName));
  }

  function getModulePermissionSets(moduleName: string) {
    return PERMISSION_SETS.filter(
      (ps) => ps.module === moduleName && role.permissionSetKeys.includes(ps.key)
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-start justify-between px-4 py-4" style={{ borderBottom: '1px solid #CCCDD0' }}>
        <div className="flex-1 min-w-0">
          <button
            onClick={onBack}
            className="flex items-center gap-1 text-xs mb-1 transition-colors"
            style={{ color: '#9BA0B0' }}
            onMouseEnter={e => e.currentTarget.style.color = '#35353B'}
            onMouseLeave={e => e.currentTarget.style.color = '#9BA0B0'}
          >
            <ChevronLeftIcon /> Back
          </button>
          <h2 className="text-base font-semibold" style={{ color: '#35353B' }}>Assign Role</h2>
          <p className="text-xs mt-0.5" style={{ color: '#9BA0B0' }}>
            at <span className="font-semibold" style={{ color: '#757677' }}>{scopeName}</span>
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* Role identity */}
        <div>
          <h3 className="text-lg font-semibold" style={{ color: '#35353B' }}>{role.name}</h3>
          <p className="text-xs mt-0.5" style={{ color: '#9BA0B0' }}>{metaLine}</p>
        </div>

        {/* Description */}
        <div className="rounded px-4 py-3" style={{ backgroundColor: '#F7F7FA', border: '1px solid #CCCDD0' }}>
          {role.type === 'Custom' && !role.description ? (
            <p className="text-sm italic" style={{ color: '#9BA0B0' }}>No description — add one when editing this role</p>
          ) : (
            <p className="text-sm" style={{ color: '#757677' }}>{role.description}</p>
          )}
        </div>

        {/* Tier / provenance note */}
        {role.type === 'System' && role.tierNote && (
          <p className="text-xs flex items-start gap-1.5" style={{ color: '#9BA0B0' }}>
            <span className="mt-px flex-shrink-0">↳</span>
            <span>{role.tierNote}</span>
          </p>
        )}
        {role.type === 'Custom' && role.clonedFrom && (
          <p className="text-xs flex items-start gap-1.5" style={{ color: '#9BA0B0' }}>
            <span className="mt-px flex-shrink-0">↳</span>
            <span>Based on <span className="font-semibold" style={{ color: '#757677' }}>{role.clonedFrom}</span></span>
          </p>
        )}

        {/* Module access */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: '#9BA0B0' }}>Module access</p>
          <div className="rounded overflow-hidden" style={{ border: '1px solid #CCCDD0' }}>
            {role.moduleAccess.map(({ module, access }) => {
              const isInert = access === 'no_access' || access === 'not_purchased';
              const isExpanded = expandedModule === module;
              const permSets = isInert ? [] : getModulePermissionSets(module);

              return (
                <div key={module} className="bg-white" style={{ borderBottom: '1px solid #CCCDD0' }}>
                  {isInert ? (
                    <div className="flex items-center justify-between px-4 py-2.5">
                      <span className="text-sm" style={{ color: '#9BA0B0' }}>{module}</span>
                      <AccessBadge access={access} />
                    </div>
                  ) : (
                    <button
                      onClick={() => toggleModule(module)}
                      className="w-full flex items-center justify-between px-4 py-2.5 text-left transition-colors"
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F7F7FA'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = ''}
                    >
                      <div className="flex items-center gap-2">
                        <span style={{ color: '#9BA0B0' }}>
                          {isExpanded ? <ChevronDownIcon /> : <ChevronRightIcon />}
                        </span>
                        <span className="text-sm" style={{ color: '#757677' }}>{module}</span>
                      </div>
                      <AccessBadge access={access} />
                    </button>
                  )}

                  {isExpanded && permSets.length > 0 && (
                    <div className="px-4 py-3 space-y-2.5" style={{ borderTop: '1px solid #CCCDD0', backgroundColor: '#F7F7FA' }}>
                      {permSets.map((ps) => (
                        <div key={ps.key}>
                          <p className="text-xs font-semibold" style={{ color: '#35353B' }}>{ps.name}</p>
                          <p className="text-xs mt-0.5" style={{ color: '#9BA0B0' }}>{ps.description}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="px-4 py-4" style={{ borderTop: '1px solid #CCCDD0' }}>
        <button
          onClick={() => onSelect(role.key)}
          className="w-full rounded py-2.5 text-sm font-bold text-white transition-colors"
          style={{ backgroundColor: '#5CA6D9' }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = '#2C82BD'}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = '#5CA6D9'}
        >
          Select {role.name}
        </button>
      </div>
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export default function RolePickerScreen({
  scopeName, selectedRoleId, onSelect, onBack,
}: {
  scopeName: string; selectedRoleId: string | null;
  onSelect: (roleId: string) => void; onBack: () => void;
}) {
  const [previewRole, setPreviewRole] = useState<RoleDef | null>(null);

  function handleSelect(roleId: string) {
    onSelect(roleId);
    onBack();
  }

  if (previewRole) {
    return <RolePreviewView role={previewRole} scopeName={scopeName} onSelect={handleSelect} onBack={() => setPreviewRole(null)} />;
  }

  return <RoleListView scopeName={scopeName} selectedRoleId={selectedRoleId} onSelect={handleSelect} onPreview={setPreviewRole} onBack={onBack} />;
}
