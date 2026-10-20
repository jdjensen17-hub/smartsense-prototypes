// B5 — API key detail: usage summary, editable notes, recent events, rotate and revoke.

import { useState, type ReactNode } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Ban, Download, Lock, Pencil, RotateCw, Send, TriangleAlert } from 'lucide-react';
import { CopyKeyModal } from '@/components/api-keys/CopyKeyModal';
import { LocationsModal } from '@/components/api-keys/LocationsModal';
import { ConfirmDialog } from '@/components/api-keys/Modal';
import { RecentEventsPanel } from '@/components/api-keys/RecentEventsPanel';
import { ToastHost } from '@/components/api-keys/toast';
import { showToast } from '@/components/api-keys/toastStore';
import { useApiKeyDeepLinks } from '@/components/api-keys/deepLinks';
import {
  Banner,
  Button,
  Code,
  Crumbs,
  KindChip,
  LinkButton,
  PageHead,
  Panel,
  PanelHead,
  Pill,
  SourcePill,
  SupportBanner,
} from '@/components/api-keys/ui';
import { C } from '@/components/api-keys/tokens';
import { ORG, RATE_LIMIT, apiKeys, rejectedFor, useApiKeys } from '@/data/apiKeys';

type Dialog =
  | { type: 'locations' }
  | { type: 'rotate' }
  | { type: 'revoke' }
  | { type: 'token'; token: string; oldLast4: string };

/** A query change is a new entry point, so the screen starts over from the URL. */
export default function ApiKeyDetailPage() {
  const [params] = useSearchParams();
  const { keyId = '' } = useParams();
  return <ApiKeyDetailScreen key={`${keyId}?${params.toString()}`} />;
}

/** Deep links from the reference mock: ?modal=rotate | revoke | token&rotated=1 */
function dialogFromParams(params: URLSearchParams, keyId: string): Dialog | null {
  switch (params.get('modal')) {
    case 'locations':
      return { type: 'locations' };
    case 'rotate':
      return { type: 'rotate' };
    case 'revoke':
      return { type: 'revoke' };
    case 'token': {
      const rotated = apiKeys.rotateOnce(keyId);
      return { type: 'token', token: rotated.token, oldLast4: rotated.oldLast4 };
    }
    default:
      return null;
  }
}

