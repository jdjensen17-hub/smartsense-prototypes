// Template draft status-set choice. Phase 2 owns this. Phase 3 reads it.
// A reload resets the seed. Live instances are counts only.

import { useSyncExternalStore } from 'react';
import { statusSets, type Status, type StatusSet, type TemplateKind, type TemplateRef } from '@/data/statusSets';

export type NotificationRule = {
  id: string;
  event: string;
  roles: string[];
  methods: string[];
  offsetMin?: number;
  frequency?: 'Daily' | 'Weekly';
  attachPdf?: boolean;
  /** Statuses that fire the rule on transition into them. Empty only after a set switch. */
  statusIds?: string[];
};

export type PendingStatusSetChange = {
  fromSetId: string | null;
  toSetId: string | null;
  mapping: Record<string, string>;
};

export type TemplateStatusRecord = {
  id: string;
  name: string;
  type: TemplateKind;
  locations: number;
  publishedSetId: string | null;
  statusSetId: string | null;
  pending?: PendingStatusSetChange;
  inFlight: number;
  notificationRules: NotificationRule[];
  publishedRules: NotificationRule[];
  dirty: boolean;
};

export type SetChangeRequest = {
  needsConfirm: boolean;
  defaultMapping: Record<string, string>;
  clearedTriggerCount: number;
};

const OPENING = 'opening-checklist';
export const LIST_SAMPLE_ID = 'monthly-self-assessment';
export const AUDIT_SAMPLE_ID = 'supervisor-facility-audit';

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function seed(): TemplateStatusRecord[] {
  const auditRules: NotificationRule[] = [{
    id: 'audit-status-1',
    event: 'status_changed',
    roles: ['Compliance Manager'],
    methods: ['Email'],
    statusIds: ['ccr-needs'],
    attachPdf: true,
  }];
  const listRules: NotificationRule[] = [{
    id: 'list-before-due-1',
    event: 'before-due',
    roles: ['Pharmacy Manager'],
    methods: ['Push'],
    offsetMin: 1440,
  }];
  return [
    {
      id: OPENING,
      name: 'Opening Checklist',
      type: 'list',
      locations: 11,
      publishedSetId: null,
      statusSetId: null,
      inFlight: 0,
      notificationRules: [],
      publishedRules: [],
      dirty: false,
    },
    {
      id: LIST_SAMPLE_ID,
      name: 'Monthly Self-Assessment: Facility',
      type: 'list',
      locations: 600,
      publishedSetId: 'pharmacy-self-assessment',
      statusSetId: 'pharmacy-self-assessment',
      inFlight: 212,
      notificationRules: clone(listRules),
      publishedRules: clone(listRules),
      dirty: false,
    },
    {
      id: AUDIT_SAMPLE_ID,
      name: 'Supervisor Facility Audit',
      type: 'audit',
      locations: 26,
      publishedSetId: 'costco-compliance-review',
      statusSetId: 'costco-compliance-review',
      inFlight: 18,
      notificationRules: clone(auditRules),
      publishedRules: clone(auditRules),
      dirty: false,
    },
  ];
}

let templates: TemplateStatusRecord[] = seed();
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

function replace(next: TemplateStatusRecord[]) {
  templates = next;
  emit();
}

function find(templateId: string) {
  return templates.find((template) => template.id === templateId) ?? null;
}

function nouns(type: TemplateKind) {
  return type === 'audit'
    ? { one: 'audit', many: 'audits' }
    : { one: 'list', many: 'lists' };
}

export function inFlightLabel(template: TemplateStatusRecord) {
  const noun = nouns(template.type);
  const word = template.inFlight === 1 ? noun.one : noun.many;
  return `${template.inFlight} in-flight ${word}`;
}

function sameRules(a: NotificationRule[], b: NotificationRule[]) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function statusChangedRules(template: TemplateStatusRecord) {
  return template.notificationRules.filter((rule) => rule.event === 'status_changed');
}

function withDirty(template: TemplateStatusRecord, patch: Partial<TemplateStatusRecord>): TemplateStatusRecord {
  const next = { ...template, ...patch };
  next.dirty = next.statusSetId !== next.publishedSetId
    || Boolean(next.pending)
    || !sameRules(next.notificationRules, next.publishedRules);
  return next;
}

function mappingFor(fromSetId: string | null, toSetId: string | null) {
  if (!fromSetId || !toSetId) return {};
  const from = statusSets.get(fromSetId);
  const to = statusSets.get(toSetId);
  if (!from || !to) return {};
  const fallback = to.statuses.find((status) => status.isDefault) ?? to.statuses[0];
  const mapping: Record<string, string> = {};
  from.statuses.forEach((status) => {
    const match = to.statuses.find((candidate) => candidate.category === status.category);
    mapping[status.id] = (match ?? fallback).id;
  });
  return mapping;
}

function refFor(template: TemplateStatusRecord): TemplateRef {
  return { id: template.id, name: template.name, type: template.type };
}

