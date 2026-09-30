import { useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useParams } from 'react-router-dom';

type Status = 'connected' | 'disconnected';
type Notice = 'denied' | 'disconnected' | null;
type Site = { id: string; name: string; url: string };
type MsState = { connected: boolean; sites: Site[]; notice: Notice };

const STATUS_LABEL: Record<Status, string> = {
  connected: 'Connected',
  disconnected: 'Disconnected',
};

const STATUS_STYLE: Record<Status, { background: string; color: string; border: string }> = {
  connected: { background: '#ECFDF5', color: '#047857', border: '1px solid #A7F3D0' },
  disconnected: { background: '#F1F5F9', color: '#64748B', border: '1px solid #E2E8F0' },
};

const GROUP_ORDER: { status: Status; label: string }[] = [
  { status: 'connected', label: 'Connected' },
  { status: 'disconnected', label: 'Disconnected' },
];

const MICROSOFT_SUMMARY =
  'Link SharePoint and OneDrive files to checklist items. Store teams open them in the app without a Microsoft login.';

const SAMPLE_MICROSOFT_USER = 'itadmin@acme.onmicrosoft.com';
const SAMPLE_MICROSOFT_PASSWORD = 'not-a-real-password';

const GRANTED_SITES: Site[] = [
  { id: 'brand', name: 'Brand Standards', url: 'https://acme.sharepoint.com/sites/BrandStandards' },
  { id: 'ops', name: 'Store Operations', url: 'https://acme.sharepoint.com/sites/StoreOperations' },
  { id: 'training', name: 'Training', url: 'https://acme.sharepoint.com/sites/Training' },
  { id: 'safety', name: 'Food Safety', url: 'https://acme.sharepoint.com/sites/FoodSafety' },
  { id: 'marketing', name: 'Marketing', url: 'https://acme.sharepoint.com/sites/Marketing' },
  { id: 'legal', name: 'Legal Hold', url: 'https://acme.sharepoint.com/sites/LegalHold' },
];

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
    status: 'disconnected',
  },
  {
    id: 'box',
    name: 'Box',
    summary: 'Link Box files to checklist items. Store teams open them in the app without a Box login.',
    status: 'disconnected',
  },
];

let msMemory: MsState = { connected: false, sites: [], notice: null };

function msStatus(state: MsState): Status {
  return state.connected ? 'connected' : 'disconnected';
}

function commitMs(next: MsState, setState: (s: MsState) => void) {
  const snapshot: MsState = {
    connected: next.connected,
    notice: next.notice,
    sites: next.sites.map((s) => ({ id: s.id, name: s.name, url: s.url })),
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

  const showHeadings = groups.length > 1 || groups[0]?.status !== 'disconnected';

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

function MicrosoftMark() {
  return (
    <svg width="21" height="21" viewBox="0 0 21 21" aria-hidden="true">
      <rect width="9" height="9" fill="#f25022" />
      <rect x="12" width="9" height="9" fill="#7fba00" />
      <rect y="12" width="9" height="9" fill="#00a4ef" />
      <rect x="12" y="12" width="9" height="9" fill="#ffb900" />
    </svg>
  );
}

function EntraShell({ children }: { children: ReactNode }) {
  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 80,
        background: '#f2f2f2',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        fontFamily: '"Segoe UI", system-ui, sans-serif',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 440,
          background: '#ffffff',
          boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
          padding: '44px 44px 36px',
        }}
      >
        {children}
      </div>
      <p style={{ marginTop: 16, fontSize: 12, color: '#616161' }}>
        Prototype. This sign-in is not sent to Microsoft.
      </p>
    </div>,
    document.body,
  );
}

