import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';

// ── Jolt DS tokens ────────────────────────────────────────────────────────────
const DS = {
  blue:        '#1678C2',
  blueDark:    '#1358A0',
  blueLight:   '#E1F5FF',
  blueMid:     '#2C82BD',
  text:        '#181D1F',
  textBody:    '#555555',
  textMuted:   '#6B7280',
  textDisabled:'#9BA0B0',
  border:      '#DBDBDB',
  borderInput: '#BABABA',
  divider:     '#F3F3F4',
  bg:          '#F9FAFB',
  bgPage:      '#F3F4F6',
  white:       '#FFFFFF',
  green:       '#27B872',
  greenLight:  '#E8F8F0',
  amber:       '#F59E0B',
  amberLight:  '#FFFBEB',
  amberDark:   '#92400E',
  red:         '#E53935',
  redLight:    '#FEF2F2',
  redDark:     '#B91C1C',
  grey:        '#9BA0B0',
};

const FONT = 'Open Sans, sans-serif';

// ── Types ─────────────────────────────────────────────────────────────────────
type ModuleKey = 'operate' | 'label' | 'guard' | 'monitor' | 'schedule';
type LicenseState = 'assigned' | 'reserved' | 'unassigned';
type ExpiryState  = 'ok' | 'expiring-soon' | 'expired';
type LocationStatus = 'active' | 'inactive';

interface Module {
  key:           ModuleKey;
  name:          string;
  totalLicenses: number;
  assigned:      number;
  reserved:      number;
}

interface Location {
  id:       string;
  storeId:  string;
  name:     string;
  division: string;
  region:   string;
  district: string;
  status:   LocationStatus;
}

interface Assignment {
  licenseState: LicenseState;
  expiryDate:   string | null;
}

type AssignmentMap = Record<ModuleKey, Record<string, Assignment>>;

// ── Seed data helpers ─────────────────────────────────────────────────────────
function daysFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

const MODULES: Module[] = [
  { key: 'label',    name: 'Label',    totalLicenses: 20, assigned: 0,  reserved: 0 },
  { key: 'operate',  name: 'Operate',  totalLicenses: 20, assigned: 8,  reserved: 0 },
  { key: 'guard',    name: 'Guard',    totalLicenses: 10, assigned: 10, reserved: 0 },
  { key: 'schedule', name: 'Schedule', totalLicenses: 8,  assigned: 0,  reserved: 0 },
  { key: 'monitor',  name: 'Monitor',  totalLicenses: 15, assigned: 8,  reserved: 0 },
];

const LOCATIONS: Location[] = [
  // South — Texas
  { id: 'l01', storeId: '1042', name: 'Austin Downtown',           division: 'South', region: 'Texas',      district: 'Austin Metro',   status: 'active'   },
  { id: 'l02', storeId: '1087', name: 'Dallas Uptown',             division: 'South', region: 'Texas',      district: 'Dallas Metro',   status: 'active'   },
  { id: 'l03', storeId: '1101', name: 'Houston Midtown',           division: 'South', region: 'Texas',      district: 'Houston Metro',  status: 'active'   },
  { id: 'l04', storeId: '1203', name: 'San Antonio Riverwalk',     division: 'South', region: 'Texas',      district: 'SA Metro',       status: 'active'   },
  { id: 'l05', storeId: '1155', name: 'Frisco Legacy West',        division: 'South', region: 'Texas',      district: 'Dallas Metro',   status: 'inactive' },
  { id: 'l06', storeId: '1177', name: 'El Paso Eastside',          division: 'South', region: 'Texas',      district: 'El Paso',        status: 'active'   },
  // East — Southeast
  { id: 'l07', storeId: '2011', name: 'Atlanta Buckhead',          division: 'East',  region: 'Southeast',  district: 'Atlanta Metro',  status: 'active'   },
  { id: 'l08', storeId: '2034', name: 'Charlotte SouthPark',       division: 'East',  region: 'Southeast',  district: 'Carolinas',      status: 'active'   },
  { id: 'l09', storeId: '2056', name: 'Nashville Broadway',        division: 'East',  region: 'Southeast',  district: 'Tennessee',      status: 'active'   },
  { id: 'l10', storeId: '2099', name: 'Raleigh Downtown',          division: 'East',  region: 'Southeast',  district: 'Carolinas',      status: 'inactive' },
  // North — Midwest
  { id: 'l11', storeId: '3005', name: 'Chicago River North',       division: 'North', region: 'Midwest',    district: 'Chicago Metro',  status: 'active'   },
  { id: 'l12', storeId: '3019', name: 'Minneapolis Downtown',      division: 'North', region: 'Midwest',    district: 'Twin Cities',    status: 'active'   },
  { id: 'l13', storeId: '3044', name: 'Detroit Midtown',           division: 'North', region: 'Midwest',    district: 'Michigan',       status: 'active'   },
  { id: 'l14', storeId: '3088', name: 'Columbus Short North',      division: 'North', region: 'Midwest',    district: 'Ohio',           status: 'inactive' },
  { id: 'l15', storeId: '3101', name: 'Indianapolis Broad Ripple', division: 'North', region: 'Midwest',    district: 'Indiana',        status: 'active'   },
  // West — California
  { id: 'l16', storeId: '4001', name: 'Los Angeles Westside',      division: 'West',  region: 'California', district: 'LA Metro West',  status: 'active'   },
  { id: 'l17', storeId: '4022', name: 'San Francisco SOMA',        division: 'West',  region: 'California', district: 'Bay Area',       status: 'active'   },
  { id: 'l18', storeId: '4055', name: 'San Diego Gaslamp',         division: 'West',  region: 'California', district: 'San Diego',      status: 'active'   },
  // West — Pacific NW
  { id: 'l19', storeId: '4071', name: 'Portland Pearl',            division: 'West',  region: 'Pacific NW', district: 'Portland Metro', status: 'active'   },
  { id: 'l20', storeId: '4088', name: 'Seattle Capitol Hill',      division: 'West',  region: 'Pacific NW', district: 'Seattle Metro',  status: 'active'   },
];

function allUnassigned(): Record<string, Assignment> {
  return Object.fromEntries(LOCATIONS.map(l => [l.id, { licenseState: 'unassigned' as LicenseState, expiryDate: null }]));
}

