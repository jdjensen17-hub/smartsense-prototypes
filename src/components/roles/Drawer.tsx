// ── Drawer ────────────────────────────────────────────────────────────────────
// Role detail drawer. Opens from the Roles list when a role row is tapped,
// or when "New Role" is clicked (opens directly to base_picker screen).

import { useState } from 'react';
import { createPortal } from 'react-dom';
import type { RoleDef, RoleKey, RoleTier } from '@/data/roles';
import { ROLE_DEFS } from '@/data/roles';
import { Pill } from '@/components/shared/Pill';
import PermissionAccordion from '@/components/shared/PermissionAccordion';
import { CreateRoleScreen } from '@/components/roles/CreateRoleScreen';
import { RoleEditorScreen } from '@/components/roles/RoleEditorScreen';

type DrawerScreen =
  | { type: 'view' }
  | { type: 'base_picker' }
  | { type: 'create'; baseRoleKey: RoleKey; fromPicker: boolean }
  | { type: 'editor'; baseRoleKey: RoleKey; name: string; description: string; fromPicker: boolean };

type TierConfig = { key: RoleTier; label: string; descriptor: string; };

const TIERS: TierConfig[] = [
  { key: 'viewer',       label: 'Viewer',       descriptor: 'Read only' },
  { key: 'operator',     label: 'Operator',     descriptor: 'Does the work' },
  { key: 'supervisor',   label: 'Supervisor',   descriptor: 'Directs the work' },
  { key: 'manager',      label: 'Manager',      descriptor: 'Configures the work' },
  { key: 'specialist',   label: 'Specialist',   descriptor: 'Targeted access' },
  { key: 'system_admin', label: 'System Admin', descriptor: 'Full platform access' },
];

function ChevronLeftIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 15 15" fill="none">
      <path d="M8.842 3.135a.5.5 0 0 1 .023.707L5.435 7.5l3.43 3.658a.5.5 0 0 1-.73.684l-3.75-4a.5.5 0 0 1 0-.684l3.75-4a.5.5 0 0 1 .707-.023Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd" />
    </svg>
  );
}

// ── Drawer shell ──────────────────────────────────────────────────────────────

function DrawerShell({ onClose, children }: { onClose: () => void; children: React.ReactNode; }) {
  return createPortal(
    <div className="fixed inset-0 z-50 flex justify-end">
      <button aria-label="Close" onClick={onClose} className="absolute inset-0" style={{ backgroundColor: 'rgba(53,53,59,0.2)' }} />
      <aside className="relative flex flex-col h-full w-full max-w-xl bg-white shadow-2xl" style={{ borderLeft: '1px solid #CCCDD0' }}>
        {children}
      </aside>
    </div>,
    document.body
  );
}

// ── Close button ──────────────────────────────────────────────────────────────

function CloseButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex-shrink-0 rounded-md px-2 py-1 transition-colors"
      style={{ color: '#9BA0B0' }}
      onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#F7F7FA'; e.currentTarget.style.color = '#757677'; }}
      onMouseLeave={e => { e.currentTarget.style.backgroundColor = ''; e.currentTarget.style.color = '#9BA0B0'; }}
      aria-label="Close"
    >
      ✕
    </button>
  );
}

