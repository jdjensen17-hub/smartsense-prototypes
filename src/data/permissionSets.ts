// ── permissionSets.ts ─────────────────────────────────────────────────────────
// Named permission sets per module. Each set defines a resource/verb matrix.
// Roles reference these sets by key — see roles.ts.

export type PermissionVerb =
  // Core data
  | 'view' | 'create' | 'update' | 'delete' | 'restore'
  // Workflow / lifecycle
  | 'submit' | 'approve' | 'reject' | 'publish' | 'archive' | 'reopen' | 'resolve'
  // Ownership
  | 'assign' | 'transfer'
  // Data movement
  | 'export' | 'import' | 'print' | 'share' | 'send'
  // System administration
  | 'configure' | 'manage' | 'execute' | 'enable' | 'disable'
  // User lifecycle (Admin-specific)
  | 'invite' | 'deactivate' | 'acknowledge' | 'schedule';

export type ResourcePermission = {
  resource: string;
  verbs: PermissionVerb[];
};

export type PermissionSet = {
  key: string;
  name: string;
  module: string;
  description: string;
  resources: ResourcePermission[];
};

export const PERMISSION_SETS: PermissionSet[] = [

  // ── OPERATE ────────────────────────────────────────────────────────────────

  {
    key: 'operate.list_execution',
    name: 'List Execution',
    module: 'Operate',
    description: 'The frontline worker\'s surface — doing the work, not configuring it.',
    resources: [
      { resource: 'List instance',         verbs: ['view', 'create', 'update', 'submit'] },
      { resource: 'List instance history', verbs: ['view', 'export'] },
      { resource: 'Corrective action',     verbs: ['view', 'create', 'update', 'resolve'] },
      { resource: 'Logbook entry',         verbs: ['view', 'create', 'update'] },
      { resource: 'Logbook entry history', verbs: ['view', 'export'] },
    ],
  },
  {
    key: 'operate.list_management',
    name: 'List Management',
    module: 'Operate',
    description: 'Creating and maintaining the templates and schedules that define the work.',
    resources: [
      { resource: 'List template',         verbs: ['view', 'create', 'update', 'archive', 'delete'] },
      { resource: 'List instance',         verbs: ['view', 'create', 'update', 'submit', 'archive', 'delete'] },
      { resource: 'List instance history', verbs: ['view', 'export'] },
      { resource: 'Template schedule',     verbs: ['view', 'create', 'update', 'delete'] },
      { resource: 'Corrective action',     verbs: ['view', 'create', 'update', 'resolve', 'delete'] },
      { resource: 'Logbook entry',         verbs: ['view', 'create', 'update', 'delete'] },
      { resource: 'Logbook entry history', verbs: ['view', 'export'] },
    ],
  },
  {
    key: 'operate.information_library',
    name: 'Information Library',
    module: 'Operate',
    description: 'Owning the content library — SOPs and reference documents.',
    resources: [
      { resource: 'Info Library file', verbs: ['view', 'create', 'update', 'publish', 'archive', 'delete'] },
    ],
  },
  {
    key: 'operate.list_reporting',
    name: 'List Reporting',
    module: 'Operate',
    description: 'Analytical visibility across list activity.',
    resources: [
      { resource: 'Operate reports', verbs: ['view', 'schedule', 'export', 'print'] },
    ],
  },

  // ── ASSURE ─────────────────────────────────────────────────────────────────

  {
    key: 'assure.audit_execution',
    name: 'Audit Execution',
    module: 'Assure',
    description: 'Conducting audits in the field.',
    resources: [
      { resource: 'Audit instance',         verbs: ['view', 'create', 'update', 'submit'] },
      { resource: 'Audit instance history', verbs: ['view', 'export'] },
      { resource: 'Follow-up action',       verbs: ['view', 'create', 'update'] },
      { resource: 'Leave Behind Report',    verbs: ['view', 'create', 'print', 'send'] },
    ],
  },
  {
    key: 'assure.audit_management',
    name: 'Audit Management',
    module: 'Assure',
    description: 'Creating and maintaining audit templates and schedules.',
    resources: [
      { resource: 'Audit template',         verbs: ['view', 'create', 'update', 'archive', 'delete'] },
      { resource: 'Audit instance',         verbs: ['view', 'create', 'update', 'submit', 'archive', 'delete'] },
      { resource: 'Audit instance history', verbs: ['view', 'export'] },
    ],
  },
  {
    key: 'assure.inspection_site_management',
    name: 'Inspection Site Management',
    module: 'Assure',
    description: 'Configuring the locations and assets that get audited.',
    resources: [
      { resource: 'Inspection site',          verbs: ['view', 'create', 'update', 'archive', 'delete'] },
      { resource: 'Inspection site template', verbs: ['view', 'create', 'update', 'archive', 'delete'] },
    ],
  },
  {
    key: 'assure.audit_reporting',
    name: 'Audit Reporting',
    module: 'Assure',
    description: 'Analytical visibility across audit activity.',
    resources: [
      { resource: 'Assure reports', verbs: ['view', 'schedule', 'export', 'print'] },
    ],
  },

  // ── GUARD ──────────────────────────────────────────────────────────────────
  {
    key: 'guard.food_safety_execution',
    name: 'Food Safety Execution',
    module: 'Guard',
    description: 'Conducting food safety processes and line checks in the field.',
    resources: [
      { resource: 'Food safety process instance',         verbs: ['view', 'create', 'update', 'submit'] },
      { resource: 'Food safety process instance history', verbs: ['view', 'export'] },
      { resource: 'Food safety step reading',             verbs: ['view', 'create'] },
      { resource: 'Measurement item',                     verbs: ['view', 'execute'] },
      { resource: 'Corrective action',                    verbs: ['view', 'create', 'update', 'resolve'] },
    ],
  },
  // Note: 'override' verb on Food safety step reading and Measurement item is
  // granted only at Supervisor tier and above. It is assigned as a separate
  // permission set so it can be scoped independently of general execution access.
  {
    key: 'guard.probe_override',
    name: 'Probe Override',
    module: 'Guard',
    description: 'Authorizing manual temperature entry when a Bluetooth probe cannot connect.',
    resources: [
      { resource: 'Food safety step reading', verbs: ['override'] },
      { resource: 'Measurement item',         verbs: ['override'] },
    ],
  },
  {
    key: 'guard.food_safety_management',
    name: 'Food Safety Management',
    module: 'Guard',
    description: 'Creating and maintaining processes, products, devices, and schedules.',
    resources: [
      { resource: 'Food safety process template',         verbs: ['view', 'create', 'update', 'archive', 'delete'] },
      { resource: 'Food safety process instance',         verbs: ['view', 'create', 'update', 'submit', 'archive', 'delete'] },
      { resource: 'Food safety process instance history', verbs: ['view', 'export'] },
      { resource: 'Template schedule',                    verbs: ['view', 'create', 'update', 'delete'] },
      { resource: 'Food safety step reading',             verbs: ['view', 'create', 'update', 'delete'] },
      { resource: 'Measurement item template',            verbs: ['view', 'create', 'update', 'archive', 'delete'] },
      { resource: 'Measurement item',                     verbs: ['view', 'create', 'update', 'delete'] },
      { resource: 'Corrective action',                    verbs: ['view', 'create', 'update', 'resolve', 'delete'] },
      { resource: 'Product',                              verbs: ['view', 'create', 'update', 'archive', 'delete'] },
      { resource: 'Visual alert device',                  verbs: ['view', 'create', 'update', 'delete'] },
    ],
  },
  {
    key: 'guard.guard_device_management',
    name: 'Guard Device Management',
    module: 'Guard',
    description: 'Configuring Bluetooth probe behavior and visual alert devices.',
    resources: [
      { resource: 'Probe configuration',   verbs: ['view', 'configure'] },
      { resource: 'Visual alert device',   verbs: ['configure'] },
    ],
  },
  {
    key: 'guard.guard_reporting',
    name: 'Guard Reporting',
    module: 'Guard',
    description: 'Analytical visibility and compliance records.',
    resources: [
      { resource: 'Temperature log',  verbs: ['view', 'export', 'print'] },
      { resource: 'Guard reports',    verbs: ['view', 'schedule', 'export', 'print'] },
    ],
  },

  // ── LABEL ──────────────────────────────────────────────────────────────────

  {
    key: 'label.label_printing',
    name: 'Label Printing',
    module: 'Label',
    description: 'Producing labels for operational use.',
    resources: [
      { resource: 'Label',       verbs: ['view', 'print'] },
      { resource: 'Label batch', verbs: ['view', 'create', 'print'] },
    ],
  },
  {
    key: 'label.label_management',
    name: 'Label Management',
    module: 'Label',
    description: 'Designing, organizing, and maintaining labels and templates.',
    resources: [
      { resource: 'Label template', verbs: ['view', 'create', 'update', 'archive', 'delete'] },
      { resource: 'Label category', verbs: ['view', 'create', 'update', 'archive', 'delete'] },
      { resource: 'Label',          verbs: ['view', 'update', 'archive', 'delete'] },
      { resource: 'Label batch',    verbs: ['view', 'create', 'update', 'archive', 'delete'] },
    ],
  },
  {
    key: 'label.label_device_management',
    name: 'Label Device Management',
    module: 'Label',
    description: 'Managing printers, scales, and data integrations.',
    resources: [
      { resource: 'Printer configuration',  verbs: ['view', 'create', 'update', 'delete'] },
      { resource: 'Scale integration',      verbs: ['view', 'create', 'update', 'configure', 'delete'] },
      { resource: 'Label data integration', verbs: ['view', 'configure', 'delete'] },
    ],
  },
  {
    key: 'label.label_reporting',
    name: 'Label Reporting',
    module: 'Label',
    description: 'Analytical visibility across label activity.',
    resources: [
      { resource: 'Label reports', verbs: ['view', 'schedule', 'export', 'print'] },
    ],
  },

  // ── SERVICE ────────────────────────────────────────────────────────────────

  {
    key: 'service.work_order_participation',
    name: 'Work Order Participation',
    module: 'Service',
    description: 'Viewing and contributing to work orders without submission rights.',
    resources: [
      { resource: 'Work order',         verbs: ['view', 'create', 'update'] },
      { resource: 'Work order history', verbs: ['view'] },
      { resource: 'Work order comment', verbs: ['view', 'create', 'update'] },
    ],
  },
  {
    key: 'service.work_order_execution',
    name: 'Work Order Execution',
    module: 'Service',
    description: 'Performing and submitting assigned work.',
    resources: [
      { resource: 'Work order',         verbs: ['view', 'create', 'update', 'submit'] },
      { resource: 'Work order history', verbs: ['view', 'export'] },
      { resource: 'Work order comment', verbs: ['view', 'create', 'update'] },
    ],
  },
  {
    key: 'service.work_order_management',
    name: 'Work Order Management',
    module: 'Service',
    description: 'Assigning, overseeing, and closing work orders.',
    resources: [
      { resource: 'Work order template', verbs: ['view', 'create', 'update', 'archive', 'delete'] },
      { resource: 'Work order',          verbs: ['view', 'create', 'update', 'submit', 'assign', 'archive', 'delete'] },
      { resource: 'Work order history',  verbs: ['view', 'export'] },
      { resource: 'Work order comment',  verbs: ['view', 'create', 'update', 'delete'] },
    ],
  },
  {
    key: 'service.asset_management',
    name: 'Asset Management',
    module: 'Service',
    description: 'Managing the equipment registry that work orders are raised against.',
    resources: [
      { resource: 'Asset',          verbs: ['view', 'create', 'update', 'archive', 'delete'] },
      { resource: 'Asset template', verbs: ['view', 'create', 'update', 'archive', 'delete'] },
    ],
  },
  {
    key: 'service.service_reporting',
    name: 'Service Reporting',
    module: 'Service',
    description: 'Analytical visibility across service activity.',
    resources: [
      { resource: 'Service reports', verbs: ['view', 'schedule', 'export', 'print'] },
    ],
  },

  // ── SCHEDULE ───────────────────────────────────────────────────────────────

  {
    key: 'schedule.schedule_access',
    name: 'Schedule Access',
    module: 'Schedule',
    description: 'An employee\'s view of their own schedule, time, and availability.',
    resources: [
      { resource: 'Schedule',          verbs: ['view'] },
      { resource: 'Shift',             verbs: ['view'] },
      { resource: 'Employee profile',  verbs: ['view', 'update'] },
      { resource: 'Time entry',        verbs: ['view'] },
      { resource: 'Time clock',        verbs: ['execute'] },
    ],
  },
  {
    key: 'schedule.schedule_management',
    name: 'Schedule Management',
    module: 'Schedule',
    description: 'Building, publishing, and managing labor schedules.',
    resources: [
      { resource: 'Schedule',         verbs: ['view', 'create', 'update', 'publish', 'archive', 'delete'] },
      { resource: 'Shift',            verbs: ['view', 'create', 'update', 'delete'] },
      { resource: 'Employee profile', verbs: ['view', 'create', 'update', 'archive', 'delete'] },
    ],
  },
  {
    key: 'schedule.time_and_attendance',
    name: 'Time and Attendance',
    module: 'Schedule',
    description: 'Managing time clock entries and timesheets.',
    resources: [
      { resource: 'Time entry', verbs: ['view', 'create', 'update', 'delete'] },
      { resource: 'Time clock', verbs: ['execute'] },
    ],
  },
  {
    key: 'schedule.communication',
    name: 'Communication',
    module: 'Schedule',
    description: 'Sending announcements and messages to staff.',
    resources: [
      { resource: 'Announcement', verbs: ['view', 'create', 'update', 'publish', 'delete'] },
      { resource: 'Message',      verbs: ['view', 'create', 'update'] },
    ],
  },
  {
    key: 'schedule.schedule_reporting',
    name: 'Schedule Reporting',
    module: 'Schedule',
    description: 'Analytical visibility across scheduling and labor activity.',
    resources: [
      { resource: 'Schedule reports', verbs: ['view', 'schedule', 'export', 'print'] },
    ],
  },

  // ── MONITOR ────────────────────────────────────────────────────────────────

  {
    key: 'monitor.monitoring_operations',
    name: 'Monitoring Operations',
    module: 'Monitor',
    description: 'Responding to alarms and incidents in real time.',
    resources: [
      { resource: 'Asset',        verbs: ['view'] },
      { resource: 'Alarm',        verbs: ['view', 'acknowledge', 'resolve'] },
      { resource: 'Incident',     verbs: ['view', 'create', 'update', 'assign', 'resolve'] },
      { resource: 'Zone',         verbs: ['view'] },
      { resource: 'Subscription', verbs: ['view', 'create', 'update', 'delete'] },
    ],
  },
  {
    key: 'monitor.asset_configuration',
    name: 'Asset Configuration',
    module: 'Monitor',
    description: 'Setting up and maintaining monitored assets and zones.',
    resources: [
      { resource: 'Asset',          verbs: ['view', 'create', 'update', 'configure', 'archive', 'delete'] },
      { resource: 'Asset template', verbs: ['view', 'create', 'update', 'archive', 'delete'] },
      { resource: 'Zone',           verbs: ['view', 'create', 'update', 'delete'] },
      { resource: 'Alarm',          verbs: ['view', 'configure'] },
    ],
  },
  {
    key: 'monitor.checklist_operations',
    name: 'Checklist Operations',
    module: 'Monitor',
    description: 'Executing physical checks on monitored equipment.',
    resources: [
      { resource: 'Monitor checklist instance',         verbs: ['view', 'create', 'update', 'submit'] },
      { resource: 'Monitor checklist instance history', verbs: ['view', 'export'] },
    ],
  },
  {
    key: 'monitor.checklist_management',
    name: 'Checklist Management',
    module: 'Monitor',
    description: 'Creating and maintaining monitor checklist templates.',
    resources: [
      { resource: 'Monitor checklist template',         verbs: ['view', 'create', 'update', 'archive', 'delete'] },
      { resource: 'Monitor checklist instance',         verbs: ['view', 'create', 'update', 'submit', 'archive', 'delete'] },
      { resource: 'Monitor checklist instance history', verbs: ['view', 'export'] },
    ],
  },
  {
    key: 'monitor.voyage_operations',
    name: 'Voyage Operations',
    module: 'Monitor',
    description: 'Tracking moving assets and managing in-transit conditions.',
    resources: [
      { resource: 'Shipment',      verbs: ['view', 'create', 'update', 'archive', 'delete'] },
      { resource: 'Route',         verbs: ['view', 'create', 'update', 'delete'] },
      { resource: 'Voyage sensor', verbs: ['view', 'create', 'update', 'configure', 'delete'] },
    ],
  },
  {
    key: 'monitor.gateway_management',
    name: 'Gateway Management',
    module: 'Monitor',
    description: 'Managing the infrastructure that connects sensors to the platform.',
    resources: [
      { resource: 'Gateway', verbs: ['view', 'create', 'update', 'configure', 'delete'] },
    ],
  },
  {
    key: 'monitor.monitor_reporting',
    name: 'Monitor Reporting',
    module: 'Monitor',
    description: 'Analytical visibility across monitoring activity.',
    resources: [
      { resource: 'Monitor reports', verbs: ['view', 'schedule', 'export', 'print'] },
      { resource: 'Subscription',    verbs: ['view', 'create', 'update', 'delete'] },
    ],
  },

  // ── ADMIN ──────────────────────────────────────────────────────────────────

  {
    key: 'admin.user_management',
    name: 'User Management',
    module: 'Admin',
    description: 'Managing users and their access.',
    resources: [
      { resource: 'User',        verbs: ['view', 'create', 'invite', 'update', 'assign', 'deactivate', 'archive'] },
      { resource: 'User (bulk)', verbs: ['import'] },
    ],
  },
  {
    key: 'admin.user_view',
    name: 'User View',
    module: 'Admin',
    description: 'Read-only visibility into users.',
    resources: [
      { resource: 'User', verbs: ['view'] },
    ],
  },
  {
    key: 'admin.role_management',
    name: 'Role Management',
    module: 'Admin',
    description: 'Managing roles and permission structures.',
    resources: [
      { resource: 'Role', verbs: ['view', 'create', 'update', 'archive', 'delete'] },
    ],
  },
  {
    key: 'admin.role_view',
    name: 'Role View',
    module: 'Admin',
    description: 'Read-only visibility into roles.',
    resources: [
      { resource: 'Role', verbs: ['view'] },
    ],
  },
  {
    key: 'admin.org_management',
    name: 'Org Management',
    module: 'Admin',
    description: 'Managing the organizational hierarchy and structure.',
    resources: [
      { resource: 'Org unit',      verbs: ['view', 'create', 'update', 'archive', 'delete'] },
      { resource: 'Org hierarchy', verbs: ['view', 'create', 'update', 'delete', 'import'] },
    ],
  },
  {
    key: 'admin.org_view',
    name: 'Org View',
    module: 'Admin',
    description: 'Read-only visibility into org structure.',
    resources: [
      { resource: 'Org unit',      verbs: ['view'] },
      { resource: 'Org hierarchy', verbs: ['view'] },
    ],
  },
  {
    key: 'admin.platform_settings',
    name: 'Platform Settings',
    module: 'Admin',
    description: 'Configuring platform-wide operational settings — flags, tags, and notifications.',
    resources: [
      { resource: 'Flag',                     verbs: ['view', 'create', 'update', 'delete'] },
      { resource: 'Tag',                      verbs: ['view', 'create', 'update', 'delete'] },
      { resource: 'Notification configuration', verbs: ['view', 'create', 'update', 'delete'] },
    ],
  },
  {
    key: 'admin.device_management',
    name: 'Device Management',
    module: 'Admin',
    description: 'Managing physical devices registered to the platform.',
    resources: [
      { resource: 'Device', verbs: ['view', 'configure', 'deactivate', 'delete'] },
    ],
  },
  {
    key: 'admin.integration_management',
    name: 'Integration Management',
    module: 'Admin',
    description: 'Managing SSO, SCIM, and external integration connections.',
    resources: [
      { resource: 'SSO/SCIM integration', verbs: ['view', 'enable', 'configure', 'disable', 'delete'] },
    ],
  },
  {
    key: 'admin.content_publishing',
    name: 'Content Publishing',
    module: 'Admin',
    description: 'Managing content packages published to subscribers.',
    resources: [
      { resource: 'Content package', verbs: ['view', 'create', 'update', 'publish', 'archive', 'delete'] },
    ],
  },
  {
    key: 'admin.content_subscribing',
    name: 'Content Subscribing',
    module: 'Admin',
    description: 'Managing subscriptions to external content sources.',
    resources: [
      { resource: 'Content subscription', verbs: ['view', 'create', 'update', 'deactivate', 'delete'] },
    ],
  },
];

// ── Lookup helper ─────────────────────────────────────────────────────────────

export function getPermissionSet(key: string): PermissionSet | undefined {
  return PERMISSION_SETS.find((ps) => ps.key === key);
}

export function getPermissionSetsByModule(module: string): PermissionSet[] {
  return PERMISSION_SETS.filter((ps) => ps.module === module);
}
