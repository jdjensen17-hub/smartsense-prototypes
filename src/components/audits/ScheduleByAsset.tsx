// Schedule-by-asset authoring for Audit templates (LW-17820).
// Both cards live on the list editor Audits tab, above the status content.

import { useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import {
  auditSetup,
  AUDITOR_LOCATIONS,
  defaultEndDateISO,
  DUE_UNITS,
  endListLabel,
  FREQUENCY_LABELS,
  FREQUENCY_ORDER,
  MONTHS,
  newScheduleRow,
  OPEN_B_ROLES,
  peopleForRole,
  peopleLabels,
  schedulePreview,
  useAuditSetup,
  type AudienceRow,
  type AuditScheduleRow,
  type DueUnit,
} from '@/data/auditSetup';

const T = {
  surface1: '#F7F7FA',
  surface2: '#FFFFFF',
  textPrimary: '#1A1A1F',
  textSecondary: '#5C5C6E',
  textMuted: '#9898A8',
  textAccent: '#185FA5',
  border: 'rgba(26,26,31,0.12)',
  borderStrong: 'rgba(26,26,31,0.22)',
  borderAccent: '#378ADD',
  fillAccent: '#378ADD',
  bgAccent: '#E6F1FB',
  onAccent: '#FFFFFF',
  font: "'Inter', -apple-system, sans-serif",
};

const inputStyle: React.CSSProperties = {
  fontFamily: T.font,
  fontSize: 13,
  color: T.textPrimary,
  background: T.surface2,
  border: `0.5px solid ${T.borderStrong}`,
  borderRadius: 6,
  padding: '7px 10px',
  width: '100%',
};

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  padding: '7px 28px 7px 10px',
  appearance: 'none',
  cursor: 'pointer',
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%239898A8'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 8px center',
};

export const SCHEDULE_TIP = 'Add a schedule to control when the audits will display for your auditors. The audits display in the auditor locations, not in the audited inspection sites.';
export const AUDIENCE_TIP = 'Audit instances are placed into auditor locations in the Audits content group that owns this template.';
const ONCE_TIP = 'Ranked high — audits change often';

function FieldLabel({ children, required, hint }: { children: ReactNode; required?: boolean; hint?: string }) {
  return (
    <div style={{ fontSize: 12, fontWeight: 500, color: T.textSecondary, marginBottom: 6 }}>
      {children}
      {required && <span style={{ color: '#EF5350', marginLeft: 2 }}>*</span>}
      {hint && <span style={{ color: T.textMuted, fontStyle: 'italic', marginLeft: 4 }}>{hint}</span>}
    </div>
  );
}

function LinkBtn({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{ fontFamily: T.font, fontSize: 12, fontWeight: 500, color: T.textAccent, background: T.bgAccent, border: `0.5px solid ${T.borderAccent}`, borderRadius: 5, padding: '5px 10px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5 }}
    >
      {children}
    </button>
  );
}

function PrimaryBtn({ children, onClick, disabled }: { children: ReactNode; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      style={{ fontFamily: T.font, fontSize: 13, fontWeight: 600, color: T.onAccent, background: T.fillAccent, border: 'none', borderRadius: 6, padding: '8px 16px', cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.45 : 1, display: 'inline-flex', alignItems: 'center', gap: 6 }}
    >
      {children}
    </button>
  );
}

function GhostBtn({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{ fontFamily: T.font, fontSize: 13, fontWeight: 500, color: T.textSecondary, background: T.surface2, border: `0.5px solid ${T.borderStrong}`, borderRadius: 6, padding: '8px 14px', cursor: 'pointer' }}
    >
      {children}
    </button>
  );
}

function EmptyCta({ title, body, children }: { title: string; body: string; children: ReactNode }) {
  return (
    <div style={{ textAlign: 'center', padding: '32px 20px', border: `1px dashed ${T.borderStrong}`, borderRadius: 10, background: T.surface1 }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: T.textPrimary, marginBottom: 6 }}>{title}</div>
      <p style={{ margin: '0 auto 14px', fontSize: 12, color: T.textMuted, maxWidth: 420, lineHeight: 1.45 }}>{body}</p>
      {children}
    </div>
  );
}

