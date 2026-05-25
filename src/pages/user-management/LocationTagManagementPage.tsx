import { useState, useMemo, useEffect, useRef } from 'react';
import {
  ATTR_DEFS,
  NEEDS_ATTENTION_STORE_IDS,
  generateLocations,
  generateAttrValues,
  needsAttention,
} from '@/data/locationManagement';
import type { Location, LocationAttrValues, AttrDef } from '@/data/locationManagement';

// ── Generate data once ────────────────────────────────────────────────────────
const ALL_LOCATIONS = generateLocations();
const ALL_ATTR_VALUES = generateAttrValues(ALL_LOCATIONS);
const TOTAL = ALL_LOCATIONS.length;
const NEEDS_ATTENTION_IDS = new Set(
  ALL_LOCATIONS.filter(l => NEEDS_ATTENTION_STORE_IDS.has(l.storeId)).map(l => l.id)
);

// ── Types ─────────────────────────────────────────────────────────────────────
type ActiveFilter = { attrId: string; values: string[] };

// ── Design tokens ─────────────────────────────────────────────────────────────
const T = {
  blue:        '#1678C2',
  blueBg:      '#E1F5FF',
  green:       '#27B872',
  danger:      '#E53935',
  dangerBg:    '#FEF2F2',
  dangerBorder:'#FECACA',
  border:      '#BABABA',
  borderLight: '#DBDBDB',
  headerBg:    'color-mix(in srgb, #fff, #181d1f 2%)',
  textStrong:  '#181D1F',
  textBody:    '#555555',
  textMuted:   '#6B7280',
  textLight:   '#9BA0B0',
  amberBg:     '#FFFBEB',
  amberBorder: '#F59E0B',
  amberText:   '#92400E',
  radius:      4,
  ff:          'Open Sans, sans-serif',
};

// ── Icons ─────────────────────────────────────────────────────────────────────
function SearchIcon({ color = T.textMuted }: { color?: string }) {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" style={{ color, flexShrink: 0 }}>
      <path d="M10 6.5a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Zm-.691 3.516a4.5 4.5 0 1 1 .707-.707l2.838 2.837a.5.5 0 0 1-.708.708L9.31 10.016Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd" />
    </svg>
  );
}

function OpenInNewIcon({ color = T.blue, size = 16 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M19 19H5V5h7V3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/>
    </svg>
  );
}

function XIcon({ size = 11 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 15 15" fill="none">
      <path d="M11.782 4.032a.575.575 0 1 0-.813-.813L7.5 6.687 4.031 3.22a.575.575 0 0 0-.813.813L6.687 7.5l-3.469 3.468a.575.575 0 0 0 .813.813L7.5 8.313l3.469 3.468a.575.575 0 0 0 .813-.813L8.313 7.5l3.469-3.468Z" fill="currentColor" />
    </svg>
  );
}

// Jolt-style close icon — matches list-close weight/proportion
function DrawerCloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 15 15" fill="none">
      <path d="M6.158 3.135a.5.5 0 0 1 .707.023l3.75 4a.5.5 0 0 1 0 .684l-3.75 4a.5.5 0 0 1-.73-.684L9.565 7.5 6.135 3.842a.5.5 0 0 1-.023-.707Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd" />
    </svg>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function filterChipLabel(f: ActiveFilter): string {
  const attr = ATTR_DEFS.find(a => a.id === f.attrId);
  if (!attr) return '';
  const vals = f.values.map(v => {
    if (v === '__all__') return 'Any value';
    if (v === '__unset__') return 'Not set';
    if (attr.valueType === 'Boolean') return v === 'true' ? 'Yes' : 'No';
    return v;
  });
  return `${attr.name}: ${vals.join(', ')}`;
}

// ── Stat card ─────────────────────────────────────────────────────────────────
// variant: 'default' | 'blue' | 'amber'
function StatCard({ label, value, onClick, active, variant = 'default' }: {
  label: string; value: number | string; onClick?: () => void; active?: boolean; variant?: 'default' | 'blue' | 'amber';
}) {
  const [hov, setHov] = useState(false);
  const isAmber = variant === 'amber';
  const isBlue = variant === 'blue';

  const bg = isAmber ? T.amberBg : isBlue ? T.blueBg : active ? T.blueBg : hov && onClick ? '#F5FAFE' : '#fff';
  const borderColor = isAmber ? T.amberBorder : isBlue ? T.blue : active ? T.blue : T.border;
  const numColor = isAmber ? T.amberText : isBlue ? T.blue : active ? T.blue : T.textStrong;
  const labelColor = isAmber ? T.amberText : isBlue ? T.blue : T.textMuted;

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: active && !isAmber && !isBlue ? T.blueBg : bg,
        border: `1px solid ${active && !isAmber && !isBlue ? T.blue : borderColor}`,
        borderRadius: T.radius,
        padding: '12px 18px',
        cursor: onClick ? 'pointer' : 'default',
        minWidth: 140,
        transition: 'all 0.15s',
        userSelect: 'none' as const,
        opacity: isBlue && value === 0 ? 0.5 : 1,
      }}
    >
      <div style={{ fontSize: 28, fontWeight: 700, color: active && !isAmber && !isBlue ? T.blue : numColor, lineHeight: 1 }}>
        {value}
      </div>
      <div style={{ fontSize: 12, color: active && !isAmber && !isBlue ? T.blue : labelColor, marginTop: 5, fontWeight: 500 }}>{label}</div>
    </div>
  );
}

