// ── RolesListPage ─────────────────────────────────────────────────────────────
// Lists all roles. Tapping a row opens the Drawer in view mode.
// "New Role" opens the Drawer in base_picker mode.
// Kebab "Clone & customize" opens the Drawer in clone mode for that role.
//
// Style update: DS color tokens applied (sky blue primary, DS grey scale).
// Spacing, layout, and structure unchanged.

import { useEffect, useMemo, useRef, useState } from 'react';
import type { RoleKey } from '@/data/roles';
import { ROLE_DEFS } from '@/data/roles';
import { Pill } from '@/components/shared/Pill';
import { Drawer } from '@/components/roles/Drawer';

type DrawerEntry =
  | { roleKey: RoleKey; mode: 'view' | 'clone' }
  | { roleKey: null; mode: 'base_picker' };

// ── Icons (copied from PeopleListPage for consistency) ────────────────────────

function SearchIcon() {
  return (
    <svg className="absolute left-3 top-1/2 -translate-y-1/2" width="15" height="15" viewBox="0 0 15 15" fill="none" style={{ color: '#9BA0B0' }}>
      <path d="M10 6.5a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Zm-.691 3.516a4.5 4.5 0 1 1 .707-.707l2.838 2.837a.5.5 0 0 1-.708.708L9.31 10.016Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd" />
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

function Checkbox({ checked }: { checked: boolean }) {
  return (
    <div
      className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded transition-colors"
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

// ── Main page ─────────────────────────────────────────────────────────────────

export default function RolesListPage() {
  const [drawerEntry, setDrawerEntry] = useState<DrawerEntry | null>(null);
  const [openMenuKey, setOpenMenuKey] = useState<RoleKey | null>(null);
  const [menuDirection, setMenuDirection] = useState<'down' | 'up'>('down');
  const tableRef = useRef<HTMLDivElement>(null);
  const [search, setSearch] = useState('');
  const [showActive, setShowActive] = useState(true);
  const [showInactive, setShowInactive] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [activeMap, setActiveMap] = useState<Record<RoleKey, boolean>>(
    () => Object.fromEntries(ROLE_DEFS.map((r) => [r.key, r.active])) as Record<RoleKey, boolean>
  );

  const filterRef = useRef<HTMLDivElement>(null);

  const drawerRole = useMemo(
    () =>
      drawerEntry?.roleKey
        ? (ROLE_DEFS.find((r) => r.key === drawerEntry.roleKey) ?? null)
        : null,
    [drawerEntry]
  );

  const isDefault = showActive && !showInactive;
  const filterActive = !isDefault;

  const chips = isDefault
    ? []
    : [
        ...(showActive   ? [{ label: 'Active',   remove: () => setShowActive(false)  }] : []),
        ...(showInactive ? [{ label: 'Inactive', remove: () => setShowInactive(false) }] : []),
      ];

  const visibleRoles = useMemo(() => {
    const q = search.trim().toLowerCase();
    return [...ROLE_DEFS]
      .sort((a, b) => a.name.localeCompare(b.name))
      .filter((role) => {
        if (q && !role.name.toLowerCase().includes(q) && !role.description.toLowerCase().includes(q)) return false;
        const active = activeMap[role.key];
        if (active && !showActive) return false;
        if (!active && !showInactive) return false;
        return true;
      });
  }, [search, showActive, showInactive, activeMap]);

  function toggleActive(key: RoleKey) {
    setActiveMap((prev) => ({ ...prev, [key]: !prev[key] }));
    setOpenMenuKey(null);
  }

  // Close kebab menu when clicking outside
  useEffect(() => {
    if (!openMenuKey) return;
    function handleClick() { setOpenMenuKey(null); }
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [openMenuKey]);

  // Close filter dropdown on mousedown outside (matching People page)
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setFilterOpen(false);
      }
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  return (
    <div className="space-y-4">

      {/* Page header */}
      <div className="pb-1">
        {/* DS: text/heading/default #35353B */}
        <h1 className="text-2xl font-semibold" style={{ color: '#35353B' }}>Roles</h1>
        <p className="text-sm" style={{ color: '#9BA0B0' }}>View, clone, or create a role.</p>
      </div>

      {/* Search + filter bar */}
      <div className="flex items-center gap-2">

        {/* Search input with icon */}
        <div className="relative flex-1">
          <SearchIcon />
          <input
            type="text"
            placeholder="Search roles..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded py-2 pl-9 pr-4 text-sm focus:outline-none transition-colors"
            style={{ border: '1px solid #CCCDD0', backgroundColor: '#ffffff', color: '#35353B' }}
            onFocus={e => (e.currentTarget.style.borderColor = '#9BA0B0')}
            onBlur={e => (e.currentTarget.style.borderColor = '#CCCDD0')}
          />
        </div>

        {/* Filter button + dropdown */}
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
          </button>

          {filterOpen && (
            <div
              className="absolute right-0 top-11 z-20 w-56 rounded bg-white p-4"
              style={{ border: '1px solid #CCCDD0', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
            >
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide" style={{ color: '#9BA0B0' }}>
                Status
              </p>
              <div className="flex flex-col gap-1">
                {[
                  { label: 'Active',   checked: showActive,   toggle: () => setShowActive((v) => !v)   },
                  { label: 'Inactive', checked: showInactive, toggle: () => setShowInactive((v) => !v) },
                ].map(({ label, checked, toggle }) => (
                  <label
                    key={label}
                    className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 transition-colors"
                    onClick={toggle}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#F7F7FA')}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = '')}
                  >
                    <Checkbox checked={checked} />
                    <span className="text-sm" style={{ color: '#35353B' }}>{label}</span>
                  </label>
                ))}
              </div>

              {filterActive && (
                <button
                  onClick={() => { setShowActive(true); setShowInactive(false); }}
                  className="mt-3 w-full rounded py-1.5 text-sm font-bold transition-colors"
                  style={{ border: '1px solid #CCCDD0', color: '#9BA0B0' }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#F7F7FA')}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = '')}
                >
                  Reset to defaults
                </button>
              )}
            </div>
          )}
        </div>

        {/* DS: surface/button/enabled/primary #5CA6D9, hover #2C82BD */}
        <button
          onClick={() => setDrawerEntry({ roleKey: null, mode: 'base_picker' })}
          className="rounded px-4 py-2 text-sm text-white font-bold transition-colors"
          style={{ backgroundColor: '#5CA6D9' }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#2C82BD')}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#5CA6D9')}
        >
          New role
        </button>
      </div>

      {/* Filter chips — only shown when deviating from default */}
      {chips.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {chips.map((chip) => (
            <span
              key={chip.label}
              className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-medium"
              style={{ border: '1px solid #CCCDD0', color: '#757677' }}
            >
              {chip.label}
              <button
                onClick={chip.remove}
                style={{ color: '#9BA0B0' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#757677')}
                onMouseLeave={e => (e.currentTarget.style.color = '#9BA0B0')}
              >
                <XIcon size={10} />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Roles table */}
      {/* DS: border/default/default #CCCDD0 */}
      <div ref={tableRef} className="rounded bg-white" style={{ border: '1px solid #CCCDD0' }}>
        <table className="w-full text-sm">
          <thead className="border-b bg-white text-left" style={{ borderColor: '#CCCDD0' }}>
            <tr>
              {/* DS: text/body/dark-grey #9BA0B0 for table headers */}
              <th className="px-4 py-3 text-xs font-medium" style={{ color: '#9BA0B0' }}>Role</th>
              <th className="px-4 py-3 text-xs font-medium" style={{ color: '#9BA0B0' }}>Type</th>
              <th className="px-4 py-3 text-xs font-medium" style={{ color: '#9BA0B0' }}>Description</th>
              <th className="px-4 py-3 text-xs font-medium" style={{ color: '#9BA0B0' }}>Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {visibleRoles.map((role) => (
              <tr
                key={role.key}
                className="border-b last:border-b-0 cursor-pointer transition-colors"
                style={{ borderColor: '#CCCDD0' }}
                onClick={() => setDrawerEntry({ roleKey: role.key, mode: 'view' })}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#F7F7FA')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = '')}
              >
                {/* DS: text/heading/default #35353B for role name */}
                <td className="px-4 py-3 font-semibold" style={{ color: '#35353B' }}>
                  {role.name}
                </td>
                <td className="px-4 py-3">
                  <Pill label={role.type} />
                </td>
                {/* DS: text/body/mute #757677 for secondary content */}
                <td className="px-4 py-3" style={{ color: '#757677' }}>
                  {role.description}
                </td>
                <td className="px-4 py-3">
                  {activeMap[role.key] ? (
                    <span className="inline-flex items-center rounded-full border border-green-200 bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
                      Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                      Inactive
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end">
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (openMenuKey !== role.key) {
                            const btnRect = e.currentTarget.getBoundingClientRect();
                            const tableBottom = tableRef.current?.getBoundingClientRect().bottom ?? window.innerHeight;
                            setMenuDirection(tableBottom - btnRect.bottom < 100 ? 'up' : 'down');
                          }
                          setOpenMenuKey(openMenuKey === role.key ? null : role.key);
                        }}
                        className="flex h-8 w-8 items-center justify-center rounded-full transition-colors"
                        style={{ color: '#9BA0B0' }}
                        onMouseEnter={e => {
                          e.currentTarget.style.backgroundColor = '#F7F7FA';
                          e.currentTarget.style.color = '#35353B';
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.backgroundColor = '';
                          e.currentTarget.style.color = '#9BA0B0';
                        }}
                        aria-label="More options"
                      >
                        <span className="flex flex-col gap-[3px] items-center">
                          <span className="w-1 h-1 rounded-full bg-current" />
                          <span className="w-1 h-1 rounded-full bg-current" />
                          <span className="w-1 h-1 rounded-full bg-current" />
                        </span>
                      </button>

                      {openMenuKey === role.key && (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className={`absolute right-0 z-20 w-48 rounded bg-white py-1 ${menuDirection === 'up' ? 'bottom-9' : 'top-9'}`}
                          style={{
                            border: '1px solid #CCCDD0',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                          }}
                        >
                          <button
                            onClick={() => {
                              setDrawerEntry({ roleKey: role.key, mode: 'view' });
                              setOpenMenuKey(null);
                            }}
                            className="w-full px-4 py-2 text-left text-sm transition-colors"
                            style={{ color: '#35353B' }}
                            onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#F7F7FA')}
                            onMouseLeave={e => (e.currentTarget.style.backgroundColor = '')}
                          >
                            View
                          </button>
                          <button
                            onClick={() => {
                              setDrawerEntry({ roleKey: role.key, mode: 'clone' });
                              setOpenMenuKey(null);
                            }}
                            className="w-full px-4 py-2 text-left text-sm transition-colors"
                            style={{ color: '#35353B' }}
                            onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#F7F7FA')}
                            onMouseLeave={e => (e.currentTarget.style.backgroundColor = '')}
                          >
                            Clone &amp; customize
                          </button>
                          <button
                            onClick={() => toggleActive(role.key)}
                            className="w-full px-4 py-2 text-left text-sm transition-colors"
                            style={{ color: '#35353B' }}
                            onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#F7F7FA')}
                            onMouseLeave={e => (e.currentTarget.style.backgroundColor = '')}
                          >
                            {activeMap[role.key] ? 'Deactivate' : 'Activate'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Drawer */}
      <Drawer
        open={drawerEntry !== null}
        role={drawerRole}
        initialScreen={
          drawerEntry?.mode === 'base_picker'
            ? 'base_picker'
            : drawerEntry?.mode === 'clone'
            ? 'clone'
            : 'view'
        }
        onClose={() => setDrawerEntry(null)}
      />

    </div>
  );
}
