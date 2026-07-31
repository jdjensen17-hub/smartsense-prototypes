import React, { useState, useRef, useEffect, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import Barcode from 'react-barcode';

// ── Design tokens ───────────────────────────────────────────────────────────
const T = {
  surface0: '#F0F0F2', surface1: '#F7F7FA', surface2: '#FFFFFF',
  textPrimary: '#1A1A1F', textSecondary: '#5C5C6E', textMuted: '#9898A8',
  textAccent: '#185FA5', textDanger: '#A32D2D', textWarning: '#854F0B',
  border: 'rgba(26,26,31,0.12)', borderStrong: 'rgba(26,26,31,0.22)',
  borderAccent: '#378ADD', fillAccent: '#378ADD',
  bgAccent: '#E6F1FB', bgWarning: '#FAEEDA', bgDanger: '#FCEBEB',
  onAccent: '#FFFFFF', font: "'Inter', -apple-system, sans-serif",
};

// ── Types ──────────────────────────────────────────────────────────────────
type ItemType = 'yn' | 'checkmark' | 'rating' | 'signature' | 'mc' | 'short' | 'free' | 'measurement' | 'photo' | 'qr' | 'employee' | 'date' | 'datetime' | 'time' | 'stopwatch' | 'subtitle' | 'text' | 'barcode' | 'sublist' | 'formula';

type DCConditionYN = { type: 'yn'; value: 'Yes' | 'No' };
type DCConditionMeas = { type: 'measurement'; op: '>' | '>=' | '=' | '<=' | '<'; value: number };
type DCCondition = DCConditionYN | DCConditionMeas;

interface MCChoice { id: string; label: string; color: string; icon: string | null; score?: number | ''; flagIds?: string[]; followUpEnabled?: boolean; followUpActions?: string[]; }
interface CARule { id: string; condition?: string; caList: string; adHoc: boolean; nextStep: 'repeat-item' | 'repeat-list' | 'no-repeat'; optional?: boolean; rangeId?: string; }

interface ListItem {
  id: string;
  prompt: string;
  type: ItemType;
  stripe: string;
  inds: string[];
  allowNA: boolean;
  dcParentId?: string;
  dcCondition?: DCCondition;
  choices?: MCChoice[];
  caForNA?: boolean;
  caForYNRules?: CARule[];
  caForRanges?: boolean;
  caForRangeRules?: CARule[];
  caForMCRules?: CARule[];
  flagsForYes?: string[];
  flagsForNo?: string[];
  scoreEnabled?: boolean;
  scoreYes?: number;
  scoreNo?: number;
  ratingMin?: number;
  ratingMax?: number;
  ratingScores?: Record<number, number>;
  bgColor?: string;
  infoFile?: string;
  infoInline?: boolean;
  points?: number;
  promptHtml?: string;
  labelIds?: string[];
  caForNAList?: string;
  caForNAAdHoc?: boolean;
  caForNANextStep?: 'repeat-item' | 'repeat-list' | 'no-repeat';
  caForNAOptional?: boolean;
  autoComplete?: { flagId: string; op: '<' | '>' | '=' | '>=' | '<='; count: number; answer: 'Yes' | 'No' };
  savedValue?: boolean;
  locationTags?: string[];
  scoreGroup?: string;
  importance?: string;
  measRanges?: { id: string; min: string; max: string }[];
  measFlagRules?: { id: string; condition: string; rangeId: string; flagId: string; recordColor: string }[];
  mcTemplateId?: string;
  mcMultiSelect?: boolean;
  mcShowInline?: boolean;
  mcDraftChoices?: MCChoice[];
  photoAllowUpload?: boolean;
  employeeRoles?: string[];
  qrTarget?: string;
  barcodeTarget?: string;
}

// ── Constants ──────────────────────────────────────────────────────────────
const TYPE_META: Record<ItemType, { label: string; icon: string }> = {
  yn:          { label: 'Yes/No',         icon: 'ti-toggle-right' },
  checkmark:   { label: 'Checkmark',      icon: 'ti-check' },
  rating:      { label: 'Rating',         icon: 'ti-star-half' },
  signature:   { label: 'Signature',      icon: 'ti-writing' },
  mc:          { label: 'Multiple Choice',icon: 'ti-list-check' },
  short:       { label: 'Short Entry',    icon: 'ti-forms' },
  free:        { label: 'Free Response',  icon: 'ti-align-left' },
  measurement: { label: 'Measurement',    icon: 'ti-ruler' },
  photo:       { label: 'Photo',          icon: 'ti-camera' },
  qr:          { label: 'QR Code',        icon: 'ti-qrcode' },
  employee:    { label: 'Employee',       icon: 'ti-user' },
  date:        { label: 'Date',           icon: 'ti-calendar' },
  datetime:    { label: 'Date/Time',      icon: 'ti-calendar-clock' },
  time:        { label: 'Time',           icon: 'ti-clock' },
  stopwatch:   { label: 'Stopwatch',      icon: 'ti-stopwatch' },
  subtitle:    { label: 'Subtitle',       icon: 'ti-heading' },
  text:        { label: 'Text',           icon: 'ti-text-size' },
  barcode:     { label: 'Bar Code',       icon: 'ti-barcode' },
  sublist:     { label: 'Sublist',        icon: 'ti-layout-list' },
  formula:     { label: 'Formula',        icon: 'ti-math-function' },
};

const ALL_TYPES: { type: ItemType; aliases: string[] }[] = [
  { type: 'yn',          aliases: ['yn','boolean','pass fail','yes no'] },
  { type: 'checkmark',   aliases: ['tick','check','done','complete'] },
  { type: 'rating',      aliases: ['score','rating','scale','stars','5 star','1-5'] },
  { type: 'signature',   aliases: ['sign','initials','approval'] },
  { type: 'mc',          aliases: ['mc','select','options','dropdown','pick','choice'] },
  { type: 'short',       aliases: ['short text','brief','input','entry'] },
  { type: 'free',        aliases: ['text','paragraph','write','comment','notes','long'] },
  { type: 'measurement', aliases: ['number','num','numeric','temperature','temp','range','value'] },
  { type: 'photo',       aliases: ['image','picture','pic','upload','camera'] },
  { type: 'qr',          aliases: ['qr','scan','qrcode'] },
  { type: 'employee',    aliases: ['person','staff','worker','name'] },
  { type: 'date',        aliases: ['day','when','calendar'] },
  { type: 'datetime',    aliases: ['datetime','timestamp'] },
  { type: 'time',        aliases: ['hour','time of day','clock'] },
  { type: 'stopwatch',   aliases: ['timer','elapsed','duration'] },
  { type: 'subtitle',    aliases: ['header','section','divider','label','heading'] },
  { type: 'text',        aliases: ['instruction','note','read only','static'] },
  { type: 'barcode',     aliases: ['upc','scan','product','bar code'] },
  { type: 'sublist',     aliases: ['nested','child','sub'] },
  { type: 'formula',     aliases: ['calculate','calc','equation','math'] },
];

const FLAG_COLORS = ['#1A1A1F','#EF5350','#FF7043','#FFB300','#66BB6A','#42A5F5','#7E57C2','#EC407A','#26C6DA'];
const FLAG_EMOJIS = ['🚩','⚠️','🔴','🟠','🟡','🟢','🔵','🟣','⭐','❗','❌','✅','🔥','💧','🌿','🍽️','🔧','🏥','📋','🔑'];
const LOCATION_TAGS = ['BOH', 'FOH', 'Bar', 'Kitchen', 'Drive-Thru', 'Prep', 'Storage', 'Receiving', 'Freezer', 'Dishwash', 'Catering', 'Patio', 'Lounge', 'Bakery', 'Deli', 'Produce', 'Dairy', 'Meat', 'Seafood', 'Checkout'];
const SCORE_GROUPS = ['Food Safety', 'Equipment', 'Sanitation', 'Customer Experience', 'Opening', 'Closing'];
const IMPORTANCE_LEVELS = ['Critical', 'Major', 'Minor'];
const EMPLOYEE_ROLES = ['Manager', 'Supervisor', 'Operator', 'Kitchen Manager', 'Auditor', 'Integrations Admin', 'System Admin', 'IAM Admin'];

const CA_LISTS = [
  { id: 'cal1', title: 'Corrective Action List' },
  { id: 'cal2', title: 'Food Safety Corrective Actions' },
  { id: 'cal3', title: 'Equipment Failure Protocol' },
  { id: 'cal4', title: 'Temperature Violation Checklist' },
  { id: 'cal5', title: 'Health & Safety Incident Log' },
];

const INITIAL_FLAGS = [
  { id: 'f1', name: 'Health & Safety', color: '#EF5350', emoji: '⚠️' },
  { id: 'f2', name: 'Equipment',        color: '#FF7043', emoji: '🔧' },
  { id: 'f3', name: 'Food Safety',      color: '#42A5F5', emoji: '🍽️' },
];

const LABEL_TEMPLATES = [
  { id: 'l1', name: 'Bacon (GRILL STATION)',        group: 'Jolt Product Discovery' },
  { id: 'l2', name: 'Bacon Bits (GRILL STATION)',   group: 'Jolt Product Discovery' },
  { id: 'l3', name: 'Cheese (GRILL STATION)',        group: 'Jolt Product Discovery' },
  { id: 'l4', name: 'Lettuce (PREP)',                group: 'Jolt Product Discovery' },
  { id: 'l5', name: 'Tomato (PREP)',                 group: 'Jolt Product Discovery' },
  { id: 'l6', name: 'Cooler Temp Log',               group: 'Food Safety' },
  { id: 'l7', name: 'Hot Hold Temperature',          group: 'Food Safety' },
  { id: 'l8', name: 'Date Label — 3 Day',            group: 'Date Labels' },
  { id: 'l9', name: 'Date Label — 7 Day',            group: 'Date Labels' },
];

const STRIPE_COLORS = [
  { label: 'None', value: '' },
  { label: 'Blue', value: '#5CA6D9' },
  { label: 'Green', value: '#C1E1C5' },
  { label: 'Yellow', value: '#FFF176' },
  { label: 'Red', value: '#EF9A9A' },
  { label: 'Purple', value: '#CE93D8' },
  { label: 'Orange', value: '#FFCC80' },
  { label: 'Teal', value: '#80CBC4' },
];

const DC_COLORS = ['#2196F3','#E91E63','#4CAF50','#FF9800','#9C27B0','#00BCD4'];

function mkid() { return Math.random().toString(36).slice(2, 9); }
function mkCodeTarget() { return Math.random().toString(36).slice(2, 10).toUpperCase(); }

// ── Initial sample data ───────────────────────────────────────────────────
const INITIAL_ITEMS: ListItem[] = [
  { id: 'section-opening', prompt: 'Opening Tasks', type: 'subtitle', stripe: '', inds: [], allowNA: false },
  { id: 'cooler-ok', prompt: 'Walk-in cooler temp OK?', type: 'yn', stripe: '#5CA6D9', inds: [], allowNA: false, flagsForYes: [], flagsForNo: [], caForYNRules: [], scoreYes: 1, scoreNo: 0 },
  { id: 'ca-photo', prompt: 'Take corrective action photo', type: 'photo', stripe: '', inds: ['ti-filter'], allowNA: true, dcParentId: 'cooler-ok', dcCondition: { type: 'yn', value: 'No' } },
  { id: 'sign-off', prompt: 'Sign off opening inspection', type: 'signature', stripe: '', inds: [], allowNA: false },
  { id: 'section-food-safety', prompt: 'Food Safety', type: 'subtitle', stripe: '', inds: [], allowNA: false },
  { id: 'prep-temp', prompt: 'Record prep cooler temp °F', type: 'measurement', stripe: '#C1E1C5', inds: [], allowNA: true },
  { id: 'ca-notes', prompt: 'Log corrective action notes', type: 'free', stripe: '', inds: ['ti-filter'], allowNA: false, dcParentId: 'prep-temp', dcCondition: { type: 'measurement', op: '>=', value: 41 } },
  { id: 'date-labels', prompt: 'All date labels current', type: 'checkmark', stripe: '', inds: [], allowNA: false },
  { id: 'handwashing', prompt: 'Handwashing stations stocked', type: 'yn', stripe: '', inds: [], allowNA: false, scoreYes: 1, scoreNo: 0 },
  { id: 'gloves-worn', prompt: 'All food handlers wearing gloves?', type: 'yn', stripe: '#FFF176', inds: [], allowNA: false, points: 5, infoInline: true, labelIds: ['l6'], scoreYes: 1, scoreNo: 0 },
  { id: 'vendor-mc', prompt: 'Preferred vendor for shortfall?', type: 'mc', stripe: '', inds: [], allowNA: false, choices: [
    { id: 'c1', label: 'Sysco', color: '#4CAF50', icon: null },
    { id: 'c2', label: 'US Foods', color: '#2196F3', icon: null },
    { id: 'c3', label: 'Performance Food Group', color: '#FF9800', icon: null },
  ]},
  { id: 'mc-blank', prompt: 'New multiple choice item', type: 'mc', stripe: '', inds: [], allowNA: false, choices: [] },
  { id: 'section-read-only', prompt: 'Read Only', type: 'subtitle', stripe: '', inds: [], allowNA: false },
  { id: 'temp-guidelines', prompt: 'Temperature Guidelines', type: 'subtitle', stripe: '', inds: [], allowNA: false },
  { id: 'kitchen-rate', prompt: 'Rate overall kitchen cleanliness', type: 'rating', stripe: '', inds: [], allowNA: false, ratingMin: 1, ratingMax: 5 },
  { id: 'text-info', prompt: 'Read the food safety guidelines before proceeding', type: 'text', stripe: '', inds: [], allowNA: false },
  { id: 'free-notes', prompt: 'Enter any additional notes', type: 'free', stripe: '', inds: [], allowNA: false },
  { id: 'employee-select', prompt: 'Select responsible employee', type: 'employee', stripe: '', inds: [], allowNA: false },
  { id: 'qr-scan', prompt: 'Scan equipment QR code', type: 'qr', stripe: '', inds: [], allowNA: false, qrTarget: 'EQ-140CD22' },
  { id: 'barcode-scan', prompt: 'Scan product barcode', type: 'barcode', stripe: '', inds: [], allowNA: false, barcodeTarget: 'PROD-A4F9B1' },
];

// ── Helpers ────────────────────────────────────────────────────────────────
function findItem(items: ListItem[], id: string): ListItem | undefined {
  return items.find(i => i.id === id);
}

function indColor(ind: string) {
  if (ind === 'ti-flag') return T.fillAccent;
  if (ind === 'ti-info-circle') return T.fillAccent;
  if (ind === 'ti-alert-triangle') return T.textWarning;
  if (ind === 'ti-filter') return T.fillAccent;
  return T.textMuted;
}

function dcCondLabel(cond?: DCCondition) {
  if (!cond) return '';
  if (cond.type === 'yn') return `if ${cond.value}`;
  return `if ${cond.op} ${cond.value}°F`;
}

// ── Mini reusable components ──────────────────────────────────────────────
function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <div onClick={() => onChange(!on)} style={{ display: 'inline-block', width: 32, height: 18, background: on ? T.fillAccent : T.borderStrong, borderRadius: 9999, position: 'relative', cursor: 'pointer', flexShrink: 0, transition: 'background 0.15s' }}>
      <div style={{ position: 'absolute', width: 13, height: 13, background: 'white', borderRadius: '50%', top: 2.5, left: on ? 16.5 : 2.5, transition: 'left 0.15s' }} />
    </div>
  );
}

function Btn({ children, primary, danger, disabled, onClick, style }: { children: React.ReactNode; primary?: boolean; danger?: boolean; disabled?: boolean; onClick?: () => void; style?: React.CSSProperties }) {
  return (
    <button disabled={disabled} onClick={onClick} style={{
      fontFamily: T.font, fontSize: 12, fontWeight: 500, padding: '5px 10px', borderRadius: 5, cursor: disabled ? 'default' : 'pointer',
      display: 'inline-flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap',
      border: `0.5px solid ${danger ? 'rgba(163,45,45,0.5)' : primary ? T.fillAccent : T.borderStrong}`,
      background: primary ? T.fillAccent : danger ? T.bgDanger : T.surface2,
      color: primary ? T.onAccent : danger ? T.textDanger : T.textSecondary,
      opacity: disabled ? 0.35 : 1,
      ...style,
    }}>
      {children}
    </button>
  );
}

function SectionHeader({ label, summary, right, children, defaultOpen = false }: { label: string; summary?: string; right?: React.ReactNode; children?: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ background: T.surface2, border: `0.5px solid ${T.border}`, borderRadius: 8, marginBottom: 8, overflow: 'hidden' }}>
      <div onClick={() => setOpen(v => !v)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', cursor: 'pointer', userSelect: 'none' }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: T.textPrimary }}>{label}</div>
          {summary && <div style={{ fontSize: 12, color: T.textMuted, marginTop: 2 }}>{summary}</div>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {right}
          <i className={`ti ti-chevron-${open ? 'up' : 'down'}`} style={{ fontSize: 14, color: T.textMuted }} />
        </div>
      </div>
      {open && children && <div style={{ borderTop: `0.5px solid ${T.border}`, padding: '16px' }}>{children}</div>}
    </div>
  );
}

function Select({ value, onChange, options, style }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; style?: React.CSSProperties }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)} style={{
      fontFamily: T.font, fontSize: 13, color: T.textPrimary, background: T.surface2, border: `0.5px solid ${T.borderStrong}`, borderRadius: 6, padding: '7px 28px 7px 10px', appearance: 'none', cursor: 'pointer', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%239898A8'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center', ...style,
    }}>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

// ── Side sheet sections ────────────────────────────────────────────────────
function SsSection({ label, children, defaultOpen = false, forceOpen = false }: { label: string; children: React.ReactNode; defaultOpen?: boolean; forceOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const isOpen = open || forceOpen;
  return (
    <div style={{ borderBottom: `0.5px solid ${T.border}` }}>
      <div onClick={() => setOpen(v => !v)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', cursor: 'pointer', userSelect: 'none' }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
        <i className={`ti ti-chevron-${isOpen ? 'up' : 'down'}`} style={{ fontSize: 13, color: T.textMuted }} />
      </div>
      {isOpen && <div style={{ padding: '0 16px 14px' }}>{children}</div>}
    </div>
  );
}

const COMPLETION_OPS = [
  { value: '<',  label: '<'  },
  { value: '<=', label: '≤'  },
  { value: '=',  label: '='  },
  { value: '>=', label: '≥'  },
  { value: '>',  label: '>'  },
];

type Flag = { id: string; name: string; color: string; emoji: string };

function CompletionModeSection({ item, onUpdate, flags, onCreateFlag }: { item: ListItem; onUpdate: (updates: Partial<ListItem>) => void; flags: Flag[]; onCreateFlag: (flag: Flag) => void }) {
  const isAuto = !!item.autoComplete;
  const rule = item.autoComplete ?? { flagId: '', op: '>' as const, count: 0, answer: 'No' as const };
  const [creatingFlag, setCreatingFlag] = useState(false);

  const setAuto = (v: boolean) => {
    if (v) onUpdate({ autoComplete: { flagId: '', op: '>', count: 0, answer: 'No' } });
    else onUpdate({ autoComplete: undefined });
  };
  const updRule = (patch: Partial<typeof rule>) => onUpdate({ autoComplete: { ...rule, ...patch } });

  const radioStyle: React.CSSProperties = { accentColor: T.fillAccent, width: 14, height: 14, cursor: 'pointer' };
  const labelStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: T.textPrimary };

  return (
    <SsSection label="Completion Mode" defaultOpen={isAuto}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <label style={labelStyle}>
          <input type="radio" checked={!isAuto} onChange={() => setAuto(false)} style={radioStyle} />
          Manually complete
        </label>
        <label style={labelStyle}>
          <input type="radio" checked={isAuto} onChange={() => setAuto(true)} style={radioStyle} />
          Auto complete <span style={{ fontSize: 12, color: T.textMuted }}>(cannot be manually completed)</span>
        </label>
      </div>
      {isAuto && (
        <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontSize: 12, color: T.textMuted, lineHeight: 1.5 }}>
            <strong style={{ color: T.textPrimary, fontWeight: 600 }}>IF</strong> the flag count on this list for:
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <select
              value={rule.flagId}
              onChange={e => { if (e.target.value === '__create__') { setCreatingFlag(true); } else { setCreatingFlag(false); updRule({ flagId: e.target.value }); } }}
              style={{ fontFamily: T.font, fontSize: 13, color: rule.flagId ? T.textPrimary : T.textMuted, background: T.surface2, border: `0.5px solid ${rule.flagId ? T.borderStrong : '#EF5350'}`, borderRadius: 6, padding: '6px 8px', flex: 1 }}
            >
              <option value="__create__">+ Create new flag…</option>
              <option value="">Select a flag…</option>
              {flags.map(f => <option key={f.id} value={f.id}>{f.emoji} {f.name}</option>)}
            </select>
            <select
              value={rule.op}
              onChange={e => updRule({ op: e.target.value as typeof rule.op })}
              style={{ fontFamily: T.font, fontSize: 13, color: T.textPrimary, background: T.surface2, border: `0.5px solid ${T.borderStrong}`, borderRadius: 6, padding: '6px 8px', width: 56 }}
            >
              {COMPLETION_OPS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <input
              type="number"
              min={0}
              value={rule.count}
              onChange={e => { const n = parseInt(e.target.value, 10); if (!isNaN(n) && n >= 0) updRule({ count: n }); }}
              onKeyDown={e => { if (e.key === 'e' || e.key === 'E' || e.key === '.' || e.key === ',' || e.key === '-') e.preventDefault(); }}
              style={{ fontFamily: T.font, fontSize: 13, border: `0.5px solid ${T.borderStrong}`, borderRadius: 6, padding: '6px 8px', width: 56, textAlign: 'center' }}
            />
          </div>
          {creatingFlag && (
            <FlagCreateForm
              onCreateFlag={onCreateFlag}
              onCancel={() => setCreatingFlag(false)}
              pendingAnswer="Yes"
              onSelect={(_ans, flagId) => { updRule({ flagId }); setCreatingFlag(false); }}
            />
          )}
          {!rule.flagId && !creatingFlag && <div style={{ fontSize: 11, color: '#EF5350' }}>A flag is required</div>}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, color: T.textPrimary }}><strong style={{ fontWeight: 600 }}>THEN</strong> the answer will autocomplete to:</span>
            <select
              value={rule.answer}
              onChange={e => updRule({ answer: e.target.value as 'Yes' | 'No' })}
              style={{ fontFamily: T.font, fontSize: 13, color: T.textPrimary, background: T.surface2, border: `0.5px solid ${T.borderStrong}`, borderRadius: 6, padding: '6px 8px', width: 72 }}
            >
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
          </div>
        </div>
      )}
    </SsSection>
  );
}

