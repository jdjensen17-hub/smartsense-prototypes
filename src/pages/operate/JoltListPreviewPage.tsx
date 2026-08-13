import React, { useState, useEffect, useMemo } from 'react';
import { evaluate as mathEval } from 'mathjs';

// ── Design tokens ─────────────────────────────────────────────────────────
const APP_BLUE = '#2979C7';
const APP_PURPLE = '#7B4FA6';
const SURFACE_0 = '#F0F0F2';
const SURFACE_1 = '#F7F7FA';
const BORDER = 'rgba(26,26,31,0.12)';
const TEXT_PRIMARY = '#1A1A1F';
const TEXT_SECONDARY = '#5C5C6E';
const TEXT_MUTED = '#9898A8';
const FONT = "'Inter', -apple-system, sans-serif";

const ASSIGN_NAMES = ['Sarah Johnson', 'Mike Chen', 'Alex Rivera', 'Dana Kim'];

// Returns a darkened version of a hex color for use as text/border on light backgrounds
function darkenColor(hex: string, amount = 0.45): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const dr = Math.round(r * (1 - amount));
  const dg = Math.round(g * (1 - amount));
  const db = Math.round(b * (1 - amount));
  return `rgb(${dr},${dg},${db})`;
}
// Returns perceived luminance (0=dark, 1=light)
function luminance(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function choiceTextColor(hex: string): string {
  return luminance(hex) > 0.4 ? darkenColor(hex) : hex;
}

// ── Types — mirror editor exactly ─────────────────────────────────────────
type ItemType = 'yn' | 'checkmark' | 'rating' | 'signature' | 'mc' | 'short' | 'free' |
  'measurement' | 'number' | 'photo' | 'qr' | 'employee' | 'date' | 'datetime' | 'time' |
  'stopwatch' | 'subtitle' | 'text' | 'barcode' | 'sublist' | 'formula' | 'asset' | 'email';

type DCConditionYN      = { type: 'yn'; value: 'Yes' | 'No' };
type DCConditionNumeric = { type: 'numeric'; op: '>' | '>=' | '=' | '<=' | '<'; value: number };
type DCConditionMC      = { type: 'mc'; choiceId: string; choiceLabel: string };
type DCCondition = DCConditionYN | DCConditionNumeric | DCConditionMC;

interface MCChoice { id: string; label: string; color: string; icon: string | null; flagIds?: string[]; }
interface CARule { id: string; condition?: string; rangeId?: string; caList: string; adHoc: boolean; nextStep: 'repeat-item' | 'repeat-list' | 'no-repeat'; optional?: boolean; }
interface Flag { id: string; name: string; color: string; emoji: string; showOnApp?: boolean; }
interface MeasRange { id: string; min: string; max: string; }
interface MeasFlagRule { id: string; condition: string; rangeId: string; flagId: string; flagIds?: string[]; }

interface PreviewItem {
  id: string;
  prompt: string;
  type: ItemType;
  stripe: string;
  allowNA: boolean;
  allowOOO?: boolean;
  assignable?: boolean;
  dcParentId?: string;
  dcConditions?: DCCondition[];
  choices?: MCChoice[];
  mcMultiSelect?: boolean;
  mcShowInline?: boolean;
  caForYNRules?: CARule[];
  caForMCRules?: CARule[];
  caForRangeRules?: CARule[];
  flagsForNo?: string[];
  flagsForYes?: string[];
  measRanges?: MeasRange[];
  measFlagRules?: MeasFlagRule[];
  points?: number;
  ratingMin?: number;
  ratingMax?: number;
  infoFile?: string;
  infoInline?: boolean;
  labelPrint?: boolean;
  photoAllowUpload?: boolean;
  labelIds?: string[];
  measUnit?: string;
  measSensorId?: string;
  subItems?: PreviewItem[];
}

type ItemAnswer = string | number | boolean | null;

// ── Fallback data ─────────────────────────────────────────────────────────
const FALLBACK_FLAGS: Flag[] = [
  { id: 'f1', name: 'Health & Safety', color: '#EF5350', emoji: '⚠️' },
  { id: 'f2', name: 'Equipment',       color: '#FF7043', emoji: '🔧' },
  { id: 'f3', name: 'Food Safety',     color: '#42A5F5', emoji: '🍽️' },
];

const FALLBACK_ITEMS: PreviewItem[] = [
  { id: 'cooler-ok', prompt: 'Walk-in cooler temp OK?', type: 'yn', stripe: '#5CA6D9', allowNA: false, assignable: true,
    caForYNRules: [{ id: 'r1', condition: 'No', caList: 'Corrective Actions', adHoc: false, nextStep: 'repeat-item' }],
    flagsForNo: ['f1'], points: 25 },
  { id: 'ca-photo', prompt: 'Take corrective action photo', type: 'photo', stripe: '', allowNA: true,
    dcParentId: 'cooler-ok', dcConditions: [{ type: 'yn', value: 'No' }] },
  { id: 'sign-off', prompt: 'Sign off opening inspection', type: 'signature', stripe: '', allowNA: false, infoFile: 'Opening Procedures.pdf' },
  { id: 'prep-temp', prompt: 'Record prep cooler temp', type: 'measurement', stripe: '#C1E1C5', allowNA: true, allowOOO: true, points: 25, measUnit: '°F',
    measRanges: [{ id: 'r1', min: '33', max: '40' }],
    measFlagRules: [{ id: 'mr1', condition: 'Outside', rangeId: 'r1', flagId: 'f3', flagIds: ['f3'] }] },
  { id: 'ca-notes', prompt: 'Log corrective action notes', type: 'free', stripe: '', allowNA: false,
    dcParentId: 'prep-temp', dcConditions: [{ type: 'numeric', op: '>=', value: 41 }] },
  { id: 'date-labels', prompt: 'All date labels current', type: 'checkmark', stripe: '', allowNA: false, infoFile: 'Date Label Policy.pdf', infoInline: true, labelPrint: true },
  { id: 'handwashing', prompt: 'Handwashing stations stocked', type: 'yn', stripe: '', allowNA: true, allowOOO: true, points: 10,
    caForYNRules: [{ id: 'r2', condition: 'No', caList: 'Corrective Actions', adHoc: false, nextStep: 'no-repeat' }] },
  { id: 'vendor-mc', prompt: 'Preferred vendor for shortfall?', type: 'mc', stripe: '', allowNA: false, mcShowInline: false, mcMultiSelect: false, choices: [
    { id: 'c1', label: 'Sysco',                  color: '#4CAF50', icon: null },
    { id: 'c2', label: 'US Foods',               color: '#2196F3', icon: null },
    { id: 'c3', label: 'Performance Food Group', color: '#FF9800', icon: null },
  ]},
  { id: 'issues-mc', prompt: 'Issues found during opening?', type: 'mc', stripe: '', allowNA: false, mcShowInline: true, mcMultiSelect: true, choices: [
    { id: 'i1', label: 'Equipment not working',  color: '#E53935', icon: null, flagIds: ['f2'] },
    { id: 'i2', label: 'Cleanliness issue',      color: '#FB8C00', icon: null, flagIds: ['f3'] },
    { id: 'i3', label: 'Supply shortage',        color: '#8E24AA', icon: null },
    { id: 'i4', label: 'No issues',              color: '#43A047', icon: null },
  ]},
  { id: 'temp-checks', prompt: 'Temperature Checks', type: 'sublist', stripe: '#E8D0F0', allowNA: false, points: 20,
    subItems: [
      { id: 'sub-freezer', prompt: 'Walk-in freezer temp', type: 'measurement', stripe: '', allowNA: false, points: 10, measUnit: '°F' },
      { id: 'sub-cooler1', prompt: 'Prep cooler #1 temp',  type: 'measurement', stripe: '', allowNA: true,  points: 10, measUnit: '°F' },
      { id: 'sub-hothold', prompt: 'Hot holding station temp OK?', type: 'yn', stripe: '', allowNA: false, points: 5,
        caForYNRules: [{ id: 'r3', condition: 'No', caList: 'Corrective Actions', adHoc: false, nextStep: 'repeat-item' }] },
      { id: 'sub-signoff', prompt: 'Temperature log signed off',   type: 'checkmark', stripe: '', allowNA: false },
    ]
  },
  { id: 'kitchen-rate', prompt: 'Rate overall kitchen cleanliness', type: 'rating', stripe: '', allowNA: false, ratingMin: 1, ratingMax: 5, points: 15 },
  { id: 'item-formula', prompt: 'Avg cooler temp', type: 'formula', stripe: '', allowNA: false, measUnit: '°F',
    formulaVars: [{ name: 'A', itemId: 'sub-freezer' }, { name: 'B', itemId: 'sub-cooler1' }],
    formulaExpr: '(A + B) / 2', formulaType: 'number' },
];

// ── Helpers ───────────────────────────────────────────────────────────────
function evalCondition(cond: DCCondition, answer: ItemAnswer): boolean {
  if (cond.type === 'yn') return answer === cond.value;
  if (cond.type === 'mc') return answer === cond.choiceLabel;
  if (cond.type === 'numeric') {
    const n = Number(answer);
    if (isNaN(n)) return false;
    switch (cond.op) {
      case '>':  return n > cond.value;
      case '>=': return n >= cond.value;
      case '=':  return n === cond.value;
      case '<=': return n <= cond.value;
      case '<':  return n < cond.value;
    }
  }
  return false;
}

// ── Formula evaluation ────────────────────────────────────────────────────
function transformIF(expr: string): string {
  let result = expr;
  let prev = '';
  while (result !== prev) {
    prev = result;
    result = result.replace(/\bIF\s*\(([^()]+),([^()]+),([^()]+)\)/gi, '($1 ? $2 : $3)');
  }
  return result;
}

function evaluateFormula(item: PreviewItem, answers: Record<string, ItemAnswer>): string | null {
  const vars = item.formulaVars ?? [];
  const expr = (item.formulaExpr ?? '').trim();
  if (!expr) return null;
  const scope: Record<string, number> = {};
  for (const v of vars) {
    if (!v.itemId) return null;
    const raw = answers[v.itemId];
    if (raw === null || raw === undefined || raw === '') return null;
    const n = Number(raw);
    if (isNaN(n)) return null;
    scope[v.name] = n;
  }
  try {
    const result = mathEval(transformIF(expr), scope);
    if (typeof result === 'number') {
      return Number.isInteger(result) ? String(result) : parseFloat(result.toFixed(6)).toString();
    }
    return String(result);
  } catch {
    return null;
  }
}

function isItemVisible(item: PreviewItem, answers: Record<string, ItemAnswer>): boolean {
  if (!item.dcParentId) return true;
  if (!item.dcConditions?.length) return false;
  const parentAnswer = answers[item.dcParentId];
  if (parentAnswer === null || parentAnswer === undefined) return false;
  return item.dcConditions.some(cond => evalCondition(cond, parentAnswer));
}

function itemCompleted(item: PreviewItem, answer: ItemAnswer, isNA: boolean, isOOO: boolean): boolean {
  if (isNA || isOOO) return true;
  if (item.type === 'subtitle' || item.type === 'text') return true;
  return answer !== null && answer !== undefined && answer !== '';
}

function getMatchedCARules(item: PreviewItem, answer: ItemAnswer): CARule[] {
  if (item.type === 'yn' && answer) {
    return (item.caForYNRules ?? []).filter(r => !r.condition || r.condition === answer);
  }
  if (item.type === 'mc' && answer) {
    const selectedIds: string[] = item.mcMultiSelect
      ? (() => { try { return JSON.parse(answer as string); } catch { return []; } })()
      : [answer as string];
    return (item.caForMCRules ?? []).filter(r => selectedIds.includes(r.condition ?? ''));
  }
  if (item.type === 'measurement' && answer !== null && answer !== '') {
    const n = Number(answer);
    if (!isNaN(n)) {
      return (item.caForRangeRules ?? []).filter(rule => {
        const range = item.measRanges?.find(r => r.id === rule.rangeId);
        if (!range) return false;
        const min = range.min !== '' ? Number(range.min) : -Infinity;
        const max = range.max !== '' ? Number(range.max) : Infinity;
        const inside = n >= min && n <= max;
        return rule.condition === 'Inside'  ? inside  :
               rule.condition === 'Outside' ? !inside :
               rule.condition === 'Above'   ? n > max :
               rule.condition === 'Below'   ? n < min : false;
      });
    }
  }
  return [];
}

const CA_QUESTIONS = [
  'Did you uncover the issue?',
  'Did you resolve the issue?',
  'Are you sure?',
];

function getTriggeredFlags(item: PreviewItem, answer: ItemAnswer, flags: Flag[]): Flag[] {
  const ids = new Set<string>();

  if (item.type === 'yn') {
    const src = answer === 'Yes' ? item.flagsForYes : answer === 'No' ? item.flagsForNo : [];
    (src ?? []).forEach(id => ids.add(id));
  }

  if (item.type === 'mc') {
    const selectedIds: string[] = !answer ? [] : item.mcMultiSelect
      ? (() => { try { return JSON.parse(answer as string); } catch { return []; } })()
      : [answer as string];
    for (const c of item.choices ?? []) {
      if (selectedIds.includes(c.id)) (c.flagIds ?? []).forEach(id => ids.add(id));
    }
  }

  if (item.type === 'measurement' && answer !== null && answer !== '') {
    const n = Number(answer);
    if (!isNaN(n)) {
      for (const rule of item.measFlagRules ?? []) {
        const range = item.measRanges?.find(r => r.id === rule.rangeId);
        if (!range) continue;
        const min = range.min !== '' ? Number(range.min) : -Infinity;
        const max = range.max !== '' ? Number(range.max) : Infinity;
        const inside = n >= min && n <= max;
        const fired =
          rule.condition === 'Inside'  ? inside :
          rule.condition === 'Outside' ? !inside :
          rule.condition === 'Above'   ? n > max :
          rule.condition === 'Below'   ? n < min : false;
        if (fired) (rule.flagIds?.length ? rule.flagIds : rule.flagId ? [rule.flagId] : []).forEach(id => ids.add(id));
      }
    }
  }

  return flags.filter(f => ids.has(f.id) && f.showOnApp !== false);
}

// ── App button ────────────────────────────────────────────────────────────
function AppBtn({ icon, label, onClick, completed }: { icon: string; label: string; onClick?: () => void; completed?: boolean }) {
  return (
    <button onClick={onClick} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, border: `2px solid ${APP_BLUE}`, borderRadius: 8, color: completed ? 'white' : APP_BLUE, fontFamily: FONT, fontSize: 15, fontWeight: 600, padding: '10px 18px', background: completed ? APP_BLUE : 'white', cursor: 'pointer', width: '100%' }}>
      <i className={`ti ${icon}`} style={{ fontSize: 18 }} /> {label}
    </button>
  );
}