const INITIAL_ASSIGNMENTS: AssignmentMap = {
  label:    allUnassigned(),
  schedule: allUnassigned(),
  operate: {
    ...allUnassigned(),
    l01: { licenseState: 'assigned', expiryDate: daysFromNow(25)  },
    l02: { licenseState: 'assigned', expiryDate: daysFromNow(25)  },
    l03: { licenseState: 'assigned', expiryDate: daysFromNow(365) },
    l04: { licenseState: 'assigned', expiryDate: daysFromNow(365) },
    l07: { licenseState: 'assigned', expiryDate: daysFromNow(25)  },
    l08: { licenseState: 'assigned', expiryDate: daysFromNow(365) },
    l09: { licenseState: 'assigned', expiryDate: daysFromNow(365) },
    l11: { licenseState: 'assigned', expiryDate: daysFromNow(25)  },
  },
  guard: {
    ...allUnassigned(),
    l01: { licenseState: 'assigned', expiryDate: daysFromNow(25) },
    l02: { licenseState: 'assigned', expiryDate: daysFromNow(25) },
    l03: { licenseState: 'assigned', expiryDate: daysFromNow(25) },
    l04: { licenseState: 'assigned', expiryDate: daysFromNow(25) },
    l05: { licenseState: 'assigned', expiryDate: daysFromNow(25) },
    l06: { licenseState: 'assigned', expiryDate: daysFromNow(25) },
    l07: { licenseState: 'assigned', expiryDate: daysFromNow(25) },
    l08: { licenseState: 'assigned', expiryDate: daysFromNow(25) },
    l09: { licenseState: 'assigned', expiryDate: daysFromNow(25) },
    l10: { licenseState: 'assigned', expiryDate: daysFromNow(25) },
  },
  monitor: {
    ...allUnassigned(),
    l03: { licenseState: 'assigned',   expiryDate: daysFromNow(365) },
    l04: { licenseState: 'assigned',   expiryDate: daysFromNow(365) },
    l08: { licenseState: 'assigned',   expiryDate: daysFromNow(365) },
    l09: { licenseState: 'assigned',   expiryDate: daysFromNow(365) },
    l11: { licenseState: 'assigned',   expiryDate: daysFromNow(25)  },
    l12: { licenseState: 'assigned',   expiryDate: daysFromNow(365) },
    l13: { licenseState: 'reserved',   expiryDate: daysFromNow(20)  },
    l14: { licenseState: 'reserved',   expiryDate: daysFromNow(-10) },
    l15: { licenseState: 'assigned',   expiryDate: daysFromNow(-5)  },
    l16: { licenseState: 'unassigned', expiryDate: null             },
    l17: { licenseState: 'assigned',   expiryDate: daysFromNow(365) },
  },
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatExpiry(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function daysUntil(iso: string | null): number | null {
  if (!iso) return null;
  const diff = new Date(iso).getTime() - Date.now();
  return Math.ceil(diff / 86400000);
}

function getExpiryState(expiryDate: string | null): ExpiryState {
  if (!expiryDate) return 'ok';
  const days = daysUntil(expiryDate);
  if (days === null) return 'ok';
  if (days < 0) return 'expired';
  if (days <= 30) return 'expiring-soon';
  return 'ok';
}

function getExpirationCounts(moduleKey: ModuleKey, assignments: AssignmentMap): { expiringCount: number; expiredCount: number } {
  const moduleAssignments = Object.values(assignments[moduleKey]);
  const expiringCount = moduleAssignments.filter(a =>
    a.licenseState === 'assigned' || a.licenseState === 'reserved'
      ? getExpiryState(a.expiryDate) === 'expiring-soon'
      : false
  ).length;
  const expiredCount = moduleAssignments.filter(a =>
    a.licenseState === 'assigned' || a.licenseState === 'reserved'
      ? getExpiryState(a.expiryDate) === 'expired'
      : false
  ).length;
  return { expiringCount, expiredCount };
}

// ── Icon primitives (inline SVG — no external dep) ───────────────────────────
function ChevronDownIcon({ size = 16, color = DS.textMuted }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" style={{ flexShrink: 0 }}>
      <path d="M5 7.5L10 12.5L15 7.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SearchIcon({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 15 15" fill="none" style={{ flexShrink: 0 }}>
      <path d="M10 6.5a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Zm-.691 3.516a4.5 4.5 0 1 1 .707-.707l2.838 2.837a.5.5 0 0 1-.708.708L9.31 10.016Z" fill={DS.textDisabled} fillRule="evenodd" clipRule="evenodd" />
    </svg>
  );
}

function XIcon({ size = 12, color = DS.textMuted }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 15 15" fill="none" style={{ flexShrink: 0 }}>
      <path d="M11.782 4.032a.575.575 0 1 0-.813-.813L7.5 6.687 4.031 3.22a.575.575 0 0 0-.813.813L6.687 7.5l-3.469 3.468a.575.575 0 0 0 .813.813L7.5 8.313l3.469 3.468a.575.575 0 0 0 .813-.813L8.313 7.5l3.469-3.468Z" fill={color} />
    </svg>
  );
}

function AlertIcon({ size = 14, color = DS.amber }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
      <path d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CheckIcon({ size = 12, color = DS.white }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0 }}>
      <path d="M2 6l3 3 5-5" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ModulesIcon({ size = 32, color = DS.textDisabled }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
      <rect x="3" y="3" width="7" height="7" rx="1" stroke={color} strokeWidth="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1" stroke={color} strokeWidth="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1" stroke={color} strokeWidth="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1" stroke={color} strokeWidth="1.5" />
    </svg>
  );
}

// ── Custom checkbox ───────────────────────────────────────────────────────────
function Checkbox({ checked, indeterminate = false, onChange }: { checked: boolean; indeterminate?: boolean; onChange: () => void }) {
  return (
    <div
      onClick={(e) => { e.stopPropagation(); onChange(); }}
      style={{
        width: 16, height: 16, borderRadius: 3, flexShrink: 0,
        border: `2px solid ${(checked || indeterminate) ? DS.blue : DS.borderInput}`,
        background: (checked || indeterminate) ? DS.blue : DS.white,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer',
      }}
    >
      {indeterminate
        ? <div style={{ width: 8, height: 2, background: DS.white, borderRadius: 1 }} />
        : checked
          ? <CheckIcon size={10} />
          : null
      }
    </div>
  );
}

// ── License state pill ────────────────────────────────────────────────────────
function StateIndicator({ licenseState, locationStatus, expiryState }: { licenseState: LicenseState; locationStatus: LocationStatus; expiryState: ExpiryState }) {
  let bg: string, textColor: string, border: string, label: string;

  if (licenseState === 'unassigned') {
    bg = DS.bg; textColor = DS.textDisabled; border = `1px solid ${DS.border}`; label = 'No license';
  } else if (expiryState === 'expiring-soon') {
    bg = DS.amberLight; textColor = DS.amberDark; border = '1px solid #FCD34D';
    label = licenseState === 'assigned' ? 'Assigned' : 'Reserved';
  } else if (expiryState === 'expired') {
    bg = DS.redLight; textColor = DS.redDark; border = '1px solid #FECACA';
    label = licenseState === 'assigned' ? 'Assigned' : 'Reserved';
  } else if (licenseState === 'assigned') {
    bg = DS.greenLight; textColor = DS.green; border = '1px solid #B7EDD4'; label = 'Assigned';
  } else {
    bg = DS.bg; textColor = DS.textMuted; border = `1px solid ${DS.border}`; label = 'Reserved';
  }

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', alignSelf: 'flex-start', background: bg, borderRadius: 10, padding: '2px 8px', border }}>
      <span style={{ fontSize: 11, fontWeight: 600, color: textColor, whiteSpace: 'nowrap' }}>{label}</span>
    </div>
  );
}