function FlagCreateForm({ onCreateFlag, onCancel, pendingAnswer, onSelect }: { onCreateFlag: (flag: Flag) => void; onCancel: () => void; pendingAnswer: 'Yes' | 'No'; onSelect: (answer: 'Yes' | 'No', flagId: string) => void }) {
  const [newFlagName, setNewFlagName] = useState('');
  const [newFlagColor, setNewFlagColor] = useState(FLAG_COLORS[0]);
  const [newFlagEmoji, setNewFlagEmoji] = useState('');
  const [nameError, setNameError] = useState(false);

  const handleCreate = () => {
    if (!newFlagName.trim()) { setNameError(true); return; }
    const newFlag: Flag = { id: mkid(), name: newFlagName.trim(), color: newFlagColor, emoji: newFlagEmoji };
    onCreateFlag(newFlag);
    onSelect(pendingAnswer, newFlag.id);
    onCancel();
  };

  return (
    <div style={{ background: T.surface1, border: `0.5px solid ${T.borderStrong}`, borderRadius: 6, padding: 12, marginTop: 8 }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: T.textMuted, textTransform: 'uppercase', marginBottom: 8 }}>New flag</div>
      <input value={newFlagName} onChange={e => { setNewFlagName(e.target.value); if (e.target.value.trim()) setNameError(false); }} placeholder="Flag name" autoFocus
        onKeyDown={e => { if (e.key === 'Enter') handleCreate(); if (e.key === 'Escape') onCancel(); }}
        style={{ fontFamily: T.font, fontSize: 13, border: `0.5px solid ${nameError ? '#EF5350' : T.borderStrong}`, borderRadius: 5, padding: '6px 10px', width: '100%', marginBottom: nameError ? 4 : 8 }} />
      {nameError && <div style={{ fontSize: 11, color: '#EF5350', marginBottom: 8 }}>Flag name is required</div>}
      <div style={{ marginBottom: 8 }}>
        <div style={{ fontSize: 10, fontWeight: 600, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Color</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {FLAG_COLORS.map(c => <div key={c} onClick={() => setNewFlagColor(c)} style={{ width: 20, height: 20, borderRadius: '50%', background: c, cursor: 'pointer', border: newFlagColor === c ? `${c === '#1A1A1F' ? '1.5px' : '2px'} solid ${c === '#1A1A1F' ? '#ffffff' : T.textPrimary}` : '2px solid transparent', outline: newFlagColor === c && c === '#1A1A1F' ? `1.5px solid ${T.borderStrong}` : 'none', outlineOffset: 1 }} />)}
        </div>
      </div>
      <div style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 10, fontWeight: 600, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Emoji</div>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          <div onClick={() => setNewFlagEmoji('')} style={{ width: 28, height: 28, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 600, cursor: 'pointer', color: T.textMuted, background: newFlagEmoji === '' ? T.bgAccent : 'transparent', border: newFlagEmoji === '' ? `0.5px solid ${T.borderAccent}` : `0.5px solid ${T.borderStrong}` }}>
            None
          </div>
          {FLAG_EMOJIS.map(e => (
            <div key={e} onClick={() => setNewFlagEmoji(e)} style={{ width: 28, height: 28, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, cursor: 'pointer', background: newFlagEmoji === e ? T.bgAccent : 'transparent', border: newFlagEmoji === e ? `0.5px solid ${T.borderAccent}` : `0.5px solid transparent` }}>
              {e}
            </div>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <Btn primary onClick={handleCreate}>Create & select</Btn>
        <button onClick={onCancel} style={{ fontFamily: T.font, fontSize: 12, color: T.textMuted, background: 'none', border: 'none', cursor: 'pointer' }}>Cancel</button>
      </div>
    </div>
  );
}

function FlagPicker({ answer, selectedIds, flags, onToggle, onCreateFlag, restrictedFlagId }: { answer: 'Yes' | 'No'; selectedIds: string[]; flags: Flag[]; onToggle: (flagId: string) => void; onCreateFlag: (flag: Flag) => void; restrictedFlagId?: string }) {
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) { setOpen(false); setCreating(false); } };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const available = flags.filter(f => f.id !== restrictedFlagId);
  const conflictingIds = restrictedFlagId ? selectedIds.filter(id => id === restrictedFlagId) : [];

  return (
    <div ref={ref} style={{ position: 'relative', flex: 1 }}>
      <div style={{ minHeight: 36, border: `0.5px solid ${conflictingIds.length > 0 ? '#EF5350' : T.borderStrong}`, borderRadius: 6, padding: '4px 8px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 4, cursor: 'pointer', background: T.surface2 }} onClick={() => setOpen(v => !v)}>
        {selectedIds.map(id => {
          const f = flags.find(x => x.id === id);
          if (!f) return null;
          const isConflict = id === restrictedFlagId;
          return (
            <span key={id} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: isConflict ? '#FDECEA' : T.surface1, border: `1.5px solid ${isConflict ? '#EF5350' : f.color}`, borderRadius: 12, padding: '2px 8px', fontSize: 12, fontWeight: 500, color: isConflict ? '#EF5350' : T.textPrimary }}>
              {f.emoji && <span>{f.emoji}</span>}
              <span>{f.name}</span>
              <i className="ti ti-x" style={{ fontSize: 10, color: isConflict ? '#EF5350' : T.textMuted, cursor: 'pointer' }} onClick={e => { e.stopPropagation(); onToggle(id); }} />
            </span>
          );
        })}
        <i className="ti ti-chevron-down" style={{ fontSize: 11, color: T.textMuted, marginLeft: 'auto' }} />
      </div>
      {open && (
        <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, background: T.surface2, border: `0.5px solid ${T.borderStrong}`, borderRadius: 8, boxShadow: '0 4px 20px rgba(0,0,0,0.12)', zIndex: 300, overflow: 'hidden' }}>
          <div onClick={() => { setCreating(true); setOpen(false); }} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', cursor: 'pointer', borderBottom: `0.5px solid ${T.border}`, fontSize: 13, color: T.textAccent, fontWeight: 500 }}
            onMouseEnter={e => (e.currentTarget.style.background = T.surface1)} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
            <i className="ti ti-plus" style={{ fontSize: 12 }} /> Create new flag…
          </div>
          {available.length === 0 && (
            <div style={{ padding: '10px 12px', fontSize: 13, color: T.textMuted, fontStyle: 'italic' }}>No flags available</div>
          )}
          {available.map(f => {
            const isSelected = selectedIds.includes(f.id);
            return (
              <div key={f.id} onClick={() => { onToggle(f.id); if (!isSelected) setOpen(false); }}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', cursor: 'pointer', fontSize: 13, color: T.textPrimary, background: isSelected ? T.surface1 : 'transparent' }}
                onMouseEnter={e => (e.currentTarget.style.background = T.surface0)} onMouseLeave={e => (e.currentTarget.style.background = isSelected ? T.surface1 : 'transparent')}>
                <i className={`ti ${isSelected ? 'ti-check' : 'ti-circle'}`} style={{ fontSize: 12, color: isSelected ? T.textAccent : T.textMuted, flexShrink: 0 }} />
                {f.emoji && <span>{f.emoji}</span>}<span>{f.name}</span>
              </div>
            );
          })}
        </div>
      )}
      {conflictingIds.length > 0 && (
        <div style={{ fontSize: 11, color: '#EF5350', marginTop: 4 }}>The same flag cannot be used on a rule and on auto complete.</div>
      )}
      {creating && (
        <FlagCreateForm
          onCreateFlag={onCreateFlag}
          onCancel={() => setCreating(false)}
          pendingAnswer={answer}
          onSelect={(_ans, flagId) => onToggle(flagId)}
        />
      )}
    </div>
  );
}

function FlagSection({ item, onUpdate, flags, onCreateFlag }: { item: ListItem; onUpdate: (updates: Partial<ListItem>) => void; flags: Flag[]; onCreateFlag: (flag: Flag) => void }) {
  const hasFlags = (item.flagsForYes?.length ?? 0) > 0 || (item.flagsForNo?.length ?? 0) > 0;
  const restrictedFlagId = item.autoComplete?.flagId || undefined;
  const hasConflict = !!restrictedFlagId && (
    (item.flagsForYes ?? []).includes(restrictedFlagId) ||
    (item.flagsForNo ?? []).includes(restrictedFlagId)
  );

  const toggle = (answer: 'Yes' | 'No', flagId: string) => {
    const field = answer === 'Yes' ? 'flagsForYes' : 'flagsForNo';
    const current = (answer === 'Yes' ? item.flagsForYes : item.flagsForNo) ?? [];
    onUpdate({ [field]: current.includes(flagId) ? current.filter(id => id !== flagId) : [...current, flagId] });
  };

  return (
    <SsSection label="Flags" defaultOpen={hasFlags} forceOpen={hasConflict}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 12px', alignItems: 'start' }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Rule</div>
        <div style={{ fontSize: 11, fontWeight: 600, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Flag</div>
        <div style={{ fontSize: 13, color: T.textPrimary, paddingTop: 8 }}>If answer is "Yes", add</div>
        <FlagPicker answer="Yes" selectedIds={item.flagsForYes ?? []} flags={flags} onToggle={id => toggle('Yes', id)} onCreateFlag={onCreateFlag} restrictedFlagId={restrictedFlagId} />
        <div style={{ fontSize: 13, color: T.textPrimary, paddingTop: 8 }}>If answer is "No", add</div>
        <FlagPicker answer="No" selectedIds={item.flagsForNo ?? []} flags={flags} onToggle={id => toggle('No', id)} onCreateFlag={onCreateFlag} restrictedFlagId={restrictedFlagId} />
      </div>
    </SsSection>
  );
}

function TagPicker({ options, selected, onChange, placeholder }: { options: string[]; selected: string[]; onChange: (tags: string[]) => void; placeholder: string }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setTimeout(() => inputRef.current?.focus(), 0);
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const filtered = options.filter(t => t.toLowerCase().includes(q.toLowerCase()));
  const toggle = (tag: string) => onChange(selected.includes(tag) ? selected.filter(t => t !== tag) : [...selected, tag]);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      {selected.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 6 }}>
          {selected.map(tag => (
            <span key={tag} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: T.bgAccent, color: T.textAccent, fontSize: 12, fontWeight: 500, padding: '3px 8px', borderRadius: 12 }}>
              {tag}
              <i className="ti ti-x" style={{ fontSize: 10, cursor: 'pointer' }} onClick={() => toggle(tag)} />
            </span>
          ))}
        </div>
      )}
      <button
        onClick={() => setOpen(v => !v)}
        style={{ fontFamily: T.font, fontSize: 13, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, padding: '6px 10px', background: T.surface2, border: `0.5px solid ${T.borderStrong}`, borderRadius: 6, cursor: 'pointer', color: T.textMuted }}
      >
        <span>{placeholder}</span>
        <i className="ti ti-chevron-down" style={{ fontSize: 12, flexShrink: 0, color: T.textMuted }} />
      </button>
      {open && (
        <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, background: T.surface2, border: `0.5px solid ${T.borderStrong}`, borderRadius: 8, boxShadow: '0 4px 20px rgba(0,0,0,0.12)', zIndex: 300, overflow: 'hidden' }}>
          <div style={{ padding: '8px 10px', borderBottom: `0.5px solid ${T.border}` }}>
            <input
              ref={inputRef}
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="Search…"
              style={{ fontFamily: T.font, fontSize: 13, border: 'none', outline: 'none', width: '100%', background: 'transparent', color: T.textPrimary }}
            />
          </div>
          <div style={{ maxHeight: 200, overflowY: 'auto' }}>
            {filtered.length === 0 && (
              <div style={{ padding: '10px 12px', fontSize: 13, color: T.textMuted, fontStyle: 'italic' }}>No results</div>
            )}
            {filtered.map(tag => {
              const active = selected.includes(tag);
              return (
                <div key={tag} onClick={() => toggle(tag)}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', cursor: 'pointer', fontSize: 13, color: active ? T.textAccent : T.textPrimary, background: active ? T.bgAccent : 'transparent' }}
                  onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = T.surface1; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = active ? T.bgAccent : 'transparent'; }}
                >
                  <span>{tag}</span>
                  {active && <i className="ti ti-check" style={{ fontSize: 13, color: T.textAccent }} />}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function LocationTagPicker({ selected, onChange }: { selected: string[]; onChange: (tags: string[]) => void }) {
  return <TagPicker options={LOCATION_TAGS} selected={selected} onChange={onChange} placeholder="Add location tag…" />;
}

function CAListPicker({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setTimeout(() => inputRef.current?.focus(), 0);
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const filtered = CA_LISTS.filter(l => l.title.toLowerCase().includes(q.toLowerCase()));
  const selected = CA_LISTS.find(l => l.id === value);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{ fontFamily: T.font, fontSize: 13, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, padding: '6px 10px', background: T.surface2, border: `0.5px solid ${T.borderStrong}`, borderRadius: 6, cursor: 'pointer', color: selected ? T.textPrimary : T.textMuted }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selected ? selected.title : 'Select a list…'}</span>
        <i className="ti ti-chevron-down" style={{ fontSize: 12, flexShrink: 0, color: T.textMuted }} />
      </button>
      {open && (
        <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, background: T.surface2, border: `0.5px solid ${T.borderStrong}`, borderRadius: 8, boxShadow: '0 4px 20px rgba(0,0,0,0.12)', zIndex: 300, overflow: 'hidden' }}>
          {/* Create List */}
          <div
            onClick={() => { window.open(window.location.href.split('#')[0] + '#/operate/create-list', '_blank'); setOpen(false); }}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', cursor: 'pointer', borderBottom: `0.5px solid ${T.border}` }}
            onMouseEnter={e => (e.currentTarget.style.background = T.surface1)}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <i className="ti ti-plus" style={{ fontSize: 13, color: T.textAccent }} />
            <span style={{ fontSize: 13, color: T.textAccent, fontWeight: 500 }}>Create List</span>
          </div>
          {/* Search */}
          <div style={{ padding: '8px 10px', borderBottom: `0.5px solid ${T.border}` }}>
            <input
              ref={inputRef}
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="Search lists…"
              style={{ fontFamily: T.font, fontSize: 13, width: '100%', border: `0.5px solid ${T.borderStrong}`, borderRadius: 5, padding: '5px 8px', outline: 'none', background: T.surface1 }}
            />
          </div>
          {/* Options */}
          <div style={{ maxHeight: 200, overflowY: 'auto' }}>
            {filtered.length === 0 && <div style={{ padding: '10px 12px', fontSize: 13, color: T.textMuted }}>No lists found</div>}
            {filtered.map(l => (
              <div
                key={l.id}
                onClick={() => { onChange(l.id); setOpen(false); setQ(''); }}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', cursor: 'pointer', background: value === l.id ? T.bgAccent : 'transparent' }}
                onMouseEnter={e => { if (value !== l.id) e.currentTarget.style.background = T.surface1; }}
                onMouseLeave={e => { if (value !== l.id) e.currentTarget.style.background = 'transparent'; }}
              >
                {value === l.id && <i className="ti ti-check" style={{ fontSize: 13, color: T.textAccent, flexShrink: 0 }} />}
                <span style={{ fontSize: 13, color: value === l.id ? T.textAccent : T.textPrimary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.title}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const RECORD_COLORS = [
  { value: '#378ADD', label: 'Default', bg: '#378ADD',  border: '#185FA5' },
  { value: '#43A047', label: 'Pass',    bg: '#43A047',  border: '#2E7D32' },
  { value: '#FFB300', label: 'Caution', bg: '#FFB300',  border: '#F57F17' },
  { value: '#E53935', label: 'Failed',  bg: '#E53935',  border: '#B71C1C' },
];

function MeasurementFlagSection({ item, onUpdate, flags, onCreateFlag }: { item: ListItem; onUpdate: (updates: Partial<ListItem>) => void; flags: Flag[]; onCreateFlag: (flag: Flag) => void }) {
  const ranges = item.measRanges ?? [];
  const rules = item.measFlagRules ?? [];
  const [creatingForRuleId, setCreatingForRuleId] = useState<string | null>(null);
  const [flagDropdownOpenId, setFlagDropdownOpenId] = useState<string | null>(null);

  const rangeLabel = (r: { id: string; min: string; max: string }, idx: number) =>
    `Range ${idx + 1}${r.min || r.max ? ` (${r.min || 'Min'} – ${r.max || 'Max'})` : ''}`;

  const updateRule = (id: string, patch: Partial<typeof rules[0]>) =>
    onUpdate({ measFlagRules: rules.map(r => r.id === id ? { ...r, ...patch } : r) });

  const removeRule = (id: string) =>
    onUpdate({ measFlagRules: rules.filter(r => r.id !== id) });

  const addRule = () =>
    onUpdate({ measFlagRules: [...rules, { id: mkid(), condition: 'Inside', rangeId: ranges[0]?.id ?? '', flagId: '', recordColor: '#378ADD' }] });

  const rangeOptions = ranges.map((r, i) => ({ value: r.id, label: rangeLabel(r, i) }));

  return (
    <SsSection label="Flags">
      {rules.map((rule, idx) => (
        <div key={rule.id}>
          {idx > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '12px 0' }}>
              <div style={{ flex: 1, height: '0.5px', background: T.border }} />
              <span style={{ fontSize: 11, fontWeight: 600, color: T.textMuted, letterSpacing: '0.05em' }}>OR</span>
              <div style={{ flex: 1, height: '0.5px', background: T.border }} />
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: T.textMuted, textTransform: 'uppercase' }}>Rule {idx + 1}</span>
            <button onClick={() => removeRule(rule.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.textDanger, fontSize: 13, display: 'flex', alignItems: 'center', gap: 3 }}><i className="ti ti-x" />Remove</button>
          </div>
          <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 4 }}>Condition</div>
          <Select value={rule.condition} onChange={v => updateRule(rule.id, { condition: v })} options={[{ value: 'Inside', label: 'Inside range' }, { value: 'Outside', label: 'Outside range' }, { value: 'Above', label: 'Above range' }, { value: 'Below', label: 'Below range' }]} style={{ width: '100%', marginBottom: 8 }} />
          <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 4 }}>Range</div>
          <Select value={rule.rangeId} onChange={v => updateRule(rule.id, { rangeId: v })} options={rangeOptions} style={{ width: '100%', marginBottom: 8 }} />
          <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 4 }}>Flag</div>
          <div style={{ position: 'relative', marginBottom: 8 }}>
            <div onClick={() => { setFlagDropdownOpenId(flagDropdownOpenId === rule.id ? null : rule.id); setCreatingForRuleId(null); }}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: `0.5px solid ${T.borderStrong}`, borderRadius: 6, padding: '6px 10px', cursor: 'pointer', background: T.surface2, fontSize: 13, color: rule.flagId ? T.textPrimary : T.textMuted }}>
              <span>{rule.flagId ? (() => { const f = flags.find(x => x.id === rule.flagId); return f ? `${f.emoji ? f.emoji + ' ' : ''}${f.name}` : '— none —'; })() : '— none —'}</span>
              <i className="ti ti-chevron-down" style={{ fontSize: 11, color: T.textMuted }} />
            </div>
            {flagDropdownOpenId === rule.id && !creatingForRuleId && (
              <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, background: T.surface2, border: `0.5px solid ${T.borderStrong}`, borderRadius: 8, boxShadow: '0 4px 20px rgba(0,0,0,0.12)', zIndex: 300, overflow: 'hidden' }}>
                <div onClick={() => { setCreatingForRuleId(rule.id); setFlagDropdownOpenId(null); }}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', cursor: 'pointer', borderBottom: `0.5px solid ${T.border}`, fontSize: 13, color: T.textAccent, fontWeight: 500 }}
                  onMouseEnter={e => (e.currentTarget.style.background = T.surface1)} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  <i className="ti ti-plus" style={{ fontSize: 12 }} /> Create new flag…
                </div>
                <div onClick={() => { updateRule(rule.id, { flagId: '' }); setFlagDropdownOpenId(null); }}
                  style={{ padding: '8px 12px', cursor: 'pointer', fontSize: 13, color: T.textMuted, fontStyle: 'italic' }}
                  onMouseEnter={e => (e.currentTarget.style.background = T.surface1)} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  — none —
                </div>
                {flags.map(f => (
                  <div key={f.id} onClick={() => { updateRule(rule.id, { flagId: f.id }); setFlagDropdownOpenId(null); }}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', cursor: 'pointer', fontSize: 13, color: T.textPrimary, background: rule.flagId === f.id ? T.surface1 : 'transparent' }}
                    onMouseEnter={e => (e.currentTarget.style.background = T.surface0)} onMouseLeave={e => (e.currentTarget.style.background = rule.flagId === f.id ? T.surface1 : 'transparent')}>
                    {rule.flagId === f.id && <i className="ti ti-check" style={{ fontSize: 12, color: T.textAccent, flexShrink: 0 }} />}
                    {f.emoji && <span>{f.emoji}</span>}<span>{f.name}</span>
                  </div>
                ))}
              </div>
            )}
            {creatingForRuleId === rule.id && (
              <FlagCreateForm
                onCreateFlag={flag => { onCreateFlag(flag); updateRule(rule.id, { flagId: flag.id }); }}
                onCancel={() => setCreatingForRuleId(null)}
                pendingAnswer="Yes"
                onSelect={() => setCreatingForRuleId(null)}
              />
            )}
          </div>
          <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 6 }}>Record Color</div>
          <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 8 }}>Change device screen color when flag triggers</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {RECORD_COLORS.map(c => {
              const selected = rule.recordColor === c.value;
              return (
                <div key={c.value} onClick={() => updateRule(rule.id, { recordColor: c.value })}
                  title={c.label}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
                  <div style={{ width: 28, height: 28, borderRadius: 6, background: c.bg, border: `2px solid ${selected ? c.border : T.borderStrong}`, outline: selected ? `2px solid ${T.textAccent}` : 'none', outlineOffset: 2 }} />
                  <span style={{ fontSize: 10, color: selected ? T.textAccent : T.textMuted }}>{c.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      ))}
      <button onClick={addRule} style={{ fontFamily: T.font, fontSize: 12, color: T.textAccent, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, marginTop: rules.length > 0 ? 16 : 0 }}>
        <i className="ti ti-plus" style={{ fontSize: 12 }} /> Add Rule
      </button>
    </SsSection>
  );
}

function MCCASection({ item, onUpdate, markAs }: { item: ListItem; onUpdate: (updates: Partial<ListItem>) => void; markAs: string | null }) {
  const forNA = item.caForNA ?? false;
  const mcRules = item.caForMCRules ?? [];
  const choices = item.choices ?? [];

  const addRule = () => onUpdate({ caForMCRules: [...mcRules, { id: mkid(), condition: choices[0]?.id ?? '', caList: '', adHoc: false, nextStep: 'repeat-item' }] });
  const removeRule = (id: string) => onUpdate({ caForMCRules: mcRules.filter(r => r.id !== id) });
  const updateRule = (id: string, updates: Partial<CARule>) => onUpdate({ caForMCRules: mcRules.map(r => r.id === id ? { ...r, ...updates } : r) });

  const choiceOptions = choices.map(c => ({ value: c.id, label: c.label || '(unnamed)' }));

  return (
    <SsSection label="Corrective Action" defaultOpen={!!(item.caForNA || mcRules.length > 0)}>
      {/* For N/A / OOO */}
      {markAs && (
        <>
          <div style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: forNA ? 10 : 0 }}>
              <span style={{ fontSize: 13, color: T.textPrimary, fontWeight: 500 }}>For {markAs}</span>
              <Toggle on={forNA} onChange={v => onUpdate({ caForNA: v })} />
            </div>
            {forNA && (
              <div style={{ paddingTop: 10, marginTop: 8 }}>
                {!item.caForNAAdHoc && (
                  <>
                    <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 6 }}>CA list</div>
                    <div style={{ marginBottom: 8 }}><CAListPicker value={item.caForNAList ?? ''} onChange={v => onUpdate({ caForNAList: v })} /></div>
                  </>
                )}
                <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 6 }}>Next step</div>
                <Select value={item.caForNANextStep ?? 'repeat-item'} onChange={v => onUpdate({ caForNANextStep: v })} options={[{ value: 'repeat-item', label: 'Repeat this item' }, { value: 'repeat-list', label: 'Repeat this list' }, { value: 'no-repeat', label: 'Do not repeat' }]} style={{ width: '100%', marginBottom: 12 }} />
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span style={{ fontSize: 13, color: T.textPrimary }}>Corrective action is optional</span>
                  <Toggle on={!!item.caForNAOptional} onChange={v => onUpdate({ caForNAOptional: v })} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 13, color: T.textPrimary }}>Ad hoc</span>
                  <Toggle on={!!item.caForNAAdHoc} onChange={v => onUpdate({ caForNAAdHoc: v, ...(v ? { caForNAList: '' } : {}) })} />
                </div>
                <div style={{ fontSize: 11, color: T.textMuted, marginTop: 3 }}>Corrective action list is created on the app.</div>
              </div>
            )}
          </div>
          <div style={{ borderTop: `0.5px solid ${T.border}`, marginBottom: 12 }} />
        </>
      )}

      {/* For choices */}
      <div style={{ paddingTop: markAs ? 0 : 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: mcRules.length > 0 ? 10 : 0 }}>
          <span style={{ fontSize: 13, color: T.textPrimary, fontWeight: 500 }}>For choices</span>
          <Toggle on={mcRules.length > 0} onChange={v => { if (v && mcRules.length === 0) addRule(); else if (!v) onUpdate({ caForMCRules: [] }); }} />
        </div>
        {mcRules.length > 0 && choices.length === 0 && (
          <div style={{ fontSize: 12, color: T.textMuted, marginTop: 4 }}>Add choices above before configuring rules.</div>
        )}
        {mcRules.map((rule, idx) => (
          <div key={rule.id} style={{ paddingTop: 10, marginTop: 8 }}>
            {idx > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <div style={{ flex: 1, height: '0.5px', background: T.border }} />
                <span style={{ fontSize: 11, fontWeight: 600, color: T.textMuted, letterSpacing: '0.05em' }}>OR</span>
                <div style={{ flex: 1, height: '0.5px', background: T.border }} />
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: T.textMuted, textTransform: 'uppercase' }}>Rule {idx + 1}</span>
              <button onClick={() => removeRule(rule.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.textDanger, fontSize: 13, display: 'flex', alignItems: 'center', gap: 3 }}><i className="ti ti-x" />Remove</button>
            </div>
            <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 4 }}>Choice</div>
            <Select value={rule.condition ?? ''} onChange={v => updateRule(rule.id, { condition: v })}
              options={(() => {
                const usedByOthers = mcRules.filter(r => r.id !== rule.id).map(r => r.condition);
                const available = choiceOptions.filter(o => !usedByOthers.includes(o.value));
                return available.length > 0 ? available : [{ value: '', label: 'No choices available' }];
              })()}
              style={{ width: '100%', marginBottom: 8 }} />
            {!rule.adHoc && (
              <>
                <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 4 }}>CA list</div>
                <div style={{ marginBottom: 8 }}><CAListPicker value={rule.caList ?? ''} onChange={v => updateRule(rule.id, { caList: v })} /></div>
              </>
            )}
            <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 6 }}>Next step</div>
            <Select value={rule.nextStep ?? 'repeat-item'} onChange={v => updateRule(rule.id, { nextStep: v as CARule['nextStep'] })} options={[{ value: 'repeat-item', label: 'Repeat this item' }, { value: 'repeat-list', label: 'Repeat this list' }, { value: 'no-repeat', label: 'Do not repeat' }]} style={{ width: '100%', marginBottom: 12 }} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontSize: 13, color: T.textPrimary }}>Corrective action is optional</span>
              <Toggle on={!!rule.optional} onChange={v => updateRule(rule.id, { optional: v })} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, color: T.textPrimary }}>Ad hoc</span>
              <Toggle on={rule.adHoc} onChange={v => updateRule(rule.id, { adHoc: v, ...(v ? { caList: '' } : {}) })} />
            </div>
            <div style={{ fontSize: 11, color: T.textMuted, marginTop: 3 }}>Corrective action list is created on the app.</div>
          </div>
        ))}
        {mcRules.length > 0 && mcRules.length < choices.length && (
          <button onClick={addRule} style={{ fontFamily: T.font, fontSize: 12, color: T.textAccent, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, marginTop: 16 }}>
            <i className="ti ti-plus" style={{ fontSize: 12 }} /> Add Rule
          </button>
        )}
      </div>
    </SsSection>
  );
}