export const templateStatus = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getSnapshot() {
    return templates;
  },
  has(templateId: string | null) {
    return Boolean(templateId && find(templateId));
  },
  get(templateId: string) {
    const template = find(templateId);
    return template ? clone(template) : null;
  },
  nouns,
  getSelectedSet(templateId: string): StatusSet | null {
    const template = find(templateId);
    if (!template?.statusSetId) return null;
    return statusSets.get(template.statusSetId);
  },
  getPendingChange(templateId: string) {
    return find(templateId)?.pending ? clone(find(templateId)!.pending) : undefined;
  },
  requestSetChange(templateId: string, toSetId: string | null): SetChangeRequest {
    const template = find(templateId);
    if (!template) return { needsConfirm: false, defaultMapping: {}, clearedTriggerCount: 0 };
    const defaultMapping = mappingFor(template.publishedSetId, toSetId);
    const clearedTriggerCount = statusChangedRules(template).length;
    const needsConfirm = template.inFlight > 0
      && template.publishedSetId !== null
      && toSetId !== template.publishedSetId;
    return { needsConfirm, defaultMapping, clearedTriggerCount };
  },
  confirmSetChange(templateId: string, toSetId: string | null, mapping: Record<string, string>) {
    const template = find(templateId);
    if (!template || toSetId === template.statusSetId) return;
    replace(templates.map((item) => {
      if (item.id !== templateId) return item;
      if (toSetId === item.publishedSetId) {
        return withDirty(item, { statusSetId: item.publishedSetId, pending: undefined });
      }
      const rules = toSetId === null
        ? item.notificationRules.filter((rule) => rule.event !== 'status_changed')
        : item.notificationRules.map((rule) => (
          rule.event === 'status_changed' ? { ...rule, statusIds: [] } : rule
        ));
      return withDirty(item, {
        statusSetId: toSetId,
        notificationRules: rules,
        pending: { fromSetId: item.publishedSetId, toSetId, mapping: { ...mapping } },
      });
    }));
  },
  discard(templateId: string) {
    replace(templates.map((item) => {
      if (item.id !== templateId) return item;
      return {
        ...item,
        statusSetId: item.publishedSetId,
        pending: undefined,
        notificationRules: clone(item.publishedRules),
        dirty: false,
      };
    }));
  },
  onPublish(templateId: string) {
    const template = find(templateId);
    if (!template?.dirty) return null;
    const fromId = template.publishedSetId;
    const toId = template.statusSetId;
    const ref = refFor(template);
    if (fromId && fromId !== toId) statusSets.setUsage(fromId, ref, false);
    if (toId && toId !== fromId) statusSets.setUsage(toId, ref, true);
    const noun = nouns(template.type);
    const many = template.inFlight === 1 ? noun.one : noun.many;
    let toast: string | null = null;
    if (template.pending && template.inFlight > 0) {
      if (fromId && toId) toast = `Published. ${template.inFlight} in-flight ${many} mapped to the new set.`;
      else if (fromId && !toId) toast = `Published. Statuses cleared from ${template.inFlight} in-flight ${many}.`;
      else if (!fromId && toId) {
        const starting = statusSets.getDefaultStatus(toId).name;
        toast = `Published. ${template.inFlight} in-flight ${many} now start in ${starting}.`;
      }
    }
    replace(templates.map((item) => {
      if (item.id !== templateId) return item;
      return {
        ...item,
        publishedSetId: item.statusSetId,
        pending: undefined,
        publishedRules: clone(item.notificationRules),
        dirty: false,
      };
    }));
    return toast;
  },
  listRules(templateId: string, event?: string) {
    const rules = find(templateId)?.notificationRules ?? [];
    const matched = event ? rules.filter((rule) => rule.event === event) : rules;
    return clone(matched);
  },
  upsertRule(templateId: string, rule: NotificationRule) {
    const template = find(templateId);
    if (!template) return;
    let next = { ...rule, roles: [...rule.roles], methods: [...rule.methods] };
    if (next.event === 'status_changed') {
      const set = template.statusSetId ? statusSets.get(template.statusSetId) : null;
      if (!set || !next.roles.length || !next.methods.length) return;
      const ordered = set.statuses.map((status) => status.id).filter((id) => next.statusIds?.includes(id));
      if (!ordered.length) return;
      next = { ...next, statusIds: ordered, attachPdf: next.methods.includes('Email') ? !!next.attachPdf : false };
    }
    replace(templates.map((item) => {
      if (item.id !== templateId) return item;
      const exists = item.notificationRules.some((saved) => saved.id === next.id);
      const notificationRules = exists
        ? item.notificationRules.map((saved) => (saved.id === next.id ? next : saved))
        : [...item.notificationRules, next];
      return withDirty(item, { notificationRules });
    }));
  },
  deleteRule(templateId: string, ruleId: string) {
    replace(templates.map((item) => {
      if (item.id !== templateId) return item;
      return withDirty(item, { notificationRules: item.notificationRules.filter((rule) => rule.id !== ruleId) });
    }));
  },
  isEventEnabled(templateId: string) {
    return Boolean(this.getSelectedSet(templateId));
  },
};

