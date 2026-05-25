import { useState, useRef, useEffect } from 'react';
import CreateAttributeDrawer from '@/components/attributes/CreateAttributeDrawer';
import {
  ATTRIBUTE_DEFS,
  SEED_LOCATIONS,
  SEED_ATTRIBUTE_VALUES,
} from '@/data/attributes';
import type { AttributeDef, AttributeType, LocationAttributeValue } from '@/data/attributes';

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

function ChevronDownIcon({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 15 15" fill="none">
      <path d="M3.135 6.158a.5.5 0 0 1 .707-.023L7.5 9.565l3.658-3.43a.5.5 0 0 1 .684.73l-4 3.75a.5.5 0 0 1-.684 0l-4-3.75a.5.5 0 0 1-.023-.707Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd" />
    </svg>
  );
}

function XIcon({ size = 10 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 15 15" fill="none">
      <path d="M11.782 4.032a.575.575 0 1 0-.813-.813L7.5 6.687 4.031 3.22a.575.575 0 0 0-.813.813L6.687 7.5l-3.469 3.468a.575.575 0 0 0 .813.813L7.5 8.313l3.469 3.468a.575.575 0 0 0 .813-.813L8.313 7.5l3.469-3.468Z" fill="currentColor" />
    </svg>
  );
}

// ── Badges ────────────────────────────────────────────────────────────────────

function ValueTypeBadge({ type }: { type: string }) {
  const styles: Record<string, { bg: string; color: string }> = {
    Boolean: { bg: '#E9F6FF', color: '#2C82BD' },
    Numeric: { bg: '#E8FCE8', color: '#367a36' },
    Enum:    { bg: '#eadcf4', color: '#593078' },
  };
  const s = styles[type] ?? styles.Boolean;
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
      style={{ backgroundColor: s.bg, color: s.color }}
    >
      {type}
    </span>
  );
}

function TagTypeBadge({ type }: { type: AttributeType }) {
  const isLoc = type === 'Location Attribute';
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
      style={{
        backgroundColor: isLoc ? '#E9F6FF' : '#F7F7FA',
        color: isLoc ? '#004676' : '#757677',
        border: isLoc ? 'none' : '1px solid #CCCDD0',
      }}
    >
      {type}
    </span>
  );
}

// ── Row kebab ─────────────────────────────────────────────────────────────────