function CASection({ item, onUpdate, markAs }: { item: ListItem; onUpdate: (updates: Partial<ListItem>) => void; markAs: string | null }) {
  const forNA = item.caForNA ?? false;
  const ynRules = item.caForYNRules ?? [];
  const forRanges = item.caForRanges ?? false;
  const rangeRules = item.caForRangeRules ?? [];
  const isMeas = item.type === 'measurement';

  const setForNA = (v: boolean) => onUpdate({ caForNA: v });
  const setForRanges = (v: boolean) => onUpdate({ caForRanges: v });
  const updateYNRule = (id: string, updates: Partial<CARule>) => onUpdate({ caForYNRules: ynRules.map(r => r.id === id ? { ...r, ...updates } : r) });
  const addYNRule = () => { const taken = ynRules[0]?.condition ?? 'No'; onUpdate({ caForYNRules: [...ynRules, { id: mkid(), condition: taken === 'No' ? 'Yes' : 'No', caList: '', adHoc: false, nextStep: 'repeat-item' }] }); };
  const removeYNRule = (id: string) => onUpdate({ caForYNRules: ynRules.filter(r => r.id !== id) });

  return (
    <SsSection label="Corrective Action" defaultOpen={!!(item.caForNA || (item.caForYNRules?.length ?? 0) > 0 || item.caForRanges)}>
      {/* For N/A / OOO — only shown when markAs is set */}
      {markAs && (
        <>
          <div style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: forNA ? 10 : 0 }}>
              <span style={{ fontSize: 13, color: T.textPrimary, fontWeight: 500 }}>For {markAs}</span>
              <Toggle on={forNA} onChange={setForNA} />
            </div>
            {forNA && (
              <div style={{ paddingTop: 10, marginTop: 8 }}>
                {!item.caForNAAdHoc && (
                  <>
                    <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 6 }}>CA list</div>
                    <div style={{ marginBottom: 8 }}><CAListPicker value={item.caForNAList ?? ''} onChange={v => onUpdate({ caForNAList: v })} /></div>
                  </>
                )}
                <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 6 }}>Next step</div>
                <Select value={item.caForNANextStep ?? 'repeat-item'} onChange={v => onUpdate({ caForNANextStep: v })} options={[{ value: 'repeat-item', label: 'Repeat this item' }, { value: 'repeat-list', label: 'Repeat this list' }, { value: 'no-repeat', label: 'Do not repeat' }]} style={{ width: '100%', marginBottom: 12 }} />
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span style={{ fontSize: 13, color: T.textPrimary }}>Corrective action is optional</span>
                  <Toggle on={!!item.caForNAOptional} onChange={v => onUpdate({ caForNAOptional: v })} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 13, color: T.textPrimary }}>Ad hoc</span>
                  <Toggle on={!!item.caForNAAdHoc} onChange={v => onUpdate({ caForNAAdHoc: v, ...(v ? { caForNAList: '' } : {}) })} />
                </div>
                <div style={{ fontSize: 11, color: T.textMuted, marginTop: 3 }}>Corrective action list is created on the app.</div>
              </div>
            )}
          </div>
          <div style={{ borderTop: `0.5px solid ${T.border}`, marginBottom: 12 }} />
        </>
      )}
      {/* For Yes/No or ranges */}
      {markAs && <div style={{ borderTop: `0.5px solid ${T.border}`, marginTop: forNA ? 12 : 0 }} />}
      <div style={{ marginTop: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: (isMeas ? forRanges : ynRules.length > 0) ? 10 : 0 }}>
          <span style={{ fontSize: 13, color: T.textPrimary, fontWeight: 500 }}>{isMeas ? 'For ranges' : 'For Yes/No'}</span>
          <Toggle on={isMeas ? forRanges : ynRules.length > 0} onChange={v => { if (isMeas) { setForRanges(v); if (v && rangeRules.length === 0) onUpdate({ caForRanges: true, caForRangeRules: [{ id: mkid(), rangeId: item.measRanges?.[0]?.id ?? '', condition: 'Inside', caList: '', adHoc: false, nextStep: 'repeat-item' }] }); else if (!v) onUpdate({ caForRanges: false, caForRangeRules: [] }); } else { if (v && ynRules.length === 0) addYNRule(); else if (!v) onUpdate({ caForYNRules: [] }); } }} />
        </div>
        {!isMeas && ynRules.map((rule, idx) => (
          <div key={rule.id} style={{ paddingTop: 10, marginTop: 8 }}>
            {idx > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <div style={{ flex: 1, height: '0.5px', background: T.border }} />
                <span style={{ fontSize: 11, fontWeight: 600, color: T.textMuted, letterSpacing: '0.05em' }}>OR</span>
                <div style={{ flex: 1, height: '0.5px', background: T.border }} />
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: T.textMuted, textTransform: 'uppercase' }}>Rule {idx + 1}</span>
              <button onClick={() => removeYNRule(rule.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.textDanger, fontSize: 13, display: 'flex', alignItems: 'center', gap: 3 }}><i className="ti ti-x" />Remove</button>
            </div>
            <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 4 }}>Condition</div>
            <Select value={rule.condition ?? 'No'} onChange={v => updateYNRule(rule.id, { condition: v })} options={[{ value: 'No', label: 'No' }, { value: 'Yes', label: 'Yes' }].filter(o => idx === 0 || o.value !== (ynRules[0]?.condition ?? 'No'))} style={{ width: '100%', marginBottom: 8 }} />
            {!rule.adHoc && (
              <>
                <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 4 }}>CA list</div>
                <div style={{ marginBottom: 8 }}><CAListPicker value={rule.caList ?? ''} onChange={v => updateYNRule(rule.id, { caList: v })} /></div>
              </>
            )}
            <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 6 }}>Next step</div>
            <Select value={rule.nextStep ?? 'repeat-item'} onChange={v => updateYNRule(rule.id, { nextStep: v as CARule['nextStep'] })} options={[{ value: 'repeat-item', label: 'Repeat this item' }, { value: 'repeat-list', label: 'Repeat this list' }, { value: 'no-repeat', label: 'Do not repeat' }]} style={{ width: '100%', marginBottom: 12 }} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontSize: 13, color: T.textPrimary }}>Corrective action is optional</span>
              <Toggle on={!!rule.optional} onChange={v => updateYNRule(rule.id, { optional: v })} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, color: T.textPrimary }}>Ad hoc</span>
              <Toggle on={rule.adHoc} onChange={v => updateYNRule(rule.id, { adHoc: v, ...(v ? { caList: '' } : {}) })} />
            </div>
            <div style={{ fontSize: 11, color: T.textMuted, marginTop: 3 }}>Corrective action list is created on the app.</div>
          </div>
        ))}
        {!isMeas && ynRules.length < 2 && ynRules.length > 0 && (
          <button onClick={addYNRule} style={{ fontFamily: T.font, fontSize: 12, color: T.textAccent, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, marginTop: 16 }}>
            <i className="ti ti-plus" style={{ fontSize: 12 }} /> Add Condition
          </button>
        )}
        {isMeas && forRanges && (() => {
          const measRanges = item.measRanges ?? [];
          const updateRangeRule = (id: string, updates: Partial<CARule>) => onUpdate({ caForRangeRules: rangeRules.map(r => r.id === id ? { ...r, ...updates } : r) });
          const removeRangeRule = (id: string) => onUpdate({ caForRangeRules: rangeRules.filter(r => r.id !== id) });
          const addRangeRule = () => onUpdate({ caForRangeRules: [...rangeRules, { id: mkid(), rangeId: measRanges[0]?.id ?? '', condition: 'Inside', caList: '', adHoc: false, nextStep: 'repeat-item' }] });
          const rangeOptions = measRanges.length > 0
            ? measRanges.map((r, i) => ({ value: r.id, label: `Range ${i + 1}${r.min || r.max ? ` (${r.min || 'Min'} – ${r.max || 'Max'})` : ''}` }))
            : [{ value: '', label: 'No ranges defined' }];
          return (
            <div style={{ borderTop: `0.5px solid ${T.border}`, paddingTop: 10, marginTop: 8 }}>
              {rangeRules.map((rule, idx) => (
                <div key={rule.id}>
                  {idx > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '12px 0' }}>
                      <div style={{ flex: 1, height: '0.5px', background: T.border }} />
                      <span style={{ fontSize: 11, fontWeight: 600, color: T.textMuted, letterSpacing: '0.05em' }}>OR</span>
                      <div style={{ flex: 1, height: '0.5px', background: T.border }} />
                    </div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: T.textMuted, textTransform: 'uppercase' }}>Rule {idx + 1}</span>
                    <button onClick={() => removeRangeRule(rule.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.textDanger, fontSize: 13, display: 'flex', alignItems: 'center', gap: 3 }}><i className="ti ti-x" />Remove</button>
                  </div>
                  <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 4 }}>Range</div>
                  <Select value={rule.rangeId ?? ''} onChange={v => updateRangeRule(rule.id, { rangeId: v })} options={rangeOptions} style={{ width: '100%', marginBottom: 8 }} />
                  <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 4 }}>Condition</div>
                  <Select value={rule.condition ?? 'Inside'} onChange={v => updateRangeRule(rule.id, { condition: v })} options={[{ value: 'Inside', label: 'Inside range' }, { value: 'Outside', label: 'Outside range' }, { value: 'Above', label: 'Above range' }, { value: 'Below', label: 'Below range' }]} style={{ width: '100%', marginBottom: 8 }} />
                  {!rule.adHoc && (
                    <>
                      <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 4 }}>CA list</div>
                      <div style={{ marginBottom: 8 }}><CAListPicker value={rule.caList ?? ''} onChange={v => updateRangeRule(rule.id, { caList: v })} /></div>
                    </>
                  )}
                  <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 4 }}>Next step</div>
                  <Select value={rule.nextStep ?? 'repeat-item'} onChange={v => updateRangeRule(rule.id, { nextStep: v as CARule['nextStep'] })} options={[{ value: 'repeat-item', label: 'Repeat this item' }, { value: 'repeat-list', label: 'Repeat this list' }, { value: 'no-repeat', label: 'Do not repeat' }]} style={{ width: '100%', marginBottom: 12 }} />
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <span style={{ fontSize: 13, color: T.textPrimary }}>Corrective action is optional</span>
                    <Toggle on={!!rule.optional} onChange={v => updateRangeRule(rule.id, { optional: v })} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 13, color: T.textPrimary }}>Ad hoc</span>
                    <Toggle on={rule.adHoc} onChange={v => updateRangeRule(rule.id, { adHoc: v, ...(v ? { caList: '' } : {}) })} />
                  </div>
                  <div style={{ fontSize: 11, color: T.textMuted, marginTop: 3 }}>Corrective action list is created on the app.</div>
                </div>
              ))}
              <button onClick={addRangeRule} style={{ fontFamily: T.font, fontSize: 12, color: T.textAccent, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, marginTop: 16 }}>
                <i className="ti ti-plus" style={{ fontSize: 12 }} /> Add Rule
              </button>
            </div>
          );
        })()}
      </div>
    </SsSection>
  );
}

const MC_TEMPLATES: { id: string; name: string; choices: MCChoice[] }[] = [
  { id: 'tpl-1', name: 'Yes / No / N/A', choices: [
    { id: 't1a', label: 'Yes',  color: '#43A047', icon: 'ti-check' },
    { id: 't1b', label: 'No',   color: '#E53935', icon: 'ti-x' },
    { id: 't1c', label: 'N/A',  color: '#546E7A', icon: null },
  ]},
  { id: 'tpl-2', name: 'Pass / Fail', choices: [
    { id: 't2a', label: 'Pass', color: '#43A047', icon: 'ti-circle-check', score: 1 },
    { id: 't2b', label: 'Fail', color: '#E53935', icon: 'ti-alert-circle', score: 0, flagIds: ['f1'], followUpEnabled: true, followUpActions: ['Document the failure with photos', 'Notify supervisor immediately'] },
  ]},
  { id: 'tpl-3', name: 'Condition Rating', choices: [
    { id: 't3a', label: 'Excellent', color: '#1E88E5', icon: 'ti-star',         score: 4 },
    { id: 't3b', label: 'Good',      color: '#43A047', icon: null,              score: 3 },
    { id: 't3c', label: 'Fair',      color: '#FDD835', icon: null,              score: 2, followUpEnabled: true, followUpActions: ['Schedule maintenance within 30 days'] },
    { id: 't3d', label: 'Poor',      color: '#FB8C00', icon: null,              score: 1, flagIds: ['f2'], followUpEnabled: true, followUpActions: ['Schedule maintenance within 7 days', 'Log in work order system'] },
    { id: 't3e', label: 'Failing',   color: '#E53935', icon: 'ti-alert-circle', score: 0, flagIds: ['f1', 'f2'], followUpEnabled: true, followUpActions: ['Take out of service immediately', 'Contact facilities manager', 'File incident report'] },
  ]},
  { id: 'tpl-4', name: 'Cancel Check', choices: [
    { id: 't4a', label: 'Cancelled', color: '#E53935', icon: 'ti-x',           flagIds: ['f2'], followUpEnabled: true, followUpActions: ['Record reason for cancellation'] },
    { id: 't4b', label: 'Completed', color: '#43A047', icon: 'ti-circle-check', score: 1 },
  ]},
  { id: 'tpl-5', name: 'Root Causes: Motor', choices: [
    { id: 't5a', label: 'Overheating', color: '#FB8C00', icon: 'ti-flame',    flagIds: ['f1'], followUpEnabled: true, followUpActions: ['Check coolant levels', 'Inspect fan and vents'] },
    { id: 't5b', label: 'Vibration',   color: '#FDD835', icon: null,           followUpEnabled: true, followUpActions: ['Check mounting bolts', 'Inspect bearings'] },
    { id: 't5c', label: 'Noise',       color: '#FDD835', icon: null,           followUpEnabled: true, followUpActions: ['Record audio sample', 'Check lubrication'] },
    { id: 't5d', label: 'Leaking',     color: '#1E88E5', icon: 'ti-droplet',  flagIds: ['f2'], followUpEnabled: true, followUpActions: ['Identify leak source', 'Place drip pan', 'Schedule repair'] },
    { id: 't5e', label: 'Not running', color: '#E53935', icon: 'ti-bolt',     flagIds: ['f1', 'f2'], followUpEnabled: true, followUpActions: ['Check power supply', 'Check circuit breaker', 'Contact electrician if no power issue found'] },
  ]},
];

const MC_COLORS = ['','#E53935','#FB8C00','#FDD835','#43A047','#1E88E5','#8E24AA','#00ACC1','#6D4C41','#546E7A','#F48FB1','#A5D6A7','#90CAF9','#CE93D8','#FFE082','#BCAAA4','#B0BEC5','#EF9A9A','#1A1A1F'];
const MC_ICONS = ['ti-star','ti-heart','ti-thumb-up','ti-thumb-down','ti-flame','ti-leaf','ti-droplet','ti-bolt','ti-circle-check','ti-alert-circle','ti-info-circle','ti-award','ti-crown','ti-diamond','ti-clock','ti-home','ti-map-pin','ti-user','ti-briefcase','ti-truck','ti-coffee','ti-tool','ti-flag','ti-mood-smile'];