/** Grey bordered card used by both schedule rows and audience rows. */
function RowCard({ children }: { children: ReactNode }) {
  return (
    <div style={{ padding: '12px 14px', border: `0.5px solid ${T.border}`, borderRadius: 8, background: T.surface1, marginBottom: 8 }}>
      {children}
    </div>
  );
}

function PersonChip({ label }: { label: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: T.fillAccent, color: T.onAccent, borderRadius: 14, padding: '4px 10px', fontSize: 12, fontWeight: 500 }}>
      {label}
    </span>
  );
}

function ModalShell({ title, onClose, children, footer }: { title: string; onClose: () => void; children: ReactNode; footer: ReactNode }) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return createPortal(
    <div
      role="presentation"
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(26,26,31,0.45)', zIndex: 90, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '8vh 16px' }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        style={{ width: '100%', maxWidth: 560, maxHeight: '84vh', overflow: 'auto', background: T.surface2, borderRadius: 12, boxShadow: '0 16px 48px rgba(0,0,0,0.22)', fontFamily: T.font }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: `0.5px solid ${T.border}` }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: T.textPrimary }}>{title}</div>
          <button type="button" aria-label="Close" onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', color: T.textMuted, fontSize: 16 }}>✕</button>
        </div>
        <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 20 }}>{children}</div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, padding: '12px 18px', borderTop: `0.5px solid ${T.border}` }}>{footer}</div>
      </div>
    </div>,
    document.body,
  );
}

// ── Audit schedule ────────────────────────────────────────────────────────
export function AuditScheduleSection({ templateId, onDirty }: { templateId: string; onDirty: () => void }) {
  const { schedules } = useAuditSetup(templateId);
  const [draft, setDraft] = useState<AuditScheduleRow | null>(null);
  const [draftIndex, setDraftIndex] = useState<number | null>(null);

  const openAdd = () => { setDraftIndex(null); setDraft(newScheduleRow()); };
  const openEdit = (index: number) => { setDraftIndex(index); setDraft({ ...schedules[index] }); };

  const save = () => {
    if (!draft) return;
    const isOnce = draft.frequency === 'once';
    auditSetup.upsertSchedule(templateId, {
      ...draft,
      startDay: Math.min(31, Math.max(1, draft.startDay || 1)),
      dueAmount: Math.max(1, draft.dueAmount || 30),
      endMode: isOnce ? 'none' : draft.endMode,
      endDate: draft.endDate || defaultEndDateISO(),
    });
    setDraft(null);
    onDirty();
  };

  return (
    <>
      {schedules.length === 0 ? (
        <EmptyCta title="No schedule configured" body="Adding a schedule determines when the audits will display and when they are due.">
          <PrimaryBtn onClick={openAdd}><i className="ti ti-calendar-plus" /> Add schedule</PrimaryBtn>
        </EmptyCta>
      ) : (
        <>
          {schedules.map((row, index) => {
            const endLabel = endListLabel(row);
            return (
              <RowCard key={row.id}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: T.textPrimary, marginBottom: 2 }}>
                      {FREQUENCY_LABELS[row.frequency]}
                      {endLabel && <span style={{ fontWeight: 500, color: T.textMuted }}> · {endLabel}</span>}
                    </div>
                    <div style={{ fontSize: 12, color: T.textSecondary, lineHeight: 1.4 }}>{schedulePreview(row)}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <LinkBtn onClick={() => openEdit(index)}><i className="ti ti-pencil" /> Edit</LinkBtn>
                    <LinkBtn onClick={() => { auditSetup.removeSchedule(templateId, row.id); onDirty(); }}><i className="ti ti-trash" /> Remove</LinkBtn>
                  </div>
                </div>
              </RowCard>
            );
          })}
          <div style={{ marginTop: 10 }}>
            <LinkBtn onClick={openAdd}><i className="ti ti-plus" /> Add schedule</LinkBtn>
          </div>
        </>
      )}
      {draft && (
        <ScheduleModal
          draft={draft}
          title={draftIndex === null ? 'Add schedule' : `Edit schedule ${draftIndex + 1}`}
          onChange={(patch) => setDraft((current) => (current ? { ...current, ...patch } : current))}
          onCancel={() => setDraft(null)}
          onSave={save}
        />
      )}
    </>
  );
}