// ── Dropdown (single-level, multi-select) ─────────────────────────────────────
function FilterDropdown({ label, options, selected, onToggle, onClear }: {
  label: string;
  options: string[];
  selected: Set<string>;
  onToggle: (v: string) => void;
  onClear: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const activeCount = selected.size;

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          height: 34, padding: '0 10px',
          border: `1px solid ${activeCount > 0 ? DS.blue : DS.border}`,
          borderRadius: 4, background: activeCount > 0 ? DS.blueLight : DS.white,
          fontSize: 13, color: activeCount > 0 ? DS.blue : DS.textBody,
          cursor: 'pointer', fontFamily: FONT, whiteSpace: 'nowrap',
        }}
        onMouseEnter={e => { if (!activeCount) (e.currentTarget as HTMLButtonElement).style.background = DS.bg; }}
        onMouseLeave={e => { if (!activeCount) (e.currentTarget as HTMLButtonElement).style.background = DS.white; }}
      >
        {label}
        {activeCount > 0 && (
          <span style={{ background: DS.blue, color: DS.white, borderRadius: 10, fontSize: 10, fontWeight: 700, padding: '1px 6px' }}>{activeCount}</span>
        )}
        <ChevronDownIcon size={14} color={activeCount > 0 ? DS.blue : DS.textMuted} />
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, zIndex: 40,
          background: DS.white, border: `1px solid ${DS.border}`, borderRadius: 4,
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)', minWidth: 180, padding: '6px 0',
        }}>
          {options.map(opt => (
            <div
              key={opt}
              onMouseDown={() => onToggle(opt)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '7px 12px', cursor: 'pointer', fontSize: 13,
                color: DS.textBody, background: DS.white,
              }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = DS.bg}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = DS.white}
            >
              <Checkbox checked={selected.has(opt)} onChange={() => onToggle(opt)} />
              {opt}
            </div>
          ))}
          <div style={{ borderTop: `1px solid ${DS.divider}`, margin: '4px 0' }} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 12px' }}>
            {activeCount > 0 ? (
              <span
                onMouseDown={onClear}
                style={{ fontSize: 12, color: DS.blue, cursor: 'pointer', fontWeight: 600 }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = '0.75'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = '1'}
              >
                Clear
              </span>
            ) : (
              <span />
            )}
            <button
              onMouseDown={() => setOpen(false)}
              style={{
                background: 'none', border: 'none', color: DS.blue, fontSize: 12, fontWeight: 600,
                cursor: 'pointer', padding: '4px 8px', borderRadius: 4, fontFamily: FONT,
              }}
              onMouseEnter={e => (e.currentTarget.style.background = DS.blueLight)}
              onMouseLeave={e => (e.currentTarget.style.background = 'none')}
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Location status + license state filter dropdown ───────────────────────────
function StatusFilterDropdown({ counts, selected, onToggle, locationStatusCounts, selectedLocationStatus, onToggleLocationStatus, onClear }: {
  counts: Record<LicenseState, number>;
  selected: Set<LicenseState>;
  onToggle: (v: LicenseState) => void;
  locationStatusCounts: Record<LocationStatus, number>;
  selectedLocationStatus: Set<LocationStatus>;
  onToggleLocationStatus: (v: LocationStatus) => void;
  onClear: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const activeCount = selected.size + selectedLocationStatus.size;

  const licenseOptions: Array<{ key: LicenseState; label: string }> = [
    { key: 'assigned',   label: 'Assigned'   },
    { key: 'reserved',   label: 'Reserved'   },
    { key: 'unassigned', label: 'No license' },
  ];

  const locationStatusOptions: Array<{ key: LocationStatus; label: string }> = [
    { key: 'active',   label: 'Active'   },
    { key: 'inactive', label: 'Inactive' },
  ];

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          height: 34, padding: '0 10px',
          border: `1px solid ${activeCount > 0 ? DS.blue : DS.border}`,
          borderRadius: 4, background: activeCount > 0 ? DS.blueLight : DS.white,
          fontSize: 13, color: activeCount > 0 ? DS.blue : DS.textBody,
          cursor: 'pointer', fontFamily: FONT, whiteSpace: 'nowrap',
        }}
        onMouseEnter={e => { if (!activeCount) (e.currentTarget as HTMLButtonElement).style.background = DS.bg; }}
        onMouseLeave={e => { if (!activeCount) (e.currentTarget as HTMLButtonElement).style.background = DS.white; }}
      >
        Location Status
        {activeCount > 0 && (
          <span style={{ background: DS.blue, color: DS.white, borderRadius: 10, fontSize: 10, fontWeight: 700, padding: '1px 6px' }}>{activeCount}</span>
        )}
        <ChevronDownIcon size={14} color={activeCount > 0 ? DS.blue : DS.textMuted} />
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', right: 0, zIndex: 40,
          background: DS.white, border: `1px solid ${DS.border}`, borderRadius: 4,
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)', minWidth: 200, padding: '6px 0',
        }}>
          {locationStatusOptions.map(opt => {
            const count = locationStatusCounts[opt.key];
            const isZero = count === 0;
            return (
              <div
                key={opt.key}
                onMouseDown={() => onToggleLocationStatus(opt.key)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '7px 12px', cursor: 'pointer', fontSize: 13,
                  color: isZero ? DS.textDisabled : DS.textBody, background: DS.white,
                }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = DS.bg}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = DS.white}
              >
                <Checkbox checked={selectedLocationStatus.has(opt.key)} onChange={() => onToggleLocationStatus(opt.key)} />
                <span>{opt.label}</span>
                <span style={{ marginLeft: 'auto', fontSize: 11, color: isZero ? DS.textDisabled : DS.textMuted }}>({count})</span>
              </div>
            );
          })}
          <div style={{ borderTop: `1px solid ${DS.divider}`, margin: '4px 0' }} />
          {licenseOptions.map(opt => {
            const count = counts[opt.key];
            const isZero = count === 0;
            return (
              <div
                key={opt.key}
                onMouseDown={() => onToggle(opt.key)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '7px 12px', cursor: 'pointer', fontSize: 13,
                  color: isZero ? DS.textDisabled : DS.textBody, background: DS.white,
                }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = DS.bg}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = DS.white}
              >
                <Checkbox checked={selected.has(opt.key)} onChange={() => onToggle(opt.key)} />
                <span>{opt.label}</span>
                <span style={{ marginLeft: 'auto', fontSize: 11, color: isZero ? DS.textDisabled : DS.textMuted }}>({count})</span>
              </div>
            );
          })}
          <div style={{ borderTop: `1px solid ${DS.divider}`, margin: '4px 0' }} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 12px' }}>
            {activeCount > 0 ? (
              <span
                onMouseDown={onClear}
                style={{ fontSize: 12, color: DS.blue, cursor: 'pointer', fontWeight: 600 }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = '0.75'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = '1'}
              >
                Clear
              </span>
            ) : (
              <span />
            )}
            <button
              onMouseDown={() => setOpen(false)}
              style={{
                background: 'none', border: 'none', color: DS.blue, fontSize: 12, fontWeight: 600,
                cursor: 'pointer', padding: '4px 8px', borderRadius: 4, fontFamily: FONT,
              }}
              onMouseEnter={e => (e.currentTarget.style.background = DS.blueLight)}
              onMouseLeave={e => (e.currentTarget.style.background = 'none')}
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Module selector card ──────────────────────────────────────────────────────
function ModuleCard({ module, liveAssigned, liveReserved, expiringCount, expiredCount, isActive, onClick }: {
  module: Module;
  liveAssigned: number;
  liveReserved: number;
  expiringCount: number;
  expiredCount: number;
  isActive: boolean;
  onClick: () => void;
}) {
  const { totalLicenses } = module;
  const usedLicenses = liveAssigned + liveReserved;
  const isFullyAssigned = liveAssigned === totalLicenses;
  const pctAssigned = totalLicenses > 0 ? Math.min(100, Math.round((liveAssigned / totalLicenses) * 100)) : 0;
  const hasBadges = expiredCount > 0 || expiringCount > 0;

  return (
    <div
      onClick={onClick}
      style={{
        flex: '1 1 120px', minWidth: 120, maxWidth: 180, minHeight: 120,
        border: `2px solid ${isActive ? DS.blue : DS.border}`,
        borderRadius: 4, background: isActive ? DS.blueLight : DS.white,
        padding: '10px 12px', cursor: 'pointer',
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        transition: 'border-color 0.15s, background 0.15s',
      }}
      onMouseEnter={e => { if (!isActive) { (e.currentTarget as HTMLElement).style.borderColor = DS.blueMid; (e.currentTarget as HTMLElement).style.background = DS.bg; } }}
      onMouseLeave={e => { if (!isActive) { (e.currentTarget as HTMLElement).style.borderColor = DS.border; (e.currentTarget as HTMLElement).style.background = DS.white; } }}
    >
      {/* Top section */}
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: isActive ? DS.blueDark : DS.text, marginBottom: 4 }}>{module.name}</div>
        <div style={{ fontSize: 11, color: DS.textMuted, marginBottom: 10 }}>
          {totalLicenses} licenses
        </div>

        <div style={{ height: 4, background: '#E5E7EB', borderRadius: 2, overflow: 'hidden', marginBottom: 6 }}>
          <div style={{
            height: '100%',
            width: `${pctAssigned}%`,
            background: isFullyAssigned ? DS.green : DS.blue,
            borderRadius: 2,
            transition: 'width 0.3s ease',
          }} />
        </div>

        {isFullyAssigned ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <CheckIcon size={11} color={DS.green} />
            <span style={{ fontSize: 11, color: DS.green, fontWeight: 600 }}>All licenses assigned</span>
          </div>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: DS.textMuted }}>
            <span>{pctAssigned}% assigned</span>
            <span>{totalLicenses - usedLicenses} left</span>
          </div>
        )}
      </div>

      {/* Bottom section — badges and CTA */}
      <div style={{ marginTop: 'auto', paddingTop: hasBadges || (!isActive && liveAssigned === 0) ? 8 : 0 }}>
        {expiredCount > 0 && (
          <div style={{ marginBottom: expiringCount > 0 ? 4 : 0, display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, borderRadius: 10, padding: '2px 8px', background: DS.redLight, color: DS.redDark, border: '1px solid #FECACA' }}>
            <AlertIcon size={10} color={DS.redDark} />
            {expiredCount} expired
          </div>
        )}
        {expiringCount > 0 && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, borderRadius: 10, padding: '2px 8px', background: DS.amberLight, color: DS.amberDark, border: '1px solid #FCD34D' }}>
            <AlertIcon size={10} color={DS.amberDark} />
            {expiringCount} expiring soon
          </div>
        )}
        {!isActive && liveAssigned === 0 && (
          <div style={{ fontSize: 11, color: DS.blue, fontWeight: 600, cursor: 'pointer' }}>
            Assign licenses →
          </div>
        )}
      </div>
    </div>
  );
}

