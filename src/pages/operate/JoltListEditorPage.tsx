import React, { useState, useRef, useEffect, useCallback } from 'react';

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

interface MCChoice { id: string; label: string; color: string; icon: string | null; }
interface CARule { id: string; condition?: string; caList: string; adHoc: boolean; nextStep: string; }

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
  flagEnabled?: boolean;
  scoreEnabled?: boolean;
  scoreYes?: number;
  scoreNo?: number;
  ratingMin?: number;
  ratingMax?: number;
  bgColor?: string;
}

// ── Constants ──────────────────────────────────────────────────────────────
const TYPE_META: Record<ItemType, { label: string; icon: string }> = {
  yn:          { label: 'Yes/No',         icon: 'ti-circle-check' },
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

const FLAG_COLORS = ['#EF5350','#FF7043','#FFB300','#66BB6A','#42A5F5','#7E57C2','#EC407A','#26C6DA'];

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

// ── Initial sample data ───────────────────────────────────────────────────
const INITIAL_ITEMS: ListItem[] = [
  { id: 'section-opening', prompt: 'Opening Tasks', type: 'subtitle', stripe: '', inds: [], allowNA: false },
  { id: 'cooler-ok', prompt: 'Walk-in cooler temp OK?', type: 'yn', stripe: '#5CA6D9', inds: ['ti-flag','ti-alert-circle'], allowNA: false, flagEnabled: true, caForYNRules: [{ id: 'r1', condition: 'No', caList: 'Corrective Action List', adHoc: false, nextStep: '' }] },
  { id: 'ca-photo', prompt: 'Take corrective action photo', type: 'photo', stripe: '', inds: ['ti-filter'], allowNA: true, dcParentId: 'cooler-ok', dcCondition: { type: 'yn', value: 'No' } },
  { id: 'sign-off', prompt: 'Sign off opening inspection', type: 'signature', stripe: '', inds: [], allowNA: false },
  { id: 'section-food-safety', prompt: 'Food Safety', type: 'subtitle', stripe: '', inds: [], allowNA: false },
  { id: 'prep-temp', prompt: 'Record prep cooler temp °F', type: 'measurement', stripe: '#C1E1C5', inds: ['ti-alert-triangle'], allowNA: true, caForRangeRules: [{ id: 'r2', condition: 'Inside', caList: 'Temp Range Actions', adHoc: false, nextStep: '' }] },
  { id: 'ca-notes', prompt: 'Log corrective action notes', type: 'free', stripe: '', inds: ['ti-filter'], allowNA: false, dcParentId: 'prep-temp', dcCondition: { type: 'measurement', op: '>=', value: 41 } },
  { id: 'date-labels', prompt: 'All date labels current', type: 'checkmark', stripe: '', inds: [], allowNA: false },
  { id: 'handwashing', prompt: 'Handwashing stations stocked', type: 'yn', stripe: '', inds: [], allowNA: false },
  { id: 'vendor-mc', prompt: 'Preferred vendor for shortfall?', type: 'mc', stripe: '', inds: [], allowNA: false, choices: [
    { id: 'c1', label: 'Sysco', color: '#4CAF50', icon: null },
    { id: 'c2', label: 'US Foods', color: '#2196F3', icon: null },
    { id: 'c3', label: 'Performance Food Group', color: '#FF9800', icon: null },
  ]},
  { id: 'section-read-only', prompt: 'Read Only', type: 'subtitle', stripe: '', inds: [], allowNA: false },
  { id: 'temp-guidelines', prompt: 'Temperature Guidelines', type: 'subtitle', stripe: '', inds: [], allowNA: false },
  { id: 'kitchen-rate', prompt: 'Rate overall kitchen cleanliness', type: 'rating', stripe: '', inds: [], allowNA: false, ratingMin: 1, ratingMax: 5 },
];

// ── Helpers ────────────────────────────────────────────────────────────────
function findItem(items: ListItem[], id: string): ListItem | undefined {
  return items.find(i => i.id === id);
}

function indColor(ind: string) {
  if (ind === 'ti-flag') return T.fillAccent;
  if (ind === 'ti-alert-circle' || ind === 'ti-alert-triangle') return T.textWarning;
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
function SsSection({ label, children, defaultOpen = true }: { label: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ borderBottom: `0.5px solid ${T.border}` }}>
      <div onClick={() => setOpen(v => !v)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', cursor: 'pointer', userSelect: 'none' }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
        <i className={`ti ti-chevron-${open ? 'up' : 'down'}`} style={{ fontSize: 13, color: T.textMuted }} />
      </div>
      {open && <div style={{ padding: '0 16px 14px' }}>{children}</div>}
    </div>
  );
}

function FlagSection({ item, onUpdate }: { item: ListItem; onUpdate: (updates: Partial<ListItem>) => void }) {
  const [creating, setCreating] = useState(false);
  const [newFlagName, setNewFlagName] = useState('');
  const [newFlagColor, setNewFlagColor] = useState(FLAG_COLORS[0]);
  const [newFlagEmoji, setNewFlagEmoji] = useState('🔴');
  const flags = [
    { id: 'f1', name: 'Health & Safety', color: '#EF5350', emoji: '⚠️' },
    { id: 'f2', name: 'Equipment', color: '#FF7043', emoji: '🔧' },
    { id: 'f3', name: 'Food Safety', color: '#42A5F5', emoji: '🍽️' },
  ];
  const [selectedFlag, setSelectedFlag] = useState(item.flagEnabled ? 'f1' : '');
  return (
    <SsSection label="Flags">
      <select value={selectedFlag} onChange={e => { setSelectedFlag(e.target.value); onUpdate({ flagEnabled: !!e.target.value }); }} style={{ fontFamily: T.font, fontSize: 13, color: T.textPrimary, background: T.surface2, border: `0.5px solid ${T.borderStrong}`, borderRadius: 6, padding: '7px 10px', width: '100%', marginBottom: 8 }}>
        <option value="">No flag</option>
        {flags.map(f => <option key={f.id} value={f.id}>{f.emoji} {f.name}</option>)}
        <option value="__create__">Create new flag…</option>
      </select>
      {selectedFlag === '__create__' && (
        <div style={{ background: T.surface1, border: `0.5px solid ${T.borderStrong}`, borderRadius: 6, padding: 12, marginTop: 4 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: T.textMuted, textTransform: 'uppercase', marginBottom: 8 }}>New flag</div>
          <input value={newFlagName} onChange={e => setNewFlagName(e.target.value)} placeholder="Flag name" style={{ fontFamily: T.font, fontSize: 13, border: `0.5px solid ${T.borderStrong}`, borderRadius: 5, padding: '6px 10px', width: '100%', marginBottom: 8 }} />
          <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
            {FLAG_COLORS.map(c => <div key={c} onClick={() => setNewFlagColor(c)} style={{ width: 20, height: 20, borderRadius: '50%', background: c, cursor: 'pointer', border: newFlagColor === c ? `2px solid ${T.textPrimary}` : '2px solid transparent' }} />)}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Btn primary onClick={() => { setSelectedFlag('f1'); onUpdate({ flagEnabled: true }); }}>Create & select</Btn>
            <button onClick={() => setSelectedFlag('')} style={{ fontFamily: T.font, fontSize: 12, color: T.textMuted, background: 'none', border: 'none', cursor: 'pointer' }}>Cancel</button>
          </div>
        </div>
      )}
    </SsSection>
  );
}

function CASection({ item, onUpdate }: { item: ListItem; onUpdate: (updates: Partial<ListItem>) => void }) {
  const forNA = item.caForNA ?? false;
  const ynRules = item.caForYNRules ?? [];
  const forRanges = item.caForRanges ?? false;
  const rangeRules = item.caForRangeRules ?? [];
  const isMeas = item.type === 'measurement';

  const setForNA = (v: boolean) => onUpdate({ caForNA: v });
  const setForRanges = (v: boolean) => onUpdate({ caForRanges: v });
  const updateYNRule = (id: string, updates: Partial<CARule>) => onUpdate({ caForYNRules: ynRules.map(r => r.id === id ? { ...r, ...updates } : r) });
  const addYNRule = () => onUpdate({ caForYNRules: [...ynRules, { id: mkid(), condition: 'No', caList: '', adHoc: false, nextStep: '' }] });
  const removeYNRule = (id: string) => onUpdate({ caForYNRules: ynRules.filter(r => r.id !== id) });

  return (
    <SsSection label="Corrective Action" defaultOpen>
      {/* For N/A */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: forNA ? 10 : 0 }}>
          <span style={{ fontSize: 13, color: T.textPrimary, fontWeight: 500 }}>For N/A</span>
          <Toggle on={forNA} onChange={setForNA} />
        </div>
        {forNA && (
          <div style={{ borderTop: `0.5px solid ${T.border}`, paddingTop: 10, marginTop: 8 }}>
            <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 6 }}>CA list</div>
            <Select value="default" onChange={() => {}} options={[{ value: 'default', label: 'Corrective Action List' }]} style={{ width: '100%', marginBottom: 8 }} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 13, color: T.textPrimary }}>Ad hoc</span>
              <Toggle on={false} onChange={() => {}} />
            </div>
            <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 6 }}>Next step</div>
            <input placeholder="Optional" style={{ fontFamily: T.font, fontSize: 13, border: `0.5px solid ${T.borderStrong}`, borderRadius: 5, padding: '6px 10px', width: '100%' }} />
          </div>
        )}
      </div>
      {/* For Yes/No or ranges */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: (isMeas ? forRanges : ynRules.length > 0) ? 10 : 0 }}>
          <span style={{ fontSize: 13, color: T.textPrimary, fontWeight: 500 }}>{isMeas ? 'For ranges' : 'For Yes/No'}</span>
          <Toggle on={isMeas ? forRanges : ynRules.length > 0} onChange={v => { if (isMeas) { setForRanges(v); } else { if (v && ynRules.length === 0) addYNRule(); else if (!v) onUpdate({ caForYNRules: [] }); } }} />
        </div>
        {!isMeas && ynRules.map((rule, idx) => (
          <div key={rule.id} style={{ borderTop: `0.5px solid ${T.border}`, paddingTop: 10, marginTop: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: T.textMuted, textTransform: 'uppercase' }}>Rule {idx + 1}</span>
              <button onClick={() => removeYNRule(rule.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.textDanger, fontSize: 13, display: 'flex', alignItems: 'center', gap: 3 }}><i className="ti ti-x" />Remove</button>
            </div>
            <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 4 }}>Condition</div>
            <Select value={rule.condition ?? 'No'} onChange={v => updateYNRule(rule.id, { condition: v })} options={[{ value: 'No', label: 'No' }, { value: 'Yes', label: 'Yes' }]} style={{ width: '100%', marginBottom: 8 }} />
            <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 4 }}>CA list</div>
            <Select value={rule.caList || 'default'} onChange={v => updateYNRule(rule.id, { caList: v })} options={[{ value: 'default', label: 'Corrective Action List' }]} style={{ width: '100%', marginBottom: 8 }} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 13, color: T.textPrimary }}>Ad hoc</span>
              <Toggle on={rule.adHoc} onChange={v => updateYNRule(rule.id, { adHoc: v })} />
            </div>
          </div>
        ))}
        {!isMeas && ynRules.length < 2 && ynRules.length > 0 && (
          <button onClick={addYNRule} style={{ fontFamily: T.font, fontSize: 12, color: T.textAccent, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, marginTop: 8 }}>
            <i className="ti ti-plus" style={{ fontSize: 12 }} /> Add condition (OR)
          </button>
        )}
        {isMeas && forRanges && (
          <div style={{ borderTop: `0.5px solid ${T.border}`, paddingTop: 10, marginTop: 8 }}>
            {rangeRules.map((rule, idx) => (
              <div key={rule.id} style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: T.textMuted, textTransform: 'uppercase', marginBottom: 6 }}>Rule {idx + 1}</div>
                <Select value="range1" onChange={() => {}} options={[{ value: 'range1', label: 'Range 1 (100°F – 150°F)' }]} style={{ width: '100%', marginBottom: 6 }} />
                <Select value={rule.condition ?? 'Inside'} onChange={v => onUpdate({ caForRangeRules: rangeRules.map(r => r.id === rule.id ? { ...r, condition: v } : r) })} options={[{ value: 'Inside', label: 'Inside range' }, { value: 'Outside', label: 'Outside range' }, { value: 'Above', label: 'Above range' }, { value: 'Below', label: 'Below range' }]} style={{ width: '100%', marginBottom: 6 }} />
                <Select value="default" onChange={() => {}} options={[{ value: 'default', label: 'Temp Range Actions' }]} style={{ width: '100%' }} />
              </div>
            ))}
            <button onClick={() => onUpdate({ caForRangeRules: [...rangeRules, { id: mkid(), condition: 'Inside', caList: '', adHoc: false, nextStep: '' }] })} style={{ fontFamily: T.font, fontSize: 12, color: T.textAccent, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
              <i className="ti ti-plus" style={{ fontSize: 12 }} /> Add range rule
            </button>
          </div>
        )}
      </div>
    </SsSection>
  );
}