// ── Clear button — matches Jolt type-link color-blue style ───────────────────
function ClearButton({ onClick }: { onClick: () => void }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: hov ? T.blueBg : 'none',
        border: 'none',
        borderRadius: T.radius,
        cursor: 'pointer',
        fontSize: 14,
        fontWeight: 400,
        color: '#1358A0',
        fontFamily: T.ff,
        textTransform: 'uppercase',
        letterSpacing: '1.25px',
        padding: '4px 12px',
        height: 36,
        transition: 'background 0.15s',
        whiteSpace: 'nowrap',
      }}
    >
      CLEAR
    </button>
  );
}

// ── Filter drawer ─────────────────────────────────────────────────────────────
function FilterDrawer({ open, pendingFilters, setPendingFilters, matchCount, onApply, onClose }: {
  open: boolean;
  pendingFilters: ActiveFilter[];
  setPendingFilters: (f: ActiveFilter[]) => void;
  matchCount: number;
  onApply: () => void;
  onClose: () => void;
}) {
  const [attrSearch, setAttrSearch] = useState('');
  const [attrFocused, setAttrFocused] = useState(false);
  const [selectedAttrId, setSelectedAttrId] = useState<string | null>(null);

  // Reset selection state every time the drawer opens
  useEffect(() => {
    if (open) {
      setSelectedAttrId(null);
      setAttrSearch('');
    }
  }, [open]);

  const filteredAttrs = useMemo(() =>
    ATTR_DEFS.filter(a => a.name.toLowerCase().includes(attrSearch.toLowerCase())),
    [attrSearch]
  );
  const selectedAttr = ATTR_DEFS.find(a => a.id === selectedAttrId) ?? null;
  const hasFilters = pendingFilters.some(f => f.values.length > 0);

  function getPending(attrId: string) {
    return pendingFilters.find(f => f.attrId === attrId)?.values ?? [];
  }

  function toggleValue(attrId: string, val: string) {
    const cur = getPending(attrId);
    let next: string[];
    if (val === '__all__' || val === '__unset__') {
      next = cur.includes(val) ? [] : [val];
    } else {
      const without = cur.filter(v => v !== '__all__' && v !== '__unset__');
      next = without.includes(val) ? without.filter(v => v !== val) : [...without, val];
    }
    setPendingFilters([
      ...pendingFilters.filter(f => f.attrId !== attrId),
      ...(next.length > 0 ? [{ attrId, values: next }] : []),
    ]);
  }

  function getValueOptions(attr: AttrDef) {
    const opts: { label: string; val: string }[] = [
      { label: 'Any value', val: '__all__' },
      { label: 'Not set', val: '__unset__' },
    ];
    if (attr.valueType === 'Boolean') {
      opts.push({ label: 'Yes', val: 'true' }, { label: 'No', val: 'false' });
    } else {
      (attr.enumValues ?? []).forEach(v => opts.push({ label: v, val: v }));
    }
    return opts;
  }

  const pendingCount = pendingFilters.reduce((n, f) => n + f.values.length, 0);

  // Shared header row height for alignment
  const HEADER_ROW_H = 52;

  return (
    <>
      {open && <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 40, background: 'rgba(0,0,0,0.18)' }} />}
      <div style={{
        position: 'fixed', top: 0, right: 0, width: 600, height: '100vh',
        background: '#fff', borderLeft: `1px solid ${T.borderLight}`, zIndex: 50,
        display: 'flex', flexDirection: 'column',
        transform: open ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.22s cubic-bezier(0.4,0,0.2,1)',
        boxShadow: '-4px 0 24px rgba(0,0,0,0.08)',
        fontFamily: T.ff,
      }}>

        {/* Header — close left, title, buttons right */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0 20px', height: 72, borderBottom: `1px solid ${T.borderLight}`, flexShrink: 0 }}>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#1C1C1C', display: 'flex', alignItems: 'center', padding: 4, flexShrink: 0 }}>
            <DrawerCloseIcon />
          </button>
          <span style={{ fontSize: 20, fontWeight: 700, color: '#555555', letterSpacing: '0.25px', flex: 1 }}>
            Filter by Attribute
          </span>
          {/* Buttons on right */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button
              onClick={() => setPendingFilters([])}
              style={{ background: '#fff', border: `1px solid ${T.blue}`, borderRadius: T.radius, padding: '7px 14px', fontSize: 14, fontWeight: 400, color: T.blue, fontFamily: T.ff, cursor: 'pointer', whiteSpace: 'nowrap' }}
            >
              CLEAR ALL
            </button>
            <button
              onClick={onApply}
              style={{ background: T.blue, color: '#fff', border: 'none', borderRadius: T.radius, padding: '7px 14px', fontSize: 14, fontWeight: 400, fontFamily: T.ff, cursor: 'pointer', whiteSpace: 'nowrap' }}
            >
              {'APPLY' + (pendingCount > 0 ? ` (${pendingCount})` : '')}
            </button>
          </div>
        </div>

        {/* Mini stat card — 0 Selected when no pending filters, match count when active */}
        <div style={{ padding: '12px 20px', borderBottom: `1px solid ${T.borderLight}`, flexShrink: 0 }}>
          <div style={{
            display: 'inline-flex', flexDirection: 'column',
            background: hasFilters ? T.blueBg : '#fff',
            border: `1px solid ${hasFilters ? T.blue : T.border}`,
            borderRadius: T.radius, padding: '8px 16px',
            transition: 'all 0.15s',
            minWidth: 120,
            opacity: hasFilters ? 1 : 0.5,
          }}>
            <span style={{ fontSize: 22, fontWeight: 700, color: hasFilters ? T.blue : T.textStrong, lineHeight: 1 }}>{hasFilters ? matchCount : 0}</span>
            <span style={{ fontSize: 11, fontWeight: 500, color: hasFilters ? T.blue : T.textMuted, marginTop: 4 }}>Selected</span>
          </div>
        </div>

        {/* Two-panel body */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

          {/* Left — attribute list */}
          <div style={{ width: 260, borderRight: `1px solid ${T.borderLight}`, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Search header — fixed height matches value panel header */}
            <div style={{ height: HEADER_ROW_H, display: 'flex', alignItems: 'center', padding: '0 12px', borderBottom: `1px solid ${T.borderLight}`, flexShrink: 0 }}>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center', width: '100%' }}>
                <div style={{ position: 'absolute', left: 8, pointerEvents: 'none', display: 'flex', alignItems: 'center' }}>
                  <SearchIcon color={attrFocused ? T.blue : T.textMuted} />
                </div>
                <input
                  placeholder="Search attributes…"
                  value={attrSearch}
                  onChange={e => setAttrSearch(e.target.value)}
                  onFocus={() => setAttrFocused(true)}
                  onBlur={() => setAttrFocused(false)}
                  style={{ width: '100%', border: `1px solid ${attrFocused ? T.blue : T.border}`, borderRadius: T.radius, padding: '6px 8px 6px 28px', fontSize: 13, fontFamily: T.ff, outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.15s' }}
                />
              </div>
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {filteredAttrs.map(attr => {
                const pending = getPending(attr.id);
                const isSel = selectedAttrId === attr.id;
                const hasVals = pending.length > 0;
                return (
                  <div key={attr.id}
                    onClick={() => setSelectedAttrId(isSel ? null : attr.id)}
                    style={{ padding: '9px 14px', cursor: 'pointer', background: isSel ? T.blueBg : hasVals ? '#F0FDF4' : '#fff', borderBottom: `1px solid ${T.borderLight}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}
                    onMouseEnter={e => { if (!isSel) e.currentTarget.style.background = '#F9FAFB'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = isSel ? T.blueBg : hasVals ? '#F0FDF4' : '#fff'; }}
                  >
                    <span style={{ fontSize: 13, color: T.textStrong }}>{attr.name}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {hasVals && <span style={{ fontSize: 11, background: T.blue, color: '#fff', borderRadius: 10, padding: '1px 6px', fontWeight: 700 }}>{pending.length}</span>}
                      <span style={{ color: T.borderLight }}><ChevronRightIcon /></span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right — value picker with light blue background */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: selectedAttr ? T.blueBg : '#fff' }}>
            {selectedAttr ? (
              <>
                {/* Value panel header — same height as attr search header */}
                <div style={{ height: HEADER_ROW_H, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', borderBottom: `1px solid ${T.borderLight}`, flexShrink: 0, background: '#fff' }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: T.textStrong }}>{selectedAttr.name}</span>
                  {getPending(selectedAttr.id).length > 0 && (
                    <ClearButton onClick={() => setPendingFilters(pendingFilters.filter(f => f.attrId !== selectedAttr.id))} />
                  )}
                </div>
                <div style={{ flex: 1, overflowY: 'auto' }}>
                  {getValueOptions(selectedAttr).map(({ label, val }) => {
                    const checked = getPending(selectedAttr.id).includes(val);
                    return (
                      <div key={val}
                        onClick={() => toggleValue(selectedAttr.id, val)}
                        style={{ padding: '9px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, borderBottom: `1px solid ${T.borderLight}`, background: 'transparent' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#D6EDFF'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <div style={{ width: 15, height: 15, borderRadius: 3, border: checked ? 'none' : `1.5px solid ${T.border}`, background: checked ? T.blue : '#fff', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {checked && <svg width="9" height="9" viewBox="0 0 10 10" fill="none"><path d="M1.5 5l2.5 2.5 5-5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                        </div>
                        <span style={{ fontSize: 13, color: val === '__unset__' ? T.textMuted : T.textStrong, fontStyle: val === '__unset__' ? 'italic' : 'normal' }}>{label}</span>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.textMuted, fontSize: 13 }}>
                Select an attribute to filter the list
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}


// ── Jolt-style custom select ──────────────────────────────────────────────────
function JoltSelect({ value, options, onChange }: {
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  const displayVal = value || '— Not set —';
  const isPlaceholder = !value;

  return (
    <div ref={ref} style={{ position: 'relative', minWidth: 180 }}>
      <div
        onClick={() => setOpen(v => !v)}
        style={{
          border: `1px solid ${open ? T.blue : T.border}`,
          borderRadius: T.radius,
          background: '#fff',
          padding: '8px 32px 8px 12px',
          fontSize: 14,
          color: isPlaceholder ? T.textMuted : T.textBody,
          cursor: 'pointer',
          userSelect: 'none',
          position: 'relative',
          transition: 'border-color 0.15s',
          fontFamily: T.ff,
          minHeight: 38,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        {displayVal}
        {/* Chevron */}
        <div style={{ position: 'absolute', right: 10, top: '50%', transform: `translateY(-50%) rotate(${open ? 180 : 0}deg)`, transition: 'transform 0.15s', color: T.textMuted, display: 'flex', alignItems: 'center' }}>
          <svg width="12" height="12" viewBox="0 0 15 15" fill="none">
            <path d="M3.135 6.158a.5.5 0 0 1 .707-.023L7.5 9.565l3.658-3.43a.5.5 0 0 1 .684.73l-4 3.75a.5.5 0 0 1-.684 0l-4-3.75a.5.5 0 0 1-.023-.707Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"/>
          </svg>
        </div>
      </div>
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 2px)', left: 0, right: 0, zIndex: 100,
          background: '#fff', border: `1px solid ${T.border}`, borderRadius: T.radius,
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)', overflow: 'hidden', maxHeight: 220, overflowY: 'auto',
        }}>
          <div
            onClick={() => { onChange(''); setOpen(false); }}
            style={{ padding: '8px 12px', fontSize: 14, color: T.textMuted, cursor: 'pointer', fontStyle: 'italic', fontFamily: T.ff, borderBottom: `1px solid ${T.borderLight}` }}
            onMouseEnter={e => e.currentTarget.style.background = '#F9FAFB'}
            onMouseLeave={e => e.currentTarget.style.background = ''}
          >
            — Not set —
          </div>
          {options.map(opt => (
            <div
              key={opt}
              onClick={() => { onChange(opt); setOpen(false); }}
              style={{ padding: '8px 12px', fontSize: 14, color: value === opt ? T.blue : T.textBody, background: value === opt ? T.blueBg : '#fff', cursor: 'pointer', fontFamily: T.ff, display: 'flex', alignItems: 'center', gap: 8 }}
              onMouseEnter={e => { if (value !== opt) e.currentTarget.style.background = '#F9FAFB'; }}
              onMouseLeave={e => { if (value !== opt) e.currentTarget.style.background = ''; }}
            >
              {value === opt && (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M1 6l3.5 3.5L11 2" stroke={T.blue} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
              )}
              {value !== opt && <span style={{ width: 12 }} />}
              {opt}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Location header kebab menu ────────────────────────────────────────────────
function LocationHeaderKebab({ location }: { location: Location }) {
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
    <div ref={ref} style={{ position: 'relative', flexShrink: 0 }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          background: open ? '#F3F3F4' : 'none',
          border: 'none', cursor: 'pointer',
          color: T.textMuted,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: 32, height: 32, borderRadius: T.radius,
          transition: 'background 0.15s',
          padding: 0,
        }}
        onMouseEnter={e => { if (!open) e.currentTarget.style.background = '#F3F3F4'; }}
        onMouseLeave={e => { if (!open) e.currentTarget.style.background = 'none'; }}
      >
        {/* Vertical kebab ⋮ */}
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="5" r="1.5"/>
          <circle cx="12" cy="12" r="1.5"/>
          <circle cx="12" cy="19" r="1.5"/>
        </svg>
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: 36, right: 0, width: 172,
          background: '#fff', border: `1px solid ${T.borderLight}`,
          borderRadius: T.radius,
          boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
          zIndex: 60, overflow: 'hidden',
        }}>
          <a
            href={`#/admin/locations/${location.id}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setOpen(false)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 14px',
              fontSize: 13, color: T.textStrong,
              textDecoration: 'none', fontFamily: T.ff,
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#F9FAFB'}
            onMouseLeave={e => e.currentTarget.style.background = ''}
          >
            <OpenInNewIcon color={T.textMuted} size={14} />
            Edit location
          </a>
        </div>
      )}
    </div>
  );
}

// ── Location edit drawer ──────────────────────────────────────────────────────
function LocationEditDrawer({ location, attrValues, onClose, onSave }: {
  location: Location | null;
  attrValues: Record<string, LocationAttrValues>;
  onClose: () => void;
  onSave: (locId: string, attrId: string, value: string | undefined) => void;
}) {
  const [search, setSearch] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [savedFlash, setSavedFlash] = useState<string | null>(null);
  const open = location !== null;

  useEffect(() => { if (!open) setSearch(''); }, [open]);
  useEffect(() => {
    const handle = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handle);
    return () => document.removeEventListener('keydown', handle);
  }, [onClose]);

  if (!location) return null;

  const vals = attrValues[location.id] ?? {};
  const q = search.toLowerCase();
  const unsetAttrs = ATTR_DEFS.filter(a => vals[a.id] === undefined && a.name.toLowerCase().includes(q));
  const setAttrs = ATTR_DEFS.filter(a => vals[a.id] !== undefined && a.name.toLowerCase().includes(q));

  function handleChange(attrId: string, newVal: string) {
    onSave(location!.id, attrId, newVal || undefined);
    setSavedFlash(attrId);
    setTimeout(() => setSavedFlash(null), 1200);
  }

  function renderControl(attr: AttrDef) {
    const cur = vals[attr.id];
    if (attr.valueType === 'Boolean') {
      return (
        <div style={{ display: 'flex', gap: 6 }}>
          {['true', 'false'].map(v => (
            <button key={v} onClick={() => handleChange(attr.id, cur === v ? '' : v)} style={{
              padding: '5px 14px', borderRadius: T.radius, fontSize: 13, fontWeight: 400,
              border: `1px solid ${cur === v ? T.blue : T.border}`,
              background: cur === v ? T.blueBg : '#fff',
              color: cur === v ? T.blue : T.textBody,
              cursor: 'pointer', fontFamily: T.ff, transition: 'all 0.1s',
            }}>
              {v === 'true' ? 'Yes' : 'No'}
            </button>
          ))}
          {cur !== undefined && (
            <button onClick={() => onSave(location!.id, attr.id, undefined)} style={{
              padding: '5px 10px', borderRadius: T.radius, fontSize: 12,
              border: `1px solid ${T.border}`, background: '#fff',
              color: T.textMuted, cursor: 'pointer', fontFamily: T.ff,
            }}>
              Clear
            </button>
          )}
        </div>
      );
    }
    if (attr.enumValues) {
      return (
        <JoltSelect
          value={cur ?? ''}
          options={attr.enumValues}
          onChange={v => handleChange(attr.id, v)}
        />
      );
    }
    return null;
  }

  function AttrRow({ attr }: { attr: AttrDef }) {
    const flashing = savedFlash === attr.id;
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 24px', borderBottom: `1px solid ${T.borderLight}`, gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 400, color: T.textBody }}>{attr.name}</div>
          {flashing && <div style={{ fontSize: 11, color: T.green, marginTop: 2 }}>Saved</div>}
        </div>
        {renderControl(attr)}
      </div>
    );
  }

  const fullAddress = `${location.street}, ${location.city}, ${location.state} ${location.zip}`;

  return (
    <>
      {open && <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 40, background: 'rgba(0,0,0,0.18)' }} />}
      <div style={{
        position: 'fixed', top: 0, right: 0, width: 600, height: '100vh',
        background: '#fff', borderLeft: `1px solid ${T.borderLight}`, zIndex: 50,
        display: 'flex', flexDirection: 'column',
        transform: open ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.22s cubic-bezier(0.4,0,0.2,1)',
        boxShadow: '-4px 0 24px rgba(0,0,0,0.08)',
        fontFamily: T.ff,
      }}>
        {/* Header — close left, name center, external link right */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0 20px', height: 72, borderBottom: `1px solid ${T.borderLight}`, flexShrink: 0 }}>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#1C1C1C', display: 'flex', alignItems: 'center', padding: 4, flexShrink: 0 }}>
            <DrawerCloseIcon />
          </button>
          <span style={{ fontSize: 20, fontWeight: 700, color: '#555555', letterSpacing: '0.25px', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {location.name}
          </span>
          <LocationHeaderKebab location={location} />
        </div>

        {/* Location info — Store ID, Phone, Address */}
        <div style={{ padding: '14px 24px', borderBottom: `1px solid ${T.borderLight}`, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 16px', flexShrink: 0 }}>
          {[
            { label: 'STORE ID', value: location.storeId },
            { label: 'PHONE', value: location.phone },
          ].map(f => (
            <div key={f.label}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: T.textMuted, marginBottom: 3 }}>{f.label}</div>
              <div style={{ fontSize: 13, color: T.textStrong }}>{f.value}</div>
            </div>
          ))}
          {/* Address spans full width */}
          <div style={{ gridColumn: '1 / -1' }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: T.textMuted, marginBottom: 3 }}>ADDRESS</div>
            <div style={{ fontSize: 13, color: T.textStrong }}>{fullAddress}</div>
          </div>
        </div>

        {/* Attribute search with clear X */}
        <div style={{ padding: '10px 24px', borderBottom: `1px solid ${T.borderLight}`, flexShrink: 0 }}>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <div style={{ position: 'absolute', left: 9, pointerEvents: 'none', display: 'flex', alignItems: 'center' }}>
              <SearchIcon color={searchFocused ? T.blue : T.textMuted} />
            </div>
            <input
              placeholder="Search attributes…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              style={{ width: '100%', border: `1px solid ${searchFocused ? T.blue : T.border}`, borderRadius: T.radius, padding: '7px 30px 7px 28px', fontSize: 13, fontFamily: T.ff, outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.15s' }}
            />
            {search.length > 0 && (
              <button
                onClick={() => setSearch('')}
                style={{ position: 'absolute', right: 8, background: 'none', border: 'none', cursor: 'pointer', color: T.textMuted, display: 'flex', alignItems: 'center', padding: 2 }}
              >
                <XIcon size={13} />
              </button>
            )}
          </div>
        </div>

        {/* Attribute list */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {unsetAttrs.length > 0 && (
            <>
              <div style={{ padding: '7px 24px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: T.danger, background: T.dangerBg, borderBottom: `1px solid ${T.dangerBorder}` }}>
                Not set — {unsetAttrs.length} attribute{unsetAttrs.length !== 1 ? 's' : ''}
              </div>
              {unsetAttrs.map(attr => <AttrRow key={attr.id} attr={attr} />)}
            </>
          )}
          {setAttrs.length > 0 && (
            <>
              <div style={{ padding: '7px 24px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: T.textMuted, background: '#F9FAFB', borderBottom: `1px solid ${T.borderLight}` }}>
                Configured — {setAttrs.length} attribute{setAttrs.length !== 1 ? 's' : ''}
              </div>
              {setAttrs.map(attr => <AttrRow key={attr.id} attr={attr} />)}
            </>
          )}
        </div>
      </div>
    </>
  );
}



// ── Row action button ─────────────────────────────────────────────────────────
function RowOpenButton({ onClick }: { onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      style={{ height: 42, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
    >
      <OpenInNewIcon color={T.blue} size={19} />
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
const PAGE_SIZE = 15;
const COLS = '40px 100px 250px 320px 320px 1fr';

export default function LocationTagManagementPage() {
  const [search, setSearch] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>([]);
  const [pendingFilters, setPendingFilters] = useState<ActiveFilter[]>([]);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [editLocation, setEditLocation] = useState<Location | null>(null);
  const [attrValues, setAttrValues] = useState<Record<string, LocationAttrValues>>(ALL_ATTR_VALUES);
  const [currentPage, setCurrentPage] = useState(1);
  const [needsAttentionFilter, setNeedsAttentionFilter] = useState(false);
  const [filterBtnHov, setFilterBtnHov] = useState(false);
  const [resetBtnHov, setResetBtnHov] = useState(false);

  const needsAttentionCount = useMemo(() =>
    ALL_LOCATIONS.filter(l => NEEDS_ATTENTION_IDS.has(l.id)).length, []
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return ALL_LOCATIONS.filter(loc => {
      if (q) {
        const hay = `${loc.storeId} ${loc.name} ${loc.street} ${loc.city} ${loc.state} ${loc.zip} ${loc.phone}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (needsAttentionFilter && !NEEDS_ATTENTION_IDS.has(loc.id)) return false;
      for (const f of activeFilters) {
        const val = attrValues[loc.id]?.[f.attrId];
        if (f.values.includes('__unset__') && val === undefined) continue;
        if (f.values.includes('__all__') && val !== undefined) continue;
        if (!f.values.includes(val ?? '')) return false;
      }
      return true;
    });
  }, [search, activeFilters, attrValues, needsAttentionFilter]);

  const pendingMatchCount = useMemo(() =>
    ALL_LOCATIONS.filter(loc => {
      for (const f of pendingFilters) {
        const val = attrValues[loc.id]?.[f.attrId];
        if (f.values.includes('__unset__') && val === undefined) continue;
        if (f.values.includes('__all__') && val !== undefined) continue;
        if (!f.values.includes(val ?? '')) return false;
      }
      return true;
    }).length, [pendingFilters, attrValues]
  );

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageRows = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const hasFilters = activeFilters.length > 0 || needsAttentionFilter || search.trim().length > 0;
  const activeFilterCount = activeFilters.length;

  function openFilterDrawer() {
    setPendingFilters(activeFilters.map(f => ({ ...f, values: [...f.values] })));
    setFilterDrawerOpen(true);
  }

  function applyFilters() {
    setActiveFilters(pendingFilters.filter(f => f.values.length > 0));
    setFilterDrawerOpen(false);
    setCurrentPage(1);
  }

  function resetAllFilters() {
    setActiveFilters([]);
    setNeedsAttentionFilter(false);
    setSearch('');
    setCurrentPage(1);
  }

  function removeFilter(attrId: string) {
    setActiveFilters(prev => prev.filter(f => f.attrId !== attrId));
    setCurrentPage(1);
  }

  function handleAttrSave(locId: string, attrId: string, value: string | undefined) {
    setAttrValues(prev => {
      const locVals = { ...(prev[locId] ?? {}) };
      if (value === undefined) delete locVals[attrId];
      else locVals[attrId] = value;
      return { ...prev, [locId]: locVals };
    });
  }

  const attrBtnStyle: React.CSSProperties = {
    border: `1px solid ${activeFilterCount > 0 ? T.blue : T.border}`,
    borderRadius: T.radius,
    background: activeFilterCount > 0 ? T.blueBg : filterBtnHov ? '#F3F3F4' : '#fff',
    padding: '8px 16px',
    fontSize: 13, fontWeight: 500,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    cursor: 'pointer',
    color: activeFilterCount > 0 ? T.blue : T.textStrong,
    fontFamily: T.ff,
    whiteSpace: 'nowrap',
    transition: 'all 0.15s',
  };

  const resetBtnStyle: React.CSSProperties = {
    border: `1px solid ${T.border}`,
    borderRadius: T.radius,
    background: resetBtnHov ? '#F3F3F4' : '#fff',
    padding: '8px 16px',
    fontSize: 13, fontWeight: 500,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    cursor: 'pointer',
    color: T.textStrong,
    fontFamily: T.ff,
    whiteSpace: 'nowrap',
    transition: 'all 0.15s',
    display: 'block',
  };

  return (
    <div style={{ fontFamily: T.ff, color: T.textStrong, background: '#fff', margin: '-24px -32px', padding: '24px 32px', minHeight: '100vh' }}>

      {/* Top section: cards on left, buttons + pills on right */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 16 }}>
        <StatCard label="Locations" value={TOTAL} />
        <StatCard label="Selected" value={hasFilters ? filtered.length : 0} variant={hasFilters ? "blue" : "default"} />
        <StatCard
          label="Need Attention"
          value={needsAttentionCount}
          onClick={() => { setNeedsAttentionFilter(v => !v); setCurrentPage(1); }}
          active={needsAttentionFilter}
          variant="amber"
        />
        <div style={{ width: 12 }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={attrBtnStyle} onMouseEnter={() => setFilterBtnHov(true)} onMouseLeave={() => setFilterBtnHov(false)} onClick={openFilterDrawer}>
              {activeFilterCount > 0 ? `Attributes (${activeFilterCount})` : 'Attributes'}
            </button>
            <button style={resetBtnStyle} onMouseEnter={() => setResetBtnHov(true)} onMouseLeave={() => setResetBtnHov(false)} onClick={resetAllFilters}>
              Reset Filter
            </button>
          </div>
          {(needsAttentionFilter || activeFilters.length > 0) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              {needsAttentionFilter && (
                <span style={{ fontSize: 12, background: T.dangerBg, color: T.danger, border: `1px solid ${T.dangerBorder}`, borderRadius: 12, padding: '3px 10px', display: 'flex', alignItems: 'center', gap: 5 }}>
                  Need attention
                  <button onClick={() => { setNeedsAttentionFilter(false); setCurrentPage(1); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.danger, display: 'flex', padding: 0 }}><XIcon size={10} /></button>
                </span>
              )}
              {activeFilters.map(f => (
                <span key={f.attrId} style={{ fontSize: 12, background: T.blueBg, color: T.blue, border: `1px solid #19AAFA`, borderRadius: 12, padding: '3px 10px', display: 'flex', alignItems: 'center', gap: 5 }}>
                  {filterChipLabel(f)}
                  <button onClick={() => removeFilter(f.attrId)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.blue, display: 'flex', padding: 0 }}><XIcon size={10} /></button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Search bar */}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ position: 'absolute', left: 12, display: 'flex', alignItems: 'center', pointerEvents: 'none', zIndex: 1 }}>
          <SearchIcon color={searchFocused ? T.blue : T.textMuted} />
        </div>
        <input
          type="text"
          value={search}
          placeholder="Search locations"
          onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
          style={{
            width: '100%',
            border: `1px solid ${searchFocused ? T.blue : T.border}`,
            borderRadius: T.radius,
            padding: '10px 12px 10px 34px',
            fontSize: 13, fontFamily: T.ff, outline: 'none',
            color: T.textStrong, background: '#fff',
            transition: 'border-color 0.15s', boxSizing: 'border-box',
          }}
        />
      </div>

      {/* AG Grid-style table */}
      <div style={{ background: '#fff', border: `1px solid ${T.border}`, borderRadius: T.radius, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: COLS, background: '#F9F9F9', borderBottom: `1px solid ${T.border}` }}>
          <div style={{ height: 42, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRight: `1px solid ${T.border}`, background: '#F9F9F9' }}>
            <OpenInNewIcon color={T.textStrong} size={19} />
          </div>
          {['Store ID','Location Name','Street Address','City, ST, ZIP','Phone'].map((h, i) => (
            <div key={h} style={{ padding: '0 12px', height: 42, display: 'flex', alignItems: 'center', fontSize: 13, fontWeight: 700, color: '#3D4144', borderRight: i < 4 ? `1px solid ${T.border}` : 'none', whiteSpace: 'nowrap' }}>
              {h}
            </div>
          ))}
        </div>

        {pageRows.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: T.textMuted, fontSize: 13 }}>
            No locations match the current filters. Try adjusting or removing a filter.
          </div>
        ) : (
          pageRows.map((loc, idx) => {
            const attention = NEEDS_ATTENTION_IDS.has(loc.id);
            const isLast = idx === pageRows.length - 1;
            return (
              <div key={loc.id}
                style={{ display: 'grid', gridTemplateColumns: COLS, borderBottom: isLast ? 'none' : `1px solid ${T.borderLight}`, transition: 'background 0.1s' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#F9FAFB')}
                onMouseLeave={e => (e.currentTarget.style.background = '')}
              >
                <div style={{ height: 42, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRight: `1px solid ${T.borderLight}`, cursor: 'pointer' }}
                  onClick={() => setEditLocation(loc)}>
                  <OpenInNewIcon color={T.blue} size={19} />
                </div>
                <div style={{ padding: '0 12px', height: 42, display: 'flex', alignItems: 'center', fontSize: 14, color: T.textStrong, borderRight: `1px solid ${T.borderLight}`, overflow: 'hidden' }}>
                  {attention && <span style={{ width: 6, height: 6, borderRadius: '50%', background: T.danger, marginRight: 8, flexShrink: 0 }} />}
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{loc.storeId}</span>
                </div>
                <div style={{ padding: '0 12px', height: 42, display: 'flex', alignItems: 'center', fontSize: 14, color: T.textStrong, borderRight: `1px solid ${T.borderLight}`, overflow: 'hidden' }}>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{loc.name}</span>
                </div>
                <div style={{ padding: '0 12px', height: 42, display: 'flex', alignItems: 'center', fontSize: 14, color: T.textBody, borderRight: `1px solid ${T.borderLight}`, overflow: 'hidden' }}>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{loc.street}</span>
                </div>
                <div style={{ padding: '0 12px', height: 42, display: 'flex', alignItems: 'center', fontSize: 14, color: T.textBody, borderRight: `1px solid ${T.borderLight}`, overflow: 'hidden' }}>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{loc.city}, {loc.state} {loc.zip}</span>
                </div>
                <div style={{ padding: '0 12px', height: 42, display: 'flex', alignItems: 'center', fontSize: 14, color: T.textMuted, overflow: 'hidden' }}>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{loc.phone}</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, padding: '12px 0', fontSize: 13, color: T.textBody }}>
        <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
          style={{ border: 'none', background: 'none', fontFamily: T.ff, fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: currentPage === 1 ? T.borderLight : T.blue, cursor: currentPage === 1 ? 'default' : 'pointer' }}>
          Previous
        </button>
        <span>Page {currentPage} of {totalPages || 1}</span>
        <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages}
          style={{ border: 'none', background: 'none', fontFamily: T.ff, fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: currentPage >= totalPages ? T.borderLight : T.blue, cursor: currentPage >= totalPages ? 'default' : 'pointer' }}>
          Next
        </button>
      </div>

      <FilterDrawer
        open={filterDrawerOpen}
        pendingFilters={pendingFilters}
        setPendingFilters={setPendingFilters}
        matchCount={pendingMatchCount}
        onApply={applyFilters}
        onClose={() => setFilterDrawerOpen(false)}
      />
      <LocationEditDrawer
        location={editLocation}
        attrValues={attrValues}
        onClose={() => setEditLocation(null)}
        onSave={handleAttrSave}
      />
    </div>
  );
}
