import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

type Status = 'connected' | 'needs_setup' | 'not_connected';
type Notice = 'denied' | 'disconnected' | null;
type Site = { id: string; name: string };
type MsState = { connected: boolean; sites: Site[]; notice: Notice };

const STATUS_LABEL: Record<Status, string> = {
  connected: 'Connected',
  needs_setup: 'Needs setup',
  not_connected: 'Not connected',
};

const STATUS_STYLE: Record<Status, { background: string; color: string; border: string }> = {
  connected: { background: '#ECFDF5', color: '#047857', border: '1px solid #A7F3D0' },
  needs_setup: { background: '#FFFBEB', color: '#B45309', border: '1px solid #FDE68A' },
  not_connected: { background: '#F1F5F9', color: '#64748B', border: '1px solid #E2E8F0' },
};

const GROUP_ORDER: { status: Status; label: string }[] = [
  { status: 'connected', label: 'Connected' },
  { status: 'needs_setup', label: 'Needs setup' },
  { status: 'not_connected', label: 'Not connected' },
];

const MICROSOFT_SUMMARY =
  'Link SharePoint and OneDrive files to checklist items. Store teams open them in the app without a Microsoft login.';

const PLACEHOLDERS: { id: string; name: string; summary: string; status: Status }[] = [
  {
    id: 'google-drive',
    name: 'Google Drive',
    summary: 'Link Google Drive files to checklist items. Store teams open them in the app without a Google login.',
    status: 'connected',
  },
  {
    id: 'dropbox',
    name: 'Dropbox',
    summary: 'Link Dropbox files to checklist items. Store teams open them in the app without a Dropbox login.',
    status: 'needs_setup',
  },
  {
    id: 'box',
    name: 'Box',
    summary: 'Link Box files to checklist items. Store teams open them in the app without a Box login.',
    status: 'not_connected',
  },
];

let msMemory: MsState = { connected: false, sites: [], notice: null };

function msStatus(state: MsState): Status {
  if (!state.connected) return 'not_connected';
  return state.sites.length > 0 ? 'connected' : 'needs_setup';
}

function commitMs(next: MsState, setState: (s: MsState) => void) {
  const snapshot: MsState = {
    connected: next.connected,
    notice: next.notice,
    sites: next.sites.map((s) => ({ id: s.id, name: s.name })),
  };
  msMemory = snapshot;
  setState(snapshot);
}

function ChevronLeftIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 15 15" fill="none">
      <path d="M8.842 3.135a.5.5 0 0 1 .023.707L5.435 7.5l3.43 3.658a.5.5 0 0 1-.73.684l-3.75-4a.5.5 0 0 1 0-.684l3.75-4a.5.5 0 0 1 .707-.023Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd" />
    </svg>
  );
}