function EntraLogin({
  username,
  password,
  onFill,
  onLogin,
  onBack,
}: {
  username: string;
  password: string;
  onFill: () => void;
  onLogin: () => void;
  onBack: () => void;
}) {
  const ready = username.length > 0 && password.length > 0;
  return (
    <EntraShell>
      <MicrosoftMark />
      <h1 style={{ margin: '16px 0 0', fontSize: 24, fontWeight: 600, color: '#1b1b1b' }}>Sign in</h1>
      <p style={{ margin: '8px 0 20px', fontSize: 14, color: '#1b1b1b' }}>to continue to SmartSense ONE</p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (ready) onLogin();
        }}
      >
        <label htmlFor="entra-username" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>
          Email
        </label>
        <input
          id="entra-username"
          value={username}
          readOnly
          onClick={onFill}
          onFocus={onFill}
          placeholder="Click to fill a sample admin"
          style={{
            width: '100%',
            boxSizing: 'border-box',
            height: 36,
            border: 'none',
            borderBottom: '1px solid #666666',
            fontSize: 15,
            color: '#1b1b1b',
            outline: 'none',
            background: 'transparent',
            cursor: 'pointer',
          }}
        />
        <label htmlFor="entra-password" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>
          Password
        </label>
        <input
          id="entra-password"
          type="password"
          value={password}
          readOnly
          placeholder="Password"
          style={{
            width: '100%',
            boxSizing: 'border-box',
            height: 36,
            marginTop: 16,
            border: 'none',
            borderBottom: '1px solid #666666',
            fontSize: 15,
            color: '#1b1b1b',
            outline: 'none',
            background: 'transparent',
          }}
        />
        <div style={{ marginTop: 28, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button
            type="button"
            onClick={onBack}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#0067b8',
              fontSize: 15,
              fontWeight: 600,
              cursor: 'pointer',
              padding: '6px 12px',
            }}
          >
            Back
          </button>
          <button
            type="submit"
            disabled={!ready}
            style={{
              background: ready ? '#0067b8' : '#f3f2f1',
              color: ready ? '#ffffff' : '#a19f9d',
              border: 'none',
              fontSize: 15,
              fontWeight: 600,
              cursor: ready ? 'pointer' : 'default',
              padding: '8px 28px',
            }}
          >
            Login
          </button>
        </div>
      </form>
    </EntraShell>
  );
}

