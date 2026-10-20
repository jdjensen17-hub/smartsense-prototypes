// Partner Portal (working name) — Admin › API Keys prototype store.
// Sample org, partners, people, and stores are fictional on purpose: this prototype ships to a public URL.
// Prototype state only — a reload resets the seed.

import { useSyncExternalStore } from 'react';

export type KeyStatus = 'active' | 'revoked';
export type ReasonKey = 'notorg' | 'idnofallback' | 'ambiguous' | 'notfound' | 'none' | 'ratelimited';
export type ViewAs = 'admin' | 'support';

export type ApiKey = {
  id: string;
  name: string;
  status: KeyStatus;
  created: string;
  createdBy: string;
  lastUsed: string | null;
  events: number;
  last4: string;
  notes: string;
  /** Set once a key has been rotated. */
  rotatedOn?: string;
  /** Calls made with a rotated-out or revoked token, rejected at auth. */
  oldKeyCalls?: { last: string | null; count: number; last4: string };
  revokedOn?: string;
  revokedBy?: string;
  /** The revoked key this one was created to replace. */
  replacesKeyId?: string;
  /** The key created to replace this revoked one. */
  replacedByKeyId?: string;
};

export type KeyEvent = {
  id: string;
  at: string;
  /** What the partner sent: a location ID, "store 1042", both, or nothing. */
  sent: string;
  /** Location ID the event resolved to, or null when it was rejected. */
  resolved: string | null;
  type: string;
  title: string;
  ok: boolean;
  reason?: ReasonKey;
  test?: boolean;
  /** Accepted, still matching the location. */
  pending?: boolean;
};

export type RejectedEvent = {
  key: string;
  at: string;
  sent: string;
  type: string;
  title: string;
  reason: ReasonKey;
  test?: boolean;
};

export type OrgLocation = {
  id: string;
  name: string;
  store: string;
  address: string;
  active?: boolean;
};

export const ORG = { name: 'Summit Fuel & Market', file: 'summit_fuel_market' };
/** Signed-in org admin for this prototype. */
export const ME = 'Tasha Reed';
/** Placeholder number. Dev and Arch/Sec set the real one. */
export const RATE_LIMIT = '60 events per minute';
export const NAME_MAX = 40;
/** How long an accepted test event shows "Resolving…" before its outcome lands. */
export const RESOLVE_MS = 1500;
/** The sample data is dated to this day, so new keys and actions stamp the same date. */
const TODAY = 'Oct 19, 2026';

export const TASK_TYPES: { key: string; label: string; role: string | null }[] = [
  { key: 'generic.task', label: 'Generic task', role: null },
  { key: 'pump.service_needed', label: 'Pump service needed', role: 'Store Manager' },
  { key: 'inventory.restock', label: 'Inventory restock', role: 'Store Associate' },
];

export const ORG_ROLES = ['District Manager', 'Store Manager', 'Store Associates', 'Food Service Lead', 'Fuel Tech'];

export const LOCATIONS: OrgLocation[] = [
  { id: 'loc_8f2c41a7', name: 'Store 1042 · Maple Grove', store: '1042', address: '123 Example St, Maple Grove' },
  { id: 'loc_5a60f3b8', name: 'Store 1188 · Oak Hollow', store: '1188', address: '45 Sample Ave, Oak Hollow' },
  { id: 'loc_e4417c2f', name: 'Store 0931 · Pine Ridge', store: '0931', address: '780 Demo Rd, Pine Ridge' },
  { id: 'loc_3b9e07d2', name: 'Store 0217 · Brookside (Main St)', store: '0217', address: '12 Example Blvd, Brookside' },
  { id: 'loc_c71d5e90', name: 'Store 0217 · Brookside (Car Wash)', store: '0217', address: '14 Example Blvd, Brookside' },
  { id: 'loc_92ad6b15', name: 'Store 1306 · Riverbend', store: '1306', address: '300 Mock Ln, Riverbend' },
  { id: 'loc_1f7bc8e3', name: 'Store 0588 · Elm Park', store: '0588', address: '9 Test Way, Elm Park' },
  { id: 'loc_6d02a94c', name: 'Store 1420 · Lakeview', store: '1420', address: '' },
  { id: 'loc_b2e85f61', name: 'Store 0764 · Willow Creek', store: '0764', address: '55 Fictional Dr, Willow Creek', active: false },
];

