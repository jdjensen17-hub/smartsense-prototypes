// ── roles.ts ──────────────────────────────────────────────────────────────────
// Role definitions. Each role references named permission sets from
// permissionSets.ts rather than a flat access level per module.

export type RoleKey =
  | 'viewer'
  | 'operator'
  | 'supervisor'
  | 'manager'
  | 'auditor'
  | 'device_admin'
  | 'iam_admin'
  | 'integrations_admin'
  | 'system_admin'
  | 'kitchen_manager';

export type RoleType = 'System' | 'Custom';

export type AccessLevel = 'full' | 'partial' | 'view_only' | 'no_access' | 'not_purchased';

export type ModuleAccess = {
  module: string;
  access: AccessLevel;
};

// Tier grouping for the role picker UI
export type RoleTier = 'viewer' | 'operator' | 'supervisor' | 'manager' | 'specialist' | 'system_admin';

export type RoleDef = {
  key: RoleKey;
  name: string;
  type: RoleType;
  tier: RoleTier;
  active: boolean;
  // For custom roles: which system role it was cloned from
  clonedFrom?: string;
  description: string;
  summary: string;
  // Shown only on system roles — e.g. "Includes all Supervisor permissions"
  tierNote?: string;
  keyCapabilities: string[];
  restrictions: string[];
  // Flat per-module access level — drives the module access badges in role picker
  moduleAccess: ModuleAccess[];
  // Named permission sets this role holds — keys into PERMISSION_SETS in permissionSets.ts
  permissionSetKeys: string[];
};