// ── Pool status bar ───────────────────────────────────────────────────────────
function PoolStatusBar({ module, assignedCount, reservedCount, unassignedLicenses, unassignedInView, onAssignAll, onAssignByRule }: {
  module: Module;
  assignedCount: number;
  reservedCount: number;
  unassignedLicenses: number;
  unassignedInView: number;
  onAssignAll: () => void;
  onAssignByRule: () => void;
}) {
  const availableLicenses = unassignedLicenses;
  const canAssignAll = availableLicenses >= unassignedInView && unassignedInView > 0;

  return (
    <div style={{
      background: DS.white, border: `1px solid ${DS.border}`, borderRadius: 4,
      padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
        <PoolStat label="Licenses" value={module.totalLicenses} />
        <div style={{ width: 1, height: 32, background: DS.divider }} />
        <PoolStat label="Assigned"   value={assignedCount}      color={DS.blue} />
        <PoolStat label="Reserved"   value={reservedCount}      color={DS.textMuted} />
        <PoolStat label="Unassigned" value={unassignedLicenses} color={unassignedLicenses <= 0 ? DS.textDisabled : DS.green} />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <button
          onClick={canAssignAll ? onAssignAll : undefined}
          title={
            !canAssignAll && availableLicenses < unassignedInView
              ? `${availableLicenses} licenses available, ${unassignedInView} locations in view. Use location filters to assign in batches.`
              : !canAssignAll && unassignedInView === 0
              ? 'No unassigned locations in current view.'
              : undefined
          }
          style={{
            height: 34, padding: '0 16px', borderRadius: 4,
            border: !canAssignAll ? `1px solid ${DS.border}` : 'none',
            background: !canAssignAll ? DS.bg : DS.blue,
            color: !canAssignAll ? DS.textDisabled : DS.white,
            fontSize: 13, fontWeight: 600,
            cursor: !canAssignAll ? 'not-allowed' : 'pointer',
            fontFamily: FONT,
          }}
          onMouseEnter={e => { if (canAssignAll) e.currentTarget.style.background = DS.blueDark; }}
          onMouseLeave={e => { e.currentTarget.style.background = !canAssignAll ? DS.bg : DS.blue; }}
        >
          Assign licenses
        </button>
        <button
          onClick={onAssignByRule}
          style={{
            height: 34, padding: '0 12px', border: `1px solid ${DS.border}`, borderRadius: 4,
            background: DS.white, color: DS.textBody, fontSize: 13,
            cursor: 'pointer', fontFamily: FONT,
          }}
          onMouseEnter={e => (e.currentTarget.style.background = DS.bg)}
          onMouseLeave={e => (e.currentTarget.style.background = DS.white)}
        >
          Assign by rule
        </button>
      </div>
    </div>
  );
}

function PoolStat({ label, value, color = DS.text }: { label: string; value: number; color?: string }) {
  const displayColor = value === 0 ? DS.textDisabled : color;
  return (
    <div>
      <div style={{ fontSize: 20, fontWeight: 700, color: displayColor, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 11, color: DS.textMuted, marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>{label}</div>
    </div>
  );
}

// ── Row action button ─────────────────────────────────────────────────────────
function RowAction({ licenseState, poolExhausted, onAction }: { licenseState: LicenseState; poolExhausted: boolean; onAction: (action: 'assign' | 'unassign' | 'reserve') => void }) {
  if (licenseState === 'assigned') {
    return (
      <button
        onClick={() => onAction('unassign')}
        style={{ fontSize: 12, color: DS.textMuted, background: 'none', border: `1px solid ${DS.border}`, borderRadius: 4, padding: '3px 10px', cursor: 'pointer', fontFamily: FONT }}
        onMouseEnter={e => { (e.currentTarget.style.color = DS.red); (e.currentTarget.style.borderColor = DS.red); }}
        onMouseLeave={e => { (e.currentTarget.style.color = DS.textMuted); (e.currentTarget.style.borderColor = DS.border); }}
      >
        Unassign
      </button>
    );
  }
  if (licenseState === 'reserved') {
    return (
      <button
        onClick={() => onAction('unassign')}
        style={{ fontSize: 12, color: DS.textMuted, background: 'none', border: `1px solid ${DS.border}`, borderRadius: 4, padding: '3px 10px', cursor: 'pointer', fontFamily: FONT }}
        onMouseEnter={e => { (e.currentTarget.style.color = DS.red); (e.currentTarget.style.borderColor = DS.red); }}
        onMouseLeave={e => { (e.currentTarget.style.color = DS.textMuted); (e.currentTarget.style.borderColor = DS.border); }}
      >
        Unreserve
      </button>
    );
  }
  if (licenseState === 'unassigned') {
    if (poolExhausted) {
      return (
        <span style={{ fontSize: 12, color: DS.textDisabled, fontStyle: 'italic' }}>
          No licenses left
        </span>
      );
    }
    return (
      <button
        onClick={() => onAction('assign')}
        style={{ fontSize: 12, color: DS.blue, background: 'none', border: `1px solid ${DS.blue}`, borderRadius: 4, padding: '3px 10px', cursor: 'pointer', fontFamily: FONT }}
        onMouseEnter={e => { (e.currentTarget.style.background = DS.blueLight); }}
        onMouseLeave={e => { (e.currentTarget.style.background = 'none'); }}
      >
        Assign
      </button>
    );
  }
  return null;
}

// ── Bulk action bar ───────────────────────────────────────────────────────────
function BulkActionBar({ count, onAssign, onUnassign, onReserve, onClear }: {
  count: number;
  onAssign: () => void;
  onUnassign: () => void;
  onReserve: () => void;
  onClear: () => void;
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '8px 16px', background: DS.blueLight,
      border: `1px solid ${DS.blue}`, borderRadius: 4,
      marginBottom: 8,
    }}>
      <span style={{ fontSize: 13, fontWeight: 600, color: DS.blueDark }}>
        {count} location{count !== 1 ? 's' : ''} selected
      </span>
      <div style={{ display: 'flex', gap: 6 }}>
        <button onClick={onAssign} style={{ fontSize: 12, fontWeight: 600, color: DS.white, background: DS.blue, border: 'none', borderRadius: 4, padding: '4px 12px', cursor: 'pointer', fontFamily: FONT }}
          onMouseEnter={e => (e.currentTarget.style.background = DS.blueDark)}
          onMouseLeave={e => (e.currentTarget.style.background = DS.blue)}>
          Assign selected
        </button>
        <button onClick={onUnassign} style={{ fontSize: 12, color: DS.textBody, background: DS.white, border: `1px solid ${DS.border}`, borderRadius: 4, padding: '4px 12px', cursor: 'pointer', fontFamily: FONT }}
          onMouseEnter={e => (e.currentTarget.style.background = DS.bg)}
          onMouseLeave={e => (e.currentTarget.style.background = DS.white)}>
          Unassign selected
        </button>
        <button onClick={onReserve} style={{ fontSize: 12, color: DS.textBody, background: DS.white, border: `1px solid ${DS.border}`, borderRadius: 4, padding: '4px 12px', cursor: 'pointer', fontFamily: FONT }}
          onMouseEnter={e => (e.currentTarget.style.background = DS.bg)}
          onMouseLeave={e => (e.currentTarget.style.background = DS.white)}>
          Reserve selected
        </button>
      </div>
      <button onClick={onClear} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 4, color: DS.textMuted }}
        onMouseEnter={e => (e.currentTarget.style.color = DS.text)}
        onMouseLeave={e => (e.currentTarget.style.color = DS.textMuted)}>
        <XIcon size={14} />
      </button>
    </div>
  );
}

