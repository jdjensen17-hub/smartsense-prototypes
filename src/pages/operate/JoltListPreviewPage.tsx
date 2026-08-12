import React, { useState, useEffect } from 'react';

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

// ── Types — mirror editor exactly ─────────────────────────────────────────
type ItemType = 'yn' | 'checkmark' | 'rating' | 'signature' | 'mc' | 'short' | 'free' |
  'measurement' | 'number' | 'photo' | 'qr' | 'employee' | 'date' | 'datetime' | 'time' |
  'stopwatch' | 'subtitle' | 'text' | 'barcode' | 'sublist' | 'formula' | 'asset' | 'email';

type DCConditionYN      = { type: 'yn'; value: 'Yes' | 'No' };
type DCConditionNumeric = { type: 'numeric'; op: '>' | '>=' | '=' | '<=' | '<'; value: number };
type DCConditionMC      = { type: 'mc'; choiceId: string; choiceLabel: string };
type DCCondition = DCConditionYN | DCConditionNumeric | DCConditionMC;

interface MCChoice { id: string; label: string; color: string; icon: string | null; }
interface CARule { id: string; condition?: string; caList: string; adHoc: boolean; nextStep: 'repeat-item' | 'repeat-list' | 'no-repeat'; optional?: boolean; }

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
  caForYNRules?: CARule[];
  flagsForNo?: string[];
  points?: number;
  ratingMin?: number;
  ratingMax?: number;
  infoFile?: string;
  infoInline?: boolean;
  labelPrint?: boolean;
  labelIds?: string[];
  measUnit?: string;
  measSensorId?: string;
  subItems?: PreviewItem[];
}

type ItemAnswer = string | number | boolean | null;

