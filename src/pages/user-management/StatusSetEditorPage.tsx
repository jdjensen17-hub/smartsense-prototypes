import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { DangerButton, MenuButton, PrimaryButton, SecondaryButton } from '@/components/statuses/buttons';
import { DeleteSetDialog } from '@/components/statuses/DeleteSetDialog';
import { IconBadge, Modal } from '@/components/statuses/Modal';
import {
  formatStatusDate,
  plural,
  STATUS_CATEGORIES,
  STATUS_COLOR_KEYS,
  STATUS_COLORS,
  statusSets,
  useStatusSets,
  type Status,
  type StatusCategory,
  type StatusMigration,
  type StatusSet,
} from '@/data/statusSets';

type PendingMove = StatusMigration & { fromName: string; toName: string };

export default function StatusSetEditorPage() {
  const { setId = '' } = useParams();
  const snapshot = useStatusSets();
  const initial = snapshot.find((set) => set.id === setId) ?? null;
  if (!initial) {
    return (
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold" style={{ color: '#35353B' }}>Status set not found</h1>
        <Link to="/admin/statuses" style={{ color: '#5CA6D9' }}>Back to Statuses</Link>
      </div>
    );
  }
  return <Editor key={initial.id} initial={initial} />;
}

function Editor({ initial }: { initial: StatusSet }) {
  const navigate = useNavigate();
  const snapshot = useStatusSets();
  const live = snapshot.find((set) => set.id === initial.id) ?? initial;
  const [draft, setDraft] = useState<StatusSet>(() => cloneSet(initial));
  const [original] = useState<StatusSet>(() => cloneSet(initial));
  const [moves, setMoves] = useState<PendingMove[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [colorFor, setColorFor] = useState<string | null>(null);
  const [deleteSetOpen, setDeleteSetOpen] = useState(false);
  const [moveTarget, setMoveTarget] = useState<{ statusId: string; toId: string } | null>(null);
  const [warnOpen, setWarnOpen] = useState(false);
  const [dragOver, setDragOver] = useState<number | null>(null);
  const dragFrom = useRef<number | null>(null);
  const focusName = useRef<string | null>(null);

  const errors = useMemo(() => validate(draft, snapshot), [draft, snapshot]);
  const valid = !errors.setName && Object.keys(errors.statuses).length === 0;
  const dirty = signature(draft) !== signature(original) || moves.length > 0;
  const guarded = needsGoingForwardWarning(draft, original, live.usedBy.length);

  useEffect(() => {
    if (!focusName.current) return;
    document.getElementById(`sn-${focusName.current}`)?.focus();
    focusName.current = null;
  }, [draft.statuses]);

  useEffect(() => {
    if (!menuOpen && !colorFor) return;
    function close(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (menuOpen && !target.closest('[data-editor-menu]')) setMenuOpen(false);
      if (colorFor && !target.closest('[data-color-popover]')) setColorFor(null);
    }
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [menuOpen, colorFor]);

  function patchStatus(id: string, patch: Partial<Status>) {
    setDraft((current) => ({
      ...current,
      statuses: current.statuses.map((status) => (status.id === id ? { ...status, ...patch } : status)),
    }));
  }

  function setDefault(id: string) {
    setDraft((current) => ({
      ...current,
      statuses: current.statuses.map((status) => ({ ...status, isDefault: status.id === id })),
    }));
  }

  function moveRow(from: number, to: number) {
    if (to < 0 || to >= draft.statuses.length || from === to) return;
    const id = draft.statuses[from].id;
    setDraft((current) => {
      const statuses = current.statuses.slice();
      const [item] = statuses.splice(from, 1);
      statuses.splice(to, 0, item);
      return { ...current, statuses };
    });
    requestAnimationFrame(() => document.getElementById(`handle-${id}`)?.focus());
  }

  function addStatus() {
    const id = `st-${Math.random().toString(36).slice(2, 8)}`;
    focusName.current = id;
    setDraft((current) => ({
      ...current,
      statuses: [...current.statuses, {
        id, name: '', color: 'blue', category: 'open', isDefault: false, canSubmitFrom: false, openInstances: 0,
      }],
    }));
  }

  function dropStatus(id: string) {
    setDraft((current) => {
      const removed = current.statuses.find((status) => status.id === id);
      let statuses = current.statuses.filter((status) => status.id !== id);
      if (removed?.isDefault && statuses[0]) statuses = statuses.map((status, index) => ({ ...status, isDefault: index === 0 }));
      return { ...current, statuses };
    });
  }

  function askDelete(status: Status) {
    if (draft.statuses.length <= 1) return;
    if (status.openInstances <= 0) {
      dropStatus(status.id);
      return;
    }
    const other = draft.statuses.find((item) => item.id !== status.id);
    const fallback = status.isDefault ? other : (draft.statuses.find((item) => item.isDefault && item.id !== status.id) ?? other);
    if (!fallback) return;
    setMoveTarget({ statusId: status.id, toId: fallback.id });
  }

  function confirmMove() {
    if (!moveTarget) return;
    const from = draft.statuses.find((status) => status.id === moveTarget.statusId);
    const to = draft.statuses.find((status) => status.id === moveTarget.toId);
    if (!from || !to) return;
    setMoves((current) => [...current, { fromStatusId: from.id, toStatusId: to.id, count: from.openInstances, fromName: from.name, toName: to.name }]);
    setDraft((current) => {
      let statuses = current.statuses
        .filter((status) => status.id !== from.id)
        .map((status) => (status.id === to.id ? { ...status, openInstances: status.openInstances + from.openInstances } : status));
      if (from.isDefault) statuses = statuses.map((status, index) => ({ ...status, isDefault: index === 0 }));
      return { ...current, statuses };
    });
    setMoveTarget(null);
  }

  function commit() {
    const trimmed: StatusSet = {
      ...draft,
      name: draft.name.trim(),
      statuses: draft.statuses.map((status) => ({ ...status, name: status.name.trim() })),
    };
    statusSets.update(draft.id, trimmed, { migrations: moves.map(({ fromStatusId, toStatusId, count }) => ({ fromStatusId, toStatusId, count })) });
    navigate('/admin/statuses');
  }

  function requestSave() {
    if (!dirty || !valid) return;
    if (guarded) setWarnOpen(true);
    else commit();
  }

  const note = !dirty ? 'No changes' : !valid ? (blankName(draft) ? 'Every status needs a name' : 'Names must be unique') : 'Unsaved changes';
  const moving = moveTarget ? draft.statuses.find((status) => status.id === moveTarget.statusId) : undefined;

  return (
    <div>
      <div className="mb-3 flex items-center gap-1.5 text-sm">
        <Link to="/admin/statuses" style={{ color: '#5CA6D9' }}>Statuses</Link>
        <span style={{ color: '#9BA0B0' }}>›</span>
        <span style={{ color: '#757677' }}>{draft.name.trim() || 'Untitled set'}</span>
      </div>

      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold" style={{ color: '#35353B' }}>{draft.name.trim() || 'Untitled set'}</h1>
          <p className="text-sm" style={{ color: '#9BA0B0' }}>
            Last edited {formatStatusDate(live.lastEdited)} by {live.lastEditedBy}
          </p>
        </div>
        <div className="relative" data-editor-menu>
          <button
            type="button"
            aria-label="More actions"
            onClick={() => setMenuOpen((open) => !open)}
            className="flex h-8 w-8 items-center justify-center rounded"
            style={{ border: '1px solid #CCCDD0', color: '#757677', backgroundColor: '#ffffff' }}
          >
            <span className="flex flex-col items-center gap-[3px]">
              <span className="h-1 w-1 rounded-full bg-current" />
              <span className="h-1 w-1 rounded-full bg-current" />
              <span className="h-1 w-1 rounded-full bg-current" />
            </span>
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-10 z-20 w-40 rounded bg-white py-1" style={{ border: '1px solid #CCCDD0', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
              <MenuButton onClick={() => { const copy = statusSets.duplicate(live.id); navigate(`/admin/statuses/${copy.id}`); }}>Duplicate</MenuButton>
              <MenuButton onClick={() => { if (live.archived) statusSets.restore(live.id); else { statusSets.archive(live.id); navigate('/admin/statuses'); } setMenuOpen(false); }}>
                {live.archived ? 'Restore' : 'Archive'}
              </MenuButton>
              <div style={{ borderTop: '1px solid #CCCDD0', margin: '4px 0' }} />
              <MenuButton danger onClick={() => { setMenuOpen(false); setDeleteSetOpen(true); }}>Delete</MenuButton>
            </div>
          )}
        </div>
      </div>

      {live.usedBy.length > 0 && (
        <div className="mb-4 rounded px-4 py-3 text-sm" style={{ backgroundColor: '#E9F6FF', border: '1px solid #B9DFF6', color: '#35353B' }}>
          <div className="font-semibold">Used by {plural(live.usedBy.length, 'template')}. Changes apply to all of them.</div>
          <div style={{ color: '#757677' }}>{live.usedBy.map((template) => template.name).join(', ')}</div>
        </div>
      )}

      <section className="mb-4 rounded bg-white p-4" style={{ border: '1px solid #CCCDD0' }}>
        <label className="mb-3 block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide" style={{ color: '#9BA0B0' }}>Name</span>
          <input
            value={draft.name}
            onChange={(e) => setDraft((current) => ({ ...current, name: e.target.value }))}
            className="w-full rounded px-3 text-sm"
            style={{ height: 36, border: `1px solid ${errors.setName ? '#D64545' : '#CCCDD0'}`, color: '#35353B' }}
          />
          {errors.setName && <span className="mt-1 block text-xs" style={{ color: '#D64545' }}>{errors.setName}</span>}
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide" style={{ color: '#9BA0B0' }}>Description <span style={{ fontWeight: 400, textTransform: 'none' }}>(optional)</span></span>
          <textarea
            value={draft.description}
            onChange={(e) => setDraft((current) => ({ ...current, description: e.target.value }))}
            rows={2}
            className="w-full rounded px-3 py-2 text-sm"
            style={{ border: '1px solid #CCCDD0', color: '#35353B', resize: 'vertical' }}
          />
        </label>
      </section>

      <section className="rounded bg-white p-4" style={{ border: '1px solid #CCCDD0' }}>
        <h2 className="text-sm font-semibold" style={{ color: '#35353B' }}>Statuses</h2>
        <p className="mb-3 text-sm" style={{ color: '#9BA0B0' }}>Drag to reorder. The default is the initial status for new instances. Any status can move to any other.</p>
        <table className="w-full text-sm" style={{ tableLayout: 'fixed' }}>
          <colgroup>
            <col style={{ width: 28 }} />
            <col style={{ width: 44 }} />
            <col />
            <col style={{ width: 156 }} />
            <col style={{ width: 72 }} />
            <col style={{ width: 120 }} />
            <col style={{ width: 36 }} />
          </colgroup>
          <thead>
            <tr style={{ color: '#9BA0B0' }}>
              <th className="pb-2" />
              <th className="pb-2 text-left text-xs font-medium">Color</th>
              <th className="pb-2 text-left text-xs font-medium">Name</th>
              <th className="pb-2 text-left text-xs font-medium">Category</th>
              <th className="pb-2 text-center text-xs font-medium">Default</th>
              <th className="pb-2 text-center text-xs font-medium">Can submit from</th>
              <th className="pb-2" />
            </tr>
          </thead>
          <tbody>
            {draft.statuses.map((status, index) => (
              <tr
                key={status.id}
                onDragOver={(e) => { e.preventDefault(); setDragOver(index); }}
                onDrop={(e) => {
                  e.preventDefault();
                  if (dragFrom.current != null) moveRow(dragFrom.current, index);
                  dragFrom.current = null;
                  setDragOver(null);
                }}
                style={{ backgroundColor: dragOver === index ? '#F2F7FE' : '#ffffff' }}
              >
                <td className="py-1">
                  <button
                    id={`handle-${status.id}`}
                    type="button"
                    draggable
                    aria-label={`Reorder ${status.name || 'status'}. Arrow keys move it.`}
                    className="flex h-8 w-6 cursor-grab items-center justify-center"
                    style={{ color: '#A5A8AE' }}
                    onDragStart={() => { dragFrom.current = index; }}
                    onDragEnd={() => { dragFrom.current = null; setDragOver(null); }}
                    onKeyDown={(e) => {
                      if (e.key === 'ArrowUp') { e.preventDefault(); moveRow(index, index - 1); }
                      if (e.key === 'ArrowDown') { e.preventDefault(); moveRow(index, index + 1); }
                    }}
                  >
                    <GripIcon />
                  </button>
                </td>
                <td className="py-1">
                  <div className="relative" data-color-popover>
                    <button
                      type="button"
                      aria-label={`Color for ${status.name || 'status'}: ${STATUS_COLORS[status.color].label}`}
                      onClick={() => setColorFor((current) => (current === status.id ? null : status.id))}
                      className="flex h-8 w-8 items-center justify-center rounded"
                      style={{ border: '1px solid #CCCDD0', backgroundColor: '#ffffff' }}
                    >
                      <span className="h-4 w-4 rounded-full" style={{ backgroundColor: STATUS_COLORS[status.color].dot }} />
                    </button>
                    {colorFor === status.id && (
                      <div className="absolute left-0 top-9 z-20 grid grid-cols-4 gap-1.5 rounded bg-white p-2" style={{ border: '1px solid #CCCDD0', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
                        {STATUS_COLOR_KEYS.map((key) => (
                          <button
                            key={key}
                            type="button"
                            aria-label={STATUS_COLORS[key].label}
                            onClick={() => { patchStatus(status.id, { color: key }); setColorFor(null); }}
                            className="h-5 w-5 rounded-full"
                            style={{
                              backgroundColor: STATUS_COLORS[key].dot,
                              boxShadow: status.color === key ? '0 0 0 2px #5CA6D9' : '0 0 0 1px #CCCDD0',
                            }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </td>
                <td className="py-1 pr-2">
                  <input
                    id={`sn-${status.id}`}
                    value={status.name}
                    aria-invalid={Boolean(errors.statuses[status.id])}
                    onChange={(e) => patchStatus(status.id, { name: e.target.value })}
                    className="w-full rounded px-2 text-sm"
                    style={{ height: 32, border: `1px solid ${errors.statuses[status.id] ? '#D64545' : '#CCCDD0'}`, color: '#35353B' }}
                  />
                  {errors.statuses[status.id] && <span className="mt-0.5 block text-xs" style={{ color: '#D64545' }}>{errors.statuses[status.id]}</span>}
                </td>
                <td className="py-1 pr-2">
                  <select
                    value={status.category}
                    aria-label={`Category for ${status.name || 'status'}`}
                    onChange={(e) => patchStatus(status.id, { category: e.target.value as StatusCategory })}
                    className="w-full rounded px-2 text-sm"
                    style={{ height: 32, border: '1px solid #CCCDD0', color: '#35353B', backgroundColor: '#ffffff' }}
                  >
                    {STATUS_CATEGORIES.map((category) => <option key={category.id} value={category.id}>{category.label}</option>)}
                  </select>
                </td>
                <td className="py-1 text-center">
                  <input
                    type="radio"
                    name="status-default"
                    checked={status.isDefault}
                    aria-label={`Default status ${status.name || ''}`}
                    onChange={() => setDefault(status.id)}
                  />
                </td>
                <td className="py-1 text-center">
                  <input
                    type="checkbox"
                    checked={status.canSubmitFrom}
                    aria-label={`Can submit from ${status.name || 'status'}`}
                    onChange={(e) => patchStatus(status.id, { canSubmitFrom: e.target.checked })}
                  />
                </td>
                <td className="py-1 text-center">
                  <button
                    type="button"
                    aria-label={`Delete ${status.name || 'status'}`}
                    disabled={draft.statuses.length <= 1}
                    title={draft.statuses.length <= 1 ? 'A set needs at least one status' : 'Delete status'}
                    onClick={() => askDelete(status)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded disabled:cursor-not-allowed"
                    style={{ color: draft.statuses.length <= 1 ? '#CCCDD0' : '#9BA0B0' }}
                  >
                    <TrashIcon />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-3 flex items-center justify-between gap-3">
          <button type="button" onClick={addStatus} className="text-sm font-semibold" style={{ color: '#5CA6D9' }}>+ Add status</button>
          <span className="text-xs" style={{ color: '#9BA0B0' }}>If none are checked, instances can be submitted from any status.</span>
        </div>
      </section>

      {moves.length > 0 && (
        <div className="mt-4 rounded px-4 py-3 text-sm" style={{ backgroundColor: '#FFF8E8', border: '1px solid #F0D48A', color: '#35353B' }}>
          <span className="font-semibold">On save: </span>
          {moves.map((move) => {
            const toName = draft.statuses.find((status) => status.id === move.toStatusId)?.name || move.toName;
            return `${plural(move.count, 'open instance')} move from '${move.fromName}' to '${toName}'`;
          }).join('; ')}.
        </div>
      )}

      <div className="mt-4 flex items-center gap-3">
        <button type="button" onClick={() => setDeleteSetOpen(true)} className="inline-flex items-center gap-1.5 text-sm font-semibold" style={{ color: '#D64545' }}>
          <TrashIcon /> Delete status set
        </button>
        <span className="ml-auto text-sm" style={{ color: dirty && valid ? '#35353B' : '#9BA0B0' }}>{note}</span>
        <SecondaryButton onClick={() => navigate('/admin/statuses')}>Cancel</SecondaryButton>
        <PrimaryButton disabled={!dirty || !valid} onClick={requestSave}>Save</PrimaryButton>
      </div>

      {moving && moveTarget && (
        <Modal
          title={`Delete '${moving.name}'?`}
          icon={<IconBadge tone="danger"><TrashIcon /></IconBadge>}
          onClose={() => setMoveTarget(null)}
          footer={(
            <>
              <SecondaryButton onClick={() => setMoveTarget(null)}>Cancel</SecondaryButton>
              <DangerButton onClick={confirmMove}>Delete</DangerButton>
            </>
          )}
        >
          <p className="mb-2">{plural(moving.openInstances, 'open instance')} use '{moving.name}'. Move them to:</p>
          <select
            value={moveTarget.toId}
            aria-label="Move open instances to"
            onChange={(e) => setMoveTarget({ ...moveTarget, toId: e.target.value })}
            className="w-full rounded px-2 text-sm"
            style={{ height: 36, border: '1px solid #CCCDD0', color: '#35353B', backgroundColor: '#ffffff' }}
          >
            {draft.statuses.filter((status) => status.id !== moving.id).map((status) => (
              <option key={status.id} value={status.id}>{status.name}{status.isDefault ? ' (default)' : ''}</option>
            ))}
          </select>
          <p className="mt-2 text-xs" style={{ color: '#9BA0B0' }}>They move when you save the set. Status history keeps the old name.</p>
        </Modal>
      )}

      {warnOpen && (
        <Modal
          title="Save changes to an in-use set?"
          icon={<IconBadge tone="warn"><AlertIcon /></IconBadge>}
          onClose={() => setWarnOpen(false)}
          footer={(
            <>
              <SecondaryButton onClick={() => setWarnOpen(false)}>Cancel</SecondaryButton>
              <PrimaryButton onClick={commit}>Save changes</PrimaryButton>
            </>
          )}
        >
          <p className="mb-2">This applies going forward to {plural(live.usedBy.length, 'template')}:</p>
          <ul className="mb-2 list-disc pl-5">
            {warningLines(draft, original).map((line) => <li key={line}>{line}</li>)}
          </ul>
          <p className="text-xs" style={{ color: '#757677' }}>In-progress instances keep their current status. New instances use the new default, and submit checks use the new rule from now on.</p>
        </Modal>
      )}

      {deleteSetOpen && (
        <DeleteSetDialog setId={live.id} onClose={() => setDeleteSetOpen(false)} onFinished={() => navigate('/admin/statuses')} />
      )}
    </div>
  );
}

function cloneSet(set: StatusSet): StatusSet {
  return JSON.parse(JSON.stringify(set)) as StatusSet;
}

function signature(set: StatusSet) {
  return JSON.stringify({
    name: set.name,
    description: set.description,
    statuses: set.statuses.map((status) => ({
      id: status.id,
      name: status.name,
      color: status.color,
      category: status.category,
      isDefault: status.isDefault,
      canSubmitFrom: status.canSubmitFrom,
      openInstances: status.openInstances,
    })),
  });
}

function blankName(set: StatusSet) {
  return !set.name.trim() || set.statuses.some((status) => !status.name.trim());
}

function validate(draft: StatusSet, all: StatusSet[]) {
  const statuses: Record<string, string> = {};
  let setName = '';
  const trimmed = draft.name.trim();
  if (!trimmed) setName = 'Name is required';
  else if (all.some((set) => set.id !== draft.id && set.name.trim().toLowerCase() === trimmed.toLowerCase())) setName = 'A set with this name already exists';
  const seen = new Map<string, string>();
  draft.statuses.forEach((status) => {
    const key = status.name.trim().toLowerCase();
    if (!key) statuses[status.id] = 'Name is required';
    else if (seen.has(key)) {
      statuses[status.id] = 'Already used in this set';
      statuses[seen.get(key)!] = 'Already used in this set';
    } else seen.set(key, status.id);
  });
  return { setName, statuses };
}

function defaultId(set: StatusSet) {
  return set.statuses.find((status) => status.isDefault)?.id;
}

function submitIds(set: StatusSet) {
  return set.statuses.filter((status) => status.canSubmitFrom).map((status) => status.id).sort().join();
}

function submitLabel(set: StatusSet) {
  const names = set.statuses.filter((status) => status.canSubmitFrom).map((status) => status.name.trim() || 'Untitled');
  return names.length ? names.join(', ') : 'Any status';
}

function needsGoingForwardWarning(draft: StatusSet, original: StatusSet, usedBy: number) {
  if (usedBy === 0) return false;
  return defaultId(draft) !== defaultId(original) || submitIds(draft) !== submitIds(original);
}

function warningLines(draft: StatusSet, original: StatusSet) {
  const lines: string[] = [];
  if (defaultId(draft) !== defaultId(original)) {
    const before = original.statuses.find((status) => status.isDefault)?.name ?? 'None';
    const after = draft.statuses.find((status) => status.isDefault)?.name ?? 'None';
    lines.push(`Default status: ${before} → ${after}`);
  }
  if (submitIds(draft) !== submitIds(original)) lines.push(`Can submit from: ${submitLabel(original)} → ${submitLabel(draft)}`);
  return lines;
}

function GripIcon() {
  return (
    <svg width="12" height="14" viewBox="0 0 12 14" fill="currentColor" aria-hidden>
      {[1, 6, 11].flatMap((y) => [2, 7].map((x) => <circle key={`${x}-${y}`} cx={x} cy={y} r="1.1" />))}
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M3.5 5h9M6.5 5V3.5h3V5M5 5l.5 8h5L11 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M8 2.5 14 13.5H2L8 2.5Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M8 7v3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="8" cy="11.5" r="0.7" fill="currentColor" />
    </svg>
  );
}