// ── Toast notification ────────────────────────────────────────────────────────
function Toast({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 4000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return createPortal(
    <div style={{
      position: 'fixed', bottom: 32, left: '50%', transform: 'translateX(-50%)',
      background: DS.text, color: DS.white, borderRadius: 4,
      padding: '10px 16px', fontSize: 13, fontWeight: 500,
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 100,
      display: 'flex', alignItems: 'center', gap: 12,
      fontFamily: FONT, whiteSpace: 'nowrap',
    }}>
      <span>{message}</span>
      <button
        onClick={onDismiss}
        style={{ background: 'none', border: 'none', color: DS.white, cursor: 'pointer', padding: 0, display: 'flex', opacity: 0.7 }}
        onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
        onMouseLeave={e => (e.currentTarget.style.opacity = '0.7')}
      >
        <XIcon size={14} color={DS.white} />
      </button>
    </div>,
    document.body
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function LicenseAssignmentPage() {
  const [activeModule, setActiveModule]     = useState<ModuleKey | null>(null);
  const [assignments, setAssignments]       = useState<AssignmentMap>(INITIAL_ASSIGNMENTS);
  const [toast, setToast]                   = useState<string | null>(null);
  const [selectedIds, setSelectedIds]       = useState<Set<string>>(new Set());
  const [search, setSearch]                       = useState('');
  const [statusFilter, setStatusFilter]           = useState<Set<LicenseState>>(new Set());
  const [locationStatusFilter, setLocationStatusFilter] = useState<Set<LocationStatus>>(new Set());
  const [divisionFilter, setDivisionFilter]       = useState<Set<string>>(new Set());
  const [regionFilter, setRegionFilter]     = useState<Set<string>>(new Set());
  const [districtFilter, setDistrictFilter] = useState<Set<string>>(new Set());

  const module = MODULES.find(m => m.key === activeModule) ?? null;

  useEffect(() => {
    if (activeModule) setSelectedIds(new Set());
  }, [activeModule]);

  // Filter options derived from static LOCATIONS list
  const divisions = useMemo(() => [...new Set(LOCATIONS.map(l => l.division))].sort(), []);
  const regions   = useMemo(() => {
    const base = LOCATIONS.filter(l => divisionFilter.size === 0 || divisionFilter.has(l.division));
    return [...new Set(base.map(l => l.region))].sort();
  }, [divisionFilter]);
  const districts = useMemo(() => {
    const base = LOCATIONS.filter(l =>
      (divisionFilter.size === 0 || divisionFilter.has(l.division)) &&
      (regionFilter.size === 0 || regionFilter.has(l.region))
    );
    return [...new Set(base.map(l => l.district))].sort();
  }, [divisionFilter, regionFilter]);

  // Shared base filter (search + hierarchy + locationStatus) used by both count memos
  const filteredBase = useMemo(() => {
    return LOCATIONS.filter(l => {
      const q = search.toLowerCase();
      const matchQ = !q || l.name.toLowerCase().includes(q) || l.storeId.includes(q);
      const matchDiv = divisionFilter.size === 0 || divisionFilter.has(l.division);
      const matchReg = regionFilter.size === 0 || regionFilter.has(l.region);
      const matchDist = districtFilter.size === 0 || districtFilter.has(l.district);
      const matchLocStatus = locationStatusFilter.size === 0 || locationStatusFilter.has(l.status);
      return matchQ && matchDiv && matchReg && matchDist && matchLocStatus;
    });
  }, [search, divisionFilter, regionFilter, districtFilter, locationStatusFilter]);

  // License state counts for dropdown (filtered by everything except license state)
  const stateCounts = useMemo((): Record<LicenseState, number> => {
    if (!activeModule) return { assigned: 0, reserved: 0, unassigned: 0 };
    const asgn = assignments[activeModule];
    return {
      assigned:   filteredBase.filter(l => asgn[l.id]?.licenseState === 'assigned').length,
      reserved:   filteredBase.filter(l => asgn[l.id]?.licenseState === 'reserved').length,
      unassigned: filteredBase.filter(l => (asgn[l.id]?.licenseState ?? 'unassigned') === 'unassigned').length,
    };
  }, [assignments, activeModule, filteredBase]);

  // Location status counts for dropdown (filtered by search + hierarchy only)
  const locationStatusCounts = useMemo((): Record<LocationStatus, number> => {
    const base = LOCATIONS.filter(l => {
      const q = search.toLowerCase();
      const matchQ = !q || l.name.toLowerCase().includes(q) || l.storeId.includes(q);
      const matchDiv = divisionFilter.size === 0 || divisionFilter.has(l.division);
      const matchReg = regionFilter.size === 0 || regionFilter.has(l.region);
      const matchDist = districtFilter.size === 0 || districtFilter.has(l.district);
      return matchQ && matchDiv && matchReg && matchDist;
    });
    return {
      active:   base.filter(l => l.status === 'active').length,
      inactive: base.filter(l => l.status === 'inactive').length,
    };
  }, [search, divisionFilter, regionFilter, districtFilter]);

  // Filtered list for Zone 4
  const filtered = useMemo(() => {
    if (!activeModule) return [];
    const asgn = assignments[activeModule];
    return filteredBase.filter(l => {
      const licenseState = asgn[l.id]?.licenseState ?? 'unassigned';
      return statusFilter.size === 0 || statusFilter.has(licenseState);
    });
  }, [assignments, activeModule, statusFilter, filteredBase]);

  // Checkbox state
  const allVisibleIds = filtered.map(l => l.id);
  const selectedVisible = allVisibleIds.filter(id => selectedIds.has(id));
  const allChecked = allVisibleIds.length > 0 && selectedVisible.length === allVisibleIds.length;
  const someChecked = selectedVisible.length > 0 && !allChecked;

  function toggleSelectAll() {
    if (allChecked) {
      setSelectedIds(prev => { const n = new Set(prev); allVisibleIds.forEach(id => n.delete(id)); return n; });
    } else {
      setSelectedIds(prev => { const n = new Set(prev); allVisibleIds.forEach(id => n.add(id)); return n; });
    }
  }

  function toggleSelectOne(id: string) {
    setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  // Live counts for active module
  const assignedCount      = activeModule ? Object.values(assignments[activeModule]).filter(a => a.licenseState === 'assigned').length : 0;
  const reservedCount      = activeModule ? Object.values(assignments[activeModule]).filter(a => a.licenseState === 'reserved').length : 0;
  const unassignedLicenses = module ? module.totalLicenses - assignedCount - reservedCount : 0;

  const unassignedInView = activeModule
    ? filtered.filter(l => (assignments[activeModule]?.[l.id]?.licenseState ?? 'unassigned') === 'unassigned').length
    : 0;

  // Row-level action
  function handleRowAction(id: string, action: 'assign' | 'unassign' | 'reserve') {
    if (!activeModule) return;
    setAssignments(prev => ({
      ...prev,
      [activeModule]: {
        ...prev[activeModule],
        [id]: action === 'assign'
          ? { licenseState: 'assigned',   expiryDate: daysFromNow(365) }
          : action === 'unassign'
          ? { licenseState: 'unassigned', expiryDate: null }
          : { licenseState: 'reserved',   expiryDate: daysFromNow(365) },
      },
    }));
  }

  // Bulk actions
  function handleBulkAssign() {
    if (!activeModule) return;
    const justAssigned = selectedIds.size;
    setAssignments(prev => {
      const updated = { ...prev[activeModule] };
      selectedIds.forEach(id => { updated[id] = { licenseState: 'assigned', expiryDate: daysFromNow(365) }; });
      return { ...prev, [activeModule]: updated };
    });
    setSelectedIds(new Set());
    setToast(`${justAssigned} license${justAssigned !== 1 ? 's' : ''} assigned. Change your filter to view them.`);
  }
  function handleBulkUnassign() {
    if (!activeModule) return;
    setAssignments(prev => {
      const updated = { ...prev[activeModule] };
      selectedIds.forEach(id => { updated[id] = { licenseState: 'unassigned', expiryDate: null }; });
      return { ...prev, [activeModule]: updated };
    });
    setSelectedIds(new Set());
  }
  function handleBulkReserve() {
    if (!activeModule) return;
    setAssignments(prev => {
      const updated = { ...prev[activeModule] };
      selectedIds.forEach(id => { updated[id] = { licenseState: 'reserved', expiryDate: daysFromNow(365) }; });
      return { ...prev, [activeModule]: updated };
    });
    setSelectedIds(new Set());
  }

  // Assign all unassigned up to remaining capacity, scoped to the current filtered view
  function handleAssignAll() {
    if (!activeModule || !module) return;
    const capacity = module.totalLicenses - assignedCount - reservedCount;
    if (capacity <= 0) return;
    let justAssigned = 0;
    setAssignments(prev => {
      const updated = { ...prev[activeModule] };
      let remaining = capacity;
      for (const loc of filtered) {
        if (remaining <= 0) break;
        if (updated[loc.id]?.licenseState === 'unassigned') {
          updated[loc.id] = { licenseState: 'assigned', expiryDate: daysFromNow(365) };
          remaining--;
          justAssigned++;
        }
      }
      return { ...prev, [activeModule]: updated };
    });
    setToast(`${justAssigned} license${justAssigned !== 1 ? 's' : ''} assigned. Change your filter to view them.`);
  }

  // Cascade clear on filter changes
  function handleDivisionToggle(v: string) {
    setDivisionFilter(prev => { const n = new Set(prev); n.has(v) ? n.delete(v) : n.add(v); return n; });
    setRegionFilter(new Set());
    setDistrictFilter(new Set());
  }
  function handleRegionToggle(v: string) {
    setRegionFilter(prev => { const n = new Set(prev); n.has(v) ? n.delete(v) : n.add(v); return n; });
    setDistrictFilter(new Set());
  }

  const hasActiveFilters = divisionFilter.size > 0 || regionFilter.size > 0 || districtFilter.size > 0 || search !== '' || statusFilter.size > 0 || locationStatusFilter.size > 0;

  return (
    <div style={{ fontFamily: FONT, color: DS.text, maxWidth: 1280, margin: '0 auto', paddingBottom: 60 }}>

      {/* Page header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: DS.text, margin: 0 }}>License Assignment</h1>
        <p style={{ fontSize: 13, color: DS.textMuted, margin: '4px 0 0' }}>
          Manage how module licenses are assigned across your locations.
        </p>
      </div>

      {/* ── Zone 1 — Module selector strip ────────────────────────────────── */}
      <section style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: DS.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
          Licensed Modules
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {MODULES.map(m => {
            const moduleAsgn = assignments[m.key];
            const mlAsgn = Object.values(moduleAsgn).filter(a => a.licenseState === 'assigned').length;
            const mlRsvd = Object.values(moduleAsgn).filter(a => a.licenseState === 'reserved').length;
            const { expiringCount, expiredCount } = getExpirationCounts(m.key, assignments);
            return (
              <ModuleCard
                key={m.key}
                module={m}
                liveAssigned={mlAsgn}
                liveReserved={mlRsvd}
                expiringCount={expiringCount}
                expiredCount={expiredCount}
                isActive={activeModule === m.key}
                onClick={() => setActiveModule(prev => prev === m.key ? null : m.key)}
              />
            );
          })}
        </div>
      </section>

      {/* ── Zone 2 — Pool status bar (only when module selected) ─────────── */}
      {module && (
        <section style={{ marginBottom: 16 }}>
          <PoolStatusBar
            module={module}
            assignedCount={assignedCount}
            reservedCount={reservedCount}
            unassignedLicenses={unassignedLicenses}
            unassignedInView={unassignedInView}
            onAssignAll={handleAssignAll}
            onAssignByRule={() => alert('Assign by rule — coming in a future iteration')}
          />
        </section>
      )}

      {/* ── Zone 3 — Filter controls ──────────────────────────────────────── */}
      {module && (
        <section style={{
          background: DS.white, border: `1px solid ${DS.border}`, borderRadius: 4,
          padding: '12px 16px', marginBottom: 12,
          display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
        }}>
          {/* Search */}
          <div style={{ position: 'relative', flex: '1 1 200px', maxWidth: 280 }}>
            <span style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', display: 'flex' }}>
              <SearchIcon />
            </span>
            <input
              type="text"
              placeholder="Search by name or store ID…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%', height: 34, padding: '0 32px 0 30px',
                border: `1px solid ${DS.borderInput}`, borderRadius: 4,
                fontSize: 13, color: DS.text, fontFamily: FONT,
                outline: 'none', boxSizing: 'border-box',
              }}
              onFocus={e => (e.currentTarget.style.borderColor = DS.blue)}
              onBlur={e => (e.currentTarget.style.borderColor = DS.borderInput)}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', padding: 2 }}
              >
                <XIcon size={12} />
              </button>
            )}
          </div>

          <div style={{ width: 1, height: 24, background: DS.divider }} />

          {/* Hierarchy filters */}
          <FilterDropdown
            label="Division"
            options={divisions}
            selected={divisionFilter}
            onToggle={handleDivisionToggle}
            onClear={() => { setDivisionFilter(new Set()); setRegionFilter(new Set()); setDistrictFilter(new Set()); }}
          />
          <FilterDropdown
            label="Region"
            options={regions}
            selected={regionFilter}
            onToggle={handleRegionToggle}
            onClear={() => { setRegionFilter(new Set()); setDistrictFilter(new Set()); }}
          />
          <FilterDropdown
            label="District"
            options={districts}
            selected={districtFilter}
            onToggle={v => setDistrictFilter(prev => { const n = new Set(prev); n.has(v) ? n.delete(v) : n.add(v); return n; })}
            onClear={() => setDistrictFilter(new Set())}
          />

          {hasActiveFilters && (
            <>
              <div style={{ width: 1, height: 24, background: DS.divider }} />
              <button
                onClick={() => { setSearch(''); setDivisionFilter(new Set()); setRegionFilter(new Set()); setDistrictFilter(new Set()); setStatusFilter(new Set()); setLocationStatusFilter(new Set()); }}
                style={{ fontSize: 12, color: DS.textMuted, background: 'none', border: 'none', cursor: 'pointer', fontFamily: FONT, padding: '0 4px' }}
                onMouseEnter={e => (e.currentTarget.style.color = DS.text)}
                onMouseLeave={e => (e.currentTarget.style.color = DS.textMuted)}
              >
                Clear all
              </button>
            </>
          )}

          {/* Location status + license state filter — right-aligned */}
          <div style={{ marginLeft: 'auto' }}>
            <StatusFilterDropdown
              counts={stateCounts}
              selected={statusFilter}
              onToggle={v => setStatusFilter(prev => { const n = new Set(prev); n.has(v) ? n.delete(v) : n.add(v); return n; })}
              locationStatusCounts={locationStatusCounts}
              selectedLocationStatus={locationStatusFilter}
              onToggleLocationStatus={v => setLocationStatusFilter(prev => { const n = new Set(prev); n.has(v) ? n.delete(v) : n.add(v); return n; })}
              onClear={() => { setStatusFilter(new Set()); setLocationStatusFilter(new Set()); }}
            />
          </div>
        </section>
      )}

      {/* ── Zone 4 — Location list ────────────────────────────────────────── */}
      {!module ? (
        <div style={{
          background: DS.white, border: `1px solid ${DS.border}`, borderRadius: 4,
          padding: '56px 24px',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
        }}>
          <ModulesIcon size={36} color={DS.blue} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: DS.textMuted, marginBottom: 4 }}>
              Select a module to begin
            </div>
            <div style={{ fontSize: 13, color: DS.textDisabled }}>
              License assignment is managed one module at a time.
            </div>
          </div>
        </div>
      ) : (
        <section>
          {/* Bulk action bar */}
          {selectedVisible.length > 0 && (
            <BulkActionBar
              count={selectedVisible.length}
              onAssign={handleBulkAssign}
              onUnassign={handleBulkUnassign}
              onReserve={handleBulkReserve}
              onClear={() => setSelectedIds(new Set())}
            />
          )}

          {/* Table */}
          <div style={{ background: DS.white, border: `1px solid ${DS.border}`, borderRadius: 4, overflow: 'hidden' }}>

            {/* Header row */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '40px 80px 90px 1fr 160px 140px 110px',
              padding: '0 16px', minHeight: 40, alignItems: 'center',
              background: DS.bg, borderBottom: `1px solid ${DS.border}`,
            }}>
              <div><Checkbox checked={allChecked} indeterminate={someChecked} onChange={toggleSelectAll} /></div>
              <div style={{ fontSize: 11, fontWeight: 700, color: DS.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>ID</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: DS.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Status</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: DS.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Name</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: DS.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>License State</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: DS.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Expires</div>
              <div />
            </div>

            {/* Rows */}
            {filtered.length === 0 ? (
              <div style={{ padding: '40px 24px', textAlign: 'center', fontSize: 13, color: DS.textMuted }}>
                No locations match your current filters.
              </div>
            ) : (
              (() => {
                const availableLicenses = module!.totalLicenses - assignedCount - reservedCount;
                const poolExhausted = availableLicenses <= 0;
                return filtered.map((loc, idx) => {
                const asgn = assignments[activeModule!][loc.id];
                const licenseState: LicenseState = asgn?.licenseState ?? 'unassigned';
                const expiryDate: string | null   = asgn?.expiryDate   ?? null;
                const isSelected  = selectedIds.has(loc.id);
                const days        = daysUntil(expiryDate);
                const rowBg = isSelected ? '#EBF5FF'
                  : getExpiryState(expiryDate) === 'expired'       ? '#FEF2F2'
                  : getExpiryState(expiryDate) === 'expiring-soon' ? '#FFFDF5'
                  : DS.white;

                return (
                  <div
                    key={loc.id}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '40px 80px 90px 1fr 160px 140px 110px',
                      padding: '0 16px', minHeight: 52, alignItems: 'center',
                      borderBottom: idx < filtered.length - 1 ? `1px solid ${DS.divider}` : 'none',
                      background: rowBg,
                      transition: 'background 0.1s',
                    }}
                    onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = DS.bg; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = rowBg; }}
                  >
                    {/* Checkbox */}
                    <div><Checkbox checked={isSelected} onChange={() => toggleSelectOne(loc.id)} /></div>

                    {/* ID */}
                    <div style={{ fontSize: 13, color: DS.textMuted, fontWeight: 500 }}>{loc.storeId}</div>

                    {/* Location status badge */}
                    <div>
                      <span style={{
                        fontSize: 11, fontWeight: 600, borderRadius: 10, padding: '2px 8px',
                        background: loc.status === 'active' ? DS.greenLight : DS.bg,
                        color: loc.status === 'active' ? DS.green : DS.textMuted,
                        border: `1px solid ${loc.status === 'active' ? '#B7EDD4' : DS.border}`,
                      }}>
                        {loc.status === 'active' ? 'Active' : 'Inactive'}
                      </span>
                    </div>

                    {/* Name + breadcrumb */}
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: DS.text }}>{loc.name}</div>
                      <div style={{ fontSize: 11, color: DS.textDisabled, marginTop: 1 }}>
                        {loc.division} · {loc.region} · {loc.district}
                      </div>
                    </div>

                    {/* License state */}
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <StateIndicator
                        licenseState={licenseState}
                        locationStatus={loc.status}
                        expiryState={getExpiryState(expiryDate)}
                      />
                    </div>

                    {/* Expiry date */}
                    <div>
                      {expiryDate ? (
                        <span style={{
                          fontSize: 12,
                          color: getExpiryState(expiryDate) === 'expiring-soon' ? DS.amberDark
                            : getExpiryState(expiryDate) === 'expired' ? DS.red
                            : DS.textBody,
                          fontWeight: getExpiryState(expiryDate) !== 'ok' ? 600 : 400,
                        }}>
                          {getExpiryState(expiryDate) === 'expiring-soon' && (
                            <span style={{ marginRight: 4 }}>⚠</span>
                          )}
                          {getExpiryState(expiryDate) === 'expired' && (
                            <span style={{ marginRight: 4 }}>⚠</span>
                          )}
                          {formatExpiry(expiryDate)}
                        </span>
                      ) : (
                        <span style={{ fontSize: 12, color: DS.textDisabled }}>—</span>
                      )}
                    </div>

                    {/* Row action */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <RowAction licenseState={licenseState} poolExhausted={poolExhausted} onAction={a => handleRowAction(loc.id, a)} />
                    </div>
                  </div>
                );
              })
              })()
            )}
          </div>

          {/* Row count */}
          <div style={{ marginTop: 10, fontSize: 12, color: DS.textDisabled, textAlign: 'right' }}>
            {filtered.length} location{filtered.length !== 1 ? 's' : ''}
            {filtered.length !== LOCATIONS.length ? ` of ${LOCATIONS.length} total` : ''}
          </div>
        </section>
      )}

      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}
    </div>
  );
}