function FollowUpPanel({ c, onUpdate }: { c: MCChoice; onUpdate?: (id: string, u: Partial<MCChoice>) => void }) {
  const [newAction, setNewAction] = useState('');
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editingText, setEditingText] = useState('');
  const addInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (c.followUpEnabled) setTimeout(() => addInputRef.current?.focus(), 0);
  }, [c.followUpEnabled]);

  const actions = c.followUpActions ?? [];

  const addAction = () => {
    const trimmed = newAction.trim();
    if (!trimmed) return;
    onUpdate?.(c.id, { followUpActions: [...actions, trimmed] });
    setNewAction('');
    addInputRef.current?.focus();
  };

  const removeAction = (idx: number) =>
    onUpdate?.(c.id, { followUpActions: actions.filter((_, i) => i !== idx) });

  const saveEdit = (idx: number) => {
    const trimmed = editingText.trim();
    if (trimmed) onUpdate?.(c.id, { followUpActions: actions.map((a, i) => i === idx ? trimmed : a) });
    setEditingIdx(null);
  };

  return (
    <div style={{ padding: '12px 12px 14px', borderTop: `0.5px solid ${T.border}`, background: T.surface1, borderRadius: '0 0 8px 8px' }}>
      {/* Toggle */}
      <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', marginBottom: c.followUpEnabled ? 12 : 0 }}>
        <div onClick={() => onUpdate?.(c.id, { followUpEnabled: !c.followUpEnabled, followUpActions: c.followUpActions ?? [] })}
          style={{ width: 32, height: 18, borderRadius: 9, background: c.followUpEnabled ? T.fillAccent : T.borderStrong, position: 'relative', flexShrink: 0, transition: 'background 0.15s', cursor: 'pointer' }}>
          <div style={{ position: 'absolute', top: 2, left: c.followUpEnabled ? 16 : 2, width: 14, height: 14, borderRadius: '50%', background: 'white', transition: 'left 0.15s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
        </div>
        <span style={{ fontSize: 13, color: T.textPrimary }}>Trigger a follow-up action with this answer</span>
      </label>

      {c.followUpEnabled && (
        <>
          {onUpdate && <p style={{ fontSize: 12, color: T.textMuted, margin: '0 0 10px' }}>Optionally add predefined actions to help your auditor complete the inspection.</p>}

          {/* Add new action — editable only */}
          {onUpdate && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: actions.length > 0 ? 8 : 0 }}>
              <input ref={addInputRef} value={newAction} onChange={e => setNewAction(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') addAction(); }}
                placeholder="Describe a follow-up action…"
                style={{ fontFamily: T.font, fontSize: 13, flex: 1, border: `0.5px solid ${T.borderStrong}`, borderRadius: 5, padding: '5px 8px', background: T.surface0 }} />
              <button onClick={addAction} disabled={!newAction.trim()}
                style={{ fontFamily: T.font, fontSize: 12, fontWeight: 600, padding: '5px 12px', borderRadius: 5, border: 'none', background: newAction.trim() ? T.fillAccent : T.borderStrong, color: 'white', cursor: newAction.trim() ? 'pointer' : 'default', flexShrink: 0 }}>
                Add
              </button>
            </div>
          )}

          {/* Existing actions */}
          {actions.map((action, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              {!onUpdate
                ? <div style={{ flex: 1, fontSize: 13, color: T.textPrimary, padding: '5px 8px', background: T.surface0, border: `0.5px solid ${T.border}`, borderRadius: 5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {action}
                  </div>
                : editingIdx === idx
                  ? <input autoFocus value={editingText} onChange={e => setEditingText(e.target.value)}
                      onBlur={() => saveEdit(idx)}
                      onKeyDown={e => { if (e.key === 'Enter') saveEdit(idx); if (e.key === 'Escape') setEditingIdx(null); }}
                      style={{ fontFamily: T.font, fontSize: 13, flex: 1, border: `0.5px solid ${T.borderAccent}`, borderRadius: 5, padding: '5px 8px' }} />
                  : <div onClick={() => { setEditingIdx(idx); setEditingText(action); }}
                      style={{ flex: 1, fontSize: 13, color: T.textPrimary, padding: '5px 8px', background: T.surface0, border: `0.5px solid ${T.borderStrong}`, borderRadius: 5, cursor: 'text', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {action}
                    </div>
              }
              {onUpdate && (
                <button onClick={() => removeAction(idx)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.textMuted, fontSize: 14, display: 'flex', flexShrink: 0 }}>
                  <i className="ti ti-x" />
                </button>
              )}
            </div>
          ))}
        </>
      )}
    </div>
  );
}

function MCChoiceRow({ c, idx, locked, flags, onUpdate, onRemove, focusId, onFocused }: {
  c: MCChoice; idx: number; locked: boolean; flags: Flag[];
  onUpdate?: (id: string, u: Partial<MCChoice>) => void;
  onRemove?: (id: string) => void;
  focusId?: string; onFocused?: () => void;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerTab, setPickerTab] = useState<'color' | 'icon'>('color');
  const [expandedPanel, setExpandedPanel] = useState<'flag' | 'ca' | null>(null);
  const pickerRef = useRef<HTMLDivElement>(null);
  const rowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!pickerOpen) return;
    const handler = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) setPickerOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [pickerOpen]);

  useEffect(() => {
    if (!expandedPanel) return;
    const handler = (e: MouseEvent) => {
      if (rowRef.current && !e.composedPath().includes(rowRef.current)) setExpandedPanel(null);
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [expandedPanel]);

  const hasFlag = (c.flagIds?.length ?? 0) > 0;
  const hasCa = !!c.followUpEnabled;

  const togglePanel = (panel: 'flag' | 'ca') =>
    setExpandedPanel(prev => prev === panel ? null : panel);

  return (
    <div ref={rowRef} style={{ marginBottom: 8, position: 'relative', border: `0.5px solid ${T.borderStrong}`, borderRadius: 8, background: T.surface0, overflow: 'visible' }}
>

      {/* Line 1: drag · circle · text · delete */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 8px' }}>
        {!locked && <i className="ti ti-grip-vertical" style={{ fontSize: 13, color: T.textMuted, cursor: 'grab', flexShrink: 0 }} />}
        <div onClick={() => { if (!locked) { setPickerOpen(o => !o); setPickerTab('color'); } }}
          style={{ width: 26, height: 26, borderRadius: '50%', background: c.color || 'transparent', border: c.color ? 'none' : `1.5px dashed ${T.borderStrong}`, cursor: locked ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, opacity: locked ? 0.7 : 1 }}>
          {c.icon && <i className={`ti ${c.icon}`} style={{ fontSize: 13, color: c.color ? 'white' : T.textMuted }} />}
          {!c.icon && !c.color && !locked && <i className="ti ti-plus" style={{ fontSize: 11, color: T.textMuted }} />}
        </div>
        {locked
          ? <span style={{ flex: 1, fontSize: 13, color: T.textPrimary, padding: '5px 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.label || <span style={{ color: T.textMuted, fontStyle: 'italic' }}>Choice {idx + 1}</span>}</span>
          : <input ref={el => { if (el && c.id === focusId) { el.focus(); onFocused?.(); } }} value={c.label} onChange={e => onUpdate?.(c.id, { label: e.target.value })} placeholder={`Choice ${idx + 1}`} style={{ fontFamily: T.font, fontSize: 13, border: `0.5px solid ${T.borderStrong}`, borderRadius: 5, padding: '5px 8px', flex: 1, minWidth: 0 }} />
        }
        {!locked && <button onClick={() => onRemove?.(c.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.textMuted, fontSize: 14, display: 'flex', flexShrink: 0 }}><i className="ti ti-x" /></button>}
      </div>

      {/* Line 2: score · flag · follow-up */}
      {(!locked || (c.score !== undefined && c.score !== '') || hasFlag || hasCa) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px 6px 38px', borderTop: `0.5px solid ${T.border}` }}>
          {/* Score */}
          {(!locked || (c.score !== undefined && c.score !== '')) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: 11, color: T.textMuted }}>Score</span>
              {locked
                ? <span style={{ fontSize: 12, color: T.textPrimary, padding: '2px 10px', border: `0.5px solid ${T.border}`, borderRadius: 4, background: T.surface1, minWidth: 72, textAlign: 'center', display: 'inline-block' }}>{c.score ?? '—'}</span>
                : <input type="number" value={c.score ?? ''}
                    onFocus={() => { if (c.score === undefined || c.score === '') onUpdate?.(c.id, { score: 0 }); }}
                    onChange={e => onUpdate?.(c.id, { score: e.target.value === '' ? '' : Number(e.target.value) })}
                    placeholder="—"
                    style={{ fontFamily: T.font, fontSize: 12, width: 72, border: `0.5px solid ${T.borderStrong}`, borderRadius: 4, padding: '2px 10px', textAlign: 'center', color: T.textPrimary }} />
              }
            </div>
          )}

          {(!locked || (c.score !== undefined && c.score !== '') || hasFlag || hasCa) && <div style={{ width: 1, height: 14, background: T.border }} />}

          {/* Flag indicator/button */}
          {(!locked || hasFlag) && (
            locked
              ? <span onClick={() => togglePanel('flag')} style={{ fontSize: 11, fontWeight: 500, padding: '2px 8px', borderRadius: 4, border: `0.5px solid #F57F17`, background: '#FFF8E1', color: '#F57F17', display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
                  <i className="ti ti-flag" style={{ fontSize: 11 }} /> Flag ({c.flagIds!.length})
                </span>
              : <button onClick={() => togglePanel('flag')}
                  style={{ fontFamily: T.font, fontSize: 11, fontWeight: 500, padding: '2px 8px', borderRadius: 4, border: `0.5px solid ${hasFlag ? '#F57F17' : T.borderStrong}`, background: hasFlag ? '#FFF8E1' : expandedPanel === 'flag' ? T.surface1 : 'transparent', color: hasFlag ? '#F57F17' : T.textMuted, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <i className="ti ti-flag" style={{ fontSize: 11 }} />
                  {hasFlag ? `Flag (${c.flagIds!.length})` : 'Flag'}
                </button>
          )}

          {/* Follow-up indicator/button */}
          {(!locked || hasCa) && (
            locked
              ? <span onClick={() => togglePanel('ca')} style={{ fontSize: 11, fontWeight: 500, padding: '2px 8px', borderRadius: 4, border: `0.5px solid ${T.borderAccent}`, background: T.bgAccent, color: T.textAccent, display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
                  <i className="ti ti-arrow-back-up" style={{ fontSize: 11 }} /> Follow-up ✓
                </span>
              : <button onClick={() => togglePanel('ca')}
                  style={{ fontFamily: T.font, fontSize: 11, fontWeight: 500, padding: '2px 8px', borderRadius: 4, border: `0.5px solid ${hasCa ? T.borderAccent : T.borderStrong}`, background: hasCa ? T.bgAccent : expandedPanel === 'ca' ? T.surface1 : 'transparent', color: hasCa ? T.textAccent : T.textMuted, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <i className="ti ti-arrow-back-up" style={{ fontSize: 11 }} />
                  {hasCa ? 'Follow-up ✓' : 'Follow-up'}
                </button>
          )}
        </div>
      )}

      {/* Expanded: Flag panel (read-only when locked) */}
      {expandedPanel === 'flag' && (
        <div style={{ padding: '10px 12px', borderTop: `0.5px solid ${T.border}`, background: T.surface1, borderRadius: '0 0 8px 8px' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Flags</div>
          {flags.filter(f => locked ? c.flagIds?.includes(f.id) : true).map(f => {
            const selected = c.flagIds?.includes(f.id) ?? false;
            return locked
              ? <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: f.color, flexShrink: 0, display: 'inline-block' }} />
                  <span style={{ fontSize: 13, color: T.textPrimary }}>{f.name}</span>
                </div>
              : <label key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, cursor: 'pointer' }}>
                  <input type="checkbox" checked={selected} onChange={() => {
                    const current = c.flagIds ?? [];
                    onUpdate?.(c.id, { flagIds: selected ? current.filter(x => x !== f.id) : [...current, f.id] });
                  }} />
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: f.color, flexShrink: 0, display: 'inline-block' }} />
                  <span style={{ fontSize: 13, color: T.textPrimary }}>{f.name}</span>
                </label>;
          })}
        </div>
      )}

      {/* Expanded: Follow-up panel */}
      {expandedPanel === 'ca' && (
        <FollowUpPanel c={c} onUpdate={locked ? undefined : onUpdate} />
      )}

      {/* Color/icon floating picker */}
      {pickerOpen && (
        <div ref={pickerRef} style={{ position: 'absolute', left: 0, width: 228, background: T.surface2, border: `0.5px solid ${T.borderStrong}`, borderRadius: 8, marginTop: 4, zIndex: 100, boxShadow: '0 4px 20px rgba(0,0,0,0.12)', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', borderBottom: `0.5px solid ${T.border}` }}>
            {(['color','icon'] as const).map(tab => (
              <div key={tab} onClick={() => setPickerTab(tab)} style={{ flex: 1, padding: '8px 0', textAlign: 'center', fontSize: 12, fontWeight: 500, cursor: 'pointer', color: pickerTab === tab ? T.textAccent : T.textMuted, borderBottom: pickerTab === tab ? `2px solid ${T.fillAccent}` : '2px solid transparent' }}>
                {tab === 'color' ? 'Color' : 'Icon'}
              </div>
            ))}
            <div onClick={() => setPickerOpen(false)} style={{ padding: '8px 10px', cursor: 'pointer', color: T.textMuted, fontSize: 14, display: 'flex', alignItems: 'center' }}>
              <i className="ti ti-x" />
            </div>
          </div>
          {pickerTab === 'color' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 4, padding: 10 }}>
              {MC_COLORS.filter(col => col !== '').map(col => (
                <div key={col} onClick={() => { onUpdate?.(c.id, { color: c.color === col ? '' : col }); }} style={{ width: 28, height: 28, borderRadius: '50%', background: col, border: c.color === col ? `${col === '#1A1A1F' ? '1.5px' : '2px'} solid ${col === '#1A1A1F' ? '#ffffff' : T.textPrimary}` : '2px solid transparent', outline: c.color === col && col === '#1A1A1F' ? `1.5px solid ${T.borderStrong}` : 'none', outlineOffset: 1, cursor: 'pointer' }} />
              ))}
            </div>
          )}
          {pickerTab === 'icon' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8, padding: 10 }}>
              {MC_ICONS.map(ic => (
                <div key={ic} onClick={() => { onUpdate?.(c.id, { icon: c.icon === ic ? null : ic }); }} style={{ width: 28, height: 28, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: c.icon === ic ? T.fillAccent : T.surface1, border: c.icon === ic ? `2px solid ${T.fillAccent}` : `0.5px solid ${T.border}` }}>
                  <i className={`ti ${ic}`} style={{ fontSize: 14, color: c.icon === ic ? 'white' : T.textMuted }} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function MCChoiceList({ choices, locked, flags, onUpdate, onRemove, focusId, onFocused }: {
  choices: MCChoice[]; locked: boolean; flags: Flag[];
  onUpdate?: (id: string, u: Partial<MCChoice>) => void;
  onRemove?: (id: string) => void;
  focusId?: string; onFocused?: () => void
}) {
  return (
    <div>
      {choices.map((c, idx) => (
        <MCChoiceRow key={c.id} c={c} idx={idx} locked={locked} flags={flags}
          onUpdate={onUpdate} onRemove={onRemove} focusId={focusId} onFocused={onFocused} />
      ))}
    </div>
  );
}

function TemplateRow({ tpl, onUse, onCopy }: { tpl: { id: string; name: string; choices: MCChoice[] }; onUse: () => void; onCopy: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 12px', borderBottom: `0.5px solid ${T.border}`, background: hovered ? T.surface1 : 'transparent' }}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <span style={{ fontSize: 13, color: T.textPrimary }}>{tpl.name}</span>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', opacity: hovered ? 1 : 0, transition: 'opacity 0.1s' }}>
        <button onMouseDown={e => { e.preventDefault(); onCopy(); }} style={{ fontFamily: T.font, fontSize: 12, padding: '3px 10px', borderRadius: 4, border: `0.5px solid ${T.borderStrong}`, background: T.surface0, color: T.textSecondary, cursor: 'pointer' }}>Copy</button>
        <button onMouseDown={e => { e.preventDefault(); onUse(); }} style={{ fontFamily: T.font, fontSize: 12, padding: '3px 10px', borderRadius: 4, border: 'none', background: T.fillAccent, color: 'white', cursor: 'pointer' }}>Use</button>
      </div>
    </div>
  );
}

function MCChoicesSection({ item, onUpdate, flags }: { item: ListItem; onUpdate: (u: Partial<ListItem>) => void; flags: Flag[] }) {
  const usingTemplate = !!item.mcTemplateId;
  const template = usingTemplate ? MC_TEMPLATES.find(t => t.id === item.mcTemplateId) : null;
  const choices = item.choices ?? [];
  const [templatePickerOpen, setTemplatePickerOpen] = useState(false);
  const [templateSearch, setTemplateSearch] = useState('');
  const [newChoiceId, setNewChoiceId] = useState<string | null>(null);
  const templateDropdownRef = useRef<HTMLDivElement>(null);
  const templateInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (!templatePickerOpen) return;
    const handler = (e: MouseEvent) => {
      if (templateDropdownRef.current && !templateDropdownRef.current.contains(e.target as Node)) {
        setTemplatePickerOpen(false);
        setTemplateSearch('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [templatePickerOpen]);

  const selectTemplate = (tplId: string) => {
    const tpl = MC_TEMPLATES.find(t => t.id === tplId);
    if (!tpl) return;
    onUpdate({ mcTemplateId: tplId, mcDraftChoices: choices.length > 0 ? choices : item.mcDraftChoices, choices: tpl.choices });
    setTemplatePickerOpen(false);
  };

  const copyTemplate = (tplId: string) => {
    const tpl = MC_TEMPLATES.find(t => t.id === tplId);
    if (!tpl) return;
    onUpdate({ mcTemplateId: undefined, choices: tpl.choices.map(c => ({ ...c, id: mkid() })), mcDraftChoices: undefined });
    setTemplatePickerOpen(false);
    setTemplateSearch('');
  };

  const updateChoice = (id: string, updates: Partial<MCChoice>) => onUpdate({ choices: choices.map(c => c.id === id ? { ...c, ...updates } : c) });
  const addChoice = () => { const id = mkid(); setNewChoiceId(id); onUpdate({ choices: [...choices, { id, label: '', color: '', icon: null }] }); };
  const removeChoice = (id: string) => onUpdate({ choices: choices.filter(c => c.id !== id) });

  return (
    <SsSection label="Multiple Choice Options" defaultOpen>
      {/* Template searchable dropdown */}
      <div ref={templateDropdownRef} style={{ position: 'relative', marginBottom: 14, display: usingTemplate && !templatePickerOpen ? 'none' : 'block' }}>
        <div style={{ display: 'flex', alignItems: 'center', border: `1px solid ${templatePickerOpen ? T.borderAccent : T.borderStrong}`, borderRadius: 6, background: T.surface0, padding: '6px 10px', gap: 6, cursor: 'text' }} onClick={() => { setTemplatePickerOpen(true); templateInputRef.current?.focus(); }}>
          <i className="ti ti-template" style={{ fontSize: 13, color: T.textSecondary, flexShrink: 0 }} />
          <input
            ref={templateInputRef}
            value={templateSearch}
            onChange={e => { setTemplateSearch(e.target.value); setTemplatePickerOpen(true); }}
            onFocus={() => setTemplatePickerOpen(true)}
            placeholder="Use template…"
            className="mc-tpl-search"
            style={{ fontFamily: T.font, fontSize: 13, border: 'none', outline: 'none', background: 'transparent', flex: 1, color: T.textPrimary }}
          />
          {templateSearch && <i className="ti ti-x" style={{ fontSize: 12, color: T.textSecondary, cursor: 'pointer', flexShrink: 0 }} onMouseDown={e => { e.preventDefault(); setTemplateSearch(''); templateInputRef.current?.focus(); }} />}
          {!templateSearch && <i className="ti ti-chevron-down" style={{ fontSize: 12, color: T.textSecondary, flexShrink: 0 }} />}
        </div>
        {templatePickerOpen && (() => {
          const filtered = MC_TEMPLATES.filter(t => t.name.toLowerCase().includes(templateSearch.toLowerCase()));
          return (
            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 2, border: `0.5px solid ${T.borderStrong}`, borderRadius: 8, background: T.surface2, boxShadow: '0 4px 20px rgba(0,0,0,0.12)', zIndex: 100, maxHeight: 220, overflowY: 'auto' }}>
              {usingTemplate && !templateSearch && (
                <div onMouseDown={e => { e.preventDefault(); onUpdate({ mcTemplateId: undefined, choices: item.mcDraftChoices ?? [], mcDraftChoices: undefined }); setTemplatePickerOpen(false); setTemplateSearch(''); }}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderBottom: `0.5px solid ${T.border}`, cursor: 'pointer', color: T.textDanger ?? '#E53935' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#FFF5F5')} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  <i className="ti ti-x" style={{ fontSize: 13 }} />
                  <span style={{ fontSize: 13 }}>Remove template</span>
                </div>
              )}
              {filtered.length === 0
                ? <div style={{ padding: '10px 12px', fontSize: 13, color: T.textMuted }}>No templates found</div>
                : filtered.map(tpl => (
                    <TemplateRow key={tpl.id} tpl={tpl} onUse={() => { selectTemplate(tpl.id); setTemplateSearch(''); }} onCopy={() => copyTemplate(tpl.id)} />
                  ))
              }
            </div>
          );
        })()}
      </div>

      {/* Template active bar */}
      {usingTemplate && template && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: T.bgAccent, border: `0.5px solid ${T.borderAccent}`, borderRadius: 6, padding: '7px 10px', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <i className="ti ti-template" style={{ fontSize: 13, color: T.textAccent }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: T.textAccent }}>{template.name} <span style={{ fontWeight: 400, opacity: 0.75 }}>(template)</span></span>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button onClick={() => window.open(window.location.href.split('#')[0] + '#/operate/mc-templates', '_blank')} style={{ fontFamily: T.font, fontSize: 12, color: T.textAccent, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}>
              <i className="ti ti-external-link" style={{ fontSize: 11 }} /> Edit
            </button>
            <button onClick={() => { setTemplatePickerOpen(true); setTimeout(() => templateInputRef.current?.focus(), 0); }} style={{ fontFamily: T.font, fontSize: 12, color: T.textMuted, background: 'none', border: 'none', cursor: 'pointer' }}>
              Change
            </button>
          </div>
        </div>
      )}


      {/* Choices */}
      <div style={{ padding: 12, background: T.surface1, borderRadius: 8, border: `0.5px solid ${T.border}` }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: choices.length > 0 ? 10 : 0 }}>Choices</div>
        <MCChoiceList choices={choices} locked={usingTemplate} flags={flags} onUpdate={updateChoice} onRemove={removeChoice} focusId={newChoiceId ?? undefined} onFocused={() => setNewChoiceId(null)} />
        {!usingTemplate && (
          <button onClick={addChoice} style={{ fontFamily: T.font, fontSize: 12, color: T.textAccent, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, marginTop: choices.length > 0 ? 8 : 8 }}>
            <i className="ti ti-plus" style={{ fontSize: 12 }} /> Add choice
          </button>
        )}
      </div>

      {/* Boolean options */}
      <div style={{ marginTop: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <span style={{ fontSize: 13, color: T.textPrimary }}>Allow multiple selections</span>
          <Toggle on={!!item.mcMultiSelect} onChange={v => onUpdate({ mcMultiSelect: v })} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 13, color: T.textPrimary }}>Show options inline on mobile</span>
          <Toggle on={!!item.mcShowInline} onChange={v => onUpdate({ mcShowInline: v })} />
        </div>
      </div>
    </SsSection>
  );
}

const MOCK_SENSORS: { id: string; name: string; reading: string }[] = [
  { id: 's1', name: 'Walk-In Cooler #1',    reading: '38.2°F' },
  { id: 's2', name: 'Walk-In Freezer A',    reading: '-4.1°F' },
  { id: 's3', name: 'Prep Table Surface',   reading: '41.7°F' },
  { id: 's4', name: 'Hot Hold Cabinet',     reading: '141.3°F' },
  { id: 's5', name: 'Receiving Dock Probe', reading: '55.0°F' },
  { id: 's6', name: 'Dish Machine Rinse',   reading: '180.4°F' },
];

const MEAS_INPUT_METHODS: Record<string, string[]> = {
  temperature: ['Manual Input', 'Probe', 'Sensor'],
  weight:      ['Manual Input', 'Weight Scale'],
  ph:          ['Manual Input', 'Probe'],
  other:       ['Manual Input'],
};

const MEAS_UNITS: Record<string, { value: string; label: string }[]> = {
  temperature: [
    { value: 'F', label: 'F - Fahrenheit' },
    { value: 'C', label: 'C - Celsius' },
    { value: 'K', label: 'K - Kelvin' },
  ],
  weight: [
    { value: 'lb', label: 'lb - Pounds' },
    { value: 'oz', label: 'oz - Ounces' },
    { value: 'kg', label: 'kg - Kilograms' },
    { value: 'g', label: 'g - Grams' },
  ],
  ph: [
    { value: 'pH', label: 'pH' },
  ],
  other: [],
};

function RatingSection({ item, onUpdate, scoringOn }: { item: ListItem; onUpdate: (u: Partial<ListItem>) => void; scoringOn: boolean }) {
  const min = item.ratingMin ?? 1;
  const max = item.ratingMax ?? 5;
  const scores = item.ratingScores ?? {};

  const clampMin = (v: number) => Math.min(Math.max(Math.round(v), 1), 9);
  const clampMax = (v: number) => Math.min(Math.max(Math.round(v), 2), 10);

  const setMin = (v: number) => {
    const newMin = clampMin(v);
    const newMax = max <= newMin ? newMin + 1 : max;
    const newScores: Record<number, number> = {};
    for (let i = newMin; i <= newMax; i++) if (scores[i] !== undefined) newScores[i] = scores[i];
    onUpdate({ ratingMin: newMin, ratingMax: newMax, ratingScores: newScores });
  };

  const setMax = (v: number) => {
    const newMax = clampMax(v);
    const newMin = min >= newMax ? newMax - 1 : min;
    const newScores: Record<number, number> = {};
    for (let i = newMin; i <= newMax; i++) if (scores[i] !== undefined) newScores[i] = scores[i];
    onUpdate({ ratingMin: newMin, ratingMax: newMax, ratingScores: newScores });
  };

  const values = Array.from({ length: max - min + 1 }, (_, i) => min + i);

  return (
    <SsSection label="Rating Options" defaultOpen>
      {/* Range */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: scoringOn ? 20 : 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13, color: T.textSecondary }}>Min</span>
          <input
            type="number" value={min} min={1} max={9}
            onChange={e => onUpdate({ ratingMin: Number(e.target.value) })}
            onBlur={e => setMin(Number(e.target.value))}
            style={{ fontFamily: T.font, fontSize: 13, width: 56, border: `0.5px solid ${T.borderStrong}`, borderRadius: 5, padding: '5px 8px', textAlign: 'center', color: T.textPrimary }}
          />
        </div>
        <span style={{ fontSize: 13, color: T.textMuted }}>—</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13, color: T.textSecondary }}>Max</span>
          <input
            type="number" value={max} min={2} max={10}
            onChange={e => onUpdate({ ratingMax: Number(e.target.value) })}
            onBlur={e => setMax(Number(e.target.value))}
            style={{ fontFamily: T.font, fontSize: 13, width: 56, border: `0.5px solid ${T.borderStrong}`, borderRadius: 5, padding: '5px 8px', textAlign: 'center', color: T.textPrimary }}
          />
        </div>
        <span style={{ fontSize: 12, color: T.textMuted }}>{max - min + 1} values</span>
      </div>

      {/* Score per value */}
      {scoringOn && (
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>Score per rating</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
            {values.map(v => (
              <div key={v} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <span style={{ fontSize: 11, color: T.textMuted }}>Rating {v}</span>
                <input
                  type="number"
                  value={scores[v] ?? ''}
                  onFocus={() => { if (scores[v] === undefined) onUpdate({ ratingScores: { ...scores, [v]: 0 } }); }}
                  onChange={e => onUpdate({ ratingScores: { ...scores, [v]: e.target.value === '' ? 0 : Number(e.target.value) } })}
                  style={{ fontFamily: T.font, fontSize: 13, width: '100%', border: `0.5px solid ${T.borderStrong}`, borderRadius: 5, padding: '5px 4px', textAlign: 'center', color: T.textPrimary }}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </SsSection>
  );
}

function MeasurementSection({ item, onUpdate }: { item: ListItem; onUpdate: (u: Partial<ListItem>) => void }) {
  const [measType, setMeasType] = useState('temperature');
  const [unit, setUnit] = useState('F');
  const [customUnit, setCustomUnit] = useState('');
  const [inputMethods, setInputMethods] = useState<string[]>(['Manual Input']);
  const [selectedSensorId, setSelectedSensorId] = useState('');
  const ranges = item.measRanges ?? [];
  const setRanges = (next: { id: string; min: string; max: string }[]) => onUpdate({ measRanges: next });

  const unitOptions = MEAS_UNITS[measType] ?? [];

  const handleTypeChange = (t: string) => {
    setMeasType(t);
    const opts = MEAS_UNITS[t] ?? [];
    if (opts.length > 0) setUnit(opts[0].value);
    else setUnit('');
    setInputMethods(['Manual Input']);
  };

  const toggleInputMethod = (m: string) => {
    setInputMethods(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m]);
  };

  return (
    <SsSection label="Measurement Options">
      <div style={{ display: 'flex', gap: 10, marginBottom: 12, alignItems: 'flex-end' }}>
        <div>
          <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 4 }}>Measurement Type</div>
          <Select value={measType} onChange={handleTypeChange} options={[
            { value: 'temperature', label: 'Temperature' },
            { value: 'weight', label: 'Weight' },
            { value: 'ph', label: 'pH' },
            { value: 'other', label: 'Other' },
          ]} />
        </div>
        {measType !== 'ph' && (
          <div>
            <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 4 }}>Unit</div>
            {measType === 'other'
              ? <input value={customUnit} onChange={e => setCustomUnit(e.target.value)} placeholder="Enter unit…" style={{ fontFamily: T.font, fontSize: 13, border: `0.5px solid ${T.borderStrong}`, borderRadius: 5, padding: '6px 10px', width: 120 }} />
              : <Select value={unit} onChange={setUnit} options={unitOptions} />
            }
          </div>
        )}
      </div>
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 6 }}>Input Methods</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {(MEAS_INPUT_METHODS[measType] ?? []).map(m => {
            const selected = inputMethods.includes(m);
            return (
              <div key={m} onClick={() => toggleInputMethod(m)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 20, fontSize: 12, fontWeight: 500, cursor: 'pointer', border: `1.5px solid ${selected ? T.borderAccent : T.borderStrong}`, background: selected ? T.bgAccent : T.surface2, color: selected ? T.textAccent : T.textSecondary, userSelect: 'none' }}>
                {selected && <i className="ti ti-check" style={{ fontSize: 11 }} />}
                {m}
              </div>
            );
          })}
        </div>
      </div>
      {inputMethods.includes('Sensor') && (
        <div style={{ marginBottom: 12, padding: 12, background: T.surface1, borderRadius: 8, border: `0.5px solid ${T.border}` }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>Linked Sensor Data</div>
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ flex: 1 }}>
              <Select
                value={selectedSensorId}
                onChange={setSelectedSensorId}
                options={[{ value: '', label: 'Select Sensor' }, ...MOCK_SENSORS.map(s => ({ value: s.id, label: s.name }))]}
              />
            </div>
            <div style={{ width: 110 }}>
              <input
                readOnly
                value={selectedSensorId ? (MOCK_SENSORS.find(s => s.id === selectedSensorId)?.reading ?? '') : ''}
                placeholder="Reading"
                style={{ fontFamily: T.font, fontSize: 13, border: `0.5px solid ${T.borderStrong}`, borderRadius: 5, padding: '6px 10px', width: '100%', boxSizing: 'border-box', background: T.surface0, color: T.textSecondary, cursor: 'default' }}
              />
            </div>
          </div>
        </div>
      )}
      <div style={{ padding: 12, background: T.surface1, borderRadius: 8, border: `0.5px solid ${T.border}` }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: ranges.length > 0 ? 10 : 0 }}>Ranges</div>
        {ranges.map((r, idx) => (
          <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 12, color: T.textSecondary, whiteSpace: 'nowrap', minWidth: 54 }}>Range {idx + 1}</span>
            <input value={r.min} onChange={e => { if (/^-?\d*\.?\d*$/.test(e.target.value)) setRanges(ranges.map(x => x.id === r.id ? { ...x, min: e.target.value } : x)); }} placeholder="Min" style={{ fontFamily: T.font, fontSize: 13, border: `0.5px solid ${T.borderStrong}`, borderRadius: 5, padding: '5px 8px', width: 68 }} />
            <span style={{ color: T.textMuted, fontSize: 12 }}>–</span>
            <input value={r.max} onChange={e => { if (/^-?\d*\.?\d*$/.test(e.target.value)) setRanges(ranges.map(x => x.id === r.id ? { ...x, max: e.target.value } : x)); }} placeholder="Max" style={{ fontFamily: T.font, fontSize: 13, border: `0.5px solid ${T.borderStrong}`, borderRadius: 5, padding: '5px 8px', width: 68 }} />
            <button onClick={() => setRanges(ranges.filter(x => x.id !== r.id))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.textMuted, fontSize: 14 }}><i className="ti ti-x" /></button>
          </div>
        ))}
        {ranges.length < 3 && (
          <button onClick={() => setRanges([...ranges, { id: mkid(), min: '', max: '' }])} style={{ fontFamily: T.font, fontSize: 12, color: T.textAccent, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, marginTop: ranges.length > 0 ? 4 : 8 }}>
            <i className="ti ti-plus" style={{ fontSize: 12 }} /> Add range
          </button>
        )}
      </div>
    </SsSection>
  );
}

