// Schedule-by-asset setup for Audit templates (LW-17820).
// Audit templates are always schedule-by-asset: no By location / By asset mode.
// A reload resets the store. Demo people / auditor locations are Costco-style stubs.

import { useSyncExternalStore } from 'react';

export type AuditFrequency = 'once' | 'monthly' | 'quarterly' | 'semiannual' | 'annually';
export type DueUnit = 'days' | 'weeks' | 'months';
export type EndMode = 'none' | 'date';

export type AuditScheduleRow = {
  id: string;
  frequency: AuditFrequency;
  /** 0-11 */
  startMonth: number;
  /** 1-31 */
  startDay: number;
  dueAmount: number;
  dueUnit: DueUnit;
  endMode: EndMode;
  /** ISO YYYY-MM-DD. Kept even while endMode is 'none' so toggling back restores it. */
  endDate: string;
};

export type AudienceRow = {
  id: string;
  role: string;
  peopleMode: 'all' | 'specific';
  peopleIds: string[];
};

export type AuditSetupRecord = {
  schedules: AuditScheduleRow[];
  audiences: AudienceRow[];
};

export const FREQUENCY_LABELS: Record<AuditFrequency, string> = {
  once: 'Once (no recurrence)',
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  semiannual: 'Twice yearly',
  annually: 'Annually',
};

export const FREQUENCY_ORDER: AuditFrequency[] = ['once', 'monthly', 'quarterly', 'semiannual', 'annually'];

export const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const DUE_UNITS: DueUnit[] = ['days', 'weeks', 'months'];

// ── Demo graph: Audits content group auditor locations + OPEN-B roles ──────
export const AUDITOR_LOCATIONS: Record<string, string> = {
  jane: 'Jane Auditor',
  john: 'John Auditor',
};

/** auditorLocIds: Audits-CG locations where the person holds the auditor role.
 *  assignedAt: subset where they also hold Assigned on this template. */
export type DemoPerson = {
  id: string;
  name: string;
  auditorLocIds: string[];
  assignedAt: string[];
};

/** OPEN-B: only roles linked to person items on the Inspection Site asset template. */
export const OPEN_B_ROLES = ['Compliance Manager', 'Regional Supervisor', 'District Manager'];

export const PEOPLE_BY_ROLE: Record<string, DemoPerson[]> = {
  'Regional Supervisor': [
    { id: 'rs1', name: 'R.S. One', auditorLocIds: ['jane'], assignedAt: ['jane'] },
    { id: 'rs2', name: 'R.S. Two', auditorLocIds: ['jane'], assignedAt: ['jane'] },
    { id: 'rs3', name: 'R.S. Three', auditorLocIds: ['jane', 'john'], assignedAt: ['jane', 'john'] },
    { id: 'rs4', name: 'R.S. Four', auditorLocIds: [], assignedAt: [] },
    { id: 'rs5', name: 'R.S. Five', auditorLocIds: ['john'], assignedAt: [] },
  ],
  'District Manager': [
    { id: 'dm1', name: 'D.M. North', auditorLocIds: ['jane'], assignedAt: ['jane'] },
    { id: 'dm2', name: 'D.M. South', auditorLocIds: ['john'], assignedAt: ['john'] },
  ],
  'Compliance Manager': [
    { id: 'cm1', name: 'C.M. West', auditorLocIds: ['jane', 'john'], assignedAt: ['jane'] },
  ],
};

export function peopleForRole(role: string | null) {
  return (role && PEOPLE_BY_ROLE[role]) || [];
}

export function peopleLabels(audience: AudienceRow) {
  if (audience.peopleMode === 'all') return ['All'];
  return peopleForRole(audience.role)
    .filter((person) => audience.peopleIds.includes(person.id))
    .map((person) => person.name);
}

