import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
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
type ItemType = 'yn' | 'checkmark' | 'rating' | 'signature' | 'mc' | 'short' | 'free' | 'measurement' | 'number' | 'photo' | 'qr' | 'employee' | 'date' | 'datetime' | 'time' | 'stopwatch' | 'subtitle' | 'text' | 'barcode' | 'sublist' | 'formula' | 'asset' | 'email';

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
  measType?: string;
  measUnit?: string;
  measMethods?: string[];
  measSensorId?: string;
  measRanges?: { id: string; min: string; max: string }[];
  measFlagRules?: { id: string; condition: string; rangeId: string; flagId: string; flagIds?: string[]; recordColor: string }[];
  mcTemplateId?: string;
  mcMultiSelect?: boolean;
  mcShowInline?: boolean;
  mcDraftChoices?: MCChoice[];
  photoAllowUpload?: boolean;
  employeeRoles?: string[];
  sublistTarget?: string;
  formulaVars?: { name: string; itemId: string }[];
  formulaType?: 'number' | 'date' | 'text';
  formulaExpr?: string;
  assetFilterByUser?: boolean;
  assetType?: string;
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
  number:      { label: 'Number',         icon: 'ti-123' },
  photo:       { label: 'Photo',          icon: 'ti-camera' },
  qr:          { label: 'QR Code',        icon: 'ti-qrcode' },
  employee:    { label: 'Employee',       icon: 'ti-user' },
  date:        { label: 'Date',           icon: 'ti-calendar' },
  datetime:    { label: 'Date/Time',      icon: 'ti-calendar-clock' },
  time:        { label: 'Time',           icon: 'ti-clock' },
  stopwatch:   { label: 'Stopwatch',      icon: 'ti-hourglass' },
  subtitle:    { label: 'Subtitle',       icon: 'ti-heading' },
  text:        { label: 'Text',           icon: 'ti-text-size' },
  barcode:     { label: 'Bar Code',       icon: 'ti-barcode' },
  sublist:     { label: 'Sublist',        icon: 'ti-layout-list' },
  formula:     { label: 'Formula',        icon: 'ti-math-function' },
  asset:       { label: 'Asset',          icon: 'ti-building-factory' },
  email:       { label: 'External Email', icon: 'ti-mail' },
};

const ALL_TYPES: { type: ItemType; aliases: string[] }[] = [
  { type: 'yn',          aliases: ['yn','boolean','pass fail','yes no'] },
  { type: 'checkmark',   aliases: ['tick','check','done','complete'] },
  { type: 'rating',      aliases: ['score','rating','scale','stars','5 star','1-5'] },
  { type: 'signature',   aliases: ['sign','initials','approval'] },
  { type: 'mc',          aliases: ['mc','select','options','dropdown','pick','choice'] },
  { type: 'short',       aliases: ['short text','brief','input','entry'] },
  { type: 'free',        aliases: ['text','paragraph','write','comment','notes','long'] },
  { type: 'measurement', aliases: ['num','numeric','temperature','temp','range','value'] },
  { type: 'number',      aliases: ['number','integer','count','quantity'] },
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
  { type: 'asset',       aliases: ['asset','equipment','device','machine'] },
  { type: 'email',       aliases: ['email','external email','notify','send'] },
];

const FLAG_COLORS = ['#1A1A1F','#EF5350','#FF7043','#FFB300','#66BB6A','#42A5F5','#7E57C2','#EC407A','#26C6DA','#FFFFFF'];
const FLAG_EMOJIS = ['🚩','⚠️','🔴','🟠','🟡','🟢','🔵','🟣','⭐','❗','❌','✅','🔥','💧','🌿','🍽️','🔧','🏥','📋','🔑'];
const LOCATION_TAGS = ['BOH', 'FOH', 'Bar', 'Kitchen', 'Drive-Thru', 'Prep', 'Storage', 'Receiving', 'Freezer', 'Dishwash', 'Catering', 'Patio', 'Lounge', 'Bakery', 'Deli', 'Produce', 'Dairy', 'Meat', 'Seafood', 'Checkout'];
const SCORE_GROUPS = ['Food Safety', 'Equipment', 'Sanitation', 'Customer Experience', 'Opening', 'Closing'];
const IMPORTANCE_LEVELS = ['Critical', 'Major', 'Minor'];
const EMPLOYEE_ROLES = ['Manager', 'Supervisor', 'Operator', 'Kitchen Manager', 'Auditor', 'Integrations Admin', 'System Admin', 'IAM Admin'];
const ASSET_TYPES = ['Inspection Type', 'Equipment'];

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
  { id: 'item-subtitle',   prompt: 'Subtitle item',           type: 'subtitle',    stripe: '', inds: [], allowNA: false },
  { id: 'item-text',       prompt: 'Text item',               type: 'text',        stripe: '', inds: [], allowNA: false },
  { id: 'item-checkmark',  prompt: 'Checkmark item',          type: 'checkmark',   stripe: '', inds: [], allowNA: false },
  { id: 'item-mc',         prompt: 'Multiple choice item',    type: 'mc',          stripe: '', inds: [], allowNA: false, choices: [] },
  { id: 'item-free',       prompt: 'Free entry item',         type: 'free',        stripe: '', inds: [], allowNA: false },
  { id: 'item-yn',         prompt: 'Yes/No item',             type: 'yn',          stripe: '', inds: [], allowNA: false },
  { id: 'item-employee',   prompt: 'Employee item',           type: 'employee',    stripe: '', inds: [], allowNA: false },
  { id: 'item-email',      prompt: 'Email item',              type: 'email',       stripe: '', inds: [], allowNA: false },
  { id: 'item-photo',      prompt: 'Photo item',              type: 'photo',       stripe: '', inds: [], allowNA: false },
  { id: 'item-qr',         prompt: 'QR code item',            type: 'qr',          stripe: '', inds: [], allowNA: false },
  { id: 'item-barcode',    prompt: 'Barcode item',            type: 'barcode',     stripe: '', inds: [], allowNA: false },
  { id: 'item-measurement',prompt: 'Measurement item',        type: 'measurement', stripe: '', inds: [], allowNA: false, measType: 'temperature', measUnit: 'F', measMethods: ['Manual Input'] },
  { id: 'item-sublist',    prompt: 'Sublist item',            type: 'sublist',     stripe: '', inds: [], allowNA: false },
  { id: 'item-rating',     prompt: 'Rating item',             type: 'rating',      stripe: '', inds: [], allowNA: false },
  { id: 'item-asset',      prompt: 'Asset item',              type: 'asset',       stripe: '', inds: [], allowNA: false },
  { id: 'item-number',     prompt: 'Number item',             type: 'number',      stripe: '', inds: [], allowNA: false },
  { id: 'item-formula',    prompt: 'Formula item',            type: 'formula',     stripe: '', inds: [], allowNA: false },
  { id: 'item-date',       prompt: 'Date item',               type: 'date',        stripe: '', inds: [], allowNA: false },
  { id: 'item-time',       prompt: 'Time item',               type: 'time',        stripe: '', inds: [], allowNA: false },
  { id: 'item-datetime',   prompt: 'Date/Time item',          type: 'datetime',    stripe: '', inds: [], allowNA: false },
  { id: 'item-stopwatch',  prompt: 'Stopwatch item',          type: 'stopwatch',   stripe: '', inds: [], allowNA: false },
  { id: 'item-signature',  prompt: 'Signature item',          type: 'signature',   stripe: '', inds: [], allowNA: false },
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

function Tooltip({ children, text }: { children: React.ReactNode; text: string }) {
  const [rect, setRect] = useState<DOMRect | null>(null);
  const ref = useRef<HTMLSpanElement>(null);
  return (
    <span ref={ref} style={{ display: 'inline-flex', alignItems: 'center' }}
      onMouseEnter={() => setRect(ref.current?.getBoundingClientRect() ?? null)}
      onMouseLeave={() => setRect(null)}
    >
      {children}
      {rect && ReactDOM.createPortal(
        <span style={{
          position: 'fixed',
          top: rect.top - 6,
          left: rect.left + rect.width / 2,
          transform: 'translate(-50%, -100%)',
          background: '#1C1C1E', color: '#fff', fontSize: 11, fontWeight: 500, lineHeight: 1.5,
          padding: '5px 9px', borderRadius: 6, whiteSpace: 'pre', zIndex: 9999,
          pointerEvents: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
        }}>
          {text}
        </span>,
        document.body
      )}
    </span>
  );
}

function dcCondLabel(cond?: DCCondition) {
  if (!cond) return '';
  if (cond.type === 'yn') return `if ${cond.value}`;
  return `if ${cond.op} ${cond.value}°F`;
}

// ── Mini reusable components ──────────────────────────────────────────────
// ── List Schedule ─────────────────────────────────────────────────────────

interface DisplayTime { id: string; hour: number; minute: number; ampm: 'AM' | 'PM'; dueAmt: number; dueUnit: string; expAmt: number; expUnit: string; }
interface MonthRange { id: string; fromMonth: number; fromDay: number; toMonth: number; toDay: number; }

type RepeatMode = 'daily' | 'weekly' | 'monthly' | 'custom';
type MonthMode = 'specific' | 'ranges';

const OFFSET_UNITS = ['minutes', 'hours', 'days', 'weeks'];
const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DAYS_SHORT = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

function daysInMonth(month: number) {
  return [31,28,29,30,31,30,31,31,30,31,30,31][month];
}

const UNIT_MINUTES: Record<string, number> = { minutes: 1, hours: 60, days: 1440, weeks: 10080 };

function dtToMinutes(dt: DisplayTime): number {
  const h12 = dt.hour % 12;
  return (dt.ampm === 'PM' ? h12 + 12 : h12) * 60 + dt.minute;
}

function dtConflicts(dts: DisplayTime[]): Map<string, 'due' | 'exp'> {
  const result = new Map<string, 'due' | 'exp'>();
  for (let i = 0; i < dts.length; i++) {
    const a = dts[i];
    const aStart = dtToMinutes(a);
    const aDue = aStart + a.dueAmt * (UNIT_MINUTES[a.dueUnit] ?? 1);
    const aExp = aDue + a.expAmt * (UNIT_MINUTES[a.expUnit] ?? 1);
    for (let j = i + 1; j < dts.length; j++) {
      const b = dts[j];
      const bStart = dtToMinutes(b);
      if (bStart < aDue) { if (!result.has(a.id)) result.set(a.id, 'due'); }
      else if (bStart < aExp) { if (!result.has(a.id)) result.set(a.id, 'exp'); }
    }
  }
  return result;
}

function schedSummary(dts: DisplayTime[]): string {
  if (dts.length === 0) return '';
  const times = dts.map(dt => {
    const h = dt.hour; const m = dt.minute.toString().padStart(2,'0');
    return `${h}:${m} ${dt.ampm}`;
  }).join(' and ');
  const first = dts[0];
  const sameOffsets = dts.every(d => d.dueAmt === first.dueAmt && d.dueUnit === first.dueUnit && d.expAmt === first.expAmt && d.expUnit === first.expUnit);
  const offStr = sameOffsets ? ` · due ${first.dueAmt} ${first.dueUnit} after display · expires ${first.expAmt} ${first.expUnit} after due` : ' · offsets differ';
  return times + offStr;
}

function repeatSummary(mode: RepeatMode, weekDays: number[], occurrences: number[], monthDays: number[], intervalAmt: number, intervalUnit: string, intervalStart: string): string {
  if (mode === 'daily') return 'Every day';
  if (mode === 'weekly') {
    const dNames = weekDays.map(d => DAYS_SHORT[d]).join(', ');
    const occStr = occurrences.length === 5 ? 'every week' : occurrences.map(o => ['1st','2nd','3rd','4th','5th'][o-1]).join(', ');
    return dNames ? `${dNames} · ${occStr}` : 'No days selected';
  }
  if (mode === 'monthly') {
    const sel = monthDays.slice().sort((a,b)=>a-b);
    return sel.length ? `Days ${sel.join(', ')} of each month` : 'No days selected';
  }
  if (mode === 'custom') {
    const d = intervalStart ? new Date(intervalStart + 'T12:00:00') : null;
    const dateStr = d ? d.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}) : '—';
    return `Every ${intervalAmt} ${intervalUnit} starting ${dateStr}`;
  }
  return '';
}

function monthSummary(mode: MonthMode, activeMonths: number[], ranges: MonthRange[]): string {
  if (mode === 'specific') {
    if (activeMonths.length === 12) return 'All months';
    return activeMonths.map(m => MONTHS_SHORT[m]).join(', ');
  }
  return ranges.map(r => `${MONTHS_SHORT[r.fromMonth]} ${r.fromDay} – ${MONTHS_SHORT[r.toMonth]} ${r.toDay}`).join(' and ');
}