function LabelSelector({ item, onUpdate }: { item: ListItem; onUpdate: (u: Partial<ListItem>) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = item.labelIds ?? [];
  const toggle = (id: string) => {
    const next = selected.includes(id) ? selected.filter(x => x !== id) : [...selected, id];
    onUpdate({ labelIds: next });
  };
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const groups = Array.from(new Set(LABEL_TEMPLATES.map(t => t.group)));

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <div onClick={() => setOpen(o => !o)} style={{ minHeight: 36, border: `0.5px solid ${open ? T.borderAccent : T.borderStrong}`, borderRadius: 6, padding: '5px 8px', display: 'flex', flexWrap: 'wrap', gap: 5, alignItems: 'center', cursor: 'text', background: T.surface2 }}>
        {selected.map(id => {
          const tpl = LABEL_TEMPLATES.find(t => t.id === id);
          if (!tpl) return null;
          return (
            <span key={id} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: T.bgAccent, color: T.textAccent, fontSize: 12, fontWeight: 500, padding: '3px 8px', borderRadius: 12, maxWidth: 160 }}>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tpl.name}</span>
              <button onClick={e => { e.stopPropagation(); toggle(id); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.textAccent, fontSize: 13, padding: 0, lineHeight: 1, display: 'flex', flexShrink: 0 }}>⊗</button>
            </span>
          );
        })}
        <i className={`ti ti-chevron-${open ? 'up' : 'down'}`} style={{ fontSize: 12, color: T.textMuted, marginLeft: 'auto' }} />
      </div>
      {open && (
        <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, background: T.surface2, border: `0.5px solid ${T.borderStrong}`, borderRadius: 8, boxShadow: '0 4px 20px rgba(0,0,0,0.12)', zIndex: 300, overflow: 'hidden', maxHeight: 260, overflowY: 'auto' }}>
          <div onClick={() => { window.open(window.location.href.split('#')[0] + '#/operate/label-templates', '_blank'); }} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', cursor: 'pointer', borderBottom: `0.5px solid ${T.border}` }}
            onMouseEnter={e => (e.currentTarget.style.background = T.surface1)}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
            <i className="ti ti-settings" style={{ fontSize: 15, color: T.textSecondary }} />
            <span style={{ fontSize: 13, color: T.textPrimary }}>Manage Labels</span>
          </div>
          {groups.map(group => (
            <div key={group}>
              <div style={{ fontSize: 10, fontWeight: 600, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', padding: '8px 14px 4px' }}>{group}</div>
              {LABEL_TEMPLATES.filter(t => t.group === group).map(tpl => {
                const checked = selected.includes(tpl.id);
                return (
                  <div key={tpl.id} onClick={() => toggle(tpl.id)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px', cursor: 'pointer' }}
                    onMouseEnter={e => (e.currentTarget.style.background = T.surface1)}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <i className={`ti ${checked ? 'ti-checkbox' : 'ti-square'}`} style={{ fontSize: 15, color: checked ? T.textAccent : T.textMuted, flexShrink: 0 }} />
                    <span style={{ fontSize: 13, color: checked ? T.textAccent : T.textPrimary }}>{tpl.name}</span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PromptEditor({ item, onUpdate }: { item: ListItem; onUpdate: (u: Partial<ListItem>) => void }) {
  const editorRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = item.promptHtml ?? item.prompt;
    }
  }, [item.id]);

  const exec = (cmd: string, value?: string) => {
    document.execCommand(cmd, false, value);
    editorRef.current?.focus();
  };
  const toolBtn = (content: React.ReactNode, onMD: () => void, title?: string) => (
    <button title={title} onMouseDown={e => { e.preventDefault(); onMD(); }} style={{ width: 22, height: 22, borderRadius: 3, border: 'none', background: 'none', color: T.textSecondary, fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: T.font }}>
      {content}
    </button>
  );
  const handleLink = () => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) return;
    const url = window.prompt('Enter URL', 'https://');
    if (url) exec('createLink', url);
  };
  return (
    <div>
      <div style={{ border: `0.5px solid ${T.borderStrong}`, borderRadius: 6, background: T.surface2, overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 2, padding: '5px 8px', background: T.surface0, borderBottom: `0.5px solid ${T.border}` }}>
          {toolBtn(<b>B</b>, () => exec('bold'), 'Bold')}
          {toolBtn(<i>I</i>, () => exec('italic'), 'Italic')}
          {toolBtn('H', () => {
            const block = document.queryCommandValue('formatBlock');
            exec('formatBlock', block.toLowerCase() === 'h3' ? 'p' : 'h3');
          }, 'Heading')}
          <div style={{ width: 0.5, height: 12, background: T.borderStrong, margin: '0 3px' }} />
          {toolBtn(<i className="ti ti-link" style={{ fontSize: 13, fontWeight: 400 }} />, handleLink, 'Link')}
        </div>
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={e => {
            const el = e.currentTarget as HTMLDivElement;
            onUpdate({ prompt: el.innerText.trim(), promptHtml: el.innerHTML });
          }}
          style={{ padding: '10px 12px', fontSize: 13, color: T.textPrimary, lineHeight: 1.55, minHeight: 60, outline: 'none', fontFamily: T.font }}
        />
      </div>
      <div style={{ fontSize: 11, color: T.textMuted, marginTop: 5 }}>Required — cannot be empty</div>
    </div>
  );
}

function InfoLibrarySection({ item, onUpdate }: { item: ListItem; onUpdate: (u: Partial<ListItem>) => void }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ fontSize: 13, color: T.textPrimary }}>Display attached file inline on the app</span>
        <Toggle on={!!item.infoInline} onChange={v => onUpdate({ infoInline: v })} />
      </div>
      <input ref={fileInputRef} type="file" style={{ display: 'none' }} onChange={e => {
        const file = e.target.files?.[0];
        if (file) onUpdate({ infoFile: file.name });
        e.target.value = '';
      }} />
      {item.infoFile ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: T.surface0, border: `0.5px solid ${T.borderStrong}`, borderRadius: 6, padding: '8px 10px' }}>
          <i className="ti ti-file" style={{ fontSize: 15, color: T.textMuted, flexShrink: 0 }} />
          <span style={{ fontSize: 13, color: T.textPrimary, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.infoFile}</span>
          <button onClick={() => onUpdate({ infoFile: undefined })} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.textMuted, fontSize: 14, display: 'flex', padding: 0 }}>
            <i className="ti ti-x" />
          </button>
        </div>
      ) : (
        <button onClick={() => fileInputRef.current?.click()} style={{ fontFamily: T.font, fontSize: 13, color: T.textAccent, background: T.surface0, border: `0.5px solid ${T.borderAccent}`, borderRadius: 6, padding: '7px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, width: '100%', justifyContent: 'center' }}>
          <i className="ti ti-folder-open" style={{ fontSize: 15 }} /> Select File
        </button>
      )}
    </div>
  );
}

// ── QR / Barcode section ──────────────────────────────────────────────────
function CodeSection({ item, onUpdate }: { item: ListItem; onUpdate: (u: Partial<ListItem>) => void }) {
  const isQR = item.type === 'qr';
  const targetKey = isQR ? 'qrTarget' : 'barcodeTarget';
  const target = (isQR ? item.qrTarget : item.barcodeTarget) ?? '';
  const [draft, setDraft] = useState(target);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setDraft(isQR ? item.qrTarget ?? '' : item.barcodeTarget ?? ''); }, [item.qrTarget, item.barcodeTarget, isQR]);

  const handlePrint = () => {
    if (!printRef.current) return;
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(`<html><body style="display:flex;justify-content:center;align-items:center;height:100vh;margin:0">${printRef.current.innerHTML}</body></html>`);
    w.document.close();
    w.focus();
    w.print();
    w.close();
  };

  return (
    <SsSection label={isQR ? 'QR Code' : 'Barcode'} defaultOpen>
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 13, color: T.textPrimary, marginBottom: 6 }}>{isQR ? 'QR Code Target' : 'Barcode Target'}<span style={{ color: T.textDanger }}>*</span></div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onBlur={() => { if (draft.trim()) onUpdate({ [targetKey]: draft.trim() }); }}
            placeholder="Enter target value"
            style={{ fontFamily: T.font, fontSize: 13, flex: 1, border: `0.5px solid ${T.borderStrong}`, borderRadius: 5, padding: '6px 10px' }}
          />
          <button onClick={handlePrint} style={{ fontFamily: T.font, fontSize: 12, fontWeight: 600, padding: '6px 16px', border: `0.5px solid ${T.borderStrong}`, borderRadius: 5, background: T.surface2, color: T.textPrimary, cursor: 'pointer', whiteSpace: 'nowrap' }}>
            Print
          </button>
        </div>
        <div style={{ fontSize: 11, color: T.textMuted, marginTop: 4 }}>*Required</div>
      </div>
      {target && (
        <div ref={printRef} style={{ display: 'flex', justifyContent: 'center', paddingTop: 8 }}>
          {isQR
            ? <QRCodeSVG value={target} size={160} />
            : <Barcode value={target} width={1.4} height={80} fontSize={13} />
          }
        </div>
      )}
    </SsSection>
  );
}

// ── Side sheet ────────────────────────────────────────────────────────────
function SideSheet({ item, items, onClose, onNavigate, onUpdate, markAs, onMarkAsChange, scoringOn, flags, onCreateFlag }: { item: ListItem; items: ListItem[]; onClose: () => void; onNavigate: (id: string) => void; onUpdate: (id: string, updates: Partial<ListItem>) => void; markAs: string | null; onMarkAsChange: (value: string | null) => void; scoringOn: boolean; flags: Flag[]; onCreateFlag: (flag: Flag) => void }) {
  const upd = (updates: Partial<ListItem>) => onUpdate(item.id, updates);
  const meta = TYPE_META[item.type];
  const [bgColor, setBgColor] = useState(item.stripe ?? '');
  const [scoreEnabled, setScoreEnabled] = useState(item.scoreEnabled ?? false);
  const [scoreYes, setScoreYes] = useState(() => { const v = item.scoreYes ?? 1; if (item.type === 'yn' && item.scoreYes === undefined) onUpdate(item.id, { scoreYes: v }); return v; });
  const [scoreNo, setScoreNo] = useState(() => { const v = item.scoreNo ?? 0; if (item.type === 'yn' && item.scoreNo === undefined) onUpdate(item.id, { scoreNo: v }); return v; });

  return (
    <div style={{ width: 420, flexShrink: 0, background: T.surface1, borderLeft: `0.5px solid ${T.border}`, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', background: T.surface2, borderBottom: `0.5px solid ${T.border}`, flexShrink: 0 }}>
        <i className={`ti ${meta.icon}`} style={{ fontSize: 16, color: T.textMuted, flexShrink: 0 }} />
        <span style={{ fontSize: 13, fontWeight: 600, color: T.textPrimary, flex: 1 }}>{meta.label}</span>
        {/* Up / Down navigation */}
        {(() => {
          const idx = items.findIndex(i => i.id === item.id);
          const prev = items[idx - 1];
          const next = items[idx + 1];
          const navBtn = (icon: string, target: ListItem | undefined) => (
            <button onClick={() => target && onNavigate(target.id)} disabled={!target} style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `0.5px solid ${T.borderStrong}`, borderRadius: 5, background: T.surface2, cursor: target ? 'pointer' : 'default', color: target ? T.textSecondary : T.textMuted, opacity: target ? 1 : 0.35, fontSize: 14 }}>
              <i className={`ti ${icon}`} />
            </button>
          );
          return <div style={{ display: 'flex', gap: 4 }}>{navBtn('ti-chevron-up', prev)}{navBtn('ti-chevron-down', next)}</div>;
        })()}
        <div style={{ width: 0.5, height: 18, background: T.borderStrong, marginLeft: 2 }} />
        <button onClick={onClose} style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer', color: T.textMuted, fontSize: 16, borderRadius: 5 }}><i className="ti ti-x" /></button>
      </div>
      {/* Scrollable body */}
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 320 }}>
        {/* Prompt */}
        <SsSection label="Prompt Text" defaultOpen>
          <PromptEditor item={item} onUpdate={upd} />
        </SsSection>
        {/* General options */}
        <SsSection label="General Options" defaultOpen={!!(markAs || item.points || (item.labelIds?.length ?? 0) > 0 || item.stripe || item.infoInline || item.infoFile)}>
          {item.type !== 'text' && item.type !== 'employee' && (
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 13, color: T.textPrimary, marginBottom: 6 }}>Allow item to be marked as</div>
              <div style={{ display: 'flex', gap: 6 }}>
                {(['N/A', 'OOO'] as const).map(val => {
                  const active = markAs === val;
                  return (
                    <button key={val} onClick={() => onMarkAsChange(active ? null : val)} style={{
                      fontFamily: T.font, fontSize: 12, fontWeight: 600, padding: '4px 14px',
                      borderRadius: 5, border: `0.5px solid ${active ? T.borderAccent : T.borderStrong}`,
                      background: active ? T.bgAccent : T.surface2,
                      color: active ? T.textAccent : T.textSecondary,
                      cursor: 'pointer',
                    }}>
                      {val}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          {item.type !== 'text' && item.type !== 'employee' && (
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 13, color: T.textPrimary, marginBottom: 6 }}>Points</div>
              <input type="number" min={0} value={item.points ?? ''} onChange={e => upd({ points: e.target.value === '' ? undefined : Number(e.target.value) })} placeholder="0" style={{ fontFamily: T.font, fontSize: 13, border: `0.5px solid ${T.borderStrong}`, borderRadius: 5, padding: '6px 10px', width: 80, marginBottom: 6 }} />
              <div style={{ fontSize: 11, color: T.textMuted, lineHeight: 1.4 }}>Employees get points by completing items or half points if late.</div>
            </div>
          )}
          {item.type === 'measurement' && (
            <div style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: 13, color: T.textPrimary }}>Saved value</div>
                  <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2, lineHeight: 1.4 }}>Pre-fills with the last recorded value on new list instances</div>
                </div>
                <Toggle on={!!item.savedValue} onChange={v => upd({ savedValue: v })} />
              </div>
            </div>
          )}
          {item.type === 'photo' && (
            <div style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontSize: 13, color: T.textPrimary }}>Allow images to be uploaded from device</div>
                <Toggle on={!!item.photoAllowUpload} onChange={v => upd({ photoAllowUpload: v })} />
              </div>
            </div>
          )}
          {item.type === 'employee' && (
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 13, color: T.textPrimary, marginBottom: 4 }}>Filter by role</div>
              <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 8, lineHeight: 1.4 }}>Only show employees with these roles — empty means all roles</div>
              <TagPicker options={EMPLOYEE_ROLES} selected={item.employeeRoles ?? []} onChange={roles => upd({ employeeRoles: roles.length ? roles : undefined })} placeholder="Add role…" />
            </div>
          )}
          <div style={{ borderTop: `0.5px solid ${T.border}`, paddingTop: 12, marginBottom: 10 }}>
            <div style={{ fontSize: 13, color: T.textPrimary, marginBottom: 8 }}>Background Color</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {STRIPE_COLORS.map(sc => (
                <div key={sc.value} onClick={() => { setBgColor(sc.value); upd({ stripe: sc.value }); }} title={sc.label} style={{ width: 24, height: 24, borderRadius: 4, background: sc.value || T.surface1, border: `0.5px solid ${T.borderStrong}`, outline: bgColor === sc.value ? `1.5px solid ${T.textSecondary}` : 'none', outlineOffset: 2, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {!sc.value && <i className="ti ti-x" style={{ fontSize: 11, color: T.textMuted }} />}
                </div>
              ))}
            </div>
          </div>
          <div style={{ borderTop: `0.5px solid ${T.border}`, paddingTop: 12, marginBottom: 10 }}>
            <div style={{ fontSize: 13, color: T.textPrimary, marginBottom: 8 }}>Info Library</div>
            <InfoLibrarySection item={item} onUpdate={upd} />
          </div>
          <div style={{ borderTop: `0.5px solid ${T.border}`, paddingTop: 12 }}>
            <div style={{ fontSize: 13, color: T.textPrimary, marginBottom: 6 }}>Labels</div>
            <LabelSelector item={item} onUpdate={upd} />
          </div>
        </SsSection>
        {/* Score */}
        {scoringOn && item.type === 'yn' && (
          <SsSection label="Score" defaultOpen>
            {item.type === 'yn' && (
              <div>
                {[{ label: 'Score for Yes', val: scoreYes, set: setScoreYes, upd: (v: number) => upd({ scoreYes: v }) }, { label: 'Score for No', val: scoreNo, set: setScoreNo, upd: (v: number) => upd({ scoreNo: v }) }].map(row => (
                  <div key={row.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 13, color: T.textPrimary }}>{row.label}</span>
                    <input
                      type="number"
                      value={row.val}
                      onChange={e => {
                        const n = parseInt(e.target.value, 10);
                        if (!isNaN(n)) { row.set(n); row.upd(n); }
                      }}
                      onKeyDown={e => { if (e.key === 'e' || e.key === 'E' || e.key === '.' || e.key === ',') e.preventDefault(); }}
                      style={{ fontFamily: T.font, fontSize: 13, border: `0.5px solid ${T.borderStrong}`, borderRadius: 5, padding: '5px 8px', width: 70, textAlign: 'center' }}
                    />
                  </div>
                ))}
              </div>
            )}
          </SsSection>
        )}
        {/* Type-specific sections */}
        {item.type === 'mc' && <MCChoicesSection item={item} onUpdate={upd} flags={flags} />}
        {item.type === 'mc' && <MCCASection item={item} onUpdate={upd} markAs={markAs} />}
        {item.type === 'rating' && <RatingSection item={item} onUpdate={upd} scoringOn={scoringOn} />}
        {item.type === 'measurement' && <MeasurementSection item={item} onUpdate={upd} />}
        {(item.type === 'yn' || item.type === 'measurement') && <CASection item={item} onUpdate={upd} markAs={markAs} />}
        {item.type === 'yn' && <FlagSection item={item} onUpdate={upd} flags={flags} onCreateFlag={onCreateFlag} />}
        {item.type === 'measurement' && (item.measRanges?.length ?? 0) > 0 && (
          <MeasurementFlagSection item={item} onUpdate={upd} flags={flags} onCreateFlag={onCreateFlag} />
        )}
        {item.type === 'yn' && <CompletionModeSection item={item} onUpdate={upd} flags={flags} onCreateFlag={onCreateFlag} />}
        {item.type === 'subtitle' && (
          <SsSection label="Display Criteria" defaultOpen={false}>
            <div style={{ fontSize: 12, color: T.textMuted }}>Subtitles cannot be a DC child — they are always visible.</div>
          </SsSection>
        )}
        {(item.type === 'qr' || item.type === 'barcode') && <CodeSection item={item} onUpdate={upd} />}
        {/* Tags — always last */}
        <SsSection label="Tags" defaultOpen={!!(item.locationTags?.length || item.scoreGroup || item.importance)}>
          {/* Location — searchable multi-select */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 13, color: T.textPrimary, marginBottom: 3 }}>Location</div>
            <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 8, lineHeight: 1.4 }}>Only display at locations with these tags — empty means all locations</div>
            <LocationTagPicker selected={item.locationTags ?? []} onChange={tags => upd({ locationTags: tags.length ? tags : undefined })} />
          </div>
          {/* Score group — single-select */}
          <div style={{ marginBottom: 14, borderTop: `0.5px solid ${T.border}`, paddingTop: 12 }}>
            <div style={{ fontSize: 13, color: T.textPrimary, marginBottom: 3 }}>Score group</div>
            <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 8, lineHeight: 1.4 }}>Group for aggregate scoring reports</div>
            <select value={item.scoreGroup ?? ''} onChange={e => upd({ scoreGroup: e.target.value || undefined })}
              style={{ fontFamily: T.font, fontSize: 12, color: T.textPrimary, background: T.surface2, border: `0.5px solid ${T.borderStrong}`, borderRadius: 5, padding: '5px 24px 5px 8px', width: '100%', cursor: 'pointer', appearance: 'none', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%239898A8'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center' }}>
              <option value="">None</option>
              {SCORE_GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          {/* Importance — single-select */}
          <div style={{ borderTop: `0.5px solid ${T.border}`, paddingTop: 12 }}>
            <div style={{ fontSize: 13, color: T.textPrimary, marginBottom: 3 }}>Importance</div>
            <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 8, lineHeight: 1.4 }}>Tag by importance level</div>
            <select value={item.importance ?? ''} onChange={e => upd({ importance: e.target.value || undefined })}
              style={{ fontFamily: T.font, fontSize: 12, color: T.textPrimary, background: T.surface2, border: `0.5px solid ${T.borderStrong}`, borderRadius: 5, padding: '5px 24px 5px 8px', width: '100%', cursor: 'pointer', appearance: 'none', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%239898A8'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center' }}>
              <option value="">None</option>
              {IMPORTANCE_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
        </SsSection>
      </div>
    </div>
  );
}

// ── Add item popover ───────────────────────────────────────────────────────
function AddItemPopover({ onSelect, onClose }: { onSelect: (type: ItemType) => void; onClose: () => void }) {
  const [q, setQ] = useState('');
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { ref.current?.focus(); }, []);

  const matches = ALL_TYPES.filter(t => {
    const lq = q.toLowerCase();
    return !lq || TYPE_META[t.type].label.toLowerCase().includes(lq) || t.aliases.some(a => a.includes(lq));
  });

  return (
    <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, background: T.surface2, border: `0.5px solid ${T.borderStrong}`, borderRadius: 10, width: 300, zIndex: 200, boxShadow: '0 8px 32px rgba(0,0,0,0.14)', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderBottom: `0.5px solid ${T.border}` }}>
        <i className="ti ti-search" style={{ color: T.textMuted, fontSize: 15 }} />
        <input ref={ref} value={q} onChange={e => setQ(e.target.value)} placeholder="Search types… (try 'num', 'check')" onKeyDown={e => { if (e.key === 'Escape') onClose(); if (e.key === 'Enter' && matches.length) onSelect(matches[0].type); }} style={{ fontFamily: T.font, fontSize: 13, border: 'none', outline: 'none', width: '100%', background: 'transparent', color: T.textPrimary }} />
      </div>
      <div style={{ maxHeight: 280, overflowY: 'auto', padding: '6px 0' }}>
        {matches.length === 0 && <div style={{ padding: '12px 14px', fontSize: 12, color: T.textMuted }}>No types match — try another term</div>}
        {matches.map((t, idx) => {
          const aliasHit = q ? t.aliases.find(a => a.includes(q.toLowerCase())) : null;
          return (
            <div key={t.type} onClick={() => onSelect(t.type)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 14px', cursor: 'pointer', fontSize: 13, color: T.textPrimary, background: idx === 0 ? T.bgAccent : 'transparent' }}
              onMouseEnter={e => (e.currentTarget.style.background = T.bgAccent)}
              onMouseLeave={e => (e.currentTarget.style.background = idx === 0 ? T.bgAccent : 'transparent')}>
              <i className={`ti ${TYPE_META[t.type].icon}`} style={{ fontSize: 16, color: idx === 0 ? T.textAccent : T.textMuted, width: 20 }} />
              <span style={{ color: idx === 0 ? T.textAccent : T.textPrimary }}>{TYPE_META[t.type].label}</span>
              {aliasHit && <span style={{ fontSize: 10, color: T.textAccent, background: T.bgAccent, padding: '1px 5px', borderRadius: 3, marginLeft: 4 }}>↳ "{aliasHit}"</span>}
              {!q && idx < 2 && <span style={{ marginLeft: 'auto', fontSize: 10, color: T.textMuted }}>most used</span>}
            </div>
          );
        })}
      </div>
      <div style={{ fontSize: 10, color: T.textMuted, padding: '4px 14px 8px' }}>↑↓ navigate · Enter to select · Esc to cancel</div>
    </div>
  );
}