function MCChoicesSection({ item, onUpdate }: { item: ListItem; onUpdate: (u: Partial<ListItem>) => void }) {
  const choices = item.choices ?? [];
  const [pickerFor, setPickerFor] = useState<string | null>(null);
  const [pickerTab, setPickerTab] = useState<'color' | 'icon'>('color');
  const MC_COLORS = ['','#E53935','#FB8C00','#FDD835','#43A047','#1E88E5','#8E24AA','#00ACC1','#6D4C41','#546E7A','#F48FB1','#A5D6A7','#90CAF9','#CE93D8','#FFE082','#BCAAA4','#B0BEC5','#EF9A9A'];
  const MC_ICONS = ['ti-star','ti-heart','ti-thumb-up','ti-flame','ti-leaf','ti-drop','ti-bolt','ti-circle-check','ti-alert-circle','ti-info-circle','ti-award','ti-crown','ti-diamond','ti-clock','ti-home','ti-map-pin','ti-user','ti-briefcase','ti-truck','ti-coffee'];

  const updateChoice = (id: string, updates: Partial<MCChoice>) => onUpdate({ choices: choices.map(c => c.id === id ? { ...c, ...updates } : c) });
  const addChoice = () => onUpdate({ choices: [...choices, { id: mkid(), label: '', color: '', icon: null }] });
  const removeChoice = (id: string) => onUpdate({ choices: choices.filter(c => c.id !== id) });

  return (
    <SsSection label="Choices">
      {choices.map((c, idx) => (
        <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
          <div onClick={() => { setPickerFor(pickerFor === c.id ? null : c.id); setPickerTab('color'); }} style={{ width: 26, height: 26, borderRadius: '50%', background: c.color || 'transparent', border: c.color ? 'none' : `1.5px dashed ${T.borderStrong}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, position: 'relative' }}>
            {c.icon && <i className={`ti ${c.icon}`} style={{ fontSize: 13, color: c.color ? 'white' : T.textMuted }} />}
            {!c.icon && !c.color && <i className="ti ti-plus" style={{ fontSize: 11, color: T.textMuted }} />}
          </div>
          <input value={c.label} onChange={e => updateChoice(c.id, { label: e.target.value })} placeholder={`Choice ${idx + 1}`} style={{ fontFamily: T.font, fontSize: 13, border: `0.5px solid ${T.borderStrong}`, borderRadius: 5, padding: '5px 8px', flex: 1 }} />
          <button onClick={() => removeChoice(c.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.textMuted, fontSize: 14, display: 'flex' }}><i className="ti ti-x" /></button>
          {pickerFor === c.id && (
            <div style={{ position: 'absolute', right: 16, background: T.surface2, border: `0.5px solid ${T.borderStrong}`, borderRadius: 8, width: 240, zIndex: 50, boxShadow: '0 4px 20px rgba(0,0,0,0.12)', overflow: 'hidden', marginTop: 80 }}>
              <div style={{ display: 'flex', borderBottom: `0.5px solid ${T.border}` }}>
                {(['color','icon'] as const).map(tab => (
                  <div key={tab} onClick={() => setPickerTab(tab)} style={{ flex: 1, padding: '8px 0', textAlign: 'center', fontSize: 12, fontWeight: 500, cursor: 'pointer', color: pickerTab === tab ? T.textAccent : T.textMuted, borderBottom: pickerTab === tab ? `2px solid ${T.fillAccent}` : '2px solid transparent' }}>
                    {tab === 'color' ? 'Color' : 'Icon'}
                  </div>
                ))}
              </div>
              {pickerTab === 'color' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 4, padding: 10 }}>
                  {MC_COLORS.map(col => (
                    <div key={col} onClick={() => { updateChoice(c.id, { color: col }); setPickerFor(null); }} style={{ width: 28, height: 28, borderRadius: '50%', background: col || 'transparent', border: col ? `2px solid ${c.color === col ? T.textPrimary : 'transparent'}` : `1.5px dashed ${T.borderStrong}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {!col && <i className="ti ti-x" style={{ fontSize: 12, color: T.textMuted }} />}
                    </div>
                  ))}
                </div>
              )}
              {pickerTab === 'icon' && (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 4, padding: 10 }}>
                    {MC_ICONS.map(ic => (
                      <div key={ic} onClick={() => { updateChoice(c.id, { icon: c.icon === ic ? null : ic }); }} style={{ width: 36, height: 36, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: c.icon === ic ? T.fillAccent : T.surface1, border: c.icon === ic ? `2px solid ${T.fillAccent}` : `0.5px solid ${T.border}` }}>
                        <i className={`ti ${ic}`} style={{ fontSize: 17, color: c.icon === ic ? 'white' : T.textMuted }} />
                      </div>
                    ))}
                  </div>
                  <div style={{ fontSize: 10, color: T.textMuted, padding: '0 10px 8px', textAlign: 'center' }}>Tap selected icon again to remove it</div>
                </>
              )}
            </div>
          )}
        </div>
      ))}
      <button onClick={addChoice} style={{ fontFamily: T.font, fontSize: 12, color: T.textAccent, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, marginTop: 6 }}>
        <i className="ti ti-plus" style={{ fontSize: 12 }} /> Add choice
      </button>
    </SsSection>
  );
}