/** OR-union of people across audience rows, deduped by person id. */
export function unionPeople(audiences: AudienceRow[]) {
  const byId = new Map<string, DemoPerson>();
  audiences.forEach((audience) => {
    const all = peopleForRole(audience.role);
    const picked = audience.peopleMode === 'all'
      ? all
      : all.filter((person) => audience.peopleIds.includes(person.id));
    picked.forEach((person) => byId.set(person.id, person));
  });
  return [...byId.values()];
}

/** Placement alone does not grant completion — surface people without Assigned. */
export function completionRisks(audiences: AudienceRow[]) {
  return unionPeople(audiences).flatMap((person) => person.auditorLocIds
    .filter((locId) => !person.assignedAt.includes(locId))
    .map((locId) => `${person.name} @ ${AUDITOR_LOCATIONS[locId]}`));
}

// ── Schedule preview copy ─────────────────────────────────────────────────
/** Relative dues preview against a fixed reference year — concrete dates are illustrative. */
const REF_YEAR = new Date().getFullYear();

export function defaultEndDateISO() {
  return `${new Date().getFullYear() + 1}-12-31`;
}

export function newScheduleRow(): AuditScheduleRow {
  return {
    id: `sch-${Math.random().toString(36).slice(2, 9)}`,
    frequency: 'once',
    startMonth: 0,
    startDay: 1,
    dueAmount: 30,
    dueUnit: 'days',
    endMode: 'none',
    endDate: defaultEndDateISO(),
  };
}

function fmtMonDay(month: number, day: number) {
  return `${MONTHS[month] ?? 'Jan'} ${day}`;
}

function dueConcretePhrase(row: AuditScheduleRow) {
  const date = new Date(REF_YEAR, row.startMonth, row.startDay || 1);
  const amount = Math.max(1, row.dueAmount || 30);
  if (row.dueUnit === 'weeks') date.setDate(date.getDate() + amount * 7);
  else if (row.dueUnit === 'months') date.setMonth(date.getMonth() + amount);
  else date.setDate(date.getDate() + amount);
  return `due ${fmtMonDay(date.getMonth(), date.getDate())}`;
}

function dueIntervalPhrase(row: AuditScheduleRow) {
  const amount = Math.max(1, row.dueAmount || 30);
  const singular: Record<DueUnit, string> = { days: 'day', weeks: 'week', months: 'month' };
  return `due in ${amount} ${amount === 1 ? singular[row.dueUnit] : row.dueUnit}`;
}

function ordinalDay(day: number) {
  const d = day || 1;
  const ones = d % 10;
  const tens = d % 100;
  if (tens >= 11 && tens <= 13) return `${d}th`;
  if (ones === 1) return `${d}st`;
  if (ones === 2) return `${d}nd`;
  if (ones === 3) return `${d}rd`;
  return `${d}th`;
}

function parseISODate(iso: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso ?? '');
  if (!match) return null;
  return { year: Number(match[1]), month: Number(match[2]) - 1, day: Number(match[3]) };
}

export function formatFullDate(iso: string) {
  const parsed = parseISODate(iso);
  return parsed ? `${MONTHS[parsed.month]} ${parsed.day}, ${parsed.year}` : iso || '';
}

export function hasEndDate(row: AuditScheduleRow) {
  return row.endMode === 'date' && row.frequency !== 'once' && !!row.endDate;
}

export function endListLabel(row: AuditScheduleRow) {
  return hasEndDate(row) ? `Ends ${formatFullDate(row.endDate)}` : '';
}

function endSuffix(row: AuditScheduleRow) {
  return hasEndDate(row) ? ` · through ${formatFullDate(row.endDate)}` : '';
}

/** Cycle display dates stepping by months from Start, truncated at the end date. */
function cycleList(row: AuditScheduleRow, stepMonths: number, count: number) {
  const end = hasEndDate(row) ? parseISODate(row.endDate) : null;
  const dates: string[] = [];
  for (let i = 0; i < count; i += 1) {
    const total = row.startMonth + stepMonths * i;
    const month = ((total % 12) + 12) % 12;
    const year = REF_YEAR + Math.floor(total / 12);
    const day = row.startDay || 1;
    if (end) {
      if (year > end.year) continue;
      if (year === end.year && month > end.month) continue;
      if (year === end.year && month === end.month && day > end.day) continue;
    }
    dates.push(fmtMonDay(month, day));
  }
  return dates.join(', ') || '—';
}