// ── DC condition popover ───────────────────────────────────────────────────
function DCConditionPanel({ childItem, parentItem, onSave, onCancel }: { childItem: ListItem; parentItem: ListItem; onSave: (cond: DCCondition) => void; onCancel: () => void }) {
  const isMeas = parentItem.type === 'measurement';
  const [ynValue, setYnValue] = useState<'Yes' | 'No'>('No');
  const [measOp, setMeasOp] = useState<DCConditionMeas['op']>('>=');
  const [measVal, setMeasVal] = useState(41);

  const save = () => {
    if (isMeas) onSave({ type: 'measurement', op: measOp, value: measVal });
    else onSave({ type: 'yn', value: ynValue });
  };

  return (
    <div style={{ width: 300, flexShrink: 0, background: T.surface2, borderLeft: `0.5px solid ${T.border}`, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Condition 1</div>
      {!isMeas ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Select value={ynValue} onChange={v => setYnValue(v as 'Yes' | 'No')} options={[{ value: 'No', label: 'No' }, { value: 'Yes', label: 'Yes' }]} style={{ flex: 1 }} />
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Select value={measOp} onChange={v => setMeasOp(v as DCConditionMeas['op'])} options={[{value:'>',label:'>'},{value:'>=',label:'≥'},{value:'=',label:'='},{value:'<=',label:'≤'},{value:'<',label:'<'}]} style={{ width: 70 }} />
          <input type="number" value={measVal} onChange={e => setMeasVal(Number(e.target.value))} style={{ fontFamily: T.font, fontSize: 13, border: `0.5px solid ${T.borderStrong}`, borderRadius: 6, padding: '7px 10px', width: 80, textAlign: 'center' }} />
        </div>
      )}
      <button style={{ fontFamily: T.font, fontSize: 12, fontWeight: 500, color: T.textAccent, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, padding: '2px 0' }}>
        <i className="ti ti-plus" style={{ fontSize: 12 }} /> Add another condition (OR)
      </button>
      <div style={{ height: 0.5, background: T.border }} />
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={save} style={{ fontFamily: T.font, fontSize: 12, fontWeight: 600, background: T.fillAccent, color: T.onAccent, border: 'none', borderRadius: 5, padding: '7px 16px', cursor: 'pointer' }}>Save</button>
        <button onClick={onCancel} style={{ fontFamily: T.font, fontSize: 12, color: T.textMuted, background: 'none', border: 'none', cursor: 'pointer' }}>Cancel</button>
      </div>
    </div>
  );
}

// ── Notification section helpers ──────────────────────────────────────────
interface NotifRule { id: string; event: string; role: string; methods: string[]; offsetMin?: number; }

function NotificationSection() {
  const EVENTS = [
    { id: 'displayed', label: 'List is displayed' },
    { id: 'out-of-range', label: 'Item is out of range', note: 'Measurement items only' },
    { id: 'before-due', label: 'Before list is due' },
    { id: 'overdue', label: 'Item is overdue' },
    { id: 'completed', label: 'List is completed' },
  ];
  const [rules, setRules] = useState<NotifRule[]>([]);
  const [addingFor, setAddingFor] = useState<string | null>(null);
  const [formRole, setFormRole] = useState('');
  const [formMethods, setFormMethods] = useState<string[]>([]);
  const [formOffset, setFormOffset] = useState(30);

  const saveRule = (event: string) => {
    if (!formRole || !formMethods.length) return;
    setRules([...rules, { id: mkid(), event, role: formRole, methods: formMethods, offsetMin: event === 'before-due' ? formOffset : undefined }]);
    setAddingFor(null);
    setFormRole('');
    setFormMethods([]);
  };

  return (
    <div>
      {EVENTS.map(ev => (
        <div key={ev.id} style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <div>
              <span style={{ fontSize: 13, fontWeight: 500, color: T.textPrimary }}>{ev.label}</span>
              {ev.note && <span style={{ fontSize: 11, color: T.textMuted, marginLeft: 6 }}>({ev.note})</span>}
            </div>
            <button onClick={() => setAddingFor(addingFor === ev.id ? null : ev.id)} style={{ fontFamily: T.font, fontSize: 12, color: T.textAccent, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}>
              <i className="ti ti-plus" style={{ fontSize: 12 }} /> Add
            </button>
          </div>
          {rules.filter(r => r.event === ev.id).map(r => (
            <div key={r.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: T.surface0, border: `0.5px solid ${T.border}`, borderRadius: 5, padding: '7px 10px', marginBottom: 4 }}>
              <div style={{ fontSize: 12, color: T.textPrimary }}>{r.role} · {r.methods.join(', ')}{r.offsetMin ? ` · ${r.offsetMin}min before` : ''}</div>
              <button onClick={() => setRules(rules.filter(x => x.id !== r.id))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.textDanger, fontSize: 13 }}><i className="ti ti-trash" /></button>
            </div>
          ))}
          {addingFor === ev.id && (
            <div style={{ background: T.bgAccent, border: `0.5px solid ${T.borderAccent}`, borderRadius: 6, padding: 12, marginTop: 4 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: T.textMuted, marginBottom: 8 }}>Role</div>
              <select value={formRole} onChange={e => setFormRole(e.target.value)} style={{ fontFamily: T.font, fontSize: 13, border: `0.5px solid ${T.borderStrong}`, borderRadius: 5, padding: '6px 10px', width: '100%', marginBottom: 10 }}>
                <option value="">Search roles…</option>
                <option value="Manager">Manager</option>
                <option value="Shift Lead">Shift Lead</option>
                <option value="Employee">Employee</option>
                <option value="Admin">Admin</option>
              </select>
              <div style={{ fontSize: 11, fontWeight: 600, color: T.textMuted, marginBottom: 6 }}>Method</div>
              <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                {['Push','Text','Email'].map(m => (
                  <div key={m} onClick={() => setFormMethods(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m])} style={{ padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 500, cursor: 'pointer', border: `0.5px solid ${formMethods.includes(m) ? T.fillAccent : T.borderStrong}`, background: formMethods.includes(m) ? T.fillAccent : T.surface2, color: formMethods.includes(m) ? T.onAccent : T.textSecondary }}>
                    {m}
                  </div>
                ))}
              </div>
              {ev.id === 'before-due' && (
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: T.textMuted, marginBottom: 4 }}>Offset (minutes before due)</div>
                  <input type="number" value={formOffset} onChange={e => setFormOffset(Number(e.target.value))} style={{ fontFamily: T.font, fontSize: 13, border: `0.5px solid ${T.borderStrong}`, borderRadius: 5, padding: '6px 10px', width: '100%' }} />
                </div>
              )}
              <div style={{ display: 'flex', gap: 8 }}>
                <Btn primary disabled={!formRole || !formMethods.length} onClick={() => saveRule(ev.id)}>Save</Btn>
                <button onClick={() => setAddingFor(null)} style={{ fontFamily: T.font, fontSize: 12, color: T.textMuted, background: 'none', border: 'none', cursor: 'pointer' }}>Cancel</button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Settings tab ──────────────────────────────────────────────────────────
function SettingsTab({ scoringOn, setScoringOn }: { scoringOn: boolean; setScoringOn: (v: boolean) => void }) {
  const [submission, setSubmission] = useState('anyone-anytime');
  const [listScoreVisible, setListScoreVisible] = useState(true);
  const [itemScoreVisible, setItemScoreVisible] = useState(false);
  const [rbacAnyone, setRbacAnyone] = useState(true);
  const [allowCreate, setAllowCreate] = useState(false);
  const [allowGeo, setAllowGeo] = useState(false);
  const [sharedIndividual, setSharedIndividual] = useState(false);

  return (
    <div style={{ padding: '16px 16px', maxWidth: 720 }}>
      {/* List submission */}
      <SectionHeader label="List submission" summary={submission === 'anyone-anytime' ? 'Anyone can submit at any time' : 'Restricted submission'}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { value: 'anyone-anytime', label: 'Anyone can submit the list at any time' },
            { value: 'assigned-only', label: 'Only the assigned person can submit' },
            { value: 'any-complete', label: 'Any user with access can submit once all items are complete' },
          ].map(opt => (
            <label key={opt.value} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
              <input type="radio" name="submission" value={opt.value} checked={submission === opt.value} onChange={() => setSubmission(opt.value)} style={{ accentColor: T.fillAccent, width: 14, height: 14 }} />
              <span style={{ fontSize: 13, color: T.textPrimary }}>{opt.label}</span>
            </label>
          ))}
        </div>
      </SectionHeader>

      {/* Scoring */}
      <SectionHeader label="Scoring" summary={scoringOn ? 'Score enabled' : 'Score off'} right={<Toggle on={scoringOn} onChange={setScoringOn} />} defaultOpen={scoringOn}>
        {scoringOn && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, color: T.textPrimary }}>List score visible</span>
              <Toggle on={listScoreVisible} onChange={setListScoreVisible} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, color: T.textPrimary }}>Item score visible</span>
              <Toggle on={itemScoreVisible} onChange={setItemScoreVisible} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, color: T.textPrimary }}>Flagged item scores count</span>
              <Toggle on={false} onChange={() => {}} />
            </div>
          </div>
        )}
      </SectionHeader>

      {/* List schedule */}
      <SectionHeader label="List schedule" summary="No schedule configured" defaultOpen={false}>
        <div style={{ background: T.bgAccent, border: `0.5px solid ${T.borderAccent}`, borderRadius: 6, padding: '10px 14px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
          <i className="ti ti-info-circle" style={{ color: T.textAccent, fontSize: 14 }} />
          <span style={{ fontSize: 12, color: T.textAccent }}>Changes to the schedule will apply to all 11 locations.</span>
        </div>
        {/* Display times */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Display times</div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', background: T.surface0, borderRadius: 6, padding: '8px 12px', marginBottom: 6, border: `0.5px solid ${T.border}` }}>
            <span style={{ fontSize: 13, color: T.textPrimary, flex: 1 }}>6:00 AM</span>
            <span style={{ fontSize: 12, color: T.textMuted }}>Due after 2h</span>
            <span style={{ fontSize: 12, color: T.textMuted, marginLeft: 8 }}>Expires after 4h</span>
            <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.textMuted, fontSize: 14, marginLeft: 8 }}><i className="ti ti-x" /></button>
          </div>
          <Btn><i className="ti ti-plus" /> Add display time</Btn>
        </div>
        {/* Repeats */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Repeats</div>
          <div style={{ display: 'flex', background: T.surface0, borderRadius: 6, padding: 2, border: `0.5px solid ${T.border}`, width: 'fit-content' }}>
            {['Daily','Weekly','Monthly','Custom'].map(r => (
              <div key={r} style={{ padding: '5px 14px', borderRadius: 5, fontSize: 12, fontWeight: 500, cursor: 'pointer', color: r === 'Daily' ? T.onAccent : T.textSecondary, background: r === 'Daily' ? T.fillAccent : 'transparent' }}>{r}</div>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[{ l: 'Bump lists', on: true }, { l: 'Offer to re-display', on: false }, { l: 'Ignore blackouts', on: false }].map(row => (
            <div key={row.l} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, color: T.textPrimary }}>{row.l}</span>
              <Toggle on={row.on} onChange={() => {}} />
            </div>
          ))}
        </div>
      </SectionHeader>

      {/* Notifications */}
      <SectionHeader label="Notifications" summary="5 events configured" defaultOpen={false}>
        <NotificationSection />
      </SectionHeader>

      {/* Role-based access */}
      <SectionHeader label="Role-based access" summary={rbacAnyone ? 'Anyone with access can complete' : 'Restricted to roles'} defaultOpen={false}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <span style={{ fontSize: 13, color: T.textPrimary }}>Anyone</span>
          <Toggle on={rbacAnyone} onChange={setRbacAnyone} />
        </div>
        {!rbacAnyone && (
          <>
            <Btn><i className="ti ti-plus" /> Add role</Btn>
          </>
        )}
      </SectionHeader>

      {/* Create settings */}
      <SectionHeader label="Create settings" summary="Default create settings" defaultOpen={false}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 13, color: T.textPrimary }}>Allow employees to create lists</div>
              <div style={{ fontSize: 12, color: T.textMuted, marginTop: 2 }}>Allow employees to start a new instance of this list at any time</div>
            </div>
            <Toggle on={allowCreate} onChange={setAllowCreate} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 13, color: T.textPrimary }}>Require location confirmation</div>
              <div style={{ fontSize: 12, color: T.textMuted, marginTop: 2 }}>GPS-verify the user is at the correct location</div>
            </div>
            <Toggle on={allowGeo} onChange={setAllowGeo} />
          </div>
        </div>
      </SectionHeader>

      {/* Shared or individual */}
      <SectionHeader label="Shared or individual" summary={sharedIndividual ? 'Individual — each person gets their own copy' : 'Shared — one list per location'} defaultOpen={false}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: sharedIndividual ? 12 : 0 }}>
          <span style={{ fontSize: 13, color: T.textPrimary }}>Individual lists</span>
          <Toggle on={sharedIndividual} onChange={setSharedIndividual} />
        </div>
        {sharedIndividual && (
          <div style={{ background: T.bgWarning, border: `0.5px solid #FFD54F`, borderRadius: 6, padding: '10px 12px', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
            <i className="ti ti-alert-triangle" style={{ color: T.textWarning, fontSize: 14, marginTop: 1 }} />
            <span style={{ fontSize: 12, color: T.textWarning, lineHeight: 1.5 }}>Changing to individual will create separate list instances per person. Existing shared data will not be affected.</span>
          </div>
        )}
      </SectionHeader>
    </div>
  );
}

// ── Column picker ─────────────────────────────────────────────────────────
const COLUMN_GROUPS: { group: string; cols: { key: string; label: string }[] }[] = [
  { group: 'All', cols: [
    { key: 'all-mark-as',           label: 'Mark as' },
    { key: 'all-color',             label: 'Color' },
    { key: 'all-info-library',      label: 'Info library inline' },
    { key: 'all-points',            label: 'Points' },
    { key: 'all-print-label',       label: 'Print Label' },
    { key: 'all-tag-location',      label: 'Tag - Location' },
    { key: 'all-tag-scoring',       label: 'Tag - Scoring' },
    { key: 'all-tag-importance',    label: 'Tag - Importance' },
  ]},
  { group: 'Y/N', cols: [
    { key: 'yn-score-y',            label: 'Score - Y' },
    { key: 'yn-score-n',            label: 'Score - N' },
    { key: 'yn-auto-complete',      label: 'Auto Complete' },
  ]},
  { group: 'M — Measurement', cols: [
    { key: 'm-saved-value',         label: 'Saved Value' },
    { key: 'm-type',                label: 'Type' },
    { key: 'm-method',              label: 'Method' },
    { key: 'm-unit',                label: 'Unit' },
    { key: 'm-range1-min',          label: 'Range 1 Min' },
    { key: 'm-range1-max',          label: 'Range 1 Max' },
    { key: 'm-range2-min',          label: 'Range 2 Min' },
    { key: 'm-range2-max',          label: 'Range 2 Max' },
    { key: 'm-range3-min',          label: 'Range 3 Min' },
    { key: 'm-range3-max',          label: 'Range 3 Max' },
    { key: 'm-sensor-name',         label: 'Sensor name' },
  ]},
  { group: 'MC — Multiple Choice', cols: [
    { key: 'mc-multi-select',       label: 'Multi-select' },
    { key: 'mc-show-inline',        label: 'Show inline' },
  ]},
  { group: 'CA — Corrective Action', cols: [
    { key: 'ca-turn-on',            label: 'Turn on for Y/N' },
    { key: 'ca-list',               label: 'CA List' },
    { key: 'ca-turn-on-na',         label: 'Turn on for N/A' },
    { key: 'ca-list-na',            label: 'List for NA' },
    { key: 'ca-trigger-yn',         label: 'Condition' },
    { key: 'ca-trigger-ranges',     label: 'Trigger Ranges' },
    { key: 'ca-planned',            label: 'Ad Hoc' },
    { key: 'ca-optional',           label: 'Optional' },
    { key: 'ca-repeat',             label: 'Repeat' },
  ]},
];

const ALL_COLS = COLUMN_GROUPS.flatMap(g => g.cols);