function RowKebab({ onEdit, onArchive }: { onEdit: () => void; onArchive: () => void }) {
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
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
        className="flex h-7 w-7 items-center justify-center rounded-lg transition-colors"
        style={{ color: '#9BA0B0', background: 'transparent', border: 'none', cursor: 'pointer' }}
        onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#F7F7FA'; e.currentTarget.style.color = '#757677'; }}
        onMouseLeave={e => { e.currentTarget.style.backgroundColor = ''; e.currentTarget.style.color = '#9BA0B0'; }}
      >
        <KebabIcon />
      </button>
      {open && (
        <div
          className="absolute right-0 top-8 z-30 w-40 rounded bg-white py-1"
          style={{ border: '1px solid #CCCDD0', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}
        >
          <button
            className="w-full px-4 py-2 text-left text-sm transition-colors"
            style={{ color: '#35353B' }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F7F7FA'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = ''}
            onClick={() => { setOpen(false); onEdit(); }}
          >
            Edit
          </button>
          <button
            className="w-full px-4 py-2 text-left text-sm transition-colors"
            style={{ color: '#35353B' }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F7F7FA'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = ''}
            onClick={() => { setOpen(false); onArchive(); }}
          >
            Archive
          </button>
          <button
            className="w-full px-4 py-2 text-left text-sm transition-colors"
            style={{ color: '#35353B' }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F7F7FA'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = ''}
            onClick={() => setOpen(false)}
          >
            View usage
          </button>
        </div>
      )}
    </div>
  );
}

// ── Explorer panel ────────────────────────────────────────────────────────────

function ExplorerPanel({
  attr,
  values,
  onClose,
}: {
  attr: AttributeDef;
  values: LocationAttributeValue[];
  onClose: () => void;
}) {
  const [valueFilter, setValueFilter] = useState<string>('All');
  const [locSearch, setLocSearch] = useState('');

  const attrValues = values.filter(v => v.attributeId === attr.id);
  const setLocIds = new Set(attrValues.map(v => v.locationId));
  const totalWithValue = setLocIds.size;

  // Build filter options based on value type
  const filterOptions: string[] = ['All'];
  if (attr.valueType === 'Boolean') filterOptions.push('Yes', 'No', 'Unset');
  else if (attr.valueType === 'Enum') {
    (attr.enumValues ?? []).forEach(v => filterOptions.push(v));
    filterOptions.push('Unset');
  } else {
    filterOptions.push('Unset');
  }

  const rows = SEED_LOCATIONS.filter(loc => {
    const match = locSearch.trim().toLowerCase();
    if (match && !loc.name.toLowerCase().includes(match)) return false;
    const val = attrValues.find(v => v.locationId === loc.id);
    if (valueFilter === 'All') return true;
    if (valueFilter === 'Unset') return !val;
    if (attr.valueType === 'Boolean') {
      if (valueFilter === 'Yes') return val?.value === 'true';
      if (valueFilter === 'No')  return val?.value === 'false';
    }
    return val?.value === valueFilter;
  });

  // Stats
  const yesCount  = attrValues.filter(v => v.value === 'true').length;
  const noCount   = attrValues.filter(v => v.value === 'false').length;
  const unsetCount = SEED_LOCATIONS.length - totalWithValue;

  function renderValue(locId: string) {
    const val = attrValues.find(v => v.locationId === locId);
    if (!val) return <span style={{ color: '#CCCDD0', fontSize: '12px' }}>Unset</span>;
    if (attr.valueType === 'Boolean') {
      return val.value === 'true'
        ? <span className="text-xs font-semibold" style={{ color: '#367a36' }}>Yes</span>
        : <span className="text-xs" style={{ color: '#9BA0B0' }}>No</span>;
    }
    if (attr.valueType === 'Numeric') {
      return <span className="text-sm font-semibold" style={{ color: '#35353B' }}>{val.value}</span>;
    }
    return (
      <span
        className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
        style={{ backgroundColor: '#eadcf4', color: '#593078' }}
      >
        {val.value}
      </span>
    );
  }

  return (
    <div className="rounded bg-white mt-3" style={{ border: '1px solid #CCCDD0' }}>

      {/* Explorer header */}
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: '1px solid #CCCDD0', backgroundColor: '#F7F7FA' }}
      >
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#9BA0B0' }}>
            {attr.name}
          </span>
          <TagTypeBadge type={attr.tagType} />
          <ValueTypeBadge type={attr.valueType} />
        </div>
        <button
          onClick={onClose}
          className="flex items-center gap-1 rounded px-2.5 py-1 text-xs transition-colors"
          style={{ color: '#9BA0B0', border: '1px solid #CCCDD0', background: 'transparent', cursor: 'pointer' }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F7F7FA'}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <XIcon size={10} /> Close
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-3 px-4 py-3" style={{ borderBottom: '1px solid #CCCDD0' }}>
        <div className="rounded p-3" style={{ backgroundColor: '#F7F7FA' }}>
          <div className="text-lg font-bold" style={{ color: '#35353B' }}>{SEED_LOCATIONS.length}</div>
          <div className="text-xs" style={{ color: '#9BA0B0' }}>Total locations</div>
        </div>
        {attr.valueType === 'Boolean' && (
          <>
            <div className="rounded p-3" style={{ backgroundColor: '#F7F7FA' }}>
              <div className="text-lg font-bold" style={{ color: '#5CA6D9' }}>{yesCount}</div>
              <div className="text-xs" style={{ color: '#9BA0B0' }}>Yes</div>
            </div>
            <div className="rounded p-3" style={{ backgroundColor: '#F7F7FA' }}>
              <div className="text-lg font-bold" style={{ color: '#35353B' }}>{noCount}</div>
              <div className="text-xs" style={{ color: '#9BA0B0' }}>No</div>
            </div>
          </>
        )}
        {attr.valueType === 'Numeric' && (
          <>
            <div className="rounded p-3" style={{ backgroundColor: '#F7F7FA' }}>
              <div className="text-lg font-bold" style={{ color: '#5CA6D9' }}>{totalWithValue}</div>
              <div className="text-xs" style={{ color: '#9BA0B0' }}>With value</div>
            </div>
            <div className="rounded p-3" style={{ backgroundColor: '#F7F7FA' }}>
              <div className="text-lg font-bold" style={{ color: '#35353B' }}>
                {totalWithValue > 0
                  ? (attrValues.reduce((s, v) => s + Number(v.value), 0) / totalWithValue).toFixed(1)
                  : '—'}
              </div>
              <div className="text-xs" style={{ color: '#9BA0B0' }}>Avg value</div>
            </div>
          </>
        )}
        {attr.valueType === 'Enum' && (
          <div className="rounded p-3" style={{ backgroundColor: '#F7F7FA' }}>
            <div className="text-lg font-bold" style={{ color: '#5CA6D9' }}>{totalWithValue}</div>
            <div className="text-xs" style={{ color: '#9BA0B0' }}>With value</div>
          </div>
        )}
        <div className="rounded p-3" style={{ backgroundColor: '#F7F7FA' }}>
          <div className="text-lg font-bold" style={{ color: '#9BA0B0' }}>{unsetCount}</div>
          <div className="text-xs" style={{ color: '#9BA0B0' }}>Unset</div>
        </div>
      </div>

      {/* Filter + search bar */}
      <div className="flex items-center gap-3 px-4 py-2.5" style={{ borderBottom: '1px solid #CCCDD0' }}>
        <div className="flex gap-1">
          {filterOptions.map(f => (
            <button
              key={f}
              onClick={() => setValueFilter(f)}
              className="rounded px-2.5 py-1 text-xs font-bold transition-colors"
              style={{
                backgroundColor: valueFilter === f ? '#5CA6D9' : 'transparent',
                color: valueFilter === f ? '#fff' : '#9BA0B0',
                border: valueFilter === f ? 'none' : '1px solid transparent',
                cursor: 'pointer',
              }}
              onMouseEnter={e => { if (valueFilter !== f) e.currentTarget.style.backgroundColor = '#F7F7FA'; }}
              onMouseLeave={e => { if (valueFilter !== f) e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="relative ml-auto" style={{ width: '200px' }}>
          <SearchIcon />
          <input
            value={locSearch}
            onChange={e => setLocSearch(e.target.value)}
            placeholder="Search locations…"
            className="w-full rounded py-1.5 pl-8 pr-3 text-xs focus:outline-none"
            style={{ border: '1px solid #CCCDD0', color: '#35353B', borderRadius: '8px' }}
            onFocus={e => e.currentTarget.style.borderColor = '#9BA0B0'}
            onBlur={e => e.currentTarget.style.borderColor = '#CCCDD0'}
          />
        </div>
        <span className="text-xs" style={{ color: '#9BA0B0', whiteSpace: 'nowrap' }}>
          {rows.length} of {SEED_LOCATIONS.length}
        </span>
      </div>

      {/* Location rows */}
      <div>
        {/* Column headers */}
        <div
          className="grid px-4 py-2 text-xs font-medium"
          style={{
            gridTemplateColumns: '1fr 120px 120px 80px',
            backgroundColor: '#F7F7FA',
            borderBottom: '1px solid #CCCDD0',
            color: '#9BA0B0',
          }}
        >
          <span>Location</span>
          <span>Region</span>
          <span>Area</span>
          <span>Value</span>
        </div>

        {rows.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm" style={{ color: '#9BA0B0' }}>
            No locations match your filter.
          </div>
        ) : (
          rows.map((loc) => (
            <div
              key={loc.id}
              className="grid items-center px-4 py-2.5 text-sm"
              style={{
                gridTemplateColumns: '1fr 120px 120px 80px',
                borderBottom: '1px solid #CCCDD0',
              }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#F7F7FA')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = '')}
            >
              <span className="font-medium text-sm" style={{ color: '#35353B' }}>{loc.name}</span>
              <span className="text-xs" style={{ color: '#757677' }}>{loc.region}</span>
              <span className="text-xs" style={{ color: '#757677' }}>{loc.area}</span>
              <div>{renderValue(loc.id)}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function LocationAttributesPage() {
  const [attrs, setAttrs]             = useState<AttributeDef[]>(ATTRIBUTE_DEFS);
  const [attrValues]                  = useState<LocationAttributeValue[]>(SEED_ATTRIBUTE_VALUES);
  const [query, setQuery]             = useState('');
  const [typeFilter, setTypeFilter]   = useState<'All' | AttributeType>('All');
  const [drawerOpen, setDrawerOpen]   = useState(false);
  const [editingAttr, setEditingAttr] = useState<AttributeDef | null>(null);
  const [explorerAttr, setExplorerAttr] = useState<AttributeDef | null>(null);

  const colClass = 'grid grid-cols-[1fr_140px_100px_120px_90px_32px]';

  const filtered = attrs.filter(a => {
    const q = query.toLowerCase();
    const matchesQuery = a.name.toLowerCase().includes(q) || a.description.toLowerCase().includes(q);
    const matchesType = typeFilter === 'All' || a.tagType === typeFilter;
    return matchesQuery && matchesType;
  });

  function handleSave(data: Omit<AttributeDef, 'id' | 'lastModified'>) {
    if (editingAttr) {
      setAttrs(prev => prev.map(a =>
        a.id === editingAttr.id
          ? { ...a, ...data, lastModified: new Date().toISOString().slice(0, 10) }
          : a
      ));
    } else {
      const newAttr: AttributeDef = {
        ...data,
        id: `attr_${Date.now()}`,
        lastModified: new Date().toISOString().slice(0, 10),
      };
      setAttrs(prev => [...prev, newAttr]);
    }
  }

  function openCreate() {
    setEditingAttr(null);
    setDrawerOpen(true);
  }

  function openEdit(attr: AttributeDef) {
    setEditingAttr(attr);
    setDrawerOpen(true);
  }

  function handleArchive(attrId: string) {
    setAttrs(prev => prev.filter(a => a.id !== attrId));
    if (explorerAttr?.id === attrId) setExplorerAttr(null);
  }

  function locationCount(attrId: string) {
    const ids = new Set(attrValues.filter(v => v.attributeId === attrId).map(v => v.locationId));
    return ids.size;
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  const locAttrCount  = attrs.filter(a => a.tagType === 'Location Attribute').length;
  const itemGroupCount = attrs.filter(a => a.tagType === 'Item Group').length;

  return (
    <div>
      {/* Page header */}
      <div className="pb-4">
        <h1 className="text-2xl font-semibold" style={{ color: '#35353B' }}>Location Attributes</h1>
        <p className="text-sm" style={{ color: '#757677' }}>Define and explore attributes across your locations.</p>
      </div>

      {/* Summary stat cards */}
      <div className="mb-4 grid grid-cols-3 gap-3">
        {[
          { label: 'Total attributes', value: attrs.length },
          { label: 'Location Attributes', value: locAttrCount },
          { label: 'Item Groups', value: itemGroupCount },
        ].map(s => (
          <div key={s.label} className="rounded p-4 bg-white" style={{ border: '1px solid #CCCDD0' }}>
            <div className="text-2xl font-bold" style={{ color: '#35353B' }}>{s.value}</div>
            <div className="text-xs mt-0.5" style={{ color: '#9BA0B0' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="sticky top-0 z-10" style={{ backgroundColor: '#F7F7FA' }}>
        <div className="flex items-center gap-2 pb-3">

          {/* Search */}
          <div className="relative flex-1">
            <SearchIcon />
            <input
              type="text"
              placeholder="Search attributes…"
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="w-full rounded py-2 pl-9 pr-4 text-sm focus:outline-none transition-colors"
              style={{ border: '1px solid #CCCDD0', backgroundColor: '#ffffff', color: '#35353B' }}
              onFocus={e => e.currentTarget.style.borderColor = '#9BA0B0'}
              onBlur={e => e.currentTarget.style.borderColor = '#CCCDD0'}
            />
          </div>

          {/* Type filter tabs */}
          <div className="flex rounded overflow-hidden" style={{ border: '1px solid #CCCDD0', backgroundColor: '#fff' }}>
            {(['All', 'Location Attribute', 'Item Group'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className="px-3 py-2 text-xs font-bold transition-colors"
                style={{
                  backgroundColor: typeFilter === t ? '#5CA6D9' : 'transparent',
                  color: typeFilter === t ? '#ffffff' : '#9BA0B0',
                  border: 'none',
                  cursor: 'pointer',
                  borderRight: t !== 'Item Group' ? '1px solid #CCCDD0' : 'none',
                }}
              >
                {t}
              </button>
            ))}
          </div>

          {/* New attribute */}
          <button
            onClick={openCreate}
            className="rounded px-4 py-2 text-sm font-bold text-white transition-colors whitespace-nowrap"
            style={{ backgroundColor: '#5CA6D9', border: 'none', cursor: 'pointer' }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#2C82BD'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = '#5CA6D9'}
          >
            + New attribute
          </button>
        </div>

        {/* Table */}
        <div className="rounded bg-white overflow-hidden" style={{ border: '1px solid #CCCDD0' }}>
          {/* Table header */}
          <div
            className={`${colClass} min-w-max border-b px-4 py-2 text-xs font-medium`}
            style={{ borderColor: '#CCCDD0', backgroundColor: '#F7F7FA', color: '#9BA0B0' }}
          >
            <span>Attribute</span>
            <span>Tag type</span>
            <span>Value type</span>
            <span>Locations</span>
            <span>Modified</span>
            <span />
          </div>

          {filtered.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm" style={{ color: '#9BA0B0' }}>
              No attributes match your search or filter.
            </div>
          ) : (
            filtered.map(attr => {
              const isExploring = explorerAttr?.id === attr.id;
              const count = locationCount(attr.id);
              const isLocAttr = attr.tagType === 'Location Attribute';

              return (
                <div key={attr.id}>
                  <div
                    className={`${colClass} min-w-max items-center border-b px-4 py-3 text-sm last:border-b-0 transition-colors cursor-pointer`}
                    style={{
                      borderColor: '#CCCDD0',
                      backgroundColor: isExploring ? '#E9F6FF' : '',
                    }}
                    onClick={() => setExplorerAttr(isExploring ? null : attr)}
                    onMouseEnter={e => { if (!isExploring) e.currentTarget.style.backgroundColor = '#F7F7FA'; }}
                    onMouseLeave={e => { if (!isExploring) e.currentTarget.style.backgroundColor = ''; }}
                  >
                    {/* Name + description */}
                    <div>
                      <div className="flex items-center gap-2">
                        {attr.tagType === 'Item Group' && attr.icon && (
                          <span
                            className="flex h-5 w-5 items-center justify-center rounded text-xs flex-shrink-0"
                            style={{ backgroundColor: attr.color ?? '#888' }}
                          >
                            {attr.icon}
                          </span>
                        )}
                        <span className="font-semibold" style={{ color: '#35353B' }}>{attr.name}</span>
                      </div>
                      <div className="mt-0.5 text-xs" style={{ color: '#9BA0B0' }}>{attr.description}</div>
                    </div>

                    {/* Tag type */}
                    <div><TagTypeBadge type={attr.tagType} /></div>

                    {/* Value type — only for Location Attributes */}
                    <div>
                      {isLocAttr
                        ? <ValueTypeBadge type={attr.valueType} />
                        : <span style={{ color: '#CCCDD0', fontSize: '12px' }}>—</span>
                      }
                    </div>

                    {/* Location count — only for Location Attributes */}
                    <div>
                      {isLocAttr ? (
                        <button
                          className="text-sm font-semibold transition-colors"
                          style={{
                            color: '#5CA6D9',
                            textDecoration: 'underline',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: 0,
                          }}
                          onClick={e => { e.stopPropagation(); setExplorerAttr(isExploring ? null : attr); }}
                        >
                          {count} location{count !== 1 ? 's' : ''}
                        </button>
                      ) : (
                        <span style={{ color: '#CCCDD0', fontSize: '12px' }}>—</span>
                      )}
                    </div>

                    {/* Modified */}
                    <span className="text-xs" style={{ color: '#9BA0B0' }}>{formatDate(attr.lastModified)}</span>

                    {/* Kebab */}
                    <RowKebab
                      onEdit={() => openEdit(attr)}
                      onArchive={() => handleArchive(attr.id)}
                    />
                  </div>

                  {/* Explorer panel — inline below this row */}
                  {isExploring && (
                    <div className="px-4 pb-4" style={{ borderBottom: '1px solid #CCCDD0' }}>
                      <ExplorerPanel
                        attr={attr}
                        values={attrValues}
                        onClose={() => setExplorerAttr(null)}
                      />
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      <CreateAttributeDrawer
        open={drawerOpen}
        editingAttr={editingAttr}
        onClose={() => { setDrawerOpen(false); setEditingAttr(null); }}
        onSave={handleSave}
      />
    </div>
  );
}
