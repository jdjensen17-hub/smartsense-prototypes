// B4 — send a test event as the key. The API answers Accepted right away; the location resolves after.

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Ban, CircleCheck, CircleX, Info, Send } from 'lucide-react';
import { LocationsModal } from '@/components/api-keys/LocationsModal';
import { RecentEventsPanel } from '@/components/api-keys/RecentEventsPanel';
import { ToastHost } from '@/components/api-keys/toast';
import { useApiKeyDeepLinks } from '@/components/api-keys/deepLinks';
import {
  Banner,
  Button,
  Code,
  Crumbs,
  FieldError,
  FieldLabel,
  Help,
  KindChip,
  PageHead,
  Panel,
  PanelHead,
  Pill,
  SourcePill,
  SupportBanner,
  Spinner,
} from '@/components/api-keys/ui';
import { C, inputStyle } from '@/components/api-keys/tokens';
import { ORG, RESOLVE_MS, TASK_TYPES, apiKeys, getLocation, useApiKeys, type ApiKey, type KeyEvent, type TestResult } from '@/data/apiKeys';

/** Deep-link demos from the reference mock: [location ID, store number, task type, title]. */
const DEMOS: Record<string, [string, string, string, string]> = {
  accepted: ['loc_8f2c41a7', '', 'pump.service_needed', 'Pump 4: receipt paper low'],
  notorg: ['loc_44be9a10', '', 'generic.task', 'Lobby camera offline'],
  idnofallback: ['loc_44be9a10', '1042', 'generic.task', 'Lobby camera offline'],
  ambiguous: ['', '0217', 'generic.task', 'Lobby camera offline'],
  notfound: ['', '2290', 'generic.task', 'Lobby camera offline'],
};

/** A query change is a new entry point, so the screen starts over from the URL. */
export default function ApiKeyTestPage() {
  const [params] = useSearchParams();
  const { keyId = '' } = useParams();
  return <ApiKeyTestScreen key={`${keyId}?${params.toString()}`} />;
}

