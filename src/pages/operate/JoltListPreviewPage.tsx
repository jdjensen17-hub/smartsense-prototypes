import React, { useState } from 'react';

// ── Design tokens ───────────────────────────────────────────────────────────
const APP_BLUE = '#2979C7';
const SURFACE_0 = '#F0F0F2';
const SURFACE_1 = '#F7F7FA';
const BORDER = 'rgba(26,26,31,0.12)';
const TEXT_PRIMARY = '#1A1A1F';
const TEXT_SECONDARY = '#5C5C6E';
const TEXT_MUTED = '#9898A8';
const FONT = "'Inter', -apple-system, sans-serif";

// ── Types ──────────────────────────────────────────────────────────────────
type YNAnswer = 'Yes' | 'No' | null;
type ItemAnswer = string | number | boolean | null;

interface PreviewItem {
  id: string;
  prompt: string;
  type: string;
  stripe?: string;
  allowNA?: boolean;
  dcParentId?: string;
  dcConditionType?: 'yn' | 'measurement';
  dcConditionValue?: string | number;
  dcConditionOp?: string;
  caList?: string[];
  flagEmoji?: string;
  pointsValue?: number;
  ratingMin?: number;
  ratingMax?: number;
  choices?: { id: string; label: string; color: string }[];
  infoLibrary?: boolean;
}

// ── Sample data ────────────────────────────────────────────────────────────
const ITEMS: PreviewItem[] = [
  { id: 'cooler-ok', prompt: 'Walk-in cooler temp OK?', type: 'yn', stripe: '#5CA6D9', allowNA: false, caList: ['Correct Immediately','Discard','Notify Manager','Review With Employee'], flagEmoji: '🌡️', pointsValue: 25, infoLibrary: false },
  { id: 'ca-photo', prompt: 'Take corrective action photo', type: 'photo', stripe: '', allowNA: true, dcParentId: 'cooler-ok', dcConditionType: 'yn', dcConditionValue: 'No' },
  { id: 'sign-off', prompt: 'Sign off opening inspection', type: 'signature', stripe: '' },
  { id: 'prep-temp', prompt: 'Record prep cooler temp °F', type: 'measurement', stripe: '#C1E1C5', allowNA: true, pointsValue: 25 },
  { id: 'ca-notes', prompt: 'Log corrective action notes', type: 'free', stripe: '', dcParentId: 'prep-temp', dcConditionType: 'measurement', dcConditionOp: '>=', dcConditionValue: 41 },
  { id: 'date-labels', prompt: 'All date labels current', type: 'checkmark', stripe: '' },
  { id: 'handwashing', prompt: 'Handwashing stations stocked', type: 'yn', stripe: '', pointsValue: 10 },
  { id: 'vendor-mc', prompt: 'Preferred vendor for shortfall?', type: 'mc', stripe: '', choices: [
    { id: 'c1', label: 'Sysco', color: '#4CAF50' },
    { id: 'c2', label: 'US Foods', color: '#2196F3' },
    { id: 'c3', label: 'Performance Food Group', color: '#FF9800' },
  ]},
  { id: 'temp-guidelines', prompt: 'Temperature Guidelines', type: 'subtitle', stripe: '' },
  { id: 'kitchen-rate', prompt: 'Rate overall kitchen cleanliness', type: 'rating', stripe: '', ratingMin: 1, ratingMax: 5, pointsValue: 15 },
];

// ── Helpers ────────────────────────────────────────────────────────────────
function isItemVisible(item: PreviewItem, answers: Record<string, ItemAnswer>): boolean {
  if (!item.dcParentId) return true;
  const parentAnswer = answers[item.dcParentId];
  if (parentAnswer === null || parentAnswer === undefined) return false;
  if (item.dcConditionType === 'yn') {
    return parentAnswer === item.dcConditionValue;
  }
  if (item.dcConditionType === 'measurement') {
    const numAnswer = Number(parentAnswer);
    const numCond = Number(item.dcConditionValue);
    if (isNaN(numAnswer)) return false;
    switch (item.dcConditionOp) {
      case '>': return numAnswer > numCond;
      case '>=': return numAnswer >= numCond;
      case '=': return numAnswer === numCond;
      case '<=': return numAnswer <= numCond;
      case '<': return numAnswer < numCond;
      default: return false;
    }
  }
  return false;
}