/** The locations CSV covers active locations only. */
export const ACTIVE_LOCATIONS = LOCATIONS.filter((location) => location.active !== false);

export const REASONS: Record<ReasonKey, string> = {
  notorg: "Location isn't in your organization",
  idnofallback: 'Location ID not found (store number not used)',
  ambiguous: 'Store number matches more than one location',
  notfound: 'Store number not found',
  none: 'No location sent',
  ratelimited: 'Rate limited',
};

const SEED_KEYS: ApiKey[] = [
  {
    id: 'pumps',
    name: 'Summit Pumps (PumpLink)',
    status: 'active',
    created: 'Sep 22, 2026',
    createdBy: 'Tasha Reed',
    lastUsed: '4 min ago',
    events: 1284,
    last4: 'q7Xa',
    notes: 'PumpLink support · ticket SF-4471',
    rotatedOn: 'Oct 18, 2026',
    oldKeyCalls: { last: 'Oct 19, 9:14 AM', count: 3, last4: 'Hd2w' },
  },
  {
    id: 'stockwise',
    name: 'StockWise Inventory',
    status: 'active',
    created: 'Oct 2, 2026',
    createdBy: 'Marcus Bell',
    lastUsed: '2 hr ago',
    events: 312,
    last4: 'M2pe',
    notes: 'StockWise · integrations contact on file',
  },
  {
    id: 'camera',
    name: 'Camera Vendor',
    status: 'active',
    created: 'Oct 16, 2026',
    createdBy: 'Tasha Reed',
    lastUsed: null,
    events: 0,
    last4: 'Zr81',
    notes: '',
  },
  {
    id: 'cmms',
    name: 'Facilities CMMS (FixFlow)',
    status: 'revoked',
    created: 'Aug 4, 2026',
    createdBy: 'Marcus Bell',
    lastUsed: 'Oct 10, 2026',
    events: 96,
    last4: 'b4Lk',
    notes: 'Pilot ended',
    revokedOn: 'Oct 10, 2026',
    revokedBy: 'Marcus Bell',
  },
];

const SEED_EVENTS: Record<string, KeyEvent[]> = {
  pumps: [
    { id: 'ev-p1', at: 'Oct 19, 3:31 PM', sent: 'loc_8f2c41a7', resolved: 'loc_8f2c41a7', type: 'pump.service_needed', title: 'Pump 4: receipt paper low', ok: true },
    { id: 'ev-p2', at: 'Oct 19, 3:02 PM', sent: 'loc_00a1ffe2', resolved: null, type: 'pump.service_needed', title: 'Pump 6: receipt paper out', ok: false, reason: 'notorg' },
    { id: 'ev-p3', at: 'Oct 19, 2:47 PM', sent: 'loc_5a60f3b8', resolved: 'loc_5a60f3b8', type: 'pump.service_needed', title: 'Pump 2: card reader offline', ok: true },
    { id: 'ev-p4', at: 'Oct 19, 1:40 PM', sent: 'store 0217', resolved: null, type: 'pump.service_needed', title: 'Pump 9: nozzle leak reported', ok: false, reason: 'ambiguous' },
    { id: 'ev-p5', at: 'Oct 19, 12:15 PM', sent: 'store 1306', resolved: 'loc_92ad6b15', type: 'pump.service_needed', title: 'Pump 1: receipt paper low', ok: true },
    { id: 'ev-p6', at: 'Oct 19, 10:58 AM', sent: 'loc_e4417c2f', resolved: 'loc_e4417c2f', type: 'generic.task', title: 'Canopy light out over pump 7', ok: true },
  ],
  stockwise: [
    { id: 'ev-s1', at: 'Oct 19, 1:36 PM', sent: 'loc_1f7bc8e3', resolved: 'loc_1f7bc8e3', type: 'inventory.restock', title: 'Restock seltzer 12oz (cooler 3)', ok: true },
    { id: 'ev-s2', at: 'Oct 19, 12:02 PM', sent: 'loc_1f7bc8e3', resolved: null, type: 'inventory.restock', title: 'Restock seltzer 12oz (cooler 1)', ok: false, reason: 'ratelimited' },
    { id: 'ev-s3', at: 'Oct 19, 11:05 AM', sent: 'store 2290', resolved: null, type: 'inventory.restock', title: 'Restock cigar singles (back bar)', ok: false, reason: 'notfound' },
    { id: 'ev-s4', at: 'Oct 18, 6:12 PM', sent: '', resolved: null, type: 'inventory.restock', title: 'Restock house coffee 2lb', ok: false, reason: 'none' },
    { id: 'ev-s5', at: 'Oct 18, 4:40 PM', sent: 'store 1042', resolved: 'loc_8f2c41a7', type: 'inventory.restock', title: 'Restock fountain cups 32oz', ok: true },
  ],
  camera: [],
  cmms: [
    { id: 'ev-c1', at: 'Oct 10, 8:20 AM', sent: 'loc_3b9e07d2', resolved: 'loc_3b9e07d2', type: 'generic.task', title: 'HVAC filter change due', ok: true },
    { id: 'ev-c2', at: 'Oct 9, 2:05 PM', sent: 'loc_92ad6b15', resolved: 'loc_92ad6b15', type: 'generic.task', title: 'Ice machine PM visit', ok: true },
  ],
};