function ApiKeyTestScreen() {
  const { keyId = '' } = useParams();
  const navigate = useNavigate();
  const state = useApiKeys();
  const [params] = useSearchParams();
  const demo = DEMOS[params.get('demo') ?? ''];
  const [locId, setLocId] = useState(demo?.[0] ?? '');
  const [store, setStore] = useState(demo?.[1] ?? '');
  const [type, setType] = useState(demo?.[2] ?? 'generic.task');
  const [title, setTitle] = useState(demo?.[3] ?? '');
  const [errors, setErrors] = useState<{ loc?: string; title?: string }>({});
  const [locationsOpen, setLocationsOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const demoSent = useRef(false);
  useApiKeyDeepLinks();

  const apiKey = state.keys.find((key) => key.id === keyId) ?? null;
  const canManage = state.viewAs === 'admin';
  const locked = !apiKey || apiKey.status !== 'active' || !canManage;

  useEffect(() => () => clearTimeout(timer.current), []);

  function send(values?: { locId: string; store: string; type: string; title: string }, { immediate = false } = {}) {
    const input = values ?? { locId, store, type, title };
    const cleanLoc = input.locId.trim();
    const cleanStore = input.store.trim().replace(/^store\s*/i, '');
    const nextErrors: { loc?: string; title?: string } = {};
    if (!cleanLoc && !cleanStore) nextErrors.loc = 'Enter a SmartSense location ID or a store number.';
    if (!input.title.trim()) nextErrors.title = 'Enter a title.';
    setErrors(nextErrors);
    if (nextErrors.loc || nextErrors.title) return;

    const sent = apiKeys.sendTestEvent({ keyId, locId: cleanLoc, store: cleanStore, type: input.type, title: input.title });
    if (immediate) {
      apiKeys.resolveTestEvent(keyId, sent.event.id, sent.outcome);
      return;
    }
    clearTimeout(timer.current);
    timer.current = setTimeout(() => apiKeys.resolveTestEvent(keyId, sent.event.id, sent.outcome), RESOLVE_MS);
  }

  // ?demo=accepted|notorg|idnofallback|ambiguous|notfound, with &phase=resolving to hold the spinner.
  useEffect(() => {
    if (!demo || !apiKey || demoSent.current) return;
    demoSent.current = true;
    const [demoLoc, demoStore, demoType, demoTitle] = demo;
    const immediate = params.get('phase') !== 'resolving';
    const sent = apiKeys.sendTestEvent({ keyId, locId: demoLoc, store: demoStore, type: demoType, title: demoTitle });
    if (immediate) apiKeys.resolveTestEvent(keyId, sent.event.id, sent.outcome);
  }, [demo, apiKey, keyId, params]);

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

  const events = state.events[apiKey.id] ?? [];
  const result = state.lastTest[apiKey.id] ?? null;
  const resultEvent = result ? events.find((event) => event.id === result.eventId) ?? null : null;

  return (
    <div>
      <Crumbs
        items={[
          { label: 'Settings' },
          { label: 'API Keys', to: '/admin/api-keys' },
          { label: apiKey.name, to: `/admin/api-keys/${apiKey.id}` },
          { label: 'Test' },
        ]}
      />
      <PageHead
        title={`Test ${apiKey.name}`}
        badge={apiKey.status === 'active' ? <Pill tone="active">Active</Pill> : <Pill tone="revoked">Revoked</Pill>}
        subtitle={`Send a test event as ${apiKey.name}. It runs on our servers with this key, like a partner call, and shows where the Task lands.`}
        actions={<Button onClick={() => navigate(`/admin/api-keys/${apiKey.id}`)}>Key details</Button>}
      />

      <div className="flex flex-col gap-3.5">
        <SupportBanner viewAs={state.viewAs} orgName={ORG.name} />
        {apiKey.status !== 'active' && (
          <Banner tone="danger" icon={<Ban size={17} strokeWidth={1.8} color={C.danger} />}>
            <b>This key has been revoked.</b> Test events can&apos;t be sent with it.
          </Banner>
        )}

        <div className="grid items-start gap-3.5" style={{ gridTemplateColumns: '1fr 1fr' }}>
          <Panel>
            <PanelHead className="mb-3" title="Send test event" />
            <div className="mb-3.5">
              <FieldLabel htmlFor="test-location-id">SmartSense location ID</FieldLabel>
              <input
                id="test-location-id"
                value={locId}
                disabled={locked}
                onChange={(e) => setLocId(e.target.value)}
                placeholder="e.g. loc_8f2c41a7"
                style={{ ...inputStyle(Boolean(errors.loc)), fontFamily: 'var(--ss-font-mono)', backgroundColor: locked ? C.app : C.surface }}
              />
              {errors.loc ? (
                <FieldError>{errors.loc}</FieldError>
              ) : (
                <Help>
                  Find IDs in your{' '}
                  <button
                    type="button"
                    onClick={() => setLocationsOpen(true)}
                    className="font-bold hover:underline"
                    style={{ color: C.primary, background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}
                  >
                    locations list
                  </button>
                  .
                </Help>
              )}
            </div>
            <div className="mb-3.5">
              <FieldLabel htmlFor="test-store-number">
                Store number <span style={{ textTransform: 'none', letterSpacing: 0, fontWeight: 400 }}>(optional)</span>
              </FieldLabel>
              <input
                id="test-store-number"
                value={store}
                disabled={locked}
                onChange={(e) => setStore(e.target.value)}
                placeholder="e.g. 1042"
                style={{ ...inputStyle(), backgroundColor: locked ? C.app : C.surface }}
              />
              <Help>Used only when no location ID is sent, and only if it&apos;s unique in your organization.</Help>
            </div>
            <div className="mb-3.5">
              <FieldLabel htmlFor="test-task-type">Task type</FieldLabel>
              <select
                id="test-task-type"
                value={type}
                disabled={locked}
                onChange={(e) => setType(e.target.value)}
                style={{ ...inputStyle(), backgroundColor: locked ? C.app : C.surface, cursor: locked ? 'not-allowed' : 'pointer' }}
              >
                {TASK_TYPES.map((taskType) => (
                  <option key={taskType.key} value={taskType.key}>
                    {taskType.label}{taskType.key === 'generic.task' ? ' (default)' : ''}
                  </option>
                ))}
              </select>
            </div>
            <div className="mb-3.5">
              <FieldLabel htmlFor="test-title">
                Title <span style={{ color: C.danger }}>*</span>
              </FieldLabel>
              <div
                className="flex overflow-hidden rounded"
                style={{ border: `1px solid ${errors.title ? C.danger : C.border}`, backgroundColor: locked ? C.app : C.surface }}
              >
                <span className="flex items-center px-2.5 text-sm font-semibold" style={{ backgroundColor: C.app, borderRight: `1px solid ${C.border}`, color: C.text2 }}>
                  [Test]
                </span>
                <input
                  id="test-title"
                  value={title}
                  disabled={locked}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Pump 4: receipt paper low"
                  className="flex-1 px-2.5 text-sm"
                  style={{ height: 34, border: 'none', outline: 'none', color: C.text, backgroundColor: 'transparent' }}
                />
              </div>
              {errors.title && <FieldError>{errors.title}</FieldError>}
            </div>
            <p className="mb-3.5 flex items-start gap-1.5 text-xs" style={{ color: C.text2 }}>
              <Info size={13} strokeWidth={1.8} className="mt-0.5 flex-shrink-0" />
              <span>
                Test Tasks are marked &quot;[Test]&quot;, tagged <Code>test</Code>, and left out of reports. Store users at this location will see the Task.
              </span>
            </p>
            <Button variant="primary" disabled={locked} icon={<Send size={14} strokeWidth={1.8} />} onClick={() => send()}>
              Send test event
            </Button>
          </Panel>

          <Panel>
            <PanelHead className="mb-3" title="Result" />
            <TestResult apiKey={apiKey} result={result} event={resultEvent} onOpenLocations={() => setLocationsOpen(true)} />
          </Panel>
        </div>

        <RecentEventsPanel
          apiKey={apiKey}
          events={events}
          emptyText={`Send ${apiKey.name} the key, the API docs, and your locations list, or send a test event.`}
        />
      </div>

      {locationsOpen && <LocationsModal onClose={() => setLocationsOpen(false)} />}
      <ToastHost />
    </div>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <>
      <div style={{ color: C.text3 }}>{label}</div>
      <div className="flex min-w-0 flex-wrap items-center gap-1.5 font-semibold">{children}</div>
    </>
  );
}

function TestResult({
  apiKey,
  result,
  event,
  onOpenLocations,
}: {
  apiKey: ApiKey;
  result: TestResult | null;
  event: KeyEvent | null;
  onOpenLocations: () => void;
}) {
  if (!result || !event) {
    return (
      <div className="rounded px-4 py-7 text-center text-sm" style={{ border: `1px dashed ${C.border}`, color: C.text3 }}>
        <Send size={16} strokeWidth={1.8} className="mx-auto mb-1.5" />
        Send a test event to see where its Task lands.
      </div>
    );
  }

  if (event.pending) {
    return (
      <div className="rounded p-3.5" style={{ border: '1px solid #B8E3C7', backgroundColor: '#F4FBF6' }}>
        <div className="mb-2.5 flex items-center gap-2 text-sm font-semibold" style={{ color: C.text }}>
          <CircleCheck size={16} strokeWidth={1.8} color={C.successText} /> Accepted
        </div>
        <div className="grid items-center gap-y-1.5 text-sm" style={{ gridTemplateColumns: '96px 1fr' }}>
          <Row label="Task ID"><span style={{ fontFamily: 'var(--ss-font-mono)' }}>{result.taskId}</span></Row>
          <Row label="Status">queued</Row>
          <Row label="Location"><Spinner /></Row>
          <Row label="Title">{event.title}</Row>
        </div>
        <p className="mt-3 flex gap-1.5 border-t pt-2.5 text-xs" style={{ borderColor: '#C9E5D3', color: C.text2 }}>
          <Info size={14} strokeWidth={1.8} className="flex-shrink-0" />
          Where the Task lands appears here and under Recent events in a moment.
        </p>
      </div>
    );
  }

  if (event.ok) {
    const location = getLocation(event.resolved);
    return (
      <div className="rounded p-3.5" style={{ border: '1px solid #B8E3C7', backgroundColor: '#F4FBF6' }}>
        <div className="mb-2.5 flex items-center gap-2 text-sm font-semibold" style={{ color: C.text }}>
          <CircleCheck size={16} strokeWidth={1.8} color={C.successText} /> Accepted · Task created
        </div>
        <div className="grid items-center gap-y-1.5 text-sm" style={{ gridTemplateColumns: '96px 1fr' }}>
          <Row label="Task ID"><span style={{ fontFamily: 'var(--ss-font-mono)' }}>{result.taskId}</span></Row>
          <Row label="Status">created</Row>
          <Row label="Location">
            <span className="text-base font-bold">{location?.name}</span>
            <span className="font-normal" style={{ color: C.text3 }}>(store {location?.store})</span>
          </Row>
          <Row label="Title">{event.title}</Row>
          <Row label="Shown as"><KindChip /><SourcePill>{apiKey.name}</SourcePill></Row>
        </div>
        <p className="mt-3 flex gap-1.5 border-t pt-2.5 text-xs" style={{ borderColor: '#C9E5D3', color: C.text2 }}>
          <Info size={14} strokeWidth={1.8} className="flex-shrink-0" />
          Is this the store you expected? If not, the ID is wrong. Check the ID the partner stored for this site.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded p-3.5" style={{ border: '1px solid #F3C1BF', backgroundColor: '#FFF6F6' }}>
      <div className="mb-1 flex items-center gap-2 text-sm font-semibold" style={{ color: C.text }}>
        <CircleX size={16} strokeWidth={1.8} color={C.danger} /> Rejected · no Task created
      </div>
      <p className="mb-2 text-xs" style={{ color: C.text3 }}>
        Accepted at {event.at.split(', ')[1]}, then rejected while matching the location.
      </p>
      <p className="text-sm font-semibold" style={{ color: C.text }}>{result.message}</p>
      <p className="mt-3 flex gap-1.5 border-t pt-2.5 text-xs" style={{ borderColor: '#F0CFCD', color: C.text2 }}>
        <Info size={14} strokeWidth={1.8} className="flex-shrink-0" />
        <span>
          This event is listed in{' '}
          <Link to={`/admin/api-keys/rejected?key=${apiKey.id}`} style={{ color: C.primary }}>Rejected events</Link>. Use the SmartSense location ID from your{' '}
          <button
            type="button"
            onClick={onOpenLocations}
            className="font-bold hover:underline"
            style={{ color: C.primary, background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            locations list
          </button>
          .
        </span>
      </p>
    </div>
  );
}
