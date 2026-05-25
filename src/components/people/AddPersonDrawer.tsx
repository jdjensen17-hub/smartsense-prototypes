import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import ScopePickerScreen, { type OrgNode, nodes } from '@/components/people/ScopePickerScreen';
import RolePickerScreen from '@/components/shared/RolePickerScreen';
import { ROLE_DEFS } from '@/data/roles';

type Screen = 'identity' | 'scope' | 'role';

type FormState = {
  firstName: string;
  lastName: string;
  email: string;
  scope: OrgNode | null;
  roleId: string | null;
};

// ── Icons ─────────────────────────────────────────────────────────────────────

function XIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 15 15" fill="none">
      <path d="M11.782 4.032a.575.575 0 1 0-.813-.813L7.5 6.687 4.031 3.22a.575.575 0 0 0-.813.813L6.687 7.5l-3.469 3.468a.575.575 0 0 0 .813.813L7.5 8.313l3.469 3.468a.575.575 0 0 0 .813-.813L8.313 7.5l3.469-3.468Z" fill="currentColor" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 15 15" fill="none">
      <path d="M6.158 3.135a.5.5 0 0 0-.023.707L9.565 7.5l-3.43 3.658a.5.5 0 0 0 .73.684l3.75-4a.5.5 0 0 0 0-.684l-3.75-4a.5.5 0 0 0-.707-.023Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd" />
    </svg>
  );
}

// ── Selection row ─────────────────────────────────────────────────────────────

function SelectionRow({
  label, value, placeholder, sublabel, onClick, disabled,
}: {
  label: string; value: string | null; placeholder: string; sublabel?: string; onClick: () => void; disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="relative w-full rounded px-4 py-3 text-left transition-colors"
      style={{
        border: `1px solid ${disabled ? '#E8E9EB' : '#CCCDD0'}`,
        backgroundColor: disabled ? '#F7F7FA' : '#ffffff',
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.borderColor = '#9BA0B0'; }}
      onMouseLeave={e => { if (!disabled) e.currentTarget.style.borderColor = '#CCCDD0'; }}
    >
      <p className="text-xs font-medium mb-0.5" style={{ color: disabled ? '#CCCDD0' : '#9BA0B0' }}>{label}</p>
      {value ? (
        <div>
          <p className="text-sm font-medium" style={{ color: '#35353B' }}>{value}</p>
          {sublabel && <p className="text-xs mt-0.5" style={{ color: '#9BA0B0' }}>{sublabel}</p>}
        </div>
      ) : (
        <p className="text-sm" style={{ color: disabled ? '#CCCDD0' : '#9BA0B0' }}>{placeholder}</p>
      )}
      {!disabled && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2" style={{ color: '#9BA0B0' }}>
          <ChevronRightIcon />
        </div>
      )}
    </button>
  );
}

// ── Identity screen ───────────────────────────────────────────────────────────

