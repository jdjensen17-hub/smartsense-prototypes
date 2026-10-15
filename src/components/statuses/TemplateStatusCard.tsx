import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { StatusChip } from '@/components/statuses/StatusChip';
import { statusSets, useStatusSets } from '@/data/statusSets';
import {
  defaultStatusOf,
  inFlightLabel,
  pickerSets,
  templateStatus,
  useTemplateStatus,
  type TemplateStatusRecord,
} from '@/data/templateStatus';

const T = {
  surface1: '#F7F7FA',
  surface2: '#FFFFFF',
  textPrimary: '#1A1A1F',
  textSecondary: '#5C5C6E',
  textMuted: '#9898A8',
  textAccent: '#185FA5',
  border: 'rgba(26,26,31,0.12)',
  borderStrong: 'rgba(26,26,31,0.22)',
  fillAccent: '#378ADD',
  bgAccent: '#E6F1FB',
  bgWarning: '#FAEEDA',
  textWarning: '#854F0B',
  onAccent: '#FFFFFF',
  font: "'Inter', -apple-system, sans-serif",
};

const selectStyle: React.CSSProperties = {
  fontFamily: T.font,
  fontSize: 13,
  color: T.textPrimary,
  backgroundColor: T.surface2,
  border: `0.5px solid ${T.borderStrong}`,
  borderRadius: 6,
  padding: '7px 28px 7px 10px',
  appearance: 'none',
  cursor: 'pointer',
  width: '100%',
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%239898A8'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 8px center',
};

const LIST_STATUS_TIP = 'Optionally select a status set for this list to control when the list can be submitted and notify other users when the list enters the status.';
const AUDIT_STATUS_TIP = 'Optionally select a status set for this audit to control when the audit can be submitted and notify other users when the audit enters the status.';

export function TemplateStatusCard({ templateId, collapsible, onDirty }: { templateId: string; collapsible?: boolean; onDirty: () => void }) {
  const template = useTemplateStatus(templateId);
  const emptyLabel = template.type === 'audit' ? 'Audit status not configured' : 'List status not configured';
  return (
    <CardShell title="Status" collapsible={collapsible} summary={template.statusSetId ? undefined : emptyLabel} help={template.type === 'audit' ? AUDIT_STATUS_TIP : LIST_STATUS_TIP}>
      <StatusCardBody templateId={templateId} onDirty={onDirty} />
    </CardShell>
  );
}