function ColumnPicker({ shownCols, onChange, scoringOn }: { shownCols: Set<string>; onChange: (next: Set<string>) => void; scoringOn: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const count = shownCols.size;
  const toggle = (key: string) => {
    const next = new Set(shownCols);
    next.has(key) ? next.delete(key) : next.add(key);
    onChange(next);
  };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          display: 'flex', alignItems: 'center', gap: 4, height: 28, padding: '0 10px',
          border: `0.5px solid ${count > 0 ? T.borderAccent : T.borderStrong}`,
          borderRadius: 5, background: count > 0 ? T.bgAccent : T.surface2,
          color: count > 0 ? T.textAccent : T.textPrimary,
          fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: T.font,
        }}
      >
        <i className="ti ti-columns" style={{ fontSize: 14 }} />
        {`Columns${count > 0 ? ` · ${count} shown` : ''}`}
        <i className="ti ti-chevron-down" style={{ fontSize: 12, marginLeft: 2 }} />
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', right: 0, zIndex: 200,
          background: T.surface2, border: `0.5px solid ${T.borderStrong}`,
          borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
          width: 224, maxHeight: 420, overflowY: 'auto',
          padding: '6px 0',
        }}>
          {/* Select all */}
          <label style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '6px 14px 8px', cursor: 'pointer', fontSize: 13,
            fontWeight: 600, color: T.textPrimary,
            borderBottom: `0.5px solid ${T.border}`, marginBottom: 4,
          }}
            onMouseEnter={e => (e.currentTarget.style.background = T.surface0)}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <input
              type="checkbox"
              checked={shownCols.size === ALL_COLS.filter(c => scoringOn || (c.key !== 'yn-score-y' && c.key !== 'yn-score-n')).length}
              onChange={() => { const available = ALL_COLS.filter(c => scoringOn || (c.key !== 'yn-score-y' && c.key !== 'yn-score-n')); onChange(shownCols.size === available.length ? new Set() : new Set(available.map(c => c.key))); }}
              style={{ accentColor: T.fillAccent, width: 13, height: 13, flexShrink: 0 }}
            />
            Select all
          </label>
          {COLUMN_GROUPS.map(group => {
            const visibleCols = group.cols.filter(c => scoringOn || (c.key !== 'yn-score-y' && c.key !== 'yn-score-n'));
            if (visibleCols.length === 0) return null;
            return (
            <div key={group.group}>
              <div style={{
                fontSize: 10, fontWeight: 700, color: T.textMuted,
                textTransform: 'uppercase', letterSpacing: '0.07em',
                padding: '8px 14px 4px',
              }}>
                {group.group}
              </div>
              {visibleCols.map(col => (
                <label key={col.key} style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '5px 14px', cursor: 'pointer', fontSize: 13,
                  color: T.textPrimary,
                }}
                  onMouseEnter={e => (e.currentTarget.style.background = T.surface0)}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <input
                    type="checkbox"
                    checked={shownCols.has(col.key)}
                    onChange={() => toggle(col.key)}
                    style={{ accentColor: T.fillAccent, width: 13, height: 13, flexShrink: 0 }}
                  />
                  {col.label}
                </label>
              ))}
            </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Points cell ───────────────────────────────────────────────────────────
function LocationTagCell({ tags }: { tags: string[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLTableCellElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  if (tags.length === 0) {
    return <td ref={ref} style={{ width: 100, padding: '0 8px', borderLeft: `0.5px solid ${T.border}`, textAlign: 'center' }}><span style={{ color: T.textMuted, fontSize: 12 }}>—</span></td>;
  }
  if (tags.length === 1) {
    return (
      <td ref={ref} style={{ width: 100, padding: '0 8px', borderLeft: `0.5px solid ${T.border}`, textAlign: 'center', overflow: 'hidden' }}>
        <span style={{ fontSize: 11, fontWeight: 500, color: T.textAccent, background: T.bgAccent, padding: '2px 7px', borderRadius: 10, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block', maxWidth: '100%' }} title={tags[0]}>{tags[0]}</span>
      </td>
    );
  }
  return (
    <td ref={ref} style={{ width: 100, padding: '0 8px', borderLeft: `0.5px solid ${T.border}`, textAlign: 'center', position: 'relative' }}>
      <span
        onClick={() => setOpen(v => !v)}
        title={tags.join(', ')}
        style={{ display: 'inline-block', fontSize: 11, fontWeight: 600, minWidth: 20, padding: '2px 7px', borderRadius: 10, background: T.bgAccent, color: T.textAccent, cursor: 'pointer' }}
      >
        {tags.length}
      </span>
      {open && (
        <div style={{ position: 'absolute', top: 'calc(100% + 4px)', right: 0, background: T.surface2, border: `0.5px solid ${T.borderStrong}`, borderRadius: 8, boxShadow: '0 4px 20px rgba(0,0,0,0.12)', zIndex: 300, minWidth: 180, maxWidth: 260, padding: '6px 0' }}>
          {tags.map(tag => (
            <div key={tag} style={{ padding: '6px 14px', fontSize: 12, color: T.textPrimary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tag}</div>
          ))}
        </div>
      )}
    </td>
  );
}

function PointsCell({ value, onCommit, allowNegative = false }: { value?: number; onCommit: (v: number | undefined) => void; allowNegative?: boolean }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const startEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDraft(value != null ? String(value) : '');
    setEditing(true);
    setTimeout(() => inputRef.current?.select(), 0);
  };
  const commit = () => {
    const n = parseInt(draft, 10);
    onCommit(isNaN(n) ? undefined : n);
    setEditing(false);
  };

  return (
    <td style={{ width: 100, padding: '0 8px', borderLeft: `0.5px solid ${T.border}`, textAlign: 'center' }}
      onClick={startEdit}>
      {editing ? (
        <input
          ref={inputRef}
          type="number"
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false); if (!allowNegative && e.key === '-') e.preventDefault(); if (e.key === 'e' || e.key === 'E' || e.key === '.' || e.key === ',') e.preventDefault(); }}
          onClick={e => e.stopPropagation()}
          style={{ fontFamily: T.font, fontSize: 12, width: 60, textAlign: 'center', border: `1px solid ${T.borderAccent}`, borderRadius: 4, padding: '2px 4px', outline: 'none' }}
        />
      ) : (
        <span style={{ fontSize: 12, color: value != null ? T.textPrimary : T.textMuted, cursor: 'pointer' }}>
          {value != null ? value : '—'}
        </span>
      )}
    </td>
  );
}

// ── Color cell ────────────────────────────────────────────────────────────
function ColorCell({ stripe, onSelect }: { stripe: string; onSelect: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLTableCellElement>(null);
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);
  return (
    <td ref={ref} style={{ width: 100, padding: '0 8px', borderLeft: `0.5px solid ${T.border}`, textAlign: 'center', position: 'relative' }}
      onClick={e => { e.stopPropagation(); setOpen(o => !o); }}>
      {stripe ? (
        <span style={{ display: 'inline-block', width: 16, height: 16, borderRadius: '50%', background: stripe, border: `1px solid rgba(0,0,0,0.12)`, cursor: 'pointer', verticalAlign: 'middle' }} />
      ) : (
        <span style={{ color: T.textMuted, fontSize: 12, cursor: 'pointer' }}>—</span>
      )}
      {open && (
        <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: '50%', transform: 'translateX(-50%)', background: T.surface2, border: `0.5px solid ${T.borderStrong}`, borderRadius: 8, padding: 8, zIndex: 200, boxShadow: '0 4px 20px rgba(0,0,0,0.12)', display: 'flex', gap: 6, flexWrap: 'wrap', width: 120 }}>
          {STRIPE_COLORS.map(sc => (
            <button key={sc.value} title={sc.label} onClick={e => { e.stopPropagation(); onSelect(sc.value); setOpen(false); }} style={{
              width: 20, height: 20, borderRadius: '50%', border: `1px solid rgba(0,0,0,0.12)`,
              background: sc.value || T.surface0, cursor: 'pointer', padding: 0, flexShrink: 0,
              outline: sc.value === stripe ? `2px solid ${T.textAccent}` : sc.value === '' ? `1px dashed ${T.borderStrong}` : 'none',
              outlineOffset: 2,
            }} />
          ))}
        </div>
      )}
    </td>
  );
}

// ── Items table row ───────────────────────────────────────────────────────
interface RowProps {
  item: ListItem;
  items: ListItem[];
  isSelected: boolean;
  isActive: boolean;
  isCut: boolean;
  dcMode: boolean;
  dcLinkingId: string | null;
  dcColors: Record<string, string>;
  kebabOpenId: string | null;
  shownCols: Set<string>;
  colValues: Record<string, Record<string, string>>;
  onColChange: (itemId: string, colKey: string, value: string | null) => void;
  onUpdate: (id: string, patch: Partial<ListItem>) => void;
  onCheckbox: (id: string) => void;
  onRowClick: (id: string) => void;
  onKebab: (id: string) => void;
  onKebabClose: () => void;
  onKebabAction: (action: string, id: string) => void;
  onDCClick: (id: string) => void;
  caToastId: string | null;
  onCaToast: (key: string | null) => void;
}

const isYNCaUnconfigured = (item: ListItem) =>
  (item.caForYNRules?.length ?? 0) > 0 &&
  item.caForYNRules!.every(r => !r.caList && !r.adHoc);

const isNACaUnconfigured = (item: ListItem) =>
  !!item.caForNA && !item.caForNAList && !item.caForNAAdHoc;

function ItemRow({ item, items, isSelected, isActive, isCut, dcMode, dcLinkingId, dcColors, kebabOpenId, shownCols, colValues, onColChange, onUpdate, onCheckbox, onRowClick, onKebab, onKebabClose, onKebabAction, onDCClick, caToastId, onCaToast }: RowProps) {
  const [hovered, setHovered] = useState(false);
  const isSubtitle = item.type === 'subtitle';
  const meta = TYPE_META[item.type];
  const parent = item.dcParentId ? findItem(items, item.dcParentId) : null;
  const isChild = !!item.dcParentId;
  const condLabel = dcCondLabel(item.dcCondition);
  const parentColor = item.dcParentId ? (dcColors[item.dcParentId] ?? T.fillAccent) : '';
  const isEligibleParent = dcMode && dcLinkingId && item.id !== dcLinkingId && (item.type === 'yn' || item.type === 'measurement');
  const isLinkingChild = dcMode && dcLinkingId === item.id;
  const isTypeDimmed = dcMode && dcLinkingId && !isEligibleParent && !isLinkingChild;

  const derivedInds: { icon: string; title: string }[] = [
    ...((item.flagsForYes?.length ?? 0) > 0 || (item.flagsForNo?.length ?? 0) > 0 ? [{ icon: 'ti-flag', title: 'Flags configured' }] : []),
    ...((item.infoInline || (item as any).infoFile) ? [{ icon: 'ti-info-circle', title: 'Info Library configured' }] : []),
    ...((item.caForYNRules?.length ?? 0) > 0 || item.caForNA ? [{ icon: 'ti-alert-triangle', title: 'Corrective Action configured' }] : []),
    ...(!!item.dcParentId || items.some(x => x.dcParentId === item.id) ? [{ icon: 'ti-filter', title: 'Display Criteria configured' }] : []),
  ];
  const activeCols = ALL_COLS.filter(c => shownCols.has(c.key));
  const stickyBg = isActive || isLinkingChild ? T.bgAccent : T.surface2;
  const sticky = (left: number, extra?: React.CSSProperties): React.CSSProperties => ({
    position: 'sticky', left, zIndex: 1, background: stickyBg, ...extra,
  });

  return (
    <tr style={{
      height: 44, borderBottom: `0.5px solid ${T.border}`,
      background: isActive ? T.bgAccent : isLinkingChild ? T.bgAccent : T.surface2,
      opacity: isCut ? 0.4 : isTypeDimmed ? 0.28 : 1,
      position: 'relative',
    }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Drag handle */}
      <td style={sticky(0, { width: 28, padding: 0 })}>
        <div style={{ width: 28, height: 44, display: 'flex', alignItems: 'center', paddingLeft: 8, paddingRight: 3, color: T.textMuted, fontSize: 14, opacity: hovered || isActive ? 1 : 0 }}>
          <i className="ti ti-grip-vertical" />
        </div>
      </td>
      {/* Checkbox */}
      <td style={sticky(28, { width: 30, padding: '0 6px' })}>
        <input type="checkbox" checked={isSelected} onChange={() => onCheckbox(item.id)} style={{ accentColor: T.fillAccent, width: 13, height: 13, display: 'block', opacity: hovered || isSelected || isActive ? 1 : 0, cursor: 'pointer' }} />
      </td>
      {/* Stripe */}
      <td style={sticky(58, { width: 4, padding: 0 })}>
        <div style={{ width: 4, height: 44, background: item.stripe || 'transparent' }} />
      </td>
      {/* Prompt */}
      <td style={sticky(62, { padding: 0, width: activeCols.length > 0 ? 300 : undefined })} onClick={() => dcMode ? onDCClick(item.id) : onRowClick(item.id)}>
        <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 1, background: T.borderStrong, zIndex: 2 }} />
        <div style={{ display: 'flex', alignItems: 'center', height: 44, padding: '0 8px', gap: 6, cursor: dcMode ? 'pointer' : 'default', overflow: 'hidden', width: '100%' }}>
          {isChild && <span style={{ fontSize: 12, color: T.textMuted, flexShrink: 0 }}>↳</span>}
          <span style={{ fontSize: 13, color: isLinkingChild || (isActive && !dcMode) ? T.textAccent : T.textPrimary, fontWeight: isLinkingChild || (isActive && !dcMode) ? 500 : 400, flex: 1, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{item.prompt}</span>
          {/* DC mode overlays */}
          {dcMode && !dcLinkingId && parent && (
            <span style={{ fontSize: 10, fontWeight: 500, color: 'white', background: parentColor, padding: '2px 7px', borderRadius: 10, whiteSpace: 'nowrap', flexShrink: 0 }}>{condLabel}</span>
          )}
          {dcMode && !dcLinkingId && !parent && item.type !== 'subtitle' && (
            (() => {
              const hasChildren = items.some(x => x.dcParentId === item.id);
              return hasChildren ? (
                <span style={{ fontSize: 10, fontWeight: 500, padding: '2px 7px', borderRadius: 3, background: `${dcColors[item.id] || T.fillAccent}18`, color: dcColors[item.id] || T.fillAccent, flexShrink: 0 }}>parent</span>
              ) : null;
            })()
          )}
          {isEligibleParent && (
            <button style={{ fontFamily: T.font, fontSize: 10, fontWeight: 600, color: T.textAccent, background: T.bgAccent, border: `0.5px solid ${T.borderAccent}`, borderRadius: 4, padding: '2px 8px', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }} onClick={(e) => { e.stopPropagation(); onDCClick(item.id); }}>Set as parent</button>
          )}
        </div>
      </td>
      {/* Type icon */}
      <td style={{ width: 32, padding: '0 5px', borderLeft: `0.5px solid ${T.border}`, textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 44 }}>
          <i className={`ti ${meta.icon}`} style={{ fontSize: 15, color: T.textMuted }} title={meta.label} />
        </div>
      </td>
      {/* Config indicators */}
      <td style={{ width: 100, padding: '0 8px', borderLeft: `0.5px solid ${T.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, height: 44 }}>
          {derivedInds.map(ind => <i key={ind.icon} className={`ti ${ind.icon}`} style={{ fontSize: 13, color: indColor(ind.icon) }} title={ind.title} />)}
        </div>
      </td>
      {/* Optional columns */}
      {activeCols.map(col => {
        if (col.key === 'all-mark-as') {
          const CYCLE: (string | null)[] = [null, 'N/A', 'OOO'];
          const CHIP: Record<string, { bg: string; color: string }> = {
            'N/A': { bg: T.surface0,  color: T.textSecondary },
            'OOO': { bg: T.bgWarning, color: T.textWarning },
          };
          const cur = (colValues[item.id] ?? {})['all-mark-as'] ?? null;
          const next = CYCLE[(CYCLE.indexOf(cur) + 1) % CYCLE.length];
          const chip = cur ? CHIP[cur] : null;
          return (
            <td key={col.key} style={{ width: 100, padding: '0 8px', borderLeft: `0.5px solid ${T.border}`, textAlign: 'center' }}
              onClick={e => { e.stopPropagation(); onColChange(item.id, 'all-mark-as', next); }}>
              {chip ? (
                <span style={{ display: 'inline-block', fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 4, background: chip.bg, color: chip.color, cursor: 'pointer', userSelect: 'none' }}>
                  {cur}
                </span>
              ) : (
                <span style={{ color: T.textMuted, fontSize: 12, cursor: 'pointer' }}>—</span>
              )}
            </td>
          );
        }
        if (col.key === 'all-color') {
          return <ColorCell key={col.key} stripe={item.stripe} onSelect={v => onUpdate(item.id, { stripe: v })} />;
        }
        if (col.key === 'all-info-library') {
          const on = !!item.infoInline;
          return (
            <td key={col.key} style={{ width: 100, padding: '0 8px', borderLeft: `0.5px solid ${T.border}`, textAlign: 'center', cursor: 'pointer' }}
              onClick={e => { e.stopPropagation(); onUpdate(item.id, { infoInline: !on }); }}>
              <i className={`ti ${on ? 'ti-checkbox' : 'ti-square'}`} style={{ fontSize: 15, color: on ? T.textAccent : T.textMuted }} />
            </td>
          );
        }
        if (col.key === 'all-points') {
          return <PointsCell key={col.key} value={item.points} onCommit={v => onUpdate(item.id, { points: v })} />;
        }
        if (col.key === 'ca-turn-on-na') {
          if (item.type !== 'yn' && item.type !== 'measurement') return <td key={col.key} style={{ width: 100, padding: '0 8px', borderLeft: `0.5px solid ${T.border}`, textAlign: 'center' }}><span style={{ color: T.textMuted, fontSize: 12 }}>—</span></td>;
          const on = !!item.caForNA;
          const unconfigured = isNACaUnconfigured(item);
          const toastKey = `${item.id}:ca-turn-on-na`;
          const showToast = caToastId === toastKey;
          return (
            <td key={col.key} style={{ width: 100, padding: '0 8px', borderLeft: `0.5px solid ${T.border}`, textAlign: 'center', cursor: 'pointer', position: 'relative', outline: unconfigured ? `1.5px solid #EF5350` : 'none', outlineOffset: -1 }}
              onClick={e => {
                e.stopPropagation();
                if (!on) {
                  onUpdate(item.id, { caForNA: true });
                  onCaToast(toastKey);
                  setTimeout(() => onCaToast(null), 3000);
                } else {
                  onUpdate(item.id, { caForNA: false });
                  onCaToast(null);
                }
              }}>
              <i className={`ti ${on ? 'ti-checkbox' : 'ti-square'}`} style={{ fontSize: 15, color: unconfigured ? '#EF5350' : on ? T.textAccent : T.textMuted }} />
              {showToast && (
                <div style={{ position: 'absolute', bottom: 'calc(100% + 6px)', right: 0, background: '#323232', color: '#fff', borderRadius: 6, padding: '7px 10px', fontSize: 12, whiteSpace: 'nowrap', zIndex: 500, boxShadow: '0 4px 12px rgba(0,0,0,0.2)', pointerEvents: 'none' }}>
                  Configure corrective action in item settings
                  <div style={{ position: 'absolute', bottom: -4, right: 12, width: 8, height: 8, background: '#323232', clipPath: 'polygon(0 0, 100% 0, 50% 100%)' }} />
                </div>
              )}
            </td>
          );
        }
        if (col.key === 'ca-turn-on') {
          if (item.type !== 'yn') return <td key={col.key} style={{ width: 100, padding: '0 8px', borderLeft: `0.5px solid ${T.border}`, textAlign: 'center' }}><span style={{ color: T.textMuted, fontSize: 12 }}>—</span></td>;
          const on = (item.caForYNRules?.length ?? 0) > 0;
          const unconfigured = isYNCaUnconfigured(item);
          const toastKey = `${item.id}:ca-turn-on`;
          const showToast = caToastId === toastKey;
          return (
            <td key={col.key} style={{ width: 100, padding: '0 8px', borderLeft: `0.5px solid ${T.border}`, textAlign: 'center', cursor: 'pointer', position: 'relative', outline: unconfigured ? `1.5px solid #EF5350` : 'none', outlineOffset: -1 }}
              onClick={e => {
                e.stopPropagation();
                if (!on) {
                  onUpdate(item.id, { caForYNRules: [{ id: mkid(), condition: 'No', caList: '', adHoc: false, nextStep: 'repeat-item' }] });
                  onCaToast(toastKey);
                  setTimeout(() => onCaToast(null), 3000);
                } else {
                  onUpdate(item.id, { caForYNRules: [] });
                  onCaToast(null);
                }
              }}>
              <i className={`ti ${on ? 'ti-checkbox' : 'ti-square'}`} style={{ fontSize: 15, color: unconfigured ? '#EF5350' : on ? T.textAccent : T.textMuted }} />
              {showToast && (
                <div style={{ position: 'absolute', bottom: 'calc(100% + 6px)', right: 0, background: '#323232', color: '#fff', borderRadius: 6, padding: '7px 10px', fontSize: 12, whiteSpace: 'nowrap', zIndex: 500, boxShadow: '0 4px 12px rgba(0,0,0,0.2)', pointerEvents: 'none' }}>
                  Configure corrective action in item settings
                  <div style={{ position: 'absolute', bottom: -4, right: 12, width: 8, height: 8, background: '#323232', clipPath: 'polygon(0 0, 100% 0, 50% 100%)' }} />
                </div>
              )}
            </td>
          );
        }
        if (col.key === 'ca-repeat') {
          const ynStep = item.caForYNRules?.[0]?.nextStep ?? 'repeat-item';
          const naStep = item.caForNA ? (item.caForNANextStep ?? 'repeat-item') : null;
          const ynOn = (item.caForYNRules?.length ?? 0) > 0;
          const pillStyle = (bg: string, color: string) => ({ fontSize: 11, fontWeight: 600, padding: '2px 7px', borderRadius: 10, background: bg, color } as React.CSSProperties);
          const stepLabel = (s: string) => s === 'repeat-item' ? 'Item' : s === 'repeat-list' ? 'List' : null;
          const ynLabel = ynOn ? stepLabel(ynStep) : null;
          const naLabel = naStep ? stepLabel(naStep) : null;
          if (!ynLabel && !naLabel) return <td key={col.key} style={{ width: 100, padding: '0 8px', borderLeft: `0.5px solid ${T.border}`, textAlign: 'center' }}><span style={{ color: T.textMuted, fontSize: 12 }}>—</span></td>;
          return (
            <td key={col.key} style={{ width: 100, padding: '0 8px', borderLeft: `0.5px solid ${T.border}`, textAlign: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                {ynLabel && <span style={pillStyle(T.bgAccent, T.textAccent)}>{ynLabel}</span>}
                {naLabel && <span style={pillStyle(T.surface1, T.textSecondary)}>{naLabel}</span>}
              </div>
            </td>
          );
        }
        if (col.key === 'ca-optional') {
          const ynOptional = item.caForYNRules?.some(r => r.optional) ?? false;
          const naOptional = !!item.caForNAOptional;
          if (!ynOptional && !naOptional) return <td key={col.key} style={{ width: 100, padding: '0 8px', borderLeft: `0.5px solid ${T.border}`, textAlign: 'center' }}><span style={{ color: T.textMuted, fontSize: 12 }}>—</span></td>;
          return (
            <td key={col.key} style={{ width: 100, padding: '0 8px', borderLeft: `0.5px solid ${T.border}`, textAlign: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                {ynOptional && <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 7px', borderRadius: 10, background: T.bgAccent, color: T.textAccent }}>Y/N</span>}
                {naOptional && <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 7px', borderRadius: 10, background: T.surface1, color: T.textSecondary }}>N/A</span>}
              </div>
            </td>
          );
        }
        if (col.key === 'ca-planned') {
          const ynAdHoc = item.caForYNRules?.some(r => r.adHoc) ?? false;
          const naAdHoc = !!item.caForNAAdHoc;
          if (!ynAdHoc && !naAdHoc) return <td key={col.key} style={{ width: 100, padding: '0 8px', borderLeft: `0.5px solid ${T.border}`, textAlign: 'center' }}><span style={{ color: T.textMuted, fontSize: 12 }}>—</span></td>;
          return (
            <td key={col.key} style={{ width: 100, padding: '0 8px', borderLeft: `0.5px solid ${T.border}`, textAlign: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                {ynAdHoc && <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 7px', borderRadius: 10, background: T.bgAccent, color: T.textAccent }}>Y/N</span>}
                {naAdHoc && <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 7px', borderRadius: 10, background: T.surface1, color: T.textSecondary }}>N/A</span>}
              </div>
            </td>
          );
        }
        if (col.key === 'ca-trigger-yn') {
          const rules = item.caForYNRules ?? [];
          if (rules.length === 0) return <td key={col.key} style={{ width: 100, padding: '0 8px', borderLeft: `0.5px solid ${T.border}`, textAlign: 'center' }}><span style={{ color: T.textMuted, fontSize: 12 }}>—</span></td>;
          return (
            <td key={col.key} style={{ width: 100, padding: '0 8px', borderLeft: `0.5px solid ${T.border}`, textAlign: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                {rules.map(r => (
                  <span key={r.id} style={{ fontSize: 11, fontWeight: 600, padding: '2px 7px', borderRadius: 10, background: r.condition === 'Yes' ? '#E8F5E9' : '#FFEBEE', color: r.condition === 'Yes' ? '#388E3C' : '#C62828' }}>
                    {r.condition ?? 'No'}
                  </span>
                ))}
              </div>
            </td>
          );
        }
        if (col.key === 'ca-list' || col.key === 'ca-list-na') {
          const listId = col.key === 'ca-list'
            ? (item.caForYNRules?.find(r => r.caList)?.caList ?? '')
            : (item.caForNAList ?? '');
          const listName = CA_LISTS.find(l => l.id === listId)?.title ?? '';
          return (
            <td key={col.key} style={{ width: 100, padding: '0 8px', borderLeft: `0.5px solid ${T.border}`, textAlign: 'center' }}>
              {listName ? (
                <span title={listName} style={{ display: 'inline-block', maxWidth: 84, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 11, fontWeight: 500, padding: '2px 6px', borderRadius: 10, background: T.bgAccent, color: T.textAccent, verticalAlign: 'middle' }}>
                  {listName}
                </span>
              ) : (
                <span style={{ color: T.textMuted, fontSize: 12 }}>—</span>
              )}
            </td>
          );
        }
        if (col.key === 'yn-score-y') {
          if (item.type !== 'yn') return <td key={col.key} style={{ width: 100, padding: '0 12px', borderLeft: `0.5px solid ${T.border}`, textAlign: 'center', color: T.textMuted, fontSize: 12 }}>—</td>;
          return <PointsCell key={col.key} value={item.scoreYes} onCommit={v => onUpdate(item.id, { scoreYes: v })} allowNegative />;
        }
        if (col.key === 'yn-score-n') {
          if (item.type !== 'yn') return <td key={col.key} style={{ width: 100, padding: '0 12px', borderLeft: `0.5px solid ${T.border}`, textAlign: 'center', color: T.textMuted, fontSize: 12 }}>—</td>;
          return <PointsCell key={col.key} value={item.scoreNo} onCommit={v => onUpdate(item.id, { scoreNo: v })} allowNegative />;
        }
        if (col.key === 'yn-auto-complete') {
          if (item.type !== 'yn') return <td key={col.key} style={{ width: 100, padding: '0 12px', borderLeft: `0.5px solid ${T.border}`, textAlign: 'center', color: T.textMuted, fontSize: 12 }}>—</td>;
          return (
            <td key={col.key} style={{ width: 100, padding: '0 8px', borderLeft: `0.5px solid ${T.border}`, textAlign: 'center' }}>
              {item.autoComplete
                ? <i className="ti ti-bolt" style={{ fontSize: 15, color: T.textAccent }} title="Auto complete" />
                : <span style={{ color: T.textMuted, fontSize: 12 }}>—</span>}
            </td>
          );
        }
        if (col.key === 'all-print-label') {
          const count = item.labelIds?.length ?? 0;
          return (
            <td key={col.key} style={{ width: 100, padding: '0 8px', borderLeft: `0.5px solid ${T.border}`, textAlign: 'center' }}>
              {count > 0 ? (
                <span style={{ display: 'inline-block', fontSize: 11, fontWeight: 600, minWidth: 20, padding: '2px 7px', borderRadius: 10, background: T.bgAccent, color: T.textAccent }}>
                  {count}
                </span>
              ) : (
                <span style={{ color: T.textMuted, fontSize: 12 }}>—</span>
              )}
            </td>
          );
        }
        if (col.key === 'all-tag-location') {
          const tags = item.locationTags ?? [];
          return <LocationTagCell key={col.key} tags={tags} />;
        }
        if (col.key === 'all-tag-scoring') {
          return (
            <td key={col.key} style={{ width: 100, padding: '0 8px', borderLeft: `0.5px solid ${T.border}`, textAlign: 'center', overflow: 'hidden' }}>
              {item.scoreGroup ? (
                <span style={{ fontSize: 11, fontWeight: 500, color: T.textAccent, background: T.bgAccent, padding: '2px 7px', borderRadius: 10, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block', maxWidth: '100%' }} title={item.scoreGroup}>
                  {item.scoreGroup}
                </span>
              ) : (
                <span style={{ color: T.textMuted, fontSize: 12 }}>—</span>
              )}
            </td>
          );
        }
        if (col.key === 'all-tag-importance') {
          const IMP_COLORS: Record<string, { bg: string; color: string }> = {
            Critical: { bg: '#FDECEA', color: '#B71C1C' },
            Major:    { bg: '#FFF3E0', color: '#E65100' },
            Minor:    { bg: '#F3F8FF', color: T.textAccent },
          };
          const s = item.importance ? (IMP_COLORS[item.importance] ?? { bg: T.bgAccent, color: T.textAccent }) : null;
          return (
            <td key={col.key} style={{ width: 100, padding: '0 8px', borderLeft: `0.5px solid ${T.border}`, textAlign: 'center' }}>
              {s ? (
                <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 7px', borderRadius: 10, background: s.bg, color: s.color }}>
                  {item.importance}
                </span>
              ) : (
                <span style={{ color: T.textMuted, fontSize: 12 }}>—</span>
              )}
            </td>
          );
        }
        return (
          <td key={col.key} style={{ width: 100, padding: '0 12px', borderLeft: `0.5px solid ${T.border}`, textAlign: 'center', color: T.textMuted, fontSize: 12 }}>
            —
          </td>
        );
      })}
      {/* Kebab */}
      <td style={{ width: 32, padding: '0 4px', position: 'relative', borderLeft: hovered || isActive ? `0.5px solid ${T.border}` : '0.5px solid transparent' }}>
        <button onClick={(e) => { e.stopPropagation(); onKebab(item.id); }} style={{ width: 24, height: 24, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: T.textSecondary, border: 'none', background: 'none', cursor: 'pointer', opacity: hovered || isActive || kebabOpenId === item.id ? 1 : 0, margin: 'auto' }}>
          <i className="ti ti-dots-vertical" />
        </button>
        {kebabOpenId === item.id && (
          <div style={{ position: 'absolute', right: 4, top: 'calc(100% - 4px)', background: T.surface2, border: `0.5px solid ${T.borderStrong}`, borderRadius: 8, padding: '6px 0', width: 190, zIndex: 100, boxShadow: '0 4px 20px rgba(0,0,0,0.12)' }}>
            {[
              { action: 'edit', icon: 'ti-pencil', label: 'Edit prompt' },
              { action: 'change-type', icon: 'ti-refresh', label: 'Change item type' },
              { action: 'duplicate', icon: 'ti-copy', label: 'Duplicate' },
            ].map(kmi => (
              <div key={kmi.action} onClick={() => onKebabAction(kmi.action, item.id)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 14px', fontSize: 13, color: T.textPrimary, cursor: 'pointer' }}
                onMouseEnter={e => (e.currentTarget.style.background = T.surface1)}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                <i className={`ti ${kmi.icon}`} style={{ fontSize: 15, color: T.textMuted, width: 18 }} />{kmi.label}
              </div>
            ))}
            <div style={{ height: 0.5, background: T.border, margin: '4px 0' }} />
            <div onClick={() => onKebabAction('delete', item.id)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 14px', fontSize: 13, color: T.textDanger, cursor: 'pointer' }}
              onMouseEnter={e => (e.currentTarget.style.background = T.surface1)}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
              <i className="ti ti-trash" style={{ fontSize: 15, color: T.textDanger, width: 18 }} />Delete item
            </div>
          </div>
        )}
      </td>
    </tr>
  );
}

// ── Main editor ────────────────────────────────────────────────────────────
export default function JoltListEditorPage() {
  const [activeTab, setActiveTab] = useState<'items' | 'settings'>('items');
  const [scoringOn, setScoringOn] = useState(true);
  const [flags, setFlags] = useState<Flag[]>(INITIAL_FLAGS);
  const handleCreateFlag = (flag: Flag) => setFlags(prev => [...prev, flag]);
  const [caToastId, setCaToastId] = useState<string | null>(null);
  const [items, setItems] = useState<ListItem[]>(INITIAL_ITEMS);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const [cutIds, setCutIds] = useState<Set<string>>(new Set());
  const [dcMode, setDcMode] = useState(false);
  const [dcLinkingId, setDcLinkingId] = useState<string | null>(null);
  const [dcConditionState, setDcConditionState] = useState<{ childId: string; parentId: string } | null>(null);
  const [colValues, setColValues] = useState<Record<string, Record<string, string>>>({});
  const setColValue = (itemId: string, colKey: string, value: string | null) => {
    setColValues(prev => {
      const row = { ...prev[itemId] };
      if (value === null) delete row[colKey]; else row[colKey] = value;
      return { ...prev, [itemId]: row };
    });
  };
  const [shownCols, setShownCols] = useState<Set<string>>(new Set([
    'all-mark-as', 'all-color', 'all-info-library', 'all-points', 'all-print-label',
    'yn-score-y', 'yn-score-n', 'yn-auto-complete',
  ]));
  const effectiveShownCols = React.useMemo(() => {
    if (scoringOn) return shownCols;
    const next = new Set(shownCols);
    next.delete('yn-score-y');
    next.delete('yn-score-n');
    return next;
  }, [shownCols, scoringOn]);
  const handleSetScoringOn = (v: boolean) => {
    if (!v) {
      setItems(prev => prev.map(item => ({ ...item, scoreYes: undefined, scoreNo: undefined, scoreEnabled: undefined })));
    } else {
      setShownCols(prev => new Set([...prev, 'yn-score-y', 'yn-score-n']));
    }
    setScoringOn(v);
  };
  const [showAddPopover, setShowAddPopover] = useState(false);
  const [kebabOpenId, setKebabOpenId] = useState<string | null>(null);
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [editingPrompt, setEditingPrompt] = useState('');
  const editInputRef = useRef<HTMLInputElement>(null);
  const addBtnRef = useRef<HTMLDivElement>(null);

  useEffect(() => { if (editingRowId) editInputRef.current?.focus(); }, [editingRowId]);

  // Assign a stable color per DC parent
  const dcColors = React.useMemo(() => {
    const parentIds = [...new Set(items.filter(i => i.dcParentId).map(i => i.dcParentId!))];
    const map: Record<string, string> = {};
    parentIds.forEach((id, idx) => { map[id] = DC_COLORS[idx % DC_COLORS.length]; });
    return map;
  }, [items]);

  const allItems = items;
  const totalItems = items.filter(i => i.type !== 'subtitle').length;

  function updateItem(id: string, updates: Partial<ListItem>) {
    setItems(prev => prev.map(it => it.id === id ? { ...it, ...updates } : it));
    const current = items.find(it => it.id === id);
    if (current) {
      const m = { ...current, ...updates };
      const rules: CARule[] = m.caForYNRules ?? [];
      const toAdd: string[] = [];
      if (rules.length > 0)                                                       toAdd.push('ca-turn-on');
      if (m.caForNA)                                                              toAdd.push('ca-turn-on-na');
      if (rules.some(r => r.caList))                                             toAdd.push('ca-list');
      if (m.caForNAList)                                                          toAdd.push('ca-list-na');
      if (rules.some(r => r.condition))                                          toAdd.push('ca-trigger-yn');
      if (rules.some(r => r.adHoc) || m.caForNAAdHoc)                           toAdd.push('ca-planned');
      if (rules.some(r => r.optional) || m.caForNAOptional)                     toAdd.push('ca-optional');
      if (rules.length > 0 || m.caForNA)                                         toAdd.push('ca-repeat');
      if ((m.caForRangeRules?.length ?? 0) > 0)                                  toAdd.push('ca-trigger-ranges');
      if (m.autoComplete)                                                         toAdd.push('yn-auto-complete');
      if (m.stripe)                                                               toAdd.push('all-color');
      if (m.infoInline || m.infoFile)                                            toAdd.push('all-info-library');
      if ((m.labelIds?.length ?? 0) > 0)                                         toAdd.push('all-print-label');
      if (m.points != null)                                                       toAdd.push('all-points');
      if (toAdd.length) setShownCols(prev => new Set([...prev, ...toAdd]));
    }
    if (updates.savedValue) setShownCols(prev => new Set([...prev, 'm-saved-value']));
    if (updates.locationTags && (updates.locationTags as string[]).length > 0) setShownCols(prev => new Set([...prev, 'all-tag-location']));
    if (updates.scoreGroup) setShownCols(prev => new Set([...prev, 'all-tag-scoring']));
    if (updates.importance) setShownCols(prev => new Set([...prev, 'all-tag-importance']));
  }

  function deleteItem(id: string) {
    setItems(prev => prev.filter(it => it.id !== id).map(it => it.dcParentId === id ? { ...it, dcParentId: undefined, dcCondition: undefined } : it));
    if (activeItemId === id) setActiveItemId(null);
  }

  function duplicateItem(id: string) {
    setItems(prev => {
      const idx = prev.findIndex(it => it.id === id);
      if (idx === -1) return prev;
      const copy = { ...prev[idx], id: mkid(), prompt: prev[idx].prompt + ' (copy)' };
      const next = [...prev];
      next.splice(idx + 1, 0, copy);
      return next;
    });
  }

  function addItem(type: ItemType) {
    const newItem: ListItem = {
      id: mkid(), prompt: '', type, stripe: '', inds: [], allowNA: false,
      ...(type === 'mc' ? { choices: [{ id: mkid(), label: '', color: '', icon: null }] } : {}),
      ...(type === 'qr' ? { qrTarget: mkCodeTarget() } : {}),
      ...(type === 'barcode' ? { barcodeTarget: mkCodeTarget() } : {}),
    };
    // Insert after active item, or at end of list
    setItems(prev => {
      if (activeItemId) {
        const idx = prev.findIndex(it => it.id === activeItemId);
        if (idx !== -1) {
          const next = [...prev];
          next.splice(idx + 1, 0, newItem);
          return next;
        }
      }
      return [...prev, newItem];
    });
    setEditingRowId(newItem.id);
    setEditingPrompt('');
    setShowAddPopover(false);
    setActiveItemId(newItem.id);
  }

  function commitEdit() {
    if (editingRowId) {
      if (!editingPrompt.trim()) {
        deleteItem(editingRowId);
      } else {
        updateItem(editingRowId, { prompt: editingPrompt });
      }
      setEditingRowId(null);
    }
  }

  function handleDCClick(id: string) {
    if (!dcMode) return;
    const item = findItem(items, id);
    if (!item) return;
    if (!dcLinkingId) {
      // Start linking this item as child
      setDcLinkingId(id);
      setDcConditionState(null);
    } else if (dcLinkingId === id) {
      setDcLinkingId(null);
    } else {
      // Set as parent
      setDcConditionState({ childId: dcLinkingId, parentId: id });
      setDcLinkingId(null);
    }
  }

  function saveDCCondition(cond: DCCondition) {
    if (!dcConditionState) return;
    const { childId, parentId } = dcConditionState;
    updateItem(childId, { dcParentId: parentId, dcCondition: cond });
    setDcConditionState(null);
  }

  function removeDCLink(id: string) {
    updateItem(id, { dcParentId: undefined, dcCondition: undefined });
  }

  function handleKebabAction(action: string, id: string) {
    setKebabOpenId(null);
    if (action === 'delete') deleteItem(id);
    else if (action === 'duplicate') duplicateItem(id);
    else if (action === 'edit') { setActiveItemId(id); setEditingRowId(id); setEditingPrompt(findItem(items, id)?.prompt ?? ''); }
  }

  const hasCuts = cutIds.size > 0;
  const hasSelected = selectedIds.size > 0;

  function handleCut() {
    setCutIds(new Set(selectedIds));
    setSelectedIds(new Set());
  }

  function handlePaste() {
    if (!cutIds.size) return;
    setItems(prev => {
      const cutItemsList = prev.filter(i => cutIds.has(i.id));
      const cleaned = prev.filter(i => !cutIds.has(i.id));
      if (activeItemId) {
        const idx = cleaned.findIndex(it => it.id === activeItemId);
        if (idx !== -1) {
          const next = [...cleaned];
          next.splice(idx + 1, 0, ...cutItemsList);
          return next;
        }
      }
      return [...cleaned, ...cutItemsList];
    });
    setCutIds(new Set());
  }

  const conditionParentItem = dcConditionState ? findItem(items, dcConditionState.parentId) : null;
  const conditionChildItem = dcConditionState ? findItem(items, dcConditionState.childId) : null;

  const bannerMsg = dcLinkingId
    ? `Linking: "${findItem(items, dcLinkingId)?.prompt ?? ''}" — click any eligible item to set as parent`
    : 'Click any item to start linking · click a filter indicator to debug';

  return (
    <div style={{ fontFamily: T.font, height: 'calc(100vh - 52px)', background: T.surface0, overflow: 'hidden', display: 'flex', alignItems: 'flex-start', justifyContent: 'center' }}>
      <style>{`.mc-tpl-search::placeholder { color: ${T.textSecondary}; }`}</style>
      <div style={{ width: '100%', maxWidth: 1026, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', background: T.surface2 }}>
      {/* Editor topbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', background: T.surface1, borderBottom: `0.5px solid ${T.border}`, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <a href="#/operate/lists" style={{ color: T.textSecondary, fontSize: 18, textDecoration: 'none', display: 'flex', alignItems: 'center' }}>←</a>
          <span style={{ fontSize: 16, fontWeight: 600, color: T.textPrimary }}>Opening Checklist</span>
          <span style={{ background: T.bgAccent, color: T.textAccent, fontSize: 11, fontWeight: 500, padding: '3px 8px', borderRadius: 4 }}>11 locations</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, color: T.textMuted, fontStyle: 'italic' }}>Changes publish Jul 21 at 12:00 PM</span>
          <button style={{ background: 'none', border: `0.5px solid ${T.borderStrong}`, borderRadius: 6, padding: '6px 8px', cursor: 'pointer', color: T.textSecondary, fontSize: 16, display: 'flex', alignItems: 'center' }}><i className="ti ti-dots-vertical" /></button>
          <button style={{ background: T.fillAccent, color: T.onAccent, fontFamily: T.font, fontSize: 13, fontWeight: 600, padding: '7px 16px', borderRadius: 6, border: 'none', cursor: 'pointer' }}>Save</button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', padding: '0 16px', background: T.surface2, borderBottom: `0.5px solid ${T.border}`, flexShrink: 0, alignItems: 'center' }}>
        {(['items', 'settings'] as const).map(tab => (
          <div key={tab} onClick={() => setActiveTab(tab)} style={{ fontSize: 13, fontWeight: 500, padding: '11px 16px', cursor: 'pointer', color: activeTab === tab ? T.textAccent : T.textSecondary, borderBottom: activeTab === tab ? `2px solid ${T.fillAccent}` : '2px solid transparent', marginBottom: -0.5, textTransform: 'capitalize' }}>
            {tab === 'items' ? 'Items' : 'Settings'}
          </div>
        ))}
        <div style={{ marginLeft: 'auto', alignSelf: 'center' }}>
          <ColumnPicker shownCols={effectiveShownCols} onChange={setShownCols} scoringOn={scoringOn} />
        </div>
      </div>

      {activeTab === 'settings' ? (
        <div style={{ flex: 1, overflowY: 'auto', background: T.surface0 }}>
          <SettingsTab scoringOn={scoringOn} setScoringOn={handleSetScoringOn} />
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {/* Items pane */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Toolbar */}
            <div style={{ background: T.surface1, borderBottom: `0.5px solid ${T.borderStrong}`, padding: '7px 12px', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
              <input type="checkbox" checked={selectedIds.size === allItems.length && allItems.length > 0} onChange={e => setSelectedIds(e.target.checked ? new Set(allItems.map(i => i.id)) : new Set())} style={{ accentColor: T.fillAccent, width: 13, height: 13 }} />
              <div style={{ width: 0.5, height: 18, background: T.borderStrong }} />
              <div ref={addBtnRef} style={{ position: 'relative' }}>
                <Btn primary onClick={() => setShowAddPopover(v => !v)}>
                  <i className="ti ti-plus" /> Add item
                </Btn>
                {showAddPopover && <AddItemPopover onSelect={addItem} onClose={() => setShowAddPopover(false)} />}
              </div>
              <Btn disabled={!hasSelected} onClick={() => { selectedIds.forEach(id => deleteItem(id)); setSelectedIds(new Set()); }}>
                <i className="ti ti-trash" /> Delete
              </Btn>
              <Btn disabled={!hasSelected} onClick={handleCut}>
                <i className="ti ti-scissors" /> Cut
              </Btn>
              <Btn disabled={!hasCuts} onClick={handlePaste}>
                <i className="ti ti-clipboard" /> Paste below
              </Btn>
              <div style={{ flex: 1 }} />
              <span style={{ fontSize: 12, color: T.textMuted, padding: '0 8px' }}>{totalItems} items</span>
              <button style={{ fontSize: 15, color: T.textMuted, padding: '4px 6px', borderRadius: 4, border: 'none', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }} title="Question bank">
                <i className="ti ti-books" />
              </button>
              <Btn onClick={() => { setDcMode(v => !v); setDcLinkingId(null); setDcConditionState(null); }} style={dcMode ? { background: '#FFF8E1', color: '#5D4037', borderColor: '#FFD54F' } : {}}>
                <i className="ti ti-filter" /> {dcMode ? 'Exit display criteria' : 'Display criteria'}
              </Btn>
              <div style={{ width: 32, flexShrink: 0 }} />
            </div>

            {/* DC banner */}
            {dcMode && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 16px', background: '#FFF8E1', borderBottom: `0.5px solid #FFD54F`, fontSize: 12, fontWeight: 500, color: '#5D4037', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <i className="ti ti-filter" style={{ fontSize: 14 }} />
                  {bannerMsg}
                </div>
              </div>
            )}

            {/* Table area */}
            <div style={{ flex: 1, overflowY: 'auto', overflowX: 'auto' }} onClick={e => { if ((e.target as HTMLElement).closest('tr') === null) setKebabOpenId(null); }}>
              {dcConditionState && conditionParentItem && conditionChildItem ? (
                <div style={{ display: 'flex', height: '100%' }}>
                  <div style={{ flex: 1, overflowY: 'auto' }}>
                    <ItemsTable items={items} selectedIds={selectedIds} activeItemId={activeItemId} cutIds={cutIds} dcMode={dcMode} dcLinkingId={dcLinkingId} dcColors={dcColors} kebabOpenId={kebabOpenId} editingRowId={editingRowId} editingPrompt={editingPrompt} editInputRef={editInputRef} shownCols={effectiveShownCols} colValues={colValues} onColChange={setColValue} onUpdate={updateItem}
                      onCheckbox={id => setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; })}
                      onRowClick={id => { setActiveItemId(prev => prev === id ? null : id); setKebabOpenId(null); }}
                      onKebab={id => setKebabOpenId(prev => prev === id ? null : id)}
                      onKebabClose={() => setKebabOpenId(null)}
                      onKebabAction={handleKebabAction}
                      onDCClick={handleDCClick}
                      onEditChange={setEditingPrompt}
                      onEditCommit={commitEdit}
                      caToastId={caToastId} onCaToast={setCaToastId}
                    />
                  </div>
                  <DCConditionPanel childItem={conditionChildItem} parentItem={conditionParentItem} onSave={saveDCCondition} onCancel={() => setDcConditionState(null)} />
                </div>
              ) : (
                <ItemsTable items={items} selectedIds={selectedIds} activeItemId={activeItemId} cutIds={cutIds} dcMode={dcMode} dcLinkingId={dcLinkingId} dcColors={dcColors} kebabOpenId={kebabOpenId} editingRowId={editingRowId} editingPrompt={editingPrompt} editInputRef={editInputRef} shownCols={effectiveShownCols} colValues={colValues} onColChange={setColValue} onUpdate={updateItem}
                  onCheckbox={id => setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; })}
                  onRowClick={id => { setActiveItemId(prev => prev === id ? null : id); setKebabOpenId(null); }}
                  onKebab={id => setKebabOpenId(prev => prev === id ? null : id)}
                  onKebabClose={() => setKebabOpenId(null)}
                  onKebabAction={handleKebabAction}
                  onDCClick={handleDCClick}
                  onEditChange={setEditingPrompt}
                  onEditCommit={commitEdit}
                  caToastId={caToastId} onCaToast={setCaToastId}
                />
              )}
            </div>
          </div>

          {/* Side sheet */}
          {activeItemId && !dcMode && (() => {
            const item = findItem(items, activeItemId);
            return item ? <SideSheet key={activeItemId} item={item} items={items} onClose={() => setActiveItemId(null)} onNavigate={id => setActiveItemId(id)} onUpdate={updateItem} markAs={(colValues[item.id] ?? {})['all-mark-as'] ?? null} onMarkAsChange={v => setColValue(item.id, 'all-mark-as', v)} scoringOn={scoringOn} flags={flags} onCreateFlag={handleCreateFlag} /> : null;
          })()}
        </div>
      )}
      </div>
    </div>
  );
}

// ── Items table (extracted to avoid circular dependency) ──────────────────
interface ItemsTableProps {
  items: ListItem[];
  selectedIds: Set<string>;
  activeItemId: string | null;
  cutIds: Set<string>;
  dcMode: boolean;
  dcLinkingId: string | null;
  dcColors: Record<string, string>;
  kebabOpenId: string | null;
  editingRowId: string | null;
  editingPrompt: string;
  editInputRef: React.RefObject<HTMLInputElement>;
  shownCols: Set<string>;
  colValues: Record<string, Record<string, string>>;
  onColChange: (itemId: string, colKey: string, value: string | null) => void;
  onUpdate: (id: string, patch: Partial<ListItem>) => void;
  onCheckbox: (id: string) => void;
  onRowClick: (id: string) => void;
  onKebab: (id: string) => void;
  onKebabClose: () => void;
  onKebabAction: (action: string, id: string) => void;
  onDCClick: (id: string) => void;
  onEditChange: (v: string) => void;
  onEditCommit: () => void;
  caToastId: string | null;
  onCaToast: (key: string | null) => void;
}

function ItemsTable({ items, selectedIds, activeItemId, cutIds, dcMode, dcLinkingId, dcColors, kebabOpenId, editingRowId, editingPrompt, editInputRef, shownCols, colValues, onColChange, onUpdate, onCheckbox, onRowClick, onKebab, onKebabClose, onKebabAction, onDCClick, onEditChange, onEditCommit, caToastId, onCaToast }: ItemsTableProps) {
  const activeCols = ALL_COLS.filter(c => shownCols.has(c.key));
  const totalCols = 7 + activeCols.length; // drag+checkbox+stripe+prompt+type+indicators+kebab + optional cols
  // Cumulative left offsets for sticky columns: drag=0, checkbox=28, stripe=58, prompt=62
  const S = { drag: 0, checkbox: 28, stripe: 58, prompt: 62 };
  const stickyHead = (left: number, extra?: React.CSSProperties): React.CSSProperties => ({
    position: 'sticky', left, zIndex: 12, background: T.surface1, ...extra,
  });
  // When optional cols are active, pin the prompt at promptWidth and let the table grow past the
  // container so horizontal scrolling kicks in. Without cols, fill the container normally.
  const hasCols = activeCols.length > 0;
  const [promptWidth, setPromptWidth] = useState(300);
  const resizingRef = useRef<{ startX: number; startW: number } | null>(null);
  const onResizeMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    resizingRef.current = { startX: e.clientX, startW: promptWidth };
    const onMove = (ev: MouseEvent) => {
      if (!resizingRef.current) return;
      const w = Math.max(150, resizingRef.current.startW + ev.clientX - resizingRef.current.startX);
      setPromptWidth(w);
    };
    const onUp = () => {
      resizingRef.current = null;
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };
  return (
    <table style={{ width: hasCols ? 'max-content' : '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
      <colgroup>
        <col style={{ width: 28 }} />
        <col style={{ width: 30 }} />
        <col style={{ width: 4 }} />
        <col style={{ width: hasCols ? promptWidth : undefined }} />
        <col style={{ width: 32 }} />
        <col style={{ width: 100 }} />
        {activeCols.map(col => <col key={col.key} style={{ width: 100 }} />)}
        <col style={{ width: 32 }} />
      </colgroup>
      {activeCols.length > 0 && (
        <thead style={{ position: 'sticky', top: 0, zIndex: 11 }}>
          {/* Group header row */}
          {(() => {
            const CA_KEYS = new Set(['ca-turn-on','ca-turn-on-na','ca-list','ca-list-na','ca-trigger-yn','ca-planned','ca-optional','ca-repeat']);
            // Build segments: runs of CA vs non-CA cols
            const segments: { ca: boolean; count: number }[] = [];
            for (const col of activeCols) {
              const ca = CA_KEYS.has(col.key);
              if (segments.length && segments[segments.length - 1].ca === ca) segments[segments.length - 1].count++;
              else segments.push({ ca, count: 1 });
            }
            const hasCaGroup = activeCols.some(c => CA_KEYS.has(c.key));
            if (!hasCaGroup) return null;
            return (
              <tr style={{ background: T.surface1, height: 20 }}>
                {/* Sticky frozen cols */}
                <th style={{ ...stickyHead(S.drag, { width: 28, padding: 0 }) }} />
                <th style={{ ...stickyHead(S.checkbox, { width: 30, padding: 0 }) }} />
                <th style={{ ...stickyHead(S.stripe, { width: 4, padding: 0 }) }} />
                <th style={{ ...stickyHead(S.prompt, { padding: 0 }) }}>
                  <div style={{ position: 'absolute', top: 0, right: 0, width: 1, height: '100%', background: T.borderStrong, zIndex: 1 }} />
                </th>
                <th style={{ width: 32, padding: 0 }} />
                <th style={{ width: 100, padding: 0, borderBottom: `0.5px solid ${T.borderStrong}` }} />
                {segments.map((seg, i) => (
                  <th key={i} colSpan={seg.count} style={{
                    padding: '0 8px', textAlign: 'center', fontSize: 9, fontWeight: 700,
                    letterSpacing: '0.07em', textTransform: 'uppercase',
                    background: seg.ca ? '#E3EEF7' : T.surface1,
                    color: seg.ca ? T.textAccent : 'transparent',
                    borderLeft: seg.ca ? `0.5px solid ${T.borderAccent}` : 'none',
                    borderRight: seg.ca ? `0.5px solid ${T.borderAccent}` : 'none',
                    borderBottom: seg.ca ? `0.5px solid ${T.borderAccent}` : `0.5px solid ${T.borderStrong}`,
                  }}>
                    {seg.ca ? 'Corrective Action' : ''}
                  </th>
                ))}
                <th style={{ width: 32, padding: 0, borderBottom: `0.5px solid ${T.borderStrong}` }} />
              </tr>
            );
          })()}
          <tr style={{ background: T.surface1, borderBottom: `0.5px solid ${T.borderStrong}`, height: 32 }}>
            <th style={stickyHead(S.drag, { width: 28 })} />
            <th style={stickyHead(S.checkbox, { width: 30 })} />
            <th style={stickyHead(S.stripe, { width: 4 })} />
            <th style={stickyHead(S.prompt, { minWidth: 200, padding: 0 })}>
              <div style={{ position: 'absolute', top: 0, right: 0, width: 1, height: 38, background: T.borderStrong, zIndex: 1 }} />
              <div
                onMouseDown={onResizeMouseDown}
                style={{ position: 'absolute', right: -4, top: 0, width: 8, height: 38, cursor: 'col-resize', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}
                onMouseEnter={e => (e.currentTarget.children[0] as HTMLElement).style.opacity = '1'}
                onMouseLeave={e => (e.currentTarget.children[0] as HTMLElement).style.opacity = '0'}
              >
                <div style={{ width: 2, height: 14, borderRadius: 1, background: T.borderStrong, opacity: 0, transition: 'opacity 0.15s' }} />
              </div>
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', padding: '0 8px' }} />
            </th>
            <th style={{ width: 32 }} />
            <th style={{ width: 100, padding: '5px 8px', borderLeft: `0.5px solid ${T.border}`, borderTop: `0.5px solid ${T.border}`, fontSize: 10, fontWeight: 600, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', verticalAlign: 'middle' }}>Config</th>
            {activeCols.map(col => (
              <th key={col.key} style={{
                width: 100, padding: '5px 8px',
                borderLeft: `0.5px solid ${T.border}`,
                fontSize: 10, fontWeight: 600, color: T.textMuted,
                textTransform: 'uppercase', letterSpacing: '0.05em',
                textAlign: 'center', verticalAlign: 'middle',
                lineHeight: 1.4, wordBreak: 'break-word',
              }}>
                {col.label}
              </th>
            ))}
            <th style={{ width: 32 }} />
          </tr>
        </thead>
      )}
      <tbody>
        {items.map(item => (
          editingRowId === item.id ? (
            <tr key={item.id} style={{ height: 44, borderBottom: `0.5px solid ${T.borderAccent}`, background: '#F0F7FF', borderLeft: `3px solid ${T.fillAccent}` }}>
              <td style={{ width: 28, padding: 0 }}><div style={{ width: 28, height: 44, display: 'flex', alignItems: 'center', paddingLeft: 8, color: T.textMuted, fontSize: 14 }}><i className="ti ti-grip-vertical" /></div></td>
              <td style={{ width: 30, padding: '0 6px' }}><input type="checkbox" style={{ accentColor: T.fillAccent, width: 13, height: 13, display: 'block' }} /></td>
              <td style={{ width: 4, padding: 0 }}><div style={{ width: 4, height: 44, background: item.stripe || 'transparent' }} /></td>
              <td style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', height: 44, padding: '0 8px', gap: 8 }}>
                  <input ref={editInputRef} value={editingPrompt} onChange={e => onEditChange(e.target.value)} onBlur={onEditCommit} onKeyDown={e => { if (e.key === 'Enter') onEditCommit(); if (e.key === 'Escape') onEditCommit(); }} placeholder="Type prompt text…" style={{ fontFamily: T.font, fontSize: 13, border: 'none', outline: 'none', background: 'transparent', color: T.textPrimary, width: '100%' }} />
                  <span style={{ fontSize: 10, color: T.textMuted, fontStyle: 'italic', flexShrink: 0 }}>required</span>
                </div>
              </td>
              <td style={{ width: 32, padding: '0 5px', borderLeft: `0.5px solid ${T.border}`, textAlign: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 44 }}>
                  <i className={`ti ${TYPE_META[item.type].icon}`} style={{ fontSize: 15, color: T.textAccent }} />
                </div>
              </td>
              <td style={{ width: 100, padding: '0 8px', borderLeft: `0.5px solid ${T.border}` }} />
              {activeCols.map(col => <td key={col.key} style={{ width: 100, borderLeft: `0.5px solid ${T.border}` }} />)}
              <td style={{ width: 32, padding: '0 4px' }} />
            </tr>
          ) : (
            <ItemRow key={item.id} item={item} items={items} isSelected={selectedIds.has(item.id)} isActive={activeItemId === item.id} isCut={cutIds.has(item.id)} dcMode={dcMode} dcLinkingId={dcLinkingId} dcColors={dcColors} kebabOpenId={kebabOpenId} shownCols={shownCols} colValues={colValues} onColChange={onColChange} onUpdate={onUpdate} onCheckbox={onCheckbox} onRowClick={onRowClick} onKebab={onKebab} onKebabClose={onKebabClose} onKebabAction={onKebabAction} onDCClick={onDCClick} caToastId={caToastId} onCaToast={onCaToast} />
          )
        ))}
      </tbody>
    </table>
  );
}