function ScheduleOptions({ bumpLists, setBumpLists, reDisplay, setReDisplay, ignoreBlackouts, setIgnoreBlackouts }: { bumpLists: boolean; setBumpLists: (v: boolean) => void; reDisplay: boolean; setReDisplay: (v: boolean) => void; ignoreBlackouts: boolean; setIgnoreBlackouts: (v: boolean) => void }) {
  const [open, setOpen] = useState(false);
  const rows = [
    { label: 'Bump lists', sub: 'Replace incomplete instances when a new schedule instance generates', on: bumpLists, set: setBumpLists },
    { label: 'Offer to re-display after submission', sub: 'Prompt to immediately generate another instance when this list is submitted', on: reDisplay, set: setReDisplay },
    { label: 'Ignore blackouts', sub: 'Display this list even on company-wide blackout dates', on: ignoreBlackouts, set: setIgnoreBlackouts },
  ];
  return (
    <div style={{ borderTop: `0.5px solid ${T.border}`, marginTop: 4 }}>
      <div onClick={() => setOpen(v => !v)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', cursor: 'pointer', userSelect: 'none' }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: T.textPrimary }}>List schedule options</span>
        <i className={`ti ti-chevron-${open ? 'up' : 'down'}`} style={{ fontSize: 13, color: T.textMuted }} />
      </div>
      {open && (
        <div style={{ display: 'flex', flexDirection: 'column', paddingBottom: 8 }}>
          {rows.map((row, i) => (
            <div key={row.label} style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', paddingTop: i > 0 ? 10 : 0, marginTop: i > 0 ? 10 : 0, borderTop: i > 0 ? `0.5px solid ${T.border}` : 'none', gap: 16 }}>
              <div>
                <div style={{ fontSize: 13, color: T.textPrimary }}>{row.label}</div>
                <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2, lineHeight: 1.4, maxWidth: 420 }}>{row.sub}</div>
              </div>
              <Toggle on={row.on} onChange={row.set} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ListScheduleSection() {
  const [displayTimes, setDisplayTimes] = useState<DisplayTime[]>([]);

  const [repeatMode, setRepeatMode] = useState<RepeatMode>('daily');
  const [weekDays, setWeekDays] = useState<number[]>([0,1,2,3,4,5,6]);
  const [occurrences, setOccurrences] = useState<number[]>([1,2,3,4,5]);
  const [monthDays, setMonthDays] = useState<number[]>([]);
  const [intervalAmt, setIntervalAmt] = useState(10);
  const [intervalUnit, setIntervalUnit] = useState('days');
  const [intervalStart, setIntervalStart] = useState('');

  const [monthMode, setMonthMode] = useState<MonthMode>('specific');
  const [activeMonths, setActiveMonths] = useState<number[]>([0,1,2,3,4,5,6,7,8,9,10,11]);
  const [monthRanges, setMonthRanges] = useState<MonthRange[]>([{ id: mkid(), fromMonth: 0, fromDay: 1, toMonth: 2, toDay: 31 }]);

  const [bumpLists, setBumpLists] = useState(true);
  const [reDisplay, setReDisplay] = useState(false);
  const [ignoreBlackouts, setIgnoreBlackouts] = useState(false);

  const addDisplayTime = () => {
    const dt: DisplayTime = { id: mkid(), hour: 8, minute: 0, ampm: 'AM', dueAmt: 8, dueUnit: 'hours', expAmt: 1, expUnit: 'hours' };
    setDisplayTimes(prev => [...prev, dt]);
  };

  const updateDT = (id: string, patch: Partial<DisplayTime>) => {
    setDisplayTimes(prev => prev.map(d => d.id === id ? { ...d, ...patch } : d));
  };

  const removeDT = (id: string) => setDisplayTimes(prev => prev.filter(d => d.id !== id));

  const toggleWeekDay = (d: number) => setWeekDays(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]);
  const toggleOccurrence = (o: number) => setOccurrences(prev => prev.includes(o) ? prev.filter(x => x !== o) : [...prev, o]);
  const toggleMonthDay = (d: number) => setMonthDays(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]);
  const toggleMonth = (m: number) => setActiveMonths(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m]);

  const addRange = () => setMonthRanges(prev => [...prev, { id: mkid(), fromMonth: 0, fromDay: 1, toMonth: 11, toDay: 31 }]);
  const removeRange = (id: string) => setMonthRanges(prev => prev.filter(r => r.id !== id));
  const updateRange = (id: string, patch: Partial<MonthRange>) => setMonthRanges(prev => prev.map(r => r.id === id ? { ...r, ...patch } : r));

  const hasSchedule = displayTimes.length > 0;
  const summary = hasSchedule ? schedSummary(displayTimes) : 'No schedule configured';
  const conflicts = bumpLists ? dtConflicts(displayTimes) : new Map<string, 'due' | 'exp'>();

  const segBtn = (label: string, mode: RepeatMode) => (
    <div key={label} onClick={() => setRepeatMode(mode)}
      style={{ flex: 1, padding: '7px 4px', textAlign: 'center', fontSize: 12, fontWeight: 500, cursor: 'pointer', borderRadius: 6,
        color: repeatMode === mode ? T.textAccent : T.textMuted,
        background: repeatMode === mode ? T.surface2 : 'transparent',
        boxShadow: repeatMode === mode ? '0 1px 4px rgba(0,0,0,0.08)' : 'none' }}>
      {label}
    </div>
  );

  const chip = (label: string, on: boolean, onClick: () => void, muted?: boolean) => (
    <div onClick={onClick} style={{ fontFamily: T.font, fontSize: 12, fontWeight: 500, padding: '5px 10px', borderRadius: 6, cursor: 'pointer',
      border: `0.5px solid ${on ? T.fillAccent : T.borderStrong}`,
      background: on ? T.fillAccent : T.surface2,
      color: on ? T.onAccent : muted ? T.textMuted : T.textSecondary }}>
      {label}
    </div>
  );

  const numChip = (label: string, on: boolean, onClick: () => void, muted?: boolean) => (
    <div onClick={onClick} style={{ fontFamily: T.font, fontSize: 12, fontWeight: 500, minWidth: 34, textAlign: 'center', padding: '5px 4px', borderRadius: 6, cursor: 'pointer',
      border: `0.5px solid ${on ? T.fillAccent : T.borderStrong}`,
      background: on ? T.fillAccent : T.surface2,
      color: on ? T.onAccent : muted ? T.textMuted : T.textSecondary }}>
      {label}
    </div>
  );

  const secLabel = (text: string) => (
    <div style={{ fontSize: 10, fontWeight: 600, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>{text}</div>
  );

  const selectAllRow = (checked: boolean, onChange: (v: boolean) => void, label = 'Select all') => (
    <label style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: T.textSecondary, marginBottom: 6, cursor: 'pointer' }}>
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} style={{ accentColor: T.fillAccent, width: 13, height: 13 }} />
      {label}
    </label>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

      {/* ── Display Times ── */}
      <div style={{ marginBottom: 16 }}>
        {secLabel('Display times')}
        {displayTimes.length === 0 && (
          <div style={{ fontSize: 12, color: T.textMuted, fontStyle: 'italic', marginBottom: 8 }}>No display times set</div>
        )}
        {displayTimes.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 8 }}>
            {displayTimes.map(dt => {
              const offsetSel = (val: number, onChange: (v: number) => void) => (
                <input type="number" value={val} min={1} onChange={e => onChange(Number(e.target.value))}
                  style={{ fontFamily: T.font, fontSize: 13, border: `0.5px solid ${T.borderStrong}`, borderRadius: 4, padding: '3px 6px', width: 44, textAlign: 'center', background: T.surface2, color: T.textPrimary }} />
              );
              const unitSel = (val: string, onChange: (v: string) => void) => (
                <select value={val} onChange={e => onChange(e.target.value)}
                  style={{ fontFamily: T.font, fontSize: 12, color: T.textSecondary, background: 'transparent', border: 'none', cursor: 'pointer', outline: 'none', padding: '0 2px' }}>
                  {OFFSET_UNITS.map(u => <option key={u}>{u}</option>)}
                </select>
              );
              const conflict = conflicts.get(dt.id);
              const conflictMsg = conflict === 'due'
                ? 'The list scheduled at this display time will be replaced before it is due by the list on a later display time. Reduce the due interval or turn off Bump Lists in List schedule options to have both lists available to work on.'
                : conflict === 'exp'
                ? 'The list scheduled at this display time will be replaced before it expires by the list on a later display time. Reduce the expiration interval or turn off Bump Lists in List schedule options to have both lists available to work on.'
                : null;
              return (
                <div key={dt.id} style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 0, background: T.surface1, border: `0.5px solid ${conflict ? '#EF5350' : T.border}`, borderRadius: conflictMsg ? '8px 8px 0 0' : 8, overflow: 'hidden' }}>
                  {/* Time */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRight: `0.5px solid ${T.border}` }}>
                    <div style={{ fontSize: 10, fontWeight: 600, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Time</div>
                    <select value={dt.hour} onChange={e => updateDT(dt.id, { hour: Number(e.target.value) })}
                      style={{ fontFamily: T.font, fontSize: 13, fontWeight: 500, background: 'transparent', border: 'none', cursor: 'pointer', outline: 'none', color: T.textPrimary }}>
                      {Array.from({length:12},(_,i)=>i+1).map(h => <option key={h}>{h}</option>)}
                    </select>
                    <span style={{ fontSize: 13, fontWeight: 500, color: T.textMuted }}>:</span>
                    <select value={dt.minute.toString().padStart(2,'0')} onChange={e => updateDT(dt.id, { minute: Number(e.target.value) })}
                      style={{ fontFamily: T.font, fontSize: 13, fontWeight: 500, background: 'transparent', border: 'none', cursor: 'pointer', outline: 'none', color: T.textPrimary }}>
                      {['00','15','30','45'].map(m => <option key={m}>{m}</option>)}
                    </select>
                    <select value={dt.ampm} onChange={e => updateDT(dt.id, { ampm: e.target.value as 'AM'|'PM' })}
                      style={{ fontFamily: T.font, fontSize: 12, background: 'transparent', border: 'none', cursor: 'pointer', outline: 'none', color: T.textSecondary }}>
                      <option>AM</option><option>PM</option>
                    </select>
                  </div>
                  {/* Due after */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRight: `0.5px solid ${T.border}` }}>
                    <div style={{ fontSize: 10, fontWeight: 600, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Due after</div>
                    {offsetSel(dt.dueAmt, v => updateDT(dt.id, { dueAmt: v }))}
                    {unitSel(dt.dueUnit, v => updateDT(dt.id, { dueUnit: v }))}
                  </div>
                  {/* Expires after */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px' }}>
                    <div style={{ fontSize: 10, fontWeight: 600, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Expires after</div>
                    {offsetSel(dt.expAmt, v => updateDT(dt.id, { expAmt: v }))}
                    {unitSel(dt.expUnit, v => updateDT(dt.id, { expUnit: v }))}
                  </div>
                  <button onClick={() => removeDT(dt.id)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: T.textMuted, fontSize: 15, padding: '8px 12px', flexShrink: 0 }}>
                    <i className="ti ti-x" />
                  </button>
                </div>
                {conflictMsg && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '8px 12px', background: 'rgba(239,83,80,0.08)', border: '0.5px solid #EF5350', borderTop: 'none', borderRadius: '0 0 8px 8px' }}>
                    <i className="ti ti-alert-circle" style={{ fontSize: 14, color: '#EF5350', flexShrink: 0, marginTop: 1 }} />
                    <span style={{ fontSize: 12, color: '#EF5350', lineHeight: 1.4 }}>{conflictMsg}</span>
                  </div>
                )}
                </div>
              );
            })}
          </div>
        )}
        <button onClick={addDisplayTime} style={{ fontFamily: T.font, fontSize: 12, fontWeight: 500, color: T.textAccent, background: T.bgAccent, border: `0.5px solid ${T.borderAccent}`, borderRadius: 5, padding: '6px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
          <i className="ti ti-plus" /> Add display time
        </button>
      </div>

      {/* ── Repeats ── */}
      {hasSchedule && <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: T.textPrimary, marginBottom: 4 }}>Repeats</div>
        {false && (
          <div style={{ fontSize: 12, color: T.textAccent, marginBottom: 10 }}>
            {repeatSummary(repeatMode, weekDays, occurrences, monthDays, intervalAmt, intervalUnit, intervalStart)}
          </div>
        )}
        {/* Segmented control */}
        <div style={{ display: 'flex', background: T.surface0, border: `0.5px solid ${T.borderStrong}`, borderRadius: 8, overflow: 'hidden', marginBottom: 14 }}>
          {segBtn('Daily','daily')}{segBtn('Weekly','weekly')}{segBtn('Monthly','monthly')}{segBtn('Custom','custom')}
        </div>

        {repeatMode === 'daily' && (
          <div style={{ fontSize: 12, color: T.textMuted, fontStyle: 'italic' }}>Repeats every day — no further configuration needed</div>
        )}

        {repeatMode === 'weekly' && (
          <div>
            {selectAllRow(weekDays.length === 7, v => setWeekDays(v ? [0,1,2,3,4,5,6] : []))}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {DAYS_SHORT.map((d,i) => chip(d, weekDays.includes(i), () => toggleWeekDay(i)))}
            </div>
            <div style={{ marginTop: 12, paddingTop: 12, borderTop: `0.5px solid ${T.border}` }}>
              {secLabel('Occurrence in month')}
              {selectAllRow(occurrences.length === 5, v => setOccurrences(v ? [1,2,3,4,5] : []), 'Every week')}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {[1,2,3,4,5].map(o => numChip(String(o), occurrences.includes(o), () => toggleOccurrence(o)))}
              </div>
            </div>
          </div>
        )}

        {repeatMode === 'monthly' && (
          <div>
            {selectAllRow(monthDays.length === 31, v => setMonthDays(v ? Array.from({length:31},(_,i)=>i+1) : []))}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {Array.from({length:31},(_,i)=>i+1).map(d => {
                const warn = d >= 29;
                return numChip(`${d}${warn?'*':''}`, monthDays.includes(d), () => toggleMonthDay(d), warn && !monthDays.includes(d));
              })}
            </div>
            <div style={{ fontSize: 11, color: T.textMuted, marginTop: 6, fontStyle: 'italic' }}>* These dates do not exist in every month — the list will not display in months where the date doesn't occur</div>
          </div>
        )}

        {repeatMode === 'custom' && (
          <div>
            <div style={{ marginBottom: 10 }}>
              {secLabel('Start date')}
              <input type="date" value={intervalStart} onChange={e => setIntervalStart(e.target.value)}
                style={{ fontFamily: T.font, fontSize: 13, border: `0.5px solid ${T.borderStrong}`, borderRadius: 5, padding: '6px 8px', color: T.textPrimary }} />
            </div>
            <div>
              {secLabel('Repeat every')}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="number" value={intervalAmt} min={1} onChange={e => setIntervalAmt(Number(e.target.value))}
                  style={{ fontFamily: T.font, fontSize: 13, border: `0.5px solid ${T.borderStrong}`, borderRadius: 5, padding: '6px 8px', width: 64, textAlign: 'center', color: T.textPrimary }} />
                <select value={intervalUnit} onChange={e => setIntervalUnit(e.target.value)}
                  style={{ fontFamily: T.font, fontSize: 13, color: T.textPrimary, background: T.surface2, border: `0.5px solid ${T.borderStrong}`, borderRadius: 5, padding: '6px 12px', cursor: 'pointer' }}>
                  <option>days</option><option>weeks</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>}

      {/* ── Active Months ── */}
      {hasSchedule && <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: T.textPrimary, marginBottom: 10 }}>Displays during these months</div>
        {/* Mode toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
          {(['specific','ranges'] as MonthMode[]).map((m, i) => (
            <button key={m} onClick={() => setMonthMode(m)}
              style={{ fontFamily: T.font, fontSize: 12, fontWeight: 500, padding: '4px 12px', borderRadius: 20, cursor: 'pointer',
                border: `0.5px solid ${monthMode === m ? T.fillAccent : T.borderStrong}`,
                background: monthMode === m ? T.fillAccent : T.surface2,
                color: monthMode === m ? T.onAccent : T.textMuted }}>
              {i === 0 ? 'Specific months' : 'Date ranges'}
            </button>
          ))}
        </div>

        {monthMode === 'specific' && (
          <div>
            {selectAllRow(activeMonths.length === 12, v => setActiveMonths(v ? [0,1,2,3,4,5,6,7,8,9,10,11] : []), 'All months')}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {MONTHS_SHORT.map((m,i) => chip(m, activeMonths.includes(i), () => toggleMonth(i)))}
            </div>
          </div>
        )}

        {monthMode === 'ranges' && (
          <div>
            {monthRanges.map(r => {
              const rangeSel = (val: number, opts: string[], onChange: (v: number) => void) => (
                <select value={val} onChange={e => onChange(Number(e.target.value))}
                  style={{ fontFamily: T.font, fontSize: 12, color: T.textPrimary, background: T.surface2, border: `0.5px solid ${T.borderStrong}`, borderRadius: 5, padding: '4px 8px', cursor: 'pointer' }}>
                  {opts.map((o,i) => <option key={i} value={i}>{o}</option>)}
                </select>
              );
              const dayOpts = Array.from({length: daysInMonth(r.fromMonth)}, (_,i) => String(i+1));
              const dayOptsTo = Array.from({length: daysInMonth(r.toMonth)}, (_,i) => String(i+1));
              return (
                <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', padding: '8px 10px', background: T.surface1, border: `0.5px solid ${T.border}`, borderRadius: 6, marginBottom: 6 }}>
                  <span style={{ fontSize: 11, fontWeight: 500, color: T.textSecondary, flexShrink: 0 }}>From</span>
                  {rangeSel(r.fromMonth, MONTHS_SHORT, v => updateRange(r.id, { fromMonth: v, fromDay: Math.min(r.fromDay, daysInMonth(v)) }))}
                  {rangeSel(r.fromDay - 1, dayOpts, v => updateRange(r.id, { fromDay: v + 1 }))}
                  <span style={{ fontSize: 11, fontWeight: 500, color: T.textSecondary, flexShrink: 0 }}>to</span>
                  {rangeSel(r.toMonth, MONTHS_SHORT, v => updateRange(r.id, { toMonth: v, toDay: Math.min(r.toDay, daysInMonth(v)) }))}
                  {rangeSel(r.toDay - 1, dayOptsTo, v => updateRange(r.id, { toDay: v + 1 }))}
                  <button onClick={() => removeRange(r.id)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: T.textMuted, fontSize: 14 }}><i className="ti ti-x" /></button>
                </div>
              );
            })}
            <button onClick={addRange} style={{ fontFamily: T.font, fontSize: 12, fontWeight: 500, color: T.textAccent, background: T.bgAccent, border: `0.5px solid ${T.borderAccent}`, borderRadius: 5, padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
              <i className="ti ti-plus" /> Add range
            </button>
          </div>
        )}
      </div>}

      {/* ── List schedule options ── */}
      <ScheduleOptions bumpLists={bumpLists} setBumpLists={setBumpLists} reDisplay={reDisplay} setReDisplay={setReDisplay} ignoreBlackouts={ignoreBlackouts} setIgnoreBlackouts={setIgnoreBlackouts} />

    </div>
  );
}