// ── Fallback data ─────────────────────────────────────────────────────────
const FALLBACK_ITEMS: PreviewItem[] = [
  { id: 'cooler-ok', prompt: 'Walk-in cooler temp OK?', type: 'yn', stripe: '#5CA6D9', allowNA: false, assignable: true,
    caForYNRules: [{ id: 'r1', caList: 'Corrective Actions', adHoc: false, nextStep: 'repeat-item' }],
    flagsForNo: ['f1'], points: 25 },
  { id: 'ca-photo', prompt: 'Take corrective action photo', type: 'photo', stripe: '', allowNA: true,
    dcParentId: 'cooler-ok', dcConditions: [{ type: 'yn', value: 'No' }] },
  { id: 'sign-off', prompt: 'Sign off opening inspection', type: 'signature', stripe: '', allowNA: false, infoFile: 'Opening Procedures.pdf' },
  { id: 'prep-temp', prompt: 'Record prep cooler temp', type: 'measurement', stripe: '#C1E1C5', allowNA: true, allowOOO: true, points: 25, measUnit: '°F' },
  { id: 'ca-notes', prompt: 'Log corrective action notes', type: 'free', stripe: '', allowNA: false,
    dcParentId: 'prep-temp', dcConditions: [{ type: 'numeric', op: '>=', value: 41 }] },
  { id: 'date-labels', prompt: 'All date labels current', type: 'checkmark', stripe: '', allowNA: false, infoFile: 'Date Label Policy.pdf', infoInline: true, labelPrint: true },
  { id: 'handwashing', prompt: 'Handwashing stations stocked', type: 'yn', stripe: '', allowNA: true, allowOOO: true, points: 10 },
  { id: 'vendor-mc', prompt: 'Preferred vendor for shortfall?', type: 'mc', stripe: '', allowNA: false, choices: [
    { id: 'c1', label: 'Sysco',                  color: '#4CAF50', icon: null },
    { id: 'c2', label: 'US Foods',               color: '#2196F3', icon: null },
    { id: 'c3', label: 'Performance Food Group', color: '#FF9800', icon: null },
  ]},
  { id: 'temp-checks', prompt: 'Temperature Checks', type: 'sublist', stripe: '#E8D0F0', allowNA: false, points: 20,
    subItems: [
      { id: 'sub-freezer', prompt: 'Walk-in freezer temp', type: 'measurement', stripe: '', allowNA: false, points: 10, measUnit: '°F' },
      { id: 'sub-cooler1', prompt: 'Prep cooler #1 temp',  type: 'measurement', stripe: '', allowNA: true,  points: 10, measUnit: '°F' },
      { id: 'sub-hothold', prompt: 'Hot holding station temp OK?', type: 'yn', stripe: '', allowNA: false, points: 5 },
      { id: 'sub-signoff', prompt: 'Temperature log signed off',   type: 'checkmark', stripe: '', allowNA: false },
    ]
  },
  { id: 'kitchen-rate', prompt: 'Rate overall kitchen cleanliness', type: 'rating', stripe: '', allowNA: false, ratingMin: 1, ratingMax: 5, points: 15 },
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

function triggerCA(item: PreviewItem, answer: ItemAnswer): boolean {
  return !!(item.caForYNRules?.length && answer === 'No');
}

const CA_OPTIONS = ['Correct Immediately', 'Discard', 'Notify Manager', 'Review with Employee'];

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
function ItemCard({ item, answer, naItems, oooItems, assignedItems, onAnswer, onNA, onClearNA, onOOO, onClearOOO, onAssign, onCAOpen, caSubmitted, sublistProgress, onSublistOpen, onInfoOpen, onPrinterOpen }: {
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
  onCAOpen: (id: string) => void;
  caSubmitted: Set<string>;
  sublistProgress?: { done: number; total: number };
  onSublistOpen?: (id: string) => void;
  onInfoOpen?: (file: string, anchorY: number) => void;
  onPrinterOpen?: (anchorY: number) => void;
}) {
  const [kebabOpen, setKebabOpen] = useState(false);
  const [measInput, setMeasInput] = useState('');
  const [showMeasModal, setShowMeasModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);

  const isNA = naItems.has(item.id);
  const isOOO = oooItems.has(item.id);
  const assignedTo = assignedItems[item.id] ?? null;
  const sublistAllDone = sublistProgress ? sublistProgress.done === sublistProgress.total && sublistProgress.total > 0 : false;
  const completed = item.type === 'sublist'
    ? sublistAllDone
    : itemCompleted(item, answer, isNA, isOOO);
  const showCA = !caSubmitted.has(item.id) && triggerCA(item, answer);
  const hasFlag = !!(item.flagsForNo?.length && answer === 'No');
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
          {hasFlag && <i className="ti ti-alert-triangle" style={{ fontSize: 18, color: '#E67E22' }} />}
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
                      <div style={{ fontSize: 15, fontWeight: 600, color: TEXT_PRIMARY, marginBottom: 4 }}>{item.prompt}</div>
                      {item.measUnit && <div style={{ fontSize: 12, color: TEXT_MUTED, marginBottom: 12 }}>{item.measUnit}</div>}
                      <input type="number" value={measInput} onChange={e => setMeasInput(e.target.value)} placeholder="0.00" autoFocus style={{ fontFamily: FONT, fontSize: 20, fontWeight: 700, border: `2px solid ${APP_BLUE}`, borderRadius: 8, padding: '10px 14px', width: '100%', textAlign: 'right', marginBottom: 16, boxSizing: 'border-box' }} />
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
            const options = item.choices ?? [];
            const currentIdx = options.findIndex(c => c.label === answer);
            return (
              <button onClick={() => { const next = (currentIdx + 1) % (options.length + 1); onAnswer(item.id, next < options.length ? options[next].label : null); }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, border: `2px solid ${APP_BLUE}`, borderRadius: 8, color: answer ? 'white' : APP_BLUE, fontFamily: FONT, fontSize: 15, fontWeight: 600, padding: '10px 18px', background: answer ? APP_BLUE : 'white', cursor: 'pointer', width: '100%' }}>
                <i className="ti ti-list" style={{ fontSize: 18 }} /> {answer ? String(answer) : 'Select option'}
              </button>
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
          {item.type === 'photo'     && <AppBtn icon="ti-camera"        label={answer ? 'Photo taken ✓'    : 'Take Photo'}        completed={!!answer} onClick={() => onAnswer(item.id, answer ? null : 'photo-taken')} />}
          {item.type === 'signature' && <AppBtn icon="ti-pencil"        label={answer ? 'Signed ✓'         : 'Signature'}         completed={!!answer} onClick={() => onAnswer(item.id, answer ? null : 'signed')} />}
          {item.type === 'barcode'   && <AppBtn icon="ti-barcode"       label={answer ? 'Scanned ✓'        : 'Scan Barcode'}      completed={!!answer} onClick={() => onAnswer(item.id, answer ? null : 'scanned')} />}
          {item.type === 'qr'        && <AppBtn icon="ti-qrcode"        label={answer ? 'Scanned ✓'        : 'Scan QR Code'}      completed={!!answer} onClick={() => onAnswer(item.id, answer ? null : 'scanned')} />}
          {item.type === 'employee'  && <AppBtn icon="ti-user"          label={answer ? String(answer)     : 'Select Employee'}   completed={!!answer} onClick={() => onAnswer(item.id, answer ? null : 'Jane Smith')} />}
          {item.type === 'stopwatch' && <AppBtn icon="ti-clock"         label={answer ? String(answer)     : 'Start Timer'}       completed={!!answer} onClick={() => onAnswer(item.id, answer ? null : '00:05:32')} />}
          {item.type === 'date'      && <AppBtn icon="ti-calendar"      label={answer ? String(answer)     : 'Select Date'}       completed={!!answer} onClick={() => onAnswer(item.id, answer ? null : new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }))} />}
          {item.type === 'time'      && <AppBtn icon="ti-clock"         label={answer ? String(answer)     : 'Select Time'}       completed={!!answer} onClick={() => onAnswer(item.id, answer ? null : new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }))} />}
          {item.type === 'datetime'  && <AppBtn icon="ti-calendar-time" label={answer ? String(answer)     : 'Select Date & Time'} completed={!!answer} onClick={() => onAnswer(item.id, answer ? null : new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true }))} />}
          {item.type === 'asset'     && <AppBtn icon="ti-box"           label={answer ? String(answer)     : 'Select Asset'}      completed={!!answer} onClick={() => onAnswer(item.id, answer ? null : 'Asset #4821')} />}
          {item.type === 'formula'   && (
            <div style={{ border: '1.5px solid #C8C8D0', borderRadius: 8, background: SURFACE_1, fontSize: 15, fontWeight: 600, color: TEXT_SECONDARY, padding: '10px 18px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: TEXT_MUTED, fontSize: 18 }}>=</span> —
            </div>
          )}

          {/* Sublist */}
          {item.type === 'sublist' && (() => {
            const { done, total } = sublistProgress ?? { done: 0, total: 0 };
            const label = done > 0 && !sublistAllDone ? `${done} / ${total} complete` : sublistAllDone ? `${total} / ${total} complete` : 'Open';
            return (
              <button onClick={() => onSublistOpen?.(item.id)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, border: `2px solid ${sublistAllDone ? APP_BLUE : APP_BLUE}`, borderRadius: 8, color: sublistAllDone ? 'white' : APP_BLUE, fontFamily: FONT, fontSize: 15, fontWeight: 600, padding: '10px 18px', background: sublistAllDone ? APP_BLUE : 'white', cursor: 'pointer', width: '100%' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <i className="ti ti-layout-list" style={{ fontSize: 18 }} /> {label}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  {!sublistAllDone && done > 0 && (
                    <span style={{ fontSize: 12, fontWeight: 600, background: `${APP_BLUE}22`, color: APP_BLUE, padding: '2px 8px', borderRadius: 10 }}>{done}/{total}</span>
                  )}
                  <i className="ti ti-chevron-right" style={{ fontSize: 16, opacity: 0.7 }} />
                </span>
              </button>
            );
          })()}

          {/* CA trigger */}
          {showCA && (
            <button onClick={() => onCAOpen(item.id)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, border: '2px solid #C0282F', borderRadius: 8, color: '#C0282F', fontFamily: FONT, fontSize: 15, fontWeight: 700, padding: '10px 18px', background: 'white', cursor: 'pointer', width: '100%', marginTop: 8 }}>
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
function CASurface({ itemPrompt, onBack, onSubmit }: { itemPrompt: string; onBack: () => void; onSubmit: () => void }) {
  const [selected, setSelected] = useState('');
  const now = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    + ' · ' + new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ background: '#5A5A6A', padding: '0 16px', height: 52, display: 'flex', alignItems: 'center', flexShrink: 0 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'white', display: 'flex', alignItems: 'center', fontFamily: FONT, fontSize: 15, fontWeight: 500, cursor: 'pointer', padding: 0, marginRight: 8 }}>
          <i className="ti ti-chevron-left" style={{ fontSize: 18 }} />
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: 'rgba(255,255,255,0.75)', flex: 1, overflow: 'hidden' }}>
          <i className="ti ti-checkbox" style={{ fontSize: 13, opacity: 0.6 }} />
          <strong style={{ color: 'white', fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{itemPrompt}</strong>
        </div>
        <div style={{ background: 'white', borderRadius: 20, display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', fontSize: 12, fontWeight: 600, color: '#C0282F', flexShrink: 0 }}>
          <i className="ti ti-alert-circle" style={{ fontSize: 13 }} /> Required
        </div>
      </div>
      <div style={{ flex: 1, background: 'white', overflowY: 'auto' }}>
        <div style={{ padding: '12px 16px', borderBottom: `1px solid ${BORDER}`, fontSize: 13, color: TEXT_SECONDARY }}>Select the corrective action you took.</div>
        {CA_OPTIONS.map(action => (
          <div key={action} onClick={() => setSelected(action)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderBottom: `1px solid ${BORDER}`, fontSize: 15, cursor: 'pointer' }}>
            <div style={{ width: 20, height: 20, borderRadius: '50%', border: `2px solid ${selected === action ? APP_BLUE : '#C0C0C8'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {selected === action && <div style={{ width: 10, height: 10, borderRadius: '50%', background: APP_BLUE }} />}
            </div>
            <span style={{ color: selected === action ? APP_BLUE : TEXT_PRIMARY, fontWeight: selected === action ? 600 : 400 }}>{action}</span>
          </div>
        ))}
        {selected && (
          <div style={{ padding: '0 16px 16px' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', background: APP_BLUE, color: 'white', fontSize: 12, fontWeight: 500, padding: '4px 10px', borderRadius: 3 }}>Completed · {now}</span>
          </div>
        )}
      </div>
      <div style={{ background: 'white', padding: 16, borderTop: `1px solid ${BORDER}`, flexShrink: 0 }}>
        <button onClick={onSubmit} disabled={!selected} style={{ background: selected ? '#27AE60' : '#C0C0C8', color: 'white', border: 'none', borderRadius: 8, fontFamily: FONT, fontSize: 15, fontWeight: 700, padding: '14px 24px', width: '100%', cursor: selected ? 'pointer' : 'default', letterSpacing: '0.03em', textTransform: 'uppercase' }}>
          Submit &amp; Repeat
        </button>
      </div>
    </div>
  );
}

// ── Sublist surface ───────────────────────────────────────────────────────
function SublistSurface({ item, answers, naItems, onAnswer, onNA, onClearNA, onBack, scoringOn }: {
  item: PreviewItem;
  answers: Record<string, ItemAnswer>;
  naItems: Set<string>;
  onAnswer: (id: string, val: ItemAnswer) => void;
  onNA: (id: string) => void;
  onClearNA: (id: string) => void;
  onBack: () => void;
  scoringOn: boolean;
}) {
  const subItems = item.subItems ?? [];
  const done = subItems.filter(si => itemCompleted(si, answers[si.id] ?? null, naItems.has(si.id), false)).length;
  const total = subItems.length;
  const emptySet = new Set<string>();
  const emptyObj: Record<string, string> = {};
  const emptyCA = new Set<string>();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
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
            onCAOpen={() => {}}
            caSubmitted={emptyCA}
          />
        ))}
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────
export default function JoltListPreviewPage() {
  const [items, setItems] = useState<PreviewItem[]>(FALLBACK_ITEMS);
  const [listName, setListName] = useState('Opening Checklist');
  const [scoringOn, setScoringOn] = useState(false);

  const [answers, setAnswers] = useState<Record<string, ItemAnswer>>({});
  const [naItems, setNaItems] = useState<Set<string>>(new Set());
  const [oooItems, setOooItems] = useState<Set<string>>(new Set());
  const [assignedItems, setAssignedItems] = useState<Record<string, string>>({});
  const [caSubmitted, setCaSubmitted] = useState<Set<string>>(new Set());
  const [caOpenId, setCaOpenId] = useState<string | null>(null);

  const [sublistOpenId, setSublistOpenId] = useState<string | null>(null);
  const [subAnswers, setSubAnswers] = useState<Record<string, Record<string, ItemAnswer>>>({});
  const [subNaItems, setSubNaItems] = useState<Record<string, Set<string>>>({});
  const [refreshSpin, setRefreshSpin] = useState(false);
  const [infoOpenFile, setInfoOpenFile] = useState<string | null>(null);
  const [infoModalY, setInfoModalY] = useState(0);
  const [printerModalY, setPrinterModalY] = useState<number | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem('jolt-preview-payload');
    if (!raw) return;
    try {
      const payload = JSON.parse(raw) as { listName: string; scoringOn: boolean; items: PreviewItem[] };
      setItems(payload.items ?? FALLBACK_ITEMS);
      setListName(payload.listName ?? 'Preview');
      setScoringOn(payload.scoringOn ?? false);
    } catch {}
  }, []);

  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key !== 'jolt-preview-payload' || !e.newValue) return;
      try {
        const payload = JSON.parse(e.newValue) as { listName: string; scoringOn: boolean; items: PreviewItem[] };
        setItems(payload.items ?? FALLBACK_ITEMS);
        setListName(payload.listName ?? 'Preview');
        setScoringOn(payload.scoringOn ?? false);
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
    setSubNaItems({});
  };

  const submitCA = () => {
    if (!caOpenId) return;
    setCaSubmitted(prev => new Set([...prev, caOpenId]));
    setAnswers(prev => { const n = { ...prev }; delete n[caOpenId]; return n; });
    setCaOpenId(null);
  };

  const caItem = caOpenId ? items.find(i => i.id === caOpenId) : null;
  const sublistItem = sublistOpenId ? items.find(i => i.id === sublistOpenId) : null;
  const visibleItems = items.filter(item => isItemVisible(item, answers));
  const isOverlayOpen = !!(caOpenId || sublistOpenId);

  return (
    <>
    <style>{`@keyframes preview-refresh { from { transform: rotate(0deg); } to { transform: rotate(360deg); } } .preview-refresh-spin { animation: preview-refresh 0.5s ease-out; }`}</style>
    <div style={{ fontFamily: FONT, minHeight: '100vh', background: SURFACE_0, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ width: '100%', maxWidth: 420, display: 'flex', flexDirection: 'column', minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
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
                onCAOpen={setCaOpenId}
                caSubmitted={caSubmitted}
                sublistProgress={item.type === 'sublist' ? getSublistProgress(item) : undefined}
                onSublistOpen={id => setSublistOpenId(id)}
                onInfoOpen={(file, y) => { setInfoOpenFile(file); setInfoModalY(y); }}
                onPrinterOpen={y => setPrinterModalY(y)}
              />
            ))}
          </div>

          {/* CA overlay */}
          {caOpenId && caItem && (
            <div style={{ position: 'absolute', inset: 0, background: 'white', zIndex: 10 }}>
              <CASurface itemPrompt={caItem.prompt} onBack={() => setCaOpenId(null)} onSubmit={submitCA} />
            </div>
          )}

          {/* Sublist overlay */}
          {sublistOpenId && sublistItem && (
            <div style={{ position: 'absolute', inset: 0, background: 'white', zIndex: 10 }}>
              <SublistSurface
                item={sublistItem}
                answers={subAnswers[sublistOpenId] ?? {}}
                naItems={subNaItems[sublistOpenId] ?? new Set()}
                onAnswer={(id, val) => handleSubAnswer(sublistOpenId, id, val)}
                onNA={id => handleSubNA(sublistOpenId, id)}
                onClearNA={id => handleClearSubNA(sublistOpenId, id)}
                onBack={() => setSublistOpenId(null)}
                scoringOn={scoringOn}
              />
            </div>
          )}
        </div>
      </div>

      {/* Preview watermark */}
      <div style={{ position: 'fixed', bottom: 12, left: '50%', transform: 'translateX(-50%)', background: 'rgba(0,0,0,0.5)', color: 'white', fontSize: 11, fontWeight: 600, padding: '4px 12px', borderRadius: 20, letterSpacing: '0.05em', pointerEvents: 'none', textTransform: 'uppercase' }}>
        Preview — {listName}
      </div>

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