// ── Y/N buttons ───────────────────────────────────────────────────────────
function YNButtons({ value, onChange }: { value: 'Yes' | 'No' | null; onChange: (v: 'Yes' | 'No' | null) => void }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
      <button onClick={() => onChange(value === 'Yes' ? null : 'Yes')} style={{ border: `2px solid ${APP_BLUE}`, background: value === 'Yes' ? APP_BLUE : 'white', color: value === 'Yes' ? 'white' : APP_BLUE, fontFamily: FONT, fontSize: 15, fontWeight: 700, padding: '9px 24px', cursor: 'pointer', borderRadius: '8px 0 0 8px', borderRight: `1px solid ${APP_BLUE}`, letterSpacing: '0.03em' }}>YES</button>
      <button onClick={() => onChange(value === 'No' ? null : 'No')} style={{ border: `2px solid ${APP_BLUE}`, background: value === 'No' ? APP_BLUE : 'white', color: value === 'No' ? 'white' : APP_BLUE, fontFamily: FONT, fontSize: 15, fontWeight: 700, padding: '9px 24px', cursor: 'pointer', borderRadius: '0 8px 8px 0', borderLeft: `1px solid ${APP_BLUE}`, letterSpacing: '0.03em' }}>NO</button>
    </div>
  );
}

// ── Rating buttons ────────────────────────────────────────────────────────
function RatingButtons({ min, max, value, onChange }: { min: number; max: number; value: number | null; onChange: (v: number | null) => void }) {
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {Array.from({ length: max - min + 1 }, (_, i) => i + min).map(n => (
        <button key={n} onClick={() => onChange(value === n ? null : n)} style={{ flex: 1, border: `2px solid ${APP_BLUE}`, borderRadius: 8, background: value === n ? APP_BLUE : 'white', color: value === n ? 'white' : APP_BLUE, fontFamily: FONT, fontSize: 14, fontWeight: 600, padding: '9px 4px', cursor: 'pointer', textAlign: 'center' }}>{n}</button>
      ))}
    </div>
  );
}

// ── Score bar ─────────────────────────────────────────────────────────────
function ScoreBar({ items, answers, naItems, oooItems, scoringOn, label }: {
  items: PreviewItem[];
  answers: Record<string, ItemAnswer>;
  naItems: Set<string>;
  oooItems: Set<string>;
  scoringOn: boolean;
  label?: string;
}) {
  if (!scoringOn) return null;
  const excluded = new Set([...naItems, ...oooItems]);
  const scoreable = items.filter(i => i.points && i.type !== 'subtitle' && i.type !== 'text' && !excluded.has(i.id));
  const possible = scoreable.reduce((sum, i) => sum + (i.points ?? 0), 0);
  if (!possible) return null;
  const earned = scoreable
    .filter(i => itemCompleted(i, answers[i.id] ?? null, false, false))
    .reduce((sum, i) => sum + (i.points ?? 0), 0);
  const pct = Math.round((earned / possible) * 10000) / 100;
  return (
    <div style={{ background: 'white', borderBottom: `1px solid ${BORDER}`, padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: TEXT_SECONDARY }}>
      <i className="ti ti-trophy" style={{ fontSize: 14, color: TEXT_MUTED }} />
      <span>{label ?? 'Score'}</span>
      <span style={{ fontWeight: 600, color: TEXT_PRIMARY }}>{pct.toFixed(2)}%</span>
      <span style={{ color: TEXT_MUTED, fontSize: 12 }}>({earned} / {possible} pts)</span>
    </div>
  );
}