function StatusBadge({ status }: { status: Status }) {
  const tone = STATUS_STYLE[status];
  return (
    <span
      className="inline-flex w-fit items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
      style={tone}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}

function BackToCatalog() {
  const navigate = useNavigate();
  return (
    <button
      type="button"
      onClick={() => navigate('/admin/integrations')}
      className="mb-6 flex items-center gap-1.5 text-sm transition-colors"
      style={{ color: '#9BA0B0', background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}
      onMouseEnter={(e) => { e.currentTarget.style.color = '#35353B'; }}
      onMouseLeave={(e) => { e.currentTarget.style.color = '#9BA0B0'; }}
    >
      <ChevronLeftIcon /> Integrations
    </button>
  );
}

function PrimaryButton({
  children,
  onClick,
  type = 'button',
}: {
  children: string;
  onClick?: () => void;
  type?: 'button' | 'submit';
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      className="rounded px-4 py-2 text-sm font-bold text-white transition-colors"
      style={{ backgroundColor: '#5CA6D9', border: 'none', cursor: 'pointer' }}
      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#2C82BD'; }}
      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#5CA6D9'; }}
    >
      {children}
    </button>
  );
}

function SecondaryButton({ children, onClick }: { children: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded px-4 py-2 text-sm font-bold transition-colors"
      style={{ backgroundColor: '#ffffff', color: '#35353B', border: '1px solid #CCCDD0', cursor: 'pointer' }}
      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#F7F7FA'; }}
      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#ffffff'; }}
    >
      {children}
    </button>
  );
}

function Catalog({ ms }: { ms: MsState }) {
  const navigate = useNavigate();
  const cards: { id: string; name: string; summary: string; status: Status }[] = [
    { id: 'microsoft', name: 'Microsoft', summary: MICROSOFT_SUMMARY, status: msStatus(ms) },
    ...PLACEHOLDERS,
  ];

  const groups = GROUP_ORDER
    .map((group) => ({
      ...group,
      cards: cards
        .filter((card) => card.status === group.status)
        .sort((a, b) => (a.id === 'microsoft' ? -1 : b.id === 'microsoft' ? 1 : a.name.localeCompare(b.name))),
    }))
    .filter((group) => group.cards.length > 0);

  const showHeadings = groups.length > 1 || groups[0]?.status !== 'not_connected';

  return (
    <div>
      <div className="pb-4">
        <h1 className="text-2xl font-semibold" style={{ color: '#35353B' }}>Integrations</h1>
        <p className="text-sm" style={{ color: '#757677' }}>
          Connections for this customer. One Microsoft connection covers SharePoint and OneDrive.
        </p>
      </div>

      <div className="flex flex-col gap-6">
        {groups.map((group) => (
          <section key={group.status}>
            {showHeadings && (
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide" style={{ color: '#9BA0B0' }}>
                {group.label}
              </h2>
            )}
            <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
              {group.cards.map((card) => (
                <button
                  key={card.id}
                  type="button"
                  onClick={() => navigate(`/admin/integrations/${card.id}`)}
                  className="flex flex-col items-start gap-2 rounded p-4 text-left transition-colors"
                  style={{ backgroundColor: '#ffffff', border: '1px solid #CCCDD0', cursor: 'pointer' }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#F7F7FA'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#ffffff'; }}
                >
                  <span className="flex w-full items-start justify-between gap-3">
                    <span className="text-sm font-semibold" style={{ color: '#35353B' }}>{card.name}</span>
                    <StatusBadge status={card.status} />
                  </span>
                  <span className="text-sm" style={{ color: '#757677' }}>{card.summary}</span>
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

function PlaceholderScreen({ name, summary, status }: { name: string; summary: string; status: Status }) {
  return (
    <div className="max-w-2xl">
      <BackToCatalog />
      <div className="mb-4 flex items-center gap-3">
        <h1 className="text-xl font-semibold" style={{ color: '#35353B' }}>{name}</h1>
        <StatusBadge status={status} />
      </div>
      <p className="text-sm" style={{ color: '#757677' }}>{summary}</p>
      <div className="mt-4 rounded bg-white p-4" style={{ border: '1px solid #CCCDD0' }}>
        <p className="text-sm" style={{ color: '#35353B' }}>
          Placeholder. This prototype has no connect flow for it.
        </p>
      </div>
    </div>
  );
}

function MicrosoftScreen({ ms, setMs }: { ms: MsState; setMs: (s: MsState) => void }) {
  const [consent, setConsent] = useState(false);
  const [siteName, setSiteName] = useState('');
  const [siteError, setSiteError] = useState('');
  const status = msStatus(ms);

  function accept() {
    commitMs({ connected: true, sites: [], notice: null }, setMs);
    setConsent(false);
    setSiteName('');
    setSiteError('');
  }

  function deny() {
    commitMs({ connected: false, sites: [], notice: 'denied' }, setMs);
    setConsent(false);
  }

  function disconnect() {
    commitMs({ connected: false, sites: [], notice: 'disconnected' }, setMs);
    setConsent(false);
    setSiteName('');
    setSiteError('');
  }

  function addSite(name: string) {
    const trimmed = name.trim();
    if (!trimmed) {
      setSiteError('Enter a site name.');
      return;
    }
    if (ms.sites.some((site) => site.name.toLowerCase() === trimmed.toLowerCase())) {
      setSiteError('That site is already on the list.');
      return;
    }
    commitMs({
      ...ms,
      sites: [...ms.sites, { id: `site-${Date.now()}`, name: trimmed }],
    }, setMs);
    setSiteName('');
    setSiteError('');
  }

  function removeSite(id: string) {
    commitMs({ ...ms, sites: ms.sites.filter((site) => site.id !== id) }, setMs);
  }

  return (
    <div className="max-w-2xl">
      <BackToCatalog />
      <div className="mb-1 flex items-center gap-3">
        <h1 className="text-xl font-semibold" style={{ color: '#35353B' }}>Microsoft</h1>
        <StatusBadge status={status} />
      </div>
      <p className="mb-4 text-sm" style={{ color: '#757677' }}>{MICROSOFT_SUMMARY}</p>

      {consent ? (
        <div className="rounded bg-white p-4" style={{ border: '1px solid #CCCDD0' }}>
          <h2 className="text-sm font-semibold" style={{ color: '#35353B' }}>Accept Microsoft access</h2>
          <p className="mt-1 text-sm" style={{ color: '#757677' }}>
            A Microsoft admin for this customer signs in and accepts. Permissions are already set. Accept stores the connection. Deny stores nothing.
          </p>
          <p className="mt-2 text-sm" style={{ color: '#757677' }}>
            This prototype does not open Microsoft.
          </p>
          <div className="mt-4 flex gap-2">
            <SecondaryButton onClick={deny}>Deny</SecondaryButton>
            <PrimaryButton onClick={accept}>Accept</PrimaryButton>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {ms.notice === 'denied' && (
            <p className="rounded px-3 py-2 text-sm" style={{ backgroundColor: '#E9F6FF', color: '#35353B' }}>
              Access was denied. No connection was saved.
            </p>
          )}
          {ms.notice === 'disconnected' && (
            <p className="rounded px-3 py-2 text-sm" style={{ backgroundColor: '#E9F6FF', color: '#35353B' }}>
              Disconnected in SmartSense. Revoking access in Microsoft is separate, and Microsoft is the source of truth.
            </p>
          )}

          {!ms.connected && (
            <div className="rounded bg-white p-4" style={{ border: '1px solid #CCCDD0' }}>
              <p className="text-sm" style={{ color: '#35353B' }}>
                Not connected. A Microsoft admin accepts access once for this customer. You add sites after that.
              </p>
              <div className="mt-4">
                <PrimaryButton onClick={() => { commitMs({ ...ms, notice: null }, setMs); setConsent(true); }}>
                  Connect Microsoft
                </PrimaryButton>
              </div>
            </div>
          )}

          {ms.connected && (
            <>
              <div className="rounded bg-white p-4" style={{ border: '1px solid #CCCDD0' }}>
                <p className="text-sm" style={{ color: '#35353B' }}>
                  {ms.sites.length === 0
                    ? 'Connected, no sites granted. Authors cannot browse until at least one site is on this list.'
                    : 'Connected and ready. Authors can browse these sites when they attach a cloud file to a checklist item.'}
                </p>

                {ms.sites.length > 0 && (
                  <ul className="mt-3 flex flex-col" style={{ borderTop: '1px solid #CCCDD0' }}>
                    {ms.sites.map((site) => (
                      <li
                        key={site.id}
                        className="flex items-center justify-between gap-3 py-2.5"
                        style={{ borderBottom: '1px solid #CCCDD0' }}
                      >
                        <span className="text-sm" style={{ color: '#35353B' }}>{site.name}</span>
                        <button
                          type="button"
                          onClick={() => removeSite(site.id)}
                          className="text-sm transition-colors"
                          style={{ color: '#757677', background: 'transparent', border: 'none', cursor: 'pointer' }}
                          onMouseEnter={(e) => { e.currentTarget.style.color = '#35353B'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.color = '#757677'; }}
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                )}

                <form
                  className="mt-4 flex flex-wrap items-start gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    addSite(siteName);
                  }}
                >
                  <div className="min-w-[200px] flex-1">
                    <label className="mb-1 block text-xs font-semibold" style={{ color: '#757677' }} htmlFor="site-name">
                      Site name
                    </label>
                    <input
                      id="site-name"
                      value={siteName}
                      onChange={(e) => { setSiteName(e.target.value); setSiteError(''); }}
                      placeholder="Brand standards"
                      className="w-full rounded px-3 py-2 text-sm focus:outline-none"
                      style={{ border: '1px solid #CCCDD0', backgroundColor: '#ffffff', color: '#35353B' }}
                      onFocus={(e) => { e.currentTarget.style.borderColor = '#9BA0B0'; }}
                      onBlur={(e) => { e.currentTarget.style.borderColor = '#CCCDD0'; }}
                    />
                    {siteError && (
                      <p className="mt-1 text-xs" style={{ color: '#B91C1C' }}>{siteError}</p>
                    )}
                  </div>
                  <div className="pt-5">
                    <PrimaryButton type="submit">Add site</PrimaryButton>
                  </div>
                </form>
              </div>

              <div className="rounded bg-white p-4" style={{ border: '1px solid #CCCDD0' }}>
                <h2 className="text-sm font-semibold" style={{ color: '#35353B' }}>Disconnect</h2>
                <p className="mt-1 text-sm" style={{ color: '#757677' }}>
                  Disconnect drops the connection in SmartSense and returns to Not connected. Revoking access in Microsoft is separate. Microsoft is the source of truth.
                </p>
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={disconnect}
                    className="rounded px-4 py-2 text-sm font-bold transition-colors"
                    style={{ backgroundColor: '#ffffff', color: '#DC2626', border: '1px solid #FECACA', cursor: 'pointer' }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#FEF2F2'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#ffffff'; }}
                  >
                    Disconnect
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function IntegrationsPage() {
  const { slug } = useParams();
  const [ms, setMs] = useState<MsState>(() => msMemory);
  const placeholder = PLACEHOLDERS.find((item) => item.id === slug);

  if (!slug) return <Catalog ms={ms} />;
  if (slug === 'microsoft') return <MicrosoftScreen ms={ms} setMs={setMs} />;
  if (placeholder) {
    return <PlaceholderScreen name={placeholder.name} summary={placeholder.summary} status={placeholder.status} />;
  }

  return (
    <div className="max-w-2xl">
      <BackToCatalog />
      <p className="text-sm" style={{ color: '#757677' }}>This integration is not in the catalog.</p>
    </div>
  );
}