function itemCompleted(item: PreviewItem, answers: Record<string, ItemAnswer>, naItems: Set<string>): boolean {
  if (naItems.has(item.id)) return true;
  const ans = answers[item.id];
  if (item.type === 'subtitle') return true;
  return ans !== null && ans !== undefined && ans !== '';
}

function yesNoTriggerCA(item: PreviewItem, answer: ItemAnswer): boolean {
  return !!(item.caList && item.caList.length > 0 && answer === 'No');
}

// ── App button ─────────────────────────────────────────────────────────────
function AppBtn({ icon, label, onClick, completed }: { icon: string; label: string; onClick?: () => void; completed?: boolean }) {
  return (
    <button onClick={onClick} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, border: `2px solid ${APP_BLUE}`, borderRadius: 8, color: completed ? 'white' : APP_BLUE, fontFamily: FONT, fontSize: 15, fontWeight: 600, padding: '10px 18px', background: completed ? APP_BLUE : 'white', cursor: 'pointer', width: '100%' }}>
      <i className={`ti ${icon}`} style={{ fontSize: 18 }} /> {label}
    </button>
  );
}

// ── YN buttons ─────────────────────────────────────────────────────────────
function YNButtons({ value, onChange }: { value: YNAnswer; onChange: (v: YNAnswer) => void }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
      <button onClick={() => onChange(value === 'YES' as any ? null : 'Yes')} style={{ border: `2px solid ${APP_BLUE}`, background: value === 'Yes' ? APP_BLUE : 'white', color: value === 'Yes' ? 'white' : APP_BLUE, fontFamily: FONT, fontSize: 15, fontWeight: 700, padding: '9px 24px', cursor: 'pointer', borderRadius: '8px 0 0 8px', borderRight: `1px solid ${APP_BLUE}`, letterSpacing: '0.03em' }}>YES</button>
      <button onClick={() => onChange(value === 'No' ? null : 'No')} style={{ border: `2px solid ${APP_BLUE}`, background: value === 'No' ? APP_BLUE : 'white', color: value === 'No' ? 'white' : APP_BLUE, fontFamily: FONT, fontSize: 15, fontWeight: 700, padding: '9px 24px', cursor: 'pointer', borderRadius: '0 8px 8px 0', borderLeft: `1px solid ${APP_BLUE}`, letterSpacing: '0.03em' }}>NO</button>
    </div>
  );
}

// ── Rating buttons ─────────────────────────────────────────────────────────
function RatingButtons({ min, max, value, onChange }: { min: number; max: number; value: number | null; onChange: (v: number | null) => void }) {
  const nums = Array.from({ length: max - min + 1 }, (_, i) => i + min);
  return (
    <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
      {nums.map(n => (
        <button key={n} onClick={() => onChange(value === n ? null : n)} style={{ flex: 1, border: `2px solid ${APP_BLUE}`, borderRadius: 8, background: value === n ? APP_BLUE : 'white', color: value === n ? 'white' : APP_BLUE, fontFamily: FONT, fontSize: 14, fontWeight: 600, padding: '9px 4px', cursor: 'pointer', textAlign: 'center' }}>{n}</button>
      ))}
    </div>
  );
}

// ── Score bar ──────────────────────────────────────────────────────────────
function ScoreBar({ items, answers, naItems }: { items: PreviewItem[]; answers: Record<string, ItemAnswer>; naItems: Set<string> }) {
  const scoreable = items.filter(i => i.pointsValue && i.type !== 'subtitle');
  const possible = scoreable.reduce((sum, i) => sum + (i.pointsValue ?? 0), 0);
  const earned = scoreable.filter(i => itemCompleted(i, answers, naItems) && !naItems.has(i.id)).reduce((sum, i) => sum + (i.pointsValue ?? 0), 0);
  if (!possible) return null;
  const pct = Math.round((earned / possible) * 10000) / 100;
  return (
    <div style={{ background: 'white', borderBottom: `1px solid ${BORDER}`, padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: TEXT_SECONDARY }}>
      <i className="ti ti-trophy" style={{ fontSize: 14, color: TEXT_MUTED }} />
      <span>Score</span>
      <span style={{ fontWeight: 600, color: TEXT_PRIMARY }}>{pct.toFixed(2)}%</span>
      <span style={{ color: TEXT_MUTED, fontSize: 12 }}>({earned} / {possible} pts)</span>
    </div>
  );
}