function MeasurementSection({ item, onUpdate }: { item: ListItem; onUpdate: (u: Partial<ListItem>) => void }) {
  const [unit, setUnit] = useState('°F');
  const [decimals, setDecimals] = useState('2');
  const [ranges, setRanges] = useState([{ id: 'rng1', min: '100', max: '150', label: 'Normal' }]);
  return (
    <SsSection label="Measurement Options">
      <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 4 }}>Unit</div>
          <input value={unit} onChange={e => setUnit(e.target.value)} style={{ fontFamily: T.font, fontSize: 13, border: `0.5px solid ${T.borderStrong}`, borderRadius: 5, padding: '6px 10px', width: '100%' }} />
        </div>
        <div style={{ width: 80 }}>
          <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 4 }}>Decimals</div>
          <Select value={decimals} onChange={setDecimals} options={[{value:'0',label:'0'},{value:'1',label:'1'},{value:'2',label:'2'},{value:'3',label:'3'}]} />
        </div>
      </div>
      <div style={{ fontSize: 11, fontWeight: 600, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Ranges</div>
      {ranges.map((r, idx) => (
        <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
          <input value={r.min} onChange={e => setRanges(ranges.map(x => x.id === r.id ? { ...x, min: e.target.value } : x))} placeholder="Min" style={{ fontFamily: T.font, fontSize: 13, border: `0.5px solid ${T.borderStrong}`, borderRadius: 5, padding: '5px 8px', width: 60 }} />
          <span style={{ color: T.textMuted, fontSize: 12 }}>–</span>
          <input value={r.max} onChange={e => setRanges(ranges.map(x => x.id === r.id ? { ...x, max: e.target.value } : x))} placeholder="Max" style={{ fontFamily: T.font, fontSize: 13, border: `0.5px solid ${T.borderStrong}`, borderRadius: 5, padding: '5px 8px', width: 60 }} />
          <input value={r.label} onChange={e => setRanges(ranges.map(x => x.id === r.id ? { ...x, label: e.target.value } : x))} placeholder="Label" style={{ fontFamily: T.font, fontSize: 13, border: `0.5px solid ${T.borderStrong}`, borderRadius: 5, padding: '5px 8px', flex: 1 }} />
          <button onClick={() => setRanges(ranges.filter(x => x.id !== r.id))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.textMuted, fontSize: 14 }}><i className="ti ti-x" /></button>
        </div>
      ))}
      <button onClick={() => setRanges([...ranges, { id: mkid(), min: '', max: '', label: '' }])} style={{ fontFamily: T.font, fontSize: 12, color: T.textAccent, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
        <i className="ti ti-plus" style={{ fontSize: 12 }} /> Add range
      </button>
    </SsSection>
  );
}

// ── Side sheet ────────────────────────────────────────────────────────────
function SideSheet({ item, onClose, onUpdate }: { item: ListItem; onClose: () => void; onUpdate: (id: string, updates: Partial<ListItem>) => void }) {
  const upd = (updates: Partial<ListItem>) => onUpdate(item.id, updates);
  const meta = TYPE_META[item.type];
  const [bgColor, setBgColor] = useState(item.bgColor ?? '');
  const [scoreEnabled, setScoreEnabled] = useState(item.scoreEnabled ?? false);
  const [scoreYes, setScoreYes] = useState(item.scoreYes ?? 1);
  const [scoreNo, setScoreNo] = useState(item.scoreNo ?? 0);
  const [tagsInput, setTagsInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [completionMode, setCompletionMode] = useState('any');

  return (
    <div style={{ width: 420, flexShrink: 0, background: T.surface1, borderLeft: `0.5px solid ${T.border}`, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', background: T.surface2, borderBottom: `0.5px solid ${T.border}`, flexShrink: 0 }}>
        <i className={`ti ${meta.icon}`} style={{ fontSize: 18, color: T.textMuted }} />
        <span style={{ fontSize: 13, fontWeight: 600, color: T.textPrimary, flex: 1 }}>{meta.label}</span>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.textMuted, fontSize: 18, display: 'flex', alignItems: 'center', padding: 4 }}><i className="ti ti-x" /></button>
      </div>
      {/* Scrollable body */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {/* Prompt */}
        <SsSection label="Prompt">
          <textarea defaultValue={item.prompt} onChange={e => upd({ prompt: e.target.value })} rows={2} style={{ fontFamily: T.font, fontSize: 13, border: `0.5px solid ${T.borderStrong}`, borderRadius: 5, padding: '7px 10px', width: '100%', resize: 'vertical' }} />
        </SsSection>
        {/* Background color */}
        <SsSection label="Background Color" defaultOpen={false}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {STRIPE_COLORS.map(sc => (
              <div key={sc.value} onClick={() => { setBgColor(sc.value); upd({ stripe: sc.value }); }} title={sc.label} style={{ width: 24, height: 24, borderRadius: 4, background: sc.value || T.surface1, border: `1.5px solid ${bgColor === sc.value ? T.textPrimary : T.borderStrong}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {!sc.value && <i className="ti ti-x" style={{ fontSize: 11, color: T.textMuted }} />}
              </div>
            ))}
          </div>
        </SsSection>
        {/* Info library */}
        <SsSection label="Info Library" defaultOpen={false}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontSize: 13, color: T.textPrimary }}>Attach reference</span>
            <Toggle on={false} onChange={() => {}} />
          </div>
          <div style={{ fontSize: 12, color: T.textMuted }}>Link a document or URL to display alongside this item.</div>
        </SsSection>
        {/* General options */}
        <SsSection label="General Options" defaultOpen>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontSize: 13, color: T.textPrimary }}>Allow N/A</span>
            <Toggle on={item.allowNA} onChange={v => upd({ allowNA: v })} />
          </div>
          {item.type === 'yn' && (
            <div>
              <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 6 }}>Completion mode</div>
              <Select value={completionMode} onChange={setCompletionMode} options={[{ value: 'any', label: 'Any answer completes' }, { value: 'yes', label: 'Only Yes completes' }, { value: 'no', label: 'Only No completes' }]} style={{ width: '100%' }} />
            </div>
          )}
        </SsSection>
        {/* Labels (tags) */}
        <SsSection label="Labels" defaultOpen={false}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
            {tags.map(tag => (
              <div key={tag} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: T.bgAccent, color: T.textAccent, fontSize: 12, padding: '3px 8px', borderRadius: 4 }}>
                {tag}
                <button onClick={() => setTags(tags.filter(t => t !== tag))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.textAccent, fontSize: 12, padding: 0, lineHeight: 1 }}>×</button>
              </div>
            ))}
          </div>
          <input value={tagsInput} onChange={e => setTagsInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && tagsInput.trim()) { setTags([...tags, tagsInput.trim()]); setTagsInput(''); e.preventDefault(); } }} placeholder="Type and press Enter…" style={{ fontFamily: T.font, fontSize: 13, border: `0.5px solid ${T.borderStrong}`, borderRadius: 5, padding: '6px 10px', width: '100%' }} />
        </SsSection>
        {/* Score */}
        {(item.type === 'yn' || item.type === 'measurement' || item.type === 'checkmark') && (
          <SsSection label="Score" defaultOpen={false}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: scoreEnabled ? 12 : 0 }}>
              <span style={{ fontSize: 13, color: T.textPrimary }}>Enable scoring</span>
              <Toggle on={scoreEnabled} onChange={v => { setScoreEnabled(v); upd({ scoreEnabled: v }); }} />
            </div>
            {scoreEnabled && item.type === 'yn' && (
              <div>
                {[{ label: 'Yes', val: scoreYes, set: setScoreYes }, { label: 'No', val: scoreNo, set: setScoreNo }].map(row => (
                  <div key={row.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 13, color: T.textPrimary }}>{row.label}</span>
                    <input type="number" value={row.val} onChange={e => row.set(Number(e.target.value))} style={{ fontFamily: T.font, fontSize: 13, border: `0.5px solid ${T.borderStrong}`, borderRadius: 5, padding: '5px 8px', width: 70, textAlign: 'center' }} />
                  </div>
                ))}
              </div>
            )}
          </SsSection>
        )}
        {/* Type-specific sections */}
        {item.type === 'measurement' && <MeasurementSection item={item} onUpdate={upd} />}
        {item.type === 'mc' && <MCChoicesSection item={item} onUpdate={upd} />}
        {(item.type === 'yn' || item.type === 'measurement') && <CASection item={item} onUpdate={upd} />}
        {item.type === 'yn' && <FlagSection item={item} onUpdate={upd} />}
        {item.type === 'subtitle' && (
          <SsSection label="Display Criteria" defaultOpen={false}>
            <div style={{ fontSize: 12, color: T.textMuted }}>Subtitles cannot be a DC child — they are always visible.</div>
          </SsSection>
        )}
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
function SettingsTab() {
  const [submission, setSubmission] = useState('anyone-anytime');
  const [scoringOn, setScoringOn] = useState(false);
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
    { key: 'ca-turn-on',            label: 'Turn on' },
    { key: 'ca-list',               label: 'List' },
    { key: 'ca-turn-on-na',         label: 'Turn on for N/A' },
    { key: 'ca-list-na',            label: 'List for NA' },
    { key: 'ca-trigger-yn',         label: 'Trigger Y/N' },
    { key: 'ca-trigger-ranges',     label: 'Trigger Ranges' },
    { key: 'ca-planned',            label: 'Planned' },
    { key: 'ca-optional',           label: 'Optional' },
    { key: 'ca-repeat',             label: 'Repeat' },
  ]},
];

const ALL_COLS = COLUMN_GROUPS.flatMap(g => g.cols);

function ColumnPicker({ shownCols, onChange }: { shownCols: Set<string>; onChange: (next: Set<string>) => void }) {
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
              checked={shownCols.size === ALL_COLS.length}
              onChange={() => onChange(shownCols.size === ALL_COLS.length ? new Set() : new Set(ALL_COLS.map(c => c.key)))}
              style={{ accentColor: T.fillAccent, width: 13, height: 13, flexShrink: 0 }}
            />
            Select all
          </label>
          {COLUMN_GROUPS.map(group => (
            <div key={group.group}>
              <div style={{
                fontSize: 10, fontWeight: 700, color: T.textMuted,
                textTransform: 'uppercase', letterSpacing: '0.07em',
                padding: '8px 14px 4px',
              }}>
                {group.group}
              </div>
              {group.cols.map(col => (
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
          ))}
        </div>
      )}
    </div>
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
  onCheckbox: (id: string) => void;
  onRowClick: (id: string) => void;
  onKebab: (id: string) => void;
  onKebabClose: () => void;
  onKebabAction: (action: string, id: string) => void;
  onDCClick: (id: string) => void;
}

function ItemRow({ item, items, isSelected, isActive, isCut, dcMode, dcLinkingId, dcColors, kebabOpenId, shownCols, onCheckbox, onRowClick, onKebab, onKebabClose, onKebabAction, onDCClick }: RowProps) {
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

  const indsForDC = item.inds.filter(i => i === 'ti-filter');
  const indsNonDC = item.inds.filter(i => i !== 'ti-filter');
  const activeCols = ALL_COLS.filter(c => shownCols.has(c.key));
  const stickyBg = isActive || isLinkingChild ? T.bgAccent : T.surface2;
  const sticky = (left: number, extra?: React.CSSProperties): React.CSSProperties => ({
    position: 'sticky', left, zIndex: 1, background: stickyBg, ...extra,
  });

  return (
    <tr style={{
      height: 38, borderBottom: `0.5px solid ${T.border}`,
      background: isActive ? T.bgAccent : isLinkingChild ? T.bgAccent : T.surface2,
      opacity: isCut ? 0.4 : isTypeDimmed ? 0.28 : 1,
      position: 'relative',
    }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Drag handle */}
      <td style={sticky(0, { width: 28, padding: 0 })}>
        <div style={{ width: 28, height: 38, display: 'flex', alignItems: 'center', paddingLeft: 8, paddingRight: 3, color: T.textMuted, fontSize: 14, opacity: hovered || isActive ? 1 : 0 }}>
          <i className="ti ti-grip-vertical" />
        </div>
      </td>
      {/* Checkbox */}
      <td style={sticky(28, { width: 30, padding: '0 6px' })}>
        <input type="checkbox" checked={isSelected} onChange={() => onCheckbox(item.id)} style={{ accentColor: T.fillAccent, width: 13, height: 13, display: 'block', opacity: hovered || isSelected || isActive ? 1 : 0, cursor: 'pointer' }} />
      </td>
      {/* Stripe */}
      <td style={sticky(58, { width: 4, padding: 0 })}>
        <div style={{ width: 4, height: 38, background: item.stripe || 'transparent' }} />
      </td>
      {/* Prompt */}
      <td style={sticky(62, { padding: 0, overflow: 'hidden', width: activeCols.length > 0 ? 300 : undefined })} onClick={() => dcMode ? onDCClick(item.id) : onRowClick(item.id)}>
        <div style={{ display: 'flex', alignItems: 'center', height: 38, padding: '0 8px', gap: 6, cursor: dcMode ? 'pointer' : 'default' }}>
          {isChild && <span style={{ fontSize: 12, color: T.textMuted, flexShrink: 0 }}>↳</span>}
          <span style={{ fontSize: 13, color: isLinkingChild || (isActive && !dcMode) ? T.textAccent : T.textPrimary, fontWeight: isLinkingChild || (isActive && !dcMode) ? 500 : 400, flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.prompt}</span>
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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 38 }}>
          <i className={`ti ${meta.icon}`} style={{ fontSize: 15, color: T.textMuted }} title={meta.label} />
        </div>
      </td>
      {/* Config indicators */}
      <td style={{ width: 100, padding: '0 8px', borderLeft: `0.5px solid ${T.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, height: 38 }}>
          {item.inds.map(ind => <i key={ind} className={`ti ${ind}`} style={{ fontSize: 13, color: indColor(ind) }} />)}
        </div>
      </td>
      {/* Optional columns */}
      {activeCols.map(col => (
        <td key={col.key} style={{ width: 100, padding: '0 12px', borderLeft: `0.5px solid ${T.border}`, textAlign: 'center', color: T.textMuted, fontSize: 12 }}>
          —
        </td>
      ))}
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
  const [items, setItems] = useState<ListItem[]>(INITIAL_ITEMS);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const [cutIds, setCutIds] = useState<Set<string>>(new Set());
  const [dcMode, setDcMode] = useState(false);
  const [dcLinkingId, setDcLinkingId] = useState<string | null>(null);
  const [dcConditionState, setDcConditionState] = useState<{ childId: string; parentId: string } | null>(null);
  const [shownCols, setShownCols] = useState<Set<string>>(new Set([
    'all-mark-as', 'all-color', 'all-info-library', 'all-points', 'all-print-label',
  ]));
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
  }

  function deleteItem(id: string) {
    setItems(prev => prev.filter(it => it.id !== id).map(it => it.dcParentId === id ? { ...it, dcParentId: undefined, dcCondition: undefined, inds: it.inds.filter(x => x !== 'ti-filter') } : it));
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
    updateItem(childId, { dcParentId: parentId, dcCondition: cond, inds: [...(findItem(items, childId)?.inds.filter(x => x !== 'ti-filter') ?? []), 'ti-filter'] });
    setDcConditionState(null);
  }

  function removeDCLink(id: string) {
    updateItem(id, { dcParentId: undefined, dcCondition: undefined, inds: findItem(items, id)?.inds.filter(x => x !== 'ti-filter') ?? [] });
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
          <ColumnPicker shownCols={shownCols} onChange={setShownCols} />
        </div>
      </div>

      {activeTab === 'settings' ? (
        <div style={{ flex: 1, overflowY: 'auto', background: T.surface0 }}>
          <SettingsTab />
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
                    <ItemsTable items={items} selectedIds={selectedIds} activeItemId={activeItemId} cutIds={cutIds} dcMode={dcMode} dcLinkingId={dcLinkingId} dcColors={dcColors} kebabOpenId={kebabOpenId} editingRowId={editingRowId} editingPrompt={editingPrompt} editInputRef={editInputRef} shownCols={shownCols}
                      onCheckbox={id => setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; })}
                      onRowClick={id => { setActiveItemId(prev => prev === id ? null : id); setKebabOpenId(null); }}
                      onKebab={id => setKebabOpenId(prev => prev === id ? null : id)}
                      onKebabClose={() => setKebabOpenId(null)}
                      onKebabAction={handleKebabAction}
                      onDCClick={handleDCClick}
                      onEditChange={setEditingPrompt}
                      onEditCommit={commitEdit}
                    />
                  </div>
                  <DCConditionPanel childItem={conditionChildItem} parentItem={conditionParentItem} onSave={saveDCCondition} onCancel={() => setDcConditionState(null)} />
                </div>
              ) : (
                <ItemsTable items={items} selectedIds={selectedIds} activeItemId={activeItemId} cutIds={cutIds} dcMode={dcMode} dcLinkingId={dcLinkingId} dcColors={dcColors} kebabOpenId={kebabOpenId} editingRowId={editingRowId} editingPrompt={editingPrompt} editInputRef={editInputRef} shownCols={shownCols}
                  onCheckbox={id => setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; })}
                  onRowClick={id => { setActiveItemId(prev => prev === id ? null : id); setKebabOpenId(null); }}
                  onKebab={id => setKebabOpenId(prev => prev === id ? null : id)}
                  onKebabClose={() => setKebabOpenId(null)}
                  onKebabAction={handleKebabAction}
                  onDCClick={handleDCClick}
                  onEditChange={setEditingPrompt}
                  onEditCommit={commitEdit}
                />
              )}
            </div>
          </div>

          {/* Side sheet */}
          {activeItemId && !dcMode && (() => {
            const item = findItem(items, activeItemId);
            return item ? <SideSheet item={item} onClose={() => setActiveItemId(null)} onUpdate={updateItem} /> : null;
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
  onCheckbox: (id: string) => void;
  onRowClick: (id: string) => void;
  onKebab: (id: string) => void;
  onKebabClose: () => void;
  onKebabAction: (action: string, id: string) => void;
  onDCClick: (id: string) => void;
  onEditChange: (v: string) => void;
  onEditCommit: () => void;
}

function ItemsTable({ items, selectedIds, activeItemId, cutIds, dcMode, dcLinkingId, dcColors, kebabOpenId, editingRowId, editingPrompt, editInputRef, shownCols, onCheckbox, onRowClick, onKebab, onKebabClose, onKebabAction, onDCClick, onEditChange, onEditCommit }: ItemsTableProps) {
  const activeCols = ALL_COLS.filter(c => shownCols.has(c.key));
  const totalCols = 7 + activeCols.length; // drag+checkbox+stripe+prompt+type+indicators+kebab + optional cols
  // Cumulative left offsets for sticky columns: drag=0, checkbox=28, stripe=58, prompt=62
  const S = { drag: 0, checkbox: 28, stripe: 58, prompt: 62 };
  const stickyHead = (left: number, extra?: React.CSSProperties): React.CSSProperties => ({
    position: 'sticky', left, zIndex: 12, background: T.surface1, ...extra,
  });
  // When optional cols are active, pin the prompt at 300px and let the table grow past the
  // container so horizontal scrolling kicks in. Without cols, fill the container normally.
  const hasCols = activeCols.length > 0;
  return (
    <table style={{ width: hasCols ? 'max-content' : '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
      <colgroup>
        <col style={{ width: 28 }} />
        <col style={{ width: 30 }} />
        <col style={{ width: 4 }} />
        <col style={{ width: hasCols ? 300 : undefined }} />
        <col style={{ width: 32 }} />
        <col style={{ width: 100 }} />
        {activeCols.map(col => <col key={col.key} style={{ width: 100 }} />)}
        <col style={{ width: 32 }} />
      </colgroup>
      {activeCols.length > 0 && (
        <thead style={{ position: 'sticky', top: 0, zIndex: 11 }}>
          <tr style={{ background: T.surface1, borderBottom: `0.5px solid ${T.borderStrong}` }}>
            <th style={stickyHead(S.drag, { width: 28 })} />
            <th style={stickyHead(S.checkbox, { width: 30 })} />
            <th style={stickyHead(S.stripe, { width: 4 })} />
            <th style={stickyHead(S.prompt, { minWidth: 200 })} />
            <th style={{ width: 32 }} />
            <th style={{ width: 100 }} />
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
            <tr key={item.id} style={{ height: 38, borderBottom: `0.5px solid ${T.borderAccent}`, background: '#F0F7FF', borderLeft: `3px solid ${T.fillAccent}` }}>
              <td style={{ width: 28, padding: 0 }}><div style={{ width: 28, height: 38, display: 'flex', alignItems: 'center', paddingLeft: 8, color: T.textMuted, fontSize: 14 }}><i className="ti ti-grip-vertical" /></div></td>
              <td style={{ width: 30, padding: '0 6px' }}><input type="checkbox" style={{ accentColor: T.fillAccent, width: 13, height: 13, display: 'block' }} /></td>
              <td style={{ width: 4, padding: 0 }}><div style={{ width: 4, height: 38, background: item.stripe || 'transparent' }} /></td>
              <td style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', height: 38, padding: '0 8px', gap: 8 }}>
                  <input ref={editInputRef} value={editingPrompt} onChange={e => onEditChange(e.target.value)} onBlur={onEditCommit} onKeyDown={e => { if (e.key === 'Enter') onEditCommit(); if (e.key === 'Escape') onEditCommit(); }} placeholder="Type prompt text…" style={{ fontFamily: T.font, fontSize: 13, border: 'none', outline: 'none', background: 'transparent', color: T.textPrimary, width: '100%' }} />
                  <span style={{ fontSize: 10, color: T.textMuted, fontStyle: 'italic', flexShrink: 0 }}>required</span>
                </div>
              </td>
              <td style={{ width: 32, padding: '0 5px', borderLeft: `0.5px solid ${T.border}`, textAlign: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 38 }}>
                  <i className={`ti ${TYPE_META[item.type].icon}`} style={{ fontSize: 15, color: T.textAccent }} />
                </div>
              </td>
              <td style={{ width: 100, padding: '0 8px', borderLeft: `0.5px solid ${T.border}` }} />
              {activeCols.map(col => <td key={col.key} style={{ width: 100, borderLeft: `0.5px solid ${T.border}` }} />)}
              <td style={{ width: 32, padding: '0 4px' }} />
            </tr>
          ) : (
            <ItemRow key={item.id} item={item} items={items} isSelected={selectedIds.has(item.id)} isActive={activeItemId === item.id} isCut={cutIds.has(item.id)} dcMode={dcMode} dcLinkingId={dcLinkingId} dcColors={dcColors} kebabOpenId={kebabOpenId} shownCols={shownCols} onCheckbox={onCheckbox} onRowClick={onRowClick} onKebab={onKebab} onKebabClose={onKebabClose} onKebabAction={onKebabAction} onDCClick={onDCClick} />
          )
        ))}
      </tbody>
    </table>
  );
}