function ScheduleModal({ draft, title, onChange, onCancel, onSave }: {
  draft: AuditScheduleRow;
  title: string;
  onChange: (patch: Partial<AuditScheduleRow>) => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  const isOnce = draft.frequency === 'once';
  return (
    <ModalShell
      title={title}
      onClose={onCancel}
      footer={<><GhostBtn onClick={onCancel}>Cancel</GhostBtn><PrimaryBtn onClick={onSave}>Save schedule</PrimaryBtn></>}
    >
      <div>
        <FieldLabel required>Frequency</FieldLabel>
        <div role="group" aria-label="Frequency" style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {FREQUENCY_ORDER.map((frequency) => {
            const on = draft.frequency === frequency;
            return (
              <button
                key={frequency}
                type="button"
                title={frequency === 'once' ? ONCE_TIP : undefined}
                onClick={() => onChange({ frequency })}
                style={{ fontFamily: T.font, fontSize: 12, fontWeight: 500, padding: '7px 12px', borderRadius: 6, cursor: 'pointer', border: `0.5px solid ${on ? T.fillAccent : T.borderStrong}`, background: on ? T.fillAccent : T.surface1, color: on ? T.onAccent : T.textSecondary }}
              >
                {FREQUENCY_LABELS[frequency]}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div>
          <FieldLabel required>Start month</FieldLabel>
          <select aria-label="Start month" value={draft.startMonth} onChange={(e) => onChange({ startMonth: Number(e.target.value) })} style={selectStyle}>
            {MONTHS.map((month, index) => <option key={month} value={index}>{month}</option>)}
          </select>
        </div>
        <div>
          <FieldLabel hint="(day of month)">Start date</FieldLabel>
          <input
            type="number"
            aria-label="Start day"
            min={1}
            max={31}
            value={draft.startDay}
            onChange={(e) => onChange({ startDay: Math.min(31, Math.max(1, Number(e.target.value) || 1)) })}
            style={inputStyle}
          />
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <FieldLabel required>Due</FieldLabel>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="number"
              aria-label="Due amount"
              min={1}
              value={draft.dueAmount}
              onChange={(e) => onChange({ dueAmount: Math.max(1, Number(e.target.value) || 1) })}
              style={{ ...inputStyle, width: 88 }}
            />
            <select aria-label="Due unit" value={draft.dueUnit} onChange={(e) => onChange({ dueUnit: e.target.value as DueUnit })} style={{ ...selectStyle, width: 140 }}>
              {DUE_UNITS.map((unit) => <option key={unit} value={unit}>{unit}</option>)}
            </select>
            <span style={{ fontSize: 12, color: T.textMuted, fontStyle: 'italic' }}>after displays</span>
          </div>
        </div>
        {!isOnce && (
          <div style={{ gridColumn: '1 / -1' }}>
            <FieldLabel>End</FieldLabel>
            <select
              aria-label="End"
              value={draft.endMode}
              onChange={(e) => onChange({ endMode: e.target.value as 'none' | 'date', endDate: draft.endDate || defaultEndDateISO() })}
              style={selectStyle}
            >
              <option value="none">No end</option>
              <option value="date">On date</option>
            </select>
            {draft.endMode === 'date' && (
              <input
                type="date"
                aria-label="End date"
                value={draft.endDate}
                onChange={(e) => onChange({ endDate: e.target.value || defaultEndDateISO() })}
                style={{ ...inputStyle, width: 200, marginTop: 8 }}
              />
            )}
          </div>
        )}
      </div>

      <div>
        <FieldLabel>Schedule preview</FieldLabel>
        <div style={{ background: T.bgAccent, border: `0.5px solid ${T.borderAccent}`, color: T.textAccent, borderRadius: 8, padding: '10px 12px', fontSize: 13, lineHeight: 1.45 }}>
          {schedulePreview(draft)}
        </div>
      </div>
    </ModalShell>
  );
}

// ── Audiences ─────────────────────────────────────────────────────────────
type AudienceDraft = { id: string; role: string | null; peopleMode: 'all' | 'specific' | null; peopleIds: string[] };

export function AudiencesSection({ templateId, onDirty }: { templateId: string; onDirty: () => void }) {
  const { audiences } = useAuditSetup(templateId);
  const [draft, setDraft] = useState<AudienceDraft | null>(null);

  const openAdd = () => setDraft({ id: `aud-${Math.random().toString(36).slice(2, 9)}`, role: null, peopleMode: null, peopleIds: [] });
  const openEdit = (row: AudienceRow) => setDraft({ ...row, peopleIds: [...row.peopleIds] });

  const save = () => {
    if (!draft?.role || !draft.peopleMode) return;
    auditSetup.upsertAudience(templateId, {
      id: draft.id,
      role: draft.role,
      peopleMode: draft.peopleMode,
      peopleIds: draft.peopleMode === 'all' ? [] : [...draft.peopleIds],
    });
    setDraft(null);
    onDirty();
  };

  const multi = audiences.length > 1;

  return (
    <>
      {audiences.length === 0 ? (
        <EmptyCta title="No audience configured" body="Pick an auditor role and people so generation can match inspection-site assets and place instances into auditor locations.">
          <PrimaryBtn onClick={openAdd}><i className="ti ti-users" /> Configure audience</PrimaryBtn>
        </EmptyCta>
      ) : (
        <>
          {audiences.map((row, index) => (
            <RowCard key={row.id}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12, color: T.textMuted, marginBottom: 6 }}>
                <span>Audience {index + 1}{multi && index > 0 && <em> (OR)</em>}</span>
                <span style={{ display: 'flex', gap: 6 }}>
                  <LinkBtn onClick={() => openEdit(row)}><i className="ti ti-pencil" /> Edit</LinkBtn>
                  <LinkBtn onClick={() => { auditSetup.removeAudience(templateId, row.id); onDirty(); }}>
                    <i className="ti ti-trash" /> {multi ? 'Remove' : 'Clear'}
                  </LinkBtn>
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'baseline', fontSize: 13, color: T.textPrimary }}>
                  <span style={{ color: T.textMuted, width: 90, flexShrink: 0, fontSize: 12 }}>Role</span>
                  <span>{row.role}</span>
                </div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'baseline' }}>
                  <span style={{ color: T.textMuted, width: 90, flexShrink: 0, fontSize: 12 }}>People</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {peopleLabels(row).map((label) => <PersonChip key={label} label={label} />)}
                  </div>
                </div>
              </div>
            </RowCard>
          ))}
          <div style={{ marginTop: 10 }}>
            <LinkBtn onClick={openAdd}><i className="ti ti-plus" /> Add audience</LinkBtn>
          </div>
        </>
      )}
      {draft && (
        <AudienceModal
          draft={draft}
          onChange={(patch) => setDraft((current) => (current ? { ...current, ...patch } : current))}
          onCancel={() => setDraft(null)}
          onSave={save}
        />
      )}
    </>
  );
}