// ── Item card ──────────────────────────────────────────────────────────────
function ItemCard({ item, answer, naItems, onAnswer, onNA, onClearNA, onCASubmit, caAnswers, caSubmitted }: {
  item: PreviewItem;
  answer: ItemAnswer;
  naItems: Set<string>;
  onAnswer: (id: string, val: ItemAnswer) => void;
  onNA: (id: string) => void;
  onClearNA: (id: string) => void;
  onCASubmit: (id: string) => void;
  caAnswers: Record<string, string>;
  caSubmitted: Set<string>;
}) {
  const [kebabOpen, setKebabOpen] = useState(false);
  const [caSelected, setCaSelected] = useState('');
  const [measInput, setMeasInput] = useState('');
  const [showMeasModal, setShowMeasModal] = useState(false);
  const isNA = naItems.has(item.id);
  const completed = itemCompleted(item, { [item.id]: answer }, isNA ? new Set([item.id]) : new Set());
  const showCA = !caSubmitted.has(item.id) && yesNoTriggerCA(item, answer);
  const now = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ' ' + new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

  if (item.type === 'subtitle') {
    return (
      <div style={{ background: 'white', borderBottom: `1px solid ${BORDER}`, padding: '12px 16px' }}>
        <div style={{ fontSize: 14, color: TEXT_SECONDARY, lineHeight: 1.5 }}>{item.prompt}</div>
      </div>
    );
  }

  return (
    <div style={{ background: completed && !showCA ? '#EBF5FF' : 'white', borderBottom: `1px solid ${BORDER}`, padding: '14px 16px 12px', position: 'relative' }}>
      {/* Info library badge */}
      {item.infoLibrary && (
        <div style={{ width: 28, height: 28, background: APP_BLUE, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
          <i className="ti ti-info-circle" style={{ color: 'white', fontSize: 15 }} />
        </div>
      )}

      {/* Row: prompt + icons */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
        <div style={{ fontSize: 15, color: TEXT_PRIMARY, lineHeight: 1.35, flex: 1 }}>{item.prompt}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, position: 'relative' }}>
          {item.flagEmoji && answer === 'No' && <span style={{ fontSize: 20 }}>{item.flagEmoji}</span>}
          <div onClick={() => setKebabOpen(v => !v)} style={{ color: TEXT_MUTED, fontSize: 16, cursor: 'pointer' }}>
            <i className="ti ti-dots-vertical" />
          </div>
          {kebabOpen && (
            <div style={{ position: 'absolute', right: 0, top: 24, background: 'white', borderRadius: 10, boxShadow: '0 4px 20px rgba(0,0,0,0.15)', overflow: 'hidden', width: 220, zIndex: 10 }}>
              {completed && (
                <div onClick={() => { onAnswer(item.id, null); onClearNA(item.id); setKebabOpen(false); }} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', fontSize: 15, color: '#C0282F', borderBottom: `1px solid ${BORDER}`, cursor: 'pointer' }}>
                  <i className="ti ti-rotate-clockwise" style={{ fontSize: 18, color: '#C0282F' }} /> Clear response
                </div>
              )}
              {!completed && item.allowNA && (
                <div onClick={() => { onNA(item.id); setKebabOpen(false); }} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', fontSize: 15, color: TEXT_PRIMARY, cursor: 'pointer' }}>
                  <i className="ti ti-ban" style={{ fontSize: 18, color: TEXT_SECONDARY }} /> Mark as N/A
                </div>
              )}
              {!completed && !item.allowNA && (
                <div style={{ padding: '14px 20px', fontSize: 13, color: TEXT_MUTED }}>No actions available</div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* N/A state */}
      {isNA ? (
        <button style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', border: '1.5px solid #C8C8D0', borderRadius: 8, color: TEXT_MUTED, fontFamily: FONT, fontSize: 15, fontWeight: 500, padding: '10px 18px', background: SURFACE_1, width: '100%', cursor: 'pointer' }}>N/A</button>
      ) : (
        <>
          {/* Answer control */}
          {item.type === 'yn' && (
            <div style={{ marginBottom: showCA ? 8 : 0 }}>
              <YNButtons value={answer as YNAnswer} onChange={v => { onAnswer(item.id, v); }} />
            </div>
          )}
          {item.type === 'checkmark' && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 0 }}>
              <div onClick={() => onAnswer(item.id, answer ? null : true)} style={{ width: 40, height: 40, borderRadius: '50%', border: `2.5px solid ${APP_BLUE}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: answer ? APP_BLUE : 'white' }}>
                <i className="ti ti-check" style={{ fontSize: 20, color: answer ? 'white' : APP_BLUE }} />
              </div>
            </div>
          )}
          {item.type === 'measurement' && (
            answer ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8, border: `2px solid ${APP_BLUE}`, borderRadius: 8, padding: '10px 18px', background: 'white', width: '100%', fontSize: 17, fontWeight: 700, color: TEXT_PRIMARY }}>
                <i className="ti ti-calculator" style={{ fontSize: 18, color: APP_BLUE }} /> {answer} °F
              </div>
            ) : (
              <>
                <AppBtn icon="ti-calculator" label="Enter value" onClick={() => setShowMeasModal(true)} />
                {showMeasModal && (
                  <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
                    <div style={{ background: 'white', borderRadius: 12, padding: 24, width: 280, fontFamily: FONT }}>
                      <div style={{ fontSize: 15, fontWeight: 600, color: TEXT_PRIMARY, marginBottom: 16 }}>Enter temperature (°F)</div>
                      <input type="number" value={measInput} onChange={e => setMeasInput(e.target.value)} placeholder="0.00" style={{ fontFamily: FONT, fontSize: 20, fontWeight: 700, border: `2px solid ${APP_BLUE}`, borderRadius: 8, padding: '10px 14px', width: '100%', textAlign: 'right', marginBottom: 16 }} />
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
          {item.type === 'photo' && (
            <AppBtn icon="ti-camera" label={answer ? 'Photo taken ✓' : 'Take Photo'} completed={!!answer} onClick={() => onAnswer(item.id, answer ? null : 'photo-taken')} />
          )}
          {item.type === 'signature' && (
            <AppBtn icon="ti-pencil" label={answer ? 'Signed ✓' : 'Signature'} completed={!!answer} onClick={() => onAnswer(item.id, answer ? null : 'signed')} />
          )}
          {item.type === 'free' && (
            <textarea value={(answer as string) ?? ''} onChange={e => onAnswer(item.id, e.target.value)} placeholder="Free Response..." style={{ width: '100%', border: '1.5px solid #C8C8D0', borderRadius: 8, background: SURFACE_1, fontFamily: FONT, fontSize: 14, color: answer ? TEXT_PRIMARY : TEXT_MUTED, padding: 12, resize: 'none', minHeight: 72, boxSizing: 'border-box' }} />
          )}
          {item.type === 'short' && (
            <input value={(answer as string) ?? ''} onChange={e => onAnswer(item.id, e.target.value)} placeholder="Short Answer..." style={{ width: '100%', border: '1.5px solid #C8C8D0', borderRadius: 8, background: SURFACE_1, fontFamily: FONT, fontSize: 14, color: answer ? TEXT_PRIMARY : TEXT_MUTED, padding: '10px 12px', boxSizing: 'border-box' }} />
          )}
          {item.type === 'mc' && (
            <button style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, border: `2px solid ${APP_BLUE}`, borderRadius: 8, color: answer ? 'white' : APP_BLUE, fontFamily: FONT, fontSize: 15, fontWeight: 600, padding: '10px 18px', background: answer ? APP_BLUE : 'white', cursor: 'pointer', width: '100%' }}
              onClick={() => {
                const options = item.choices ?? [];
                const currentIdx = options.findIndex(c => c.label === answer);
                const nextIdx = (currentIdx + 1) % (options.length + 1);
                onAnswer(item.id, nextIdx < options.length ? options[nextIdx].label : null);
              }}>
              <i className="ti ti-list" style={{ fontSize: 18 }} />
              {answer ? String(answer) : 'Select option'}
            </button>
          )}

          {/* CA button */}
          {showCA && (
            <button onClick={() => onCASubmit(item.id)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, border: '2px solid #C0282F', borderRadius: 8, color: '#C0282F', fontFamily: FONT, fontSize: 15, fontWeight: 700, padding: '10px 18px', background: 'white', cursor: 'pointer', width: '100%', marginTop: 8 }}>
              <i className="ti ti-alert-circle" style={{ fontSize: 18 }} /> Required action <i className="ti ti-arrow-right" style={{ marginLeft: 4, fontSize: 14 }} />
            </button>
          )}
        </>
      )}

      {/* Footer */}
      {item.type !== 'subtitle' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
          {item.pointsValue && <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: APP_BLUE, color: 'white', fontSize: 11, fontWeight: 700, minWidth: 24, height: 24, padding: '0 5px', borderRadius: 4 }}>{item.pointsValue}</span>}
          {completed ? (
            <span style={{ display: 'inline-flex', alignItems: 'center', background: APP_BLUE, color: 'white', fontSize: 12, fontWeight: 500, padding: '4px 10px', borderRadius: 3, whiteSpace: 'nowrap' }}>Completed · {now}</span>
          ) : (
            <span style={{ display: 'inline-flex', alignItems: 'center', background: '#E8E8EC', color: TEXT_SECONDARY, fontSize: 11, fontWeight: 500, padding: '3px 8px', borderRadius: 3 }}>Incomplete</span>
          )}
        </div>
      )}
    </div>
  );
}

// ── CA surface (slides in) ─────────────────────────────────────────────────
function CASurface({ item, onBack, onSubmit }: { item: PreviewItem; onBack: () => void; onSubmit: () => void }) {
  const [selected, setSelected] = useState('');
  const caList = item.caList ?? ['Correct Immediately', 'Discard', 'Notify Manager'];
  const now = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ' ' + new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* CA header */}
      <div style={{ background: '#5A5A6A', padding: '0 16px', height: 52, display: 'flex', alignItems: 'center', flexShrink: 0 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'white', display: 'flex', alignItems: 'center', gap: 2, fontFamily: FONT, fontSize: 15, fontWeight: 500, cursor: 'pointer', padding: 0, marginRight: 8 }}>
          <i className="ti ti-chevron-left" style={{ fontSize: 18 }} />
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: 'rgba(255,255,255,0.75)', flex: 1, overflow: 'hidden' }}>
          <i className="ti ti-checkbox" style={{ fontSize: 13, opacity: 0.6 }} />
          <strong style={{ color: 'white', fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.prompt}</strong>
        </div>
        <div style={{ background: 'white', borderRadius: 20, display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', fontSize: 12, fontWeight: 600, color: '#C0282F', flexShrink: 0 }}>
          <i className="ti ti-alert-circle" style={{ fontSize: 13 }} /> Required
        </div>
      </div>
      {/* CA list */}
      <div style={{ flex: 1, background: 'white', overflowY: 'auto' }}>
        <div style={{ padding: '12px 16px', borderBottom: `1px solid ${BORDER}`, fontSize: 13, color: TEXT_SECONDARY }}>Select the corrective action you took.</div>
        {caList.map(action => (
          <div key={action} onClick={() => setSelected(action)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderBottom: `1px solid ${BORDER}`, fontSize: 15, cursor: 'pointer' }}>
            <div style={{ width: 20, height: 20, borderRadius: '50%', border: `2px solid ${selected === action ? APP_BLUE : '#C0C0C8'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {selected === action && <div style={{ width: 10, height: 10, borderRadius: '50%', background: APP_BLUE }} />}
            </div>
            <span style={{ color: selected === action ? APP_BLUE : TEXT_PRIMARY, fontWeight: selected === action ? 600 : 400 }}>{action}</span>
          </div>
        ))}
        {selected && (
          <div style={{ display: 'flex', alignItems: 'center', padding: '0 16px 16px' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', background: APP_BLUE, color: 'white', fontSize: 12, fontWeight: 500, padding: '4px 10px', borderRadius: 3 }}>Completed · {now}</span>
          </div>
        )}
      </div>
      {/* Submit */}
      <div style={{ background: 'white', padding: 16, borderTop: `1px solid ${BORDER}`, flexShrink: 0 }}>
        <button onClick={onSubmit} disabled={!selected} style={{ background: selected ? '#27AE60' : '#C0C0C8', color: 'white', border: 'none', borderRadius: 8, fontFamily: FONT, fontSize: 15, fontWeight: 700, padding: '14px 24px', width: '100%', cursor: selected ? 'pointer' : 'default', letterSpacing: '0.03em', textTransform: 'uppercase' }}>
          Submit &amp; Repeat
        </button>
      </div>
    </div>
  );
}

// ── Main preview ────────────────────────────────────────────────────────────
export default function JoltListPreviewPage() {
  const [answers, setAnswers] = useState<Record<string, ItemAnswer>>({});
  const [naItems, setNaItems] = useState<Set<string>>(new Set());
  const [caSubmitted, setCaSubmitted] = useState<Set<string>>(new Set());
  const [caAnswers, setCaAnswers] = useState<Record<string, string>>({});
  const [caOpenId, setCaOpenId] = useState<string | null>(null);

  const setAnswer = (id: string, val: ItemAnswer) => {
    setAnswers(prev => ({ ...prev, [id]: val }));
    // If answer changes, check if children should be hidden (reset their answers)
    const children = ITEMS.filter(i => i.dcParentId === id);
    if (children.length) {
      setAnswers(prev => {
        const next = { ...prev, [id]: val };
        children.forEach(child => {
          const visible = isItemVisible(child, next);
          if (!visible) delete next[child.id];
        });
        return next;
      });
    }
    // If YN No and CA exists, CA button will appear (handled in card render)
    // If answer cleared, CA button disappears
  };

  const setNA = (id: string) => setNaItems(prev => new Set([...prev, id]));
  const clearNA = (id: string) => setNaItems(prev => { const n = new Set(prev); n.delete(id); return n; });

  const openCA = (id: string) => setCaOpenId(id);
  const closeCA = () => setCaOpenId(null);
  const submitCA = () => {
    if (caOpenId) {
      setCaSubmitted(prev => new Set([...prev, caOpenId]));
      // Reset answer so item returns to incomplete
      setAnswers(prev => { const n = { ...prev }; delete n[caOpenId]; return n; });
      setCaOpenId(null);
    }
  };

  const caItem = caOpenId ? ITEMS.find(i => i.id === caOpenId) : null;
  const visibleItems = ITEMS.filter(item => isItemVisible(item, answers));
  const hasScoring = ITEMS.some(i => i.pointsValue);

  return (
    <div style={{ fontFamily: FONT, minHeight: '100vh', background: SURFACE_0, display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 0 }}>
      {/* Preview column */}
      <div style={{ width: '100%', maxWidth: 420, display: 'flex', flexDirection: 'column', minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
        {/* App header */}
        <div style={{ background: APP_BLUE, padding: '0 16px', height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, position: 'sticky', top: 0, zIndex: 20 }}>
          <div style={{ fontSize: 17, fontWeight: 600, color: 'white', flex: 1 }}>Opening Checklist</div>
          <div style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', opacity: 0.85, cursor: 'pointer' }} onClick={() => { setAnswers({}); setNaItems(new Set()); setCaSubmitted(new Set()); }}>
            <i className="ti ti-refresh" style={{ fontSize: 18 }} />
          </div>
        </div>

        {/* Main content — slides: list or CA */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
          {/* List */}
          <div style={{ flex: '0 0 100%', overflowY: 'auto', transform: caOpenId ? 'translateX(-100%)' : 'translateX(0)', transition: 'transform 0.3s ease' }}>
            {hasScoring && <ScoreBar items={visibleItems} answers={answers} naItems={naItems} />}
            <div>
              {visibleItems.map(item => (
                <ItemCard
                  key={item.id}
                  item={item}
                  answer={answers[item.id] ?? null}
                  naItems={naItems}
                  onAnswer={setAnswer}
                  onNA={setNA}
                  onClearNA={clearNA}
                  onCASubmit={openCA}
                  caAnswers={caAnswers}
                  caSubmitted={caSubmitted}
                />
              ))}
            </div>
          </div>

          {/* CA surface */}
          {caOpenId && caItem && (
            <div style={{ position: 'absolute', inset: 0, background: 'white', zIndex: 10 }}>
              <CASurface item={caItem} onBack={closeCA} onSubmit={submitCA} />
            </div>
          )}
        </div>
      </div>

      {/* Preview label at bottom */}
      <div style={{ position: 'fixed', bottom: 12, left: '50%', transform: 'translateX(-50%)', background: 'rgba(0,0,0,0.5)', color: 'white', fontSize: 11, fontWeight: 600, padding: '4px 12px', borderRadius: 20, letterSpacing: '0.05em', pointerEvents: 'none', textTransform: 'uppercase' }}>
        Preview — Opening Checklist
      </div>
    </div>
  );
}