function HelpTip({ text }: { text: string }) {
  if (!text) return null;
  return (
    <Tooltip text={text}>
      <i className="ti ti-help-circle" style={{ fontSize: 14, color: T.textMuted, cursor: 'default', verticalAlign: 'middle', flexShrink: 0 }} />
    </Tooltip>
  );
}

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

function SectionHeader({ label, helpTip, summary, right, children, defaultOpen = false }: { label: string; helpTip?: string; summary?: string; right?: React.ReactNode; children?: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ background: T.surface2, border: `0.5px solid ${T.border}`, borderRadius: 8, marginBottom: 8, overflow: 'hidden' }}>
      <div onClick={() => setOpen(v => !v)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', cursor: 'pointer', userSelect: 'none' }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: T.textPrimary, display: 'flex', alignItems: 'center', gap: 6 }}>{label}{helpTip && <span onClick={e => e.stopPropagation()}><HelpTip text={helpTip} /></span>}</div>
          {summary && <div style={{ fontSize: 12, color: T.textMuted, marginTop: 2 }}>{summary}</div>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {right}
          <i className={`ti ti-chevron-${open ? 'up' : 'down'}`} style={{ fontSize: 14, color: T.textMuted }} />
        </div>
      </div>
      {children && <div style={{ borderTop: `0.5px solid ${T.border}`, padding: '16px', display: open ? undefined : 'none' }}>{children}</div>}
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
          {FLAG_COLORS.map(c => <div key={c} onClick={() => setNewFlagColor(c)} style={{ width: 20, height: 20, borderRadius: '50%', background: c, cursor: 'pointer', border: newFlagColor === c ? `2px solid ${c === '#1A1A1F' ? '#ffffff' : c === '#FFFFFF' ? T.borderStrong : T.textPrimary}` : `1px solid ${c === '#FFFFFF' ? T.borderStrong : 'transparent'}`, outline: newFlagColor === c && c === '#1A1A1F' ? `1.5px solid ${T.borderStrong}` : 'none', outlineOffset: 1 }} />)}
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

function FlagPicker({ answer = 'Yes', selectedIds, flags, onToggle, onCreateFlag, restrictedFlagId }: { answer?: 'Yes' | 'No'; selectedIds: string[]; flags: Flag[]; onToggle: (flagId: string) => void; onCreateFlag: (flag: Flag) => void; restrictedFlagId?: string }) {
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

function TagPicker({ options, selected, onChange, placeholder, closeOnSelect = false }: { options: string[]; selected: string[]; onChange: (tags: string[]) => void; placeholder: string; closeOnSelect?: boolean }) {
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
  const toggle = (tag: string) => { onChange(selected.includes(tag) ? selected.filter(t => t !== tag) : [...selected, tag]); if (closeOnSelect) setOpen(false); };

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
  return <TagPicker options={LOCATION_TAGS} selected={selected} onChange={onChange} placeholder="Add location tag…" closeOnSelect />;
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
          <div style={{ marginBottom: 8 }}>
            <FlagPicker
              selectedIds={rule.flagIds ?? (rule.flagId ? [rule.flagId] : [])}
              flags={flags}
              onToggle={flagId => {
                const current = rule.flagIds ?? (rule.flagId ? [rule.flagId] : []);
                const next = current.includes(flagId) ? current.filter(id => id !== flagId) : [...current, flagId];
                updateRule(rule.id, { flagIds: next, flagId: next[0] ?? '' });
              }}
              onCreateFlag={flag => { onCreateFlag(flag); const current = rule.flagIds ?? (rule.flagId ? [rule.flagId] : []); updateRule(rule.id, { flagIds: [...current, flag.id], flagId: flag.id }); }}
            />
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

  const addRule = () => {
    const usedIds = new Set(mcRules.map(r => r.condition));
    const nextChoice = choices.find(c => !usedIds.has(c.id));
    onUpdate({ caForMCRules: [...mcRules, { id: mkid(), condition: nextChoice?.id ?? '', caList: '', adHoc: false, nextStep: 'repeat-item' }] });
  };
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
              <span style={{ fontSize: 13, color: T.textPrimary, fontWeight: 500 }}>Turn on for {markAs}</span>
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

      {/* Turn on for choices */}
      <div style={{ paddingTop: markAs ? 0 : 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: mcRules.length > 0 ? 10 : 0 }}>
          <span style={{ fontSize: 13, color: T.textPrimary, fontWeight: 500 }}>Turn on for choices</span>
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
      {/* For Yes/No or ranges — shown first for Y/N, after N/A for measurement */}
      {!isMeas && <></>}
      {/* For N/A / OOO — only shown when markAs is set; shown first for measurement */}
      {isMeas && markAs && (
        <>
          <div style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: forNA ? 10 : 0 }}>
              <span style={{ fontSize: 13, color: T.textPrimary, fontWeight: 500 }}>Turn on for {markAs}</span>
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
      {isMeas && markAs && <div style={{ borderTop: `0.5px solid ${T.border}`, marginTop: forNA ? 12 : 0 }} />}
      <div style={{ marginTop: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: (isMeas ? forRanges : ynRules.length > 0) ? 10 : 0 }}>
          <span style={{ fontSize: 13, color: T.textPrimary, fontWeight: 500 }}>{isMeas ? 'Turn on for ranges' : 'Turn on for Yes/No'}</span>
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
        {/* For N/A — shown after For Yes/No on Y/N items */}
        {!isMeas && markAs && (
          <>
            <div style={{ borderTop: `0.5px solid ${T.border}`, margin: '12px 0' }} />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: forNA ? 10 : 0 }}>
                <span style={{ fontSize: 13, color: T.textPrimary, fontWeight: 500 }}>Turn on for {markAs}</span>
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
          </>
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

function MCChoiceRow({ c, idx, locked, scoringOn, flags, onUpdate, onRemove, focusId, onFocused }: {
  scoringOn: boolean;
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
          {scoringOn && (!locked || (c.score !== undefined && c.score !== '')) && (
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

function MCChoiceList({ choices, locked, scoringOn, flags, onUpdate, onRemove, focusId, onFocused }: {
  choices: MCChoice[]; locked: boolean; scoringOn: boolean; flags: Flag[];
  onUpdate?: (id: string, u: Partial<MCChoice>) => void;
  onRemove?: (id: string) => void;
  focusId?: string; onFocused?: () => void
}) {
  return (
    <div>
      {choices.map((c, idx) => (
        <MCChoiceRow key={c.id} c={c} idx={idx} locked={locked} scoringOn={scoringOn} flags={flags}
          onUpdate={onUpdate} onRemove={onRemove} focusId={focusId} onFocused={onFocused} />
      ))}
    </div>
  );
}

function TemplateRow({ tpl, onUse, onCopy }: { tpl: { id: string; name: string; choices: MCChoice[] }; onUse: () => void; onCopy: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 12px', borderBottom: `0.5px solid ${T.border}`, background: hovered ? T.surface1 : 'transparent', cursor: 'pointer' }}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} onClick={onUse}>
      <span style={{ fontSize: 13, color: T.textPrimary }}>{tpl.name}</span>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', opacity: hovered ? 1 : 0, transition: 'opacity 0.1s' }}>
        <button onMouseDown={e => { e.preventDefault(); e.stopPropagation(); onCopy(); }} onClick={e => e.stopPropagation()} style={{ fontFamily: T.font, fontSize: 12, padding: '3px 10px', borderRadius: 4, border: `0.5px solid ${T.borderStrong}`, background: T.surface0, color: T.textSecondary, cursor: 'pointer' }}>Copy</button>
        <button onMouseDown={e => { e.preventDefault(); onUse(); }} style={{ fontFamily: T.font, fontSize: 12, padding: '3px 10px', borderRadius: 4, border: 'none', background: T.fillAccent, color: 'white', cursor: 'pointer' }}>Use</button>
      </div>
    </div>
  );
}

function MCChoicesSection({ item, onUpdate, scoringOn, flags }: { item: ListItem; onUpdate: (u: Partial<ListItem>) => void; scoringOn: boolean; flags: Flag[] }) {
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
        <MCChoiceList choices={choices} locked={usingTemplate} scoringOn={scoringOn} flags={flags} onUpdate={updateChoice} onRemove={removeChoice} focusId={newChoiceId ?? undefined} onFocused={() => setNewChoiceId(null)} />
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
  const measType = item.measType ?? 'temperature';
  const measUnit = item.measUnit ?? 'F';
  const measMethods = item.measMethods ?? ['Manual Input'];
  const measSensorId = item.measSensorId ?? '';
  const ranges = item.measRanges ?? [];
  const setRanges = (next: { id: string; min: string; max: string }[]) => onUpdate({ measRanges: next });

  const unitOptions = MEAS_UNITS[measType] ?? [];

  const handleTypeChange = (t: string) => {
    const opts = MEAS_UNITS[t] ?? [];
    onUpdate({ measType: t, measUnit: opts.length > 0 ? opts[0].value : '', measMethods: ['Manual Input'] });
  };

  const toggleInputMethod = (m: string) => {
    const next = measMethods.includes(m) ? measMethods.filter(x => x !== m) : [...measMethods, m];
    onUpdate({ measMethods: next });
  };

  return (
    <SsSection label="Measurement Options" defaultOpen>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 13, color: T.textPrimary }}>Saved value</div>
          <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2, lineHeight: 1.4 }}>Pre-fills with the last recorded value on new list instances</div>
        </div>
        <Toggle on={!!item.savedValue} onChange={v => onUpdate({ savedValue: v })} />
      </div>
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
              ? <input value={measUnit} onChange={e => onUpdate({ measUnit: e.target.value })} placeholder="Enter unit…" style={{ fontFamily: T.font, fontSize: 13, border: `0.5px solid ${T.borderStrong}`, borderRadius: 5, padding: '6px 10px', width: 120 }} />
              : <Select value={measUnit} onChange={v => onUpdate({ measUnit: v })} options={unitOptions} />
            }
          </div>
        )}
      </div>
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 6 }}>Input Methods</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {(MEAS_INPUT_METHODS[measType] ?? []).map(m => {
            const selected = measMethods.includes(m);
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
      {measMethods.includes('Sensor') && (
        <div style={{ marginBottom: 12, padding: 12, background: T.surface1, borderRadius: 8, border: `0.5px solid ${T.border}` }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>Linked Sensor Data</div>
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ flex: 1 }}>
              <Select
                value={measSensorId}
                onChange={v => onUpdate({ measSensorId: v })}
                options={[{ value: '', label: 'Select Sensor' }, ...MOCK_SENSORS.map(s => ({ value: s.id, label: s.name }))]}
              />
            </div>
            <div style={{ width: 110 }}>
              <input
                readOnly
                value={measSensorId ? (MOCK_SENSORS.find(s => s.id === measSensorId)?.reading ?? '') : ''}
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
    setOpen(false);
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

function PromptEditor({ item, onUpdate, autoFocus }: { item: ListItem; onUpdate: (u: Partial<ListItem>) => void; autoFocus?: boolean }) {
  const editorRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = item.promptHtml ?? item.prompt;
      if (autoFocus) editorRef.current.focus();
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

// ── Asset section ─────────────────────────────────────────────────────────
function AssetSection({ item, onUpdate }: { item: ListItem; onUpdate: (u: Partial<ListItem>) => void }) {
  const [tipVisible, setTipVisible] = useState(false);

  return (
    <SsSection label="Asset Options" defaultOpen>
      {/* Filter by user toggle */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 13, color: T.textPrimary }}>Filter asset list on app by user</span>
            <div style={{ position: 'relative', display: 'inline-flex' }}
              onMouseEnter={() => setTipVisible(true)}
              onMouseLeave={() => setTipVisible(false)}
            >
              <i className="ti ti-info-circle" style={{ fontSize: 14, color: T.textMuted, cursor: 'default' }} />
              {tipVisible && (
                <div style={{
                  position: 'absolute', bottom: 'calc(100% + 6px)', left: '50%', transform: 'translateX(-50%)',
                  background: '#1A1A1F', color: '#fff', fontSize: 12, lineHeight: 1.4,
                  padding: '7px 10px', borderRadius: 6, zIndex: 400,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.2)', pointerEvents: 'none',
                  width: 220, whiteSpace: 'normal', textAlign: 'center',
                }}>
                  Turn this on to filter the asset list on the app to the auditor's assets.
                </div>
              )}
            </div>
          </div>
          <Toggle on={!!item.assetFilterByUser} onChange={v => onUpdate({ assetFilterByUser: v })} />
        </div>
      </div>

      {/* Asset type selector */}
      <div style={{ borderTop: `0.5px solid ${T.border}`, paddingTop: 12 }}>
        <div style={{ fontSize: 13, color: T.textPrimary, marginBottom: 8 }}>Asset Type</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {ASSET_TYPES.map(type => {
            const selected = (item.assetType ?? 'Inspection Type') === type;
            return (
              <div key={type} onClick={() => onUpdate({ assetType: type })}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 6, cursor: 'pointer', background: selected ? T.bgAccent : 'transparent', border: `0.5px solid ${selected ? T.borderAccent : 'transparent'}` }}
                onMouseEnter={e => { if (!selected) (e.currentTarget as HTMLElement).style.background = T.surface1; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = selected ? T.bgAccent : 'transparent'; }}
              >
                <div style={{ width: 14, height: 14, borderRadius: '50%', border: `1.5px solid ${selected ? T.fillAccent : T.borderStrong}`, background: selected ? T.fillAccent : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {selected && <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#fff' }} />}
                </div>
                <span style={{ fontSize: 13, color: selected ? T.textAccent : T.textPrimary }}>{type}</span>
              </div>
            );
          })}
        </div>
      </div>
    </SsSection>
  );
}

// ── Formula section ───────────────────────────────────────────────────────
const FORMULA_VAR_NAMES = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const FORMULA_VAR_TYPES: ItemType[] = ['measurement', 'number', 'rating', 'date', 'time', 'datetime'];

function FormulaSection({ item, items, onUpdate }: { item: ListItem; items: ListItem[]; onUpdate: (u: Partial<ListItem>) => void }) {
  const vars = item.formulaVars ?? [];
  const formulaType = item.formulaType ?? 'number';
  const expr = item.formulaExpr ?? '';

  const eligibleItems = items.filter(it => it.id !== item.id && FORMULA_VAR_TYPES.includes(it.type));
  const nextVarName = FORMULA_VAR_NAMES[vars.length] ?? '?';

  const addVar = () => {
    onUpdate({ formulaVars: [...vars, { name: nextVarName, itemId: '' }] });
  };

  const updateVar = (idx: number, itemId: string) => {
    const next = vars.map((v, i) => i === idx ? { ...v, itemId } : v);
    onUpdate({ formulaVars: next });
  };

  const removeVar = (idx: number) => {
    const remaining = vars.filter((_, i) => i !== idx).map((v, i) => ({ ...v, name: FORMULA_VAR_NAMES[i] }));
    onUpdate({ formulaVars: remaining });
  };

  return (
    <SsSection label="Formula" defaultOpen>
      {/* Variables */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: T.textPrimary, marginBottom: 10 }}>Variables</div>
        {vars.map((v, idx) => (
          <div key={v.name} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: T.textSecondary, width: 24, flexShrink: 0 }}>{v.name} =</span>
            <select
              value={v.itemId}
              onChange={e => updateVar(idx, e.target.value)}
              style={{ fontFamily: T.font, fontSize: 13, flex: 1, border: `0.5px solid ${T.borderStrong}`, borderRadius: 5, padding: '6px 24px 6px 8px', background: T.surface2, color: v.itemId ? T.textPrimary : T.textMuted, cursor: 'pointer', appearance: 'none', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%239898A8'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center' }}
            >
              <option value="">Select item…</option>
              {eligibleItems.map(it => (
                <option key={it.id} value={it.id}>
                  {it.prompt || `(${TYPE_META[it.type].label})`} — {TYPE_META[it.type].label}
                </option>
              ))}
            </select>
            <button onClick={() => removeVar(idx)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.textMuted, fontSize: 15, padding: '2px 4px', borderRadius: 4, display: 'flex', alignItems: 'center' }}>
              <i className="ti ti-x" />
            </button>
          </div>
        ))}
        {vars.length < FORMULA_VAR_NAMES.length && (
          <button onClick={addVar} style={{ fontFamily: T.font, fontSize: 12, fontWeight: 600, color: T.textAccent, background: 'none', border: 'none', cursor: 'pointer', padding: '2px 0', letterSpacing: '0.04em' }}>
            + ADD VARIABLE
          </button>
        )}
      </div>

      {/* Divider */}
      <div style={{ borderTop: `0.5px solid ${T.border}`, marginBottom: 16 }} />

      {/* Formula type */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: T.textPrimary, marginBottom: 10 }}>Formula</div>
        <select
          value={formulaType}
          onChange={e => onUpdate({ formulaType: e.target.value as 'number' | 'date' | 'text' })}
          style={{ fontFamily: T.font, fontSize: 13, width: '100%', border: `0.5px solid ${T.borderStrong}`, borderRadius: 5, padding: '6px 24px 6px 8px', background: T.surface2, color: T.textPrimary, cursor: 'pointer', appearance: 'none', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%239898A8'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center', marginBottom: 12 }}
        >
          <option value="number">Number</option>
          <option value="date">Date</option>
          <option value="text">Text</option>
        </select>

        {/* Formula expression box */}
        <div style={{ border: `0.5px solid ${T.borderStrong}`, borderRadius: 5, background: T.surface2, overflow: 'hidden' }}>
          <div style={{ fontSize: 11, color: T.textMuted, padding: '6px 10px 4px', borderBottom: `0.5px solid ${T.border}` }}>Formula</div>
          <div style={{ display: 'flex', alignItems: 'flex-start', padding: '8px 10px' }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: T.textSecondary, marginRight: 6, lineHeight: '20px', flexShrink: 0 }}>=</span>
            <textarea
              value={expr}
              onChange={e => onUpdate({ formulaExpr: e.target.value })}
              spellCheck={false}
              placeholder="SUM(A, B)"
              style={{ fontFamily: "'Courier New', monospace", fontSize: 13, flex: 1, minHeight: 100, border: 'none', outline: 'none', resize: 'vertical', background: 'transparent', color: T.textPrimary, lineHeight: '20px', padding: 0 }}
            />
          </div>
        </div>
      </div>
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
          <PromptEditor item={item} onUpdate={upd} autoFocus={!item.prompt} />
        </SsSection>
        {/* General options */}
        <SsSection label="General Options" defaultOpen={true}>
          {item.type !== 'text' && item.type !== 'subtitle' && (
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
          {item.type !== 'text' && item.type !== 'subtitle' && (
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 13, color: T.textPrimary, marginBottom: 6 }}>Points</div>
              <input type="number" min={0} value={item.points ?? ''} onChange={e => upd({ points: e.target.value === '' ? undefined : Number(e.target.value) })} placeholder="0" style={{ fontFamily: T.font, fontSize: 13, border: `0.5px solid ${T.borderStrong}`, borderRadius: 5, padding: '6px 10px', width: 80, marginBottom: 6 }} />
              <div style={{ fontSize: 11, color: T.textMuted, lineHeight: 1.4 }}>Employees get points by completing items or half points if late.</div>
            </div>
          )}
          <div style={{ borderTop: item.type !== 'subtitle' && item.type !== 'text' ? `0.5px solid ${T.border}` : 'none', paddingTop: item.type !== 'subtitle' && item.type !== 'text' ? 12 : 0, marginBottom: 10 }}>
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
        {item.type === 'mc' && <MCChoicesSection item={item} onUpdate={upd} scoringOn={scoringOn} flags={flags} />}
        {item.type === 'mc' && <MCCASection item={item} onUpdate={upd} markAs={markAs} />}
        {item.type === 'rating' && <RatingSection item={item} onUpdate={upd} scoringOn={scoringOn} />}
        {item.type === 'measurement' && <MeasurementSection item={item} onUpdate={upd} />}
        {(item.type === 'yn' || item.type === 'measurement') && <CASection item={item} onUpdate={upd} markAs={markAs} />}
        {item.type === 'yn' && <FlagSection item={item} onUpdate={upd} flags={flags} onCreateFlag={onCreateFlag} />}
        {item.type === 'measurement' && (item.measRanges?.length ?? 0) > 0 && (
          <MeasurementFlagSection item={item} onUpdate={upd} flags={flags} onCreateFlag={onCreateFlag} />
        )}
        {item.type === 'yn' && <CompletionModeSection item={item} onUpdate={upd} flags={flags} onCreateFlag={onCreateFlag} />}
        {(item.type === 'qr' || item.type === 'barcode') && <CodeSection item={item} onUpdate={upd} />}
        {item.type === 'asset' && <AssetSection item={item} onUpdate={upd} />}
        {item.type === 'formula' && <FormulaSection item={item} items={items} onUpdate={upd} />}
        {item.type === 'sublist' && (
          <SsSection label="Sublist Options" defaultOpen>
            <div style={{ fontSize: 13, color: T.textPrimary, marginBottom: 4 }}>Linked list</div>
            <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 8, lineHeight: 1.4 }}>Select the list that will be launched when this item is completed</div>
            <CAListPicker value={item.sublistTarget ?? ''} onChange={v => upd({ sublistTarget: v })} />
          </SsSection>
        )}
        {item.type === 'photo' && (
          <SsSection label="Photo Options" defaultOpen>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 13, color: T.textPrimary }}>Allow images to be uploaded from device</div>
              <Toggle on={!!item.photoAllowUpload} onChange={v => upd({ photoAllowUpload: v })} />
            </div>
          </SsSection>
        )}
        {item.type === 'employee' && (
          <SsSection label="Employee Options" defaultOpen>
            <div style={{ fontSize: 13, color: T.textPrimary, marginBottom: 4 }}>Filter by role</div>
            <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 8, lineHeight: 1.4 }}>Only show employees with these roles — empty means all roles</div>
            <TagPicker options={EMPLOYEE_ROLES} selected={item.employeeRoles ?? []} onChange={roles => upd({ employeeRoles: roles.length ? roles : undefined })} placeholder="Add role…" />
          </SsSection>
        )}
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
  const [submission, setSubmission] = useState('items-anytime');
  const [submissionAccess, setSubmissionAccess] = useState('anyone-anytime');
  const [listScoreVisible, setListScoreVisible] = useState(true);
  const [itemScoreVisible, setItemScoreVisible] = useState(false);
  const [rbacAnyone, setRbacAnyone] = useState(true);
  const [allowCreate, setAllowCreate] = useState(false);
  const [allowGeo, setAllowGeo] = useState(false);
  const [sharedIndividual, setSharedIndividual] = useState(false);

  return (
    <div style={{ padding: '16px 16px', maxWidth: 720 }}>
      {/* List submission */}
      <SectionHeader label="List submission" summary={submission === 'items-anytime' ? 'Items can be submitted when complete' : 'List must be fully complete to submit'}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { value: 'items-anytime', label: 'List items can be submitted when complete', tip: '' },
            { value: 'all-complete', label: 'List can only be submitted after all items are complete', tip: '' },
          ].map(opt => (
            <label key={opt.value} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
              <input type="radio" name="submission" value={opt.value} checked={submission === opt.value} onChange={() => setSubmission(opt.value)} style={{ accentColor: T.fillAccent, width: 14, height: 14 }} />
              <span style={{ fontSize: 13, color: T.textPrimary }}>{opt.label}</span>
              <HelpTip text={opt.tip} />
            </label>
          ))}
        </div>
      </SectionHeader>

      {/* Scoring */}
      <SectionHeader label="Scoring" helpTip="Turn on scoring to allow multiple choice, yes/no, and rating items to be used to calculate a score for this list." summary={scoringOn ? 'Score enabled' : 'Score off'} right={<Toggle on={scoringOn} onChange={setScoringOn} />} defaultOpen={scoringOn}>
        {scoringOn && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <span style={{ fontSize: 13, color: T.textPrimary, display: 'flex', alignItems: 'center', gap: 6 }}>People assigned to this list can see the score on the device <HelpTip text="Helpful tip: For quizzes and tests, uncheck this box to hide the score for employees." /></span>
              <Toggle on={listScoreVisible} onChange={setListScoreVisible} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <span style={{ fontSize: 13, color: T.textPrimary, display: 'flex', alignItems: 'center', gap: 6 }}>People managing this list can see the score on the device <HelpTip text="" /></span>
              <Toggle on={itemScoreVisible} onChange={setItemScoreVisible} />
            </div>
          </div>
        )}
      </SectionHeader>

      {/* List schedule */}
      <SectionHeader label="List schedule" helpTip="Add a display time to the list schedule for the list to automatically display on mobile devices." summary="No schedule configured" defaultOpen={false}>
        <ListScheduleSection />
      </SectionHeader>

      {/* Notifications */}
      <SectionHeader label="Notifications" summary="5 events configured" defaultOpen={false}>
        <NotificationSection />
      </SectionHeader>

      {/* Role-based access */}
      <SectionHeader label="Role-based access" summary={rbacAnyone ? 'Anyone with access can complete' : 'Restricted to roles'} defaultOpen={false}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <span style={{ fontSize: 13, color: T.textPrimary, display: 'flex', alignItems: 'center', gap: 6 }}>Anyone <HelpTip text="" /></span>
          <Toggle on={rbacAnyone} onChange={setRbacAnyone} />
        </div>
        {!rbacAnyone && (
          <>
            <Btn><i className="ti ti-plus" /> Add role</Btn>
          </>
        )}
        <div style={{ borderTop: `0.5px solid ${T.border}`, marginTop: 12, paddingTop: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>Who can submit</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { value: 'anyone-anytime', label: 'Anyone can submit the list at any time', tip: '' },
              { value: 'assigned-only', label: 'Only the assigned person can submit', tip: '' },
            ].map(opt => (
              <label key={opt.value} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                <input type="radio" name="submissionAccess" value={opt.value} checked={submissionAccess === opt.value} onChange={() => setSubmissionAccess(opt.value)} style={{ accentColor: T.fillAccent, width: 14, height: 14 }} />
                <span style={{ fontSize: 13, color: T.textPrimary }}>{opt.label}</span>
                <HelpTip text={opt.tip} />
              </label>
            ))}
          </div>
        </div>
      </SectionHeader>

      {/* Create settings */}
      <SectionHeader label="Create settings" summary="Default create settings" defaultOpen={false}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 13, color: T.textPrimary, display: 'flex', alignItems: 'center', gap: 6 }}>Allow employees to create lists <HelpTip text="" /></div>
              <div style={{ fontSize: 12, color: T.textMuted, marginTop: 2 }}>Allow employees to start a new instance of this list at any time</div>
            </div>
            <Toggle on={allowCreate} onChange={setAllowCreate} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 13, color: T.textPrimary, display: 'flex', alignItems: 'center', gap: 6 }}>Require location confirmation <HelpTip text="" /></div>
              <div style={{ fontSize: 12, color: T.textMuted, marginTop: 2 }}>GPS-verify the user is at the correct location</div>
            </div>
            <Toggle on={allowGeo} onChange={setAllowGeo} />
          </div>
        </div>
      </SectionHeader>

      {/* Shared or individual */}
      <SectionHeader label="Shared or individual" summary={sharedIndividual ? 'Individual — each person gets their own copy' : 'Shared — one list per location'} defaultOpen={false}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: sharedIndividual ? 12 : 0 }}>
          <span style={{ fontSize: 13, color: T.textPrimary, display: 'flex', alignItems: 'center', gap: 6 }}>Individual lists <HelpTip text="" /></span>
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
interface ColDef {
  key: string;
  label: string;
  /** If set, renders a blank cell for item types not in this list */
  types?: ItemType[];
  /** Returns true if item has a non-default value for this column (drives auto-on/off) */
  detect: (item: ListItem) => boolean;
  /** Always on by default; excluded from auto-off */
  defaultOn?: boolean;
}

