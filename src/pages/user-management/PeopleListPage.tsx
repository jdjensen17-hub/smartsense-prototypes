import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AddPersonDrawer from '@/components/people/AddPersonDrawer';

const ALL_ROLES = [
  'Auditor', 'Device Admin', 'IAM Admin', 'Integrations Admin', 'Kitchen Manager',
  'Manager', 'Operator', 'Supervisor', 'System Admin', 'Viewer',
];

const SEED_PEOPLE = [
  { id: 'p11', name: 'Aisha Kamara',     email: 'aisha@acme.com',   roles: ['Manager', 'Auditor'],        status: 'active',      lastLogin: '2026-03-28T10:14:00Z' },
  { id: 'p4',  name: 'Alex Merritt',     email: 'alex@acme.com',    roles: ['Operator'],                  status: 'active',      lastLogin: '2026-04-01T08:45:00Z' },
  { id: 'p16', name: 'Ben Caldwell',     email: 'ben@acme.com',     roles: ['Operator'],                  status: 'active',      lastLogin: '2026-03-15T14:22:00Z' },
  { id: 'p9',  name: 'Camille Fontaine', email: 'camille@acme.com', roles: ['Operator'],                  status: 'invited',     lastLogin: null },
  { id: 'p20', name: 'Clara Hutchins',   email: 'clara@acme.com',   roles: ['Integrations Admin'],        status: 'active',      lastLogin: '2026-04-05T16:03:00Z' },
  { id: 'p6',  name: 'Daniel Park',      email: 'daniel@acme.com',  roles: ['Supervisor'],                status: 'active',      lastLogin: '2026-03-30T09:11:00Z' },
  { id: 'p15', name: 'Fatima Al-Rashid', email: 'fatima@acme.com',  roles: ['IAM Admin', 'System Admin'], status: 'active',      lastLogin: '2026-04-06T07:58:00Z' },
  { id: 'p18', name: 'Grace Mbeki',      email: 'grace@acme.com',   roles: ['Kitchen Manager'],           status: 'active',      lastLogin: '2026-02-14T11:30:00Z' },
  { id: 'p1',  name: 'Jane Holloway',    email: 'jane@acme.com',    roles: ['Manager'],                   status: 'active',      lastLogin: '2026-04-04T13:47:00Z' },
  { id: 'p10', name: 'James Rutherford', email: 'james@acme.com',   roles: ['System Admin'],              status: 'active',      lastLogin: '2026-04-06T06:20:00Z' },
  { id: 'p12', name: 'Luis Vega',        email: 'luis@acme.com',    roles: ['Integrations Admin'],        status: 'deactivated', lastLogin: '2025-11-03T10:00:00Z' },
  { id: 'p2',  name: 'Mark Delgado',     email: 'mark@acme.com',    roles: ['Auditor'],                   status: 'active',      lastLogin: '2026-03-22T15:05:00Z' },
  { id: 'p13', name: 'Nina Kowalski',    email: 'nina@acme.com',    roles: ['Supervisor'],                status: 'active',      lastLogin: '2026-04-03T10:32:00Z' },
  { id: 'p14', name: 'Owen Tran',        email: 'owen@acme.com',    roles: ['Viewer'],                    status: 'invited',     lastLogin: null },
  { id: 'p3',  name: 'Priya Nair',       email: 'priya@acme.com',   roles: ['IAM Admin'],                 status: 'active',      lastLogin: '2026-04-02T12:19:00Z' },
  { id: 'p7',  name: 'Rachel Osei',      email: 'rachel@acme.com',  roles: ['Auditor', 'Viewer'],         status: 'active',      lastLogin: '2026-03-18T08:54:00Z' },
  { id: 'p19', name: 'Sam Erikson',      email: 'sam@acme.com',     roles: ['Viewer'],                    status: 'active',      lastLogin: '2026-01-30T17:41:00Z' },
  { id: 'p5',  name: 'Sofia Brennan',    email: 'sofia@acme.com',   roles: ['Viewer'],                    status: 'active',      lastLogin: '2026-03-25T09:00:00Z' },
  { id: 'p8',  name: 'Tom Whitfield',    email: 'tom@acme.com',     roles: ['Device Admin'],              status: 'active',      lastLogin: '2026-04-01T14:10:00Z' },
  { id: 'p17', name: 'Yuki Tanaka',      email: 'yuki@acme.com',    roles: ['Device Admin'],              status: 'active',      lastLogin: '2026-03-29T11:23:00Z' },
];

type Person = { id: string; name: string; email: string; roles: string[]; status: string; lastLogin: string | null; };
type Status = 'active' | 'invited' | 'deactivated';

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatLastLogin(iso: string | null): string {
  if (!iso) return 'Never';
  const date = new Date(iso);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'America/New_York' })
    + ', '
    + date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'America/New_York' })
    + ' EST';
}

