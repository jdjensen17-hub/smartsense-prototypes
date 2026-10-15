// Org-level status sets. Phase 1 owns this store. Phases 2 and 3 import it.
// Prototype state only — a reload resets the seed.

import { useSyncExternalStore } from 'react';

export type StatusCategory = 'open' | 'in_review' | 'approved' | 'rejected';
export type StatusColor = 'gray' | 'blue' | 'teal' | 'green' | 'amber' | 'orange' | 'red' | 'purple';
export type TemplateKind = 'audit' | 'list';

export type TemplateRef = { id: string; name: string; type: TemplateKind };

export type Status = {
  id: string;
  name: string;
  color: StatusColor;
  category: StatusCategory;
  isDefault: boolean;
  canSubmitFrom: boolean;
  openInstances: number;
};

export type StatusSet = {
  id: string;
  name: string;
  description: string;
  archived: boolean;
  statuses: Status[];
  usedBy: TemplateRef[];
  lastEdited: string;
  lastEditedBy: string;
};

export type StatusMigration = { fromStatusId: string; toStatusId: string; count: number };

export type SetInUseError = { code: 'SET_IN_USE'; templates: TemplateRef[] };

export const STATUS_CATEGORIES: { id: StatusCategory; label: string }[] = [
  { id: 'open', label: 'Open' },
  { id: 'in_review', label: 'In review' },
  { id: 'approved', label: 'Approved' },
  { id: 'rejected', label: 'Rejected' },
];

export const STATUS_COLORS: Record<StatusColor, { label: string; dot: string; bg: string; fg: string }> = {
  gray:   { label: 'Gray',   dot: '#8a9099', bg: '#eff1f4', fg: '#4a5058' },
  blue:   { label: 'Blue',   dot: '#0366d6', bg: '#e6f0fc', fg: '#0356b6' },
  teal:   { label: 'Teal',   dot: '#139e9e', bg: '#e0f4f4', fg: '#0d7373' },
  green:  { label: 'Green',  dot: '#2e9e5b', bg: '#e3f5ea', fg: '#1f7a45' },
  amber:  { label: 'Amber',  dot: '#e8a317', bg: '#fdf3dc', fg: '#8a5a00' },
  orange: { label: 'Orange', dot: '#e8702a', bg: '#fdebdf', fg: '#a4481a' },
  red:    { label: 'Red',    dot: '#d64545', bg: '#fbe7e7', fg: '#a82e2e' },
  purple: { label: 'Purple', dot: '#7c5cd6', bg: '#efeafb', fg: '#5b3fb0' },
};

export const STATUS_COLOR_KEYS = Object.keys(STATUS_COLORS) as StatusColor[];

/** Logged-in prototype user. Seed rows keep their own editors. */
const ACTOR = 'Ben Caldwell';

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

function todayIso() {
  const n = new Date();
  const m = String(n.getMonth() + 1).padStart(2, '0');
  const d = String(n.getDate()).padStart(2, '0');
  return `${n.getFullYear()}-${m}-${d}`;
}