/** Older rejections, outside the "recent" lists. Rejected counts add these to the recent rows. */
const SEED_EXTRA_REJECTED: RejectedEvent[] = [
  { key: 'pumps', at: 'Oct 18, 9:30 AM', sent: 'loc_77c0e1d4', type: 'pump.service_needed', title: 'Pump 3: receipt paper low', reason: 'notorg' },
  { key: 'pumps', at: 'Oct 17, 7:52 PM', sent: 'store 0217', type: 'pump.service_needed', title: 'Pump 5: card reader offline', reason: 'ambiguous' },
  { key: 'stockwise', at: 'Oct 17, 2:22 PM', sent: 'loc_8f2c41a0 + store 1042', type: 'inventory.restock', title: 'Restock energy drink 16oz', reason: 'idnofallback' },
  { key: 'stockwise', at: 'Oct 17, 9:48 AM', sent: 'store 0931', type: 'inventory.restock', title: 'Restock energy drink 8.4oz', reason: 'ratelimited' },
];

/** What the Test screen shows for the last event sent with a key. */
export type TestResult = { eventId: string; taskId: string; message?: string };

export type ApiKeyState = {
  keys: ApiKey[];
  events: Record<string, KeyEvent[]>;
  extraRejected: RejectedEvent[];
  lastTest: Record<string, TestResult>;
  viewAs: ViewAs;
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function seed(viewAs: ViewAs): ApiKeyState {
  return { keys: clone(SEED_KEYS), events: clone(SEED_EVENTS), extraRejected: clone(SEED_EXTRA_REJECTED), lastTest: {}, viewAs };
}

let state: ApiKeyState = seed('admin');
/** Tokens handed out by deep links, so re-entering the same URL shows the same key. */
const deepLinkTokens = new Map<string, string>();
/** Rotations performed by a deep link, memoized so re-entering the URL shows the same new key. */
const deepLinkRotations = new Map<string, { token: string; oldLast4: string }>();
let tokenSeq = 0;
let eventSeq = 0;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

function replace(next: ApiKeyState) {
  state = next;
  emit();
}

export function slug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export function partnerTag(name: string) {
  return `partner:${slug(name || '') || 'key-name'}`;
}

function makeToken(seedText = '') {
  tokenSeq += 1;
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  let token = 'ssk_live_';
  let x = 7 + tokenSeq * 13 + [...seedText].reduce((hash, char) => (hash * 31 + char.charCodeAt(0)) % 99991, 0);
  for (let i = 0; i < 40; i += 1) {
    x = (x * 1103515245 + 12345) % 2147483648;
    token += alphabet[(x >> 8) % alphabet.length];
  }
  return token;
}

export function getLocation(id: string | null) {
  return LOCATIONS.find((location) => location.id === id) ?? null;
}

export function storeNumberCounts() {
  const counts: Record<string, number> = {};
  LOCATIONS.forEach((location) => {
    counts[location.store] = (counts[location.store] ?? 0) + 1;
  });
  return counts;
}

export function allRejected(snapshot: ApiKeyState): RejectedEvent[] {
  const rows: RejectedEvent[] = [];
  snapshot.keys.forEach((key) => {
    (snapshot.events[key.id] ?? []).forEach((event) => {
      if (!event.ok && !event.pending) {
        rows.push({ key: key.id, at: event.at, sent: event.sent, type: event.type, title: event.title, reason: event.reason ?? 'none', test: event.test });
      }
    });
  });
  snapshot.extraRejected.forEach((row) => rows.push({ ...row }));
  return rows;
}

export function rejectedFor(snapshot: ApiKeyState, keyId: string) {
  return allRejected(snapshot).filter((row) => row.key === keyId);
}

function editDistance(a: string, b: string) {
  const grid = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array<number>(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j += 1) grid[0][j] = j;
  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      grid[i][j] = Math.min(grid[i - 1][j] + 1, grid[i][j - 1] + 1, grid[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
  }
  return grid[a.length][b.length];
}

/** Hint only. Matching itself stays exact. */
export function nearMissRole(role: string, roles: string[]) {
  const normalize = (value: string) => value.toLowerCase().replace(/[^a-z]/g, '');
  return roles.find((candidate) => candidate !== role && editDistance(normalize(candidate), normalize(role)) <= 2) ?? null;
}

export type LocationOutcome = { loc: OrgLocation; reason?: undefined; message?: undefined } | { loc?: undefined; reason: ReasonKey; message: string };

/**
 * smartsense_location_id wins when it is sent. An ID that isn't in the org is rejected even when a
 * valid store number comes with it — there is no fallback. A store number alone resolves only when
 * it is unique in the org.
 */
export function resolveLocation(locId: string, store: string): LocationOutcome {
  const storeMatches = store ? LOCATIONS.filter((location) => location.store === store) : [];
  if (locId) {
    const loc = getLocation(locId);
    if (loc) return { loc };
    if (storeMatches.length === 1) {
      return { reason: 'idnofallback', message: "We can't find this SmartSense location ID. We don't fall back to the store number when an ID is sent." };
    }
    return { reason: 'notorg', message: "This location isn't in your organization." };
  }
  if (storeMatches.length === 1) return { loc: storeMatches[0] };
  if (storeMatches.length > 1) {
    return { reason: 'ambiguous', message: `Store number ${store} matches more than one location. Use the SmartSense location ID.` };
  }
  return { reason: 'notfound', message: `We can't find store number ${store}.` };
}

function csvCell(value: string) {
  return /[",\n]/.test(value || '') ? `"${String(value).replace(/"/g, '""')}"` : value || '';
}

export function locationsCsv() {
  const counts = storeNumberCounts();
  return ['Location name,Store number,Address,SmartSense location ID,Note']
    .concat(
      ACTIVE_LOCATIONS.map((location) =>
        [
          location.name,
          location.store,
          location.address,
          location.id,
          counts[location.store] > 1 ? 'Store number shared: use the SmartSense location ID' : '',
        ]
          .map(csvCell)
          .join(','),
      ),
    )
    .join('\n');
}

export function rejectedEventsCsv(rows: RejectedEvent[], keyName: (keyId: string) => string) {
  return ['Received,API key,Location sent,Title,Task type,Reason']
    .concat(rows.map((row) => [row.at, keyName(row.key), row.sent, row.title, row.type, REASONS[row.reason]].map(csvCell).join(',')))
    .join('\n');
}

export function downloadCsv(fileName: string, text: string) {
  const link = document.createElement('a');
  link.href = URL.createObjectURL(new Blob([text], { type: 'text/csv' }));
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
}

function clockStamp() {
  return `Oct 19, ${new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
}

export const apiKeys = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  getSnapshot() {
    return state;
  },
  get(keyId: string) {
    return state.keys.find((key) => key.id === keyId) ?? null;
  },
  reset() {
    deepLinkTokens.clear();
    deepLinkRotations.clear();
    replace(seed(state.viewAs));
  },
  setViewAs(viewAs: ViewAs) {
    if (state.viewAs === viewAs) return;
    replace({ ...state, viewAs });
  },
  /** Only active keys hold a name. A revoked key's name is free to reuse for its replacement. */
  nameTaken(name: string) {
    const normalized = name.trim().toLowerCase();
    return state.keys.some((key) => key.status === 'active' && key.name.trim().toLowerCase() === normalized);
  },
  create({ name, notes, replacesKeyId }: { name: string; notes: string; replacesKeyId?: string }) {
    const token = makeToken(name);
    const trimmed = name.trim();
    let id = slug(trimmed) || `key-${state.keys.length}`;
    if (state.keys.some((key) => key.id === id)) id += `-${state.keys.length}`;
    const key: ApiKey = {
      id,
      name: trimmed,
      status: 'active',
      created: TODAY,
      createdBy: ME,
      lastUsed: null,
      events: 0,
      last4: token.slice(-4),
      notes: notes.trim(),
      ...(replacesKeyId ? { replacesKeyId } : {}),
    };
    replace({
      ...state,
      keys: [key, ...state.keys].map((item) => (item.id === replacesKeyId ? { ...item, replacedByKeyId: id } : item)),
      events: { ...state.events, [id]: [] },
    });
    return { key, token };
  },
  /** For the ?modal=token deep link: creating the sample key twice must hand back the same token. */
  ensureKey(name: string) {
    const existing = state.keys.find((key) => key.name.toLowerCase() === name.trim().toLowerCase());
    if (existing) {
      const token = deepLinkTokens.get(existing.id);
      if (token) return { key: existing, token };
      const fresh = makeToken(existing.id);
      deepLinkTokens.set(existing.id, fresh);
      return { key: existing, token: fresh };
    }
    const created = apiKeys.create({ name, notes: '' });
    deepLinkTokens.set(created.key.id, created.token);
    return created;
  },
  /** For the ?modal=token deep link on a key detail: rotating twice must not issue two keys. */
  rotateOnce(keyId: string) {
    const memo = deepLinkRotations.get(keyId);
    if (memo) return memo;
    const result = apiKeys.rotate(keyId);
    deepLinkRotations.set(keyId, result);
    return result;
  },
  rotate(keyId: string) {
    const current = apiKeys.get(keyId);
    if (!current) throw new Error('API key not found');
    const token = makeToken(`${keyId}rot`);
    const oldLast4 = current.last4;
    replace({
      ...state,
      keys: state.keys.map((key) =>
        key.id === keyId ? { ...key, last4: token.slice(-4), rotatedOn: TODAY, oldKeyCalls: { last: null, count: 0, last4: oldLast4 } } : key,
      ),
    });
    return { token, oldLast4 };
  },
  revoke(keyId: string) {
    replace({
      ...state,
      keys: state.keys.map((key) => (key.id === keyId ? { ...key, status: 'revoked', revokedOn: TODAY, revokedBy: ME } : key)),
    });
  },
  saveNotes(keyId: string, notes: string) {
    replace({ ...state, keys: state.keys.map((key) => (key.id === keyId ? { ...key, notes: notes.trim() } : key)) });
  },
  /** Accepts the event right away. The caller resolves it once the location match comes back. */
  sendTestEvent({ keyId, locId, store, type, title }: { keyId: string; locId: string; store: string; type: string; title: string }) {
    eventSeq += 1;
    const event: KeyEvent = {
      id: `ev-test-${eventSeq}`,
      at: clockStamp(),
      sent: [locId, store && `store ${store}`].filter(Boolean).join(' + '),
      resolved: null,
      type,
      title: `[Test] ${title.trim()}`,
      ok: false,
      test: true,
      pending: true,
    };
    const outcome = resolveLocation(locId, store);
    const result: TestResult = {
      eventId: event.id,
      taskId: `tsk_${93021 + eventSeq * 17 + (state.events[keyId]?.length ?? 1)}`,
      message: outcome.message,
    };
    replace({
      ...state,
      // Test events count toward Events and Last used.
      keys: state.keys.map((key) => (key.id === keyId ? { ...key, lastUsed: 'Just now' } : key)),
      events: { ...state.events, [keyId]: [event, ...(state.events[keyId] ?? [])] },
      lastTest: { ...state.lastTest, [keyId]: result },
    });
    return { event, result, outcome };
  },
  resolveTestEvent(keyId: string, eventId: string, outcome: LocationOutcome) {
    const list = state.events[keyId] ?? [];
    const nextList = list.map((event) => {
      if (event.id !== eventId) return event;
      return outcome.loc
        ? { ...event, pending: false, ok: true, resolved: outcome.loc.id }
        : { ...event, pending: false, ok: false, reason: outcome.reason };
    });
    replace({
      ...state,
      keys: outcome.loc ? state.keys.map((key) => (key.id === keyId ? { ...key, events: key.events + 1 } : key)) : state.keys,
      events: { ...state.events, [keyId]: nextList },
    });
  },
};

export function useApiKeys() {
  return useSyncExternalStore(apiKeys.subscribe, apiKeys.getSnapshot);
}