// ── Custom checkbox ───────────────────────────────────────────────────────────

function Checkbox({ checked }: { checked: boolean }) {
  return (
    <div
      className="h-4 w-4 rounded flex items-center justify-center flex-shrink-0 transition-colors"
      style={{
        backgroundColor: checked ? '#5CA6D9' : '#ffffff',
        border: `1px solid ${checked ? '#5CA6D9' : '#CCCDD0'}`,
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

// ── Status badge — semantic colors kept intentionally ─────────────────────────

function StatusBadge({ status }: { status: Status }) {
  const styles: Record<Status, string> = {
    active:      'bg-emerald-50 text-emerald-700 border border-emerald-200',
    invited:     'bg-amber-50 text-amber-700 border border-amber-200',
    deactivated: 'bg-slate-100 text-slate-500 border border-slate-200',
  };
  const labels: Record<Status, string> = { active: 'Active', invited: 'Invited', deactivated: 'Deactivated' };
  return (
    <span className={`inline-flex w-fit items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

// ── Icons ─────────────────────────────────────────────────────────────────────

function SearchIcon() {
  return (
    <svg className="absolute left-3 top-1/2 -translate-y-1/2" width="15" height="15" viewBox="0 0 15 15" fill="none" style={{ color: '#9BA0B0' }}>
      <path d="M10 6.5a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Zm-.691 3.516a4.5 4.5 0 1 1 .707-.707l2.838 2.837a.5.5 0 0 1-.708.708L9.31 10.016Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd" />
    </svg>
  );
}

function KebabIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
      <path d="M3.625 7.5a.875.875 0 1 1-1.75 0 .875.875 0 0 1 1.75 0Zm4.25 0a.875.875 0 1 1-1.75 0 .875.875 0 0 1 1.75 0ZM12.125 7.5a.875.875 0 1 1-1.75 0 .875.875 0 0 1 1.75 0Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd" />
    </svg>
  );
}

function FilterIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
      <path d="M1 3.5A.5.5 0 0 1 1.5 3h12a.5.5 0 0 1 0 1h-12a.5.5 0 0 1-.5-.5Zm2 4A.5.5 0 0 1 3.5 7h8a.5.5 0 0 1 0 1h-8a.5.5 0 0 1-.5-.5Zm2 4a.5.5 0 0 1 .5-.5h4a.5.5 0 0 1 0 1h-4a.5.5 0 0 1-.5-.5Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd" />
    </svg>
  );
}

function XIcon({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 15 15" fill="none">
      <path d="M11.782 4.032a.575.575 0 1 0-.813-.813L7.5 6.687 4.031 3.22a.575.575 0 0 0-.813.813L6.687 7.5l-3.469 3.468a.575.575 0 0 0 .813.813L7.5 8.313l3.469 3.468a.575.575 0 0 0 .813-.813L8.313 7.5l3.469-3.468Z" fill="currentColor" />
    </svg>
  );
}

// ── Row kebab ─────────────────────────────────────────────────────────────────

function RowKebab({ personId, status }: { personId: string; status: Status }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  return (
    <div ref={ref} className="relative flex justify-end">
      <button
        onClick={(e) => { e.preventDefault(); setOpen((v) => !v); }}
        className="flex h-7 w-7 items-center justify-center rounded-lg transition-colors"
        style={{ color: '#9BA0B0' }}
        onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#F7F7FA'; e.currentTarget.style.color = '#757677'; }}
        onMouseLeave={e => { e.currentTarget.style.backgroundColor = ''; e.currentTarget.style.color = '#9BA0B0'; }}
      >
        <KebabIcon />
      </button>
      {open && (
        <div className="absolute right-0 top-8 z-30 w-44 rounded bg-white py-1 shadow-lg" style={{ border: '1px solid #CCCDD0' }}>
          <button className="w-full px-4 py-2 text-left text-sm transition-colors" style={{ color: '#35353B' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F7F7FA'} onMouseLeave={e => e.currentTarget.style.backgroundColor = ''}>Edit</button>
          <button className="w-full px-4 py-2 text-left text-sm transition-colors" style={{ color: '#35353B' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F7F7FA'} onMouseLeave={e => e.currentTarget.style.backgroundColor = ''}>Resend invite</button>
          <div className="my-1 border-t" style={{ borderColor: '#CCCDD0' }} />
          <button className="w-full px-4 py-2 text-left text-sm text-red-600 transition-colors" onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F7F7FA'} onMouseLeave={e => e.currentTarget.style.backgroundColor = ''}>
            {status === 'active' ? 'Deactivate' : 'Reactivate'}
          </button>
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function PeopleListPage() {
  const [query, setQuery] = useState('');
  const [pageMenuOpen, setPageMenuOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<Status[]>(['active', 'invited']);
  const [people, setPeople] = useState<Person[]>(SEED_PEOPLE);

  const pageMenuRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (pageMenuRef.current && !pageMenuRef.current.contains(e.target as Node)) setPageMenuOpen(false);
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) setFilterOpen(false);
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  function handlePersonAdded(email: string, name: string, role: string) {
    const newPerson: Person = {
      id: `p_new_${Date.now()}`, name, email,
      roles: role ? [role] : [], status: 'invited', lastLogin: null,
    };
    setPeople((prev) => [...prev, newPerson].sort((a, b) => (a.name || a.email).localeCompare(b.name || b.email)));
  }

  const filtered = people.filter((p) => {
    const q = query.toLowerCase();
    const matchesQuery = p.name.toLowerCase().includes(q) || p.email.toLowerCase().includes(q) || p.roles.some((r) => r.toLowerCase().includes(q));
    const matchesRole = selectedRoles.length === 0 || p.roles.some((r) => selectedRoles.includes(r));
    const matchesStatus = selectedStatuses.length === 0 || selectedStatuses.includes(p.status as Status);
    return matchesQuery && matchesRole && matchesStatus;
  });

  function toggleRole(role: string) {
    setSelectedRoles((prev) => prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]);
  }
  function toggleStatus(status: Status) {
    setSelectedStatuses((prev) => prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]);
  }

  const isDefault = selectedRoles.length === 0 && selectedStatuses.length === 2 && selectedStatuses.includes('active') && selectedStatuses.includes('invited');
  const roleChips = selectedRoles.map((r) => ({ label: r, remove: () => toggleRole(r) }));
  const statusChips = isDefault ? [] : selectedStatuses.map((s) => ({
    label: s === 'active' ? 'Active' : s === 'invited' ? 'Invited' : 'Deactivated',
    remove: () => toggleStatus(s),
  }));
  const allChips = [...roleChips, ...statusChips];
  const filterActive = !isDefault;
  const colClass = 'grid grid-cols-[180px_200px_200px_120px_196px_32px]';

  return (
    <div>
      <div className="pb-4">
        <h1 className="text-2xl font-semibold" style={{ color: '#35353B' }}>People</h1>
        <p className="text-sm" style={{ color: '#757677' }}>Invite and manage people.</p>
      </div>

      <div className="sticky top-0 z-10" style={{ backgroundColor: '#F7F7FA' }}>
        <div className="flex items-center gap-2 pb-3">

          {/* Search */}
          <div className="relative flex-1">
            <SearchIcon />
            <input
              type="text"
              placeholder="Search by name, email, or role…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full rounded py-2 pl-9 pr-4 text-sm focus:outline-none transition-colors"
              style={{ border: '1px solid #CCCDD0', backgroundColor: '#ffffff', color: '#35353B' }}
              onFocus={e => e.currentTarget.style.borderColor = '#9BA0B0'}
              onBlur={e => e.currentTarget.style.borderColor = '#CCCDD0'}
            />
          </div>

          {/* Filter button */}
          <div ref={filterRef} className="relative">
            <button
              onClick={() => setFilterOpen((v) => !v)}
              className="flex h-9 items-center gap-1.5 rounded px-3 text-sm font-bold transition-colors"
              style={{
                border: filterActive ? '1px solid #5CA6D9' : '1px solid #CCCDD0',
                backgroundColor: filterActive ? '#5CA6D9' : '#ffffff',
                color: filterActive ? '#ffffff' : '#757677',
              }}
            >
              <FilterIcon />
              Filter
              {filterActive && (
                <span className="ml-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-white text-xs font-semibold" style={{ color: '#5CA6D9' }}>
                  {selectedRoles.length + (selectedStatuses.some((s) => s !== 'active') ? 1 : 0)}
                </span>
              )}
            </button>

            {filterOpen && (
              <div className="absolute left-0 top-11 z-20 w-64 rounded bg-white p-4 shadow-xl" style={{ border: '1px solid #CCCDD0' }}>

                {/* Status section */}
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide" style={{ color: '#9BA0B0' }}>Status</p>
                <div className="mb-4 flex flex-col gap-1">
                  {(['active', 'invited', 'deactivated'] as Status[]).map((s) => (
                    <label
                      key={s}
                      className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 transition-colors"
                      onClick={() => toggleStatus(s)}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F7F7FA'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = ''}
                    >
                      <Checkbox checked={selectedStatuses.includes(s)} />
                      <span className="text-sm capitalize" style={{ color: '#35353B' }}>{s}</span>
                    </label>
                  ))}
                </div>

                {/* Role section */}
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide" style={{ color: '#9BA0B0' }}>Role</p>
                <div className="flex flex-col gap-1">
                  {ALL_ROLES.map((r) => (
                    <label
                      key={r}
                      className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 transition-colors"
                      onClick={() => toggleRole(r)}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F7F7FA'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = ''}
                    >
                      <Checkbox checked={selectedRoles.includes(r)} />
                      <span className="text-sm" style={{ color: '#35353B' }}>{r}</span>
                    </label>
                  ))}
                </div>

                {filterActive && (
                  <button
                    onClick={() => { setSelectedRoles([]); setSelectedStatuses(['active', 'invited']); }}
                    className="mt-4 w-full rounded py-1.5 text-sm font-bold transition-colors"
                    style={{ border: '1px solid #CCCDD0', color: '#9BA0B0' }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F7F7FA'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = ''}
                  >
                    Reset to defaults
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Page kebab */}
          <div ref={pageMenuRef} className="relative">
            <button
              onClick={() => setPageMenuOpen((v) => !v)}
              className="flex h-9 w-9 items-center justify-center rounded transition-colors"
              style={{ border: '1px solid #CCCDD0', backgroundColor: '#ffffff', color: '#9BA0B0' }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F7F7FA'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = '#ffffff'}
            >
              <KebabIcon />
            </button>
            {pageMenuOpen && (
              <div className="absolute right-0 top-10 z-20 w-44 rounded bg-white py-1 shadow-lg" style={{ border: '1px solid #CCCDD0' }}>
                <button className="w-full px-4 py-2 text-left text-sm transition-colors" style={{ color: '#35353B' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F7F7FA'} onMouseLeave={e => e.currentTarget.style.backgroundColor = ''}>Export list</button>
                <button className="w-full px-4 py-2 text-left text-sm transition-colors" style={{ color: '#35353B' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F7F7FA'} onMouseLeave={e => e.currentTarget.style.backgroundColor = ''}>Bulk import</button>
                <button className="w-full px-4 py-2 text-left text-sm transition-colors" style={{ color: '#35353B' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F7F7FA'} onMouseLeave={e => e.currentTarget.style.backgroundColor = ''}>Bulk edit</button>
              </div>
            )}
          </div>

          {/* Add person */}
          <button
            onClick={() => setDrawerOpen(true)}
            className="rounded px-4 py-2 text-sm font-bold text-white transition-colors"
            style={{ backgroundColor: '#5CA6D9' }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#2C82BD'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = '#5CA6D9'}
          >
            Add person
          </button>
        </div>

        {/* Active filter chips */}
        {allChips.length > 0 && (
          <div className="flex flex-wrap gap-2 pb-3">
            {allChips.map((chip) => (
              <span key={chip.label} className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-medium" style={{ border: '1px solid #CCCDD0', color: '#757677' }}>
                {chip.label}
                <button onClick={chip.remove} style={{ color: '#9BA0B0' }} onMouseEnter={e => e.currentTarget.style.color = '#757677'} onMouseLeave={e => e.currentTarget.style.color = '#9BA0B0'}>
                  <XIcon size={10} />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto rounded-b-2xl bg-white" style={{ border: '1px solid #CCCDD0', borderTop: 'none' }}>
          <div className={`${colClass} min-w-max border-b border-t px-4 py-2 text-xs font-medium`} style={{ borderColor: '#CCCDD0', backgroundColor: '#F7F7FA', color: '#9BA0B0' }}>
            <span>Name</span><span>Email</span><span>Roles</span><span>Status</span><span>Last login</span><span />
          </div>
          {filtered.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm" style={{ color: '#9BA0B0' }}>
              No people match your current search or filters.
            </div>
          ) : (
            filtered.map((p) => (
              <div
                key={p.id}
                className={`${colClass} min-w-max items-center border-b px-4 py-3 text-sm last:border-b-0 transition-colors ${p.status === 'deactivated' ? 'opacity-50' : ''}`}
                style={{ borderColor: '#CCCDD0' }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F7F7FA'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = ''}
              >
                <Link className="font-semibold hover:underline" style={{ color: '#35353B' }} to={`/admin/people/${p.id}`}>{p.name || p.email}</Link>
                <span style={{ color: '#757677' }}>{p.email}</span>
                <span style={{ color: '#757677' }}>{p.roles.length > 0 ? p.roles.join(', ') : '—'}</span>
                <StatusBadge status={p.status as Status} />
                <span style={{ color: '#9BA0B0' }}>{formatLastLogin(p.lastLogin)}</span>
                <RowKebab personId={p.id} status={p.status as Status} />
              </div>
            ))
          )}
        </div>
      </div>

      <AddPersonDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} onPersonAdded={handlePersonAdded} />
    </div>
  );
}