function pruneDeletedStatuses() {
  let changed = false;
  const next = templates.map((template) => {
    const set = template.statusSetId ? statusSets.get(template.statusSetId) : null;
    const live = new Set(set?.statuses.map((status) => status.id) ?? []);
    let touched = false;
    const notificationRules = template.notificationRules.map((rule) => {
      if (rule.event !== 'status_changed' || !rule.statusIds?.length) return rule;
      const statusIds = rule.statusIds.filter((id) => live.has(id));
      if (statusIds.length === rule.statusIds.length) return rule;
      touched = true;
      return { ...rule, statusIds };
    });
    if (!touched) return template;
    changed = true;
    return withDirty(template, { notificationRules });
  });
  if (changed) replace(next);
}

statusSets.subscribe(pruneDeletedStatuses);

export function notificationSummary(rules: NotificationRule[]) {
  if (rules.length === 0) return 'No events configured';
  const events = new Set(rules.map((rule) => rule.event)).size;
  const count = rules.length;
  return `${events} ${events === 1 ? 'event' : 'events'} configured · ${count} ${count === 1 ? 'notification' : 'notifications'}`;
}

export function pdfAttachmentInfo(type: TemplateKind) {
  return type === 'audit'
    ? { hint: "Attaches this template's Leave Behind Report", fileName: 'Leave Behind Report.pdf' }
    : { hint: 'Attaches the list completion PDF', fileName: 'List completion.pdf' };
}

const EMAIL_SAMPLE = {
  locationName: 'Costco #482 Issaquah',
  changedBy: 'Maria Lopez',
  changedAt: 'Oct 14, 2026 2:31 PM MT',
  peopleNote: '(3 people at this location)',
  size: '412 KB',
};

export type StatusChangedEmailPreview = {
  subject: string;
  templateName: string;
  locationName: string;
  fromStatus: Status | null;
  toStatus: Status | null;
  changedBy: string;
  changedAt: string;
  viewLabel: string;
  roles: string[];
  peopleNote: string;
  attachment?: { fileName: string; size: string };
  footer: string;
};

export function buildStatusChangedEmailPreview(templateId: string): StatusChangedEmailPreview {
  const template = find(templateId);
  const set = template?.statusSetId ? statusSets.get(template.statusSetId) : null;
  const statuses = set?.statuses ?? [];
  const rule = template ? statusChangedRules(template).find((item) => item.statusIds?.length) : undefined;
  const fallbackTo = statuses.find((status) => !status.isDefault) ?? statuses[0] ?? null;
  const to = (rule?.statusIds && statuses.find((status) => status.id === rule.statusIds?.[0])) || fallbackTo;
  const fallbackFrom = statuses.find((status) => status.isDefault) ?? statuses[0] ?? null;
  const from = to && fallbackFrom && to.id === fallbackFrom.id
    ? (statuses.find((status) => status.id !== to.id) ?? fallbackFrom)
    : fallbackFrom;
  const type = template?.type ?? 'list';
  const pdf = pdfAttachmentInfo(type);
  const attach = rule ? Boolean(rule.attachPdf && rule.methods.includes('Email')) : true;
  return {
    subject: `Status changed: ${template?.name ?? 'Template'}, ${EMAIL_SAMPLE.locationName}`,
    templateName: template?.name ?? '',
    locationName: EMAIL_SAMPLE.locationName,
    fromStatus: from,
    toStatus: to,
    changedBy: EMAIL_SAMPLE.changedBy,
    changedAt: EMAIL_SAMPLE.changedAt,
    viewLabel: type === 'audit' ? 'View audit' : 'View list',
    roles: rule?.roles.length ? rule.roles : ['Compliance Manager'],
    peopleNote: EMAIL_SAMPLE.peopleNote,
    attachment: attach ? { fileName: pdf.fileName, size: EMAIL_SAMPLE.size } : undefined,
    footer: type === 'audit'
      ? "You're getting this because your role is set to be notified when this audit's status changes."
      : "You're getting this because your role is set to be notified when this list's status changes.",
  };
}

export function useTemplateStatus(templateId: string) {
  const snapshot = useSyncExternalStore(templateStatus.subscribe, templateStatus.getSnapshot);
  return snapshot.find((template) => template.id === templateId) ?? snapshot[0];
}

export function pickerSets(selectedId: string | null): StatusSet[] {
  return statusSets.list({ includeArchived: true }).filter((set) => !set.archived || set.id === selectedId);
}

export function defaultStatusOf(set: StatusSet): Status {
  return set.statuses.find((status) => status.isDefault) ?? set.statuses[0];
}