function StatusCardBody({ templateId, onDirty }: { templateId: string; onDirty: () => void }) {
  const template = useTemplateStatus(templateId);
  useStatusSets();
  const set = templateStatus.getSelectedSet(templateId);
  const [modal, setModal] = useState<{ toSetId: string | null; mapping: Record<string, string>; cleared: number } | null>(null);

  const choose = (toSetId: string | null) => {
    if (toSetId === template.statusSetId) return;
    const request = templateStatus.requestSetChange(templateId, toSetId);
    if (request.needsConfirm) setModal({ toSetId, mapping: request.defaultMapping, cleared: request.clearedTriggerCount });
    else {
      templateStatus.confirmSetChange(templateId, toSetId, request.defaultMapping);
      onDirty();
    }
  };

  const options = pickerSets(template.statusSetId);
  const pending = template.pending;

  return (
    <>
      <label style={{ display: 'block', fontSize: 11, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', color: T.textMuted, marginBottom: 6 }}>Status set</label>
      <select
        aria-label="Status set"
        value={template.statusSetId ?? ''}
        onChange={(e) => choose(e.target.value || null)}
        style={selectStyle}
      >
        <option value="">None</option>
        {options.map((option) => (
          <option key={option.id} value={option.id}>{option.name}{option.archived ? ' (archived)' : ''}</option>
        ))}
      </select>
      {set && (
        <div style={{ marginTop: 12, background: T.surface1, border: `0.5px solid ${T.border}`, borderRadius: 8, padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {set.statuses.map((status) => (
            <div key={status.id} style={{ display: 'flex', alignItems: 'center', gap: 8, minHeight: 24 }}>
              <StatusChip status={status} size="sm" />
              {status.isDefault && <span style={{ fontSize: 12, color: T.textMuted }}>Default</span>}
              {status.canSubmitFrom && <span style={{ fontSize: 12, color: '#1f7a45' }}>Can submit from</span>}
            </div>
          ))}
        </div>
      )}
      {pending?.fromSetId && (
        <div style={{ marginTop: 12, background: T.bgWarning, borderRadius: 8, padding: '10px 12px', fontSize: 13, color: T.textWarning, lineHeight: 1.45 }}>
          Changed from <strong>{statusName(pending.fromSetId)}</strong>.{' '}
          {pending.toSetId
            ? <>The status mapping for {inFlightLabel(template)} applies when you publish.</>
            : <>Statuses are cleared from {inFlightLabel(template)} when you publish.</>}
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 14 }}>
        <Link to={set ? `/admin/statuses/${set.id}` : '/admin/statuses'} style={{ fontSize: 13, fontWeight: 600, color: T.textAccent, textDecoration: 'none' }}>
          Manage statuses <i className="ti ti-arrow-up-right" style={{ fontSize: 13 }} />
        </Link>
      </div>
      {modal && (
        <SwitchSetModal
          template={template}
          toSetId={modal.toSetId}
          mapping={modal.mapping}
          cleared={modal.cleared}
          onMapping={(fromId, toStatusId) => setModal({ ...modal, mapping: { ...modal.mapping, [fromId]: toStatusId } })}
          onCancel={() => setModal(null)}
          onConfirm={() => {
            templateStatus.confirmSetChange(templateId, modal.toSetId, modal.mapping);
            setModal(null);
            onDirty();
          }}
        />
      )}
    </>
  );
}

function statusName(setId: string) {
  return statusSets.get(setId)?.name ?? 'the previous set';
}

function SwitchSetModal({
  template, toSetId, mapping, cleared, onMapping, onCancel, onConfirm,
}: {
  template: TemplateStatusRecord;
  toSetId: string | null;
  mapping: Record<string, string>;
  cleared: number;
  onMapping: (fromId: string, toStatusId: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const from = template.publishedSetId ? pickerSets(template.publishedSetId).find((set) => set.id === template.publishedSetId) ?? null : null;
  const to = toSetId ? pickerSets(toSetId).find((set) => set.id === toSetId) ?? null : null;
  const fallback = to ? defaultStatusOf(to).name : '';
  return (
    <div role="presentation" onClick={onCancel} style={{ position: 'fixed', inset: 0, background: 'rgba(26,26,31,0.45)', zIndex: 80, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '10vh 16px' }}>
      <div role="dialog" aria-modal="true" aria-labelledby="switch-set-title" onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 640, background: T.surface2, borderRadius: 12, boxShadow: '0 12px 40px rgba(0,0,0,0.18)', fontFamily: T.font }}>
        <div style={{ display: 'flex', gap: 10, padding: '16px 16px 0' }}>
          <i className="ti ti-arrows-exchange" style={{ color: T.textWarning, fontSize: 18, marginTop: 2 }} />
          <div style={{ flex: 1 }}>
            <div id="switch-set-title" style={{ fontSize: 16, fontWeight: 650, color: T.textPrimary }}>
              {to ? `Switch to “${to.name}”?` : 'Remove the status set?'}
            </div>
            <div style={{ fontSize: 13, color: T.textMuted, marginTop: 2 }}>{template.name}</div>
          </div>
          <button type="button" aria-label="Close" onClick={onCancel} style={{ border: 'none', background: 'none', cursor: 'pointer', color: T.textMuted, fontSize: 16 }}>✕</button>
        </div>
        <div style={{ padding: '12px 16px 4px 44px', fontSize: 13, color: T.textPrimary, lineHeight: 1.45 }}>
          {to && from ? (
            <p style={{ margin: 0 }}>{inFlightLabel(template)} use <strong>{from.name}</strong>. Pick a new status in <strong>{to.name}</strong> for each current status.</p>
          ) : (
            <p style={{ margin: 0 }}>Statuses will be removed from {inFlightLabel(template)} that use <strong>{from?.name}</strong>. Status history is kept.</p>
          )}
          {to && from && (
            <table style={{ width: '100%', marginTop: 12, borderCollapse: 'separate', borderSpacing: '0 8px' }}>
              <thead>
                <tr style={{ fontSize: 11, letterSpacing: '0.04em', textTransform: 'uppercase', color: T.textMuted }}>
                  <th style={{ textAlign: 'left', fontWeight: 600 }}>Current status</th>
                  <th />
                  <th style={{ textAlign: 'left', fontWeight: 600, width: 230 }}>New status</th>
                </tr>
              </thead>
              <tbody>
                {from.statuses.map((status) => (
                  <tr key={status.id}>
                    <td><StatusChip status={status} size="sm" /></td>
                    <td style={{ textAlign: 'center', color: T.textMuted }}><i className="ti ti-arrow-right" /></td>
                    <td>
                      <select aria-label={`New status for ${status.name}`} value={mapping[status.id] ?? ''} onChange={(e) => onMapping(status.id, e.target.value)} style={selectStyle}>
                        {to.statuses.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {to && <p style={{ margin: '4px 0 0', fontSize: 12, color: T.textMuted }}>Prefilled by matching category. Otherwise, the new default ({fallback}).</p>}
          {cleared > 0 && (
            <div style={{ marginTop: 12, background: T.bgWarning, borderRadius: 8, padding: '10px 12px', color: T.textWarning, display: 'flex', gap: 8 }}>
              <i className="ti ti-alert-triangle" />
              <span>
                {to
                  ? `Status triggers in ${cleared} notification${cleared === 1 ? '' : 's'} will be cleared.`
                  : `${cleared} “A status changes” notification${cleared === 1 ? '' : 's'} will be removed.`}
              </span>
            </div>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px 16px' }}>
          <span style={{ marginRight: 'auto', fontSize: 12, color: T.textMuted }}><i className="ti ti-clock" /> Applies when you publish.</span>
          <button type="button" onClick={onCancel} style={{ fontFamily: T.font, fontSize: 13, fontWeight: 600, padding: '7px 12px', borderRadius: 6, border: `0.5px solid ${T.borderStrong}`, background: T.surface2, cursor: 'pointer' }}>Cancel</button>
          <button type="button" onClick={onConfirm} style={{ fontFamily: T.font, fontSize: 13, fontWeight: 600, padding: '7px 12px', borderRadius: 6, border: 'none', background: T.fillAccent, color: T.onAccent, cursor: 'pointer' }}>{to ? 'Switch set' : 'Remove set'}</button>
        </div>
      </div>
    </div>
  );
}

function CardShell({ title, summary, children, collapsible, help }: { title: string; summary?: string; children: React.ReactNode; collapsible?: boolean; help?: string }) {
  const [open, setOpen] = useState(!collapsible);
  return (
    <div style={{ background: T.surface2, border: `0.5px solid ${T.border}`, borderRadius: 8, marginBottom: 8, overflow: 'hidden' }}>
      <div
        onClick={() => { if (collapsible) setOpen((value) => !value); }}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', cursor: collapsible ? 'pointer' : 'default', userSelect: 'none' }}
      >
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: T.textPrimary, display: 'flex', alignItems: 'center', gap: 6 }}>
            {title}
            {help && <InfoTip text={help} />}
          </div>
          {summary && (!collapsible || !open) && <div style={{ fontSize: 12, color: T.textMuted, marginTop: 2 }}>{summary}</div>}
        </div>
        {collapsible && <i className={`ti ti-chevron-${open ? 'up' : 'down'}`} style={{ fontSize: 14, color: T.textMuted }} />}
      </div>
      {open && <div style={{ borderTop: `0.5px solid ${T.border}`, padding: 16 }}>{children}</div>}
    </div>
  );
}

function InfoTip({ text }: { text: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [box, setBox] = useState<{ top: number; left: number } | null>(null);
  return (
    <span
      ref={ref}
      style={{ display: 'inline-flex' }}
      onClick={(e) => e.stopPropagation()}
      onMouseEnter={() => {
        const rect = ref.current?.getBoundingClientRect();
        if (rect) setBox({ top: rect.bottom + 6, left: rect.left });
      }}
      onMouseLeave={() => setBox(null)}
    >
      <i className="ti ti-info-circle" style={{ fontSize: 14, color: T.textMuted, fontWeight: 400 }} />
      {box && (
        <span style={{
          position: 'fixed', top: box.top, left: box.left, width: 280,
          background: '#1C1C1E', color: '#fff', fontSize: 11, fontWeight: 500, lineHeight: 1.5,
          padding: '5px 9px', borderRadius: 6, zIndex: 30, boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
        }}>
          {text}
        </span>
      )}
    </span>
  );
}

const OUTCOME_SEED = [
  { score: '90', name: 'Exceeds Expectations', flag: '' },
  { score: '80', name: 'Meets Expectations', flag: '' },
  { score: '0', name: 'Below Expectations', flag: 'auto_fail' },
];

export function AuditsTab({ templateId, onDirty }: { templateId: string; onDirty: () => void }) {
  const [outcomes, setOutcomes] = useState(OUTCOME_SEED);
  const [report, setReport] = useState('default');
  return (
    <div style={{ padding: 16, maxWidth: 720, width: '100%' }}>
      <CardShell title="Audit Outcomes" summary="Set an outcome for each score range" help="Set an outcome for each score range">
        <div style={{ display: 'grid', gridTemplateColumns: '105px 1fr 165px 28px', gap: 8, alignItems: 'center', marginBottom: 8, fontSize: 11, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', color: T.textMuted }}>
          <span>Score above</span><span>Outcome</span><span>Outcome override flag</span><span />
        </div>
        {outcomes.map((row, index) => (
          <div key={index} style={{ display: 'grid', gridTemplateColumns: '105px 1fr 165px 28px', gap: 8, alignItems: 'center', marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <input value={row.score} onChange={(e) => setOutcomes((rows) => rows.map((item, i) => i === index ? { ...item, score: e.target.value } : item))} style={{ ...selectStyle, width: 64, padding: '7px 8px', backgroundImage: 'none' }} />
              <span style={{ fontSize: 13, color: T.textMuted }}>%</span>
            </div>
            <input value={row.name} onChange={(e) => setOutcomes((rows) => rows.map((item, i) => i === index ? { ...item, name: e.target.value } : item))} style={{ ...selectStyle, backgroundImage: 'none', padding: '7px 10px' }} />
            <select value={row.flag} onChange={(e) => setOutcomes((rows) => rows.map((item, i) => i === index ? { ...item, flag: e.target.value } : item))} style={selectStyle}>
              <option value="">None</option>
              <option value="auto_fail">Auto Fail</option>
            </select>
            <button type="button" aria-label="Remove outcome" onClick={() => setOutcomes((rows) => rows.filter((_, i) => i !== index))} style={{ border: 'none', background: 'none', cursor: 'pointer', color: T.textMuted }}>✕</button>
          </div>
        ))}
        <button type="button" onClick={() => setOutcomes((rows) => [...rows, { score: '', name: '', flag: '' }])} style={{ marginTop: 4, fontFamily: T.font, fontSize: 13, fontWeight: 600, color: T.textPrimary, background: T.surface2, border: `0.5px solid ${T.borderStrong}`, borderRadius: 6, padding: '6px 10px', cursor: 'pointer' }}>
          + Add score outcome
        </button>
      </CardShell>
      <TemplateStatusCard templateId={templateId} collapsible onDirty={onDirty} />
      <CardShell title="Leave Behind Report" summary="Report shared with the location after an audit" help="Report shared with the location after an audit">
        <label style={{ display: 'block', fontSize: 11, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', color: T.textMuted, marginBottom: 6 }}>Leave Behind Report</label>
        <select aria-label="Leave Behind Report" value={report} onChange={(e) => setReport(e.target.value)} style={selectStyle}>
          <option value="default">Default Leave Behind Report Template</option>
          <option value="costco">Costco Compliance Leave Behind</option>
        </select>
        <p style={{ margin: '8px 0 0', fontSize: 12, color: T.textMuted }}>This report is also attached to “A status changes” emails that have Attach PDF on.</p>
      </CardShell>
    </div>
  );
}

export function submitStatusPhrase(templateId: string) {
  const set = templateStatus.getSelectedSet(templateId);
  const names = set?.statuses.filter((status) => status.canSubmitFrom).map((status) => status.name) ?? [];
  return names.length ? ` · status is ${names.join(' or ')}` : '';
}
