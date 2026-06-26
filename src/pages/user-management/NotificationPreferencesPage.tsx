import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

// ── Types + seed data (minimal copy — do not import from PersonDetailPage) ──────

type Pref = { source: string; notification: string; email: boolean; sms: boolean; push: boolean };
type RosterEntry = { id: string; name: string; email: string };

// Prototype stubs — shared across all people until wired to real data.
const MOBILE = '(555) 123-4567';
const CARRIER = 'Verizon';

// Identity roster — mirrors SEED_PEOPLE in PersonDetailPage so every person
// keeps their own name/email. Notification tables are defined separately below.
const ROSTER: RosterEntry[] = [
  { id: 'p11', name: 'Aisha Kamara',     email: 'aisha@acme.com' },
  { id: 'p4',  name: 'Alex Merritt',     email: 'alex@acme.com' },
  { id: 'p16', name: 'Ben Caldwell',     email: 'ben@acme.com' },
  { id: 'p9',  name: 'Camille Fontaine', email: 'camille@acme.com' },
  { id: 'p20', name: 'Clara Hutchins',   email: 'clara@acme.com' },
  { id: 'p6',  name: 'Daniel Park',      email: 'daniel@acme.com' },
  { id: 'p15', name: 'Fatima Al-Rashid', email: 'fatima@acme.com' },
  { id: 'p18', name: 'Grace Mbeki',      email: 'grace@acme.com' },
  { id: 'p1',  name: 'Jane Holloway',    email: 'jane@acme.com' },
  { id: 'p10', name: 'James Rutherford', email: 'james@acme.com' },
  { id: 'p12', name: 'Luis Vega',        email: 'luis@acme.com' },
  { id: 'p2',  name: 'Mark Delgado',     email: 'mark@acme.com' },
  { id: 'p13', name: 'Nina Kowalski',    email: 'nina@acme.com' },
  { id: 'p14', name: 'Owen Tran',        email: 'owen@acme.com' },
  { id: 'p3',  name: 'Priya Nair',       email: 'priya@acme.com' },
  { id: 'p7',  name: 'Rachel Osei',      email: 'rachel@acme.com' },
  { id: 'p19', name: 'Sam Erikson',      email: 'sam@acme.com' },
  { id: 'p5',  name: 'Sofia Brennan',    email: 'sofia@acme.com' },
  { id: 'p8',  name: 'Tom Whitfield',    email: 'tom@acme.com' },
  { id: 'p17', name: 'Yuki Tanaka',      email: 'yuki@acme.com' },
];

// Explicit notification tables. Anyone not listed borrows Ben's table (FALLBACK_PREFS).
const PREFS_BY_ID: Record<string, Pref[]> = {
  p16: [
    { source: 'Lists', notification: 'Item overdue',      email: true, sms: false, push: true },
    { source: 'Lists', notification: 'Item out of range', email: true, sms: false, push: false },
  ],
  p1: [
    { source: 'Lists',   notification: 'Item overdue',   email: true,  sms: false, push: true },
    { source: 'Lists',   notification: 'List completed',  email: false, sms: false, push: true },
    { source: 'Sensors', notification: 'Critical alarm',  email: true,  sms: true,  push: false },
  ],
  p11: [
    { source: 'Lists',       notification: 'Item overdue',        email: true, sms: false, push: true },
    { source: 'Lists',       notification: 'Item out of range',   email: true, sms: false, push: false },
    { source: 'Sensors',     notification: 'Critical alarm',      email: true, sms: true,  push: false },
    { source: 'Sensors',     notification: 'Warning alarm',       email: true, sms: false, push: false },
    { source: 'Work Orders', notification: 'Work order assigned', email: true, sms: false, push: true },
    { source: 'Work Orders', notification: 'Work order past due', email: true, sms: true,  push: true },
  ],
};

const FALLBACK_ENTRY = ROSTER.find((p) => p.id === 'p16')!;
const FALLBACK_PREFS = PREFS_BY_ID['p16'];

// ── Icons ───────────────────────────────────────────────────────────────────

function ChevronLeftIcon() {
  return <svg width="16" height="16" viewBox="0 0 15 15" fill="none"><path d="M8.842 3.135a.5.5 0 0 1 .023.707L5.435 7.5l3.43 3.658a.5.5 0 0 1-.73.684l-3.75-4a.5.5 0 0 1 0-.684l3.75-4a.5.5 0 0 1 .707-.023Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd" /></svg>;
}

// ── Toggle switch ─────────────────────────────────────────────────────────────

function ToggleSwitch({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className="flex h-5 w-9 items-center rounded-full px-0.5 cursor-pointer transition-colors"
      style={{ backgroundColor: on ? '#1678C2' : '#CCCDD0' }}
      aria-label="Toggle notification channel"
    >
      <span
        className={`h-4 w-4 rounded-full bg-white transition-transform duration-150 ${on ? 'translate-x-4' : 'translate-x-0'}`}
      />
    </button>
  );
}

