import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { StatusChip } from '@/components/statuses/StatusChip';
import { MenuButton, PrimaryButton, SecondaryButton } from '@/components/statuses/buttons';
import { DeleteSetDialog } from '@/components/statuses/DeleteSetDialog';
import { formatStatusDate, plural, statusSets, useStatusSets, type StatusSet } from '@/data/statusSets';

export default function StatusesListPage() {
  const navigate = useNavigate();
  const snapshot = useStatusSets();
  const [search, setSearch] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [menuId, setMenuId] = useState<string | null>(null);
  const [menuUp, setMenuUp] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const filterRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLDivElement>(null);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return snapshot
      .filter((set) => showArchived || !set.archived)
      .filter((set) => !q || set.name.toLowerCase().includes(q))
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [snapshot, search, showArchived]);

  useEffect(() => {
    if (!menuId) return;
    function close() { setMenuId(null); }
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [menuId]);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) setFilterOpen(false);
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  function openMenu(id: string, button: HTMLButtonElement) {
    const tableBottom = tableRef.current?.getBoundingClientRect().bottom ?? window.innerHeight;
    setMenuUp(tableBottom - button.getBoundingClientRect().bottom < 140);
    setMenuId((current) => (current === id ? null : id));
  }

  function duplicate(id: string) {
    const copy = statusSets.duplicate(id);
    setMenuId(null);
    navigate(`/admin/statuses/${copy.id}`);
  }

  function archive(set: StatusSet) {
    if (set.archived) statusSets.restore(set.id);
    else statusSets.archive(set.id);
    setMenuId(null);
  }

  return (
    <div className="space-y-4">
      <div className="pb-1">
        <h1 className="text-2xl font-semibold" style={{ color: '#35353B' }}>Statuses</h1>
        <p className="text-sm" style={{ color: '#9BA0B0' }}>Create status sets that list and audit templates can use.</p>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <SearchIcon />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search status sets..."
            aria-label="Search status sets"
            className="w-full rounded py-2 pl-9 pr-4 text-sm focus:outline-none"
            style={{ border: '1px solid #CCCDD0', backgroundColor: '#ffffff', color: '#35353B' }}
          />
        </div>
        <div ref={filterRef} className="relative">
          <button
            type="button"
            onClick={() => setFilterOpen((open) => !open)}
            className="flex h-9 items-center gap-1.5 rounded px-3 text-sm font-bold"
            style={{
              border: showArchived ? '1px solid #5CA6D9' : '1px solid #CCCDD0',
              backgroundColor: '#ffffff',
              color: showArchived ? '#5CA6D9' : '#757677',
            }}
          >
            <FilterIcon />
            Filter
          </button>
          {filterOpen && (
            <div className="absolute right-0 top-11 z-20 w-56 rounded bg-white p-3" style={{ border: '1px solid #CCCDD0', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
              <label className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm" style={{ color: '#35353B' }}>
                <input type="checkbox" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} />
                Show archived sets
              </label>
            </div>
          )}
        </div>
        <PrimaryButton onClick={() => setDrawerOpen(true)}>New status set</PrimaryButton>
      </div>

      <div ref={tableRef} className="rounded bg-white" style={{ border: '1px solid #CCCDD0' }}>
        <table className="w-full text-sm">
          <thead className="border-b text-left" style={{ borderColor: '#CCCDD0' }}>
            <tr>
              {['Set name', 'Statuses', 'Used by', 'Last edited'].map((label) => (
                <th key={label} className="px-4 text-xs font-medium" style={{ color: '#9BA0B0', height: 40 }}>{label}</th>
              ))}
              <th className="px-4" style={{ width: 48 }} />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm" style={{ color: '#9BA0B0' }}>No status sets match your search.</td>
              </tr>
            )}
            {rows.map((set) => (
              <tr
                key={set.id}
                className="cursor-pointer border-b last:border-b-0"
                style={{ borderColor: '#CCCDD0', height: 40 }}
                onClick={() => navigate(`/admin/statuses/${set.id}`)}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#F7F7FA'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = ''; }}
              >
                <td className="px-4 font-semibold" style={{ color: '#35353B' }}>
                  <div className="flex items-center gap-2">
                    <span>{set.name}</span>
                    {set.archived && (
                      <span className="rounded-full px-2 text-xs font-medium" style={{ backgroundColor: '#F1F2F4', color: '#68686e', border: '1px solid #E0E2E6', lineHeight: '18px' }}>Archived</span>
                    )}
                  </div>
                </td>
                <td className="px-4">
                  <div className="flex flex-wrap items-center gap-1">
                    {set.statuses.map((status) => <StatusChip key={status.id} status={status} size="sm" />)}
                  </div>
                </td>
                <td className="px-4" style={{ color: '#757677', whiteSpace: 'nowrap' }}>{plural(set.usedBy.length, 'template')}</td>
                <td className="px-4" style={{ color: '#757677', whiteSpace: 'nowrap' }}>{formatStatusDate(set.lastEdited)} · {set.lastEditedBy}</td>
                <td className="px-2">
                  <div className="relative flex justify-end">
                    <button
                      type="button"
                      aria-label={`Actions for ${set.name}`}
                      className="flex h-8 w-8 items-center justify-center rounded-full"
                      style={{ color: '#9BA0B0' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        openMenu(set.id, e.currentTarget);
                      }}
                    >
                      <DotsIcon />
                    </button>
                    {menuId === set.id && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className={`absolute right-0 z-20 w-40 rounded bg-white py-1 ${menuUp ? 'bottom-9' : 'top-9'}`}
                        style={{ border: '1px solid #CCCDD0', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
                      >
                        <MenuButton onClick={() => navigate(`/admin/statuses/${set.id}`)}>Edit</MenuButton>
                        <MenuButton onClick={() => duplicate(set.id)}>Duplicate</MenuButton>
                        <MenuButton onClick={() => archive(set)}>{set.archived ? 'Restore' : 'Archive'}</MenuButton>
                        <div style={{ borderTop: '1px solid #CCCDD0', margin: '4px 0' }} />
                        <MenuButton danger onClick={() => { setMenuId(null); setDeleteId(set.id); }}>Delete</MenuButton>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {drawerOpen && <NewSetDrawer onClose={() => setDrawerOpen(false)} onCreated={(id) => navigate(`/admin/statuses/${id}`)} />}
      {deleteId && <DeleteSetDialog setId={deleteId} onClose={() => setDeleteId(null)} onFinished={() => setDeleteId(null)} />}
    </div>
  );
}

function NewSetDrawer({ onClose, onCreated }: { onClose: () => void; onCreated: (id: string) => void }) {
  const snapshot = useStatusSets();
  const sources = useMemo(
    () => snapshot.filter((set) => !set.archived).slice().sort((a, b) => a.name.localeCompare(b.name)),
    [snapshot],
  );
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startFrom, setStartFrom] = useState<string>('blank');

  const trimmed = name.trim();
  const taken = trimmed.length > 0 && snapshot.some((set) => set.name.trim().toLowerCase() === trimmed.toLowerCase());
  const canCreate = trimmed.length > 0 && !taken;

  function create() {
    if (!canCreate) return;
    const set = statusSets.create({
      name: trimmed,
      description,
      copyFromSetId: startFrom === 'blank' ? null : startFrom,
    });
    onCreated(set.id);
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button aria-label="Close" onClick={onClose} className="absolute inset-0" style={{ backgroundColor: 'rgba(53,53,59,0.45)' }} />
      <aside className="relative flex h-full w-full flex-col bg-white" style={{ maxWidth: 400, borderLeft: '1px solid #CCCDD0' }} role="dialog" aria-label="New status set">
        <div className="flex items-start gap-3 px-5 py-4" style={{ borderBottom: '1px solid #CCCDD0' }}>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-semibold" style={{ color: '#35353B' }}>New status set</h2>
            <p className="text-sm" style={{ color: '#9BA0B0' }}>Start from scratch or copy an existing set.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" style={{ color: '#9BA0B0' }}>✕</button>
        </div>
        <form
          className="flex min-h-0 flex-1 flex-col"
          onSubmit={(e) => { e.preventDefault(); create(); }}
        >
          <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide" style={{ color: '#9BA0B0' }}>Name</span>
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Store Walk Review"
                className="w-full rounded px-3 text-sm"
                style={{ height: 36, border: `1px solid ${taken ? '#D64545' : '#CCCDD0'}`, color: '#35353B' }}
              />
              {taken && <span className="mt-1 block text-xs" style={{ color: '#D64545' }}>A set with this name already exists.</span>}
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide" style={{ color: '#9BA0B0' }}>Description <span style={{ fontWeight: 400, textTransform: 'none' }}>(optional)</span></span>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full rounded px-3 py-2 text-sm"
                style={{ border: '1px solid #CCCDD0', color: '#35353B', resize: 'vertical' }}
              />
            </label>
            <div>
              <span className="mb-2 block text-xs font-semibold uppercase tracking-wide" style={{ color: '#9BA0B0' }}>Start from</span>
              <div className="space-y-2">
                <StartCard selected={startFrom === 'blank'} onSelect={() => setStartFrom('blank')} title="Blank" detail="Two statuses: Open (default) and Done." />
                {sources.map((set) => (
                  <StartCard
                    key={set.id}
                    selected={startFrom === set.id}
                    onSelect={() => setStartFrom(set.id)}
                    title={`Copy of ${set.name}`}
                    chips={set.statuses}
                  />
                ))}
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 px-5 py-3" style={{ borderTop: '1px solid #CCCDD0' }}>
            <SecondaryButton onClick={onClose}>Cancel</SecondaryButton>
            <PrimaryButton disabled={!canCreate} onClick={create}>Create and edit</PrimaryButton>
          </div>
        </form>
      </aside>
    </div>
  );
}

function StartCard({
  selected, onSelect, title, detail, chips,
}: {
  selected: boolean;
  onSelect: () => void;
  title: string;
  detail?: string;
  chips?: StatusSet['statuses'];
}) {
  return (
    <label
      className="flex cursor-pointer gap-2 rounded p-3"
      style={{ border: `1px solid ${selected ? '#5CA6D9' : '#CCCDD0'}`, backgroundColor: selected ? '#F3F9FD' : '#ffffff' }}
    >
      <input type="radio" name="start-from" checked={selected} onChange={onSelect} className="mt-1" />
      <span className="min-w-0">
        <span className="block text-sm font-semibold" style={{ color: '#35353B' }}>{title}</span>
        {detail && <span className="mt-0.5 block text-xs" style={{ color: '#757677' }}>{detail}</span>}
        {chips && (
          <span className="mt-1.5 flex flex-wrap gap-1">
            {chips.map((status) => <StatusChip key={status.id} status={status} size="sm" />)}
          </span>
        )}
      </span>
    </label>
  );
}

function SearchIcon() {
  return (
    <svg className="absolute left-3 top-1/2 -translate-y-1/2" width="15" height="15" viewBox="0 0 15 15" fill="none" style={{ color: '#9BA0B0' }} aria-hidden>
      <path d="M10 6.5a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Zm-.691 3.516a4.5 4.5 0 1 1 .707-.707l2.838 2.837a.5.5 0 0 1-.708.708L9.31 10.016Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd" />
    </svg>
  );
}

function FilterIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden>
      <path d="M1 3.5A.5.5 0 0 1 1.5 3h12a.5.5 0 0 1 0 1h-12a.5.5 0 0 1-.5-.5Zm2 4A.5.5 0 0 1 3.5 7h8a.5.5 0 0 1 0 1h-8a.5.5 0 0 1-.5-.5Zm2 4a.5.5 0 0 1 .5-.5h4a.5.5 0 0 1 0 1h-4a.5.5 0 0 1-.5-.5Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd" />
    </svg>
  );
}

function DotsIcon() {
  return (
    <span className="flex flex-col items-center gap-[3px]" aria-hidden>
      <span className="h-1 w-1 rounded-full bg-current" />
      <span className="h-1 w-1 rounded-full bg-current" />
      <span className="h-1 w-1 rounded-full bg-current" />
    </span>
  );
}