// ── Back button ───────────────────────────────────────────────────────────────

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1 text-sm transition-colors"
      style={{ color: '#9BA0B0' }}
      onMouseEnter={e => e.currentTarget.style.color = '#35353B'}
      onMouseLeave={e => e.currentTarget.style.color = '#9BA0B0'}
    >
      <ChevronLeftIcon /> Back
    </button>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export function Drawer({
  open, onClose, role, initialScreen = 'view',
}: {
  open: boolean; onClose: () => void; role: RoleDef | null; initialScreen?: 'view' | 'base_picker' | 'clone';
}) {
  const [drawerScreen, setDrawerScreen] = useState<DrawerScreen>({ type: 'view' });
  const [isEditing, setIsEditing] = useState(false);
  const [editKeys, setEditKeys] = useState<Set<string>>(new Set());
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDesc, setNewRoleDesc] = useState('');

  const [lastOpenState, setLastOpenState] = useState<string | null>(null);
  const openStateKey = `${open}-${role?.key}-${initialScreen}`;
  if (openStateKey !== lastOpenState) {
    setLastOpenState(openStateKey);
    if (open) {
      if (initialScreen === 'base_picker') {
        setDrawerScreen({ type: 'base_picker' });
      } else if (initialScreen === 'clone' && role) {
        setDrawerScreen({ type: 'create', baseRoleKey: role.key, fromPicker: false });
      } else {
        setDrawerScreen({ type: 'view' });
      }
      setIsEditing(false);
      setEditKeys(new Set(role?.permissionSetKeys ?? []));
      setNewRoleName('');
      setNewRoleDesc('');
    }
  }

  if (!open) return null;

  function goToEditor(baseRoleKey: RoleKey, fromPicker: boolean) {
    setDrawerScreen({ type: 'editor', baseRoleKey, name: newRoleName || 'Custom Role', description: newRoleDesc, fromPicker });
  }

  function enterEditMode() { setEditKeys(new Set(role!.permissionSetKeys)); setIsEditing(true); }
  function cancelEdit() { setEditKeys(new Set(role!.permissionSetKeys)); setIsEditing(false); }

  // ── Base picker screen ────────────────────────────────────────────────────

  if (drawerScreen.type === 'base_picker') {
    return (
      <DrawerShell onClose={onClose}>
        <div className="flex items-center justify-between px-5 pt-5 pb-4" style={{ borderBottom: '1px solid #CCCDD0' }}>
          <div>
            <h2 className="text-lg font-semibold" style={{ color: '#35353B' }}>New Role</h2>
            <p className="text-sm mt-0.5" style={{ color: '#9BA0B0' }}>Select an existing role as your starting point.</p>
          </div>
          <CloseButton onClick={onClose} />
        </div>

        <div className="flex-1 overflow-y-auto py-1">
          {TIERS.map((tier, tierIndex) => {
            const tierRoles = ROLE_DEFS.filter((r) => r.tier === tier.key && r.type === 'System');
            if (tierRoles.length === 0) return null;
            return (
              <div key={tier.key}>
                <div className={`px-5 pb-1 ${tierIndex === 0 ? 'pt-3' : 'pt-2'}`}>
                  <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: '#9BA0B0' }}>{tier.label}</span>
                  <span className="mx-1.5 text-[10px]" style={{ color: '#CCCDD0' }}>·</span>
                  <span className="text-[10px]" style={{ color: '#9BA0B0' }}>{tier.descriptor}</span>
                </div>
                {tierRoles.map((r) => (
                  <button
                    key={r.key}
                    onClick={() => { setNewRoleName(''); setNewRoleDesc(''); setDrawerScreen({ type: 'create', baseRoleKey: r.key, fromPicker: true }); }}
                    className="w-full flex items-center gap-3 px-5 py-2 text-left transition-colors group"
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F7F7FA'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = ''}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium" style={{ color: '#35353B' }}>{r.name}</p>
                      <p className="text-xs mt-0.5 line-clamp-2" style={{ color: '#9BA0B0' }}>{r.description}</p>
                    </div>
                    <svg width="13" height="13" viewBox="0 0 15 15" fill="none" className="flex-shrink-0 transition-colors" style={{ color: '#CCCDD0' }}>
                      <path d="M6.158 3.135a.5.5 0 0 1 .707.023l3.75 4a.5.5 0 0 1 0 .684l-3.75 4a.5.5 0 0 1-.73-.684L9.565 7.5 6.135 3.842a.5.5 0 0 1 .023-.707Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd" />
                    </svg>
                  </button>
                ))}
                <div className="mx-5 mt-1" style={{ borderBottom: '1px solid #F7F7FA' }} />
              </div>
            );
          })}
          <div className="h-4" />
        </div>
      </DrawerShell>
    );
  }

  // ── Create screen ─────────────────────────────────────────────────────────

  if (drawerScreen.type === 'create') {
    const createBackDestination = drawerScreen.fromPicker
      ? { type: 'base_picker' as const }
      : { type: 'view' as const };

    return (
      <DrawerShell onClose={onClose}>
        <div className="flex items-start justify-between px-5 pt-5 pb-4" style={{ borderBottom: '1px solid #CCCDD0' }}>
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <BackButton onClick={() => setDrawerScreen(createBackDestination)} />
            </div>
            <h2 className="text-lg font-semibold" style={{ color: '#35353B' }}>Clone &amp; Customize</h2>
            <p className="text-sm mt-0.5" style={{ color: '#9BA0B0' }}>
              Based on: {ROLE_DEFS.find(r => r.key === drawerScreen.baseRoleKey)?.name ?? drawerScreen.baseRoleKey}
            </p>
          </div>
          <CloseButton onClick={onClose} />
        </div>
        <div className="flex-1 overflow-y-auto p-5">
          <CreateRoleScreen
            baseRoleKey={drawerScreen.baseRoleKey}
            roleDefs={ROLE_DEFS}
            embedded={true}
            onCancel={() => setDrawerScreen({ type: 'view' })}
            onContinue={() => goToEditor(drawerScreen.baseRoleKey, drawerScreen.fromPicker)}
            newRoleName={newRoleName}
            setNewRoleName={setNewRoleName}
            newRoleDesc={newRoleDesc}
            setNewRoleDesc={setNewRoleDesc}
          />
        </div>
      </DrawerShell>
    );
  }

  // ── Editor screen ─────────────────────────────────────────────────────────

  if (drawerScreen.type === 'editor') {
    return (
      <DrawerShell onClose={onClose}>
        <div className="flex items-start justify-between px-5 pt-5 pb-4" style={{ borderBottom: '1px solid #CCCDD0' }}>
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <BackButton onClick={() => setDrawerScreen({ type: 'create', baseRoleKey: drawerScreen.baseRoleKey, fromPicker: drawerScreen.fromPicker })} />
            </div>
            <h2 className="text-lg font-semibold truncate" style={{ color: '#35353B' }}>{drawerScreen.name}</h2>
            <p className="text-sm mt-0.5" style={{ color: '#9BA0B0' }}>Adjust module access for this role.</p>
          </div>
          <CloseButton onClick={onClose} />
        </div>
        <div className="flex-1 overflow-y-auto p-5">
          <RoleEditorScreen
            role={{ baseRoleKey: drawerScreen.baseRoleKey, name: drawerScreen.name, description: drawerScreen.description }}
            onBack={() => setDrawerScreen({ type: 'create', baseRoleKey: drawerScreen.baseRoleKey })}
            embedded={true}
          />
        </div>
      </DrawerShell>
    );
  }

  // ── View screen ───────────────────────────────────────────────────────────

  const isCustom = role?.type === 'Custom';

  return (
    <DrawerShell onClose={onClose}>

      {/* Header */}
      <div className="px-5 pt-5 pb-4" style={{ borderBottom: '1px solid #CCCDD0' }}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-xl font-semibold leading-tight" style={{ color: '#35353B' }}>{role?.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              {isEditing ? (
                <p className="text-sm" style={{ color: '#9BA0B0' }}>Adjust module access for this role.</p>
              ) : (
                <>
                  <Pill label={role?.type ?? 'System'} />
                  <span className="text-xs" style={{ color: '#9BA0B0' }}>
                    {isCustom ? `Based on ${role?.clonedFrom ?? 'unknown'}` : 'System roles cannot be changed.'}
                  </span>
                </>
              )}
            </div>
            {!isEditing && (
              <p className="mt-2 text-sm max-w-prose" style={{ color: '#757677' }}>{role?.summary}</p>
            )}
          </div>
          <CloseButton onClick={onClose} />
        </div>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {isEditing && (
          <div className="flex justify-end">
            <button
              onClick={() => setEditKeys(new Set())}
              className="text-xs underline underline-offset-2 transition-colors"
              style={{ color: '#9BA0B0' }}
              onMouseEnter={e => e.currentTarget.style.color = '#35353B'}
              onMouseLeave={e => e.currentTarget.style.color = '#9BA0B0'}
            >
              Clear all
            </button>
          </div>
        )}

        <PermissionAccordion
          checkedKeys={isEditing ? editKeys : new Set(role?.permissionSetKeys ?? [])}
          isEditing={isEditing}
          onChange={isEditing ? setEditKeys : undefined}
          moduleAccess={role?.moduleAccess ?? []}
        />

        {isEditing && (
          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={cancelEdit}
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
        )}
      </div>

      {/* Bottom action bar */}
      {!isEditing && (
        <div className="px-5 py-4 flex items-center gap-3" style={{ borderTop: '1px solid #CCCDD0' }}>
          {isCustom && (
            <button
              onClick={enterEditMode}
              className="flex-1 rounded py-2.5 text-sm font-bold transition-colors"
              style={{ border: '1px solid #CCCDD0', color: '#757677' }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F7F7FA'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = ''}
            >
              Edit role
            </button>
          )}
          <button
            onClick={() => setDrawerScreen({ type: 'create', baseRoleKey: role!.key, fromPicker: false })}
            className={`rounded py-2.5 text-sm font-bold text-white transition-colors ${isCustom ? 'flex-1' : 'w-full'}`}
            style={{ backgroundColor: '#5CA6D9' }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#2C82BD'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = '#5CA6D9'}
          >
            Clone &amp; customize
          </button>
        </div>
      )}

    </DrawerShell>
  );
}