type Channel = 'email' | 'sms' | 'push';

// ── Page ──────────────────────────────────────────────────────────────────────

export default function NotificationPreferencesPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const person = ROSTER.find((p) => p.id === id) ?? FALLBACK_ENTRY;
  const prefsSource = PREFS_BY_ID[person.id] ?? FALLBACK_PREFS;

  const [prefs, setPrefs] = useState<Pref[]>(() => prefsSource.map((p) => ({ ...p })));

  // Re-sync when navigating between people (route param changes without remount).
  useEffect(() => {
    setPrefs(prefsSource.map((p) => ({ ...p })));
  }, [person.id]);

  function toggle(rowIndex: number, channel: Channel) {
    setPrefs((prev) => prev.map((p, i) => (i === rowIndex ? { ...p, [channel]: !p[channel] } : p)));
  }

  return (
    <div className="mx-auto max-w-2xl pb-16">
      <button
        onClick={() => navigate(`/admin/people/${person.id}`)}
        className="mb-6 flex items-center gap-1.5 text-sm transition-colors"
        style={{ color: '#9BA0B0' }}
        onMouseEnter={e => e.currentTarget.style.color = '#35353B'}
        onMouseLeave={e => e.currentTarget.style.color = '#9BA0B0'}
      >
        <ChevronLeftIcon /> {person.name}
      </button>

      <h1 className="mb-6 text-xl font-semibold" style={{ color: '#35353B' }}>Notification Preferences</h1>

      <div className="space-y-4">
        {/* Section 1 — Contact Information */}
        <div className="rounded bg-white p-4" style={{ border: '1px solid #CCCDD0' }}>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide" style={{ color: '#9BA0B0' }}>Contact Information</p>
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium" style={{ color: '#35353B' }}>{person.name}</span>
            <span className="text-sm" style={{ color: '#757677' }}>{person.email}</span>
            <span className="text-sm" style={{ color: '#757677' }}>{MOBILE}</span>
            <span className="text-sm" style={{ color: '#757677' }}>{CARRIER}</span>
          </div>
          <button
            onClick={() => navigate(`/admin/people/${person.id}`)}
            className="mt-3 text-sm transition-colors"
            style={{ color: '#1678C2', textDecoration: 'none' }}
            onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
            onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
          >
            Edit contact information in Profile →
          </button>
        </div>

        {/* Section 2 — Notification Preferences table */}
        <div className="rounded bg-white" style={{ border: '1px solid #CCCDD0' }}>
          {/* Header row */}
          <div className="flex items-center px-4 py-3" style={{ borderBottom: '1px solid #CCCDD0' }}>
            <span className="w-32 flex-shrink-0 text-xs font-semibold" style={{ color: '#9BA0B0' }}>Source</span>
            <span className="flex-1 text-xs font-semibold" style={{ color: '#9BA0B0' }}>Notification</span>
            <span className="w-16 flex-shrink-0 text-center text-xs font-semibold" style={{ color: '#9BA0B0' }}>Email</span>
            <span className="w-16 flex-shrink-0 text-center text-xs font-semibold" style={{ color: '#9BA0B0' }}>SMS</span>
            <span className="w-16 flex-shrink-0 text-center text-xs font-semibold" style={{ color: '#9BA0B0' }}>Push</span>
          </div>

          {/* Data rows — newspaper-column source grouping */}
          {prefs.map((row, i) => {
            const isFirstOfGroup = i === 0 || prefs[i - 1].source !== row.source;
            const isLastOfGroup = i === prefs.length - 1 || prefs[i + 1].source !== row.source;
            const showDivider = isLastOfGroup && i !== prefs.length - 1;
            return (
              <div
                key={i}
                className="flex items-center px-4 py-3"
                style={showDivider ? { borderBottom: '1px solid #CCCDD0' } : undefined}
              >
                <span className="w-32 flex-shrink-0 whitespace-nowrap text-sm font-medium" style={{ color: '#35353B' }}>
                  {isFirstOfGroup ? row.source : ''}
                </span>
                <span className="flex-1 text-sm" style={{ color: '#35353B' }}>{row.notification}</span>
                <span className="flex w-16 flex-shrink-0 justify-center">
                  <ToggleSwitch on={row.email} onToggle={() => toggle(i, 'email')} />
                </span>
                <span className="flex w-16 flex-shrink-0 justify-center">
                  <ToggleSwitch on={row.sms} onToggle={() => toggle(i, 'sms')} />
                </span>
                <span className="flex w-16 flex-shrink-0 justify-center">
                  <ToggleSwitch on={row.push} onToggle={() => toggle(i, 'push')} />
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