export function formatStatusDate(iso: string) {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function plural(n: number, word: string) {
  return `${n} ${n === 1 ? word : `${word}s`}`;
}

function blankStatuses(): Status[] {
  return [
    { id: uid('st'), name: 'Open', color: 'blue', category: 'open', isDefault: true, canSubmitFrom: false, openInstances: 0 },
    { id: uid('st'), name: 'Done', color: 'green', category: 'approved', isDefault: false, canSubmitFrom: false, openInstances: 0 },
  ];
}

const SEED: StatusSet[] = [
  {
    id: 'costco-compliance-review',
    name: 'Costco Compliance Review',
    description: 'Two-step review for facility audits. Compliance signs off before submit.',
    archived: false,
    lastEdited: '2026-10-09',
    lastEditedBy: 'Jim Jensen',
    usedBy: [
      { id: 'supervisor-facility-audit', name: 'Supervisor Facility Audit', type: 'audit' },
      { id: 'pharmacy-compliance-audit', name: 'Pharmacy Compliance Audit', type: 'audit' },
      { id: 'warehouse-safety-walk', name: 'Warehouse Safety Walk', type: 'audit' },
    ],
    statuses: [
      { id: 'ccr-progress', name: 'In Progress', color: 'gray', category: 'open', isDefault: true, canSubmitFrom: false, openInstances: 9 },
      { id: 'ccr-needs', name: 'Needs Compliance Approval', color: 'amber', category: 'in_review', isDefault: false, canSubmitFrom: false, openInstances: 5 },
      { id: 'ccr-approved', name: 'Compliance Approved', color: 'green', category: 'approved', isDefault: false, canSubmitFrom: true, openInstances: 2 },
      { id: 'ccr-rejected', name: 'Rejected', color: 'red', category: 'rejected', isDefault: false, canSubmitFrom: false, openInstances: 12 },
    ],
  },
  {
    id: 'pharmacy-self-assessment',
    name: 'Pharmacy Self-Assessment',
    description: 'Monthly self-assessments reviewed by the supervisor, then compliance.',
    archived: false,
    lastEdited: '2026-09-28',
    lastEditedBy: 'Dana Whitfield',
    usedBy: [
      { id: 'monthly-self-assessment', name: 'Monthly Self-Assessment: Facility', type: 'list' },
      { id: 'monthly-self-assessment-pharmacy', name: 'Monthly Self-Assessment: Pharmacy', type: 'list' },
      { id: 'monthly-self-assessment-optical', name: 'Monthly Self-Assessment: Optical', type: 'list' },
      { id: 'quarterly-controlled-substance-review', name: 'Quarterly Controlled Substance Review', type: 'list' },
      { id: 'hearing-aid-center-self-assessment', name: 'Hearing Aid Center Self-Assessment', type: 'list' },
      { id: 'annual-pharmacy-inspection', name: 'Annual Pharmacy Inspection', type: 'audit' },
    ],
    statuses: [
      { id: 'psa-progress', name: 'In Progress', color: 'gray', category: 'open', isDefault: true, canSubmitFrom: false, openInstances: 140 },
      { id: 'psa-supervisor', name: 'Supervisor Approval', color: 'amber', category: 'in_review', isDefault: false, canSubmitFrom: false, openInstances: 38 },
      { id: 'psa-compliance', name: 'Compliance Approval', color: 'purple', category: 'in_review', isDefault: false, canSubmitFrom: false, openInstances: 21 },
      { id: 'psa-approved', name: 'Plan Approved', color: 'green', category: 'approved', isDefault: false, canSubmitFrom: true, openInstances: 13 },
    ],
  },
  {
    id: 'simple-review',
    name: 'Simple Review',
    description: '',
    archived: false,
    lastEdited: '2026-08-02',
    lastEditedBy: 'Jim Jensen',
    usedBy: [],
    statuses: [
      { id: 'sr-open', name: 'Open', color: 'blue', category: 'open', isDefault: true, canSubmitFrom: false, openInstances: 0 },
      { id: 'sr-reviewed', name: 'Reviewed', color: 'green', category: 'approved', isDefault: false, canSubmitFrom: false, openInstances: 0 },
    ],
  },
];

let sets: StatusSet[] = clone(SEED);
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

function replace(next: StatusSet[]) {
  sets = next;
  emit();
}

function nameTaken(name: string, exceptId?: string) {
  const key = name.trim().toLowerCase();
  return sets.some((set) => set.id !== exceptId && set.name.trim().toLowerCase() === key);
}

function assertValid(next: StatusSet, exceptId: string) {
  if (!next.name.trim()) throw new Error('Set name is required');
  if (nameTaken(next.name, exceptId)) throw new Error('Set name must be unique');
  if (next.statuses.length < 1) throw new Error('A set needs at least one status');
  if (next.statuses.filter((status) => status.isDefault).length !== 1) throw new Error('A set needs exactly one default status');
  const names = next.statuses.map((status) => status.name.trim().toLowerCase());
  if (names.some((name) => !name)) throw new Error('Status name is required');
  if (new Set(names).size !== names.length) throw new Error('Status names must be unique');
}

export function isSetInUseError(error: unknown): error is SetInUseError {
  return typeof error === 'object' && error !== null && (error as SetInUseError).code === 'SET_IN_USE';
}

export const statusSets = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getSnapshot() {
    return sets;
  },
  list({ includeArchived = false } = {}) {
    return sets
      .filter((set) => includeArchived || !set.archived)
      .map(clone)
      .sort((a, b) => a.name.localeCompare(b.name));
  },
  get(setId: string) {
    const set = sets.find((item) => item.id === setId);
    return set ? clone(set) : null;
  },
  getDefaultStatus(setId: string) {
    const set = sets.find((item) => item.id === setId);
    if (!set) throw new Error('Status set not found');
    return clone(set.statuses.find((status) => status.isDefault) ?? set.statuses[0]);
  },
  getStatus(setId: string, statusId: string) {
    const set = sets.find((item) => item.id === setId);
    const status = set?.statuses.find((item) => item.id === statusId);
    return status ? clone(status) : null;
  },
  create({ name, description = '', copyFromSetId }: { name: string; description?: string; copyFromSetId?: string | null }) {
    const source = copyFromSetId ? sets.find((set) => set.id === copyFromSetId && !set.archived) : undefined;
    const statuses = source
      ? source.statuses.map((status) => ({ ...status, id: uid('st'), openInstances: 0 }))
      : blankStatuses();
    const set: StatusSet = {
      id: uid('set'),
      name: name.trim(),
      description,
      archived: false,
      statuses,
      usedBy: [],
      lastEdited: todayIso(),
      lastEditedBy: ACTOR,
    };
    replace([...sets, set]);
    return clone(set);
  },
  duplicate(setId: string) {
    const source = sets.find((set) => set.id === setId);
    if (!source) throw new Error('Status set not found');
    const set: StatusSet = {
      ...clone(source),
      id: uid('set'),
      name: `Copy of ${source.name}`,
      archived: false,
      usedBy: [],
      lastEdited: todayIso(),
      lastEditedBy: ACTOR,
      statuses: source.statuses.map((status) => ({ ...status, id: uid('st'), openInstances: 0 })),
    };
    replace([...sets, set]);
    return clone(set);
  },
  update(setId: string, nextSet: StatusSet, { migrations = [] as StatusMigration[] } = {}) {
    const current = sets.find((set) => set.id === setId);
    if (!current) throw new Error('Status set not found');
    const next: StatusSet = {
      ...clone(nextSet),
      id: setId,
      name: nextSet.name.trim(),
      statuses: nextSet.statuses.map((status) => ({ ...status, name: status.name.trim() })),
      usedBy: current.usedBy.map((template) => ({ ...template })),
      archived: current.archived,
      lastEdited: todayIso(),
      lastEditedBy: ACTOR,
    };
    assertValid(next, setId);
    // No instance records in this prototype. The editor already moved openInstances.
    void migrations;
    replace(sets.map((set) => (set.id === setId ? next : set)));
    return clone(next);
  },
  archive(setId: string) {
    replace(sets.map((set) => (set.id === setId ? { ...set, archived: true } : set)));
  },
  restore(setId: string) {
    replace(sets.map((set) => (set.id === setId ? { ...set, archived: false } : set)));
  },
  remove(setId: string) {
    const set = sets.find((item) => item.id === setId);
    if (!set) return;
    if (set.usedBy.length > 0) {
      const error: SetInUseError = { code: 'SET_IN_USE', templates: set.usedBy.map((template) => ({ ...template })) };
      throw error;
    }
    replace(sets.filter((item) => item.id !== setId));
  },
  getUsage(setId: string) {
    return sets.find((set) => set.id === setId)?.usedBy.map((template) => ({ ...template })) ?? [];
  },
  setUsage(setId: string, templateRef: TemplateRef, inUse: boolean) {
    const set = sets.find((item) => item.id === setId);
    if (!set) return;
    const has = set.usedBy.some((template) => template.id === templateRef.id);
    if (inUse === has) return;
    const usedBy = inUse
      ? [...set.usedBy, { ...templateRef }]
      : set.usedBy.filter((template) => template.id !== templateRef.id);
    replace(sets.map((item) => (item.id === setId ? { ...item, usedBy } : item)));
  },
};

export function useStatusSets() {
  return useSyncExternalStore(statusSets.subscribe, statusSets.getSnapshot);
}
