import { Check, RefreshCw } from 'lucide-react';
import { getLocation, REASONS, type ApiKey, type KeyEvent } from '@/data/apiKeys';
import { showToast } from './toastStore';
import { Button, Code, Panel, PanelHead, Pill, Spinner, Th } from './ui';
import { C } from './tokens';

function LocationSent({ sent }: { sent: string }) {
  if (!sent) return <span style={{ color: C.text3 }}>(none)</span>;
  return <Code>{sent}</Code>;
}

function ResolvedLocation({ event }: { event: KeyEvent }) {
  if (event.pending) return <Spinner />;
  if (!event.ok) return <span style={{ color: C.text3 }}>—</span>;
  const location = getLocation(event.resolved);
  return <span>{location ? location.name : '—'}</span>;
}

function Result({ event }: { event: KeyEvent }) {
  if (event.pending) return <Pill tone="revoked">Resolving…</Pill>;
  return (
    <span className="flex flex-wrap items-center gap-1.5">
      {event.ok ? (
        <Pill tone="active"><Check size={12} strokeWidth={2.2} />Task created</Pill>
      ) : (
        <>
          <Pill tone="danger">Rejected</Pill>
          <span className="text-xs" style={{ color: C.text2 }}>{REASONS[event.reason ?? 'none']}</span>
        </>
      )}
      {event.test && <Pill tone="revoked">test</Pill>}
    </span>
  );
}

export function RecentEventsPanel({
  apiKey,
  events,
  emptyText,
  maxRows = 4,
}: {
  apiKey: ApiKey;
  events: KeyEvent[];
  emptyText: string;
  maxRows?: number;
}) {
  const rows = events.slice(0, maxRows);
  return (
    <Panel flush>
      <PanelHead
        className="px-4 pb-2.5 pt-4"
        title="Recent events"
        subtitle="The latest events received with this key, and where each one landed."
        action={
          events.length > 0 && apiKey.status === 'active' ? (
            <Button small icon={<RefreshCw size={13} strokeWidth={1.8} />} onClick={() => showToast('Up to date')}>Refresh</Button>
          ) : undefined
        }
      />
      {rows.length === 0 ? (
        <div className="px-4 py-7 text-center text-sm" style={{ borderTop: `1px solid ${C.border}`, color: C.text2 }}>
          <span className="block font-semibold" style={{ color: C.text }}>No events yet.</span>
          {emptyText}
        </div>
      ) : (
        <table className="w-full text-sm">
          <thead style={{ borderBottom: `1px solid ${C.border}` }}>
            <tr>
              <Th>Received</Th>
              <Th>Location sent</Th>
              <Th>Resolved location</Th>
              <Th>Task type</Th>
              <Th>Result</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((event) => (
              <tr key={event.id} style={{ borderTop: `1px solid ${C.border}`, backgroundColor: event.pending ? '#FAFCFF' : undefined }}>
                <td className="px-3.5 py-2.5" style={{ color: C.text2, whiteSpace: 'nowrap' }}>{event.at}</td>
                <td className="px-3.5 py-2.5"><LocationSent sent={event.sent} /></td>
                <td className="px-3.5 py-2.5" style={{ color: C.text }}><ResolvedLocation event={event} /></td>
                <td className="px-3.5 py-2.5"><Code>{event.type}</Code></td>
                <td className="px-3.5 py-2.5"><Result event={event} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Panel>
  );
}