function ApiKeyDetailScreen() {
  const { keyId = '' } = useParams();
  const navigate = useNavigate();
  const state = useApiKeys();
  const [params] = useSearchParams();
  const [dialog, setDialog] = useState<Dialog | null>(() => (apiKeys.get(keyId) ? dialogFromParams(params, keyId) : null));
  // ?edit=notes opens the inline notes editor.
  const [notesDraft, setNotesDraft] = useState<string | null>(() =>
    params.get('edit') === 'notes' ? apiKeys.get(keyId)?.notes ?? null : null,
  );
  useApiKeyDeepLinks();

  const apiKey = state.keys.find((key) => key.id === keyId) ?? null;
  const canManage = state.viewAs === 'admin';

  if (!apiKey) {
    return (
      <div>
        <h1 className="text-2xl font-semibold" style={{ color: C.text }}>Key not found</h1>
        <p className="mt-2 text-sm">
          <Link to="/admin/api-keys" style={{ color: C.primary }}>Back to API keys</Link>
        </p>
      </div>
    );
  }

  const active = apiKey.status === 'active';
  const events = state.events[apiKey.id] ?? [];
  const rejected = rejectedFor(state, apiKey.id).length;
  const oldCalls = apiKey.oldKeyCalls;

  function rotate() {
    const result = apiKeys.rotate(keyId);
    setDialog({ type: 'token', token: result.token, oldLast4: result.oldLast4 });
  }

  function revoke() {
    apiKeys.revoke(keyId);
    setDialog(null);
    showToast(`${apiKey?.name} revoked. It stopped working immediately.`);
  }

  function saveNotes() {
    apiKeys.saveNotes(keyId, notesDraft ?? '');
    setNotesDraft(null);
    showToast('Notes saved');
  }

  return (
    <div>
      <Crumbs items={[{ label: 'Settings' }, { label: 'API Keys', to: '/admin/api-keys' }, { label: apiKey.name }]} />
      <PageHead
        title={apiKey.name}
        badge={active ? <Pill tone="active">Active</Pill> : <Pill tone="revoked">Revoked</Pill>}
        subtitle={`${active ? 'Active' : 'Revoked'} · Created ${apiKey.created} by ${apiKey.createdBy}`}
        actions={
          active && canManage ? (
            <>
              <Button icon={<Send size={14} strokeWidth={1.8} />} onClick={() => navigate(`/admin/api-keys/${apiKey.id}/test`)}>Send test event</Button>
              <Button icon={<RotateCw size={14} strokeWidth={1.8} />} onClick={() => setDialog({ type: 'rotate' })}>Rotate key</Button>
              <Button variant="danger-outline" icon={<Ban size={14} strokeWidth={1.8} />} onClick={() => setDialog({ type: 'revoke' })}>Revoke key</Button>
            </>
          ) : undefined
        }
      />

      <div className="flex flex-col gap-3.5">
        <SupportBanner viewAs={state.viewAs} orgName={ORG.name} />
        {!active && (
          <Banner tone="gray" icon={<Lock size={17} strokeWidth={1.8} color={C.text2} />}>
            <b>Revoked {apiKey.revokedOn} by {apiKey.revokedBy}.</b> History is read-only. Tasks this key already created stay on To-Dos until completed.
          </Banner>
        )}

        <Panel>
          <div className="grid grid-cols-4 overflow-hidden rounded" style={{ border: `1px solid ${C.border}` }}>
            {[
              {
                label: 'Source shown on Tasks',
                value: (<><KindChip /><SourcePill>{apiKey.name}</SourcePill></>),
              },
              { label: 'Last used', value: apiKey.lastUsed ?? <span style={{ color: C.text3 }}>Never</span> },
              {
                label: 'Events',
                value: (<>{apiKey.events.toLocaleString('en-US')} <span className="text-xs font-normal" style={{ color: C.text3 }}>Tasks created</span></>),
              },
              {
                label: 'Rejected (7 days)',
                value: rejected > 0 ? <Link to={`/admin/api-keys/rejected?key=${apiKey.id}`} style={{ color: C.primary }}>{rejected} rejected</Link> : '0',
              },
              {
                label: 'Rate limit',
                value: (<>{RATE_LIMIT} <span className="text-xs font-normal" style={{ color: C.text3 }}>Set by SmartSense</span></>),
              },
              {
                label: 'Can do',
                value: (<><span className="font-normal">Create Tasks only</span> <Code>POST /v1/events</Code></>),
              },
              {
                label: 'Key',
                value: <span style={{ fontFamily: 'var(--ss-font-mono)' }}>•••• {apiKey.last4}</span>,
                sub: apiKey.rotatedOn ? `Rotated ${apiKey.rotatedOn}` : undefined,
              },
              {
                label: 'Last rejected call',
                value: oldCalls?.count ? oldCalls.last : <span style={{ color: C.text3 }}>None</span>,
                sub: oldCalls?.count
                  ? `${oldCalls.count} call${oldCalls.count === 1 ? '' : 's'} with old key •••• ${oldCalls.last4} (7 days)`
                  : 'Calls with a revoked or rotated-out key',
              },
            ].map((cell, index, cells) => (
              <Cell
                key={cell.label}
                label={cell.label}
                sub={cell.sub}
                lastInRow={index % 4 === 3}
                lastRow={index >= cells.length - 4}
              >
                {cell.value}
              </Cell>
            ))}
          </div>
        </Panel>

        <Panel>
          <PanelHead
            className="mb-2"
            title="Notes"
            action={
              canManage && notesDraft === null ? (
                <LinkButton icon={<Pencil size={13} strokeWidth={1.8} />} onClick={() => setNotesDraft(apiKey.notes)}>Edit</LinkButton>
              ) : undefined
            }
          />
          {notesDraft === null ? (
            <p className="text-sm" style={{ color: apiKey.notes ? C.text : C.text3 }}>
              {apiKey.notes || 'No notes. Add a partner contact or ticket number.'}
            </p>
          ) : (
            <>
              <textarea
                autoFocus
                value={notesDraft}
                maxLength={200}
                rows={3}
                onChange={(e) => setNotesDraft(e.target.value)}
                className="w-full rounded px-2.5 py-2 text-sm"
                style={{ border: `1px solid ${C.border}`, color: C.text, resize: 'none', outline: 'none' }}
              />
              <div className="mt-2 flex items-center gap-2">
                <span className="flex flex-1 items-center gap-1.5 text-xs" style={{ color: C.text2 }}>
                  <Lock size={13} strokeWidth={1.8} /> The key name can&apos;t be changed. Notes can be edited anytime.
                </span>
                <Button small onClick={() => setNotesDraft(null)}>Cancel</Button>
                <Button small variant="primary" onClick={saveNotes}>Save</Button>
              </div>
            </>
          )}
        </Panel>

        <RecentEventsPanel apiKey={apiKey} events={events} emptyText={`Share the key with ${apiKey.name} and send a test event.`} />

        <div className="flex items-center gap-3.5 text-sm">
          <LinkButton icon={<TriangleAlert size={14} strokeWidth={1.8} />} onClick={() => navigate(`/admin/api-keys/rejected?key=${apiKey.id}`)}>
            Rejected events for this key
          </LinkButton>
          <span style={{ color: C.border }}>|</span>
          <LinkButton icon={<Download size={14} strokeWidth={1.8} />} onClick={() => setDialog({ type: 'locations' })}>
            Download locations
          </LinkButton>
        </div>

        {active && (
          <Panel>
            <PanelHead className="mb-2.5" title="Notifications" action={<Pill tone="next">Coming soon</Pill>} />
            <div className="flex items-center gap-2.5 text-sm" style={{ color: C.text3 }}>
              <span className="relative inline-block" style={{ width: 30, height: 17, borderRadius: 9, backgroundColor: C.border }}>
                <span className="absolute" style={{ left: 2, top: 2, width: 13, height: 13, borderRadius: '50%', backgroundColor: '#ffffff' }} />
              </span>
              Send a &quot;Task created&quot; notification to store users
            </div>
          </Panel>
        )}
      </div>

      {dialog?.type === 'locations' && <LocationsModal onClose={() => setDialog(null)} />}
      {dialog?.type === 'rotate' && (
        <ConfirmDialog
          tone="warn"
          icon={<RotateCw size={18} strokeWidth={1.8} />}
          title={`Rotate the key for ${apiKey.name}?`}
          body={`The current key stops working right away. You'll get a new key to send to ${apiKey.name}. ${apiKey.name} stops sending events until they enter the new key. History stays the same.`}
          confirmLabel="Rotate key"
          onConfirm={rotate}
          onCancel={() => setDialog(null)}
        />
      )}
      {dialog?.type === 'revoke' && (
        <ConfirmDialog
          tone="danger"
          icon={<Ban size={18} strokeWidth={1.8} />}
          title={`Revoke ${apiKey.name}?`}
          body="This key stops working right away and can't be restored. Existing Tasks stay on To-Dos until completed."
          confirmLabel="Revoke key"
          confirmVariant="danger"
          onConfirm={revoke}
          onCancel={() => setDialog(null)}
        />
      )}
      {dialog?.type === 'token' && (
        <CopyKeyModal
          keyName={apiKey.name}
          token={dialog.token}
          rotated
          oldLast4={dialog.oldLast4}
          onDone={() => { setDialog(null); showToast('New key issued. The old key no longer works.'); }}
        />
      )}
      <ToastHost />
    </div>
  );
}

function Cell({
  label,
  sub,
  lastInRow,
  lastRow,
  children,
}: {
  label: string;
  sub?: string;
  lastInRow: boolean;
  lastRow: boolean;
  children: ReactNode;
}) {
  return (
    <div
      className="px-3.5 py-3"
      style={{
        borderRight: lastInRow ? undefined : `1px solid ${C.border}`,
        borderBottom: lastRow ? undefined : `1px solid ${C.border}`,
        minWidth: 0,
      }}
    >
      <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide" style={{ color: C.text3 }}>{label}</div>
      <div className="flex flex-wrap items-center gap-1.5 text-sm font-semibold" style={{ color: C.text }}>{children}</div>
      {sub && <div className="mt-1 text-xs" style={{ color: C.text3 }}>{sub}</div>}
    </div>
  );
}
