import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate } from 'react-router-dom';
import ScopePickerScreen, { type OrgNode, nodes } from '@/components/people/ScopePickerScreen';
import RolePickerScreen from '@/components/shared/RolePickerScreen';
import { ROLE_DEFS } from '@/data/roles';

type Status = 'active' | 'invited' | 'deactivated';
type Assignment = { id: string; roleId: string; scopeId: string; };
type Person = { id: string; name: string; email: string; phone?: string; roles: string[]; status: string; lastLogin: string | null; assignments: Assignment[]; };

const SEED_PEOPLE: Person[] = [
  { id: 'p11', name: 'Aisha Kamara',     email: 'aisha@acme.com',   roles: ['Manager', 'Auditor'],        status: 'active',      lastLogin: '2026-03-28T10:14:00Z', assignments: [{ id: 'a1', roleId: 'manager', scopeId: 'r_west' }, { id: 'a2', roleId: 'auditor', scopeId: 't_root' }] },
  { id: 'p4',  name: 'Alex Merritt',     email: 'alex@acme.com',    roles: ['Operator'],                  status: 'active',      lastLogin: '2026-04-01T08:45:00Z', assignments: [{ id: 'a3', roleId: 'operator', scopeId: 'loc_101' }] },
  { id: 'p16', name: 'Ben Caldwell',     email: 'ben@acme.com',     roles: ['Operator'],                  status: 'active',      lastLogin: '2026-03-15T14:22:00Z', assignments: [{ id: 'a4', roleId: 'operator', scopeId: 'loc_201' }] },
  { id: 'p9',  name: 'Camille Fontaine', email: 'camille@acme.com', roles: ['Operator'],                  status: 'invited',     lastLogin: null,                   assignments: [{ id: 'a5', roleId: 'operator', scopeId: 'd_12' }] },
  { id: 'p20', name: 'Clara Hutchins',   email: 'clara@acme.com',   roles: ['Integrations Admin'],        status: 'active',      lastLogin: '2026-04-05T16:03:00Z', assignments: [{ id: 'a6', roleId: 'integrations_admin', scopeId: 't_root' }] },
  { id: 'p6',  name: 'Daniel Park',      email: 'daniel@acme.com',  roles: ['Supervisor'],                status: 'active',      lastLogin: '2026-03-30T09:11:00Z', assignments: [{ id: 'a7', roleId: 'supervisor', scopeId: 'd_9' }] },
  { id: 'p15', name: 'Fatima Al-Rashid', email: 'fatima@acme.com',  roles: ['IAM Admin', 'System Admin'], status: 'active',      lastLogin: '2026-04-06T07:58:00Z', assignments: [{ id: 'a8', roleId: 'iam_admin', scopeId: 't_root' }, { id: 'a9', roleId: 'system_admin', scopeId: 't_root' }] },
  { id: 'p18', name: 'Grace Mbeki',      email: 'grace@acme.com',   roles: ['Kitchen Manager'],           status: 'active',      lastLogin: '2026-02-14T11:30:00Z', assignments: [{ id: 'a10', roleId: 'manager', scopeId: 'loc_301' }] },
  { id: 'p1',  name: 'Jane Holloway',    email: 'jane@acme.com',    roles: ['Manager'],                   status: 'active',      lastLogin: '2026-04-04T13:47:00Z', assignments: [{ id: 'a11', roleId: 'manager', scopeId: 'r_central' }] },
  { id: 'p10', name: 'James Rutherford', email: 'james@acme.com',   roles: ['System Admin'],              status: 'active',      lastLogin: '2026-04-06T06:20:00Z', assignments: [{ id: 'a12', roleId: 'system_admin', scopeId: 't_root' }] },
  { id: 'p12', name: 'Luis Vega',        email: 'luis@acme.com',    roles: ['Integrations Admin'],        status: 'deactivated', lastLogin: '2025-11-03T10:00:00Z', assignments: [{ id: 'a13', roleId: 'integrations_admin', scopeId: 't_root' }] },
  { id: 'p2',  name: 'Mark Delgado',     email: 'mark@acme.com',    roles: ['Auditor'],                   status: 'active',      lastLogin: '2026-03-22T15:05:00Z', assignments: [{ id: 'a14', roleId: 'auditor', scopeId: 'r_east' }] },
  { id: 'p13', name: 'Nina Kowalski',    email: 'nina@acme.com',    roles: ['Supervisor'],                status: 'active',      lastLogin: '2026-04-03T10:32:00Z', assignments: [{ id: 'a15', roleId: 'supervisor', scopeId: 'd_7' }] },
  { id: 'p14', name: 'Owen Tran',        email: 'owen@acme.com',    roles: ['Viewer'],                    status: 'invited',     lastLogin: null,                   assignments: [{ id: 'a16', roleId: 'viewer', scopeId: 't_root' }] },
  { id: 'p3',  name: 'Priya Nair',       email: 'priya@acme.com',   roles: ['IAM Admin'],                 status: 'active',      lastLogin: '2026-04-02T12:19:00Z', assignments: [{ id: 'a17', roleId: 'iam_admin', scopeId: 't_root' }] },
  { id: 'p7',  name: 'Rachel Osei',      email: 'rachel@acme.com',  roles: ['Auditor', 'Viewer'],         status: 'active',      lastLogin: '2026-03-18T08:54:00Z', assignments: [{ id: 'a18', roleId: 'auditor', scopeId: 'r_west' }, { id: 'a19', roleId: 'viewer', scopeId: 'r_east' }] },
  { id: 'p19', name: 'Sam Erikson',      email: 'sam@acme.com',     roles: ['Viewer'],                    status: 'active',      lastLogin: '2026-01-30T17:41:00Z', assignments: [{ id: 'a20', roleId: 'viewer', scopeId: 'd_22' }] },
  { id: 'p5',  name: 'Sofia Brennan',    email: 'sofia@acme.com',   roles: ['Viewer'],                    status: 'active',      lastLogin: '2026-03-25T09:00:00Z', assignments: [{ id: 'a21', roleId: 'viewer', scopeId: 'loc_401' }] },
  { id: 'p8',  name: 'Tom Whitfield',    email: 'tom@acme.com',     roles: ['Device Admin'],              status: 'active',      lastLogin: '2026-04-01T14:10:00Z', assignments: [{ id: 'a22', roleId: 'device_admin', scopeId: 'r_central' }] },
  { id: 'p17', name: 'Yuki Tanaka',      email: 'yuki@acme.com',    roles: ['Device Admin'],              status: 'active',      lastLogin: '2026-03-29T11:23:00Z', assignments: [{ id: 'a23', roleId: 'device_admin', scopeId: 'r_west' }] },
];