function IdentityScreen({
  form, onChange, onOpenScope, onOpenRole, onSubmit, onClose,
}: {
  form: FormState; onChange: (field: keyof FormState, value: string) => void;
  onOpenScope: () => void; onOpenRole: () => void; onSubmit: () => void; onClose: () => void;
}) {
  const selectedRole = ROLE_DEFS.find((r) => r.key === form.roleId);
  const emailValid = form.email.includes('@') && form.email.includes('.');
  const canSubmit = emailValid && form.scope !== null && form.roleId !== null;
  const scopeParent = form.scope ? nodes.find((n) => n.id === form.scope!.parentId)?.name : undefined;

  const inputClass = "w-full rounded px-3 py-2 text-sm focus:outline-none transition-colors";
  const inputStyle = { border: '1px solid #CCCDD0', color: '#35353B', backgroundColor: '#ffffff' };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-4 py-4" style={{ borderBottom: '1px solid #CCCDD0' }}>
        <h2 className="text-base font-semibold" style={{ color: '#35353B' }}>Add person</h2>
        <button
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
          style={{ color: '#9BA0B0' }}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#F7F7FA'; e.currentTarget.style.color = '#757677'; }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = ''; e.currentTarget.style.color = '#9BA0B0'; }}
        >
          <XIcon />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-5">
        {/* Identity fields */}
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#9BA0B0' }}>Identity</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium" style={{ color: '#9BA0B0' }}>First name</label>
              <input type="text" placeholder="First" value={form.firstName} onChange={(e) => onChange('firstName', e.target.value)} className={inputClass} style={inputStyle} onFocus={e => e.currentTarget.style.borderColor = '#9BA0B0'} onBlur={e => e.currentTarget.style.borderColor = '#CCCDD0'} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium" style={{ color: '#9BA0B0' }}>Last name</label>
              <input type="text" placeholder="Last" value={form.lastName} onChange={(e) => onChange('lastName', e.target.value)} className={inputClass} style={inputStyle} onFocus={e => e.currentTarget.style.borderColor = '#9BA0B0'} onBlur={e => e.currentTarget.style.borderColor = '#CCCDD0'} />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium" style={{ color: '#9BA0B0' }}>
              Email <span className="font-normal" style={{ color: '#CCCDD0' }}>(required)</span>
            </label>
            <input type="email" placeholder="name@company.com" value={form.email} onChange={(e) => onChange('email', e.target.value)} className={inputClass} style={inputStyle} onFocus={e => e.currentTarget.style.borderColor = '#9BA0B0'} onBlur={e => e.currentTarget.style.borderColor = '#CCCDD0'} />
          </div>
        </div>

        {/* Role assignment */}
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#9BA0B0' }}>Role assignment</p>
          <SelectionRow label="Scope" value={form.scope?.name ?? null} placeholder="Select where this role applies…" sublabel={scopeParent} onClick={onOpenScope} />
          <SelectionRow label="Role" value={selectedRole?.name ?? null} placeholder="Select a role…" sublabel={selectedRole?.summary} onClick={onOpenRole} disabled={!form.scope} />
        </div>
      </div>

      <div className="px-4 py-4 space-y-2" style={{ borderTop: '1px solid #CCCDD0' }}>
        <button
          onClick={onSubmit}
          disabled={!canSubmit}
          className="w-full rounded py-2.5 text-sm font-bold transition-colors"
          style={{
            backgroundColor: canSubmit ? '#5CA6D9' : '#F7F7FA',
            color: canSubmit ? '#ffffff' : '#9BA0B0',
            cursor: canSubmit ? 'pointer' : 'not-allowed',
          }}
          onMouseEnter={e => { if (canSubmit) e.currentTarget.style.backgroundColor = '#2C82BD'; }}
          onMouseLeave={e => { if (canSubmit) e.currentTarget.style.backgroundColor = '#5CA6D9'; }}
        >
          Send invite
        </button>
        <button
          onClick={onClose}
          className="w-full rounded py-2 text-sm font-bold transition-colors"
          style={{ color: '#9BA0B0' }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F7F7FA'}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = ''}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ── Main drawer ───────────────────────────────────────────────────────────────

export default function AddPersonDrawer({
  open, onClose, onPersonAdded,
}: {
  open: boolean; onClose: () => void; onPersonAdded?: (email: string, name: string, role: string) => void;
}) {
  const [screen, setScreen] = useState<Screen>('identity');
  const [showDiscard, setShowDiscard] = useState(false);
  const [form, setForm] = useState<FormState>({ firstName: '', lastName: '', email: '', scope: null, roleId: null });

  useEffect(() => {
    if (open) {
      setScreen('identity');
      setShowDiscard(false);
      setForm({ firstName: '', lastName: '', email: '', scope: null, roleId: null });
    }
  }, [open]);

  const hasUnsavedChanges =
    form.firstName !== '' || form.lastName !== '' || form.email !== '' || form.scope !== null || form.roleId !== null;

  function handleRequestClose() {
    if (!hasUnsavedChanges) { onClose(); } else { setShowDiscard(true); }
  }

  function handleChange(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleScopeSelect(node: OrgNode) {
    setForm((prev) => ({ ...prev, scope: node, roleId: prev.scope?.id !== node.id ? null : prev.roleId }));
    setScreen('identity');
  }

  function handleRoleSelect(roleId: string) {
    setForm((prev) => ({ ...prev, roleId }));
    setScreen('identity');
  }

  function handleSend() {
    const selectedRole = ROLE_DEFS.find((r) => r.key === form.roleId);
    onPersonAdded?.(form.email, `${form.firstName} ${form.lastName}`.trim(), selectedRole?.name ?? '');
    onClose();
  }

  if (!open) return null;

  return createPortal(
    <>
      <div className="fixed inset-0 z-40 bg-black/20" onClick={handleRequestClose} />

      <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-sm flex-col bg-white shadow-2xl">
        {screen === 'scope' ? (
          <ScopePickerScreen selectedId={form.scope?.id ?? null} onSelect={handleScopeSelect} onBack={() => setScreen('identity')} hideFooter />
        ) : screen === 'role' ? (
          <RolePickerScreen scopeName={form.scope?.name ?? ''} selectedRoleId={form.roleId} onSelect={handleRoleSelect} onBack={() => setScreen('identity')} />
        ) : (
          <IdentityScreen form={form} onChange={handleChange} onOpenScope={() => setScreen('scope')} onOpenRole={() => setScreen('role')} onSubmit={handleSend} onClose={handleRequestClose} />
        )}

        {/* Discard confirmation sheet */}
        {showDiscard && (
          <div className="absolute inset-0 z-[60] flex items-end justify-center" onClick={(e) => e.stopPropagation()}>
            <div className="absolute inset-0 bg-black/20" />
            <div className="relative w-full rounded-t-2xl bg-white shadow-2xl" style={{ borderTop: '1px solid #CCCDD0' }}>
              <div className="px-5 pt-6 pb-2 text-center">
                <p className="text-base font-semibold" style={{ color: '#35353B' }}>Discard changes?</p>
                <p className="mt-1 text-sm" style={{ color: '#9BA0B0' }}>
                  This person won't be invited and your progress will be lost.
                </p>
              </div>
              <div className="px-4 pb-6 pt-3 space-y-2">
                <button
                  onClick={onClose}
                  className="w-full rounded bg-red-600 py-2.5 text-sm font-bold text-white hover:bg-red-700 transition-colors"
                >
                  Discard
                </button>
                <button
                  onClick={() => setShowDiscard(false)}
                  className="w-full rounded py-2.5 text-sm font-bold transition-colors"
                  style={{ color: '#757677' }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F7F7FA'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = ''}
                >
                  Keep editing
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>,
    document.body
  );
}