const COLUMN_GROUPS: { group: string; cols: ColDef[] }[] = [
  { group: 'All', cols: [
    { key: 'all-mark-as',        label: 'Mark as',            defaultOn: true, detect: () => false },
    { key: 'all-color',          label: 'Color',              defaultOn: true, detect: i => !!i.stripe },
    { key: 'all-info-library',   label: 'Info library inline',defaultOn: true, detect: i => !!(i.infoInline || i.infoFile) },
    { key: 'all-points',         label: 'Points',             defaultOn: true, detect: i => i.points != null },
    { key: 'all-print-label',    label: 'Print Label',        defaultOn: true, detect: i => (i.labelIds?.length ?? 0) > 0 },
    { key: 'all-tag-location',   label: 'Tag - Location',     defaultOn: true, detect: i => (i.locationTags?.length ?? 0) > 0 },
    { key: 'all-tag-scoring',    label: 'Tag - Scoring',      defaultOn: true, detect: i => !!i.scoreGroup },
    { key: 'all-tag-importance', label: 'Tag - Importance',   defaultOn: true, detect: i => !!i.importance },
  ]},
  { group: 'Y/N', cols: [
    { key: 'yn-score-y',       label: 'Score - Y',     types: ['yn'], detect: i => i.scoreYes != null },
    { key: 'yn-score-n',       label: 'Score - N',     types: ['yn'], detect: i => i.scoreNo != null },
    { key: 'yn-auto-complete', label: 'Auto Complete', types: ['yn'], detect: i => !!i.autoComplete },
    { key: 'yn-flags-yes',     label: 'Flags - Yes',   types: ['yn'], detect: i => (i.flagsForYes?.length ?? 0) > 0 },
    { key: 'yn-flags-no',      label: 'Flags - No',    types: ['yn'], detect: i => (i.flagsForNo?.length ?? 0) > 0 },
  ]},
  { group: 'M — Measurement', cols: [
    { key: 'm-saved-value', label: 'Saved Value', types: ['measurement'], detect: i => !!i.savedValue },
    { key: 'm-type',        label: 'Type',        types: ['measurement'], detect: i => !!i.measType },
    { key: 'm-unit',        label: 'Unit',        types: ['measurement'], detect: i => !!i.measUnit },
    { key: 'm-method',      label: 'Method',      types: ['measurement'], detect: i => (i.measMethods?.length ?? 0) > 0 },
    { key: 'm-sensor-name', label: 'Sensor name', types: ['measurement'], detect: i => !!i.measSensorId },
    { key: 'm-range1-min',  label: 'Range 1 Min', types: ['measurement'], detect: i => (i.measRanges?.length ?? 0) >= 1 },
    { key: 'm-range1-max',  label: 'Range 1 Max', types: ['measurement'], detect: i => (i.measRanges?.length ?? 0) >= 1 },
    { key: 'm-range2-min',  label: 'Range 2 Min', types: ['measurement'], detect: i => (i.measRanges?.length ?? 0) >= 2 },
    { key: 'm-range2-max',  label: 'Range 2 Max', types: ['measurement'], detect: i => (i.measRanges?.length ?? 0) >= 2 },
    { key: 'm-range3-min',  label: 'Range 3 Min', types: ['measurement'], detect: i => (i.measRanges?.length ?? 0) >= 3 },
    { key: 'm-range3-max',  label: 'Range 3 Max', types: ['measurement'], detect: i => (i.measRanges?.length ?? 0) >= 3 },
    { key: 'm-flag-r1',    label: 'Flag - R1',   types: ['measurement'], detect: i => (i.measRanges?.length ?? 0) >= 1 && (i.measFlagRules?.some(r => r.rangeId === i.measRanges?.[0]?.id && ((r.flagIds?.length ?? 0) > 0 || !!r.flagId)) ?? false) },
    { key: 'm-color-r1',   label: 'Color - R1',  types: ['measurement'], detect: i => (i.measRanges?.length ?? 0) >= 1 && (i.measFlagRules?.some(r => r.rangeId === i.measRanges?.[0]?.id) ?? false) },
    { key: 'm-flag-r2',    label: 'Flag - R2',   types: ['measurement'], detect: i => (i.measRanges?.length ?? 0) >= 2 && (i.measFlagRules?.some(r => r.rangeId === i.measRanges?.[1]?.id && ((r.flagIds?.length ?? 0) > 0 || !!r.flagId)) ?? false) },
    { key: 'm-color-r2',   label: 'Color - R2',  types: ['measurement'], detect: i => (i.measRanges?.length ?? 0) >= 2 && (i.measFlagRules?.some(r => r.rangeId === i.measRanges?.[1]?.id) ?? false) },
    { key: 'm-flag-r3',    label: 'Flag - R3',   types: ['measurement'], detect: i => (i.measRanges?.length ?? 0) >= 3 && (i.measFlagRules?.some(r => r.rangeId === i.measRanges?.[2]?.id && ((r.flagIds?.length ?? 0) > 0 || !!r.flagId)) ?? false) },
    { key: 'm-color-r3',   label: 'Color - R3',  types: ['measurement'], detect: i => (i.measRanges?.length ?? 0) >= 3 && (i.measFlagRules?.some(r => r.rangeId === i.measRanges?.[2]?.id) ?? false) },
  ]},
  { group: 'MC — Multiple Choice', cols: [
    { key: 'mc-multi-select', label: 'Multi-select', types: ['mc'], detect: i => !!i.mcMultiSelect },
    { key: 'mc-show-inline',  label: 'Show inline',  types: ['mc'], detect: i => !!i.mcShowInline },
  ]},
  { group: 'CA — Corrective Action', cols: [
    { key: 'ca-turn-on',       label: 'Turn on for results', types: ['yn', 'measurement', 'mc'], detect: i => (i.caForYNRules?.length ?? 0) > 0 || !!i.caForRanges || (i.caForMCRules?.length ?? 0) > 0 },
    { key: 'ca-trigger-yn',    label: 'Condition',                                          detect: i => (i.caForYNRules?.some(r => !!r.condition) ?? false) || (i.caForMCRules?.some(r => !!r.condition) ?? false) },
    { key: 'ca-list',          label: 'CA List',                                            detect: i => (i.caForYNRules?.some(r => r.adHoc || !!r.caList) ?? false) || (i.caForRangeRules?.some(r => r.adHoc || !!r.caList) ?? false) || (i.caForMCRules?.some(r => r.adHoc || !!r.caList) ?? false) },
    { key: 'ca-repeat',        label: 'Next Step',                                          detect: i => (i.caForYNRules?.length ?? 0) > 0 || (i.caForRangeRules?.length ?? 0) > 0 || (i.caForMCRules?.length ?? 0) > 0 || !!i.caForNA },
    { key: 'ca-planned',       label: 'Ad Hoc',                                             detect: i => (i.caForYNRules?.some(r => !!r.adHoc) ?? false) || !!i.caForNAAdHoc },
    { key: 'ca-optional',      label: 'Optional',                                           detect: i => (i.caForYNRules?.some(r => !!r.optional) ?? false) || (i.caForRangeRules?.some(r => !!r.optional) ?? false) || !!i.caForNAOptional },
    { key: 'ca-trigger-ranges',label: 'Trigger Ranges',  types: ['measurement'],            detect: i => (i.caForRangeRules?.length ?? 0) > 0 },
    { key: 'ca-turn-on-na',    label: 'Turn on for N/A', types: ['yn', 'measurement'],      detect: i => !!i.caForNA },
    { key: 'ca-list-na',       label: 'List for NA',                                        detect: i => !!i.caForNAList },
  ]},
  { group: 'Rating', cols: [
    { key: 'rating-range', label: 'Range', types: ['rating'], detect: i => i.ratingMin != null || i.ratingMax != null },
  ]},
  { group: 'Photo', cols: [
    { key: 'photo-allow-upload', label: 'Allow Upload', types: ['photo'], detect: i => !!i.photoAllowUpload },
  ]},
  { group: 'Employee', cols: [
    { key: 'employee-roles', label: 'Role Filter', types: ['employee'], detect: i => (i.employeeRoles?.length ?? 0) > 0 },
  ]},
  { group: 'QR / Barcode', cols: [
    { key: 'qr-target',      label: 'QR Target',      types: ['qr'],      detect: i => !!i.qrTarget },
    { key: 'barcode-target', label: 'Barcode Target',  types: ['barcode'], detect: i => !!i.barcodeTarget },
  ]},
  { group: 'Formula', cols: [
    { key: 'formula-type', label: 'Formula Type', types: ['formula'], detect: i => !!i.formulaType },
  ]},
  { group: 'Asset', cols: [
    { key: 'asset-type',        label: 'Asset Type',     types: ['asset'], detect: i => !!i.assetType },
    { key: 'asset-filter-user', label: 'Filter by User', types: ['asset'], detect: i => !!i.assetFilterByUser },
  ]},
  { group: 'Sublist', cols: [
    { key: 'sublist-target', label: 'Linked List', types: ['sublist'], detect: i => !!i.sublistTarget },
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
function LocationTagCell({ tags, isActive }: { tags: string[]; isActive?: boolean }) {
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
        <Tooltip text={tags[0]}><span style={{ fontSize: 11, fontWeight: 500, color: T.textAccent, background: isActive ? 'rgba(255,255,255,0.75)' : T.bgAccent, padding: '2px 7px', borderRadius: 10, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block', maxWidth: '100%' }}>{tags[0]}</span></Tooltip>
      </td>
    );
  }
  return (
    <td ref={ref} style={{ width: 100, padding: '0 8px', borderLeft: `0.5px solid ${T.border}`, textAlign: 'center', position: 'relative' }}>
      <Tooltip text={tags.join('\n')}>
        <span
          onClick={() => setOpen(v => !v)}
          style={{ display: 'inline-block', fontSize: 11, fontWeight: 600, minWidth: 20, padding: '2px 7px', borderRadius: 10, background: isActive ? 'rgba(255,255,255,0.75)' : T.bgAccent, color: T.textAccent, cursor: 'pointer' }}
        >
          {tags.length}
        </span>
      </Tooltip>
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
  anySelected: boolean;
  isActive: boolean;
  isCut: boolean;
  dcMode: boolean;
  dcLinkingId: string | null;
  dcColors: Record<string, string>;
  kebabOpenId: string | null;
  shownCols: Set<string>;
  promptWidth: number;
  colValues: Record<string, Record<string, string>>;
  onColChange: (itemId: string, colKey: string, value: string | null) => void;
  onUpdate: (id: string, patch: Partial<ListItem>) => void;
  onCheckbox: (id: string) => void;
  onRowClick: (id: string) => void;
  onKebab: (id: string) => void;
  onKebabClose: () => void;
  onKebabAction: (action: string, id: string) => void;
  onDCClick: (id: string) => void;
  flags: Flag[];
  caToastId: string | null;
  onCaToast: (key: string | null) => void;
}

const isYNCaUnconfigured = (item: ListItem) =>
  (item.caForYNRules?.length ?? 0) > 0 &&
  item.caForYNRules!.every(r => !r.caList && !r.adHoc);

const isNACaUnconfigured = (item: ListItem) =>
  !!item.caForNA && !item.caForNAList && !item.caForNAAdHoc;

function ItemRow({ item, items, isSelected, anySelected, isActive, isCut, dcMode, dcLinkingId, dcColors, kebabOpenId, shownCols, promptWidth, colValues, onColChange, onUpdate, onCheckbox, onRowClick, onKebab, onKebabClose, onKebabAction, onDCClick, flags, caToastId, onCaToast }: RowProps) {
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
    ...(() => {
      const toName = (id: string) => { const f = flags.find(x => x.id === id); return f ? `${f.emoji ? f.emoji + ' ' : ''}${f.name}` : id; };
      const yesIds = item.flagsForYes ?? [];
      const noIds = item.flagsForNo ?? [];
      const measRules = (item.measFlagRules ?? []).filter(r => (r.flagIds?.length ?? 0) > 0 || !!r.flagId);
      if (yesIds.length === 0 && noIds.length === 0 && measRules.length === 0) return [];
      const lines = [
        ...(yesIds.length > 0 ? [`Yes: ${yesIds.map(toName).join(', ')}`] : []),
        ...(noIds.length > 0 ? [`No: ${noIds.map(toName).join(', ')}`] : []),
        ...measRules.map(r => {
          const rangeIdx = (item.measRanges ?? []).findIndex(x => x.id === r.rangeId);
          const range = item.measRanges?.[rangeIdx];
          const label = range ? `R${rangeIdx + 1} (${range.min || 'Min'} – ${range.max || 'Max'})` : `R?`;
          const ids = r.flagIds ?? (r.flagId ? [r.flagId] : []);
          return `${label}: ${ids.map(toName).join(', ')}`;
        }),
      ];
      return [{ icon: 'ti-flag', title: lines.join('\n') }];
    })(),
    ...((item.infoInline || item.infoFile) ? [{ icon: 'ti-info-circle', title: item.infoFile ?? 'Info Library configured' }] : []),
    ...(() => {
      const caLines: string[] = [];
      // N/A CA — shared across all types
      if (item.caForNA) {
        caLines.push(`N/A — ${item.caForNAAdHoc ? 'Ad hoc corrective action' : (item.caForNAList || 'Ad hoc corrective action')}`);
      }
      // Y/N result CA
      for (const r of item.caForYNRules ?? []) {
        caLines.push(`${r.condition} — ${r.adHoc ? 'Ad hoc corrective action' : (r.caList || 'Ad hoc corrective action')}`);
      }
      // Measurement range CA
      for (const r of item.caForRangeRules ?? []) {
        const rangeIdx = (item.measRanges ?? []).findIndex(x => x.id === r.rangeId);
        const range = item.measRanges?.[rangeIdx];
        const rangeLabel = range ? `R${rangeIdx + 1} (${range.min || 'Min'} – ${range.max || 'Max'}) ${r.condition ?? ''}` : `Result`;
        caLines.push(`${rangeLabel} — ${r.adHoc ? 'Ad hoc corrective action' : (r.caList || 'Ad hoc corrective action')}`);
      }
      // MC result CA
      for (const r of item.caForMCRules ?? []) {
        const choice = (item.choices ?? []).find(c => c.id === r.condition);
        const choiceLabel = choice ? choice.label : 'Result';
        caLines.push(`${choiceLabel} — ${r.adHoc ? 'Ad hoc corrective action' : (r.caList || 'Ad hoc corrective action')}`);
      }
      return caLines.length > 0 ? [{ icon: 'ti-alert-triangle', title: caLines.join('\n') }] : [];
    })(),
    ...(!!item.dcParentId || items.some(x => x.dcParentId === item.id) ? [{ icon: 'ti-filter', title: 'Display Criteria configured' }] : []),
  ];
  const activeCols = ALL_COLS.filter(c => shownCols.has(c.key));
  const rowBg = isActive || isLinkingChild ? T.bgAccent : hovered ? T.surface1 : T.surface2;
  const stickyBg = rowBg;
  // On an active (blue) row, accent pills need a contrasting background so they don't dissolve into the row color
  const pillBg = (isActive || isLinkingChild) ? 'rgba(255,255,255,0.75)' : T.bgAccent;
  const pillColor = (isActive || isLinkingChild) ? T.textAccent : T.textAccent;
  const sticky = (left: number, extra?: React.CSSProperties): React.CSSProperties => ({
    position: 'sticky', left, zIndex: 1, background: stickyBg, ...extra,
  });

  return (
    <tr style={{
      height: 44, borderBottom: `0.5px solid ${T.border}`,
      background: rowBg,
      opacity: isCut ? 0.4 : isTypeDimmed ? 0.28 : 1,
      position: 'relative',
      cursor: 'default',
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
        <input type="checkbox" checked={isSelected} onChange={() => onCheckbox(item.id)} style={{ accentColor: T.fillAccent, width: 13, height: 13, display: 'block', opacity: hovered || isSelected || isActive || anySelected ? 1 : 0, cursor: 'pointer' }} />
      </td>
      {/* Stripe */}
      <td style={sticky(58, { width: 4, padding: 0 })}>
        <div style={{ width: 4, height: 44, background: item.stripe || 'transparent' }} />
      </td>
      {/* Prompt */}
      <td style={sticky(62, { padding: 0, width: activeCols.length > 0 ? promptWidth : undefined })} onClick={() => dcMode ? onDCClick(item.id) : onRowClick(item.id)}>
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
      {/* Type icon — sticky just past the prompt */}
      <td style={sticky(62 + promptWidth, { width: 32, padding: '0 5px', borderLeft: `0.5px solid ${T.borderStrong}`, textAlign: 'center' })}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 44 }}>
          <i className={`ti ${meta.icon}`} style={{ fontSize: 15, color: T.textMuted }} title={meta.label} />
        </div>
      </td>
      {/* Config indicators */}
      <td style={{ width: 88, padding: '0 8px', borderLeft: `0.5px solid ${T.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: 44 }}>
          {derivedInds.map(ind => (
            <Tooltip key={ind.icon} text={ind.title}>
              <i className={`ti ${ind.icon}`} style={{ fontSize: 13, color: indColor(ind.icon) }} />
            </Tooltip>
          ))}
        </div>
      </td>
      {/* Optional columns */}
      {activeCols.map(col => {
        if (col.types && !col.types.includes(item.type)) {
          return <td key={col.key} style={{ width: 100, padding: '0 12px', borderLeft: `0.5px solid ${T.border}`, textAlign: 'center', color: T.textMuted, fontSize: 12 }}>—</td>;
        }
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
          const on = item.type === 'measurement' ? !!item.caForRanges
            : item.type === 'mc' ? (item.caForMCRules?.length ?? 0) > 0
            : (item.caForYNRules?.length ?? 0) > 0;
          const unconfigured = item.type === 'yn' && isYNCaUnconfigured(item);
          const toastKey = `${item.id}:ca-turn-on`;
          const showToast = caToastId === toastKey;
          return (
            <td key={col.key} style={{ width: 100, padding: '0 8px', borderLeft: `0.5px solid ${T.border}`, textAlign: 'center', cursor: 'pointer', position: 'relative', outline: unconfigured ? `1.5px solid #EF5350` : 'none', outlineOffset: -1 }}
              onClick={e => {
                e.stopPropagation();
                if (item.type === 'measurement') {
                  if (!on) { onUpdate(item.id, { caForRanges: true, caForRangeRules: [{ id: mkid(), rangeId: item.measRanges?.[0]?.id ?? '', condition: 'Inside', caList: '', adHoc: false, nextStep: 'repeat-item' }] }); onCaToast(toastKey); setTimeout(() => onCaToast(null), 3000); }
                  else onUpdate(item.id, { caForRanges: false, caForRangeRules: [] });
                } else if (item.type === 'mc') {
                  if (!on) { onUpdate(item.id, { caForMCRules: [{ id: mkid(), condition: '', caList: '', adHoc: false, nextStep: 'repeat-item' }] }); onCaToast(toastKey); setTimeout(() => onCaToast(null), 3000); }
                  else onUpdate(item.id, { caForMCRules: [] });
                } else {
                  if (!on) { onUpdate(item.id, { caForYNRules: [{ id: mkid(), condition: 'No', caList: '', adHoc: false, nextStep: 'repeat-item' }] }); onCaToast(toastKey); setTimeout(() => onCaToast(null), 3000); }
                  else { onUpdate(item.id, { caForYNRules: [] }); onCaToast(null); }
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
          const stepLabel = (s: string | undefined) => s === 'repeat-item' ? 'Item' : s === 'repeat-list' ? 'List' : null;
          const truncChoice = (label: string) => { const w = label.trim().split(/\s+/); return w.length <= 3 ? label : w.slice(0, 3).join(' ') + '…'; };
          const repeatPills: { label: string; tip: string; na: boolean }[] = [];
          for (const r of item.caForYNRules ?? []) {
            const label = stepLabel(r.nextStep);
            if (label) repeatPills.push({ label, tip: `Repeat ${label.toLowerCase()} for ${r.condition ?? 'Result'}`, na: false });
          }
          for (const r of item.caForRangeRules ?? []) {
            const label = stepLabel(r.nextStep);
            if (label) {
              const rangeIdx = (item.measRanges ?? []).findIndex(x => x.id === r.rangeId);
              const range = item.measRanges?.[rangeIdx];
              const rangeLabel = range ? `R${rangeIdx + 1} (${range.min || 'Min'} – ${range.max || 'Max'})` : `R${rangeIdx + 1}`;
              repeatPills.push({ label, tip: `Repeat ${label.toLowerCase()} for ${rangeLabel}`, na: false });
            }
          }
          for (const r of item.caForMCRules ?? []) {
            const label = stepLabel(r.nextStep);
            if (label) {
              const choice = (item.choices ?? []).find(c => c.id === r.condition);
              const choiceLabel = choice?.label || r.condition || 'Choice';
              repeatPills.push({ label, tip: `Repeat ${label.toLowerCase()} for ${choiceLabel}`, na: false });
            }
          }
          if (item.caForNA) {
            const markAsVal = (colValues[item.id] ?? {})['all-mark-as'] ?? 'N/A';
            const label = stepLabel(item.caForNANextStep ?? 'repeat-item');
            if (label) repeatPills.push({ label, tip: `Repeat ${label.toLowerCase()} for ${markAsVal || 'N/A'}`, na: true });
          }
          if (repeatPills.length === 0) return <td key={col.key} style={{ width: 100, padding: '0 8px', borderLeft: `0.5px solid ${T.border}`, textAlign: 'center' }}><span style={{ color: T.textMuted, fontSize: 12 }}>—</span></td>;
          const combinedTip = repeatPills.map(p => p.tip).join('\n');
          return (
            <td key={col.key} style={{ width: 100, padding: '0 8px', borderLeft: `0.5px solid ${T.border}`, textAlign: 'center' }}>
              {repeatPills.length === 1 ? (
                <Tooltip text={repeatPills[0].tip}>
                  <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 7px', borderRadius: 10, background: repeatPills[0].na ? T.surface1 : pillBg, color: repeatPills[0].na ? T.textSecondary : T.textAccent, whiteSpace: 'nowrap' }}>{repeatPills[0].label}</span>
                </Tooltip>
              ) : (
                <Tooltip text={combinedTip}>
                  <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 7px', borderRadius: 10, background: pillBg, color: T.textAccent, whiteSpace: 'nowrap' }}>{repeatPills.length} steps</span>
                </Tooltip>
              )}
            </td>
          );
        }
        if (col.key === 'ca-optional') {
          const isMeas = item.type === 'measurement';
          const optPills: { label: string; tip: string }[] = [];
          // Y/N per-rule conditions
          for (const r of item.caForYNRules ?? []) {
            if (r.optional) optPills.push({ label: r.condition ?? 'Result', tip: `Optional for ${r.condition ?? 'Result'}` });
          }
          // Measurement per-range-rule conditions
          for (const r of item.caForRangeRules ?? []) {
            if (r.optional) {
              const idx = (item.measRanges ?? []).findIndex(x => x.id === r.rangeId);
              const range = item.measRanges?.[idx];
              const label = idx >= 0 ? `R${idx + 1}` : 'Range';
              const tip = range ? `Optional for R${idx + 1} (${range.min || 'Min'} – ${range.max || 'Max'})` : `Optional for ${label}`;
              optPills.push({ label, tip });
            }
          }
          // N/A or OOO — use the actual markAs value so OOO items show "OOO"
          if (item.caForNAOptional) {
            const markAsVal = (colValues[item.id] ?? {})['all-mark-as'] ?? 'N/A';
            const label = markAsVal || 'N/A';
            const tip = isMeas ? `Optional for ${label} (Measurement)` : `Optional for ${label}`;
            optPills.push({ label, tip });
          }
          if (optPills.length === 0) return <td key={col.key} style={{ width: 100, padding: '0 8px', borderLeft: `0.5px solid ${T.border}`, textAlign: 'center' }}><span style={{ color: T.textMuted, fontSize: 12 }}>—</span></td>;
          const optTip = optPills.map(p => p.tip).join('\n');
          return (
            <td key={col.key} style={{ width: 100, padding: '0 8px', borderLeft: `0.5px solid ${T.border}`, textAlign: 'center' }}>
              {optPills.length === 1 ? (
                <Tooltip text={optPills[0].tip}>
                  <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 7px', borderRadius: 10, background: (optPills[0].label === 'N/A' || optPills[0].label === 'OOO') ? T.surface1 : pillBg, color: (optPills[0].label === 'N/A' || optPills[0].label === 'OOO') ? T.textSecondary : T.textAccent, whiteSpace: 'nowrap' }}>{optPills[0].label}</span>
                </Tooltip>
              ) : (
                <Tooltip text={optTip}>
                  <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 7px', borderRadius: 10, background: pillBg, color: T.textAccent, whiteSpace: 'nowrap' }}>{optPills.length} rules</span>
                </Tooltip>
              )}
            </td>
          );
        }
        if (col.key === 'ca-planned') {
          const markAsVal = (colValues[item.id] ?? {})['all-mark-as'] ?? 'N/A';
          const adHocPills: { label: string; na: boolean }[] = [];
          for (const r of item.caForYNRules ?? []) {
            if (r.adHoc) adHocPills.push({ label: r.condition ?? 'Result', na: false });
          }
          if (item.caForNAAdHoc) adHocPills.push({ label: markAsVal || 'N/A', na: true });
          if (adHocPills.length === 0) return <td key={col.key} style={{ width: 100, padding: '0 8px', borderLeft: `0.5px solid ${T.border}`, textAlign: 'center' }}><span style={{ color: T.textMuted, fontSize: 12 }}>—</span></td>;
          return (
            <td key={col.key} style={{ width: 100, padding: '0 8px', borderLeft: `0.5px solid ${T.border}`, textAlign: 'center' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 3 }}>
                {adHocPills.map(p => (
                  <Tooltip key={p.label} text={`Ad hoc for ${p.label}`}>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 7px', borderRadius: 10, background: p.na ? T.surface1 : pillBg, color: p.na ? T.textSecondary : T.textAccent, whiteSpace: 'nowrap' }}>{p.label}</span>
                  </Tooltip>
                ))}
              </div>
            </td>
          );
        }
        if (col.key === 'ca-trigger-yn') {
          if (item.type === 'mc') {
            const mcRules = (item.caForMCRules ?? []).filter(r => !!r.condition);
            if (mcRules.length === 0) return <td key={col.key} style={{ width: 100, padding: '0 8px', borderLeft: `0.5px solid ${T.border}`, textAlign: 'center' }}><span style={{ color: T.textMuted, fontSize: 12 }}>—</span></td>;
            const truncate = (label: string) => { const words = label.trim().split(/\s+/); return words.length <= 3 ? label : words.slice(0, 3).join(' ') + '…'; };
            const mcPills = mcRules.map(r => {
              const choice = (item.choices ?? []).find(c => c.id === r.condition);
              const fullName = choice?.label || r.condition || '(unnamed)';
              return { short: truncate(fullName), full: fullName };
            });
            const combinedTip = mcPills.map(p => p.full).join('\n');
            return (
              <td key={col.key} style={{ width: 120, padding: '0 8px', borderLeft: `0.5px solid ${T.border}`, textAlign: 'center' }}>
                {mcPills.length === 1 ? (
                  <Tooltip text={mcPills[0].full}>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 7px', borderRadius: 10, background: pillBg, color: T.textAccent, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'inline-block', maxWidth: '100%' }}>{mcPills[0].short}</span>
                  </Tooltip>
                ) : (
                  <Tooltip text={combinedTip}>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 7px', borderRadius: 10, background: pillBg, color: T.textAccent, whiteSpace: 'nowrap' }}>{mcPills.length} choices</span>
                  </Tooltip>
                )}
              </td>
            );
          }
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
        if (col.key === 'ca-trigger-ranges') {
          const rules = item.caForRangeRules ?? [];
          if (rules.length === 0) return <td key={col.key} style={{ width: 100, padding: '0 8px', borderLeft: `0.5px solid ${T.border}`, textAlign: 'center' }}><span style={{ color: T.textMuted, fontSize: 12 }}>—</span></td>;
          const rangePills = rules.map(r => {
            const rangeIdx = (item.measRanges ?? []).findIndex(x => x.id === r.rangeId);
            const range = item.measRanges?.[rangeIdx];
            const label = `R${rangeIdx + 1} ${r.condition ?? ''}`;
            const rangeDesc = range ? `Range ${rangeIdx + 1} (${range.min || 'Min'} – ${range.max || 'Max'})` : `Range ${rangeIdx + 1}`;
            const tip = `${r.condition ?? ''}: ${rangeDesc}`;
            const isInside = r.condition === 'Inside';
            return { label, tip, isInside };
          });
          const combinedTip = rangePills.map(p => p.tip).join('\n');
          return (
            <td key={col.key} style={{ width: 100, padding: '0 8px', borderLeft: `0.5px solid ${T.border}`, textAlign: 'center' }}>
              {rangePills.length === 1 ? (
                <Tooltip text={rangePills[0].tip}>
                  <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 7px', borderRadius: 10, background: rangePills[0].isInside ? '#E8F5E9' : '#FFF3E0', color: rangePills[0].isInside ? '#388E3C' : '#E65100' }}>{rangePills[0].label}</span>
                </Tooltip>
              ) : (
                <Tooltip text={combinedTip}>
                  <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 7px', borderRadius: 10, background: pillBg, color: T.textAccent, whiteSpace: 'nowrap' }}>{rangePills.length} ranges</span>
                </Tooltip>
              )}
            </td>
          );
        }
        if (col.key === 'ca-list' || col.key === 'ca-list-na') {
          const pillSpan = (name: string, tip: string) => (
            <Tooltip key={name} text={tip}>
              <span style={{ display: 'inline-block', maxWidth: 84, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 11, fontWeight: 500, padding: '2px 6px', borderRadius: 10, background: pillBg, color: T.textAccent, verticalAlign: 'middle' }}>{name}</span>
            </Tooltip>
          );
          if (col.key === 'ca-list') {
            const activeYNRules = (item.caForYNRules ?? []).filter(r => r.adHoc || !!r.caList);
            const activeRangeRules = (item.caForRangeRules ?? []).filter(r => r.adHoc || !!r.caList);
            const activeMCRules = (item.caForMCRules ?? []).filter(r => r.adHoc || !!r.caList);
            const rawPills: { name: string; tipLine: string }[] = [
              ...activeYNRules.map(r => {
                const name = r.adHoc ? 'Ad hoc' : (CA_LISTS.find(l => l.id === r.caList)?.title ?? r.caList ?? '');
                const tipLine = r.adHoc ? `Ad hoc for ${r.condition ?? 'Result'}` : `CA list for ${r.condition ?? 'Result'} — ${name}`;
                return { name, tipLine };
              }),
              ...activeRangeRules.map(r => {
                const name = r.adHoc ? 'Ad hoc' : (CA_LISTS.find(l => l.id === r.caList)?.title ?? r.caList ?? '');
                const rangeIdx = (item.measRanges ?? []).findIndex(x => x.id === r.rangeId);
                const range = item.measRanges?.[rangeIdx];
                const rangeLabel = range ? `R${rangeIdx + 1} (${range.min || 'Min'} – ${range.max || 'Max'})` : `R${rangeIdx + 1}`;
                const tipLine = r.adHoc ? `Ad hoc for ${rangeLabel}` : `CA list for ${rangeLabel} — ${name}`;
                return { name, tipLine };
              }),
              ...activeMCRules.map(r => {
                const name = r.adHoc ? 'Ad hoc' : (CA_LISTS.find(l => l.id === r.caList)?.title ?? r.caList ?? '');
                const choice = (item.choices ?? []).find(c => c.id === r.condition);
                const choiceLabel = choice?.label || r.condition || 'Choice';
                const tipLine = r.adHoc ? `Ad hoc for ${choiceLabel}` : `CA list for ${choiceLabel} — ${name}`;
                return { name, tipLine };
              }),
            ];
            // Group by display name, merging tooltip lines
            const grouped = new Map<string, string[]>();
            for (const p of rawPills) { if (!grouped.has(p.name)) grouped.set(p.name, []); grouped.get(p.name)!.push(p.tipLine); }
            const unique = Array.from(grouped.entries()).map(([name, lines]) => ({ name, tip: lines.join('\n') }));
            return (
              <td key={col.key} style={{ width: 100, padding: '0 8px', borderLeft: `0.5px solid ${T.border}`, textAlign: 'center' }}>
                {unique.length === 0 ? (
                  <span style={{ color: T.textMuted, fontSize: 12 }}>—</span>
                ) : unique.length === 1 ? (
                  pillSpan(unique[0].name, unique[0].tip)
                ) : (
                  pillSpan(`${unique.length} lists`, unique.map(p => p.tip).join('\n'))
                )}
              </td>
            );
          }
          // ca-list-na
          if (!item.caForNA) return <td key={col.key} style={{ width: 100, padding: '0 8px', borderLeft: `0.5px solid ${T.border}`, textAlign: 'center' }}><span style={{ color: T.textMuted, fontSize: 12 }}>—</span></td>;
          const naName = item.caForNAAdHoc ? 'Ad hoc' : (CA_LISTS.find(l => l.id === item.caForNAList)?.title ?? '');
          const naTip = item.caForNAAdHoc ? 'Ad hoc for N/A' : naName;
          return (
            <td key={col.key} style={{ width: 100, padding: '0 8px', borderLeft: `0.5px solid ${T.border}`, textAlign: 'center' }}>
              {naName ? pillSpan(naName, naTip) : <span style={{ color: T.textMuted, fontSize: 12 }}>—</span>}
            </td>
          );
        }
        if (col.key === 'yn-score-y') {
          return <PointsCell key={col.key} value={item.scoreYes} onCommit={v => onUpdate(item.id, { scoreYes: v })} allowNegative />;
        }
        if (col.key === 'yn-score-n') {
          return <PointsCell key={col.key} value={item.scoreNo} onCommit={v => onUpdate(item.id, { scoreNo: v })} allowNegative />;
        }
        if (col.key === 'yn-auto-complete') {
          return (
            <td key={col.key} style={{ width: 100, padding: '0 8px', borderLeft: `0.5px solid ${T.border}`, textAlign: 'center' }}>
              {item.autoComplete
                ? <i className="ti ti-bolt" style={{ fontSize: 15, color: T.textAccent }} title="Auto complete" />
                : <span style={{ color: T.textMuted, fontSize: 12 }}>—</span>}
            </td>
          );
        }
        if (col.key === 'yn-flags-yes' || col.key === 'yn-flags-no') {
          const ids = col.key === 'yn-flags-yes' ? (item.flagsForYes ?? []) : (item.flagsForNo ?? []);
          const names = ids.map(id => { const f = flags.find(x => x.id === id); return f ? `${f.emoji ? f.emoji + ' ' : ''}${f.name}` : id; });
          return (
            <td key={col.key} style={{ width: 120, padding: '0 8px', borderLeft: `0.5px solid ${T.border}`, textAlign: 'center' }}>
              {names.length === 0
                ? <span style={{ color: T.textMuted, fontSize: 12 }}>—</span>
                : names.length === 1
                  ? <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 7px', borderRadius: 10, background: pillBg, color: T.textAccent, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'inline-block', maxWidth: '100%' }} title={names[0]}>{names[0]}</span>
                  : <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 7px', borderRadius: 10, background: pillBg, color: T.textAccent, cursor: 'default' }} title={names.join('\n')}>{names.length} flags</span>
              }
            </td>
          );
        }
        if (col.key === 'all-print-label') {
          const ids = item.labelIds ?? [];
          const names = ids.map(id => LABEL_TEMPLATES.find(t => t.id === id)?.name ?? id);
          const pill = (content: React.ReactNode) => (
            <span style={{ display: 'inline-block', fontSize: 11, fontWeight: 600, padding: '2px 7px', borderRadius: 10, background: pillBg, color: T.textAccent, maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{content}</span>
          );
          return (
            <td key={col.key} style={{ width: 100, padding: '0 8px', borderLeft: `0.5px solid ${T.border}`, textAlign: 'center', overflow: 'hidden' }}>
              {names.length === 0
                ? <span style={{ color: T.textMuted, fontSize: 12 }}>—</span>
                : names.length === 1
                  ? <Tooltip text={names[0]}>{pill(names[0])}</Tooltip>
                  : <Tooltip text={names.join('\n')}>{pill(`${names.length} labels`)}</Tooltip>
              }
            </td>
          );
        }
        if (col.key === 'all-tag-location') {
          const tags = item.locationTags ?? [];
          return <LocationTagCell key={col.key} tags={tags} isActive={isActive} />;
        }
        if (col.key === 'all-tag-scoring') {
          return (
            <td key={col.key} style={{ width: 100, padding: '0 8px', borderLeft: `0.5px solid ${T.border}`, textAlign: 'center', overflow: 'hidden' }}>
              {item.scoreGroup ? (
                <Tooltip text={item.scoreGroup}><span style={{ fontSize: 11, fontWeight: 500, color: T.textAccent, background: pillBg, padding: '2px 7px', borderRadius: 10, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block', maxWidth: '100%' }}>
                  {item.scoreGroup}
                </span></Tooltip>
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
          const s = item.importance ? (IMP_COLORS[item.importance] ?? { bg: pillBg, color: T.textAccent }) : null;
          return (
            <td key={col.key} style={{ width: 100, padding: '0 8px', borderLeft: `0.5px solid ${T.border}`, textAlign: 'center' }}>
              {s ? (
                <Tooltip text={item.importance!}><span style={{ fontSize: 11, fontWeight: 600, padding: '2px 7px', borderRadius: 10, background: s.bg, color: s.color, whiteSpace: 'nowrap' }}>
                  {item.importance}
                </span></Tooltip>
              ) : (
                <span style={{ color: T.textMuted, fontSize: 12 }}>—</span>
              )}
            </td>
          );
        }
        if (col.key === 'm-saved-value') {
          const on = !!item.savedValue;
          return (
            <td key={col.key} style={{ width: 100, padding: '0 8px', borderLeft: `0.5px solid ${T.border}`, textAlign: 'center', cursor: 'pointer' }}
              onClick={e => { e.stopPropagation(); onUpdate(item.id, { savedValue: !on }); }}>
              <i className={`ti ${on ? 'ti-checkbox' : 'ti-square'}`} style={{ fontSize: 15, color: on ? T.textAccent : T.textMuted }} />
            </td>
          );
        }
        if (col.key === 'm-type') {
          const MEAS_LABELS: Record<string, string> = { temperature: 'Temperature', weight: 'Weight', ph: 'pH', other: 'Other' };
          const label = MEAS_LABELS[item.measType ?? ''] ?? item.measType ?? '';
          return (
            <td key={col.key} style={{ width: 100, padding: '0 8px', borderLeft: `0.5px solid ${T.border}`, textAlign: 'center' }}>
              {label ? <Tooltip text={label}><span style={{ fontSize: 11, fontWeight: 600, padding: '2px 7px', borderRadius: 10, background: T.surface0, color: T.textSecondary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'inline-block', maxWidth: '100%' }}>{label}</span></Tooltip> : <span style={{ color: T.textMuted, fontSize: 12 }}>—</span>}
            </td>
          );
        }
        if (col.key === 'm-unit') {
          const u = item.measUnit ?? '';
          return (
            <td key={col.key} style={{ width: 100, padding: '0 8px', borderLeft: `0.5px solid ${T.border}`, textAlign: 'center' }}>
              {u ? <Tooltip text={u}><span style={{ fontSize: 11, fontWeight: 600, padding: '2px 7px', borderRadius: 10, background: T.surface0, color: T.textSecondary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'inline-block', maxWidth: '100%' }}>{u}</span></Tooltip> : <span style={{ color: T.textMuted, fontSize: 12 }}>—</span>}
            </td>
          );
        }
        if (col.key === 'm-method') {
          const methods = item.measMethods ?? [];
          if (methods.length === 0) return <td key={col.key} style={{ width: 100, padding: '0 8px', borderLeft: `0.5px solid ${T.border}`, textAlign: 'center' }}><span style={{ color: T.textMuted, fontSize: 12 }}>—</span></td>;
          const label = methods.length === 1 ? methods[0] : `${methods.length} methods`;
          return (
            <td key={col.key} style={{ width: 100, padding: '0 8px', borderLeft: `0.5px solid ${T.border}`, textAlign: 'center', overflow: 'hidden' }}>
              <Tooltip text={methods.join(', ')}><span style={{ fontSize: 11, fontWeight: 500, padding: '2px 6px', borderRadius: 10, background: T.surface0, color: T.textSecondary, display: 'inline-block', maxWidth: 84, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>
                {label}
              </span></Tooltip>
            </td>
          );
        }
        if (col.key === 'm-sensor-name') {
          const sensor = MOCK_SENSORS.find(s => s.id === item.measSensorId);
          return (
            <td key={col.key} style={{ width: 100, padding: '0 8px', borderLeft: `0.5px solid ${T.border}`, textAlign: 'center', overflow: 'hidden' }}>
              {sensor ? <Tooltip text={sensor.name}><span style={{ fontSize: 11, fontWeight: 500, color: T.textSecondary, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sensor.name}</span></Tooltip> : <span style={{ color: T.textMuted, fontSize: 12 }}>—</span>}
            </td>
          );
        }
        if (col.key.startsWith('m-range')) {
          const match = col.key.match(/m-range(\d)-(min|max)/);
          if (match) {
            const idx = parseInt(match[1]) - 1;
            const side = match[2] as 'min' | 'max';
            const rangeExists = (item.measRanges?.length ?? 0) > idx;
            const val = item.measRanges?.[idx]?.[side] ?? '';
            const openLabel = side === 'min' ? 'Min' : 'Max';
            return (
              <td key={col.key} style={{ width: 100, padding: '0 8px', borderLeft: `0.5px solid ${T.border}`, textAlign: 'center' }}>
                {!rangeExists
                  ? <span style={{ color: T.textMuted, fontSize: 12 }}>—</span>
                  : val
                    ? <span style={{ fontSize: 12, fontWeight: 500, color: T.textPrimary }}>{val}</span>
                    : <span style={{ fontSize: 11, fontWeight: 500, color: T.textMuted, fontStyle: 'italic' }}>{openLabel}</span>
                }
              </td>
            );
          }
        }
        if (col.key.startsWith('m-flag-r') || col.key.startsWith('m-color-r')) {
          const match = col.key.match(/m-(flag|color)-r(\d)/);
          if (match) {
            const kind = match[1] as 'flag' | 'color';
            const idx = parseInt(match[2]) - 1;
            const range = item.measRanges?.[idx];
            const rule = range ? (item.measFlagRules ?? []).find(r => r.rangeId === range.id) : undefined;
            const rangeLabel = range ? `R${idx + 1} (${range.min || 'Min'} – ${range.max || 'Max'})` : '';
            if (kind === 'flag') {
              // All rules for this range (there can be multiple, each with a condition and multiple flags)
              const rangeRules = range ? (item.measFlagRules ?? []).filter(r => r.rangeId === range.id) : [];
              const toFlagName = (id: string) => { const f = flags.find(x => x.id === id); return f ? `${f.emoji ? f.emoji + ' ' : ''}${f.name}` : id; };
              // Build flat list of all flags across all rules, with their condition for tooltip
              const allEntries: { name: string; condition: string }[] = [];
              for (const r of rangeRules) {
                const ids = r.flagIds ?? (r.flagId ? [r.flagId] : []);
                for (const id of ids) allEntries.push({ name: toFlagName(id), condition: r.condition });
              }
              // Tooltip: group by condition — "Inside: Flag A, Flag B\nOutside: Flag C"
              const byCondition = new Map<string, string[]>();
              for (const e of allEntries) { if (!byCondition.has(e.condition)) byCondition.set(e.condition, []); byCondition.get(e.condition)!.push(e.name); }
              const tip = Array.from(byCondition.entries()).map(([cond, names]) => `${cond}: ${names.join(', ')}`).join('\n');
              const totalCount = allEntries.length;
              return (
                <td key={col.key} style={{ width: 120, padding: '0 8px', borderLeft: `0.5px solid ${T.border}`, textAlign: 'center' }}>
                  {totalCount === 0 ? (
                    <span style={{ color: T.textMuted, fontSize: 12 }}>—</span>
                  ) : totalCount === 1 ? (
                    <Tooltip text={tip}><span style={{ fontSize: 11, fontWeight: 600, padding: '2px 7px', borderRadius: 10, background: pillBg, color: T.textAccent, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'inline-block', maxWidth: '100%' }}>{allEntries[0].name}</span></Tooltip>
                  ) : (
                    <Tooltip text={tip}><span style={{ fontSize: 11, fontWeight: 600, padding: '2px 7px', borderRadius: 10, background: pillBg, color: T.textAccent, whiteSpace: 'nowrap' }}>{totalCount} flags</span></Tooltip>
                  )}
                </td>
              );
            } else {
              // All rules for this range — collect distinct colors with their condition
              const colorRules = range ? (item.measFlagRules ?? []).filter(r => r.rangeId === range.id && !!r.recordColor) : [];
              const colorEntries = colorRules.map(r => ({ color: r.recordColor, condition: r.condition }));
              const colorTip = colorEntries.map(e => `${e.condition}: ${e.color}`).join('\n');
              return (
                <td key={col.key} style={{ width: 80, padding: '0 8px', borderLeft: `0.5px solid ${T.border}`, textAlign: 'center' }}>
                  {colorEntries.length === 0 ? (
                    <span style={{ color: T.textMuted, fontSize: 12 }}>—</span>
                  ) : colorEntries.length === 1 ? (
                    <Tooltip text={`${colorEntries[0].condition}: ${colorEntries[0].color}`}><span style={{ display: 'inline-block', width: 18, height: 18, borderRadius: 4, background: colorEntries[0].color, border: `0.5px solid ${T.borderStrong}`, verticalAlign: 'middle' }} /></Tooltip>
                  ) : (
                    <Tooltip text={colorTip}>
                      <span style={{ display: 'inline-flex', gap: 3, alignItems: 'center' }}>
                        {colorEntries.map((e, i) => (
                          <span key={i} style={{ display: 'inline-block', width: 14, height: 14, borderRadius: 3, background: e.color, border: `0.5px solid ${T.borderStrong}` }} />
                        ))}
                      </span>
                    </Tooltip>
                  )}
                </td>
              );
            }
          }
        }
        if (col.key === 'mc-multi-select') {
          const on = !!item.mcMultiSelect;
          return (
            <td key={col.key} style={{ width: 100, padding: '0 8px', borderLeft: `0.5px solid ${T.border}`, textAlign: 'center', cursor: 'pointer' }}
              onClick={e => { e.stopPropagation(); onUpdate(item.id, { mcMultiSelect: !on }); }}>
              <i className={`ti ${on ? 'ti-checkbox' : 'ti-square'}`} style={{ fontSize: 15, color: on ? T.textAccent : T.textMuted }} />
            </td>
          );
        }
        if (col.key === 'mc-show-inline') {
          const on = !!item.mcShowInline;
          return (
            <td key={col.key} style={{ width: 100, padding: '0 8px', borderLeft: `0.5px solid ${T.border}`, textAlign: 'center', cursor: 'pointer' }}
              onClick={e => { e.stopPropagation(); onUpdate(item.id, { mcShowInline: !on }); }}>
              <i className={`ti ${on ? 'ti-checkbox' : 'ti-square'}`} style={{ fontSize: 15, color: on ? T.textAccent : T.textMuted }} />
            </td>
          );
        }
        if (col.key === 'rating-range') {
          const min = item.ratingMin ?? 1;
          const max = item.ratingMax ?? 5;
          return (
            <td key={col.key} style={{ width: 100, padding: '0 8px', borderLeft: `0.5px solid ${T.border}`, textAlign: 'center' }}>
              <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 7px', borderRadius: 10, background: pillBg, color: T.textAccent }}>
                {min} – {max}
              </span>
            </td>
          );
        }
        if (col.key === 'photo-allow-upload') {
          const on = !!item.photoAllowUpload;
          return (
            <td key={col.key} style={{ width: 100, padding: '0 8px', borderLeft: `0.5px solid ${T.border}`, textAlign: 'center', cursor: 'pointer' }}
              onClick={e => { e.stopPropagation(); onUpdate(item.id, { photoAllowUpload: !on }); }}>
              <i className={`ti ${on ? 'ti-checkbox' : 'ti-square'}`} style={{ fontSize: 15, color: on ? T.textAccent : T.textMuted }} />
            </td>
          );
        }
        if (col.key === 'employee-roles') {
          const roles = item.employeeRoles ?? [];
          if (roles.length === 0) return <td key={col.key} style={{ width: 100, padding: '0 8px', borderLeft: `0.5px solid ${T.border}`, textAlign: 'center' }}><span style={{ color: T.textMuted, fontSize: 12 }}>—</span></td>;
          const label = roles.length === 1 ? roles[0] : `${roles.length} roles`;
          const tip = roles.length > 1 ? roles.join('\n') : roles[0];
          return (
            <td key={col.key} style={{ width: 100, padding: '0 8px', borderLeft: `0.5px solid ${T.border}`, textAlign: 'center', overflow: 'hidden' }}>
              <Tooltip text={tip}><span style={{ fontSize: 11, fontWeight: 600, padding: '2px 7px', borderRadius: 10, background: pillBg, color: T.textAccent, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'inline-block', maxWidth: '100%' }}>{label}</span></Tooltip>
            </td>
          );
        }
        if (col.key === 'qr-target' || col.key === 'barcode-target') {
          const val = col.key === 'qr-target' ? item.qrTarget : item.barcodeTarget;
          if (!val) return <td key={col.key} style={{ width: 100, padding: '0 8px', borderLeft: `0.5px solid ${T.border}`, textAlign: 'center' }}><span style={{ color: T.textMuted, fontSize: 12 }}>—</span></td>;
          return (
            <td key={col.key} style={{ width: 100, padding: '0 8px', borderLeft: `0.5px solid ${T.border}`, textAlign: 'center', overflow: 'hidden' }}>
              <Tooltip text={val}><span style={{ fontSize: 11, fontWeight: 600, padding: '2px 7px', borderRadius: 10, background: T.surface0, color: T.textSecondary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'inline-block', maxWidth: '100%' }}>{val}</span></Tooltip>
            </td>
          );
        }
        if (col.key === 'formula-type') {
          const t = item.formulaType ?? 'number';
          const label = t === 'number' ? 'Number' : t === 'date' ? 'Date' : 'Text';
          const expr = item.formulaExpr ?? '';
          const tip = expr ? `Formula: ${expr}` : 'No formula defined';
          return (
            <td key={col.key} style={{ width: 100, padding: '0 8px', borderLeft: `0.5px solid ${T.border}`, textAlign: 'center' }}>
              <Tooltip text={tip}>
                <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 7px', borderRadius: 10, background: T.surface0, color: T.textSecondary, whiteSpace: 'nowrap' }}>
                  {label}
                </span>
              </Tooltip>
            </td>
          );
        }
        if (col.key === 'asset-type') {
          const t = item.assetType ?? 'Inspection Type';
          return (
            <td key={col.key} style={{ width: 100, padding: '0 8px', borderLeft: `0.5px solid ${T.border}`, textAlign: 'center', overflow: 'hidden' }}>
              <Tooltip text={t}><span style={{ fontSize: 11, fontWeight: 600, padding: '2px 7px', borderRadius: 10, background: T.surface0, color: T.textSecondary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'inline-block', maxWidth: '100%' }}>{t}</span></Tooltip>
            </td>
          );
        }
        if (col.key === 'asset-filter-user') {
          const on = !!item.assetFilterByUser;
          return (
            <td key={col.key} style={{ width: 100, padding: '0 8px', borderLeft: `0.5px solid ${T.border}`, textAlign: 'center', cursor: 'pointer' }}
              onClick={e => { e.stopPropagation(); onUpdate(item.id, { assetFilterByUser: !on }); }}>
              <i className={`ti ${on ? 'ti-checkbox' : 'ti-square'}`} style={{ fontSize: 15, color: on ? T.textAccent : T.textMuted }} />
            </td>
          );
        }
        if (col.key === 'sublist-target') {
          const listName = CA_LISTS.find(l => l.id === item.sublistTarget)?.title ?? '';
          if (!listName) return <td key={col.key} style={{ width: 100, padding: '0 8px', borderLeft: `0.5px solid ${T.border}`, textAlign: 'center' }}><span style={{ color: T.textMuted, fontSize: 12 }}>—</span></td>;
          return (
            <td key={col.key} style={{ width: 100, padding: '0 8px', borderLeft: `0.5px solid ${T.border}`, textAlign: 'center', overflow: 'hidden' }}>
              <Tooltip text={listName}><span style={{ fontSize: 11, fontWeight: 500, padding: '2px 6px', borderRadius: 10, background: pillBg, color: T.textAccent, display: 'inline-block', maxWidth: 84, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>
                {listName}
              </span></Tooltip>
            </td>
          );
        }
        return (
          <td key={col.key} style={{ width: 100, padding: '0 12px', borderLeft: `0.5px solid ${T.border}`, textAlign: 'center', color: T.textMuted, fontSize: 12 }}>
            —
          </td>
        );
      })}
      {/* Kebab — sticky right */}
      <td style={{ width: 32, padding: '0 4px', position: 'sticky', right: 0, zIndex: 1, background: stickyBg, borderLeft: hovered || isActive ? `0.5px solid ${T.border}` : `0.5px solid ${stickyBg}` }}>
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
  const [scoringOn, setScoringOn] = useState(false);
  const [flags, setFlags] = useState<Flag[]>(INITIAL_FLAGS);
  const handleCreateFlag = (flag: Flag) => setFlags(prev => [...prev, flag]);
  const [caToastId, setCaToastId] = useState<string | null>(null);
  const [items, setItems] = useState<ListItem[]>(INITIAL_ITEMS);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const [lastActiveItemId, setLastActiveItemId] = useState<string | null>(null);
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
    'yn-score-y', 'yn-score-n',
  ]));
  const effectiveShownCols = React.useMemo(() => {
    if (scoringOn) return shownCols;
    const next = new Set(shownCols);
    next.delete('yn-score-y');
    next.delete('yn-score-n');
    return next;
  }, [shownCols, scoringOn]);

  // Auto-on columns for existing data when an item is first opened
  useEffect(() => {
    if (!activeItemId) return;
    const item = items.find(i => i.id === activeItemId);
    if (!item) return;
    setShownCols(prev => {
      const next = new Set(prev);
      for (const col of ALL_COLS) {
        if (col.defaultOn) continue;
        if (!next.has(col.key) && col.detect(item)) next.add(col.key);
      }
      return next;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeItemId]);
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
  const totalItems = items.length;

  function updateItem(id: string, updates: Partial<ListItem>) {
    setItems(prev => prev.map(it => it.id === id ? { ...it, ...updates } : it));
    const current = items.find(it => it.id === id);
    if (!current) return;
    const merged = { ...current, ...updates };
    // Auto-on only — columns are never auto-removed on update, only on item delete
    setShownCols(prev => {
      const next = new Set(prev);
      for (const col of ALL_COLS) {
        if (col.defaultOn) continue;
        if (!next.has(col.key) && col.detect(merged)) next.add(col.key);
      }
      return next;
    });
  }

  function deleteItem(id: string) {
    const remainingItems = items.filter(it => it.id !== id);
    setItems(prev => prev.filter(it => it.id !== id).map(it => it.dcParentId === id ? { ...it, dcParentId: undefined, dcCondition: undefined } : it));
    setShownCols(prev => {
      const next = new Set(prev);
      for (const col of ALL_COLS) {
        if (col.defaultOn) continue;
        if (next.has(col.key) && !remainingItems.some(it => col.detect(it))) next.delete(col.key);
      }
      return next;
    });
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
      ...(type === 'formula' ? { formulaType: 'number' as const, formulaVars: [{ name: 'A', itemId: '' }], formulaExpr: '' } : {}),
      ...(type === 'measurement' ? { measType: 'temperature', measUnit: 'F', measMethods: ['Manual Input'] } : {}),
    };
    // Insert after active item, last active item, or at end of list
    const insertAfterId = activeItemId ?? lastActiveItemId;
    setItems(prev => {
      if (insertAfterId) {
        const idx = prev.findIndex(it => it.id === insertAfterId);
        if (idx !== -1) {
          const next = [...prev];
          next.splice(idx + 1, 0, newItem);
          return next;
        }
      }
      return [...prev, newItem];
    });
    setShowAddPopover(false);
    setLastActiveItemId(null);
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
        <div style={{ marginLeft: 'auto', alignSelf: 'center', display: 'flex', gap: 6 }}>
          <Btn onClick={() => { setDcMode(v => !v); setDcLinkingId(null); setDcConditionState(null); }} style={dcMode ? { background: '#FFF8E1', color: '#5D4037', borderColor: '#FFD54F' } : {}}>
            <i className="ti ti-filter" /> {dcMode ? 'Exit display criteria' : 'Display criteria'}
          </Btn>
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
                    <ItemsTable items={items} selectedIds={selectedIds} activeItemId={activeItemId} lastActiveItemId={lastActiveItemId} cutIds={cutIds} dcMode={dcMode} dcLinkingId={dcLinkingId} dcColors={dcColors} kebabOpenId={kebabOpenId} editingRowId={editingRowId} editingPrompt={editingPrompt} editInputRef={editInputRef} shownCols={effectiveShownCols} colValues={colValues} onColChange={setColValue} onUpdate={updateItem}
                      onCheckbox={id => setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; })}
                      onRowClick={id => { setLastActiveItemId(null); setActiveItemId(prev => prev === id ? null : id); setKebabOpenId(null); }}
                      onKebab={id => setKebabOpenId(prev => prev === id ? null : id)}
                      onKebabClose={() => setKebabOpenId(null)}
                      onKebabAction={handleKebabAction}
                      onDCClick={handleDCClick}
                      onEditChange={setEditingPrompt}
                      onEditCommit={commitEdit}
                      flags={flags} caToastId={caToastId} onCaToast={setCaToastId}
                    />
                  </div>
                  <DCConditionPanel childItem={conditionChildItem} parentItem={conditionParentItem} onSave={saveDCCondition} onCancel={() => setDcConditionState(null)} />
                </div>
              ) : (
                <ItemsTable items={items} selectedIds={selectedIds} activeItemId={activeItemId} lastActiveItemId={lastActiveItemId} cutIds={cutIds} dcMode={dcMode} dcLinkingId={dcLinkingId} dcColors={dcColors} kebabOpenId={kebabOpenId} editingRowId={editingRowId} editingPrompt={editingPrompt} editInputRef={editInputRef} shownCols={effectiveShownCols} colValues={colValues} onColChange={setColValue} onUpdate={updateItem}
                  onCheckbox={id => setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; })}
                  onRowClick={id => { setLastActiveItemId(null); setActiveItemId(prev => prev === id ? null : id); setKebabOpenId(null); }}
                  onKebab={id => setKebabOpenId(prev => prev === id ? null : id)}
                  onKebabClose={() => setKebabOpenId(null)}
                  onKebabAction={handleKebabAction}
                  onDCClick={handleDCClick}
                  onEditChange={setEditingPrompt}
                  onEditCommit={commitEdit}
                  flags={flags} caToastId={caToastId} onCaToast={setCaToastId}
                />
              )}
            </div>
          </div>

          {/* Side sheet */}
          {activeItemId && !dcMode && (() => {
            const item = findItem(items, activeItemId);
            return item ? <SideSheet key={activeItemId} item={item} items={items} onClose={() => { setLastActiveItemId(activeItemId); setActiveItemId(null); }} onNavigate={id => setActiveItemId(id)} onUpdate={updateItem} markAs={(colValues[item.id] ?? {})['all-mark-as'] ?? null} onMarkAsChange={v => setColValue(item.id, 'all-mark-as', v)} scoringOn={scoringOn} flags={flags} onCreateFlag={handleCreateFlag} /> : null;
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
  lastActiveItemId: string | null;
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
  flags: Flag[];
  caToastId: string | null;
  onCaToast: (key: string | null) => void;
}

function ItemsTable({ items, selectedIds, activeItemId, lastActiveItemId, cutIds, dcMode, dcLinkingId, dcColors, kebabOpenId, editingRowId, editingPrompt, editInputRef, shownCols, colValues, onColChange, onUpdate, onCheckbox, onRowClick, onKebab, onKebabClose, onKebabAction, onDCClick, onEditChange, onEditCommit, flags, caToastId, onCaToast }: ItemsTableProps) {
  const activeCols = ALL_COLS.filter(c => shownCols.has(c.key));
  const totalCols = 7 + activeCols.length; // drag+checkbox+stripe+prompt+type+indicators+kebab + optional cols
  const [promptWidth, setPromptWidth] = useState(300);
  // Cumulative left offsets for sticky columns: drag=0, checkbox=28, stripe=58, prompt=62, type=62+promptWidth
  const S = { drag: 0, checkbox: 28, stripe: 58, prompt: 62, type: 62 + promptWidth };
  const stickyHead = (left: number, extra?: React.CSSProperties): React.CSSProperties => ({
    position: 'sticky', left, zIndex: 12, background: T.surface1, ...extra,
  });
  // When optional cols are active, pin the prompt at promptWidth and let the table grow past the
  // container so horizontal scrolling kicks in. Without cols, fill the container normally.
  const hasCols = activeCols.length > 0;
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
            const colGroup = new Map<string, string>();
            for (const g of COLUMN_GROUPS) for (const c of g.cols) colGroup.set(c.key, g.group);
            const segments: { group: string; count: number }[] = [];
            for (const col of activeCols) {
              const group = colGroup.get(col.key) ?? 'All';
              if (segments.length && segments[segments.length - 1].group === group) segments[segments.length - 1].count++;
              else segments.push({ group, count: 1 });
            }
            const GROUP_LABEL: Record<string, string> = {
              'All': 'General', 'Y/N': 'Y/N', 'M — Measurement': 'Measurement',
              'MC — Multiple Choice': 'Multiple Choice', 'CA — Corrective Action': 'Corrective Action',
              'Rating': 'Rating', 'Photo': 'Photo', 'Employee': 'Employee',
              'QR / Barcode': 'QR / Barcode', 'Formula': 'Formula', 'Asset': 'Asset', 'Sublist': 'Sublist',
            };
            return (
              <tr style={{ background: T.surface1, height: 20 }}>
                <th style={{ ...stickyHead(S.drag, { width: 28, padding: 0 }) }} />
                <th style={{ ...stickyHead(S.checkbox, { width: 30, padding: 0 }) }} />
                <th style={{ ...stickyHead(S.stripe, { width: 4, padding: 0 }) }} />
                <th style={{ ...stickyHead(S.prompt, { padding: 0 }) }}>
                  <div style={{ position: 'absolute', top: 0, right: 0, width: 1, height: '100%', background: T.borderStrong, zIndex: 1 }} />
                </th>
                <th style={{ ...stickyHead(S.type, { width: 32, padding: 0, borderLeft: `0.5px solid ${T.borderStrong}`, borderBottom: `0.5px solid ${T.borderStrong}` }) }} />
                <th style={{ width: 88, padding: 0, borderBottom: `0.5px solid ${T.borderStrong}` }} />
                {segments.map((seg, i) => {
                  const bg = i % 2 === 0 ? T.surface1 : T.surface0;
                  return (
                    <th key={i} colSpan={seg.count} style={{
                      padding: '0 8px', textAlign: 'center', fontSize: 9, fontWeight: 700,
                      letterSpacing: '0.07em', textTransform: 'uppercase',
                      background: bg, color: T.textMuted,
                      borderLeft: `0.5px solid ${T.borderStrong}`,
                      borderRight: `0.5px solid ${T.borderStrong}`,
                      borderBottom: `0.5px solid ${T.borderStrong}`,
                    }}>
                      {GROUP_LABEL[seg.group] ?? seg.group}
                    </th>
                  );
                })}
                <th style={{ position: 'sticky', right: 0, zIndex: 12, background: T.surface1, width: 32, padding: 0, borderBottom: `0.5px solid ${T.borderStrong}` }} />
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
            <th style={stickyHead(S.type, { width: 32, borderLeft: `0.5px solid ${T.borderStrong}` })} />
            <th style={{ width: 88, padding: '5px 8px', borderLeft: `0.5px solid ${T.border}`, borderTop: `0.5px solid ${T.border}`, fontSize: 10, fontWeight: 600, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', verticalAlign: 'middle' }}>Config</th>
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
            <th style={{ position: 'sticky', right: 0, zIndex: 12, background: T.surface1, width: 32 }} />
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
            <ItemRow key={item.id} item={item} items={items} isSelected={selectedIds.has(item.id)} anySelected={selectedIds.size > 0} isActive={activeItemId === item.id || (!activeItemId && lastActiveItemId === item.id)} isCut={cutIds.has(item.id)} dcMode={dcMode} dcLinkingId={dcLinkingId} dcColors={dcColors} kebabOpenId={kebabOpenId} shownCols={shownCols} promptWidth={promptWidth} colValues={colValues} onColChange={onColChange} onUpdate={onUpdate} onCheckbox={onCheckbox} onRowClick={onRowClick} onKebab={onKebab} onKebabClose={onKebabClose} onKebabAction={onKebabAction} onDCClick={onDCClick} flags={flags} caToastId={caToastId} onCaToast={onCaToast} />
          )
        ))}
      </tbody>
    </table>
  );
}