function EntraPermissions({
  username,
  onAccept,
  onCancel,
}: {
  username: string;
  onAccept: () => void;
  onCancel: () => void;
}) {
  return (
    <EntraShell>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <MicrosoftMark />
        <span style={{ fontSize: 12, color: '#616161' }}>{username}</span>
      </div>
      <h1 style={{ margin: '16px 0 0', fontSize: 24, fontWeight: 600, color: '#1b1b1b' }}>Permissions requested</h1>
      <p style={{ margin: '12px 0 0', fontSize: 15, fontWeight: 600, color: '#1b1b1b' }}>SmartSense ONE</p>
      <p style={{ margin: '4px 0 16px', fontSize: 14, color: '#616161' }}>
        This app is asking to access resources in your organization. The permissions are already set. Accept or cancel is the only choice.
      </p>
      <div style={{ borderTop: '1px solid #edebe9', paddingTop: 12 }}>
        <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#1b1b1b' }}>Access selected sites</p>
        <p style={{ margin: '2px 0 0', fontSize: 12, color: '#616161' }}>Sites.Selected</p>
        <p style={{ margin: '6px 0 0', fontSize: 13, color: '#1b1b1b' }}>
          Read files in the SharePoint sites an admin grants to this app. This does not include every site in the tenant.
        </p>
      </div>
      <div style={{ marginTop: 28, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <button
          type="button"
          onClick={onCancel}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#0067b8',
            fontSize: 15,
            fontWeight: 600,
            cursor: 'pointer',
            padding: '6px 12px',
          }}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onAccept}
          style={{
            background: '#0067b8',
            color: '#ffffff',
            border: 'none',
            fontSize: 15,
            fontWeight: 600,
            cursor: 'pointer',
            padding: '8px 28px',
          }}
        >
          Accept
        </button>
      </div>
    </EntraShell>
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
  const navigate = useNavigate();
  const [step, setStep] = useState<'login' | 'permissions' | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const status = msStatus(ms);

  function closeEntra() {
    setStep(null);
    setUsername('');
    setPassword('');
  }

  function accept() {
    commitMs({ connected: true, sites: [], notice: null }, setMs);
    closeEntra();
  }

  function deny() {
    commitMs({ connected: false, sites: [], notice: 'denied' }, setMs);
    closeEntra();
  }

  function disconnect() {
    commitMs({ connected: false, sites: [], notice: 'disconnected' }, setMs);
    closeEntra();
  }

  useEffect(() => {
    if (!step) return;
    function onKey(e: KeyboardEvent) {
      if (e.key !== 'Escape') return;
      if (step === 'login') closeEntra();
      if (step === 'permissions') deny();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [step]);

  function grantSite(site: Site) {
    if (ms.sites.some((existing) => existing.url.toLowerCase() === site.url.toLowerCase())) return;
    commitMs({ ...ms, sites: [...ms.sites, site] }, setMs);
  }

  const addedByUrl = new Map(ms.sites.map((site) => [site.url.toLowerCase(), site]));

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

      {step === 'login' && (
        <EntraLogin
          username={username}
          password={password}
          onFill={() => {
            setUsername(SAMPLE_MICROSOFT_USER);
            setPassword(SAMPLE_MICROSOFT_PASSWORD);
          }}
          onLogin={() => setStep('permissions')}
          onBack={closeEntra}
        />
      )}
      {step === 'permissions' && (
        <EntraPermissions username={username} onAccept={accept} onCancel={deny} />
      )}

      {step === null && (
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
                Disconnected. A Microsoft admin accepts access once for this customer. You add sites after that.
              </p>
              <div className="mt-4">
                <PrimaryButton onClick={() => { commitMs({ ...ms, notice: null }, setMs); closeEntra(); setStep('login'); }}>
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
                    ? 'Connected. No sites added yet. Authors cannot browse until you add at least one.'
                    : 'Connected and ready. Authors can browse added sites when they attach a cloud file to a checklist item.'}
                </p>
                <p className="mt-2 text-sm" style={{ color: '#757677' }}>
                  These sites are already granted in SharePoint. Click Add to make a site available to list templates.
                </p>
                <ul className="mt-3 flex flex-col" style={{ borderTop: '1px solid #CCCDD0' }}>
                  {GRANTED_SITES.map((site) => {
                    const added = addedByUrl.get(site.url.toLowerCase());
                    return (
                      <li
                        key={site.id}
                        className="flex items-center justify-between gap-3 py-2.5"
                        style={{ borderBottom: '1px solid #CCCDD0' }}
                      >
                        <span>
                          <span className="block text-sm" style={{ color: '#35353B' }}>{site.name}</span>
                          <span className="block text-xs" style={{ color: '#757677' }}>{site.url}</span>
                        </span>
                        {added ? (
                          <button
                            type="button"
                            onClick={() => removeSite(added.id)}
                            className="text-sm transition-colors"
                            style={{ color: '#757677', background: 'transparent', border: 'none', cursor: 'pointer' }}
                            onMouseEnter={(e) => { e.currentTarget.style.color = '#35353B'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.color = '#757677'; }}
                          >
                            Remove
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => grantSite(site)}
                            className="rounded px-3 py-1 text-sm font-bold text-white"
                            style={{ backgroundColor: '#5CA6D9', border: 'none', cursor: 'pointer' }}
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#2C82BD'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#5CA6D9'; }}
                          >
                            Add
                          </button>
                        )}
                      </li>
                    );
                  })}
                </ul>
                <div className="mt-4 flex justify-end">
                  <PrimaryButton onClick={() => navigate('/admin/integrations')}>Done</PrimaryButton>
                </div>
              </div>

              <div className="rounded bg-white p-4" style={{ border: '1px solid #CCCDD0' }}>
                <h2 className="text-sm font-semibold" style={{ color: '#35353B' }}>Disconnect</h2>
                <p className="mt-1 text-sm" style={{ color: '#757677' }}>
                  Click Disconnect to remove the link between SmartSense and your Microsoft sites. Your admin will have to re-login to restore the connection.
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