function AudienceModal({ draft, onChange, onCancel, onSave }: {
  draft: AudienceDraft;
  onChange: (patch: Partial<AudienceDraft>) => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  const [peopleOpen, setPeopleOpen] = useState(false);
  const people = peopleForRole(draft.role);
  const selected = people.filter((person) => draft.peopleIds.includes(person.id));
  const remaining = people.filter((person) => !draft.peopleIds.includes(person.id));
  const canSave = !!draft.role && (draft.peopleMode === 'all' || (draft.peopleMode === 'specific' && draft.peopleIds.length > 0));

  return (
    <ModalShell
      title="Configure audience"
      onClose={onCancel}
      footer={<><GhostBtn onClick={onCancel}>Cancel</GhostBtn><PrimaryBtn disabled={!canSave} onClick={onSave}>Done</PrimaryBtn></>}
    >
      <div>
        <FieldLabel required>Select role</FieldLabel>
        <select
          aria-label="Select role"
          value={draft.role ?? ''}
          onChange={(e) => {
            // People default to All whenever the role changes.
            setPeopleOpen(false);
            onChange({ role: e.target.value || null, peopleMode: e.target.value ? 'all' : null, peopleIds: [] });
          }}
          style={{ ...selectStyle, color: draft.role ? T.textPrimary : T.textMuted }}
        >
          <option value="">Select role…</option>
          {OPEN_B_ROLES.map((role) => <option key={role} value={role}>{role}</option>)}
        </select>
        <div style={{ marginTop: 6, fontSize: 12, color: T.textMuted, fontStyle: 'italic' }}>
          Select from roles linked to person items on the Inspection Site asset template.
        </div>
      </div>

      <div>
        <FieldLabel required>Select people</FieldLabel>
        <div
          onClick={() => { if (draft.role && draft.peopleMode !== 'all') setPeopleOpen(true); }}
          style={{ minHeight: 40, border: `0.5px solid ${T.borderStrong}`, borderRadius: 6, background: T.surface1, padding: '6px 8px', display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center', cursor: draft.role ? 'text' : 'default' }}
        >
          {!draft.role && <span style={{ fontSize: 12, color: T.textMuted, fontStyle: 'italic' }}>Select a role first</span>}
          {draft.role && draft.peopleMode === 'all' && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: T.fillAccent, color: T.onAccent, borderRadius: 14, padding: '4px 10px', fontSize: 12, fontWeight: 500 }}>
              All
              <button
                type="button"
                aria-label="Remove All"
                onClick={(e) => { e.stopPropagation(); onChange({ peopleMode: 'specific', peopleIds: [] }); setPeopleOpen(true); }}
                style={{ border: 'none', background: 'none', color: 'inherit', cursor: 'pointer', fontSize: 12, padding: 0, lineHeight: 1 }}
              >
                ✕
              </button>
            </span>
          )}
          {draft.role && draft.peopleMode !== 'all' && selected.map((person) => (
            <span key={person.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: T.fillAccent, color: T.onAccent, borderRadius: 14, padding: '4px 10px', fontSize: 12, fontWeight: 500 }}>
              {person.name}
              <button
                type="button"
                aria-label={`Remove ${person.name}`}
                onClick={(e) => { e.stopPropagation(); onChange({ peopleIds: draft.peopleIds.filter((id) => id !== person.id) }); }}
                style={{ border: 'none', background: 'none', color: 'inherit', cursor: 'pointer', fontSize: 12, padding: 0, lineHeight: 1 }}
              >
                ✕
              </button>
            </span>
          ))}
          {draft.role && draft.peopleMode !== 'all' && selected.length === 0 && (
            <span style={{ fontSize: 12, color: T.textMuted, fontStyle: 'italic' }}>Select people…</span>
          )}
        </div>
        {peopleOpen && draft.peopleMode === 'specific' && (
          <div style={{ marginTop: 4, border: `0.5px solid ${T.borderStrong}`, borderRadius: 8, background: T.surface2, maxHeight: 200, overflow: 'auto', boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}>
            {remaining.length === 0 ? (
              <div style={{ padding: '9px 12px', fontSize: 13, color: T.textMuted }}>All people selected</div>
            ) : remaining.map((person) => (
              <div
                key={person.id}
                onClick={() => onChange({ peopleMode: 'specific', peopleIds: [...draft.peopleIds, person.id] })}
                style={{ padding: '9px 12px', fontSize: 13, color: T.textPrimary, cursor: 'pointer' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = T.bgAccent; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
              >
                {person.name}
                {person.auditorLocIds.length === 0 && <span style={{ color: T.textMuted, fontSize: 12 }}> · no auditor location</span>}
                {person.auditorLocIds.length > 1 && (
                  <span style={{ color: T.textMuted, fontSize: 12 }}> · {person.auditorLocIds.map((id) => AUDITOR_LOCATIONS[id]).join(', ')}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </ModalShell>
  );
}