export const ROLE_DEFS: RoleDef[] = [

  // ── TIERED ROLES ────────────────────────────────────────────────────────────

  {
    key: 'viewer',
    name: 'Viewer',
    type: 'System',
    tier: 'viewer',
    active: false,
    description: 'Read-only access to operational records and reports across all modules.',
    summary:
      'Read-only access across the system. Can view and export records, reports, and documentation, but cannot create, edit, or take action on anything.',
    tierNote: 'Baseline read-only access — all operational roles include Viewer permissions.',
    keyCapabilities: [
      'View operational records across all modules',
      'View and export reports',
      'View schedules, assets, and documentation',
    ],
    restrictions: [
      'Cannot create or edit records',
      'Cannot submit, approve, or resolve workflow items',
      'Cannot configure the system',
      'No Admin access',
    ],
    moduleAccess: [
      { module: 'Operate',  access: 'view_only' },
      { module: 'Assure',   access: 'view_only' },
      { module: 'Guard',    access: 'view_only' },
      { module: 'Label',    access: 'view_only' },
      { module: 'Service',  access: 'view_only' },
      { module: 'Schedule', access: 'view_only' },
      { module: 'Monitor',  access: 'view_only' },
      { module: 'Admin',    access: 'no_access' },
    ],
    permissionSetKeys: [
      'operate.list_execution',
      'operate.list_reporting',
      'assure.audit_execution',
      'assure.audit_reporting',
      'guard.food_safety_execution',
      'guard.guard_reporting',
      'label.label_printing',
      'label.label_reporting',
      'service.work_order_participation',
      'service.service_reporting',
      'schedule.schedule_access',
      'schedule.schedule_reporting',
      'monitor.monitoring_operations',
      'monitor.monitor_reporting',
    ],
  },

  {
    key: 'operator',
    name: 'Operator',
    type: 'System',
    tier: 'operator',
    active: true,
    description: 'Performs day-to-day work across all modules. Can act, not configure or report.',
    summary:
      'Frontline role responsible for executing daily operational work. Can create and update records, submit work, resolve alerts, and clock in and out.',
    tierNote: 'Includes all Viewer permissions.',
    keyCapabilities: [
      'Execute lists, audits, and food safety processes',
      'Submit work orders and monitor incidents',
      'Print labels and log time',
      'Clock in and out',
    ],
    restrictions: [
      'Cannot view or export reports',
      'Cannot configure templates, schedules, or alert rules',
      'No Admin access',
    ],
    moduleAccess: [
      { module: 'Operate',  access: 'partial' },
      { module: 'Assure',   access: 'partial' },
      { module: 'Guard',    access: 'partial' },
      { module: 'Label',    access: 'partial' },
      { module: 'Service',  access: 'partial' },
      { module: 'Schedule', access: 'partial' },
      { module: 'Monitor',  access: 'partial' },
      { module: 'Admin',    access: 'no_access' },
    ],
    permissionSetKeys: [
      'operate.list_execution',
      'assure.audit_execution',
      'guard.food_safety_execution',
      'label.label_printing',
      'service.work_order_participation',
      'schedule.schedule_access',
      'monitor.monitoring_operations',
    ],
  },

  {
    key: 'supervisor',
    name: 'Supervisor',
    type: 'System',
    tier: 'supervisor',
    active: true,
    description: 'Executes work and monitors outcomes. Has operational visibility but does not configure the system.',
    summary:
      'Operational lead who can perform all frontline work and track outcomes through reports. Can view activity across modules without managing templates, schedules, or configuration.',
    tierNote: 'Includes all Operator permissions.',
    keyCapabilities: [
      'All Operator capabilities',
      'View and export reports across all modules',
      'Monitor operational performance and compliance',
    ],
    restrictions: [
      'Cannot manage templates, schedules, or alert configuration',
      'Cannot manage assets, devices, or integrations',
      'No Admin access',
    ],
    moduleAccess: [
      { module: 'Operate',  access: 'partial' },
      { module: 'Assure',   access: 'partial' },
      { module: 'Guard',    access: 'partial' },
      { module: 'Label',    access: 'partial' },
      { module: 'Service',  access: 'partial' },
      { module: 'Schedule', access: 'partial' },
      { module: 'Monitor',  access: 'partial' },
      { module: 'Admin',    access: 'no_access' },
    ],
    permissionSetKeys: [
      'operate.list_execution',
      'operate.list_reporting',
      'assure.audit_execution',
      'assure.audit_reporting',
      'guard.food_safety_execution',
      'guard.guard_reporting',
      'label.label_printing',
      'label.label_reporting',
      'service.work_order_participation',
      'service.service_reporting',
      'schedule.schedule_access',
      'schedule.schedule_reporting',
      'monitor.monitoring_operations',
      'monitor.monitor_reporting',
    ],
  },

  {
    key: 'manager',
    name: 'Manager',
    type: 'System',
    tier: 'manager',
    active: true,
    description: 'Configures how operations are structured and monitors outcomes across all modules.',
    summary:
      'Operational manager responsible for templates, schedules, asset configuration, and reporting. Can execute work, manage configuration, and oversee platform settings.',
    tierNote: 'Includes all Supervisor permissions.',
    keyCapabilities: [
      'All Supervisor capabilities',
      'Manage templates, schedules, and configuration across all modules',
      'Manage assets, devices, and work order workflows',
      'Configure platform-wide settings (flags, tags, notifications)',
    ],
    restrictions: [
      'Cannot manage users or roles (IAM Admin)',
      'Cannot manage SSO/SCIM integrations (Integrations Admin)',
      'Cannot publish content packages (System Admin)',
    ],
    moduleAccess: [
      { module: 'Operate',  access: 'full' },
      { module: 'Assure',   access: 'full' },
      { module: 'Guard',    access: 'full' },
      { module: 'Label',    access: 'full' },
      { module: 'Service',  access: 'full' },
      { module: 'Schedule', access: 'full' },
      { module: 'Monitor',  access: 'full' },
      { module: 'Admin',    access: 'partial' },
    ],
    permissionSetKeys: [
      'operate.list_execution',
      'operate.list_management',
      'operate.information_library',
      'operate.list_reporting',
      'assure.audit_execution',
      'assure.audit_management',
      'assure.inspection_site_management',
      'assure.audit_reporting',
      'guard.food_safety_execution',
      'guard.food_safety_management',
      'guard.guard_reporting',
      'label.label_printing',
      'label.label_management',
      'label.label_device_management',
      'label.label_reporting',
      'service.work_order_participation',
      'service.work_order_execution',
      'service.work_order_management',
      'service.asset_management',
      'service.service_reporting',
      'schedule.schedule_access',
      'schedule.schedule_management',
      'schedule.time_and_attendance',
      'schedule.communication',
      'schedule.schedule_reporting',
      'monitor.monitoring_operations',
      'monitor.asset_configuration',
      'monitor.checklist_operations',
      'monitor.checklist_management',
      'monitor.voyage_operations',
      'monitor.gateway_management',
      'monitor.monitor_reporting',
      'admin.platform_settings',
    ],
  },

  // ── SPECIALIST ROLES ────────────────────────────────────────────────────────

  {
    key: 'auditor',
    name: 'Auditor',
    type: 'System',
    tier: 'specialist',
    active: false,
    description: 'Compliance visibility across all operational modules and org structure. No operational changes.',
    summary:
      'Compliance and oversight role. Can view operational records and export reports across all modules, and has read-only visibility into users, roles, and org structure.',
    keyCapabilities: [
      'View operational records across all modules',
      'Export reports and compliance evidence',
      'View users, roles, and org structure',
    ],
    restrictions: [
      'Cannot create, edit, submit, or resolve items',
      'Cannot configure anything',
      'Cannot manage users, roles, or org structure',
    ],
    moduleAccess: [
      { module: 'Operate',  access: 'view_only' },
      { module: 'Assure',   access: 'view_only' },
      { module: 'Guard',    access: 'view_only' },
      { module: 'Label',    access: 'view_only' },
      { module: 'Service',  access: 'view_only' },
      { module: 'Schedule', access: 'view_only' },
      { module: 'Monitor',  access: 'view_only' },
      { module: 'Admin',    access: 'view_only' },
    ],
    permissionSetKeys: [
      'operate.list_execution',
      'operate.list_reporting',
      'assure.audit_execution',
      'assure.audit_reporting',
      'guard.food_safety_execution',
      'guard.guard_reporting',
      'label.label_printing',
      'label.label_reporting',
      'service.work_order_participation',
      'service.service_reporting',
      'schedule.schedule_access',
      'schedule.schedule_reporting',
      'monitor.monitoring_operations',
      'monitor.monitor_reporting',
      'admin.user_view',
      'admin.role_view',
      'admin.org_view',
    ],
  },

  {
    key: 'device_admin',
    name: 'Device Admin',
    type: 'System',
    tier: 'specialist',
    active: true,
    description: 'Manages physical devices, monitored assets, gateways, and sensor infrastructure.',
    summary:
      'Administrator responsible for devices and sensor infrastructure. Can configure monitored assets, manage gateways, and register and manage physical devices.',
    keyCapabilities: [
      'Configure and manage monitored assets and zones',
      'Manage gateways and sensor infrastructure',
      'Register, configure, and deactivate physical devices',
    ],
    restrictions: [
      'Cannot manage users or roles',
      'Cannot manage SSO/SCIM integrations',
      'Cannot access operational modules',
    ],
    moduleAccess: [
      { module: 'Operate',  access: 'no_access' },
      { module: 'Assure',   access: 'no_access' },
      { module: 'Guard',    access: 'no_access' },
      { module: 'Label',    access: 'no_access' },
      { module: 'Service',  access: 'no_access' },
      { module: 'Schedule', access: 'no_access' },
      { module: 'Monitor',  access: 'partial' },
      { module: 'Admin',    access: 'partial' },
    ],
    permissionSetKeys: [
      'monitor.asset_configuration',
      'monitor.gateway_management',
      'monitor.monitor_reporting',
      'admin.device_management',
    ],
  },

  {
    key: 'iam_admin',
    name: 'IAM Admin',
    type: 'System',
    tier: 'specialist',
    active: false,
    description: 'Manages users, roles, and organizational structure.',
    summary:
      'Identity and access administrator. Controls who has access and what they can do — manages users, roles, permissions, and the org hierarchy.',
    keyCapabilities: [
      'Manage users and role assignments',
      'Create and manage roles',
      'Manage org units and hierarchy',
    ],
    restrictions: [
      'Does not configure devices or monitoring',
      'Does not manage SSO/SCIM integrations',
      'No access to operational modules',
    ],
    moduleAccess: [
      { module: 'Operate',  access: 'no_access' },
      { module: 'Assure',   access: 'no_access' },
      { module: 'Guard',    access: 'no_access' },
      { module: 'Label',    access: 'no_access' },
      { module: 'Service',  access: 'no_access' },
      { module: 'Schedule', access: 'no_access' },
      { module: 'Monitor',  access: 'no_access' },
      { module: 'Admin',    access: 'full' },
    ],
    permissionSetKeys: [
      'admin.user_management',
      'admin.role_management',
      'admin.org_management',
    ],
  },

  {
    key: 'integrations_admin',
    name: 'Integrations Admin',
    type: 'System',
    tier: 'specialist',
    active: false,
    description: 'Manages SSO, SCIM, and external integration connections.',
    summary:
      'Administrator responsible for external integrations. Can configure SSO connections, manage SCIM provisioning, and maintain integration settings.',
    keyCapabilities: [
      'Configure SSO connections',
      'Manage SCIM provisioning',
      'Enable, disable, and delete integrations',
    ],
    restrictions: [
      'Cannot manage users or roles (IAM Admin)',
      'Cannot configure devices or monitoring',
      'No access to operational modules',
    ],
    moduleAccess: [
      { module: 'Operate',  access: 'no_access' },
      { module: 'Assure',   access: 'no_access' },
      { module: 'Guard',    access: 'no_access' },
      { module: 'Label',    access: 'no_access' },
      { module: 'Service',  access: 'no_access' },
      { module: 'Schedule', access: 'no_access' },
      { module: 'Monitor',  access: 'no_access' },
      { module: 'Admin',    access: 'partial' },
    ],
    permissionSetKeys: [
      'admin.integration_management',
    ],
  },

  {
    key: 'system_admin',
    name: 'System Admin',
    type: 'System',
    tier: 'system_admin',
    active: true,
    description: 'Full administrative access across the entire platform.',
    summary:
      'Full platform administrator. Can manage users, roles, integrations, devices, templates, content, and all operational configuration across every module.',
    tierNote: 'Includes all Manager permissions, plus full administrative access.',
    keyCapabilities: ['Full access across all modules and administrative functions'],
    restrictions: [
      'Use sparingly — intended for platform owners and top-level admins',
    ],
    moduleAccess: [
      { module: 'Operate',  access: 'full' },
      { module: 'Assure',   access: 'full' },
      { module: 'Guard',    access: 'full' },
      { module: 'Label',    access: 'full' },
      { module: 'Service',  access: 'full' },
      { module: 'Schedule', access: 'full' },
      { module: 'Monitor',  access: 'full' },
      { module: 'Admin',    access: 'full' },
    ],
    permissionSetKeys: [
      'operate.list_execution',
      'operate.list_management',
      'operate.information_library',
      'operate.list_reporting',
      'assure.audit_execution',
      'assure.audit_management',
      'assure.inspection_site_management',
      'assure.audit_reporting',
      'guard.food_safety_execution',
      'guard.food_safety_management',
      'guard.guard_reporting',
      'label.label_printing',
      'label.label_management',
      'label.label_device_management',
      'label.label_reporting',
      'service.work_order_participation',
      'service.work_order_execution',
      'service.work_order_management',
      'service.asset_management',
      'service.service_reporting',
      'schedule.schedule_access',
      'schedule.schedule_management',
      'schedule.time_and_attendance',
      'schedule.communication',
      'schedule.schedule_reporting',
      'monitor.monitoring_operations',
      'monitor.asset_configuration',
      'monitor.checklist_operations',
      'monitor.checklist_management',
      'monitor.voyage_operations',
      'monitor.gateway_management',
      'monitor.monitor_reporting',
      'admin.user_management',
      'admin.role_management',
      'admin.org_management',
      'admin.platform_settings',
      'admin.device_management',
      'admin.integration_management',
      'admin.content_publishing',
      'admin.content_subscribing',
    ],
  },

  // ── CUSTOM ROLES ─────────────────────────────────────────────────────────────

  {
    key: 'kitchen_manager',
    name: 'Kitchen Manager',
    type: 'Custom',
    tier: 'manager',
    active: true,
    clonedFrom: 'Manager',
    description: 'Custom role for kitchen staff management and food safety oversight.',
    summary:
      'Custom role cloned from Manager, tailored for kitchen operations. Can manage food safety processes, temperature logs, and kitchen staff schedules.',
    keyCapabilities: [
      'Manage food safety processes and temperature records',
      'Execute and manage lists and audits',
      'Manage kitchen staff schedules',
      'Access operational reports',
    ],
    restrictions: [
      'Cannot manage users or roles',
      'No access to Service, Label, or Monitor modules',
      'Cannot configure system-wide settings',
    ],
    moduleAccess: [
      { module: 'Operate',  access: 'full' },
      { module: 'Assure',   access: 'partial' },
      { module: 'Guard',    access: 'full' },
      { module: 'Label',    access: 'no_access' },
      { module: 'Service',  access: 'no_access' },
      { module: 'Schedule', access: 'partial' },
      { module: 'Monitor',  access: 'no_access' },
      { module: 'Admin',    access: 'no_access' },
    ],
    permissionSetKeys: [
      'operate.list_execution',
      'operate.list_management',
      'operate.information_library',
      'operate.list_reporting',
      'assure.audit_execution',
      'assure.audit_reporting',
      'guard.food_safety_execution',
      'guard.food_safety_management',
      'guard.guard_reporting',
      'schedule.schedule_access',
      'schedule.schedule_management',
      'schedule.schedule_reporting',
    ],
  },
];