function formatLastLogin(iso: string | null): string {
  if (!iso) return 'Never';
  const date = new Date(iso);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'America/New_York' })
    + ', '
    + date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'America/New_York' })
    + ' EST';
}

function getInitials(name: string): string {
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getScopeNode(scopeId: string) { return nodes.find((n) => n.id === scopeId) ?? null; }
function getScopeParentName(scopeId: string): string | null {
  const node = getScopeNode(scopeId);
  if (!node?.parentId) return null;
  return nodes.find((n) => n.id === node.parentId)?.name ?? null;
}
function makeAssignmentId(): string { return 'a_' + Math.random().toString(36).slice(2, 9); }

// ── Icons ─────────────────────────────────────────────────────────────────────

function ChevronLeftIcon() {
  return <svg width="16" height="16" viewBox="0 0 15 15" fill="none"><path d="M8.842 3.135a.5.5 0 0 1 .023.707L5.435 7.5l3.43 3.658a.5.5 0 0 1-.73.684l-3.75-4a.5.5 0 0 1 0-.684l3.75-4a.5.5 0 0 1 .707-.023Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd" /></svg>;
}
function PencilIcon() {
  return <svg width="13" height="13" viewBox="0 0 15 15" fill="none"><path d="M11.854.146a.5.5 0 0 0-.707 0l-1.5 1.5a.5.5 0 0 0 0 .707l3 3a.5.5 0 0 0 .707 0l1.5-1.5a.5.5 0 0 0 0-.707l-3-3ZM9.5 3.207 5.354 7.354A.5.5 0 0 0 5.2 7.6l-.6 2.4a.5.5 0 0 0 .6.6l2.4-.6a.5.5 0 0 0 .246-.154L11.793 5.5 9.5 3.207ZM1 13.5A1.5 1.5 0 0 0 2.5 15h10a1.5 1.5 0 0 0 1.5-1.5v-6a.5.5 0 0 0-1 0v6a.5.5 0 0 1-.5.5h-10a.5.5 0 0 1-.5-.5v-10a.5.5 0 0 1 .5-.5h6a.5.5 0 0 0 0-1h-6A1.5 1.5 0 0 0 1 3.5v10Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd" /></svg>;
}
function CheckIcon() {
  return <svg width="13" height="13" viewBox="0 0 15 15" fill="none"><path d="M11.467 3.727c.289.189.37.576.181.865l-4.25 6.5a.625.625 0 0 1-.961.12l-2.75-2.75a.625.625 0 0 1 .884-.884l2.235 2.235 3.861-5.906a.625.625 0 0 1 .8-.18Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd" /></svg>;
}
function XSmallIcon() {
  return <svg width="12" height="12" viewBox="0 0 15 15" fill="none"><path d="M11.782 4.032a.575.575 0 1 0-.813-.813L7.5 6.687 4.031 3.22a.575.575 0 0 0-.813.813L6.687 7.5l-3.469 3.468a.575.575 0 0 0 .813.813L7.5 8.313l3.469 3.468a.575.575 0 0 0 .813-.813L8.313 7.5l3.469-3.468Z" fill="currentColor" /></svg>;
}
function XIcon() {
  return <svg width="16" height="16" viewBox="0 0 15 15" fill="none"><path d="M11.782 4.032a.575.575 0 1 0-.813-.813L7.5 6.687 4.031 3.22a.575.575 0 0 0-.813.813L6.687 7.5l-3.469 3.468a.575.575 0 0 0 .813.813L7.5 8.313l3.469 3.468a.575.575 0 0 0 .813-.813L8.313 7.5l3.469-3.468Z" fill="currentColor" /></svg>;
}
function PlusIcon() {
  return <svg width="13" height="13" viewBox="0 0 15 15" fill="none"><path d="M8 2.75a.5.5 0 0 0-1 0V7H2.75a.5.5 0 0 0 0 1H7v4.25a.5.5 0 0 0 1 0V8h4.25a.5.5 0 0 0 0-1H8V2.75Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd" /></svg>;
}
function DotsHorizontalIcon() {
  return <svg width="14" height="14" viewBox="0 0 15 15" fill="none"><path d="M3.625 7.5a1.125 1.125 0 1 1-2.25 0 1.125 1.125 0 0 1 2.25 0Zm5 0a1.125 1.125 0 1 1-2.25 0 1.125 1.125 0 0 1 2.25 0Zm3.875 1.125a1.125 1.125 0 1 0 0-2.25 1.125 1.125 0 0 0 0 2.25Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd" /></svg>;
}

// ── Status badge — semantic colors kept intentionally ─────────────────────────

function StatusBadge({ status }: { status: Status }) {
  const styles: Record<Status, string> = {
    active:      'bg-emerald-50 text-emerald-700 border border-emerald-200',
    invited:     'bg-amber-50 text-amber-700 border border-amber-200',
    deactivated: 'bg-slate-100 text-slate-500 border border-slate-200',
  };
  const labels: Record<Status, string> = { active: 'Active', invited: 'Invited', deactivated: 'Deactivated' };
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status]}`}>{labels[status]}</span>;
}

function SectionHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#9BA0B0' }}>{title}</p>
      {action}
    </div>
  );
}

// ── Editable identity section ─────────────────────────────────────────────────

function EditableIdentitySection({ person }: { person: Person }) {
  const [editing, setEditing] = useState(false);
  const nameParts = person.name.split(' ');
  const [firstName, setFirstName] = useState(nameParts[0] ?? '');
  const [lastName, setLastName] = useState(nameParts.slice(1).join(' ') ?? '');
  const [phone, setPhone] = useState(person.phone ?? '');

  function handleSave() { setEditing(false); }
  function handleCancel() {
    setFirstName(nameParts[0] ?? '');
    setLastName(nameParts.slice(1).join(' ') ?? '');
    setPhone(person.phone ?? '');
    setEditing(false);
  }

  const inputClass = "w-full rounded px-3 py-2 text-sm focus:outline-none transition-colors";

  return (
    <div className="rounded bg-white p-4" style={{ border: '1px solid #CCCDD0' }}>
      <SectionHeader
        title="Identity"
        action={
          !editing ? (
            <button onClick={() => setEditing(true)} className="flex items-center gap-1 rounded px-2.5 py-1 text-xs font-bold transition-colors" style={{ border: '1px solid #5CA6D9', color: '#5CA6D9' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#E9F6FF'} onMouseLeave={e => e.currentTarget.style.backgroundColor = ''}>
              <PencilIcon /> Edit
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button onClick={handleCancel} className="flex items-center gap-1 rounded px-2.5 py-1 text-xs font-bold transition-colors" style={{ border: '1px solid #CCCDD0', color: '#9BA0B0' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F7F7FA'} onMouseLeave={e => e.currentTarget.style.backgroundColor = ''}>
                <XSmallIcon /> Cancel
              </button>
              <button onClick={handleSave} className="flex items-center gap-1 rounded px-2.5 py-1 text-xs font-bold text-white transition-colors" style={{ backgroundColor: '#5CA6D9' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#2C82BD'} onMouseLeave={e => e.currentTarget.style.backgroundColor = '#5CA6D9'}>
                <CheckIcon /> Save
              </button>
            </div>
          )
        }
      />
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="mb-0.5 text-xs font-medium" style={{ color: '#9BA0B0' }}>First name</p>
            {editing ? (
              <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} className={inputClass} style={{ border: '1px solid #CCCDD0', color: '#35353B' }} onFocus={e => e.currentTarget.style.borderColor = '#9BA0B0'} onBlur={e => e.currentTarget.style.borderColor = '#CCCDD0'} />
            ) : (
              <p className="text-sm font-medium" style={{ color: '#35353B' }}>{firstName || '—'}</p>
            )}
          </div>
          <div>
            <p className="mb-0.5 text-xs font-medium" style={{ color: '#9BA0B0' }}>Last name</p>
            {editing ? (
              <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} className={inputClass} style={{ border: '1px solid #CCCDD0', color: '#35353B' }} onFocus={e => e.currentTarget.style.borderColor = '#9BA0B0'} onBlur={e => e.currentTarget.style.borderColor = '#CCCDD0'} />
            ) : (
              <p className="text-sm font-medium" style={{ color: '#35353B' }}>{lastName || '—'}</p>
            )}
          </div>
        </div>
        <div>
          <p className="mb-0.5 text-xs font-medium" style={{ color: '#9BA0B0' }}>Phone</p>
          {editing ? (
            <input
              type="tel" value={phone}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                let formatted = digits;
                if (digits.length >= 7) formatted = `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
                else if (digits.length >= 4) formatted = `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
                else if (digits.length >= 1) formatted = `(${digits}`;
                setPhone(formatted);
              }}
              placeholder="(555) 555-5555"
              className={inputClass}
              style={{ border: '1px solid #CCCDD0', color: '#35353B' }}
              onFocus={e => e.currentTarget.style.borderColor = '#9BA0B0'}
              onBlur={e => e.currentTarget.style.borderColor = '#CCCDD0'}
            />
          ) : (
            <p className="text-sm font-medium" style={{ color: '#35353B' }}>{phone || '—'}</p>
          )}
        </div>
        <div>
          <p className="mb-0.5 text-xs font-medium" style={{ color: '#9BA0B0' }}>Email</p>
          <p className="text-sm font-medium" style={{ color: '#35353B' }}>{person.email}</p>
        </div>
      </div>
    </div>
  );
}

// ── Meta section ──────────────────────────────────────────────────────────────

function MetaSection({ person }: { person: Person }) {
  return (
    <div className="rounded bg-white" style={{ border: '1px solid #CCCDD0' }}>
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid #CCCDD0' }}>
        <p className="text-xs font-medium" style={{ color: '#9BA0B0' }}>Status</p>
        <StatusBadge status={person.status as Status} />
      </div>
      <div className="flex items-center justify-between px-4 py-3">
        <p className="text-xs font-medium" style={{ color: '#9BA0B0' }}>Last login</p>
        <p className="text-sm" style={{ color: '#757677' }}>{formatLastLogin(person.lastLogin)}</p>
      </div>
    </div>
  );
}

function PlaceholderSection({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded p-4" style={{ border: '1px dashed #CCCDD0', backgroundColor: '#F7F7FA' }}>
      <SectionHeader title={title} />
      <p className="text-sm" style={{ color: '#9BA0B0' }}>{description}</p>
    </div>
  );
}

// ── Assignment kebab ──────────────────────────────────────────────────────────

function AssignmentKebab({ onRemove }: { onRemove: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative flex-shrink-0">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
        className="flex h-7 w-7 items-center justify-center rounded-lg transition-colors"
        style={{ color: '#9BA0B0' }}
        onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#F7F7FA'; e.currentTarget.style.color = '#757677'; }}
        onMouseLeave={e => { e.currentTarget.style.backgroundColor = ''; e.currentTarget.style.color = '#9BA0B0'; }}
      >
        <DotsHorizontalIcon />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-8 z-20 min-w-[140px] rounded bg-white py-1 shadow-lg" style={{ border: '1px solid #CCCDD0' }}>
            <button
              onClick={(e) => { e.stopPropagation(); onRemove(); setOpen(false); }}
              className="w-full px-3 py-2 text-left text-sm text-red-600 transition-colors"
              onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F7F7FA'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = ''}
            >
              Remove
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ── Add Assignment Drawer ─────────────────────────────────────────────────────

type AddAssignmentScreen = 'scope' | 'role';
type AddAssignmentForm = { scope: OrgNode | null; roleId: string | null; };

function AddAssignmentDrawer({ open, onClose, onAdd }: { open: boolean; onClose: () => void; onAdd: (assignment: Assignment) => void; }) {
  const [screen, setScreen] = useState<AddAssignmentScreen>('scope');
  const [form, setForm] = useState<AddAssignmentForm>({ scope: null, roleId: null });

  useState(() => { if (open) { setScreen('scope'); setForm({ scope: null, roleId: null }); } });

  function handleScopeSelect(node: OrgNode) {
    setForm((prev) => ({ scope: node, roleId: prev.scope?.id !== node.id ? null : prev.roleId }));
    setScreen('role');
  }

  function handleRoleSelect(roleId: string) {
    if (form.scope) { onAdd({ id: makeAssignmentId(), roleId, scopeId: form.scope.id }); onClose(); }
  }

  if (!open) return null;

  return createPortal(
    <>
      <div className="fixed inset-0 z-50 bg-black/20" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-sm flex-col bg-white shadow-2xl">
        {screen === 'role' && form.scope ? (
          <RolePickerScreen scopeName={form.scope.name} selectedRoleId={form.roleId} onSelect={handleRoleSelect} onBack={() => setScreen('scope')} />
        ) : (
          <div className="flex h-full flex-col">
            <div className="flex items-start justify-between px-4 py-4" style={{ borderBottom: '1px solid #CCCDD0' }}>
              <div>
                <h2 className="text-base font-semibold" style={{ color: '#35353B' }}>Add Assignment</h2>
                <p className="text-xs mt-0.5" style={{ color: '#9BA0B0' }}>Select a scope to assign a role.</p>
              </div>
              <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg flex-shrink-0 transition-colors" style={{ color: '#9BA0B0' }} onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#F7F7FA'; e.currentTarget.style.color = '#757677'; }} onMouseLeave={e => { e.currentTarget.style.backgroundColor = ''; e.currentTarget.style.color = '#9BA0B0'; }}>
                <XIcon />
              </button>
            </div>
            <ScopePickerScreen selectedId={null} onSelect={handleScopeSelect} onBack={onClose} hideHeader hideFooter />
          </div>
        )}
      </div>
    </>,
    document.body
  );
}

// ── Role assignments section ──────────────────────────────────────────────────

function RoleAssignmentsSection({ assignments, onAdd, onRemove }: { assignments: Assignment[]; onAdd: (a: Assignment) => void; onRemove: (id: string) => void; }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [pendingAssignment, setPendingAssignment] = useState<Assignment | null>(null);

  function handleConfirmPending() { if (pendingAssignment) { onAdd(pendingAssignment); setPendingAssignment(null); } }
  function handleCancelPending() { setPendingAssignment(null); }

  return (
    <>
      <div className="rounded bg-white p-4" style={{ border: '1px solid #CCCDD0' }}>
        <SectionHeader
          title="Role assignments"
          action={
            <button onClick={() => setDrawerOpen(true)} className="flex items-center gap-1 rounded px-2.5 py-1 text-xs font-bold transition-colors" style={{ border: '1px solid #5CA6D9', color: '#5CA6D9' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#E9F6FF'} onMouseLeave={e => e.currentTarget.style.backgroundColor = ''}>
              <PlusIcon /> Add
            </button>
          }
        />
        <div className="space-y-2">
          {assignments.length === 0 && !pendingAssignment && (
            <p className="text-sm" style={{ color: '#9BA0B0' }}>No role assignments yet.</p>
          )}

          {assignments.map((assignment) => {
            const role = ROLE_DEFS.find((r) => r.key === assignment.roleId);
            const scopeNode = getScopeNode(assignment.scopeId);
            const parentName = getScopeParentName(assignment.scopeId);
            return (
              <div key={assignment.id} className="flex items-center gap-3 rounded px-3 py-2.5" style={{ border: '1px solid #CCCDD0', backgroundColor: '#F7F7FA' }}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-sm font-medium truncate" style={{ color: '#35353B' }}>{role?.name ?? assignment.roleId}</span>
                    {role && !role.active && (
                      <span
                        className="flex-shrink-0 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700"
                        title="This role is inactive. Existing access is preserved but no new assignments can be made. Consider removing this assignment if access is no longer needed."
                      >
                        Role inactive
                      </span>
                    )}
                  </div>
                  <p className="text-xs mt-0.5 truncate" style={{ color: '#9BA0B0' }}>
                    {scopeNode ? (<>{scopeNode.levelName && <span>{scopeNode.levelName} · </span>}{scopeNode.name}{parentName && <span> · {parentName}</span>}</>) : assignment.scopeId}
                  </p>
                </div>
                <AssignmentKebab onRemove={() => onRemove(assignment.id)} />
              </div>
            );
          })}

          {/* Pending — amber kept as semantic attention color */}
          {pendingAssignment && (() => {
            const role = ROLE_DEFS.find((r) => r.key === pendingAssignment.roleId);
            const scopeNode = getScopeNode(pendingAssignment.scopeId);
            const parentName = getScopeParentName(pendingAssignment.scopeId);
            return (
              <div className="flex items-center gap-3 rounded border border-amber-300 bg-amber-50 pl-3 pr-3 py-2.5 border-l-4 border-l-amber-400">
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-600 mb-0.5">Pending — confirm to save</p>
                  <p className="text-sm font-medium truncate" style={{ color: '#35353B' }}>{role?.name ?? pendingAssignment.roleId}</p>
                  <p className="text-xs mt-0.5 truncate" style={{ color: '#9BA0B0' }}>
                    {scopeNode ? (<>{scopeNode.levelName && <span>{scopeNode.levelName} · </span>}{scopeNode.name}{parentName && <span> · {parentName}</span>}</>) : pendingAssignment.scopeId}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button onClick={handleCancelPending} className="rounded border border-amber-300 px-2.5 py-1 text-xs font-bold text-amber-700 hover:bg-amber-100 transition-colors">Cancel</button>
                  <button onClick={handleConfirmPending} className="rounded bg-amber-500 px-2.5 py-1 text-xs font-bold text-white hover:bg-amber-600 transition-colors">Confirm</button>
                </div>
              </div>
            );
          })()}
        </div>
      </div>
      <AddAssignmentDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} onAdd={setPendingAssignment} />
    </>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function PersonDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const seedPerson = SEED_PEOPLE.find((p) => p.id === id);
  const [assignments, setAssignments] = useState<Assignment[]>(seedPerson?.assignments ?? []);

  if (!seedPerson) {
    return (
      <div className="py-16 text-center text-sm" style={{ color: '#9BA0B0' }}>
        Person not found.{' '}
        <button onClick={() => navigate('/admin/people')} className="underline" style={{ color: '#757677' }}>Back to People</button>
      </div>
    );
  }

  const person = { ...seedPerson, assignments };
  const initials = getInitials(person.name);

  return (
    <div className="mx-auto max-w-2xl pb-16">
      <button
        onClick={() => navigate('/admin/people')}
        className="mb-6 flex items-center gap-1.5 text-sm transition-colors"
        style={{ color: '#9BA0B0' }}
        onMouseEnter={e => e.currentTarget.style.color = '#35353B'}
        onMouseLeave={e => e.currentTarget.style.color = '#9BA0B0'}
      >
        <ChevronLeftIcon /> People
      </button>

      <div className="mb-6 flex items-center gap-4">
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full text-sm font-semibold" style={{ backgroundColor: '#CCCDD0', color: '#757677' }}>
          {initials}
        </div>
        <div>
          <h1 className="text-xl font-semibold" style={{ color: '#35353B' }}>{person.name}</h1>
          <p className="text-sm font-medium" style={{ color: '#757677' }}>{person.email}</p>
        </div>
      </div>

      <div className="space-y-4">
        <EditableIdentitySection person={person} />
        <RoleAssignmentsSection
          assignments={assignments}
          onAdd={(a) => setAssignments((prev) => [...prev, a])}
          onRemove={(id) => setAssignments((prev) => prev.filter((a) => a.id !== id))}
        />
        <MetaSection person={person} />
        <PlaceholderSection title="Scheduling" description="Hourly rate and employee ID — owned by the Scheduling module." />
        <PlaceholderSection title="Notifications" description="Per-channel alert preferences — owned by each module." />
      </div>
    </div>
  );
}