// ── Item card ─────────────────────────────────────────────────────────────
function ItemCard({ item, answer, naItems, oooItems, assignedItems, onAnswer, onNA, onClearNA, onOOO, onClearOOO, onAssign, onCAOpen, caSubmitted, sublistProgress, onSublistOpen, onMCOpen, onInfoOpen, onPrinterOpen, flags, formulaResult }: {
  item: PreviewItem;
  answer: ItemAnswer;
  naItems: Set<string>;
  oooItems: Set<string>;
  assignedItems: Record<string, string>;
  onAnswer: (id: string, val: ItemAnswer) => void;
  onNA: (id: string) => void;
  onClearNA: (id: string) => void;
  onOOO: (id: string) => void;
  onClearOOO: (id: string) => void;
  onAssign: (id: string, name: string) => void;
  onCAOpen: (id: string, nextStep: 'repeat-item' | 'repeat-list' | 'no-repeat') => void;
  caSubmitted: Set<string>;
  sublistProgress?: { done: number; total: number };
  onSublistOpen?: (id: string) => void;
  onMCOpen?: (id: string) => void;
  onInfoOpen?: (file: string, anchorY: number) => void;
  onPrinterOpen?: (anchorY: number) => void;
  flags?: Flag[];
  formulaResult?: string | null;
}) {
  const [kebabOpen, setKebabOpen] = useState(false);
  const [measInput, setMeasInput] = useState('');
  const [showMeasModal, setShowMeasModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);

  const isNA = naItems.has(item.id);
  const isOOO = oooItems.has(item.id);
  const assignedTo = assignedItems[item.id] ?? null;
  const sublistDone = answer === 'complete';
  const completed = item.type === 'formula'
    ? formulaResult != null
    : item.type === 'sublist'
      ? sublistDone
      : itemCompleted(item, answer, isNA, isOOO);
  const matchedCARules = getMatchedCARules(item, answer);
  const showCA = !caSubmitted.has(item.id) && matchedCARules.length > 0;
  const triggeredFlags = getTriggeredFlags(item, answer, flags ?? []);
  const now = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    + ' · ' + new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

  const closeKebab = () => setKebabOpen(false);

  const clearAll = (id: string) => {
    onAnswer(id, null);
    onClearNA(id);
    onClearOOO(id);
    closeKebab();
  };

  if (item.type === 'subtitle' || item.type === 'text') {
    return (
      <div data-card="" style={{ background: item.stripe || 'white', borderBottom: `1px solid ${BORDER}`, padding: '12px 16px' }}>
        {item.infoFile && (
          <div onClick={e => { e.stopPropagation(); const r = (e.currentTarget as HTMLElement).closest('[data-card]')?.getBoundingClientRect(); onInfoOpen?.(item.infoFile!, r?.bottom ?? 0); }} style={{ width: 28, height: 28, background: APP_BLUE, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8, cursor: 'pointer', flexShrink: 0 }}>
            <i className="ti ti-info-circle" style={{ color: 'white', fontSize: 15 }} />
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ fontSize: 14, color: TEXT_SECONDARY, lineHeight: 1.5, flex: 1 }}>{item.prompt}</div>
          {(item.labelPrint || (item.labelIds?.length ?? 0) > 0) && (
            <div onClick={e => { e.stopPropagation(); const r = (e.currentTarget as HTMLElement).closest('[data-card]')?.getBoundingClientRect(); onPrinterOpen?.(r?.bottom ?? 0); }} style={{ color: TEXT_SECONDARY, fontSize: 16, cursor: 'pointer', flexShrink: 0 }}>
              <i className="ti ti-printer" />
            </div>
          )}
        </div>
        {item.infoFile && item.infoInline && (
          <div style={{ border: '1.5px solid #C8C8D0', borderRadius: 8, overflow: 'hidden', marginTop: 10 }}>
            <div style={{ background: SURFACE_1, padding: '8px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${BORDER}` }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: TEXT_PRIMARY }}>{item.infoFile}</span>
              <span onClick={e => { e.stopPropagation(); const r = (e.currentTarget as HTMLElement).closest('[data-card]')?.getBoundingClientRect(); onInfoOpen?.(item.infoFile!, r?.bottom ?? 0); }} style={{ fontSize: 11, fontWeight: 600, color: APP_BLUE, letterSpacing: '0.05em', textTransform: 'uppercase', cursor: 'pointer' }}>Fullscreen</span>
            </div>
            <div style={{ background: '#F8F8F8', height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', color: TEXT_MUTED, fontSize: 12, gap: 6 }}>
              <i className="ti ti-file-text" style={{ fontSize: 20 }} />
              <span>Document preview placeholder</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Kebab menu items — per handoff rules
  const kebabItems: React.ReactNode[] = [];
  if (completed) {
    kebabItems.push(
      <div key="clear" onClick={() => clearAll(item.id)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', fontSize: 15, color: '#C0282F', cursor: 'pointer' }}>
        <i className="ti ti-rotate-clockwise" style={{ fontSize: 18, color: '#C0282F' }} /> Clear response
      </div>
    );
  } else {
    if (item.assignable) {
      kebabItems.push(
        <div key="assign" onClick={() => { setShowAssignModal(true); closeKebab(); }} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', fontSize: 15, color: TEXT_PRIMARY, borderBottom: `1px solid ${BORDER}`, cursor: 'pointer' }}>
          <i className="ti ti-user-plus" style={{ fontSize: 18, color: TEXT_SECONDARY }} /> {assignedTo ? 'Reassign to...' : 'Assign to...'}
        </div>
      );
    }
    if (item.allowOOO) {
      kebabItems.push(
        <div key="ooo" onClick={() => { onOOO(item.id); closeKebab(); }} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', fontSize: 15, color: TEXT_PRIMARY, borderBottom: `1px solid ${BORDER}`, cursor: 'pointer' }}>
          <i className="ti ti-circle-off" style={{ fontSize: 18, color: TEXT_SECONDARY }} /> Mark as Out of Order
        </div>
      );
    }
    if (item.allowNA) {
      kebabItems.push(
        <div key="na" onClick={() => { onNA(item.id); closeKebab(); }} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', fontSize: 15, color: TEXT_PRIMARY, cursor: 'pointer' }}>
          <i className="ti ti-ban" style={{ fontSize: 18, color: TEXT_SECONDARY }} /> Mark as N/A
        </div>
      );
    }
    if (kebabItems.length === 0) {
      kebabItems.push(
        <div key="none" style={{ padding: '14px 20px', fontSize: 13, color: TEXT_MUTED }}>No actions available</div>
      );
    }
  }

  return (
    <div data-card="" style={{ background: item.stripe || 'white', borderBottom: `1px solid ${BORDER}`, padding: '14px 16px 12px', position: 'relative' }} onClick={() => kebabOpen && closeKebab()}>
      {/* Info library badge */}
      {item.infoFile && (
        <div onClick={e => { e.stopPropagation(); const r = (e.currentTarget as HTMLElement).closest('[data-card]')?.getBoundingClientRect(); onInfoOpen?.(item.infoFile!, r?.bottom ?? 0); }} style={{ width: 28, height: 28, background: APP_BLUE, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8, cursor: 'pointer', flexShrink: 0 }}>
          <i className="ti ti-info-circle" style={{ color: 'white', fontSize: 15 }} />
        </div>
      )}

      {/* Prompt row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
        <div style={{ fontSize: 15, color: TEXT_PRIMARY, lineHeight: 1.35, flex: 1 }}>{item.prompt}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, position: 'relative' }}>
          {triggeredFlags.length > 0 && <i className="ti ti-flag-filled" style={{ fontSize: 16, color: '#E67E22' }} />}
          {(item.labelPrint || (item.labelIds?.length ?? 0) > 0) && (
            <div onClick={e => { e.stopPropagation(); const r = (e.currentTarget as HTMLElement).closest('[data-card]')?.getBoundingClientRect(); onPrinterOpen?.(r?.bottom ?? 0); }} style={{ color: TEXT_SECONDARY, fontSize: 16, cursor: 'pointer' }}>
              <i className="ti ti-printer" />
            </div>
          )}
          <div onClick={e => { e.stopPropagation(); setKebabOpen(v => !v); }} style={{ color: TEXT_MUTED, fontSize: 16, cursor: 'pointer' }}>
            <i className="ti ti-dots-vertical" />
          </div>
          {kebabOpen && (
            <div style={{ position: 'absolute', right: 0, top: 24, background: 'white', borderRadius: 10, boxShadow: '0 4px 20px rgba(0,0,0,0.15)', overflow: 'hidden', width: 220, zIndex: 10 }}>
              {kebabItems}
            </div>
          )}
        </div>
      </div>

      {/* Inline info library embed */}
      {item.infoFile && item.infoInline && (
        <div style={{ border: '1.5px solid #C8C8D0', borderRadius: 8, overflow: 'hidden', marginBottom: 10 }}>
          <div style={{ background: SURFACE_1, padding: '8px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${BORDER}` }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: TEXT_PRIMARY }}>{item.infoFile}</span>
            <span onClick={e => { e.stopPropagation(); const r = (e.currentTarget as HTMLElement).closest('[data-card]')?.getBoundingClientRect(); onInfoOpen?.(item.infoFile!, r?.bottom ?? 0); }} style={{ fontSize: 11, fontWeight: 600, color: APP_BLUE, letterSpacing: '0.05em', textTransform: 'uppercase', cursor: 'pointer' }}>Fullscreen</span>
          </div>
          <div style={{ background: '#F8F8F8', height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', color: TEXT_MUTED, fontSize: 12, gap: 6 }}>
            <i className="ti ti-file-text" style={{ fontSize: 20 }} />
            <span>Document preview placeholder</span>
          </div>
        </div>
      )}

      {/* Flag badges */}
      {triggeredFlags.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
          {triggeredFlags.map(f => {
            const fg = choiceTextColor(f.color);
            return (
              <span key={f.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: `${f.color}28`, color: fg, border: `1px solid ${f.color}80`, borderRadius: 20, padding: '3px 10px', fontSize: 12, fontWeight: 600, fontFamily: FONT }}>
                {f.emoji} {f.name}
              </span>
            );
          })}
        </div>
      )}

      {/* N/A state */}
      {isNA ? (
        <button style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', border: '1.5px solid #C8C8D0', borderRadius: 8, color: TEXT_MUTED, fontFamily: FONT, fontSize: 15, fontWeight: 500, padding: '10px 18px', background: SURFACE_1, width: '100%', cursor: 'default' }}>N/A</button>
      ) : isOOO ? (
        <button style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', border: '1.5px solid #C8C8D0', borderRadius: 8, color: TEXT_MUTED, fontFamily: FONT, fontSize: 15, fontWeight: 500, padding: '10px 18px', background: SURFACE_1, width: '100%', cursor: 'default' }}>Out of Order</button>
      ) : (
        <>
          {item.type === 'yn' && (
            <div style={{ marginBottom: showCA ? 8 : 0 }}>
              <YNButtons value={answer as 'Yes' | 'No' | null} onChange={v => onAnswer(item.id, v)} />
            </div>
          )}
          {item.type === 'checkmark' && (
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <div onClick={() => onAnswer(item.id, answer ? null : true)} style={{ width: 40, height: 40, borderRadius: '50%', border: `2.5px solid ${APP_BLUE}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: answer ? APP_BLUE : 'white' }}>
                <i className="ti ti-check" style={{ fontSize: 20, color: answer ? 'white' : APP_BLUE }} />
              </div>
            </div>
          )}
          {item.type === 'measurement' && (
            answer !== null && answer !== undefined && answer !== '' ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8, border: `2px solid ${APP_BLUE}`, borderRadius: 8, padding: '10px 18px', background: 'white', width: '100%', fontSize: 17, fontWeight: 700, color: TEXT_PRIMARY }}>
                <i className="ti ti-calculator" style={{ fontSize: 18, color: APP_BLUE }} /> {answer}{item.measUnit ? ` ${item.measUnit}` : ''}
              </div>
            ) : (
              <>
                <AppBtn icon="ti-calculator" label="Enter value" onClick={() => setShowMeasModal(true)} />
                {showMeasModal && (
                  <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
                    <div style={{ background: 'white', borderRadius: 12, padding: 24, width: 280, fontFamily: FONT }}>
                      <div style={{ fontSize: 15, fontWeight: 600, color: TEXT_PRIMARY, marginBottom: 16 }}>{item.prompt}</div>
                      <div style={{ display: 'flex', alignItems: 'stretch', border: `2px solid ${APP_BLUE}`, borderRadius: 8, marginBottom: 16, overflow: 'hidden' }}>
                        <input type="number" value={measInput} onChange={e => setMeasInput(e.target.value)} placeholder="0.00" autoFocus style={{ fontFamily: FONT, fontSize: 20, fontWeight: 700, border: 'none', outline: 'none', flex: 1, padding: '10px 14px', textAlign: 'right', minWidth: 0 }} />
                        {item.measUnit && <span style={{ display: 'flex', alignItems: 'center', padding: '0 12px', borderLeft: `1px solid ${BORDER}`, fontSize: 14, fontWeight: 500, color: TEXT_SECONDARY, background: SURFACE_1, whiteSpace: 'nowrap' }}>{item.measUnit}</span>}
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => { if (measInput) { onAnswer(item.id, parseFloat(measInput)); setShowMeasModal(false); setMeasInput(''); } }} disabled={!measInput} style={{ flex: 1, background: APP_BLUE, color: 'white', border: 'none', borderRadius: 8, fontFamily: FONT, fontSize: 15, fontWeight: 700, padding: '10px', cursor: measInput ? 'pointer' : 'default', opacity: measInput ? 1 : 0.4 }}>Submit</button>
                        <button onClick={() => { setShowMeasModal(false); setMeasInput(''); }} style={{ flex: 1, background: SURFACE_1, color: TEXT_SECONDARY, border: '1.5px solid #C8C8D0', borderRadius: 8, fontFamily: FONT, fontSize: 15, fontWeight: 500, padding: '10px', cursor: 'pointer' }}>Cancel</button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )
          )}
          {item.type === 'rating' && (
            <RatingButtons min={item.ratingMin ?? 1} max={item.ratingMax ?? 5} value={answer as number | null} onChange={v => onAnswer(item.id, v)} />
          )}
          {item.type === 'mc' && (() => {
            const choices = item.choices ?? [];
            const isMulti = item.mcMultiSelect ?? false;
            const selectedIds: string[] = (() => {
              if (!answer) return [];
              if (isMulti) { try { return JSON.parse(answer as string); } catch { return []; } }
              return [answer as string];
            })();

            if (item.mcShowInline) {
              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {choices.map(c => {
                    const isSelected = selectedIds.includes(c.id);
                    const toggle = () => {
                      if (isMulti) {
                        const next = isSelected ? selectedIds.filter(s => s !== c.id) : [...selectedIds, c.id];
                        onAnswer(item.id, next.length > 0 ? JSON.stringify(next) : null);
                      } else {
                        onAnswer(item.id, isSelected ? null : c.id);
                      }
                    };
                    const choiceColor = c.color || APP_BLUE;
                    const choiceFg = c.color ? choiceTextColor(c.color) : APP_BLUE;
                    return (
                      <div key={c.id} onClick={toggle} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', border: `1.5px solid ${isSelected ? choiceFg : BORDER}`, borderRadius: 8, cursor: 'pointer', background: isSelected ? `${choiceColor}28` : 'white' }}>
                        {isMulti ? (
                          <div style={{ width: 18, height: 18, borderRadius: 3, border: `2px solid ${isSelected ? choiceFg : '#C0C0C8'}`, background: isSelected ? choiceFg : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {isSelected && <i className="ti ti-check" style={{ fontSize: 12, color: 'white' }} />}
                          </div>
                        ) : (
                          <div style={{ width: 18, height: 18, borderRadius: '50%', border: `2px solid ${isSelected ? choiceFg : '#C0C0C8'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {isSelected && <div style={{ width: 9, height: 9, borderRadius: '50%', background: choiceFg }} />}
                          </div>
                        )}
                        {c.icon
                          ? <i className={`ti ${c.icon}`} style={{ fontSize: 16, color: isSelected ? choiceFg : TEXT_MUTED, flexShrink: 0 }} />
                          : c.color ? <div style={{ width: 9, height: 9, borderRadius: '50%', background: c.color, flexShrink: 0 }} /> : null}
                        <span style={{ fontSize: 14, color: isSelected ? choiceFg : TEXT_PRIMARY, fontWeight: isSelected ? 600 : 400, flex: 1 }}>{c.label}</span>
                      </div>
                    );
                  })}
                </div>
              );
            }

            const selectedLabel = !isMulti ? choices.find(c => c.id === selectedIds[0])?.label : undefined;
            const btnLabel = isMulti
              ? (selectedIds.length > 0 ? `${selectedIds.length} selected` : 'Select options')
              : (selectedLabel ?? 'Select option');
            const hasAnswer = selectedIds.length > 0;
            const selectedChoice = !isMulti ? choices.find(c => c.id === selectedIds[0]) : null;
            const btnColor = selectedChoice?.color || APP_BLUE;
            const btnFg = choiceTextColor(btnColor);
            const selectedChips = isMulti ? selectedIds.map(id => choices.find(c => c.id === id)).filter(Boolean) as typeof choices : [];
            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <button onClick={() => onMCOpen?.(item.id)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, border: `2px solid ${hasAnswer ? btnFg : APP_BLUE}`, borderRadius: 8, color: hasAnswer ? btnFg : APP_BLUE, fontFamily: FONT, fontSize: 15, fontWeight: 600, padding: '10px 18px', background: hasAnswer ? `${btnColor}28` : 'white', cursor: 'pointer', width: '100%' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <i className={`ti ${selectedChoice?.icon || 'ti-list'}`} style={{ fontSize: 18 }} /> {btnLabel}
                  </span>
                  <i className="ti ti-chevron-right" style={{ fontSize: 16, opacity: 0.7 }} />
                </button>
                {selectedChips.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {selectedChips.map(c => {
                      const chipColor = c.color || APP_BLUE;
                      const chipFg = choiceTextColor(chipColor);
                      return (
                        <span key={c.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: `${chipColor}28`, color: chipFg, border: `1px solid ${chipColor}60`, borderRadius: 20, padding: '3px 10px', fontSize: 12, fontWeight: 600, fontFamily: FONT }}>
                          {c.icon && <i className={`ti ${c.icon}`} style={{ fontSize: 13 }} />}
                          {c.label}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })()}
          {(item.type === 'free' || item.type === 'email') && (
            <textarea value={(answer as string) ?? ''} onChange={e => onAnswer(item.id, e.target.value)} placeholder="Free Response..." style={{ width: '100%', border: '1.5px solid #C8C8D0', borderRadius: 8, background: SURFACE_1, fontFamily: FONT, fontSize: 14, color: answer ? TEXT_PRIMARY : TEXT_MUTED, padding: 12, resize: 'none', minHeight: 72, boxSizing: 'border-box' }} />
          )}
          {item.type === 'short' && (
            <input value={(answer as string) ?? ''} onChange={e => onAnswer(item.id, e.target.value)} placeholder="Short Answer..." style={{ width: '100%', border: '1.5px solid #C8C8D0', borderRadius: 8, background: SURFACE_1, fontFamily: FONT, fontSize: 14, color: answer ? TEXT_PRIMARY : TEXT_MUTED, padding: '10px 12px', boxSizing: 'border-box' }} />
          )}
          {item.type === 'number' && (
            <input type="number" value={(answer as string) ?? ''} onChange={e => onAnswer(item.id, e.target.value)} placeholder="Enter number..." style={{ width: '100%', border: '1.5px solid #C8C8D0', borderRadius: 8, background: SURFACE_1, fontFamily: FONT, fontSize: 14, color: answer ? TEXT_PRIMARY : TEXT_MUTED, padding: '10px 12px', boxSizing: 'border-box' }} />
          )}
          {/* Tap-to-complete types */}
          {item.type === 'photo' && (
            answer ? (
              <div onClick={() => onAnswer(item.id, null)} style={{ cursor: 'pointer', borderRadius: 10, overflow: 'hidden', background: '#D0D8E4', display: 'flex', alignItems: 'center', justifyContent: 'center', height: 160 }}>
                <i className="ti ti-photo" style={{ fontSize: 48, color: 'rgba(255,255,255,0.7)' }} />
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 8 }}>
                <AppBtn icon="ti-camera" label="Take Photo" completed={false} onClick={() => onAnswer(item.id, 'photo-taken')} />
                {item.photoAllowUpload && (
                  <AppBtn icon="ti-photo" label="Upload Photo" completed={false} onClick={() => onAnswer(item.id, 'photo-taken')} />
                )}
              </div>
            )
          )}
          {item.type === 'signature' && <AppBtn icon="ti-pencil"        label={answer ? 'Signed ✓'         : 'Signature'}         completed={!!answer} onClick={() => onAnswer(item.id, answer ? null : 'signed')} />}
          {item.type === 'barcode'   && <AppBtn icon="ti-barcode"       label={answer ? 'Scanned ✓'        : 'Scan Barcode'}      completed={!!answer} onClick={() => onAnswer(item.id, answer ? null : 'scanned')} />}
          {item.type === 'qr'        && <AppBtn icon="ti-qrcode"        label={answer ? 'Scanned ✓'        : 'Scan QR Code'}      completed={!!answer} onClick={() => onAnswer(item.id, answer ? null : 'scanned')} />}
          {item.type === 'employee'  && <AppBtn icon="ti-user"          label={answer ? String(answer)     : 'Select Employee'}   completed={!!answer} onClick={() => onAnswer(item.id, answer ? null : 'Jane Smith')} />}
          {item.type === 'stopwatch' && <AppBtn icon="ti-clock"         label={answer ? String(answer)     : 'Start Timer'}       completed={!!answer} onClick={() => onAnswer(item.id, answer ? null : '00:05:32')} />}
          {item.type === 'date'      && <AppBtn icon="ti-calendar"      label={answer ? String(answer)     : 'Select Date'}       completed={!!answer} onClick={() => onAnswer(item.id, answer ? null : new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }))} />}
          {item.type === 'time'      && <AppBtn icon="ti-clock"         label={answer ? String(answer)     : 'Select Time'}       completed={!!answer} onClick={() => onAnswer(item.id, answer ? null : new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }))} />}
          {item.type === 'datetime'  && <AppBtn icon="ti-calendar-time" label={answer ? String(answer)     : 'Select Date & Time'} completed={!!answer} onClick={() => onAnswer(item.id, answer ? null : new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true }))} />}
          {item.type === 'asset'     && <AppBtn icon="ti-box"           label={answer ? String(answer)     : 'Select Asset'}      completed={!!answer} onClick={() => onAnswer(item.id, answer ? null : 'Asset #4821')} />}
          {item.type === 'formula' && (
            <div style={{ border: `1.5px solid ${formulaResult != null ? APP_BLUE : '#C8C8D0'}`, borderRadius: 8, background: formulaResult != null ? '#EBF3FC' : SURFACE_1, fontSize: 15, fontWeight: 600, padding: '10px 18px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: TEXT_MUTED, fontSize: 18 }}>=</span>
              <span style={{ color: formulaResult != null ? APP_BLUE : TEXT_MUTED }}>
                {formulaResult ?? '—'}
              </span>
              {item.measUnit && formulaResult != null && (
                <span style={{ color: TEXT_SECONDARY, fontSize: 13, fontWeight: 400 }}>{item.measUnit}</span>
              )}
            </div>
          )}

          {/* Sublist */}
          {item.type === 'sublist' && (
            <button onClick={() => onSublistOpen?.(item.id)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, border: `2px solid ${APP_BLUE}`, borderRadius: 8, color: sublistDone ? 'white' : APP_BLUE, fontFamily: FONT, fontSize: 15, fontWeight: 600, padding: '10px 18px', background: sublistDone ? APP_BLUE : 'white', cursor: 'pointer', width: '100%' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <i className="ti ti-layout-list" style={{ fontSize: 18 }} />
                {sublistProgress ? `${sublistProgress.done} / ${sublistProgress.total}` : '0 / 0'}
              </span>
              <i className="ti ti-chevron-right" style={{ fontSize: 16, opacity: 0.7 }} />
            </button>
          )}

          {/* CA trigger */}
          {showCA && (
            <button onClick={() => onCAOpen(item.id, matchedCARules[0]?.nextStep ?? 'no-repeat')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, border: '2px solid #C0282F', borderRadius: 8, color: '#C0282F', fontFamily: FONT, fontSize: 15, fontWeight: 700, padding: '10px 18px', background: 'white', cursor: 'pointer', width: '100%', marginTop: 8 }}>
              <i className="ti ti-alert-circle" style={{ fontSize: 18 }} /> Required action <i className="ti ti-arrow-right" style={{ marginLeft: 4, fontSize: 14 }} />
            </button>
          )}
        </>
      )}

      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
        {!!item.points && <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: APP_BLUE, color: 'white', fontSize: 11, fontWeight: 700, minWidth: 24, height: 24, padding: '0 5px', borderRadius: 4 }}>{item.points}</span>}
        {isNA ? (
          <span style={{ display: 'inline-flex', alignItems: 'center', background: APP_BLUE, color: 'white', fontSize: 12, fontWeight: 500, padding: '4px 10px', borderRadius: 3, whiteSpace: 'nowrap' }}>N/A · {now}</span>
        ) : isOOO ? (
          <span style={{ display: 'inline-flex', alignItems: 'center', background: APP_BLUE, color: 'white', fontSize: 12, fontWeight: 500, padding: '4px 10px', borderRadius: 3, whiteSpace: 'nowrap' }}>OOO · {now}</span>
        ) : completed ? (
          <span style={{ display: 'inline-flex', alignItems: 'center', background: APP_BLUE, color: 'white', fontSize: 12, fontWeight: 500, padding: '4px 10px', borderRadius: 3, whiteSpace: 'nowrap' }}>Completed · {now}</span>
        ) : assignedTo ? (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: APP_PURPLE, color: 'white', fontSize: 12, fontWeight: 500, padding: '4px 10px', borderRadius: 3, whiteSpace: 'nowrap' }}>
            <i className="ti ti-user" style={{ fontSize: 11 }} /> Assigned to {assignedTo}
          </span>
        ) : (
          <span style={{ display: 'inline-flex', alignItems: 'center', background: '#E8E8EC', color: TEXT_SECONDARY, fontSize: 11, fontWeight: 500, padding: '3px 8px', borderRadius: 3 }}>Incomplete</span>
        )}
      </div>

      {/* Assign modal */}
      {showAssignModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }} onClick={() => setShowAssignModal(false)}>
          <div style={{ background: 'white', borderRadius: 12, width: 280, fontFamily: FONT, overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '16px 20px', borderBottom: `1px solid ${BORDER}`, fontSize: 15, fontWeight: 600, color: TEXT_PRIMARY }}>Assign to</div>
            {ASSIGN_NAMES.map(name => (
              <div key={name} onClick={() => { onAssign(item.id, name); setShowAssignModal(false); }} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', fontSize: 15, color: name === assignedTo ? APP_BLUE : TEXT_PRIMARY, fontWeight: name === assignedTo ? 600 : 400, borderBottom: `1px solid ${BORDER}`, cursor: 'pointer' }}>
                <i className="ti ti-user-circle" style={{ fontSize: 20, color: name === assignedTo ? APP_BLUE : TEXT_MUTED }} /> {name}
              </div>
            ))}
            <div onClick={() => setShowAssignModal(false)} style={{ padding: '14px 20px', fontSize: 15, color: TEXT_MUTED, cursor: 'pointer', textAlign: 'center' }}>Cancel</div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── CA surface ────────────────────────────────────────────────────────────
const CA_TYPE_BADGE: Record<string, string> = { yn: 'YN', mc: 'MC', measurement: '123', text: 'TXT', sublist: 'LIST', photo: 'IMG' };

function CASurface({ itemPrompt, itemType, initialQAAnswers, onQAChange, onBack, onSubmit }: { itemPrompt: string; itemType: string; initialQAAnswers?: ('Yes' | 'No' | null)[]; onQAChange?: (a: ('Yes' | 'No' | null)[]) => void; onBack: () => void; onSubmit: () => void }) {
  const [qaAnswers, setQaAnswers] = useState<('Yes' | 'No' | null)[]>(initialQAAnswers ?? [null, null, null]);
  const allAnswered = qaAnswers.every(a => a !== null);
  const setQA = (i: number, v: 'Yes' | 'No' | null) => {
    const n = [...qaAnswers] as ('Yes' | 'No' | null)[];
    n[i] = v;
    setQaAnswers(n);
    onQAChange?.(n);
  };

  const now = new Date();
  const dueBy = new Date(now.getTime() + 2 * 60 * 60 * 1000);
  const expires = new Date(now.getTime() + 4 * 60 * 60 * 1000);
  const fmt = (d: Date) => d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  const nowStr = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ' · ' + fmt(now);
  const badge = CA_TYPE_BADGE[itemType] ?? 'YN';

  const metaRows = [
    { icon: 'ti-clock', label: 'Displayed', value: fmt(now) },
    { icon: 'ti-stopwatch', label: 'Due by', value: fmt(dueBy) },
    { icon: 'ti-calendar-off', label: 'Expires', value: fmt(expires) },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header — grey, matches app item-detail style */}
      <div style={{ background: '#5A5A6A', padding: '0 16px', height: 52, display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'white', display: 'flex', alignItems: 'center', cursor: 'pointer', padding: 0, flexShrink: 0 }}>
          <i className="ti ti-chevron-left" style={{ fontSize: 22 }} />
        </button>
        <span style={{ border: '1.5px solid rgba(255,255,255,0.55)', borderRadius: 3, padding: '2px 5px', fontSize: 10, fontWeight: 700, color: 'white', letterSpacing: '0.06em', flexShrink: 0 }}>{badge}</span>
        <span style={{ color: 'white', fontSize: 14, fontWeight: 500, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{itemPrompt}</span>
        <i className="ti ti-alert-circle-filled" style={{ fontSize: 22, color: 'white', flexShrink: 0 }} />
      </div>

      {/* Metadata row */}
      <div style={{ display: 'flex', background: 'white', borderBottom: `1px solid ${BORDER}`, flexShrink: 0 }}>
        {metaRows.map((m, i) => (
          <div key={i} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRight: i < 2 ? `1px solid ${BORDER}` : 'none' }}>
            <i className={`ti ${m.icon}`} style={{ fontSize: 22, color: TEXT_SECONDARY, flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: 11, color: TEXT_SECONDARY, marginBottom: 1 }}>{m.label}</div>
              <div style={{ fontSize: 15, fontWeight: 500, color: TEXT_PRIMARY }}>{m.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Questions + inline Submit */}
      <div style={{ flex: 1, overflowY: 'auto', background: 'white' }}>
        {CA_QUESTIONS.map((q, i) => (
          <div key={i} style={{ padding: '14px 16px', borderBottom: `1px solid ${BORDER}` }}>
            <div style={{ fontSize: 15, color: TEXT_PRIMARY, marginBottom: 10 }}>{q}</div>
            <YNButtons value={qaAnswers[i]} onChange={v => setQA(i, v)} />
            {qaAnswers[i] !== null && (
              <div style={{ marginTop: 10 }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', background: APP_BLUE, color: 'white', fontSize: 12, fontWeight: 500, padding: '4px 10px', borderRadius: 3, whiteSpace: 'nowrap' }}>
                  Completed · {nowStr}
                </span>
              </div>
            )}
          </div>
        ))}
        <div style={{ padding: 16 }}>
          <button onClick={onSubmit} disabled={!allAnswered} style={{ background: allAnswered ? '#27AE60' : '#C0C0C8', color: 'white', border: 'none', borderRadius: 8, fontFamily: FONT, fontSize: 15, fontWeight: 700, padding: '14px 24px', width: '100%', cursor: allAnswered ? 'pointer' : 'default', letterSpacing: '0.03em' }}>
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Sublist surface ───────────────────────────────────────────────────────
function SublistSurface({ item, answers, naItems, onAnswer, onNA, onClearNA, onBack, scoringOn, flags }: {
  item: PreviewItem;
  answers: Record<string, ItemAnswer>;
  naItems: Set<string>;
  onAnswer: (id: string, val: ItemAnswer) => void;
  onNA: (id: string) => void;
  onClearNA: (id: string) => void;
  onBack: () => void;
  scoringOn: boolean;
  flags?: Flag[];
}) {
  const subItems = item.subItems ?? [];
  const done = subItems.filter(si => itemCompleted(si, answers[si.id] ?? null, naItems.has(si.id), false)).length;
  const total = subItems.length;
  const emptySet = new Set<string>();
  const emptyObj: Record<string, string> = {};

  const [caOpenId, setCaOpenId] = useState<string | null>(null);
  const [caNextStep, setCaNextStep] = useState<'repeat-item' | 'repeat-list' | 'no-repeat'>('no-repeat');
  const [caSubmitted, setCaSubmitted] = useState(new Set<string>());

  const caItem = caOpenId ? subItems.find(si => si.id === caOpenId) : null;

  const submitSubCA = () => {
    if (!caOpenId) return;
    if (caNextStep === 'repeat-item') {
      onAnswer(caOpenId, null);
      onClearNA(caOpenId);
    } else if (caNextStep === 'repeat-list') {
      subItems.forEach(si => { onAnswer(si.id, null); onClearNA(si.id); });
      setCaSubmitted(new Set());
    } else {
      setCaSubmitted(prev => new Set([...prev, caOpenId]));
    }
    setCaOpenId(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
      {/* Header */}
      <div style={{ background: APP_BLUE, padding: '0 16px', height: 52, display: 'flex', alignItems: 'center', flexShrink: 0 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'white', display: 'flex', alignItems: 'center', fontFamily: FONT, fontSize: 15, fontWeight: 500, cursor: 'pointer', padding: 0, marginRight: 8 }}>
          <i className="ti ti-chevron-left" style={{ fontSize: 18 }} />
        </button>
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <div style={{ fontSize: 17, fontWeight: 600, color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.prompt}</div>
        </div>
        <div style={{ background: done === total && total > 0 ? '#27AE60' : 'rgba(255,255,255,0.2)', borderRadius: 20, padding: '4px 12px', fontSize: 13, fontWeight: 600, color: 'white', flexShrink: 0, marginLeft: 8 }}>
          {done} / {total}
        </div>
      </div>

      {/* Mini score bar */}
      <ScoreBar items={subItems} answers={answers} naItems={naItems} oooItems={emptySet} scoringOn={scoringOn} label="Sublist score" />

      {/* Sub-items */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {subItems.map(si => (
          <ItemCard
            key={si.id}
            item={si}
            answer={answers[si.id] ?? null}
            naItems={naItems}
            oooItems={emptySet}
            assignedItems={emptyObj}
            onAnswer={onAnswer}
            onNA={onNA}
            onClearNA={onClearNA}
            onOOO={() => {}}
            onClearOOO={() => {}}
            onAssign={() => {}}
            onCAOpen={(id, nextStep) => { setCaOpenId(id); setCaNextStep(nextStep); }}
            caSubmitted={caSubmitted}
            flags={flags}
          />
        ))}
      </div>

      {/* CA overlay */}
      {caOpenId && caItem && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 10 }}>
          <CASurface itemPrompt={caItem.prompt} itemType={caItem.type} onBack={() => setCaOpenId(null)} onSubmit={submitSubCA} />
        </div>
      )}
    </div>
  );
}

// ── MC surface ────────────────────────────────────────────────────────────
function MCSurface({ item, answer, onAnswer, onBack }: {
  item: PreviewItem;
  answer: ItemAnswer;
  onAnswer: (id: string, val: ItemAnswer) => void;
  onBack: () => void;
}) {
  const choices = item.choices ?? [];
  const isMulti = item.mcMultiSelect ?? false;

  const selectedIds: string[] = (() => {
    if (!answer) return [];
    if (isMulti) { try { return JSON.parse(answer as string); } catch { return []; } }
    return [answer as string];
  })();

  const toggle = (id: string) => {
    if (isMulti) {
      const next = selectedIds.includes(id)
        ? selectedIds.filter(s => s !== id)
        : [...selectedIds, id];
      onAnswer(item.id, next.length > 0 ? JSON.stringify(next) : null);
    } else {
      const isSame = selectedIds[0] === id;
      onAnswer(item.id, isSame ? null : id);
      if (!isSame) onBack();
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ background: APP_BLUE, padding: '0 16px', height: 52, display: 'flex', alignItems: 'center', flexShrink: 0 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'white', display: 'flex', alignItems: 'center', fontFamily: FONT, fontSize: 15, fontWeight: 500, cursor: 'pointer', padding: 0, marginRight: 8 }}>
          <i className="ti ti-chevron-left" style={{ fontSize: 18 }} />
        </button>
        <div style={{ flex: 1, fontSize: 17, fontWeight: 600, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.prompt}</div>
        {isMulti && selectedIds.length > 0 && (
          <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 20, padding: '4px 12px', fontSize: 13, fontWeight: 600, color: 'white', flexShrink: 0, marginLeft: 8 }}>
            {selectedIds.length}
          </div>
        )}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', background: 'white' }}>
        {choices.map(c => {
          const isSelected = selectedIds.includes(c.id);
          const choiceColor = c.color || APP_BLUE;
          return (
            <div key={c.id} onClick={() => toggle(c.id)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderBottom: `1px solid ${BORDER}`, cursor: 'pointer', background: isSelected ? `${choiceColor}10` : 'white' }}>
              {isMulti ? (
                <div style={{ width: 20, height: 20, borderRadius: 4, border: `2px solid ${isSelected ? choiceColor : '#C0C0C8'}`, background: isSelected ? choiceColor : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {isSelected && <i className="ti ti-check" style={{ fontSize: 13, color: 'white' }} />}
                </div>
              ) : (
                <div style={{ width: 20, height: 20, borderRadius: '50%', border: `2px solid ${isSelected ? choiceColor : '#C0C0C8'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {isSelected && <div style={{ width: 10, height: 10, borderRadius: '50%', background: choiceColor }} />}
                </div>
              )}
              {c.icon
                ? <i className={`ti ${c.icon}`} style={{ fontSize: 18, color: isSelected ? choiceColor : TEXT_MUTED, flexShrink: 0 }} />
                : c.color ? <div style={{ width: 10, height: 10, borderRadius: '50%', background: c.color, flexShrink: 0 }} /> : null}
              <span style={{ fontSize: 15, color: isSelected ? choiceColor : TEXT_PRIMARY, fontWeight: isSelected ? 600 : 400, flex: 1 }}>{c.label}</span>
            </div>
          );
        })}
      </div>

      {isMulti && (
        <div style={{ background: 'white', padding: 16, borderTop: `1px solid ${BORDER}`, flexShrink: 0 }}>
          <button onClick={onBack} style={{ background: selectedIds.length > 0 ? APP_BLUE : '#C0C0C8', color: 'white', border: 'none', borderRadius: 8, fontFamily: FONT, fontSize: 15, fontWeight: 700, padding: '14px 24px', width: '100%', cursor: 'pointer', letterSpacing: '0.03em' }}>
            {selectedIds.length > 0 ? `Done (${selectedIds.length} selected)` : 'Done'}

          </button>
        </div>
      )}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────
export default function JoltListPreviewPage() {
  const [items, setItems] = useState<PreviewItem[]>(FALLBACK_ITEMS);
  const [listName, setListName] = useState('Opening Checklist');
  const [scoringOn, setScoringOn] = useState(false);
  const [flags, setFlags] = useState<Flag[]>(FALLBACK_FLAGS);

  const [answers, setAnswers] = useState<Record<string, ItemAnswer>>({});
  const [naItems, setNaItems] = useState<Set<string>>(new Set());
  const [oooItems, setOooItems] = useState<Set<string>>(new Set());
  const [assignedItems, setAssignedItems] = useState<Record<string, string>>({});
  const [caSubmitted, setCaSubmitted] = useState<Set<string>>(new Set());
  const [caOpenId, setCaOpenId] = useState<string | null>(null);
  const [caNextStep, setCaNextStep] = useState<'repeat-item' | 'repeat-list' | 'no-repeat'>('no-repeat');
  const [requireAllComplete, setRequireAllComplete] = useState(false);

  const [sublistOpenId, setSublistOpenId] = useState<string | null>(null);
  const [sublistCAAnswers, setSublistCAAnswers] = useState<Record<string, ('Yes' | 'No' | null)[]>>({});
  const [mcOpenId, setMcOpenId] = useState<string | null>(null);
  const [subAnswers, setSubAnswers] = useState<Record<string, Record<string, ItemAnswer>>>({});
  const [subNaItems, setSubNaItems] = useState<Record<string, Set<string>>>({});
  const [refreshSpin, setRefreshSpin] = useState(false);
  const [infoOpenFile, setInfoOpenFile] = useState<string | null>(null);
  const [infoModalY, setInfoModalY] = useState(0);
  const [printerModalY, setPrinterModalY] = useState<number | null>(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem('jolt-preview-payload');
    if (!raw) return;
    try {
      const payload = JSON.parse(raw) as { listName: string; scoringOn: boolean; submission?: string; items: PreviewItem[]; flags?: Flag[] };
      setItems(payload.items ?? FALLBACK_ITEMS);
      setListName(payload.listName ?? 'Preview');
      setScoringOn(payload.scoringOn ?? false);
      setFlags(payload.flags ?? FALLBACK_FLAGS);
      setRequireAllComplete(payload.submission === 'all-complete');
    } catch {}
  }, []);

  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key !== 'jolt-preview-payload' || !e.newValue) return;
      try {
        const payload = JSON.parse(e.newValue) as { listName: string; scoringOn: boolean; submission?: string; items: PreviewItem[]; flags?: Flag[] };
        setItems(payload.items ?? FALLBACK_ITEMS);
        setListName(payload.listName ?? 'Preview');
        setScoringOn(payload.scoringOn ?? false);
        setFlags(payload.flags ?? FALLBACK_FLAGS);
        setRequireAllComplete(payload.submission === 'all-complete');
      } catch {}
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const setAnswer = (id: string, val: ItemAnswer) => {
    setAnswers(prev => {
      const next = { ...prev, [id]: val };
      items.filter(i => i.dcParentId === id).forEach(child => {
        if (!isItemVisible(child, next)) delete next[child.id];
      });
      return next;
    });
  };

  const handleSubAnswer = (sublistId: string, subItemId: string, val: ItemAnswer) => {
    const newSubAns = { ...(subAnswers[sublistId] ?? {}), [subItemId]: val };
    const newSubAnswers = { ...subAnswers, [sublistId]: newSubAns };
    setSubAnswers(newSubAnswers);
    // Sync sublist completion back to parent answers so ScoreBar and ItemCard pick it up
    const sublist = items.find(i => i.id === sublistId);
    if (sublist?.subItems?.length) {
      const subNa = subNaItems[sublistId] ?? new Set<string>();
      const allDone = sublist.subItems.every(si => itemCompleted(si, newSubAns[si.id] ?? null, subNa.has(si.id), false));
      setAnswers(prev => ({ ...prev, [sublistId]: allDone ? 'complete' : null }));
    }
  };

  const handleSubNA = (sublistId: string, subItemId: string) => {
    const newSubNa = new Set([...(subNaItems[sublistId] ?? []), subItemId]);
    const newSubNaItems = { ...subNaItems, [sublistId]: newSubNa };
    setSubNaItems(newSubNaItems);
    const sublist = items.find(i => i.id === sublistId);
    if (sublist?.subItems?.length) {
      const subAns = subAnswers[sublistId] ?? {};
      const allDone = sublist.subItems.every(si => itemCompleted(si, subAns[si.id] ?? null, newSubNa.has(si.id), false));
      setAnswers(prev => ({ ...prev, [sublistId]: allDone ? 'complete' : null }));
    }
  };

  const handleClearSubNA = (sublistId: string, subItemId: string) => {
    const newSubNa = new Set(subNaItems[sublistId] ?? []);
    newSubNa.delete(subItemId);
    setSubNaItems(prev => ({ ...prev, [sublistId]: newSubNa }));
    setAnswers(prev => ({ ...prev, [sublistId]: null }));
  };

  const getSublistProgress = (item: PreviewItem): { done: number; total: number } => {
    if (!item.subItems?.length) return { done: 0, total: 0 };
    const subAns = subAnswers[item.id] ?? {};
    const subNa = subNaItems[item.id] ?? new Set<string>();
    const done = item.subItems.filter(si => itemCompleted(si, subAns[si.id] ?? null, subNa.has(si.id), false)).length;
    return { done, total: item.subItems.length };
  };

  const reset = () => {
    const raw = localStorage.getItem('jolt-preview-payload');
    if (raw) {
      try {
        const payload = JSON.parse(raw) as { listName: string; scoringOn: boolean; items: PreviewItem[] };
        setItems(payload.items ?? FALLBACK_ITEMS);
        setListName(payload.listName ?? 'Preview');
        setScoringOn(payload.scoringOn ?? false);
      } catch {}
    }
    setAnswers({});
    setNaItems(new Set());
    setOooItems(new Set());
    setAssignedItems({});
    setCaSubmitted(new Set());
    setCaOpenId(null);
    setSublistOpenId(null);
    setSubAnswers({});
    setSublistCAAnswers({});
    setSubNaItems({});
  };

  const submitCA = () => {
    if (!caOpenId) return;
    if (caNextStep === 'repeat-item') {
      setAnswers(prev => { const n = { ...prev }; delete n[caOpenId]; return n; });
      setNaItems(prev => { const n = new Set(prev); n.delete(caOpenId); return n; });
      setOooItems(prev => { const n = new Set(prev); n.delete(caOpenId); return n; });
      setAssignedItems(prev => { const n = { ...prev }; delete n[caOpenId]; return n; });
    } else if (caNextStep === 'repeat-list') {
      setAnswers({});
      setNaItems(new Set());
      setOooItems(new Set());
      setAssignedItems({});
      setCaSubmitted(new Set());
      setSubAnswers({});
      setSubNaItems({});
    } else {
      setCaSubmitted(prev => new Set([...prev, caOpenId]));
    }
    setCaOpenId(null);
  };

  const caItem = caOpenId ? items.find(i => i.id === caOpenId) : null;
  const sublistItem = sublistOpenId ? items.find(i => i.id === sublistOpenId) : null;
  const visibleItems = items.filter(item => isItemVisible(item, answers));
  const formulaResults = useMemo(() =>
    Object.fromEntries(items.filter(i => i.type === 'formula').map(i => [i.id, evaluateFormula(i, answers)])),
    [items, answers]
  );
  const allListComplete = visibleItems.every(item =>
    item.type === 'formula'
      ? formulaResults[item.id] != null
      : itemCompleted(item, answers[item.id] ?? null, naItems.has(item.id), oooItems.has(item.id))
  );
  const isOverlayOpen = !!(caOpenId || sublistOpenId || mcOpenId);

  return (
    <>
    <style>{`@keyframes preview-refresh { from { transform: rotate(0deg); } to { transform: rotate(360deg); } } .preview-refresh-spin { animation: preview-refresh 0.5s ease-out; }`}</style>
    <div style={{ fontFamily: FONT, height: '100vh', background: SURFACE_0, display: 'flex', flexDirection: 'column', alignItems: 'center', overflow: 'hidden' }}>
      <div style={{ width: '100%', maxWidth: 420, display: 'flex', flexDirection: 'column', height: '100%', position: 'relative', overflow: 'hidden' }}>
        {/* App header */}
        <div style={{ background: APP_BLUE, padding: '0 16px', height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, position: 'sticky', top: 0, zIndex: 20 }}>
          <div style={{ fontSize: 17, fontWeight: 600, color: 'white', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{listName}</div>
          <div onClick={() => { reset(); setRefreshSpin(true); setTimeout(() => setRefreshSpin(false), 600); }} style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', opacity: 0.85, cursor: 'pointer', flexShrink: 0 }}>
            <i className={`ti ti-refresh${refreshSpin ? ' preview-refresh-spin' : ''}`} style={{ fontSize: 18 }} />
          </div>
        </div>

        {/* Slides: list ← → overlay (CA or Sublist) */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
          <div style={{ flex: '0 0 100%', overflowY: 'auto', transform: isOverlayOpen ? 'translateX(-100%)' : 'translateX(0)', transition: 'transform 0.3s ease' }}>
            <ScoreBar items={visibleItems} answers={answers} naItems={naItems} oooItems={oooItems} scoringOn={scoringOn} />
            {visibleItems.map(item => (
              <ItemCard
                key={item.id}
                item={item}
                answer={answers[item.id] ?? null}
                naItems={naItems}
                oooItems={oooItems}
                assignedItems={assignedItems}
                onAnswer={setAnswer}
                onNA={id => setNaItems(prev => new Set([...prev, id]))}
                onClearNA={id => setNaItems(prev => { const n = new Set(prev); n.delete(id); return n; })}
                onOOO={id => setOooItems(prev => new Set([...prev, id]))}
                onClearOOO={id => setOooItems(prev => { const n = new Set(prev); n.delete(id); return n; })}
                onAssign={(id, name) => setAssignedItems(prev => ({ ...prev, [id]: name }))}
                onCAOpen={(id, nextStep) => { setCaOpenId(id); setCaNextStep(nextStep); }}
                caSubmitted={caSubmitted}
                sublistProgress={item.type === 'sublist' ? {
                  done: answers[item.id] === 'complete' ? CA_QUESTIONS.length : (sublistCAAnswers[item.id] ?? []).filter(a => a !== null).length,
                  total: CA_QUESTIONS.length,
                } : undefined}
                onSublistOpen={id => setSublistOpenId(id)}
                onMCOpen={id => setMcOpenId(id)}
                onInfoOpen={(file, y) => { setInfoOpenFile(file); setInfoModalY(y); }}
                onPrinterOpen={y => setPrinterModalY(y)}
                flags={flags}
                formulaResult={item.type === 'formula' ? formulaResults[item.id] : undefined}
              />
            ))}
            <div style={{ padding: 16 }}>
              <button disabled={!allListComplete} onClick={() => setShowSubmitModal(true)} style={{ background: allListComplete ? '#27AE60' : '#C0C0C8', color: 'white', border: 'none', borderRadius: 8, fontFamily: FONT, fontSize: 15, fontWeight: 700, padding: '14px 24px', width: '100%', cursor: allListComplete ? 'pointer' : 'default', letterSpacing: '0.03em' }}>
                Submit
              </button>
            </div>
          </div>

          {/* CA overlay */}
          {caOpenId && caItem && (
            <div style={{ position: 'absolute', inset: 0, background: 'white', zIndex: 10 }}>
              <CASurface itemPrompt={caItem.prompt} itemType={caItem.type} onBack={() => setCaOpenId(null)} onSubmit={submitCA} />
            </div>
          )}

          {/* Sublist overlay */}
          {sublistOpenId && sublistItem && (
            <div style={{ position: 'absolute', inset: 0, background: 'white', zIndex: 10 }}>
              <CASurface
                itemPrompt={sublistItem.prompt}
                itemType="sublist"
                initialQAAnswers={sublistCAAnswers[sublistOpenId] ?? [null, null, null]}
                onQAChange={a => setSublistCAAnswers(prev => ({ ...prev, [sublistOpenId]: a }))}
                onBack={() => setSublistOpenId(null)}
                onSubmit={() => {
                  setAnswers(prev => ({ ...prev, [sublistOpenId]: 'complete' }));
                  setSublistOpenId(null);
                }}
              />
            </div>
          )}

          {/* MC overlay */}
          {mcOpenId && (() => {
            const mcItem = items.find(i => i.id === mcOpenId);
            if (!mcItem) return null;
            return (
              <div style={{ position: 'absolute', inset: 0, background: 'white', zIndex: 10 }}>
                <MCSurface
                  item={mcItem}
                  answer={answers[mcOpenId] ?? null}
                  onAnswer={setAnswer}
                  onBack={() => setMcOpenId(null)}
                />
              </div>
            );
          })()}
        </div>
      </div>

      {/* Submit confirmation modal */}
      {showSubmitModal && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }} onClick={() => setShowSubmitModal(false)}>
          <div style={{ background: 'white', borderRadius: 12, overflow: 'hidden', width: '100%', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '16px 20px', borderBottom: `1px solid ${BORDER}` }}>
              <div style={{ fontSize: 17, fontWeight: 700, color: TEXT_PRIMARY }}>Submit list</div>
            </div>
            <div style={{ padding: '16px 20px 20px' }}>
              <p style={{ margin: '0 0 20px', fontSize: 15, color: TEXT_PRIMARY }}>Do you want to clear the list?</p>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setShowSubmitModal(false)} style={{ flex: 1, background: 'white', border: `1.5px solid ${BORDER}`, borderRadius: 8, fontFamily: FONT, fontSize: 15, fontWeight: 600, padding: '12px', cursor: 'pointer', color: TEXT_PRIMARY }}>
                  Cancel
                </button>
                <button onClick={() => { reset(); setShowSubmitModal(false); }} style={{ flex: 1, background: '#27AE60', border: 'none', borderRadius: 8, fontFamily: FONT, fontSize: 15, fontWeight: 700, padding: '12px', cursor: 'pointer', color: 'white' }}>
                  Yes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Info library modal — rendered outside the transformed column so position:fixed works correctly */}
      {infoOpenFile && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 200 }} onClick={() => setInfoOpenFile(null)}>
          <div style={{ position: 'absolute', top: infoModalY, left: '50%', transform: 'translateX(-50%)', width: 420, height: 400, background: 'white', borderRadius: '0 0 12px 12px', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 4px 24px rgba(0,0,0,0.15)' }} onClick={e => e.stopPropagation()}>
            <div style={{ background: APP_BLUE, padding: '0 16px', height: 52, display: 'flex', alignItems: 'center', flexShrink: 0 }}>
              <button onClick={() => setInfoOpenFile(null)} style={{ background: 'none', border: 'none', color: 'white', display: 'flex', alignItems: 'center', gap: 2, fontFamily: FONT, fontSize: 15, fontWeight: 500, cursor: 'pointer', padding: 0, marginRight: 8, flexShrink: 0 }}>
                <i className="ti ti-chevron-left" style={{ fontSize: 20 }} /> Back
              </button>
              <div style={{ flex: 1, textAlign: 'center', fontSize: 15, fontWeight: 600, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{infoOpenFile}</div>
              <div style={{ width: 56, flexShrink: 0 }} />
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, color: TEXT_MUTED }}>
              <i className="ti ti-file-text" style={{ fontSize: 52 }} />
              <div style={{ fontSize: 15, fontWeight: 500 }}>Info library document preview</div>
            </div>
          </div>
        </div>
      )}

      {/* Label printer modal */}
      {printerModalY !== null && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 200 }} onClick={() => setPrinterModalY(null)}>
          <div style={{ position: 'absolute', top: printerModalY, left: '50%', transform: 'translateX(-50%)', width: 420, height: 400, background: 'white', borderRadius: '0 0 12px 12px', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 4px 24px rgba(0,0,0,0.15)' }} onClick={e => e.stopPropagation()}>
            <div style={{ background: APP_BLUE, padding: '0 16px', height: 52, display: 'flex', alignItems: 'center', flexShrink: 0 }}>
              <button onClick={() => setPrinterModalY(null)} style={{ background: 'none', border: 'none', color: 'white', display: 'flex', alignItems: 'center', gap: 2, fontFamily: FONT, fontSize: 15, fontWeight: 500, cursor: 'pointer', padding: 0, marginRight: 8, flexShrink: 0 }}>
                <i className="ti ti-chevron-left" style={{ fontSize: 20 }} /> Back
              </button>
              <div style={{ flex: 1, textAlign: 'center', fontSize: 15, fontWeight: 600, color: 'white' }}>Select a label</div>
              <div style={{ width: 56, flexShrink: 0 }} />
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 20, gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: TEXT_MUTED }}>
                <i className="ti ti-printer-off" style={{ fontSize: 16 }} />
                <span style={{ fontSize: 13 }}>No printers available</span>
              </div>
              <div style={{ border: `1.5px solid ${BORDER}`, borderRadius: 8, overflow: 'hidden' }}>
                <div style={{ background: SURFACE_1, padding: '8px 14px', borderBottom: `1px solid ${BORDER}`, fontSize: 12, fontWeight: 600, color: TEXT_MUTED, letterSpacing: '0.06em', textTransform: 'uppercase' as const }}>Label preview</div>
                <div style={{ height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: TEXT_MUTED, fontSize: 12 }}>
                  <i className="ti ti-tag" style={{ fontSize: 24 }} />
                  <span>Placeholder label</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
}