export function schedulePreview(row: AuditScheduleRow) {
  const day = row.startDay || 1;
  switch (row.frequency) {
    case 'monthly':
      return `Repeats monthly, displays on the ${ordinalDay(day)}, ${dueIntervalPhrase(row)}${endSuffix(row)}`;
    case 'quarterly':
      return `Displays ${cycleList(row, 3, 4)}, ${dueIntervalPhrase(row)}${endSuffix(row)}`;
    case 'semiannual':
      return `Displays ${cycleList(row, 6, 2)}, ${dueIntervalPhrase(row)}${endSuffix(row)}`;
    case 'annually':
      return `Displays ${fmtMonDay(row.startMonth, day)}, ${dueIntervalPhrase(row)}${endSuffix(row)}`;
    case 'once':
    default:
      return `Displays on ${fmtMonDay(row.startMonth, day)} → ${dueConcretePhrase(row)}`;
  }
}

export function scheduleSummary(schedules: AuditScheduleRow[]) {
  if (!schedules.length) return 'No schedule configured';
  const labels = schedules.map((row) => FREQUENCY_LABELS[row.frequency].replace(' (no recurrence)', ''));
  return `${schedules.length} schedule ${schedules.length === 1 ? 'row' : 'rows'} · ${labels.join(', ')}`;
}

export function audienceSummary(audiences: AudienceRow[]) {
  if (!audiences.length) return 'No audience configured';
  const roles = [...new Set(audiences.map((audience) => audience.role))];
  return `${audiences.length} ${audiences.length === 1 ? 'audience' : 'audiences'} · ${roles.join(', ')}`;
}

// ── Store ─────────────────────────────────────────────────────────────────
const EMPTY: AuditSetupRecord = { schedules: [], audiences: [] };

let records: Record<string, AuditSetupRecord> = {};
const listeners = new Set<() => void>();

function update(templateId: string, patch: Partial<AuditSetupRecord>) {
  const current = records[templateId] ?? EMPTY;
  records = { ...records, [templateId]: { ...current, ...patch } };
  listeners.forEach((listener) => listener());
}

export const auditSetup = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getSnapshot() {
    return records;
  },
  get(templateId: string) {
    return records[templateId] ?? EMPTY;
  },
  upsertSchedule(templateId: string, row: AuditScheduleRow) {
    const rows = (records[templateId] ?? EMPTY).schedules;
    const exists = rows.some((saved) => saved.id === row.id);
    update(templateId, {
      schedules: exists ? rows.map((saved) => (saved.id === row.id ? row : saved)) : [...rows, row],
    });
  },
  removeSchedule(templateId: string, rowId: string) {
    update(templateId, { schedules: (records[templateId] ?? EMPTY).schedules.filter((row) => row.id !== rowId) });
  },
  upsertAudience(templateId: string, row: AudienceRow) {
    const rows = (records[templateId] ?? EMPTY).audiences;
    const exists = rows.some((saved) => saved.id === row.id);
    update(templateId, {
      audiences: exists ? rows.map((saved) => (saved.id === row.id ? row : saved)) : [...rows, row],
    });
  },
  removeAudience(templateId: string, rowId: string) {
    update(templateId, { audiences: (records[templateId] ?? EMPTY).audiences.filter((row) => row.id !== rowId) });
  },
};

export function useAuditSetup(templateId: string): AuditSetupRecord {
  const snapshot = useSyncExternalStore(auditSetup.subscribe, auditSetup.getSnapshot);
  return snapshot[templateId] ?? EMPTY;
}
